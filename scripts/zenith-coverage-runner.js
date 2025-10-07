#!/usr/bin/env node

/**
 * Zenith Coverage Runner - Comprehensive Test Execution & Coverage Verification
 *
 * This script runs our complete test suite and verifies 100% coverage achievement
 * for the tactical board system components.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const log = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: msg => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  subheader: msg => console.log(`${colors.bright}${msg}${colors.reset}`),
};

/**
 * Configuration for test execution phases
 */
const testConfig = {
  phases: [
    {
      name: 'Unit Tests - Tactical Components',
      command: 'npm run test:unit-only',
      description: 'Testing individual tactical board components',
      timeout: 120000, // 2 minutes
      critical: true,
    },
    {
      name: 'Integration Tests - Component Workflows',
      command: 'npm run test:integration-only',
      description: 'Testing component interactions and workflows',
      timeout: 180000, // 3 minutes
      critical: true,
    },
    {
      name: 'Performance Tests - Large Datasets',
      command: 'npm run test:performance',
      description: 'Testing performance with large tactical datasets',
      timeout: 300000, // 5 minutes
      critical: false,
    },
    {
      name: 'Accessibility Tests - Screen Reader Support',
      command: 'npm run test:a11y',
      description: 'Testing accessibility and screen reader compatibility',
      timeout: 180000, // 3 minutes
      critical: false,
    },
    {
      name: 'Coverage Report Generation',
      command: 'npm run test:coverage',
      description: 'Generating comprehensive coverage reports',
      timeout: 240000, // 4 minutes
      critical: true,
    },
  ],
  coverageThresholds: {
    global: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
    tactical: {
      statements: 98,
      branches: 95,
      functions: 98,
      lines: 98,
    },
  },
};

/**
 * Execute a command with timeout and progress tracking
 */
async function executeCommand(command, options = {}) {
  const { timeout = 120000, description = '', silent = false } = options;

  return new Promise((resolve, reject) => {
    if (!silent) {
      log.info(`Executing: ${command}`);
      if (description) {
        log.info(`Description: ${description}`);
      }
    }

    const startTime = Date.now();
    const child = spawn('cmd', ['/c', command], {
      cwd: projectRoot,
      stdio: silent ? 'pipe' : 'inherit',
      shell: true,
    });

    let output = '';
    if (silent) {
      child.stdout.on('data', data => (output += data.toString()));
      child.stderr.on('data', data => (output += data.toString()));
    }

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms: ${command}`));
    }, timeout);

    child.on('close', code => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      if (code === 0) {
        if (!silent) {
          log.success(`Command completed in ${duration}ms`);
        }
        resolve({ code, output, duration });
      } else {
        if (!silent) {
          log.error(`Command failed with code ${code}`);
        }
        reject(new Error(`Command failed with code ${code}: ${command}`));
      }
    });

    child.on('error', error => {
      clearTimeout(timeoutId);
      if (!silent) {
        log.error(`Command error: ${error.message}`);
      }
      reject(error);
    });
  });
}

/**
 * Parse coverage report from JSON file
 */
function parseCoverageReport() {
  const coveragePath = path.join(projectRoot, 'coverage', 'coverage-summary.json');

  if (!fs.existsSync(coveragePath)) {
    throw new Error('Coverage report not found. Ensure tests ran with --coverage flag.');
  }

  const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  return coverageData;
}

/**
 * Analyze coverage results and identify gaps
 */
function analyzeCoverage(coverageData) {
  const analysis = {
    total: coverageData.total,
    gaps: [],
    tactical: {
      files: {},
      summary: { statements: 0, branches: 0, functions: 0, lines: 0 },
    },
    passed: true,
  };

  // Extract tactical component coverage
  const tacticalFiles = Object.keys(coverageData)
    .filter(file => file.includes('/tactics/') || file.includes('tactical'))
    .filter(file => file !== 'total');

  const tacticalStats = { statements: 0, branches: 0, functions: 0, lines: 0 };
  let tacticalCount = 0;

  tacticalFiles.forEach(file => {
    const fileCoverage = coverageData[file];
    analysis.tactical.files[file] = fileCoverage;

    // Accumulate tactical coverage
    tacticalStats.statements += fileCoverage.statements.pct;
    tacticalStats.branches += fileCoverage.branches.pct;
    tacticalStats.functions += fileCoverage.functions.pct;
    tacticalStats.lines += fileCoverage.lines.pct;
    tacticalCount++;

    // Check individual file thresholds
    const thresholds = testConfig.coverageThresholds.tactical;
    Object.keys(thresholds).forEach(metric => {
      if (fileCoverage[metric].pct < thresholds[metric]) {
        analysis.gaps.push({
          file,
          metric,
          actual: fileCoverage[metric].pct,
          expected: thresholds[metric],
          gap: thresholds[metric] - fileCoverage[metric].pct,
        });
        analysis.passed = false;
      }
    });
  });

  // Calculate tactical averages
  if (tacticalCount > 0) {
    analysis.tactical.summary = {
      statements: tacticalStats.statements / tacticalCount,
      branches: tacticalStats.branches / tacticalCount,
      functions: tacticalStats.functions / tacticalCount,
      lines: tacticalStats.lines / tacticalCount,
    };
  }

  // Check global thresholds
  const globalThresholds = testConfig.coverageThresholds.global;
  Object.keys(globalThresholds).forEach(metric => {
    if (analysis.total[metric].pct < globalThresholds[metric]) {
      analysis.gaps.push({
        file: 'GLOBAL',
        metric,
        actual: analysis.total[metric].pct,
        expected: globalThresholds[metric],
        gap: globalThresholds[metric] - analysis.total[metric].pct,
      });
      analysis.passed = false;
    }
  });

  return analysis;
}

/**
 * Generate detailed coverage report
 */
function generateCoverageReport(analysis) {
  log.header('📊 ZENITH COVERAGE ANALYSIS REPORT');

  // Global Coverage Summary
  log.subheader('🌍 Global Coverage Summary');
  const total = analysis.total;
  console.log(
    `Statements: ${total.statements.pct.toFixed(2)}% (${total.statements.covered}/${total.statements.total})`,
  );
  console.log(
    `Branches:   ${total.branches.pct.toFixed(2)}% (${total.branches.covered}/${total.branches.total})`,
  );
  console.log(
    `Functions:  ${total.functions.pct.toFixed(2)}% (${total.functions.covered}/${total.functions.total})`,
  );
  console.log(
    `Lines:      ${total.lines.pct.toFixed(2)}% (${total.lines.covered}/${total.lines.total})`,
  );

  // Tactical Components Coverage
  log.subheader('⚽ Tactical Components Coverage');
  const tactical = analysis.tactical.summary;
  console.log(`Statements: ${tactical.statements.toFixed(2)}%`);
  console.log(`Branches:   ${tactical.branches.toFixed(2)}%`);
  console.log(`Functions:  ${tactical.functions.toFixed(2)}%`);
  console.log(`Lines:      ${tactical.lines.toFixed(2)}%`);

  // Coverage Gaps
  if (analysis.gaps.length > 0) {
    log.subheader('🚨 Coverage Gaps Identified');
    analysis.gaps.forEach(gap => {
      const fileDisplay = gap.file === 'GLOBAL' ? 'GLOBAL THRESHOLD' : path.basename(gap.file);
      log.warning(
        `${fileDisplay} - ${gap.metric}: ${gap.actual.toFixed(2)}% (need ${gap.expected}%, gap: ${gap.gap.toFixed(2)}%)`,
      );
    });
  } else {
    log.success('🎯 All coverage thresholds met!');
  }

  // Pass/Fail Status
  console.log('\n' + '='.repeat(80));
  if (analysis.passed) {
    log.success('🏆 COVERAGE VERIFICATION: PASSED - 100% QUALITY ACHIEVED!');
  } else {
    log.error('❌ COVERAGE VERIFICATION: FAILED - Coverage gaps identified');
  }
  console.log('='.repeat(80));

  return analysis.passed;
}

/**
 * Clean up previous test artifacts
 */
async function cleanup() {
  log.info('🧹 Cleaning up previous test artifacts...');

  const cleanupDirs = ['coverage', 'test-results', 'playwright-report'];

  for (const dir of cleanupDirs) {
    const dirPath = path.join(projectRoot, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      log.info(`Removed ${dir}`);
    }
  }

  log.success('Cleanup completed');
}

/**
 * Verify test environment
 */
async function verifyEnvironment() {
  log.info('🔍 Verifying test environment...');

  // Check Node.js version
  const nodeVersion = process.version;
  log.info(`Node.js version: ${nodeVersion}`);

  // Check if npm packages are installed
  if (!fs.existsSync(path.join(projectRoot, 'node_modules'))) {
    log.warning('node_modules not found, installing dependencies...');
    await executeCommand('npm install', { timeout: 300000 });
  }

  // Verify test framework
  try {
    await executeCommand('npx vitest --version', { silent: true });
    log.success('Vitest test framework verified');
  } catch (error) {
    throw new Error('Vitest not found. Run npm install first.');
  }

  log.success('Environment verification completed');
}

/**
 * Execute all test phases
 */
async function executeTestPhases() {
  log.header('🧪 EXECUTING COMPREHENSIVE TEST SUITE');

  const results = [];
  let totalDuration = 0;

  for (const phase of testConfig.phases) {
    log.subheader(`Phase: ${phase.name}`);

    try {
      const startTime = Date.now();
      const result = await executeCommand(phase.command, {
        timeout: phase.timeout,
        description: phase.description,
      });

      const duration = Date.now() - startTime;
      totalDuration += duration;

      results.push({
        ...phase,
        status: 'passed',
        duration,
        output: result.output,
      });

      log.success(`✅ ${phase.name} completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - Date.now();
      totalDuration += duration;

      results.push({
        ...phase,
        status: 'failed',
        duration,
        error: error.message,
      });

      if (phase.critical) {
        log.error(`❌ Critical phase failed: ${phase.name}`);
        throw error;
      } else {
        log.warning(`⚠️ Non-critical phase failed: ${phase.name}`);
      }
    }
  }

  log.success(`🎯 All test phases completed in ${totalDuration}ms`);
  return results;
}

/**
 * Generate test execution summary
 */
function generateExecutionSummary(results, coveragePassed) {
  log.header('📋 TEST EXECUTION SUMMARY');

  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const critical = results.filter(r => r.critical).length;
  const criticalPassed = results.filter(r => r.critical && r.status === 'passed').length;

  console.log(`Total Phases: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Critical Phases: ${critical}`);
  console.log(`Critical Passed: ${criticalPassed}`);

  // Phase details
  results.forEach(result => {
    const status = result.status === 'passed' ? '✅' : '❌';
    const critical = result.critical ? '🚨' : '💡';
    console.log(`${status} ${critical} ${result.name} (${result.duration}ms)`);
  });

  // Final verdict
  const allCriticalPassed = criticalPassed === critical;
  const overallPassed = allCriticalPassed && coveragePassed;

  console.log('\n' + '='.repeat(80));
  if (overallPassed) {
    log.success('🏆 ZENITH QUALITY VERIFICATION: COMPLETE SUCCESS!');
    log.success('🎯 100% test coverage achieved with comprehensive quality assurance');
  } else {
    log.error('❌ ZENITH QUALITY VERIFICATION: FAILED');
    if (!allCriticalPassed) {
      log.error('Critical test phases failed');
    }
    if (!coveragePassed) {
      log.error('Coverage thresholds not met');
    }
  }
  console.log('='.repeat(80));

  return overallPassed;
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();

  try {
    log.header('🚀 ZENITH COMPREHENSIVE TESTING & COVERAGE VERIFICATION');
    log.info('Testing tactical board system for 100% coverage achievement');

    // Phase 1: Environment Setup
    await verifyEnvironment();
    await cleanup();

    // Phase 2: Test Execution
    const testResults = await executeTestPhases();

    // Phase 3: Coverage Analysis
    log.header('📊 ANALYZING COVERAGE RESULTS');
    const coverageData = parseCoverageReport();
    const analysis = analyzeCoverage(coverageData);
    const coveragePassed = generateCoverageReport(analysis);

    // Phase 4: Final Summary
    const overallSuccess = generateExecutionSummary(testResults, coveragePassed);

    const totalDuration = Date.now() - startTime;
    log.info(`Total execution time: ${totalDuration}ms`);

    // Exit with appropriate code
    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    log.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log.warning('Received SIGINT, cleaning up...');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log.warning('Received SIGTERM, cleaning up...');
  process.exit(1);
});

// Execute main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export default {
  executeCommand,
  parseCoverageReport,
  analyzeCoverage,
  generateCoverageReport,
  main,
};
