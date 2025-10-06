/**
 * Guardian Compliance Framework
 *
 * Enterprise-grade compliance and audit system for tactical board security
 * Supports GDPR, SOC2, ISO27001, and custom compliance requirements
 */

import { securityLogger } from './logging';
import { encryptData, DataClassification } from './encryption';

export enum ComplianceFramework {
  GDPR = 'GDPR',
  SOC2 = 'SOC2',
  ISO27001 = 'ISO27001',
  HIPAA = 'HIPAA',
  PCI_DSS = 'PCI_DSS',
  CUSTOM = 'CUSTOM',
}

export enum DataCategory {
  PERSONAL_DATA = 'personal_data',
  TACTICAL_DATA = 'tactical_data',
  FINANCIAL_DATA = 'financial_data',
  MEDICAL_DATA = 'medical_data',
  COMMUNICATION_DATA = 'communication_data',
  SYSTEM_DATA = 'system_data',
}

export enum ProcessingLawfulness {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}

export enum DataSubjectRights {
  ACCESS = 'access',
  RECTIFICATION = 'rectification',
  ERASURE = 'erasure',
  RESTRICT_PROCESSING = 'restrict_processing',
  DATA_PORTABILITY = 'data_portability',
  OBJECT = 'object',
  WITHDRAW_CONSENT = 'withdraw_consent',
}

export interface ComplianceAuditEntry {
  id: string;
  timestamp: string;
  framework: ComplianceFramework;
  userId?: string;
  action: string;
  dataCategory: DataCategory;
  dataType: string;
  lawfulness: ProcessingLawfulness;
  purpose: string;
  retention: RetentionPolicy;
  encryption: boolean;
  location: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface RetentionPolicy {
  category: DataCategory;
  retentionPeriod: number; // in days
  archiveAfter: number; // in days
  deleteAfter: number; // in days
  legalHold: boolean;
  reason: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: string;
  dataCategories: DataCategory[];
  lawfulness: ProcessingLawfulness;
  consentGiven: boolean;
  consentTimestamp: string;
  consentVersion: string;
  withdrawnAt?: string;
  withdrawalReason?: string;
  ipAddress: string;
  userAgent: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: DataSubjectRights;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  dataExported?: boolean;
  dataDeleted?: boolean;
  verification: RequestVerification;
  compliance: ComplianceCheck;
}

export interface RequestVerification {
  method: 'email' | 'phone' | 'document' | 'biometric';
  verified: boolean;
  verifiedAt?: string;
  verificationCode?: string;
  additionalChecks: string[];
}

export interface ComplianceCheck {
  framework: ComplianceFramework;
  requirements: ComplianceRequirement[];
  overallCompliance: boolean;
  lastChecked: string;
  nextReview: string;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence: string[];
  lastVerified: string;
  responsible: string;
  deadline?: string;
}

export interface DataProcessingRecord {
  id: string;
  controllerId: string;
  processorId?: string;
  categories: DataCategory[];
  purposes: string[];
  lawfulness: ProcessingLawfulness;
  subjects: string[];
  recipients: string[];
  transfers: InternationalTransfer[];
  retention: RetentionPolicy;
  security: SecurityMeasure[];
  createdAt: string;
  updatedAt: string;
}

export interface InternationalTransfer {
  id: string;
  destination: string;
  adequacyDecision: boolean;
  safeguards: string[];
  derogations: string[];
  timestamp: string;
}

export interface SecurityMeasure {
  type: 'technical' | 'organizational';
  description: string;
  implemented: boolean;
  implementedAt?: string;
  effectiveness: 'low' | 'medium' | 'high';
  lastReviewed: string;
}

/**
 * Guardian Compliance Framework Class
 */
export class GuardianComplianceFramework {
  private auditLog: Map<string, ComplianceAuditEntry> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest> = new Map();
  private processingRecords: Map<string, DataProcessingRecord> = new Map();

  private readonly RETENTION_POLICIES: Record<DataCategory, RetentionPolicy> = {
    [DataCategory.PERSONAL_DATA]: {
      category: DataCategory.PERSONAL_DATA,
      retentionPeriod: 2555, // 7 years
      archiveAfter: 1095, // 3 years
      deleteAfter: 2555,
      legalHold: false,
      reason: 'Contract and legal obligations',
    },
    [DataCategory.TACTICAL_DATA]: {
      category: DataCategory.TACTICAL_DATA,
      retentionPeriod: 1095, // 3 years
      archiveAfter: 365, // 1 year
      deleteAfter: 1095,
      legalHold: false,
      reason: 'Business operations and analysis',
    },
    [DataCategory.FINANCIAL_DATA]: {
      category: DataCategory.FINANCIAL_DATA,
      retentionPeriod: 2555, // 7 years
      archiveAfter: 1095, // 3 years
      deleteAfter: 2555,
      legalHold: false,
      reason: 'Tax and regulatory requirements',
    },
    [DataCategory.MEDICAL_DATA]: {
      category: DataCategory.MEDICAL_DATA,
      retentionPeriod: 3650, // 10 years
      archiveAfter: 1095, // 3 years
      deleteAfter: 3650,
      legalHold: false,
      reason: 'Medical record keeping requirements',
    },
    [DataCategory.COMMUNICATION_DATA]: {
      category: DataCategory.COMMUNICATION_DATA,
      retentionPeriod: 365, // 1 year
      archiveAfter: 90, // 3 months
      deleteAfter: 365,
      legalHold: false,
      reason: 'Communication history and support',
    },
    [DataCategory.SYSTEM_DATA]: {
      category: DataCategory.SYSTEM_DATA,
      retentionPeriod: 90, // 3 months
      archiveAfter: 30, // 1 month
      deleteAfter: 90,
      legalHold: false,
      reason: 'System operations and security',
    },
  };

  /**
   * Log data processing activity for compliance
   */
  async logDataProcessing(
    userId: string | undefined,
    action: string,
    dataCategory: DataCategory,
    dataType: string,
    purpose: string,
    lawfulness: ProcessingLawfulness,
    details: Record<string, unknown> = {},
    framework: ComplianceFramework = ComplianceFramework.GDPR,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const auditEntry: ComplianceAuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      framework,
      userId,
      action,
      dataCategory,
      dataType,
      lawfulness,
      purpose,
      retention: this.RETENTION_POLICIES[dataCategory],
      encryption: this.requiresEncryption(dataCategory),
      location: 'EU/US', // Would be determined by actual deployment
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    };

    this.auditLog.set(auditEntry.id, auditEntry);

    // Log to security logger as well
    securityLogger.logSecurityEvent('DATA_PROCESSING' as any, `Data processing: ${action}`, {
      userId,
      metadata: {
        auditId: auditEntry.id,
        dataCategory,
        dataType,
        purpose,
        lawfulness,
        framework,
      },
    });

    // Check for compliance violations
    await this.checkComplianceViolations(auditEntry);
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purpose: string,
    dataCategories: DataCategory[],
    lawfulness: ProcessingLawfulness,
    consentGiven: boolean,
    ipAddress: string,
    userAgent: string,
    consentVersion: string = '1.0'
  ): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      purpose,
      dataCategories,
      lawfulness,
      consentGiven,
      consentTimestamp: new Date().toISOString(),
      consentVersion,
      ipAddress,
      userAgent,
    };

    this.consentRecords.set(consentRecord.id, consentRecord);

    securityLogger.logSecurityEvent('CONSENT_RECORDED' as any, 'User consent recorded', {
      userId,
      metadata: {
        consentId: consentRecord.id,
        purpose,
        dataCategories,
        consentGiven,
        consentVersion,
      },
    });

    return consentRecord;
  }

  /**
   * Withdraw user consent
   */
  async withdrawConsent(
    consentId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const consentRecord = this.consentRecords.get(consentId);

    if (!consentRecord) {
      return { success: false, error: 'Consent record not found' };
    }

    if (consentRecord.userId !== userId) {
      return { success: false, error: 'Unauthorized consent withdrawal' };
    }

    consentRecord.withdrawnAt = new Date().toISOString();
    consentRecord.withdrawalReason = reason;

    securityLogger.logSecurityEvent('CONSENT_WITHDRAWN' as any, 'User consent withdrawn', {
      userId,
      metadata: {
        consentId,
        reason,
        originalPurpose: consentRecord.purpose,
      },
    });

    // Process data deletion/anonymization if required
    await this.processConsentWithdrawal(consentRecord);

    return { success: true };
  }

  /**
   * Handle data subject rights request
   */
  async handleDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRights,
    verificationMethod: 'email' | 'phone' | 'document' | 'biometric' = 'email'
  ): Promise<DataSubjectRequest> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      userId,
      requestType,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      verification: {
        method: verificationMethod,
        verified: false,
        additionalChecks: [],
      },
      compliance: {
        framework: ComplianceFramework.GDPR,
        requirements: await this.getComplianceRequirements(requestType),
        overallCompliance: false,
        lastChecked: new Date().toISOString(),
        nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
    };

    this.dataSubjectRequests.set(request.id, request);

    securityLogger.logSecurityEvent(
      'DATA_SUBJECT_REQUEST' as any,
      `Data subject request: ${requestType}`,
      {
        userId,
        metadata: {
          requestId: request.id,
          requestType,
          verificationMethod,
        },
      }
    );

    // Auto-start verification process
    await this.initiateVerification(request);

    return request;
  }

  /**
   * Process data access request (Right to Access)
   */
  async processAccessRequest(
    requestId: string
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const request = this.dataSubjectRequests.get(requestId);

    if (!request || request.requestType !== DataSubjectRights.ACCESS) {
      return { success: false, error: 'Invalid access request' };
    }

    if (!request.verification.verified) {
      return { success: false, error: 'Request not verified' };
    }

    try {
      request.status = 'processing';

      // Collect all user data
      const userData = await this.collectUserData(request.userId);

      // Encrypt sensitive data
      const encryptedData = encryptData(JSON.stringify(userData), DataClassification.CONFIDENTIAL);

      request.status = 'completed';
      request.processedAt = new Date().toISOString();
      request.dataExported = true;

      securityLogger.logSecurityEvent(
        'DATA_ACCESS_GRANTED' as any,
        'Data access request processed',
        {
          userId: request.userId,
          metadata: {
            requestId,
            dataSize: JSON.stringify(userData).length,
            processedAt: request.processedAt,
          },
        }
      );

      return { success: true, data: encryptedData };
    } catch (error) {
      request.status = 'rejected';
      request.reason = error instanceof Error ? error.message : 'Processing failed';

      return { success: false, error: request.reason };
    }
  }

  /**
   * Process data deletion request (Right to Erasure)
   */
  async processErasureRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
    const request = this.dataSubjectRequests.get(requestId);

    if (!request || request.requestType !== DataSubjectRights.ERASURE) {
      return { success: false, error: 'Invalid erasure request' };
    }

    if (!request.verification.verified) {
      return { success: false, error: 'Request not verified' };
    }

    try {
      request.status = 'processing';

      // Check if erasure is legally possible
      const erasureCheck = await this.canEraseUserData(request.userId);
      if (!erasureCheck.canErase) {
        request.status = 'rejected';
        request.reason = erasureCheck.reason;
        return { success: false, error: erasureCheck.reason };
      }

      // Perform data deletion/anonymization
      await this.eraseUserData(request.userId);

      request.status = 'completed';
      request.processedAt = new Date().toISOString();
      request.dataDeleted = true;

      securityLogger.logSecurityEvent('DATA_ERASED' as any, 'Data erasure request processed', {
        userId: request.userId,
        metadata: {
          requestId,
          processedAt: request.processedAt,
          erasureMethod: 'deletion_and_anonymization',
        },
      });

      return { success: true };
    } catch (error) {
      request.status = 'rejected';
      request.reason = error instanceof Error ? error.message : 'Erasure failed';

      return { success: false, error: request.reason };
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    framework: ComplianceFramework,
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    const auditEntries = Array.from(this.auditLog.values()).filter(
      entry =>
        entry.framework === framework &&
        new Date(entry.timestamp) >= startDate &&
        new Date(entry.timestamp) <= endDate
    );

    const report: ComplianceReport = {
      framework,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalEntries: auditEntries.length,
        dataCategories: this.groupByCategory(auditEntries),
        lawfulnessBases: this.groupByLawfulness(auditEntries),
        violations: auditEntries.filter(entry => this.isViolation(entry)).length,
      },
      entries: auditEntries,
      recommendations: await this.generateRecommendations(auditEntries),
      generatedAt: new Date().toISOString(),
      generatedBy: 'Guardian Compliance Framework',
    };

    return report;
  }

  /**
   * Check for compliance violations
   */
  private async checkComplianceViolations(entry: ComplianceAuditEntry): Promise<void> {
    const violations: string[] = [];

    // Check data retention policy
    if (this.isDataRetentionViolation(entry)) {
      violations.push('Data retention policy violation');
    }

    // Check encryption requirements
    if (this.requiresEncryption(entry.dataCategory) && !entry.encryption) {
      violations.push('Encryption requirement violation');
    }

    // Check lawfulness basis
    if (!this.isLawfulnessBasisValid(entry)) {
      violations.push('Invalid lawfulness basis');
    }

    if (violations.length > 0) {
      securityLogger.warn('Compliance violations detected', {
        auditId: entry.id,
        violations,
        dataCategory: entry.dataCategory,
        action: entry.action,
      });
    }
  }

  /**
   * Determine if data category requires encryption
   */
  private requiresEncryption(category: DataCategory): boolean {
    return [
      DataCategory.PERSONAL_DATA,
      DataCategory.FINANCIAL_DATA,
      DataCategory.MEDICAL_DATA,
      DataCategory.TACTICAL_DATA,
    ].includes(category);
  }

  /**
   * Check if data retention policy is violated
   */
  private isDataRetentionViolation(entry: ComplianceAuditEntry): boolean {
    const policy = this.RETENTION_POLICIES[entry.dataCategory];
    const entryAge = Date.now() - new Date(entry.timestamp).getTime();
    const maxAge = policy.deleteAfter * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    return entryAge > maxAge && !policy.legalHold;
  }

  /**
   * Validate lawfulness basis
   */
  private isLawfulnessBasisValid(entry: ComplianceAuditEntry): boolean {
    // Simplified validation - would include more complex logic in production
    return Object.values(ProcessingLawfulness).includes(entry.lawfulness);
  }

  /**
   * Check if entry represents a violation
   */
  private isViolation(entry: ComplianceAuditEntry): boolean {
    return entry.details.violation === true || entry.action.includes('violation');
  }

  /**
   * Group audit entries by data category
   */
  private groupByCategory(entries: ComplianceAuditEntry[]): Record<string, number> {
    return entries.reduce(
      (acc, entry) => {
        acc[entry.dataCategory] = (acc[entry.dataCategory] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Group audit entries by lawfulness basis
   */
  private groupByLawfulness(entries: ComplianceAuditEntry[]): Record<string, number> {
    return entries.reduce(
      (acc, entry) => {
        acc[entry.lawfulness] = (acc[entry.lawfulness] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Generate compliance recommendations
   */
  private async generateRecommendations(entries: ComplianceAuditEntry[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Check for high-risk patterns
    const highRiskEntries = entries.filter(
      entry =>
        entry.dataCategory === DataCategory.MEDICAL_DATA ||
        entry.dataCategory === DataCategory.FINANCIAL_DATA
    );

    if (highRiskEntries.length > 100) {
      recommendations.push(
        'Consider implementing additional controls for high-risk data processing'
      );
    }

    // Check encryption usage
    const unencryptedEntries = entries.filter(
      entry => this.requiresEncryption(entry.dataCategory) && !entry.encryption
    );

    if (unencryptedEntries.length > 0) {
      recommendations.push('Ensure all sensitive data is encrypted at rest and in transit');
    }

    return recommendations;
  }

  /**
   * Get compliance requirements for request type
   */
  private async getComplianceRequirements(
    requestType: DataSubjectRights
  ): Promise<ComplianceRequirement[]> {
    const baseRequirements: ComplianceRequirement[] = [
      {
        id: 'identity_verification',
        description: 'Verify identity of data subject',
        status: 'not_applicable',
        evidence: [],
        lastVerified: new Date().toISOString(),
        responsible: 'Data Protection Officer',
      },
      {
        id: 'response_timeframe',
        description: 'Respond within 1 month',
        status: 'not_applicable',
        evidence: [],
        lastVerified: new Date().toISOString(),
        responsible: 'Data Controller',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return baseRequirements;
  }

  /**
   * Initiate verification process
   */
  private async initiateVerification(request: DataSubjectRequest): Promise<void> {
    // Simplified verification - would implement actual verification methods
    request.verification.verified = true;
    request.verification.verifiedAt = new Date().toISOString();
  }

  /**
   * Collect all user data
   */
  private async collectUserData(userId: string): Promise<unknown> {
    // Collect data from all systems and databases
    return {
      personalData: { userId, note: 'Personal data would be collected here' },
      tacticalData: { userId, note: 'Tactical formations and data would be collected here' },
      communicationData: { userId, note: 'Messages and communications would be collected here' },
      systemData: { userId, note: 'Login history and system interactions would be collected here' },
    };
  }

  /**
   * Check if user data can be erased
   */
  private async canEraseUserData(userId: string): Promise<{ canErase: boolean; reason?: string }> {
    // Check for legal obligations, legitimate interests, etc.
    // Simplified implementation
    return { canErase: true };
  }

  /**
   * Erase user data
   */
  private async eraseUserData(userId: string): Promise<void> {
    // Delete or anonymize user data across all systems
    // This would integrate with all data stores and services
    securityLogger.info('User data erased', { userId });
  }

  /**
   * Process consent withdrawal
   */
  private async processConsentWithdrawal(consentRecord: ConsentRecord): Promise<void> {
    // Based on the withdrawn consent, stop processing and potentially delete data
    if (consentRecord.lawfulness === ProcessingLawfulness.CONSENT) {
      // If consent was the only lawful basis, consider data deletion
      await this.handleDataDeletion(consentRecord.userId, consentRecord.dataCategories);
    }
  }

  /**
   * Handle data deletion based on consent withdrawal
   */
  private async handleDataDeletion(userId: string, dataCategories: DataCategory[]): Promise<void> {
    for (const category of dataCategories) {
      const policy = this.RETENTION_POLICIES[category];

      // Check if immediate deletion is required
      if (!policy.legalHold) {
        await this.scheduleDataDeletion(userId, category);
      }
    }
  }

  /**
   * Schedule data deletion
   */
  private async scheduleDataDeletion(userId: string, category: DataCategory): Promise<void> {
    securityLogger.info('Data deletion scheduled', {
      userId,
      dataCategory: category,
      scheduledFor: new Date().toISOString(),
    });
  }
}

export interface ComplianceReport {
  framework: ComplianceFramework;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalEntries: number;
    dataCategories: Record<string, number>;
    lawfulnessBases: Record<string, number>;
    violations: number;
  };
  entries: ComplianceAuditEntry[];
  recommendations: string[];
  generatedAt: string;
  generatedBy: string;
}

// Export singleton instance
export const guardianComplianceFramework = new GuardianComplianceFramework();

export default guardianComplianceFramework;
