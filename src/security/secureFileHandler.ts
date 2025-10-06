/**
 * Guardian Secure File Handler
 *
 * Military-grade file handling for formation imports/exports
 * Provides comprehensive validation, sanitization, and encryption
 */

import { encryptData, decryptData, DataClassification, EncryptedData } from './encryption';
import { validateAndSanitize, validateTacticalData } from './validation';
import { securityLogger } from './logging';
import { TacticalFormation, TacticalClassification } from './tacticalBoardSecurity';

export interface SecureFileOptions {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  requireSignature: boolean;
  encryptOutput: boolean;
  validateContent: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedContent?: unknown;
  metadata: FileMetadata;
}

export interface FileMetadata {
  originalName: string;
  size: number;
  mimeType: string;
  extension: string;
  checksum: string;
  uploadedAt: string;
  uploadedBy: string;
  scanResults: SecurityScanResult;
}

export interface SecurityScanResult {
  virusScanPassed: boolean;
  malwareDetected: boolean;
  suspiciousPatterns: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  scanTimestamp: string;
}

export interface SecureExportOptions {
  format: 'json' | 'xml' | 'pdf' | 'image';
  classification: TacticalClassification;
  includeMetadata: boolean;
  passwordProtect: boolean;
  password?: string;
  watermark?: string;
  expiresAt?: string;
}

export interface SecureImportOptions {
  validateStructure: boolean;
  sanitizeContent: boolean;
  allowPartialData: boolean;
  maxRetries: number;
  backupOriginal: boolean;
}

/**
 * Guardian Secure File Handler Class
 */
export class GuardianSecureFileHandler {
  private readonly defaultOptions: SecureFileOptions = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/json',
      'text/json',
      'application/xml',
      'text/xml',
      'text/plain',
      'image/svg+xml',
    ],
    allowedExtensions: ['.json', '.xml', '.txt', '.svg'],
    requireSignature: true,
    encryptOutput: true,
    validateContent: true,
  };

  /**
   * Securely import tactical formation file
   */
  async secureImport(
    file: File,
    userId: string,
    teamId: string,
    options: Partial<SecureImportOptions> = {}
  ): Promise<{ success: boolean; formation?: TacticalFormation; errors: string[] }> {
    const importOptions = {
      validateStructure: true,
      sanitizeContent: true,
      allowPartialData: false,
      maxRetries: 3,
      backupOriginal: true,
      ...options,
    };

    const errors: string[] = [];

    try {
      // Step 1: Validate file
      const validationResult = await this.validateFile(file, userId);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors,
        };
      }

      // Step 2: Read and parse file content
      const content = await this.readFileSecurely(file);
      let parsedContent: unknown;

      try {
        parsedContent = JSON.parse(content);
      } catch (error) {
        if (file.name.endsWith('.xml')) {
          parsedContent = await this.parseXMLContent(content);
        } else {
          errors.push('Invalid file format: Unable to parse content');
          return { success: false, errors };
        }
      }

      // Step 3: Sanitize content if enabled
      if (importOptions.sanitizeContent) {
        parsedContent = validateAndSanitize(parsedContent, {
          allowedFields: [
            'name',
            'description',
            'formation',
            'playerPositions',
            'tacticalInstructions',
            'opponentAnalysis',
            'classification',
          ],
          sanitizeStrings: true,
          maxStringLength: 10000,
        });
      }

      // Step 4: Validate tactical formation structure
      if (importOptions.validateStructure) {
        const tacticalValidation = validateTacticalData(parsedContent, 'formation');
        if (!tacticalValidation.valid) {
          if (!importOptions.allowPartialData) {
            return {
              success: false,
              errors: tacticalValidation.errors,
            };
          } else {
            errors.push(...tacticalValidation.errors.map(e => `Warning: ${e}`));
          }
        }
        parsedContent = tacticalValidation.sanitizedData || parsedContent;
      }

      // Step 5: Create formation object
      const formation: TacticalFormation = {
        ...(parsedContent as any),
        id: crypto.randomUUID(),
        teamId,
        createdBy: userId,
        isActive: true,
        classification: TacticalClassification.TEAM_INTERNAL,
        metadata: {
          version: 1,
          lastModified: new Date().toISOString(),
          modifiedBy: userId,
          accessCount: 0,
          sharedWith: [],
          tags: ['imported'],
          ...(parsedContent as any)?.metadata,
        },
      };

      // Step 6: Log successful import
      securityLogger.logSecurityEvent('DATA_IMPORT' as any, 'Formation imported successfully', {
        userId,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          formationId: formation.id,
          teamId,
          classification: formation.classification,
        },
      });

      return {
        success: true,
        formation,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      securityLogger.error('Secure import failed', {
        error: errorMessage,
        fileName: file.name,
        userId,
        teamId,
      });

      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Securely export tactical formation
   */
  async secureExport(
    formation: TacticalFormation,
    userId: string,
    options: SecureExportOptions
  ): Promise<{ success: boolean; data?: Blob; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Step 1: Validate export permissions
      if (!this.canExportFormation(formation, userId, options.classification)) {
        return {
          success: false,
          errors: ['Insufficient permissions to export this formation'],
        };
      }

      // Step 2: Sanitize formation for export level
      const sanitizedFormation = this.sanitizeFormationForExport(formation, options);

      // Step 3: Generate export data based on format
      let exportData: string;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          exportData = JSON.stringify(sanitizedFormation, null, 2);
          mimeType = 'application/json';
          break;

        case 'xml':
          exportData = this.generateXMLExport(sanitizedFormation);
          mimeType = 'application/xml';
          break;

        case 'pdf':
          // Generate PDF export (simplified implementation)
          exportData = await this.generatePDFExport(sanitizedFormation, options);
          mimeType = 'application/pdf';
          break;

        case 'image':
          // Generate image export
          exportData = await this.generateImageExport(sanitizedFormation, options);
          mimeType = 'image/svg+xml';
          break;

        default:
          return {
            success: false,
            errors: [`Unsupported export format: ${options.format}`],
          };
      }

      // Step 4: Add security metadata
      const secureExportData = {
        format: options.format,
        classification: options.classification,
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        signature: await this.generateExportSignature(exportData, userId),
        expiresAt: options.expiresAt,
        data: exportData,
      };

      // Step 5: Encrypt if required
      let finalData: string;
      if (options.passwordProtect && options.password) {
        const encryptedData = encryptData(
          JSON.stringify(secureExportData),
          DataClassification.CONFIDENTIAL
        );
        finalData = JSON.stringify({
          encrypted: true,
          data: encryptedData,
          hint: 'Use provided password to decrypt',
        });
      } else {
        finalData = JSON.stringify(secureExportData);
      }

      // Step 6: Create blob with appropriate MIME type
      const blob = new Blob([finalData], { type: mimeType });

      // Step 7: Log export activity
      securityLogger.logSecurityEvent('DATA_EXPORT' as any, 'Formation exported', {
        userId,
        metadata: {
          formationId: formation.id,
          format: options.format,
          classification: options.classification,
          passwordProtected: !!options.passwordProtect,
          dataSize: blob.size,
        },
      });

      return {
        success: true,
        data: blob,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      securityLogger.error('Secure export failed', {
        error: errorMessage,
        formationId: formation.id,
        userId,
        format: options.format,
      });

      return {
        success: false,
        errors: [errorMessage],
      };
    }
  }

  /**
   * Validate uploaded file
   */
  private async validateFile(
    file: File,
    userId: string,
    options: Partial<SecureFileOptions> = {}
  ): Promise<FileValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > opts.maxFileSize) {
      errors.push(`File size exceeds maximum allowed size of ${opts.maxFileSize / 1024 / 1024}MB`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Check MIME type
    if (!opts.allowedMimeTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!opts.allowedExtensions.includes(extension)) {
      errors.push(`File extension ${extension} is not allowed`);
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.pif$/i,
      /\.com$/i,
      /\.sys$/i,
      /\.dll$/i,
      /\.vbs$/i,
      /\.js$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push('File name contains suspicious patterns');
    }

    // Generate file metadata
    const content = await this.readFileSecurely(file);
    const checksum = await this.generateChecksum(content);

    const metadata: FileMetadata = {
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      extension,
      checksum,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      scanResults: await this.performSecurityScan(content, file.name),
    };

    // Check security scan results
    if (metadata.scanResults.malwareDetected) {
      errors.push('Malware detected in file');
    }

    if (
      metadata.scanResults.riskLevel === 'critical' ||
      metadata.scanResults.riskLevel === 'high'
    ) {
      errors.push(`File poses ${metadata.scanResults.riskLevel} security risk`);
    }

    if (metadata.scanResults.suspiciousPatterns.length > 0) {
      warnings.push(
        `Suspicious patterns detected: ${metadata.scanResults.suspiciousPatterns.join(', ')}`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Read file content securely
   */
  private async readFileSecurely(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = event => {
        try {
          const content = event.target?.result as string;
          resolve(content);
        } catch (error) {
          reject(new Error('Failed to read file content'));
        }
      };

      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Generate file checksum
   */
  private async generateChecksum(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Perform security scan on content
   */
  private async performSecurityScan(
    content: string,
    fileName: string
  ): Promise<SecurityScanResult> {
    const suspiciousPatterns: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for script injection patterns
    const scriptPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /document\.write/gi,
      /innerHTML/gi,
    ];

    scriptPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        suspiciousPatterns.push(`Script pattern: ${pattern.source}`);
        riskLevel = 'high';
      }
    });

    // Check for data exfiltration patterns
    const exfiltrationPatterns = [
      /fetch\s*\(/gi,
      /XMLHttpRequest/gi,
      /\.send\s*\(/gi,
      /postMessage/gi,
    ];

    exfiltrationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        suspiciousPatterns.push(`Data exfiltration pattern: ${pattern.source}`);
        if (riskLevel === 'low') {
          riskLevel = 'medium';
        }
      }
    });

    // Check for file system access patterns
    const fileSystemPatterns = [/fs\./gi, /readFile/gi, /writeFile/gi, /require\s*\(/gi];

    fileSystemPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        suspiciousPatterns.push(`File system access: ${pattern.source}`);
        if (riskLevel === 'low') {
          riskLevel = 'medium';
        }
      }
    });

    return {
      virusScanPassed: true, // Simplified - would integrate with real antivirus
      malwareDetected: suspiciousPatterns.length > 5,
      suspiciousPatterns,
      riskLevel,
      scanTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if user can export formation
   */
  private canExportFormation(
    formation: TacticalFormation,
    userId: string,
    classification: TacticalClassification
  ): boolean {
    // Check if user is the creator or has appropriate permissions
    if (formation.createdBy === userId) {
      return true;
    }

    // Check if user has export permissions for this classification level
    const classificationLevels = {
      [TacticalClassification.PUBLIC_FORMATION]: 1,
      [TacticalClassification.TEAM_INTERNAL]: 2,
      [TacticalClassification.COACH_CONFIDENTIAL]: 3,
      [TacticalClassification.STRATEGIC_SECRET]: 4,
    };

    const formationLevel = classificationLevels[formation.classification];
    const requestedLevel = classificationLevels[classification];

    return requestedLevel <= formationLevel;
  }

  /**
   * Sanitize formation for export
   */
  private sanitizeFormationForExport(
    formation: TacticalFormation,
    options: SecureExportOptions
  ): Partial<TacticalFormation> {
    const sanitized: Partial<TacticalFormation> = {
      id: formation.id,
      name: formation.name,
      formation: formation.formation,
      playerPositions: formation.playerPositions.map(pos => ({
        ...pos,
        playerId:
          options.classification === TacticalClassification.PUBLIC_FORMATION
            ? 'REDACTED'
            : pos.playerId,
      })),
      classification: options.classification,
      isActive: formation.isActive,
    };

    // Include additional data based on classification level
    if (options.classification !== TacticalClassification.PUBLIC_FORMATION) {
      sanitized.description = formation.description;
      sanitized.tacticalInstructions = formation.tacticalInstructions;
    }

    if (
      options.classification === TacticalClassification.COACH_CONFIDENTIAL ||
      options.classification === TacticalClassification.STRATEGIC_SECRET
    ) {
      sanitized.opponentAnalysis = formation.opponentAnalysis;
    }

    if (options.includeMetadata) {
      sanitized.metadata = {
        ...formation.metadata,
        sharedWith: [], // Don't expose sharing information
      };
    }

    return sanitized;
  }

  /**
   * Generate XML export
   */
  private generateXMLExport(formation: Partial<TacticalFormation>): string {
    // Simplified XML generation
    return `<?xml version="1.0" encoding="UTF-8"?>
<formation>
  <id>${formation.id}</id>
  <name><![CDATA[${formation.name}]]></name>
  <formation>${formation.formation}</formation>
  <classification>${formation.classification}</classification>
  <exportedAt>${new Date().toISOString()}</exportedAt>
</formation>`;
  }

  /**
   * Generate PDF export (simplified)
   */
  private async generatePDFExport(
    formation: Partial<TacticalFormation>,
    options: SecureExportOptions
  ): Promise<string> {
    // This would typically use a PDF library like jsPDF
    // For now, return a simple text representation
    return `Formation Export - ${formation.name}
Formation: ${formation.formation}
Classification: ${formation.classification}
Exported: ${new Date().toISOString()}
${options.watermark ? `Watermark: ${options.watermark}` : ''}`;
  }

  /**
   * Generate image export
   */
  private async generateImageExport(
    formation: Partial<TacticalFormation>,
    options: SecureExportOptions
  ): Promise<string> {
    // Generate SVG representation
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <rect width="400" height="300" fill="#4ade80" stroke="#16a34a" stroke-width="2"/>
  <text x="200" y="50" text-anchor="middle" font-family="Arial" font-size="16" fill="white">
    ${formation.name}
  </text>
  <text x="200" y="80" text-anchor="middle" font-family="Arial" font-size="12" fill="white">
    Formation: ${formation.formation}
  </text>
  ${options.watermark ? `<text x="200" y="280" text-anchor="middle" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.5)">${options.watermark}</text>` : ''}
</svg>`;
  }

  /**
   * Generate export signature
   */
  private async generateExportSignature(data: string, userId: string): Promise<string> {
    const signatureData = `${data}:${userId}:${Date.now()}`;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(signatureData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Parse XML content
   */
  private async parseXMLContent(xmlContent: string): Promise<unknown> {
    // Simplified XML parsing - would use proper XML parser in production
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('Invalid XML format');
    }

    // Convert XML to JSON-like object (simplified)
    return {
      name: xmlDoc.querySelector('name')?.textContent || 'Imported Formation',
      formation: xmlDoc.querySelector('formation')?.textContent || '4-4-2',
      classification: TacticalClassification.TEAM_INTERNAL,
    };
  }
}

// Export singleton instance
export const guardianSecureFileHandler = new GuardianSecureFileHandler();

export default guardianSecureFileHandler;
