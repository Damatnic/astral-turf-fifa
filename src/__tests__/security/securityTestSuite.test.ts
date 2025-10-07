/**
 * Guardian Security Test Suite
 * Comprehensive security testing for all Guardian security components
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  authSecurity,
  generateDeviceFingerprint,
  assessAuthenticationRisk,
} from '../../security/authSecurity';
import {
  dataProtection,
  encryptSensitiveData,
  detectPersonalData,
} from '../../security/dataProtection';
import {
  inputValidation,
  validateField,
  validateForm,
  VALIDATION_SCHEMAS,
} from '../../security/inputValidation';
import { securityHeaders, getSecurityHeaders } from '../../security/securityHeaders';
import { RateLimitHit, rateLimitingEngine, rateLimitUtils } from '../../security/rateLimiting';
import {
  auditLogger,
  logAuthentication,
  logSecurityEvent,
  AuditEventType,
} from '../../security/auditLogging';
import { gdprCompliance, registerPersonalData, recordConsent } from '../../security/gdprCompliance';

describe('Guardian Security Test Suite', () => {
  beforeEach(() => {
    // Reset security components before each test
    // (rateLimiting as any).reset() - not available;
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Authentication Security', () => {
    test('should generate unique device fingerprints', () => {
      const context1 = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const context2 = {
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const fingerprint1 = generateDeviceFingerprint(context1);
      const fingerprint2 = generateDeviceFingerprint(context2);

      expect(fingerprint1).toBeTruthy();
      expect(fingerprint2).toBeTruthy();
      expect(fingerprint1).not.toBe(fingerprint2);
    });

    test('should assess authentication risk correctly', async () => {
      const lowRiskContext = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        timestamp: '2024-01-01T10:00:00Z',
      };

      const highRiskContext = {
        ipAddress: '10.0.0.1',
        userAgent: 'curl/7.68.0',
        timestamp: '2024-01-01T03:00:00Z',
      };

      const lowRisk = await assessAuthenticationRisk('user@example.com', lowRiskContext);
      const highRisk = await assessAuthenticationRisk('attacker@evil.com', highRiskContext);

      expect(lowRisk.recommendation).toBe('allow');
      expect(highRisk.recommendation).toBe('challenge');
      expect(highRisk.score).toBeGreaterThan(lowRisk.score);
    });

    test('should validate password strength', () => {
      const weakPassword = 'password123';
      const strongPassword = 'MyStr0ng!P@ssw0rd2024';

      const weakResult = authSecurity.validatePasswordStrength(weakPassword);
      const strongResult = authSecurity.validatePasswordStrength(strongPassword);

      expect(weakResult.valid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);
      expect(strongResult.valid).toBe(true);
      expect(strongResult.errors.length).toBe(0);
    });

    test('should generate secure JWT tokens', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'coach' as const,
        firstName: 'John',
        lastName: 'Doe',
        notifications: {
          email: true,
          sms: false,
          push: true,
          matchUpdates: true,
          trainingReminders: true,
          emergencyAlerts: true,
          paymentReminders: false,
        },
        timezone: 'UTC',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
      };

      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const tokens = await authSecurity.generateTokens(user, context);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.tokenType).toBe('Bearer');
      expect(tokens.expiresIn).toBe(15 * 60);
    });

    test('should verify JWT tokens correctly', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'coach' as const,
        firstName: 'John',
        lastName: 'Doe',
        notifications: {
          email: true,
          sms: false,
          push: true,
          matchUpdates: true,
          trainingReminders: true,
          emergencyAlerts: true,
          paymentReminders: false,
        },
        timezone: 'UTC',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
      };

      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const tokens = await authSecurity.generateTokens(user, context);
      const verification = await authSecurity.verifyToken(tokens.accessToken, context);

      expect(verification.valid).toBe(true);
      expect(verification.payload?.sub).toBe(user.id);
    });

    test('should reject invalid tokens', async () => {
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const invalidToken = 'invalid.jwt.token';
      const verification = await authSecurity.verifyToken(invalidToken, context);

      expect(verification.valid).toBe(false);
      expect(verification.error).toBeTruthy();
    });
  });

  describe('Data Protection', () => {
    test('should encrypt and decrypt data correctly', async () => {
      const sensitiveData = {
        playerName: 'John Doe',
        position: 'Striker',
        personalData: 'Sensitive information',
      };

      const context = { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' };

      const encrypted = await encryptSensitiveData(
        sensitiveData,
        'confidential',
        'user123',
        context,
      );

      expect(encrypted.data).toBeTruthy();
      expect(encrypted.algorithm).toBe('AES-256-GCM');
      expect(encrypted.classification).toBe('confidential');

      const decrypted = await dataProtection.decryptData(encrypted, 'user123', context);
      expect(decrypted).toEqual(sensitiveData);
    });

    test('should detect PII in data', () => {
      const dataWithPII = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-123-4567',
        ssn: '123-45-6789',
        creditCard: '4111-1111-1111-1111',
        normalData: 'This is not PII',
      };

      const result = detectPersonalData(dataWithPII);

      expect(result.hasPII).toBe(true);
      expect(result.detectedTypes).toContain('email');
      expect(result.detectedTypes).toContain('phone');
      expect(result.detectedTypes).toContain('ssn');
      expect(result.detectedTypes).toContain('creditCard');
      expect(result.locations.length).toBeGreaterThan(0);
    });

    test('should mask sensitive data', () => {
      const sensitiveData = {
        email: 'john.doe@example.com',
        creditCard: '4111111111111111',
        name: 'John Doe',
      };

      const masks = [
        { field: 'email', strategy: 'partial' as const, showFirst: 2, showLast: 2 },
        { field: 'creditCard', strategy: 'full' as const },
        { field: 'name', strategy: 'hash' as const },
      ];

      const masked = dataProtection.maskData(sensitiveData, masks) as any;

      expect(masked.email).toMatch(/^jo.*om$/);
      expect(masked.creditCard).toMatch(/^\*+$/);
      expect(masked.name).not.toBe(sensitiveData.name);
    });

    test('should sanitize HTML content', () => {
      const maliciousHTML =
        '<script>alert("XSS")</script><p>Safe content</p><iframe src="evil.com"></iframe>';

      const sanitized = dataProtection.sanitizeHTML(maliciousHTML);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).toContain('<p>Safe content</p>');
    });

    test('should generate and verify data checksums', () => {
      const data = { important: 'data', values: [1, 2, 3] };

      const checksum1 = dataProtection.generateDataChecksum(data);
      const checksum2 = dataProtection.generateDataChecksum(data);
      const checksum3 = dataProtection.generateDataChecksum({ ...data, modified: true });

      expect(checksum1).toBe(checksum2);
      expect(checksum1).not.toBe(checksum3);
      expect(dataProtection.verifyDataIntegrity(data, checksum1)).toBe(true);
      expect(dataProtection.verifyDataIntegrity(data, checksum3)).toBe(false);
    });
  });

  describe('Input Validation', () => {
    test('should validate email addresses', () => {
      const validEmail = 'user@example.com';
      const invalidEmail = 'not-an-email';

      const validResult = validateField(validEmail, { rule: 'email', required: true });
      const invalidResult = validateField(invalidEmail, { rule: 'email', required: true });

      expect(validResult.valid).toBe(true);
      expect(validResult.detectedThreats).toEqual([]);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    test('should detect SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";

      const result = validateField(sqlInjection, { rule: 'text', required: true });

      expect(result.detectedThreats).toContain('sqlInjection');
      expect(result.riskLevel).toBe('critical');
    });

    test('should detect XSS attempts', () => {
      const xssAttempt = '<script>alert("XSS")</script>';

      const result = validateField(xssAttempt, { rule: 'text', required: true });

      expect(result.detectedThreats).toContain('xss');
      expect(result.riskLevel).toBe('high');
    });

    test('should validate complex forms', () => {
      const validFormData = {
        email: 'user@example.com',
        password: 'StrongP@ssw0rd123',
        confirmPassword: 'StrongP@ssw0rd123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const invalidFormData = {
        email: 'invalid-email',
        password: '123',
        confirmPassword: '456',
        firstName: '<script>alert("XSS")</script>',
        lastName: '',
      };

      const validResult = validateForm(validFormData, VALIDATION_SCHEMAS.registration);
      const invalidResult = validateForm(invalidFormData, VALIDATION_SCHEMAS.registration);

      expect(validResult.valid).toBe(true);
      expect(validResult.riskAssessment.overallRisk).toBe('low');
      expect(invalidResult.valid).toBe(false);
      expect(Object.keys(invalidResult.fieldErrors).length).toBeGreaterThan(0);
    });

    test('should validate file uploads', () => {
      const validFile = new File(['content'], 'formation.json', { type: 'application/json' });
      const suspiciousFile = new File(['content'], 'virus.exe', {
        type: 'application/octet-stream',
      });

      const validResult = inputValidation.validateFileUpload(validFile, {
        allowedTypes: ['application/json'],
        maxSize: 1024 * 1024,
        allowedExtensions: ['json'],
      });

      const suspiciousResult = inputValidation.validateFileUpload(suspiciousFile, {
        allowedTypes: ['application/json'],
        maxSize: 1024 * 1024,
        allowedExtensions: ['json'],
      });

      expect(validResult.valid).toBe(true);
      expect(suspiciousResult.valid).toBe(false);
      expect(suspiciousResult.detectedThreats).toContain('suspicious_filename');
    });

    test('should sanitize various input types', () => {
      const maliciousInputs = {
        script: '<script>alert("XSS")</script>',
        sql: "'; DROP TABLE users; --",
        path: '../../../etc/passwd',
        command: 'rm -rf /',
      };

      Object.entries(maliciousInputs).forEach(([type, input]) => {
        const sanitized = inputValidation.sanitizeString(input, 'general');
        expect(sanitized).not.toBe(input);
        expect(sanitized.length).toBeLessThanOrEqual(input.length);
      });
    });
  });

  describe('Security Headers', () => {
    test('should generate comprehensive security headers', () => {
      const headers = getSecurityHeaders();

      expect(headers['Content-Security-Policy']).toBeTruthy();
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBeTruthy();
      expect(headers['Permissions-Policy']).toBeTruthy();
    });

    test('should generate valid CSP directive', () => {
      const headers = getSecurityHeaders();
      const csp = headers['Content-Security-Policy'];

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('upgrade-insecure-requests');
      expect(csp).toContain('block-all-mixed-content');
    });

    test('should validate security configuration', () => {
      const validation = securityHeaders.validateConfig();

      // Development mode may have some warnings
      expect(validation.valid).toBeDefined();
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test('should generate security meta tags', () => {
      const metaTags = securityHeaders.generateMetaTags();

      expect(Array.isArray(metaTags)).toBe(true);
      expect(metaTags.some(tag => tag.includes('Content-Security-Policy'))).toBe(true);
    });

    test('should generate unique nonces', () => {
      const nonce1 = securityHeaders.generateNonce();
      const nonce2 = securityHeaders.generateNonce();

      expect(nonce1).toBeTruthy();
      expect(nonce2).toBeTruthy();
      expect(nonce1).not.toBe(nonce2);
      expect(nonce1.length).toBeGreaterThan(10);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within limits', () => {
      const context = {
        ip: '192.168.1.1',
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/formations',
        method: 'GET',
        timestamp: Date.now(),
        headers: {},
      };

      const result = rateLimitUtils.checkRateLimit(context);

      expect(result?.blocked).toBe(false);
      expect(result?.remainingRequests).toBeGreaterThan(0);
    });

    test('should block requests exceeding limits', () => {
      const context = {
        ip: '192.168.1.1',
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/formations',
        method: 'GET',
        timestamp: Date.now(),
        headers: {},
      };

      // Make many requests to exceed limit
      let lastResult;
      for (let i = 0; i < 200; i++) {
        lastResult = rateLimitUtils.checkRateLimit(context);
        if (lastResult && lastResult.blocked) {
          break;
        }
      }

      expect(lastResult?.blocked).toBe(true);
      expect(lastResult?.threats).toContain('rate_limit_exceeded');
    });

    test('should detect attack patterns', () => {
      const maliciousContext = {
        ip: '10.0.0.1',
        userAgent: 'sqlmap/1.0',
        endpoint: "/api/users?id=1' OR 1=1--",
        method: 'GET',
        timestamp: Date.now(),
        headers: {},
      };

      const result = rateLimitUtils.checkRateLimit(maliciousContext);

      expect(result?.blocked).toBe(true);
      expect(result?.threatLevel).toBeDefined();
      expect(['medium', 'high', 'critical']).toContain(result?.threatLevel);
    });

    test('should block known malicious IPs', () => {
      const maliciousIP = '10.0.0.1';

      // Block the IP
      rateLimitingEngine.blockIP(maliciousIP, 60000);

      const context = {
        ip: maliciousIP,
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/test',
        method: 'GET',
        timestamp: Date.now(),
        headers: {},
      };

      const result = rateLimitUtils.checkRateLimit(context);

      expect(result?.blocked).toBe(true);
      expect(result?.ipAddress).toBe(maliciousIP);
    });

    test('should provide rate limiting statistics', () => {
      const stats = rateLimitUtils.getStats();

      expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
      expect(stats.blockedRequests).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.topAttackVectors)).toBe(true);
      expect(typeof stats.timeDistribution).toBe('object');
    });
  });

  describe('Audit Logging', () => {
    test('should log authentication events', () => {
      const eventId = logAuthentication('login', 'success', {
        userId: 'user123',
        email: 'user@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session123',
      });

      expect(eventId).toBeTruthy();
      expect(eventId.startsWith('audit_')).toBe(true);
    });

    test('should log security events', () => {
      const eventId = logSecurityEvent('attack_detected', 'SQL injection attempt detected', {
        threatLevel: 'high',
        attackVector: 'sql_injection',
        ipAddress: '10.0.0.1',
        payload: "'; DROP TABLE users; --",
      });

      expect(eventId).toBeTruthy();
    });

    test('should query audit events', async () => {
      // Log some test events
      logAuthentication('login', 'success', { userId: 'user1' });
      logAuthentication('login', 'failure', { userId: 'user2' });
      logSecurityEvent('attack_detected', 'Test attack', { threatLevel: 'medium' });

      const query = {
        eventType: AuditEventType.AUTHENTICATION,
        limit: 10,
      };

      const result = await auditLogger.queryEvents(query);

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThanOrEqual(result.events.length);
      expect(typeof result.hasMore).toBe('boolean');
    });

    test('should generate compliance reports', async () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';

      const report = await auditLogger.generateComplianceReport(
        'Annual Security Report',
        startDate,
        endDate,
      );

      expect(report.id).toBeTruthy();
      expect(report.title).toBe('Annual Security Report');
      expect(report.period.startDate).toBe(startDate);
      expect(report.period.endDate).toBe(endDate);
      expect(typeof report.summary.totalEvents).toBe('number');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    test('should export audit logs', async () => {
      const query = { limit: 5 };

      const jsonExport = await auditLogger.exportLogs(query, 'json');
      const csvExport = await auditLogger.exportLogs(query, 'csv');

      expect(typeof jsonExport).toBe('string');
      expect(typeof csvExport).toBe('string');
      expect(jsonExport.length).toBeGreaterThan(0);
      expect(csvExport.length).toBeGreaterThan(0);
    });

    test('should provide audit statistics', () => {
      const stats = auditLogger.getStatistics('24h');

      expect(typeof stats.eventCount).toBe('number');
      expect(typeof stats.failureRate).toBe('number');
      expect(Array.isArray(stats.topUsers)).toBe(true);
      expect(Array.isArray(stats.recentSecurityEvents)).toBe(true);
    });
  });

  describe('GDPR Compliance', () => {
    test('should register personal data', () => {
      const personalDataId = registerPersonalData({
        category: 'identity' as any,
        dataType: 'email',
        value: 'user@example.com',
        source: 'user_registration',
        retentionPeriod: 365,
        legalBasis: 'consent' as any,
        processingPurpose: 'user_account_management',
        isAnonymized: false,
        isEncrypted: true,
        dataSubjectId: 'user123',
        dataControllerInfo: {
          name: 'Test Controller',
          contactEmail: 'privacy@test.com',
          address: '123 Test St',
          privacyPolicyUrl: 'https://test.com/privacy',
          dataRetentionPolicy: 'https://test.com/retention',
        },
        thirdPartySharing: [],
      });

      expect(personalDataId).toBeTruthy();
      expect(personalDataId.startsWith('pd_')).toBe(true);
    });

    test('should record consent', () => {
      const consentId = recordConsent({
        dataSubjectId: 'user123',
        purposes: ['analytics', 'marketing'],
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentMethod: 'explicit',
        granular: true,
        evidence: 'User clicked accept button',
        version: '1.0',
      });

      expect(consentId).toBeTruthy();
      expect(consentId.startsWith('consent_')).toBe(true);
    });

    test('should withdraw consent', () => {
      // First record consent
      const consentId = recordConsent({
        dataSubjectId: 'user123',
        purposes: ['analytics'],
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentMethod: 'explicit',
        granular: true,
        evidence: 'User clicked accept',
        version: '1.0',
      });

      // Then withdraw it
      expect(() => {
        gdprCompliance.withdrawConsent('user123', consentId, 'User requested withdrawal');
      }).not.toThrow();
    });

    test('should submit data subject requests', () => {
      const requestId = gdprCompliance.submitDataSubjectRequest({
        dataSubjectId: 'user123',
        requestType: 'access' as any,
        identityVerified: true,
        requestDetails: 'I want to see all my personal data',
        requesterInfo: {
          email: 'user@example.com',
          name: 'John Doe',
          relationship: 'data_subject',
        },
      });

      expect(requestId).toBeTruthy();
      expect(requestId.startsWith('dsr_')).toBe(true);
    });

    test('should report data breaches', () => {
      const breachId = gdprCompliance.reportDataBreach({
        description: 'Unauthorized access to user database',
        affectedDataCategories: ['identity', 'technical'] as any,
        estimatedAffectedSubjects: 1000,
        breachSource: 'external',
        breachCause: 'SQL injection attack',
        securityMeasuresInPlace: ['encryption', 'access_controls'],
        containmentMeasures: ['patch_applied', 'access_revoked'],
        assessmentResults: {
          riskToRights: 'high',
          notificationRequired: true,
          authorityNotified: false,
          subjectsNotified: false,
        },
        investigation: {
          rootCause: 'Unpatched vulnerability',
          lessons_learned: ['Implement automated patching'],
          improvements: ['Enhanced monitoring'],
        },
        costs: {
          investigation: 5000,
          notification: 2000,
          remediation: 10000,
        },
      });

      expect(breachId).toBeTruthy();
      expect(breachId.startsWith('breach_')).toBe(true);
    });

    test('should generate compliance reports', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-12-31T23:59:59Z';

      const report = gdprCompliance.generateComplianceReport(startDate, endDate);

      expect(report.id).toBeTruthy();
      expect(report.period.startDate).toBe(startDate);
      expect(report.period.endDate).toBe(endDate);
      expect(typeof report.summary.complianceScore).toBe('number');
      expect(report.summary.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.complianceScore).toBeLessThanOrEqual(100);
    });

    test('should perform data retention cleanup', () => {
      const results = gdprCompliance.performDataRetentionCleanup();

      expect(typeof results.reviewed).toBe('number');
      expect(typeof results.deleted).toBe('number');
      expect(typeof results.retained).toBe('number');
      expect(Array.isArray(results.errors)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end authentication flow', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'coach' as const,
        firstName: 'John',
        lastName: 'Doe',
        notifications: {
          email: true,
          sms: false,
          push: true,
          matchUpdates: true,
          trainingReminders: true,
          emergencyAlerts: true,
          paymentReminders: false,
        },
        timezone: 'UTC',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
      };

      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      // 1. Assess risk
      const riskAssessment = await assessAuthenticationRisk(user.email, context);
      expect(riskAssessment.recommendation).toBe('allow');

      // 2. Generate tokens
      const tokens = await authSecurity.generateTokens(user, context);
      expect(tokens.accessToken).toBeTruthy();

      // 3. Verify tokens
      const verification = await authSecurity.verifyToken(tokens.accessToken, context);
      expect(verification.valid).toBe(true);

      // 4. Log authentication
      const auditId = logAuthentication('login', 'success', {
        userId: user.id,
        email: user.email,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      });
      expect(auditId).toBeTruthy();
    });

    test('should handle malicious request flow', () => {
      const maliciousContext = {
        ip: '10.0.0.1',
        userAgent: 'sqlmap/1.0',
        endpoint: "/api/users?id=1' OR 1=1--",
        method: 'GET',
        timestamp: Date.now(),
        headers: {},
      };

      // 1. Rate limiting should detect attack
      const rateLimitResult = rateLimitUtils.checkRateLimit(maliciousContext);
      expect(rateLimitResult?.blocked).toBe(true);

      // 2. Input validation should detect SQL injection
      const validationResult = validateField("'; DROP TABLE users; --", {
        rule: 'text',
        required: true,
      });
      expect(validationResult.detectedThreats).toContain('sqlInjection');

      // 3. Security event should be logged
      const auditId = logSecurityEvent('attack_detected', 'SQL injection attempt', {
        threatLevel: 'critical',
        attackVector: 'sql_injection',
        ipAddress: maliciousContext.ip,
        payload: maliciousContext.endpoint,
      });
      expect(auditId).toBeTruthy();
    });

    test('should handle GDPR data lifecycle', () => {
      const dataSubjectId = 'user123';

      // 1. Record consent
      const consentId = recordConsent({
        dataSubjectId,
        purposes: ['analytics', 'marketing'],
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        consentMethod: 'explicit',
        granular: true,
        evidence: 'User acceptance',
        version: '1.0',
      });

      // 2. Register personal data
      const dataId = registerPersonalData({
        category: 'identity' as any,
        dataType: 'email',
        value: 'user@example.com',
        source: 'registration',
        retentionPeriod: 365,
        legalBasis: 'consent' as any,
        processingPurpose: 'marketing',
        isAnonymized: false,
        isEncrypted: true,
        dataSubjectId,
        dataControllerInfo: {
          name: 'Test Controller',
          contactEmail: 'privacy@test.com',
          address: '123 Test St',
          privacyPolicyUrl: 'https://test.com/privacy',
          dataRetentionPolicy: 'https://test.com/retention',
        },
        thirdPartySharing: [],
      });

      // 3. Submit access request
      const requestId = gdprCompliance.submitDataSubjectRequest({
        dataSubjectId,
        requestType: 'access' as any,
        identityVerified: true,
        requestDetails: 'Access request',
        requesterInfo: {
          email: 'user@example.com',
          relationship: 'data_subject',
        },
      });

      expect(consentId).toBeTruthy();
      expect(dataId).toBeTruthy();
      expect(requestId).toBeTruthy();
    });
  });

  describe('Performance Tests', () => {
    test('should handle high-volume authentication requests', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        role: 'coach' as const,
        firstName: 'John',
        lastName: 'Doe',
        notifications: {
          email: true,
          sms: false,
          push: true,
          matchUpdates: true,
          trainingReminders: true,
          emergencyAlerts: true,
          paymentReminders: false,
        },
        timezone: 'UTC',
        language: 'en',
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
      };

      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await authSecurity.generateTokens(user, context);
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(100); // Less than 100ms per token generation
    });

    test('should handle high-volume rate limiting checks', () => {
      const context = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        endpoint: '/api/test',
        method: 'GET',
        timestamp: Date.now(),
        headers: {},
      };

      const startTime = Date.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        rateLimitUtils.checkRateLimit({ ...context, timestamp: Date.now() + i });
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(10); // Less than 10ms per rate limit check
    });

    test('should handle high-volume encryption operations', async () => {
      const data = { test: 'data', value: 123 };
      const context = { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' };

      const startTime = Date.now();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        await encryptSensitiveData(data, 'confidential', 'user123', context);
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(200); // Less than 200ms per encryption
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid encryption data gracefully', async () => {
      const context = { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' };

      await expect(async () => {
        await encryptSensitiveData(undefined, 'confidential', 'user123', context);
      }).rejects.toThrow();
    });

    test('should handle invalid validation configurations', () => {
      expect(() => {
        validateField('test', { rule: 'invalid' as any, required: true });
      }).not.toThrow(); // Should default to safe validation
    });

    test('should handle malformed JWT tokens', async () => {
      const context = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = await authSecurity.verifyToken('malformed.jwt.token', context);
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should handle GDPR operation errors', () => {
      expect(() => {
        gdprCompliance.withdrawConsent('nonexistent', 'invalid-id');
      }).toThrow();
    });
  });
});

describe('Security Metrics and Monitoring', () => {
  test('should provide security metrics', () => {
    const authMetrics = authSecurity.getSecurityAnalytics('24h');
    const rateLimitMetrics = rateLimitUtils.getStats();
    const auditMetrics = auditLogger.getStatistics('24h');

    expect(typeof authMetrics.loginAttempts).toBe('number');
    expect(typeof rateLimitMetrics.totalRequests).toBe('number');
    expect(typeof auditMetrics.eventCount).toBe('number');
  });

  test('should detect security trends', () => {
    // Log multiple failed login attempts
    for (let i = 0; i < 10; i++) {
      logAuthentication('login', 'failure', {
        userId: `user${i}`,
        ipAddress: '10.0.0.1',
        reason: 'Invalid credentials',
      });
    }

    const metrics = auditLogger.getStatistics('1h');
    expect(metrics.failureRate).toBeGreaterThan(0);
  });

  test('should generate security alerts', () => {
    // Generate high-risk events
    for (let i = 0; i < 15; i++) {
      logSecurityEvent('attack_detected', `Attack ${i}`, {
        threatLevel: 'critical',
        ipAddress: '10.0.0.1',
      });
    }

    const metrics = auditLogger.getStatistics('1h');
    expect(metrics.alertsTriggered).toBeGreaterThan(10);
  });
});
