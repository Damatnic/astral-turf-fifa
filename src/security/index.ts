/**
 * Guardian Security Module - Military-Grade Security Infrastructure
 *
 * Comprehensive security suite for tactical board system providing:
 * - Advanced threat detection and response
 * - Military-grade encryption for tactical data
 * - Secure session management with risk assessment
 * - Role-based access control with tactical permissions
 * - Compliance framework (GDPR, SOC2, ISO27001)
 * - Secure file handling for formation imports/exports
 * - Automated security testing and vulnerability assessment
 * - Real-time security monitoring and alerting
 */

// Guardian Core Security Suite
export * from './guardianSecuritySuite';
export { guardianSecuritySuite as default } from './guardianSecuritySuite';

// Tactical Board Security
export * from './tacticalBoardSecurity';
export { guardianTacticalSecurity } from './tacticalBoardSecurity';

// Session Management & Authentication
export * from './secureSessionManager';
export { guardianSecureSessionManager } from './secureSessionManager';

// Threat Detection & Monitoring
export * from './threatDetection';
export { guardianThreatDetection } from './threatDetection';

// Compliance Framework
export * from './complianceFramework';
export { guardianComplianceFramework } from './complianceFramework';

// Secure File Handling
export * from './secureFileHandler';
export { guardianSecureFileHandler } from './secureFileHandler';

// Security Testing
export * from './securityTesting';
export { guardianSecurityTesting } from './securityTesting';

// Content Security Policy
export * from './cspConfig';

// Core security modules
export * from './auth';
export * from './validation';
export * from './sanitization';
export * from './rbac';
export * from './logging';
export * from './csp';
export * from './encryption';
export * from './monitoring';

// Guardian Security Middleware
export { guardianSecurityMiddleware } from './guardianSecuritySuite';
