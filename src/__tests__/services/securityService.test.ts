import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { securityService } from '../../services/securityService';

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2),
    subtle: {
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      generateKey: vi.fn(),
      exportKey: vi.fn(),
      importKey: vi.fn(),
    }
  },
  writable: true,
});

describe('SecurityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate safe strings', () => {
      const safeInputs = [
        'valid@example.com',
        'John Doe',
        'Safe string with spaces',
        '12345',
        'user-name_123'
      ];

      safeInputs.forEach(input => {
        expect(securityService.validateInput(input)).toBe(true);
      });
    });

    it('should reject malicious scripts', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(1)</script>',
        '\'; DROP TABLE users; --',
        'UNION SELECT * FROM passwords',
        '../../../etc/passwd',
        '${7*7}',
        '{{constructor.constructor("alert(1)")()}}'
      ];

      maliciousInputs.forEach(input => {
        expect(securityService.validateInput(input)).toBe(false);
      });
    });

    it('should sanitize HTML input', () => {
      const dirtyHTML = '<script>alert("xss")</script><p>Clean content</p><img src="x" onerror="alert(1)">';
      const cleanHTML = securityService.sanitizeHTML(dirtyHTML);
      
      expect(cleanHTML).not.toContain('<script>');
      expect(cleanHTML).not.toContain('onerror');
      expect(cleanHTML).toContain('<p>Clean content</p>');
    });

    it('should validate email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user space@domain.com',
        'user@domain',
        '<script>@domain.com'
      ];

      validEmails.forEach(email => {
        expect(securityService.validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(securityService.validateEmail(email)).toBe(false);
      });
    });

    it('should validate URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://sub.domain.com/path?query=1',
        'ftp://files.example.com'
      ];

      const invalidUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file:///etc/passwd',
        'vbscript:msgbox(1)',
        'not-a-url',
        'http://',
        'https://.com'
      ];

      validUrls.forEach(url => {
        expect(securityService.validateURL(url)).toBe(true);
      });

      invalidUrls.forEach(url => {
        expect(securityService.validateURL(url)).toBe(false);
      });
    });
  });

  describe('Password Security', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure#Password456',
        'Complex_Pass789$',
        'Adm1n!@#SuperSecure'
      ];

      strongPasswords.forEach(password => {
        const result = securityService.validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(4);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '12345',
        'password',
        'qwerty',
        'abc123',
        'Password',
        '12345678',
        'aaaaaaa'
      ];

      weakPasswords.forEach(password => {
        const result = securityService.validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.score).toBeLessThan(4);
      });
    });

    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hash = await securityService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should verify password hashes', async () => {
      const password = 'TestPassword123!';
      const hash = await securityService.hashPassword(password);
      
      const isValid = await securityService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
      
      const isInvalid = await securityService.verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should generate secure random passwords', () => {
      const password1 = securityService.generateSecurePassword(16);
      const password2 = securityService.generateSecurePassword(16);
      
      expect(password1).toBeDefined();
      expect(password1.length).toBe(16);
      expect(password1).not.toBe(password2); // Should be random
      
      const validationResult = securityService.validatePassword(password1);
      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('Token Security', () => {
    it('should generate secure random tokens', () => {
      const token1 = securityService.generateSecureToken(32);
      const token2 = securityService.generateSecureToken(32);
      
      expect(token1).toBeDefined();
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate JWT tokens', () => {
      const payload = { userId: '123', role: 'user' };
      const token = securityService.generateJWT(payload, '1h');
      
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('should verify JWT tokens', () => {
      const payload = { userId: '123', role: 'user' };
      const token = securityService.generateJWT(payload, '1h');
      
      const decoded = securityService.verifyJWT(token);
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe('123');
      expect(decoded.role).toBe('user');
    });

    it('should reject expired JWT tokens', () => {
      const payload = { userId: '123', role: 'user' };
      const token = securityService.generateJWT(payload, '-1h'); // Expired
      
      expect(() => securityService.verifyJWT(token)).toThrow('Token expired');
    });

    it('should reject invalid JWT tokens', () => {
      const invalidTokens = [
        'invalid.token.format',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        'not-a-jwt-token',
        ''
      ];

      invalidTokens.forEach(token => {
        expect(() => securityService.verifyJWT(token)).toThrow();
      });
    });
  });

  describe('Data Encryption', () => {
    it('should encrypt and decrypt data', async () => {
      const originalData = 'Sensitive information';
      const encrypted = await securityService.encryptData(originalData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalData);
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.data).toBeDefined();
      
      const decrypted = await securityService.decryptData(encrypted);
      expect(decrypted).toBe(originalData);
    });

    it('should handle encryption of different data types', async () => {
      const testData = [
        'string data',
        { object: 'data', number: 123 },
        [1, 2, 3, 'array'],
        123456
      ];

      for (const data of testData) {
        const encrypted = await securityService.encryptData(data);
        const decrypted = await securityService.decryptData(encrypted);
        expect(decrypted).toEqual(data);
      }
    });

    it('should fail to decrypt with wrong key', async () => {
      const originalData = 'Secret message';
      const encrypted = await securityService.encryptData(originalData);
      
      // Simulate wrong key by modifying the encrypted data
      const tamperedData = { ...encrypted, data: encrypted.data.slice(0, -1) + 'x' };
      
      await expect(securityService.decryptData(tamperedData))
        .rejects.toThrow('Decryption failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'user123';
      const limit = { requests: 10, window: 60000 }; // 10 requests per minute
      
      for (let i = 0; i < 10; i++) {
        const allowed = securityService.checkRateLimit(identifier, limit);
        expect(allowed).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const identifier = 'user456';
      const limit = { requests: 3, window: 60000 }; // 3 requests per minute
      
      // Make 3 allowed requests
      for (let i = 0; i < 3; i++) {
        expect(securityService.checkRateLimit(identifier, limit)).toBe(true);
      }
      
      // 4th request should be blocked
      expect(securityService.checkRateLimit(identifier, limit)).toBe(false);
    });

    it('should reset rate limit after window expires', () => {
      vi.useFakeTimers();
      
      const identifier = 'user789';
      const limit = { requests: 2, window: 1000 }; // 2 requests per second
      
      // Use up the limit
      expect(securityService.checkRateLimit(identifier, limit)).toBe(true);
      expect(securityService.checkRateLimit(identifier, limit)).toBe(true);
      expect(securityService.checkRateLimit(identifier, limit)).toBe(false);
      
      // Advance time past the window
      vi.advanceTimersByTime(1100);
      
      // Should be allowed again
      expect(securityService.checkRateLimit(identifier, limit)).toBe(true);
      
      vi.useRealTimers();
    });
  });

  describe('Security Headers', () => {
    it('should generate secure headers for responses', () => {
      const headers = securityService.getSecurityHeaders();
      
      expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
      expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
      expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
      expect(headers).toHaveProperty('Strict-Transport-Security');
      expect(headers).toHaveProperty('Content-Security-Policy');
      expect(headers).toHaveProperty('Referrer-Policy');
    });

    it('should generate CSP headers with nonce', () => {
      const nonce = 'test-nonce-123';
      const headers = securityService.getCSPHeaders(nonce);
      
      expect(headers['Content-Security-Policy']).toContain(`'nonce-${nonce}'`);
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });

    it('should validate CSP compliance', () => {
      const validCSP = "default-src 'self'; script-src 'self' 'unsafe-inline'";
      const invalidCSP = "default-src *; script-src 'unsafe-eval'";
      
      expect(securityService.validateCSP(validCSP)).toBe(true);
      expect(securityService.validateCSP(invalidCSP)).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should log security events', () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      securityService.logSecurityEvent('LOGIN_ATTEMPT', {
        userId: '123',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true
      });
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY'),
        expect.stringContaining('LOGIN_ATTEMPT'),
        expect.objectContaining({
          userId: '123',
          ip: '192.168.1.1'
        })
      );
      
      logSpy.mockRestore();
    });

    it('should log failed authentication attempts', () => {
      const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      securityService.logFailedAuth({
        email: 'user@example.com',
        ip: '192.168.1.1',
        attempts: 3
      });
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('FAILED_AUTH'),
        expect.objectContaining({
          email: 'user@example.com',
          attempts: 3
        })
      );
      
      logSpy.mockRestore();
    });

    it('should log suspicious activities', () => {
      const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      securityService.logSuspiciousActivity({
        type: 'SQL_INJECTION_ATTEMPT',
        ip: '192.168.1.100',
        payload: "'; DROP TABLE users; --",
        blocked: true
      });
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('SUSPICIOUS_ACTIVITY'),
        expect.objectContaining({
          type: 'SQL_INJECTION_ATTEMPT',
          blocked: true
        })
      );
      
      logSpy.mockRestore();
    });
  });

  describe('IP Address Security', () => {
    it('should validate IP addresses', () => {
      const validIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1',
        '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
      ];

      const invalidIPs = [
        '256.256.256.256',
        '192.168.1',
        'not-an-ip',
        '192.168.1.1.1',
        ''
      ];

      validIPs.forEach(ip => {
        expect(securityService.validateIP(ip)).toBe(true);
      });

      invalidIPs.forEach(ip => {
        expect(securityService.validateIP(ip)).toBe(false);
      });
    });

    it('should detect private IP ranges', () => {
      const privateIPs = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1'
      ];

      const publicIPs = [
        '8.8.8.8',
        '1.1.1.1',
        '208.67.222.222'
      ];

      privateIPs.forEach(ip => {
        expect(securityService.isPrivateIP(ip)).toBe(true);
      });

      publicIPs.forEach(ip => {
        expect(securityService.isPrivateIP(ip)).toBe(false);
      });
    });

    it('should check IP blacklist', () => {
      const blacklistedIPs = ['192.168.1.100', '10.0.0.50'];
      securityService.updateIPBlacklist(blacklistedIPs);
      
      expect(securityService.isIPBlacklisted('192.168.1.100')).toBe(true);
      expect(securityService.isIPBlacklisted('10.0.0.50')).toBe(true);
      expect(securityService.isIPBlacklisted('192.168.1.1')).toBe(false);
    });
  });

  describe('Session Security', () => {
    it('should generate secure session IDs', () => {
      const sessionId1 = securityService.generateSessionId();
      const sessionId2 = securityService.generateSessionId();
      
      expect(sessionId1).toBeDefined();
      expect(sessionId1.length).toBeGreaterThan(32);
      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^[a-zA-Z0-9+/=]+$/); // Base64 pattern
    });

    it('should validate session expiry', () => {
      const session = {
        id: 'test-session',
        createdAt: Date.now() - 7200000, // 2 hours ago
        expiresIn: 3600000 // 1 hour
      };
      
      expect(securityService.isSessionExpired(session)).toBe(true);
      
      const validSession = {
        id: 'valid-session',
        createdAt: Date.now() - 1800000, // 30 minutes ago
        expiresIn: 3600000 // 1 hour
      };
      
      expect(securityService.isSessionExpired(validSession)).toBe(false);
    });

    it('should handle session rotation', () => {
      const oldSessionId = 'old-session-123';
      const newSessionId = securityService.rotateSession(oldSessionId);
      
      expect(newSessionId).toBeDefined();
      expect(newSessionId).not.toBe(oldSessionId);
      expect(newSessionId.length).toBeGreaterThan(32);
    });
  });
});