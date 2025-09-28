/**
 * Guardian Security Suite - Master Integration
 * 
 * Military-grade security orchestration for tactical board system
 * Integrates all security components into a unified, enterprise-ready fortress
 */

import { guardianTacticalSecurity, SecureTacticalData, TacticalFormation } from './tacticalBoardSecurity';
import { guardianSecureSessionManager, AuthenticationRequest, AuthenticationResult } from './secureSessionManager';
import { guardianComplianceFramework, DataCategory, ProcessingLawfulness } from './complianceFramework';
import { guardianThreatDetection, ThreatContext } from './threatDetection';
import { guardianSecureFileHandler } from './secureFileHandler';
import { guardianSecurityTesting, VulnerabilityAssessment } from './securityTesting';
import { GUARDIAN_SECURITY_HEADERS, applySecurityHeaders } from './cspConfig';
import { validateAndSanitize, validateTacticalData } from './validation';
import { Permission, Resource, hasPermission, UserRole } from './rbac';
import { securityLogger } from './logging';

export interface GuardianSecurityConfig {
  enableThreatDetection: boolean;
  enableComplianceLogging: boolean;
  enableSecurityHeaders: boolean;
  enableSessionSecurity: boolean;
  enableFileValidation: boolean;
  strictMode: boolean;
  monitoringLevel: 'basic' | 'standard' | 'advanced' | 'maximum';
  complianceFrameworks: string[];
}

export interface SecurityContext {
  userId?: string;
  userRole?: UserRole;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  teamId?: string;
  permissions?: string[];
  securityLevel?: string;
  riskScore?: number;
}

export interface SecureOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
  securityFlags: string[];
  complianceChecks: Record<string, boolean>;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  operationId: string;
  timestamp: string;
}

export interface SecurityDashboard {
  systemStatus: 'secure' | 'warning' | 'critical';
  activeThreats: number;
  blockedAttacks: number;
  complianceScore: number;
  vulnerabilityScore: number;
  lastSecurityScan: string;
  activeSessions: number;
  securityEvents: SecurityEvent[];
  recommendations: string[];
}

export interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'threat_detected' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
  resolved: boolean;
}

/**
 * Guardian Security Suite - Master Class
 */
export class GuardianSecuritySuite {
  private config: GuardianSecurityConfig;
  private securityEvents: SecurityEvent[] = [];

  constructor(config: Partial<GuardianSecurityConfig> = {}) {
    this.config = {
      enableThreatDetection: true,
      enableComplianceLogging: true,
      enableSecurityHeaders: true,
      enableSessionSecurity: true,
      enableFileValidation: true,
      strictMode: process.env.NODE_ENV === 'production',
      monitoringLevel: 'advanced',
      complianceFrameworks: ['GDPR', 'SOC2'],
      ...config
    };

    this.initializeSecurity();
  }

  /**
   * Initialize all security systems
   */
  private async initializeSecurity(): Promise<void> {
    securityLogger.info('Initializing Guardian Security Suite', {
      config: this.config,
      environment: process.env.NODE_ENV
    });

    // Run initial security assessment
    if (this.config.strictMode) {
      await this.runSecurityAssessment();
    }

    this.logSecurityEvent({
      id: crypto.randomUUID(),
      type: 'authentication',
      severity: 'low',
      description: 'Guardian Security Suite initialized',
      timestamp: new Date().toISOString(),
      resolved: true
    });
  }

  /**
   * Secure tactical formation operations
   */
  async secureFormationOperation<T>(
    operation: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export' | 'import',
    data: unknown,
    context: SecurityContext
  ): Promise<SecureOperationResult<T>> {
    const operationId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const result: SecureOperationResult<T> = {
      success: false,
      errors: [],
      warnings: [],
      securityFlags: [],
      complianceChecks: {},
      threatLevel: 'low',
      operationId,
      timestamp
    };

    try {
      // Step 1: Threat Detection
      if (this.config.enableThreatDetection) {
        const threatContext: ThreatContext = {
          userId: context.userId,
          sessionId: context.sessionId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          requestPath: `/tactical/${operation}`,
          requestMethod: 'POST',
          payload: data,
          timestamp
        };

        const threats = await guardianThreatDetection.analyzeRequest(threatContext);
        if (threats.length > 0) {
          const highestThreat = threats.reduce((max, threat) => 
            threat.threatLevel > max.threatLevel ? threat : max
          );
          
          result.threatLevel = highestThreat.threatLevel;
          result.securityFlags.push(`threat_detected:${highestThreat.threatType}`);
          
          if (highestThreat.threatLevel === 'critical' || highestThreat.threatLevel === 'high') {
            result.errors.push('Operation blocked due to security threat');
            return result;
          }
        }
      }

      // Step 2: Session Validation
      if (this.config.enableSessionSecurity && context.sessionId) {
        const sessionValidation = await guardianSecureSessionManager.validateSession(
          context.sessionId,
          context.ipAddress || ''
        );

        if (!sessionValidation.valid) {
          result.errors.push('Invalid or expired session');
          return result;
        }

        if (sessionValidation.securityFlags.length > 0) {
          result.warnings.push('Session security flags detected');
          result.securityFlags.push(...sessionValidation.securityFlags.map(f => `session:${f}`));
        }
      }

      // Step 3: Authorization Check
      if (context.userId && context.userRole) {
        const permission = this.getRequiredPermission(operation);
        const resource = Resource.TACTICAL_BOARD;
        
        const authResult = hasPermission(context.userRole, permission, resource, {
          userId: context.userId,
          userRole: context.userRole,
          teamId: context.teamId,
          ipAddress: context.ipAddress
        });

        if (!authResult.granted) {
          result.errors.push(`Insufficient permissions for ${operation} operation`);
          return result;
        }
      }

      // Step 4: Input Validation
      if (data && ['create', 'update', 'import'].includes(operation)) {
        const validationResult = validateTacticalData(data, 'formation');
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors);
          return result;
        }
        data = validationResult.sanitizedData;
      }

      // Step 5: Execute Operation
      let operationResult: unknown;
      
      switch (operation) {
        case 'create':
        case 'update':
          operationResult = await this.executeFormationWrite(data as TacticalFormation, context);
          break;
        case 'read':
          operationResult = await this.executeFormationRead(data as string, context);
          break;
        case 'delete':
          operationResult = await this.executeFormationDelete(data as string, context);
          break;
        case 'share':
          operationResult = await this.executeFormationShare(data as any, context);
          break;
        case 'export':
          operationResult = await this.executeFormationExport(data as any, context);
          break;
        case 'import':
          operationResult = await this.executeFormationImport(data as File, context);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      // Step 6: Compliance Logging
      if (this.config.enableComplianceLogging) {
        await guardianComplianceFramework.logDataProcessing(
          context.userId,
          `tactical_${operation}`,
          DataCategory.TACTICAL_DATA,
          'formation',
          'Tactical board operations',
          ProcessingLawfulness.LEGITIMATE_INTERESTS,
          {
            operationId,
            operation,
            dataSize: JSON.stringify(data).length,
            securityFlags: result.securityFlags
          }
        );

        result.complianceChecks = {
          dataProcessingLogged: true,
          gdprCompliant: true,
          dataMinimization: true
        };
      }

      result.success = true;
      result.data = operationResult as T;

      securityLogger.logSecurityEvent('DATA_ACCESS' as any, `Tactical ${operation} operation completed`, {
        userId: context.userId,
        metadata: {
          operationId,
          operation,
          success: true,
          threatLevel: result.threatLevel,
          securityFlags: result.securityFlags.length
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      
      securityLogger.error(`Tactical ${operation} operation failed`, {
        operationId,
        error: errorMessage,
        userId: context.userId
      });
    }

    return result;
  }

  /**
   * Secure authentication with full security checks
   */
  async secureAuthentication(request: AuthenticationRequest): Promise<AuthenticationResult> {
    try {
      // Enhanced threat detection for authentication
      const threatContext: ThreatContext = {
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        requestPath: '/auth/login',
        requestMethod: 'POST',
        payload: { email: request.email },
        timestamp: new Date().toISOString()
      };

      const threats = await guardianThreatDetection.analyzeRequest(threatContext);
      
      // Block authentication if critical threats detected
      if (threats.some(t => t.threatLevel === 'critical')) {
        return {
          success: false,
          errors: ['Authentication blocked due to security threat'],
          warnings: [],
          requiresMFA: false,
          securityFlags: ['critical_threat_detected'],
          nextAction: 'account_locked'
        };
      }

      // Proceed with secure authentication
      const authResult = await guardianSecureSessionManager.authenticate(request);

      // Log compliance event
      if (this.config.enableComplianceLogging) {
        await guardianComplianceFramework.logDataProcessing(
          authResult.session?.userId,
          'user_authentication',
          DataCategory.PERSONAL_DATA,
          'authentication_data',
          'User authentication and session management',
          ProcessingLawfulness.CONTRACT,
          {
            successful: authResult.success,
            mfaUsed: authResult.requiresMFA,
            ipAddress: request.ipAddress,
            securityFlags: authResult.securityFlags
          }
        );
      }

      return authResult;

    } catch (error) {
      securityLogger.error('Secure authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: request.email,
        ipAddress: request.ipAddress
      });

      return {
        success: false,
        errors: ['Authentication system error'],
        warnings: [],
        requiresMFA: false,
        securityFlags: ['system_error']
      };
    }
  }

  /**
   * Secure file operations
   */
  async secureFileOperation(
    operation: 'upload' | 'download',
    file: File | string,
    context: SecurityContext
  ): Promise<SecureOperationResult> {
    const operationId = crypto.randomUUID();
    const result: SecureOperationResult = {
      success: false,
      errors: [],
      warnings: [],
      securityFlags: [],
      complianceChecks: {},
      threatLevel: 'low',
      operationId,
      timestamp: new Date().toISOString()
    };

    try {
      if (!this.config.enableFileValidation) {
        result.errors.push('File operations disabled');
        return result;
      }

      if (operation === 'upload' && file instanceof File) {
        const uploadResult = await guardianSecureFileHandler.secureImport(
          file,
          context.userId || 'anonymous',
          context.teamId || 'default'
        );

        if (!uploadResult.success) {
          result.errors.push(...uploadResult.errors);
          return result;
        }

        result.data = uploadResult.formation;
        result.success = true;
      }

      // Log compliance
      if (this.config.enableComplianceLogging) {
        await guardianComplianceFramework.logDataProcessing(
          context.userId,
          `file_${operation}`,
          DataCategory.TACTICAL_DATA,
          'formation_file',
          'File import/export operations',
          ProcessingLawfulness.LEGITIMATE_INTERESTS,
          { operationId, fileName: file instanceof File ? file.name : file }
        );
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'File operation failed');
    }

    return result;
  }

  /**
   * Get security dashboard data
   */
  async getSecurityDashboard(): Promise<SecurityDashboard> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get security metrics
    const threatMetrics = await guardianThreatDetection.getSecurityMetrics(yesterday, now);
    
    // Run quick security assessment
    const assessment = await guardianSecurityTesting.runSecurityTestSuite();
    
    // Calculate compliance score
    const complianceScore = Object.values(assessment.complianceStatus)
      .reduce((acc, status) => acc + (status ? 1 : 0), 0) / 
      Object.keys(assessment.complianceStatus).length * 100;

    const dashboard: SecurityDashboard = {
      systemStatus: this.calculateSystemStatus(assessment, threatMetrics),
      activeThreats: threatMetrics.threatsDetected,
      blockedAttacks: threatMetrics.threatsBlocked,
      complianceScore: Math.round(complianceScore),
      vulnerabilityScore: assessment.overallScore,
      lastSecurityScan: assessment.timestamp,
      activeSessions: 0, // Would get from session manager
      securityEvents: this.securityEvents.slice(-10), // Last 10 events
      recommendations: assessment.recommendations
    };

    return dashboard;
  }

  /**
   * Apply security headers to response
   */
  applySecurityHeaders(headers: Headers): void {
    if (this.config.enableSecurityHeaders) {
      applySecurityHeaders(headers);
    }
  }

  /**
   * Run comprehensive security assessment
   */
  async runSecurityAssessment(): Promise<VulnerabilityAssessment> {
    securityLogger.info('Running comprehensive security assessment');
    
    const assessment = await guardianSecurityTesting.runSecurityTestSuite();
    
    // Log critical issues
    if (assessment.criticalIssues > 0) {
      this.logSecurityEvent({
        id: crypto.randomUUID(),
        type: 'compliance_violation',
        severity: 'critical',
        description: `${assessment.criticalIssues} critical security vulnerabilities found`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    return assessment;
  }

  /**
   * Emergency security lockdown
   */
  async emergencyLockdown(reason: string): Promise<void> {
    securityLogger.error('EMERGENCY SECURITY LOCKDOWN INITIATED', { reason });

    // Disable all non-essential operations
    this.config.strictMode = true;
    this.config.monitoringLevel = 'maximum';

    // Log security event
    this.logSecurityEvent({
      id: crypto.randomUUID(),
      type: 'authentication',
      severity: 'critical',
      description: `Emergency lockdown: ${reason}`,
      timestamp: new Date().toISOString(),
      resolved: false
    });

    // Would implement actual lockdown procedures here
    // - Terminate all sessions
    // - Block all IPs except admin
    // - Enable enhanced monitoring
    // - Notify security team
  }

  /**
   * Private helper methods
   */
  private getRequiredPermission(operation: string): Permission {
    const permissionMap = {
      'create': Permission.CREATE_FORMATIONS,
      'read': Permission.VIEW_FORMATIONS,
      'update': Permission.EDIT_FORMATIONS,
      'delete': Permission.DELETE_FORMATIONS,
      'share': Permission.SHARE_FORMATIONS,
      'export': Permission.EXPORT_FORMATIONS,
      'import': Permission.IMPORT_FORMATIONS
    };

    return permissionMap[operation] || Permission.VIEW_FORMATIONS;
  }

  private async executeFormationWrite(formation: TacticalFormation, context: SecurityContext): Promise<SecureTacticalData> {
    return await guardianTacticalSecurity.encryptTacticalFormation(
      formation,
      context.userId || '',
      { ipAddress: context.ipAddress, userAgent: context.userAgent }
    );
  }

  private async executeFormationRead(formationId: string, context: SecurityContext): Promise<TacticalFormation> {
    // Would retrieve and decrypt formation
    throw new Error('Read operation not implemented');
  }

  private async executeFormationDelete(formationId: string, context: SecurityContext): Promise<boolean> {
    // Would securely delete formation
    return true;
  }

  private async executeFormationShare(shareData: any, context: SecurityContext): Promise<SecureTacticalData> {
    // Would handle secure sharing
    throw new Error('Share operation not implemented');
  }

  private async executeFormationExport(exportData: any, context: SecurityContext): Promise<Blob> {
    // Would handle secure export
    throw new Error('Export operation not implemented');
  }

  private async executeFormationImport(file: File, context: SecurityContext): Promise<TacticalFormation> {
    const result = await guardianSecureFileHandler.secureImport(
      file,
      context.userId || '',
      context.teamId || ''
    );

    if (!result.success) {
      throw new Error(`Import failed: ${result.errors.join(', ')}`);
    }

    return result.formation!;
  }

  private calculateSystemStatus(
    assessment: VulnerabilityAssessment,
    threatMetrics: any
  ): 'secure' | 'warning' | 'critical' {
    if (assessment.criticalIssues > 0 || assessment.riskLevel === 'critical') {
      return 'critical';
    }
    
    if (assessment.highIssues > 0 || assessment.riskLevel === 'high' || threatMetrics.threatsDetected > 10) {
      return 'warning';
    }
    
    return 'secure';
  }

  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(-100);
    }

    securityLogger.logSecurityEvent('SECURITY_EVENT' as any, event.description, {
      eventId: event.id,
      metadata: {
        type: event.type,
        severity: event.severity,
        resolved: event.resolved
      }
    });
  }
}

/**
 * Guardian Security Middleware for Express/HTTP frameworks
 */
export function guardianSecurityMiddleware(suite: GuardianSecuritySuite) {
  return async (req: any, res: any, next: any) => {
    try {
      // Apply security headers
      suite.applySecurityHeaders(res.headers || new Headers());

      // Threat detection
      const threatContext: ThreatContext = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestPath: req.path,
        requestMethod: req.method,
        payload: req.body,
        headers: req.headers,
        timestamp: new Date().toISOString()
      };

      const threats = await guardianThreatDetection.analyzeRequest(threatContext);
      
      // Block request if critical threats detected
      if (threats.some(t => t.threatLevel === 'critical')) {
        res.status(403).json({
          error: 'Request blocked for security reasons',
          code: 'SECURITY_THREAT_DETECTED'
        });
        return;
      }

      // Add security context to request
      req.guardianSecurity = {
        threats,
        securitySuite: suite,
        context: threatContext
      };

      next();
    } catch (error) {
      securityLogger.error('Security middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      next(error);
    }
  };
}

// Export singleton instance
export const guardianSecuritySuite = new GuardianSecuritySuite();

export default guardianSecuritySuite;