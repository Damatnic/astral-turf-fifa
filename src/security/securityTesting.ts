/**
 * Guardian Security Testing Suite
 *
 * Comprehensive security testing and vulnerability assessment framework
 * Provides automated security tests, penetration testing tools, and compliance verification
 */

import { securityLogger } from './logging';
import { guardianThreatDetection, ThreatType, ThreatLevel } from './threatDetection';
import { validateAndSanitize, validateTacticalData } from './validation';
import { encryptData, decryptData, DataClassification } from './encryption';
import { guardianSecureFileHandler } from './secureFileHandler';

export enum TestSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum TestCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  INPUT_VALIDATION = 'input_validation',
  DATA_PROTECTION = 'data_protection',
  SESSION_MANAGEMENT = 'session_management',
  CRYPTOGRAPHY = 'cryptography',
  FILE_HANDLING = 'file_handling',
  THREAT_DETECTION = 'threat_detection',
  COMPLIANCE = 'compliance',
  CONFIGURATION = 'configuration',
}

export interface SecurityTest {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  severity: TestSeverity;
  enabled: boolean;
  test: () => Promise<TestResult>;
  expectedResult: 'pass' | 'fail';
  requirements: string[];
}

export interface TestResult {
  testId: string;
  passed: boolean;
  message: string;
  details?: unknown;
  recommendations?: string[];
  evidence?: string[];
  timestamp: string;
  executionTime: number;
}

export interface VulnerabilityAssessment {
  id: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  results: TestResult[];
  recommendations: string[];
  complianceStatus: Record<string, boolean>;
}

export interface PenetrationTestScenario {
  id: string;
  name: string;
  description: string;
  category: TestCategory;
  attackVectors: AttackVector[];
  expectedDefenses: string[];
  test: () => Promise<PenetrationTestResult>;
}

export interface AttackVector {
  type: ThreatType;
  payload: unknown;
  target: string;
  description: string;
}

export interface PenetrationTestResult {
  scenarioId: string;
  successful: boolean;
  vulnerabilitiesFound: SecurityVulnerability[];
  defensesTriggered: string[];
  recommendations: string[];
  executionTime: number;
  timestamp: string;
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: TestSeverity;
  description: string;
  location: string;
  impact: string;
  remediation: string;
  cvssScore?: number;
  references?: string[];
}

/**
 * Guardian Security Testing Suite Class
 */
export class GuardianSecurityTesting {
  private securityTests: Map<string, SecurityTest> = new Map();
  private penetrationTests: Map<string, PenetrationTestScenario> = new Map();

  constructor() {
    this.initializeSecurityTests();
    this.initializePenetrationTests();
  }

  /**
   * Run complete security test suite
   */
  async runSecurityTestSuite(): Promise<VulnerabilityAssessment> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    securityLogger.info('Starting security test suite execution');

    // Run all enabled security tests
    for (const [testId, test] of this.securityTests.entries()) {
      if (test.enabled) {
        try {
          const result = await this.executeTest(test);
          results.push(result);
        } catch (error) {
          const errorResult: TestResult = {
            testId,
            passed: false,
            message: `Test execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
          results.push(errorResult);
        }
      }
    }

    // Calculate assessment metrics
    const assessment = this.calculateAssessment(results);
    const executionTime = Date.now() - startTime;

    securityLogger.info('Security test suite completed', {
      totalTests: assessment.totalTests,
      passed: assessment.passedTests,
      failed: assessment.failedTests,
      overallScore: assessment.overallScore,
      executionTime,
    });

    return assessment;
  }

  /**
   * Run penetration tests
   */
  async runPenetrationTests(): Promise<PenetrationTestResult[]> {
    const results: PenetrationTestResult[] = [];

    securityLogger.info('Starting penetration tests');

    for (const [scenarioId, scenario] of this.penetrationTests.entries()) {
      try {
        const result = await scenario.test();
        results.push(result);

        if (result.successful) {
          securityLogger.warn('Penetration test succeeded - potential vulnerability', {
            scenarioId,
            vulnerabilities: result.vulnerabilitiesFound.length,
          });
        }
      } catch (error) {
        securityLogger.error('Penetration test failed', {
          scenarioId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Test specific security control
   */
  async testSecurityControl(testId: string): Promise<TestResult> {
    const test = this.securityTests.get(testId);
    if (!test) {
      throw new Error(`Security test not found: ${testId}`);
    }

    return await this.executeTest(test);
  }

  /**
   * Execute individual security test
   */
  private async executeTest(test: SecurityTest): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const result = await test.test();
      result.executionTime = Date.now() - startTime;

      securityLogger.info(`Security test completed: ${test.name}`, {
        testId: test.id,
        passed: result.passed,
        executionTime: result.executionTime,
      });

      return result;
    } catch (error) {
      const errorResult: TestResult = {
        testId: test.id,
        passed: false,
        message: `Test execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
      };

      securityLogger.error(`Security test failed: ${test.name}`, {
        testId: test.id,
        error: errorResult.message,
      });

      return errorResult;
    }
  }

  /**
   * Initialize security tests
   */
  private initializeSecurityTests(): void {
    const tests: SecurityTest[] = [
      // Authentication Tests
      {
        id: 'auth_001',
        name: 'Password Strength Validation',
        description: 'Verify password strength requirements are enforced',
        category: TestCategory.AUTHENTICATION,
        severity: TestSeverity.HIGH,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['Password must meet complexity requirements'],
        test: async (): Promise<TestResult> => {
          const weakPasswords = ['123456', 'password', 'admin', '12345678'];
          const results: string[] = [];

          for (const password of weakPasswords) {
            try {
              const validation = validateAndSanitize(
                { password },
                {
                  allowedFields: ['password'],
                  sanitizeStrings: true,
                }
              );

              // If weak password passes validation, it's a failure
              if (validation) {
                results.push(`Weak password accepted: ${password}`);
              }
            } catch (error) {
              // Expected behavior - weak passwords should be rejected
            }
          }

          return {
            testId: 'auth_001',
            passed: results.length === 0,
            message:
              results.length === 0
                ? 'Password validation working correctly'
                : `Weak passwords accepted: ${results.length}`,
            details: results,
            recommendations: results.length > 0 ? ['Strengthen password validation rules'] : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },

      // Input Validation Tests
      {
        id: 'input_001',
        name: 'SQL Injection Prevention',
        description: 'Test protection against SQL injection attacks',
        category: TestCategory.INPUT_VALIDATION,
        severity: TestSeverity.CRITICAL,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['Input validation must prevent SQL injection'],
        test: async (): Promise<TestResult> => {
          const sqlPayloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "'; INSERT INTO admin VALUES ('hacker', 'password'); --",
            "' UNION SELECT * FROM passwords --",
          ];

          const vulnerabilities: string[] = [];

          for (const payload of sqlPayloads) {
            try {
              const result = validateAndSanitize({ input: payload });

              // Check if dangerous SQL patterns are still present
              if (
                JSON.stringify(result).includes('DROP') ||
                JSON.stringify(result).includes('UNION') ||
                JSON.stringify(result).includes('INSERT')
              ) {
                vulnerabilities.push(`SQL injection payload not properly sanitized: ${payload}`);
              }
            } catch (error) {
              // Expected behavior - malicious input should be rejected
            }
          }

          return {
            testId: 'input_001',
            passed: vulnerabilities.length === 0,
            message:
              vulnerabilities.length === 0
                ? 'SQL injection protection working'
                : `${vulnerabilities.length} vulnerabilities found`,
            details: vulnerabilities,
            recommendations:
              vulnerabilities.length > 0
                ? ['Improve input sanitization', 'Use parameterized queries']
                : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },

      // XSS Prevention Test
      {
        id: 'input_002',
        name: 'XSS Prevention',
        description: 'Test protection against cross-site scripting attacks',
        category: TestCategory.INPUT_VALIDATION,
        severity: TestSeverity.CRITICAL,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['Input validation must prevent XSS attacks'],
        test: async (): Promise<TestResult> => {
          const xssPayloads = [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert('xss')>",
            "javascript:alert('xss')",
            "<iframe src='javascript:alert(1)'></iframe>",
          ];

          const vulnerabilities: string[] = [];

          for (const payload of xssPayloads) {
            try {
              const result = validateAndSanitize({ input: payload });

              // Check if dangerous script patterns are still present
              const resultStr = JSON.stringify(result);
              if (
                resultStr.includes('<script') ||
                resultStr.includes('javascript:') ||
                resultStr.includes('onerror=')
              ) {
                vulnerabilities.push(`XSS payload not properly sanitized: ${payload}`);
              }
            } catch (error) {
              // Expected behavior - malicious input should be rejected
            }
          }

          return {
            testId: 'input_002',
            passed: vulnerabilities.length === 0,
            message:
              vulnerabilities.length === 0
                ? 'XSS protection working'
                : `${vulnerabilities.length} vulnerabilities found`,
            details: vulnerabilities,
            recommendations:
              vulnerabilities.length > 0
                ? ['Improve HTML encoding', 'Use Content Security Policy']
                : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },

      // Data Encryption Test
      {
        id: 'crypto_001',
        name: 'Data Encryption Functionality',
        description: 'Verify data encryption and decryption works correctly',
        category: TestCategory.CRYPTOGRAPHY,
        severity: TestSeverity.HIGH,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['Sensitive data must be encrypted'],
        test: async (): Promise<TestResult> => {
          const testData = 'Sensitive tactical formation data';
          const issues: string[] = [];

          try {
            // Test encryption
            const encrypted = encryptData(testData, DataClassification.CONFIDENTIAL);

            // Verify data is actually encrypted (not plaintext)
            if (encrypted.data === testData) {
              issues.push('Data not properly encrypted');
            }

            // Test decryption
            const decrypted = decryptData(encrypted);

            // Verify decryption works
            if (decrypted !== testData) {
              issues.push('Decryption failed');
            }

            // Verify encrypted data structure
            if (!encrypted.iv || !encrypted.algorithm || !encrypted.timestamp) {
              issues.push('Encrypted data missing required metadata');
            }
          } catch (error) {
            issues.push(
              `Encryption/decryption error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }

          return {
            testId: 'crypto_001',
            passed: issues.length === 0,
            message:
              issues.length === 0
                ? 'Encryption working correctly'
                : `${issues.length} encryption issues found`,
            details: issues,
            recommendations:
              issues.length > 0 ? ['Fix encryption implementation', 'Verify key management'] : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },

      // File Upload Security Test
      {
        id: 'file_001',
        name: 'File Upload Security',
        description: 'Test file upload validation and security',
        category: TestCategory.FILE_HANDLING,
        severity: TestSeverity.HIGH,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['File uploads must be validated and secure'],
        test: async (): Promise<TestResult> => {
          const issues: string[] = [];

          // Test malicious file types
          const maliciousFiles = [
            { name: 'malware.exe', type: 'application/exe', content: 'fake exe content' },
            { name: 'script.js', type: 'application/javascript', content: 'alert("xss")' },
            { name: 'large.json', type: 'application/json', content: 'x'.repeat(50 * 1024 * 1024) }, // 50MB
          ];

          for (const fileData of maliciousFiles) {
            try {
              const file = new File([fileData.content], fileData.name, { type: fileData.type });

              // This should fail for malicious files
              const result = await guardianSecureFileHandler.secureImport(
                file,
                'test-user',
                'test-team'
              );

              if (result.success) {
                issues.push(`Malicious file accepted: ${fileData.name}`);
              }
            } catch (error) {
              // Expected behavior - malicious files should be rejected
            }
          }

          return {
            testId: 'file_001',
            passed: issues.length === 0,
            message:
              issues.length === 0
                ? 'File upload security working'
                : `${issues.length} file security issues`,
            details: issues,
            recommendations:
              issues.length > 0 ? ['Strengthen file validation', 'Implement virus scanning'] : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },

      // Threat Detection Test
      {
        id: 'threat_001',
        name: 'Threat Detection System',
        description: 'Verify threat detection system is working',
        category: TestCategory.THREAT_DETECTION,
        severity: TestSeverity.MEDIUM,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['Threat detection must identify security threats'],
        test: async (): Promise<TestResult> => {
          const issues: string[] = [];

          try {
            // Simulate malicious request
            const maliciousContext = {
              userId: 'test-user',
              ipAddress: '192.168.1.100',
              userAgent: 'Malicious Bot',
              requestPath: '/api/users',
              requestMethod: 'POST',
              payload: { query: "'; DROP TABLE users; --" },
              timestamp: new Date().toISOString(),
            };

            const threats = await guardianThreatDetection.analyzeRequest(maliciousContext);

            if (threats.length === 0) {
              issues.push('Threat detection failed to identify SQL injection attempt');
            }

            // Check if appropriate threat types were detected
            const hasSQLInjectionThreat = threats.some(
              t => t.threatType === ThreatType.SQL_INJECTION
            );
            if (!hasSQLInjectionThreat) {
              issues.push('SQL injection threat not properly classified');
            }
          } catch (error) {
            issues.push(
              `Threat detection error: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }

          return {
            testId: 'threat_001',
            passed: issues.length === 0,
            message:
              issues.length === 0
                ? 'Threat detection working'
                : `${issues.length} threat detection issues`,
            details: issues,
            recommendations:
              issues.length > 0
                ? ['Improve threat detection rules', 'Update threat signatures']
                : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },

      // Tactical Data Validation Test
      {
        id: 'tactical_001',
        name: 'Tactical Data Validation',
        description: 'Verify tactical formation data validation',
        category: TestCategory.INPUT_VALIDATION,
        severity: TestSeverity.MEDIUM,
        enabled: true,
        expectedResult: 'pass',
        requirements: ['Tactical data must be properly validated'],
        test: async (): Promise<TestResult> => {
          const issues: string[] = [];

          // Test invalid tactical data
          const invalidFormations = [
            { name: '<script>alert("xss")</script>', formation: '4-4-2' },
            { name: 'Test Formation', formation: 'invalid-formation' },
            { name: 'Test', playerPositions: [] }, // No players
            { name: 'Test', playerPositions: new Array(20).fill({ position: { x: 50, y: 50 } }) }, // Too many players
          ];

          for (const formation of invalidFormations) {
            const result = validateTacticalData(formation, 'formation');

            if (result.valid) {
              issues.push(
                `Invalid formation data accepted: ${JSON.stringify(formation).substring(0, 100)}`
              );
            }
          }

          return {
            testId: 'tactical_001',
            passed: issues.length === 0,
            message:
              issues.length === 0
                ? 'Tactical data validation working'
                : `${issues.length} validation issues`,
            details: issues,
            recommendations: issues.length > 0 ? ['Strengthen tactical data validation rules'] : [],
            timestamp: new Date().toISOString(),
            executionTime: 0,
          };
        },
      },
    ];

    tests.forEach(test => this.securityTests.set(test.id, test));
  }

  /**
   * Initialize penetration tests
   */
  private initializePenetrationTests(): void {
    const penetrationTests: PenetrationTestScenario[] = [
      {
        id: 'pentest_001',
        name: 'Brute Force Attack Simulation',
        description: 'Simulate brute force attack against authentication',
        category: TestCategory.AUTHENTICATION,
        attackVectors: [
          {
            type: ThreatType.BRUTE_FORCE,
            payload: { attempts: 50, passwords: ['password', '123456', 'admin'] },
            target: '/api/auth/login',
            description: 'Multiple rapid authentication attempts',
          },
        ],
        expectedDefenses: ['Rate limiting', 'Account lockout', 'IP blocking'],
        test: async (): Promise<PenetrationTestResult> => {
          const startTime = Date.now();
          const vulnerabilities: SecurityVulnerability[] = [];
          const defensesTriggered: string[] = [];

          // Simulate multiple failed login attempts
          for (let i = 0; i < 20; i++) {
            const context = {
              userId: 'target-user',
              ipAddress: '192.168.1.200',
              userAgent: 'Attack Tool',
              requestPath: '/api/auth/login',
              timestamp: new Date().toISOString(),
            };

            const threats = await guardianThreatDetection.analyzeRequest(context);

            if (threats.some(t => t.threatType === ThreatType.BRUTE_FORCE)) {
              defensesTriggered.push('Threat detection');
              break;
            }
          }

          // Check if IP is blocked
          if (guardianThreatDetection.isIPBlocked('192.168.1.200')) {
            defensesTriggered.push('IP blocking');
          }

          if (defensesTriggered.length === 0) {
            vulnerabilities.push({
              id: 'vuln_001',
              type: 'Authentication Bypass',
              severity: TestSeverity.HIGH,
              description: 'Brute force attack not properly defended',
              location: '/api/auth/login',
              impact: 'Attackers could perform unlimited login attempts',
              remediation: 'Implement rate limiting and account lockout policies',
            });
          }

          return {
            scenarioId: 'pentest_001',
            successful: vulnerabilities.length > 0,
            vulnerabilitiesFound: vulnerabilities,
            defensesTriggered,
            recommendations:
              vulnerabilities.length > 0 ? ['Implement stronger authentication defenses'] : [],
            executionTime: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
        },
      },
    ];

    penetrationTests.forEach(test => this.penetrationTests.set(test.id, test));
  }

  /**
   * Calculate vulnerability assessment results
   */
  private calculateAssessment(results: TestResult[]): VulnerabilityAssessment {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    // Count issues by severity
    const criticalIssues = results.filter(
      r => !r.passed && this.securityTests.get(r.testId)?.severity === TestSeverity.CRITICAL
    ).length;
    const highIssues = results.filter(
      r => !r.passed && this.securityTests.get(r.testId)?.severity === TestSeverity.HIGH
    ).length;
    const mediumIssues = results.filter(
      r => !r.passed && this.securityTests.get(r.testId)?.severity === TestSeverity.MEDIUM
    ).length;
    const lowIssues = results.filter(
      r => !r.passed && this.securityTests.get(r.testId)?.severity === TestSeverity.LOW
    ).length;

    // Calculate overall score (weighted by severity)
    const maxScore = totalTests * 100;
    const lostPoints = criticalIssues * 50 + highIssues * 30 + mediumIssues * 15 + lowIssues * 5;
    const overallScore = Math.max(0, 100 - (lostPoints / totalTests) * 100);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (criticalIssues > 0) {
      riskLevel = 'critical';
    } else if (highIssues > 0) {
      riskLevel = 'high';
    } else if (mediumIssues > 0) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (criticalIssues > 0) {
      recommendations.push('Address critical security vulnerabilities immediately');
    }
    if (highIssues > 0) {
      recommendations.push('Fix high-severity security issues within 24 hours');
    }
    if (mediumIssues > 0) {
      recommendations.push('Resolve medium-severity issues within one week');
    }

    // Compliance status (simplified)
    const complianceStatus = {
      GDPR: passedTests / totalTests >= 0.9,
      SOC2: passedTests / totalTests >= 0.95,
      ISO27001: passedTests / totalTests >= 0.9,
    };

    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      overallScore: Math.round(overallScore),
      riskLevel,
      results,
      recommendations,
      complianceStatus,
    };
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(assessment: VulnerabilityAssessment): Promise<string> {
    const report = `
# Guardian Security Assessment Report

**Generated:** ${assessment.timestamp}
**Assessment ID:** ${assessment.id}

## Executive Summary

- **Overall Security Score:** ${assessment.overallScore}/100
- **Risk Level:** ${assessment.riskLevel.toUpperCase()}
- **Total Tests:** ${assessment.totalTests}
- **Passed:** ${assessment.passedTests}
- **Failed:** ${assessment.failedTests}

## Vulnerability Summary

- **Critical Issues:** ${assessment.criticalIssues}
- **High Severity:** ${assessment.highIssues}
- **Medium Severity:** ${assessment.mediumIssues}
- **Low Severity:** ${assessment.lowIssues}

## Compliance Status

${Object.entries(assessment.complianceStatus)
  .map(([framework, status]) => `- **${framework}:** ${status ? 'COMPLIANT' : 'NON-COMPLIANT'}`)
  .join('\n')}

## Recommendations

${assessment.recommendations.map(rec => `- ${rec}`).join('\n')}

## Failed Tests

${assessment.results
  .filter(r => !r.passed)
  .map(
    r => `
### ${this.securityTests.get(r.testId)?.name || r.testId}
- **Severity:** ${this.securityTests.get(r.testId)?.severity || 'Unknown'}
- **Message:** ${r.message}
- **Category:** ${this.securityTests.get(r.testId)?.category || 'Unknown'}
${r.recommendations?.length ? `- **Recommendations:** ${r.recommendations.join(', ')}` : ''}
`
  )
  .join('\n')}

---
*Generated by Guardian Security Testing Suite*
`;

    return report;
  }
}

// Export singleton instance
export const guardianSecurityTesting = new GuardianSecurityTesting();

export default guardianSecurityTesting;
