import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL,
    },
  },
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  deviceInfo: z.string().optional(),
  rememberMe: z.boolean().optional().default(false),
});

/**
 * User authentication endpoint
 * Handles secure login with JWT token generation
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed',
    });
  }

  try {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
    }

    const { email, password, deviceInfo, rememberMe } = validationResult.data;

    // Get client IP and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    await prisma.$connect();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        notifications: true,
      },
    });

    if (!user) {
      // Log failed login attempt
      await prisma.systemLog.create({
        data: {
          level: 'warn',
          message: `Failed login attempt for non-existent email: ${email}`,
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
          userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
          securityEventType: 'failed_login',
          metadata: { email, reason: 'user_not_found' },
        },
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Check if account is locked
    if (user.accountLocked) {
      await prisma.systemLog.create({
        data: {
          level: 'warn',
          message: `Login attempt on locked account: ${email}`,
          userId: user.id,
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
          userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
          securityEventType: 'locked_account_access',
          metadata: { email },
        },
      });

      return res.status(423).json({
        error: 'Account locked',
        message: 'Your account has been locked. Please contact support.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account inactive',
        message: 'Your account is not active. Please contact support.',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed login attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
      });

      // Lock account if too many failed attempts
      if (updatedUser.failedLoginAttempts >= 5) {
        await prisma.user.update({
          where: { id: user.id },
          data: { accountLocked: true },
        });
      }

      await prisma.systemLog.create({
        data: {
          level: 'warn',
          message: `Failed login attempt: incorrect password for ${email}`,
          userId: user.id,
          ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
          userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
          securityEventType: 'failed_login',
          metadata: {
            email,
            reason: 'invalid_password',
            failedAttempts: updatedUser.failedLoginAttempts,
          },
        },
      });

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const tokenExpiry = rememberMe ? '30d' : '24h';

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionType: rememberMe ? 'persistent' : 'session',
      },
      jwtSecret,
      { expiresIn: tokenExpiry }
    );

    // Create user session
    const sessionExpiry = new Date();
    sessionExpiry.setTime(
      sessionExpiry.getTime() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)
    );

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: token,
        deviceInfo: deviceInfo || 'Unknown Device',
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
        expiresAt: sessionExpiry,
      },
    });

    // Reset failed login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    });

    // Log successful login
    await prisma.systemLog.create({
      data: {
        level: 'info',
        message: `Successful login for user: ${email}`,
        userId: user.id,
        sessionId: session.id,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
        securityEventType: 'successful_login',
        metadata: {
          email,
          deviceInfo,
          rememberMe,
        },
      },
    });

    await prisma.$disconnect();

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        timezone: user.timezone,
        language: user.language,
        notifications: user.notifications,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database:', disconnectError);
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An error occurred during login',
    });
  }
}
