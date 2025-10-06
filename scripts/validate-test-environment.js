#!/usr/bin/env node

/**
 * Comprehensive Test Environment Validation
 * Validates all testing tools, configurations, and environment setup
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TestEnvironmentValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      dependencies: [],
      configurations: [],
      testFiles: [],
      scripts: [],
      overall: {
        score: 0,
        status: 'UNKNOWN',
        issues: [],
        recommendations: [],
      },
    };
  }

  async validateEnvironment() {
    console.log('🔍 Validating comprehensive test environment...\n');

    await this.validateDependencies();
    await this.validateConfigurations();
    await this.validateTestFiles();
    await this.validateScripts();
    await this.validateCIConfiguration();

    this.calculateOverallScore();
    this.generateReport();

    return this.results.overall.status === 'EXCELLENT' || this.results.overall.status === 'GOOD';
  }

  async validateDependencies() {
    console.log('📦 Validating testing dependencies...');

    const requiredDeps = {
      // Core testing framework
      vitest: { type: 'dev', critical: true, purpose: 'Core testing framework' },
      '@vitest/ui': { type: 'dev', critical: false, purpose: 'Test UI interface' },
      '@vitest/coverage-v8': { type: 'dev', critical: true, purpose: 'Code coverage' },

      // React testing
      '@testing-library/react': { type: 'dev', critical: true, purpose: 'React component testing' },
      '@testing-library/jest-dom': { type: 'dev', critical: true, purpose: 'DOM matchers' },
      '@testing-library/user-event': {
        type: 'dev',
        critical: true,
        purpose: 'User interaction simulation',
      },

      // E2E testing
      '@playwright/test': { type: 'dev', critical: true, purpose: 'End-to-end testing' },

      // Environment
      jsdom: { type: 'dev', critical: true, purpose: 'DOM environment for tests' },

      // Mocking
      msw: { type: 'dev', critical: false, purpose: 'API mocking' },

      // Linting and formatting
      eslint: { type: 'dev', critical: true, purpose: 'Code linting' },
      prettier: { type: 'dev', critical: true, purpose: 'Code formatting' },

      // TypeScript
      typescript: { type: 'dev', critical: true, purpose: 'TypeScript support' },
    };

    const packageJson = JSON.parse(
      await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8')
    );

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    let criticalMissing = 0;
    let totalMissing = 0;

    for (const [dep, config] of Object.entries(requiredDeps)) {
      const installed = allDeps[dep];
      const status = installed ? 'INSTALLED' : 'MISSING';

      if (!installed) {
        totalMissing++;
        if (config.critical) {
          criticalMissing++;
        }
      }

      this.results.dependencies.push({
        name: dep,
        status,
        version: installed || 'N/A',
        critical: config.critical,
        purpose: config.purpose,
        type: config.type,
      });
    }

    console.log(`  ✅ Dependencies checked: ${Object.keys(requiredDeps).length}`);
    console.log(`  ❌ Missing dependencies: ${totalMissing} (${criticalMissing} critical)`);

    if (criticalMissing > 0) {
      this.results.overall.issues.push(`${criticalMissing} critical testing dependencies missing`);
    }
  }

  async validateConfigurations() {
    console.log('\n⚙️ Validating test configurations...');

    const configs = [
      {
        name: 'Vitest Config',
        file: 'vitest.config.ts',
        critical: true,
        validator: this.validateVitestConfig.bind(this),
      },
      {
        name: 'Playwright Config',
        file: 'playwright.config.ts',
        critical: true,
        validator: this.validatePlaywrightConfig.bind(this),
      },
      {
        name: 'Stryker Config (Mutation Testing)',
        file: 'stryker.config.mjs',
        critical: false,
        validator: this.validateStrykerConfig.bind(this),
      },
      {
        name: 'ESLint Config',
        file: '.eslintrc.js',
        critical: true,
        validator: null,
      },
      {
        name: 'TypeScript Config',
        file: 'tsconfig.json',
        critical: true,
        validator: null,
      },
    ];

    for (const config of configs) {
      const filePath = path.join(this.projectRoot, config.file);
      let status = 'MISSING';
      let details = '';

      try {
        await fs.access(filePath);
        status = 'EXISTS';

        if (config.validator) {
          const validation = await config.validator(filePath);
          status = validation.valid ? 'VALID' : 'INVALID';
          details = validation.details;
        }
      } catch (error) {
        if (config.critical) {
          this.results.overall.issues.push(`Critical config missing: ${config.name}`);
        }
      }

      this.results.configurations.push({
        name: config.name,
        file: config.file,
        status,
        critical: config.critical,
        details,
      });
    }

    console.log(`  ✅ Configurations checked: ${configs.length}`);
  }

  async validateVitestConfig(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const issues = [];

      if (!content.includes('coverage')) {
        issues.push('Coverage configuration missing');
      }
      if (!content.includes('jsdom')) {
        issues.push('JSDOM environment not configured');
      }
      if (!content.includes('setupFiles')) {
        issues.push('Setup files not configured');
      }

      return {
        valid: issues.length === 0,
        details: issues.length > 0 ? issues.join(', ') : 'All checks passed',
      };
    } catch (error) {
      return {
        valid: false,
        details: `Error reading config: ${error.message}`,
      };
    }
  }

  async validatePlaywrightConfig(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const issues = [];

      if (!content.includes('projects')) {
        issues.push('Browser projects not configured');
      }
      if (!content.includes('reporter')) {
        issues.push('Test reporter not configured');
      }

      return {
        valid: issues.length === 0,
        details: issues.length > 0 ? issues.join(', ') : 'All checks passed',
      };
    } catch (error) {
      return {
        valid: false,
        details: `Error reading config: ${error.message}`,
      };
    }
  }

  async validateStrykerConfig(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const issues = [];

      if (!content.includes('testRunner')) {
        issues.push('Test runner not configured');
      }
      if (!content.includes('mutator')) {
        issues.push('Mutator not configured');
      }

      return {
        valid: issues.length === 0,
        details: issues.length > 0 ? issues.join(', ') : 'All checks passed',
      };
    } catch (error) {
      return {
        valid: false,
        details: `Error reading config: ${error.message}`,
      };
    }
  }

  async validateTestFiles() {
    console.log('\n🧪 Validating test files structure...');

    const testCategories = {
      'Unit Tests': 'src/__tests__/components',
      'Integration Tests': 'src/__tests__/integration',
      'E2E Tests': 'src/__tests__/e2e',
      'Performance Tests': 'src/__tests__/performance',
      'Accessibility Tests': 'src/__tests__/accessibility',
      'Visual Regression Tests': 'src/__tests__/visual',
    };

    let totalTestFiles = 0;

    for (const [category, directory] of Object.entries(testCategories)) {
      const fullPath = path.join(this.projectRoot, directory);
      let status = 'MISSING';
      let fileCount = 0;

      try {
        const files = await fs.readdir(fullPath, { recursive: true });
        const testFiles = files.filter(
          f =>
            f.endsWith('.test.ts') ||
            f.endsWith('.test.tsx') ||
            f.endsWith('.spec.ts') ||
            f.endsWith('.spec.tsx')
        );

        fileCount = testFiles.length;
        totalTestFiles += fileCount;
        status = fileCount > 0 ? 'EXISTS' : 'EMPTY';
      } catch (error) {
        // Directory doesn't exist
      }

      this.results.testFiles.push({
        category,
        directory,
        status,
        fileCount,
        critical: ['Unit Tests', 'Integration Tests', 'E2E Tests'].includes(category),
      });
    }

    console.log(`  ✅ Test file categories checked: ${Object.keys(testCategories).length}`);
    console.log(`  📁 Total test files found: ${totalTestFiles}`);

    if (totalTestFiles < 10) {
      this.results.overall.issues.push(
        'Insufficient test coverage - less than 10 test files found'
      );
    }
  }

  async validateScripts() {
    console.log('\n📜 Validating npm scripts...');

    const requiredScripts = {
      test: { critical: true, purpose: 'Basic test execution' },
      'test:coverage': { critical: true, purpose: 'Test with coverage' },
      'test:unit-only': { critical: true, purpose: 'Unit tests only' },
      'test:integration-only': { critical: true, purpose: 'Integration tests only' },
      'test:a11y': { critical: false, purpose: 'Accessibility tests' },
      'test:performance': { critical: false, purpose: 'Performance tests' },
      'test:visual': { critical: false, purpose: 'Visual regression tests' },
      e2e: { critical: true, purpose: 'End-to-end tests' },
      lint: { critical: true, purpose: 'Code linting' },
      'type-check': { critical: true, purpose: 'TypeScript checking' },
      build: { critical: true, purpose: 'Production build' },
    };

    const packageJson = JSON.parse(
      await fs.readFile(path.join(this.projectRoot, 'package.json'), 'utf8')
    );

    const scripts = packageJson.scripts || {};
    let missingCritical = 0;

    for (const [script, config] of Object.entries(requiredScripts)) {
      const exists = !!scripts[script];
      const status = exists ? 'EXISTS' : 'MISSING';

      if (!exists && config.critical) {
        missingCritical++;
      }

      this.results.scripts.push({
        name: script,
        status,
        critical: config.critical,
        purpose: config.purpose,
        command: scripts[script] || 'N/A',
      });
    }

    console.log(`  ✅ Scripts checked: ${Object.keys(requiredScripts).length}`);
    console.log(`  ❌ Missing critical scripts: ${missingCritical}`);

    if (missingCritical > 0) {
      this.results.overall.issues.push(`${missingCritical} critical npm scripts missing`);
    }
  }

  async validateCIConfiguration() {
    console.log('\n🚀 Validating CI/CD configuration...');

    const ciFiles = [
      '.github/workflows/zenith-quality-pipeline.yml',
      '.github/workflows/atlas-deployment.yml',
    ];

    let ciConfigured = false;

    for (const ciFile of ciFiles) {
      try {
        await fs.access(path.join(this.projectRoot, ciFile));
        ciConfigured = true;
        console.log(`  ✅ Found CI config: ${ciFile}`);
      } catch (error) {
        console.log(`  ❌ Missing CI config: ${ciFile}`);
      }
    }

    if (!ciConfigured) {
      this.results.overall.issues.push('No CI/CD configuration found');
    }
  }

  calculateOverallScore() {
    let score = 100;
    const deductions = {
      criticalDependencyMissing: 15,
      criticalConfigMissing: 10,
      criticalScriptMissing: 5,
      insufficientTests: 20,
      noCIConfig: 10,
      minorIssue: 2,
    };

    // Count critical issues
    const criticalDepsMissing = this.results.dependencies.filter(
      d => d.critical && d.status === 'MISSING'
    ).length;
    const criticalConfigsMissing = this.results.configurations.filter(
      c => c.critical && c.status !== 'VALID' && c.status !== 'EXISTS'
    ).length;
    const criticalScriptsMissing = this.results.scripts.filter(
      s => s.critical && s.status === 'MISSING'
    ).length;
    const totalTestFiles = this.results.testFiles.reduce((sum, tf) => sum + tf.fileCount, 0);

    // Apply deductions
    score -= criticalDepsMissing * deductions.criticalDependencyMissing;
    score -= criticalConfigsMissing * deductions.criticalConfigMissing;
    score -= criticalScriptsMissing * deductions.criticalScriptMissing;

    if (totalTestFiles < 10) {
      score -= deductions.insufficientTests;
    }

    if (this.results.overall.issues.some(issue => issue.includes('CI/CD'))) {
      score -= deductions.noCIConfig;
    }

    // Additional minor deductions
    const minorIssues =
      this.results.overall.issues.length -
      criticalDepsMissing -
      criticalConfigsMissing -
      criticalScriptsMissing;
    score -= minorIssues * deductions.minorIssue;

    score = Math.max(0, score);

    // Determine status
    let status;
    if (score >= 95) {
      status = 'EXCELLENT';
    } else if (score >= 85) {
      status = 'GOOD';
    } else if (score >= 70) {
      status = 'ACCEPTABLE';
    } else if (score >= 50) {
      status = 'NEEDS_IMPROVEMENT';
    } else {
      status = 'CRITICAL';
    }

    this.results.overall.score = score;
    this.results.overall.status = status;

    // Add recommendations
    if (criticalDepsMissing > 0) {
      this.results.overall.recommendations.push('Install missing critical testing dependencies');
    }
    if (criticalConfigsMissing > 0) {
      this.results.overall.recommendations.push('Fix or create missing critical configurations');
    }
    if (totalTestFiles < 20) {
      this.results.overall.recommendations.push('Increase test coverage by adding more test files');
    }
    if (score < 85) {
      this.results.overall.recommendations.push(
        'Consider using the Zenith testing framework for comprehensive coverage'
      );
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🏆 TEST ENVIRONMENT VALIDATION REPORT');
    console.log('='.repeat(70));
    console.log(`Overall Score: ${this.results.overall.score}/100`);
    console.log(`Status: ${this.results.overall.status}`);
    console.log(`Grade: ${this.getGrade(this.results.overall.score)}`);

    if (this.results.overall.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      this.results.overall.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }

    if (this.results.overall.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.overall.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    // Summary by category
    console.log('\n📊 Category Summary:');
    console.log(`Dependencies: ${this.getCategoryStatus('dependencies')}`);
    console.log(`Configurations: ${this.getCategoryStatus('configurations')}`);
    console.log(`Test Files: ${this.getCategoryStatus('testFiles')}`);
    console.log(`NPM Scripts: ${this.getCategoryStatus('scripts')}`);

    console.log('\n' + '='.repeat(70));

    if (this.results.overall.status === 'EXCELLENT' || this.results.overall.status === 'GOOD') {
      console.log('✅ Test environment is ready for bulletproof testing!');
    } else {
      console.log('⚠️ Test environment needs improvement before production use.');
    }
  }

  getGrade(score) {
    if (score >= 95) {
      return 'A+';
    }
    if (score >= 90) {
      return 'A';
    }
    if (score >= 85) {
      return 'B+';
    }
    if (score >= 80) {
      return 'B';
    }
    if (score >= 75) {
      return 'C+';
    }
    if (score >= 70) {
      return 'C';
    }
    if (score >= 60) {
      return 'D';
    }
    return 'F';
  }

  getCategoryStatus(category) {
    const items = this.results[category];
    const total = items.length;
    const good = items.filter(item => {
      if (category === 'dependencies') {
        return item.status === 'INSTALLED';
      }
      if (category === 'configurations') {
        return item.status === 'VALID' || item.status === 'EXISTS';
      }
      if (category === 'testFiles') {
        return item.status === 'EXISTS';
      }
      if (category === 'scripts') {
        return item.status === 'EXISTS';
      }
      return false;
    }).length;

    const percentage = Math.round((good / total) * 100);
    return `${good}/${total} (${percentage}%)`;
  }
}

// Execute if run directly
if (process.argv[1] === __filename) {
  const validator = new TestEnvironmentValidator();

  validator
    .validateEnvironment()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

export default TestEnvironmentValidator;
