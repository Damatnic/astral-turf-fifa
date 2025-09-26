/**
 * Vercel Authentication API Endpoint
 *
 * Handles authentication requests for the Astral Turf application
 * with comprehensive security and logging.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, email, password, ...otherData } = req.body;

    switch (action) {
      case 'login':
        return await handleLogin(req, res, { email, password });

      case 'register':
        return await handleRegister(req, res, { email, password, ...otherData });

      case 'verify':
        return await handleVerify(req, res);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth API error:', error);

    // Log security event
    await logSecurityEvent('AUTH_ERROR', error.message, {
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.url,
      duration: Date.now() - startTime,
    });

    res.status(500).json({
      error: 'Internal server error',
      requestId: generateRequestId(),
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function handleLogin(req, res, { email, password }) {
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Input validation
    if (!email || !password) {
      await logSecurityEvent('LOGIN_FAILURE', 'Missing email or password', {
        ipAddress,
        userAgent,
      });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
        isActive: true,
      },
      include: {
        notifications: true,
      },
    });

    if (!user) {
      await logSecurityEvent('LOGIN_FAILURE', 'User not found', {
        email: email.toLowerCase().trim(),
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.accountLocked) {
      await logSecurityEvent('LOGIN_FAILURE', 'Account locked', {
        userId: user.id,
        ipAddress,
        userAgent,
      });
      return res.status(423).json({ error: 'Account is locked' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });

      await logSecurityEvent('LOGIN_FAILURE', 'Invalid password', {
        userId: user.id,
        ipAddress,
        userAgent,
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const sessionId = generateSessionId();
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: sessionId,
        deviceInfo: userAgent || 'Unknown Device',
        ipAddress: ipAddress || 'Unknown IP',
        userAgent: userAgent || 'Unknown Browser',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: sessionId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logSecurityEvent('LOGIN_SUCCESS', 'User login successful', {
      userId: user.id,
      sessionId,
      ipAddress,
      userAgent,
    });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
      token,
      sessionId,
    });
  } catch (error) {
    console.error('Login error:', error);
    await logSecurityEvent('LOGIN_ERROR', error.message, { ipAddress, userAgent });
    res.status(500).json({ error: 'Login failed' });
  }
}

async function handleRegister(req, res, { email, password, firstName, lastName, role = 'PLAYER' }) {
  const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // Input validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      await logSecurityEvent('REGISTRATION_FAILURE', 'Email already exists', {
        email: email.toLowerCase().trim(),
        ipAddress,
        userAgent,
      });
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        role,
        isActive: true,
        lastPasswordChangeAt: new Date(),
        notifications: {
          create: {
            email: true,
            sms: false,
            push: true,
            matchUpdates: true,
            trainingReminders: true,
            emergencyAlerts: true,
            paymentReminders: role === 'FAMILY',
          },
        },
      },
      include: {
        notifications: true,
      },
    });

    await logSecurityEvent('REGISTRATION_SUCCESS', 'New user registered', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ipAddress,
      userAgent,
    });

    // Auto-login after registration
    return await handleLogin(req, res, { email, password });
  } catch (error) {
    console.error('Registration error:', error);
    await logSecurityEvent('REGISTRATION_ERROR', error.message, { ipAddress, userAgent });
    res.status(500).json({ error: 'Registration failed' });
  }
}

async function handleVerify(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify session is still active
    const session = await prisma.userSession.findUnique({
      where: {
        sessionToken: decoded.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            notifications: true,
          },
        },
      },
    });

    if (!session || !session.user.isActive) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    res.status(200).json({
      valid: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        lastLoginAt: session.user.lastLoginAt,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
}

async function logSecurityEvent(eventType, message, context = {}) {
  try {
    await prisma.systemLog.create({
      data: {
        level: eventType.includes('SUCCESS') ? 'info' : 'warn',
        message,
        service: 'auth-api',
        userId: context.userId || null,
        sessionId: context.sessionId || null,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        securityEventType: eventType,
        metadata: {
          ...context,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}
