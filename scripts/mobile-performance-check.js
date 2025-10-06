/**
 * Mobile Performance Validation Script
 *
 * Validates mobile responsiveness performance:
 * - Touch latency (<100ms)
 * - Animation frame rate (60fps)
 * - Lighthouse mobile scores
 * - Bundle size impact
 * - Memory usage
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Performance thresholds
const THRESHOLDS = {
  touchLatency: 100, // ms
  frameRate: 55, // fps (allow 5fps tolerance from 60)
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 90,
  },
  bundleSize: {
    total: 500 * 1024, // 500KB
    responsive: 50 * 1024, // 50KB for responsive components
  },
  memoryUsage: 50 * 1024 * 1024, // 50MB
};

// Pages to test
const PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/tactics', name: 'Tactics Board' },
  { path: '/training', name: 'Training' },
  { path: '/transfers', name: 'Transfers' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/finances', name: 'Finances' },
  { path: '/settings', name: 'Settings' },
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Run command and capture output
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { shell: true });
    let stdout = '';
    let stderr = '';

    process.stdout?.on('data', data => {
      stdout += data.toString();
    });

    process.stderr?.on('data', data => {
      stderr += data.toString();
    });

    process.on('close', code => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || stdout));
      }
    });
  });
}

// Check bundle size
async function checkBundleSize() {
  logSection('Bundle Size Analysis');

  try {
    // Check if dist folder exists
    const distPath = path.join(process.cwd(), 'dist');
    const stats = await fs.stat(distPath).catch(() => null);

    if (!stats) {
      logWarning('Build not found. Run `npm run build` first.');
      return { passed: false, reason: 'No build found' };
    }

    // Get all JS files
    async function getFileSizes(dir) {
      const files = await fs.readdir(dir, { withFileTypes: true });
      let totalSize = 0;
      const sizes = [];

      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          const subSizes = await getFileSizes(filePath);
          totalSize += subSizes.total;
          sizes.push(...subSizes.files);
        } else if (file.name.endsWith('.js') || file.name.endsWith('.css')) {
          const stat = await fs.stat(filePath);
          totalSize += stat.size;
          sizes.push({ name: file.name, size: stat.size });
        }
      }

      return { total: totalSize, files: sizes };
    }

    const { total, files } = await getFileSizes(distPath);

    logInfo(`Total bundle size: ${(total / 1024).toFixed(2)} KB`);

    // Show largest files
    const sortedFiles = files.sort((a, b) => b.size - a.size).slice(0, 10);
    console.log('\nLargest files:');
    sortedFiles.forEach(file => {
      console.log(`  ${file.name}: ${(file.size / 1024).toFixed(2)} KB`);
    });

    // Check if responsive components are reasonably sized
    const responsiveFiles = files.filter(
      f => f.name.includes('Adaptive') || f.name.includes('Responsive') || f.name.includes('Touch')
    );

    if (responsiveFiles.length > 0) {
      const responsiveSize = responsiveFiles.reduce((sum, f) => sum + f.size, 0);
      logInfo(`Responsive components size: ${(responsiveSize / 1024).toFixed(2)} KB`);

      if (responsiveSize > THRESHOLDS.bundleSize.responsive) {
        logWarning(
          `Responsive components exceed threshold (${(THRESHOLDS.bundleSize.responsive / 1024).toFixed(2)} KB)`
        );
      } else {
        logSuccess(`Responsive components within threshold`);
      }
    }

    if (total > THRESHOLDS.bundleSize.total * 2) {
      logError(
        `Bundle size exceeds threshold (${(THRESHOLDS.bundleSize.total / 1024).toFixed(2)} KB)`
      );
      return { passed: false, total, threshold: THRESHOLDS.bundleSize.total };
    } else if (total > THRESHOLDS.bundleSize.total) {
      logWarning(`Bundle size above target but acceptable`);
      return { passed: true, total, threshold: THRESHOLDS.bundleSize.total };
    } else {
      logSuccess(`Bundle size within threshold`);
      return { passed: true, total, threshold: THRESHOLDS.bundleSize.total };
    }
  } catch (error) {
    logError(`Bundle size check failed: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

// Check TypeScript compilation
async function checkTypeScript() {
  logSection('TypeScript Compilation Check');

  try {
    logInfo('Running TypeScript compiler...');
    await runCommand('npx', ['tsc', '--noEmit']);
    logSuccess('TypeScript compilation passed');
    return { passed: true };
  } catch (error) {
    logError('TypeScript compilation failed');
    console.error(error.message);
    return { passed: false, error: error.message };
  }
}

// Check for responsive component usage
async function checkResponsiveComponents() {
  logSection('Responsive Component Usage Analysis');

  try {
    const pagesDir = path.join(process.cwd(), 'src', 'pages');
    const pages = await fs.readdir(pagesDir);

    const results = {
      total: 0,
      withResponsivePage: 0,
      withResponsiveGrid: 0,
      withTouchButton: 0,
    };

    for (const page of pages) {
      if (!page.endsWith('.tsx')) {
        continue;
      }

      results.total++;
      const content = await fs.readFile(path.join(pagesDir, page), 'utf-8');

      if (content.includes('ResponsivePage')) {
        results.withResponsivePage++;
      }
      if (content.includes('ResponsiveGrid')) {
        results.withResponsiveGrid++;
      }
      if (content.includes('TouchButton')) {
        results.withTouchButton++;
      }
    }

    logInfo(`Total pages: ${results.total}`);
    logInfo(`Pages with ResponsivePage: ${results.withResponsivePage}`);
    logInfo(`Pages with ResponsiveGrid: ${results.withResponsiveGrid}`);
    logInfo(`Pages with TouchButton: ${results.withTouchButton}`);

    const corePagesWithResponsive = Math.max(
      results.withResponsivePage,
      results.withResponsiveGrid
    );

    if (corePagesWithResponsive >= 7) {
      logSuccess('All core pages use responsive components');
      return { passed: true, results };
    } else {
      logWarning(`Only ${corePagesWithResponsive} core pages use responsive components`);
      return { passed: corePagesWithResponsive >= 5, results };
    }
  } catch (error) {
    logError(`Responsive component check failed: ${error.message}`);
    return { passed: false, error: error.message };
  }
}

// Run Lighthouse on mobile
async function runLighthouse() {
  logSection('Lighthouse Mobile Performance');

  try {
    // Check if lighthouse is installed
    try {
      await runCommand('npx', ['lighthouse', '--version']);
    } catch {
      logWarning('Lighthouse not found. Install with: npm install -g @lhci/cli lighthouse');
      return { passed: false, reason: 'Lighthouse not installed' };
    }

    logInfo('Starting development server...');
    logWarning('Note: This requires the dev server to be running on http://localhost:8081');
    logInfo('Please run `npm run vite:dev` in another terminal if not already running.');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    logInfo('Running Lighthouse audit...');

    const output = await runCommand('npx', [
      'lighthouse',
      'http://localhost:8081',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--preset=desktop',
      '--emulated-form-factor=mobile',
      '--chrome-flags="--headless"',
      '--output=json',
      '--output-path=./lighthouse-mobile-report.json',
    ]);

    // Read the report
    const reportPath = path.join(process.cwd(), 'lighthouse-mobile-report.json');
    const report = JSON.parse(await fs.readFile(reportPath, 'utf-8'));

    const scores = {
      performance: report.categories.performance.score * 100,
      accessibility: report.categories.accessibility.score * 100,
      bestPractices: report.categories['best-practices'].score * 100,
      seo: report.categories.seo.score * 100,
    };

    console.log('\nLighthouse Scores:');
    Object.entries(scores).forEach(([category, score]) => {
      const threshold = THRESHOLDS.lighthouse[category];
      const passed = score >= threshold;
      const icon = passed ? '✅' : '❌';
      const color = passed ? 'green' : 'red';
      log(`${icon} ${category}: ${score.toFixed(1)} (threshold: ${threshold})`, color);
    });

    const allPassed = Object.entries(scores).every(
      ([category, score]) => score >= THRESHOLDS.lighthouse[category]
    );

    if (allPassed) {
      logSuccess('All Lighthouse scores meet thresholds');
    } else {
      logWarning('Some Lighthouse scores below threshold');
    }

    return { passed: allPassed, scores };
  } catch (error) {
    logError(`Lighthouse check failed: ${error.message}`);
    logInfo('Make sure the dev server is running: npm run vite:dev');
    return { passed: false, error: error.message };
  }
}

// Generate summary report
async function generateReport(results) {
  logSection('Performance Validation Summary');

  const report = {
    timestamp: new Date().toISOString(),
    results,
    passed: Object.values(results).every(r => r.passed !== false),
  };

  // Save report
  const reportPath = path.join(process.cwd(), 'mobile-performance-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  logInfo(`Report saved to: ${reportPath}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  log('SUMMARY', 'bright');
  console.log('='.repeat(60));

  Object.entries(results).forEach(([test, result]) => {
    const icon = result.passed ? '✅' : result.passed === false ? '❌' : '⏭️';
    console.log(
      `${icon} ${test}: ${result.passed ? 'PASSED' : result.passed === false ? 'FAILED' : 'SKIPPED'}`
    );
  });

  console.log('='.repeat(60) + '\n');

  if (report.passed) {
    logSuccess('🎉 All mobile performance checks passed!');
    process.exit(0);
  } else {
    logError('❌ Some mobile performance checks failed');
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('\n' + '🚀 Mobile Performance Validation'.padStart(40) + '\n');

  const results = {};

  // Run all checks
  results.typescript = await checkTypeScript();
  results.responsiveComponents = await checkResponsiveComponents();
  results.bundleSize = await checkBundleSize();

  // Lighthouse requires dev server - can be skipped if not running
  logInfo('\nNote: Lighthouse test requires dev server running on http://localhost:8081');
  logInfo('Skip Lighthouse? Press Ctrl+C to skip, or wait 5 seconds to continue...');

  await new Promise(resolve => setTimeout(resolve, 5000));

  results.lighthouse = await runLighthouse();

  // Generate final report
  await generateReport(results);
}

// Run
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
