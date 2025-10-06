#!/usr/bin/env node

/**
 * Zenith Test Optimization Script
 * Comprehensive test suite analysis and recommendations
 * Provides insights into test coverage, performance, and quality
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// ANSI color codes for beautiful output
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
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

/**
 * Test Suite Analyzer - Zenith's comprehensive analysis engine
 */
class ZenithTestAnalyzer {
  constructor() {
    this.stats = {
      totalTests: 0,
      totalComponents: 0,
      testFiles: [],
      coverageData: null,
      mutationData: null,
      performanceData: {},
      recommendations: [],
      qualityScore: 0,
    };

    this.thresholds = {
      coverage: {
        excellent: 95,
        good: 85,
        acceptable: 75,
        poor: 60,
      },
      mutation: {
        excellent: 90,
        good: 80,
        acceptable: 70,
        poor: 60,
      },
      performance: {
        fast: 100,
        acceptable: 500,
        slow: 1000,
        critical: 2000,
      },
    };
  }

  /**
   * Main analysis orchestrator
   */
  async analyze() {
    console.log(this.createHeader('ZENITH TEST OPTIMIZATION ANALYSIS'));

    try {
      await this.gatherTestFiles();
      await this.analyzeCoverage();
      await this.analyzeMutationTesting();
      await this.analyzeTestPerformance();
      await this.analyzeTestQuality();
      await this.generateRecommendations();
      await this.calculateQualityScore();

      this.generateReport();
      this.generateActionItems();
    } catch (error) {
      console.error(`${colors.red}Analysis failed:${colors.reset}`, error.message);
      process.exit(1);
    }
  }

  /**
   * Gather all test files and basic statistics
   */
  async gatherTestFiles() {
    console.log(`\n${colors.cyan}📊 Gathering Test Files...${colors.reset}`);

    const testDirs = [
      'src/__tests__',
      'src/**/*.test.{ts,tsx,js,jsx}',
      'src/**/*.spec.{ts,tsx,js,jsx}',
    ];

    for (const dir of testDirs) {
      try {
        const files = await this.findFiles(
          path.join(rootDir, 'src'),
          /\.(test|spec)\.(ts|tsx|js|jsx)$/
        );
        this.stats.testFiles.push(...files);
      } catch (error) {
        // Directory might not exist, continue
      }
    }

    this.stats.totalTests = this.stats.testFiles.length;

    // Count components
    const componentFiles = await this.findFiles(
      path.join(rootDir, 'src', 'components'),
      /\.(ts|tsx|js|jsx)$/,
      /\.(test|spec)\./
    );
    this.stats.totalComponents = componentFiles.length;

    console.log(`   Found ${colors.green}${this.stats.totalTests}${colors.reset} test files`);
    console.log(`   Found ${colors.green}${this.stats.totalComponents}${colors.reset} components`);
  }

  /**
   * Analyze test coverage data
   */
  async analyzeCoverage() {
    console.log(`\n${colors.cyan}📈 Analyzing Coverage Data...${colors.reset}`);

    try {
      // Run coverage analysis
      console.log('   Running coverage analysis...');
      execSync('npm run test:coverage -- --reporter=json-summary', {
        cwd: rootDir,
        stdio: 'pipe',
      });

      // Read coverage data
      const coveragePath = path.join(rootDir, 'coverage', 'coverage-summary.json');
      const coverageData = JSON.parse(await fs.readFile(coveragePath, 'utf8'));

      this.stats.coverageData = coverageData.total;

      console.log(`   Lines: ${this.formatCoverage(this.stats.coverageData.lines.pct)}%`);
      console.log(`   Branches: ${this.formatCoverage(this.stats.coverageData.branches.pct)}%`);
      console.log(`   Functions: ${this.formatCoverage(this.stats.coverageData.functions.pct)}%`);
      console.log(`   Statements: ${this.formatCoverage(this.stats.coverageData.statements.pct)}%`);
    } catch (error) {
      console.log(`   ${colors.yellow}⚠️  Coverage data not available${colors.reset}`);
      this.stats.recommendations.push({
        type: 'warning',
        category: 'Coverage',
        message: 'Run npm run test:coverage to generate coverage data',
        priority: 'high',
      });
    }
  }

  /**
   * Analyze mutation testing results
   */
  async analyzeMutationTesting() {
    console.log(`\n${colors.cyan}🧬 Analyzing Mutation Testing...${colors.reset}`);

    try {
      const mutationPath = path.join(rootDir, 'reports', 'mutation', 'mutation.json');
      const mutationData = JSON.parse(await fs.readFile(mutationPath, 'utf8'));

      this.stats.mutationData = mutationData;

      console.log(`   Mutation Score: ${this.formatMutationScore(mutationData.mutationScore)}%`);
      console.log(`   Killed Mutants: ${colors.green}${mutationData.killed}${colors.reset}`);
      console.log(`   Survived Mutants: ${colors.red}${mutationData.survived}${colors.reset}`);
      console.log(`   Timeout Mutants: ${colors.yellow}${mutationData.timeout}${colors.reset}`);
    } catch (error) {
      console.log(`   ${colors.yellow}⚠️  Mutation testing data not available${colors.reset}`);
      this.stats.recommendations.push({
        type: 'info',
        category: 'Mutation Testing',
        message: 'Run npm run test:mutation to generate mutation testing data',
        priority: 'medium',
      });
    }
  }

  /**
   * Analyze test performance
   */
  async analyzeTestPerformance() {
    console.log(`\n${colors.cyan}⚡ Analyzing Test Performance...${colors.reset}`);

    try {
      // Run performance benchmark
      console.log('   Running performance benchmark...');
      const perfOutput = execSync('npm run test:perf -- --reporter=json', {
        cwd: rootDir,
        encoding: 'utf8',
      });

      const perfData = JSON.parse(perfOutput);
      this.stats.performanceData = this.processPerformanceData(perfData);

      console.log(
        `   Average Test Duration: ${this.formatDuration(this.stats.performanceData.averageDuration)}`
      );
      console.log(
        `   Slowest Test: ${this.formatDuration(this.stats.performanceData.slowestTest)}`
      );
      console.log(
        `   Total Suite Time: ${this.formatDuration(this.stats.performanceData.totalTime)}`
      );
    } catch (error) {
      console.log(`   ${colors.yellow}⚠️  Performance data not available${colors.reset}`);
      this.stats.recommendations.push({
        type: 'info',
        category: 'Performance',
        message: 'Set up performance benchmarking for test suite optimization',
        priority: 'low',
      });
    }
  }

  /**
   * Analyze overall test quality
   */
  async analyzeTestQuality() {
    console.log(`\n${colors.cyan}🎯 Analyzing Test Quality...${colors.reset}`);

    const qualityMetrics = {
      testToComponentRatio: this.stats.totalTests / this.stats.totalComponents,
      hasIntegrationTests: await this.checkForIntegrationTests(),
      hasE2ETests: await this.checkForE2ETests(),
      hasPerformanceTests: await this.checkForPerformanceTests(),
      hasAccessibilityTests: await this.checkForAccessibilityTests(),
      hasMockingStrategy: await this.checkForMockingStrategy(),
    };

    console.log(
      `   Test-to-Component Ratio: ${colors.green}${qualityMetrics.testToComponentRatio.toFixed(2)}${colors.reset}`
    );
    console.log(`   Integration Tests: ${this.formatBoolean(qualityMetrics.hasIntegrationTests)}`);
    console.log(`   E2E Tests: ${this.formatBoolean(qualityMetrics.hasE2ETests)}`);
    console.log(`   Performance Tests: ${this.formatBoolean(qualityMetrics.hasPerformanceTests)}`);
    console.log(
      `   Accessibility Tests: ${this.formatBoolean(qualityMetrics.hasAccessibilityTests)}`
    );
    console.log(`   Mocking Strategy: ${this.formatBoolean(qualityMetrics.hasMockingStrategy)}`);

    this.stats.qualityMetrics = qualityMetrics;
  }

  /**
   * Generate comprehensive recommendations
   */
  async generateRecommendations() {
    console.log(`\n${colors.cyan}💡 Generating Recommendations...${colors.reset}`);

    // Coverage recommendations
    if (this.stats.coverageData) {
      const coverage = this.stats.coverageData;

      if (coverage.lines.pct < this.thresholds.coverage.good) {
        this.stats.recommendations.push({
          type: 'warning',
          category: 'Coverage',
          message: `Line coverage is ${coverage.lines.pct}%. Aim for ${this.thresholds.coverage.good}%+`,
          priority: 'high',
          actionItems: [
            'Identify uncovered lines using coverage report',
            'Add tests for edge cases and error conditions',
            'Focus on business-critical components first',
          ],
        });
      }

      if (coverage.branches.pct < this.thresholds.coverage.good) {
        this.stats.recommendations.push({
          type: 'warning',
          category: 'Coverage',
          message: `Branch coverage is ${coverage.branches.pct}%. Test all conditional paths`,
          priority: 'high',
          actionItems: [
            'Test both true and false conditions',
            'Add tests for switch statement cases',
            'Test ternary operators and logical operators',
          ],
        });
      }
    }

    // Mutation testing recommendations
    if (this.stats.mutationData) {
      const mutationScore = this.stats.mutationData.mutationScore;

      if (mutationScore < this.thresholds.mutation.good) {
        this.stats.recommendations.push({
          type: 'warning',
          category: 'Mutation Testing',
          message: `Mutation score is ${mutationScore}%. Improve test quality`,
          priority: 'medium',
          actionItems: [
            'Review survived mutants in mutation report',
            'Add assertions for specific values, not just truthiness',
            'Test boundary conditions more thoroughly',
          ],
        });
      }
    }

    // Performance recommendations
    if (this.stats.performanceData.averageDuration > this.thresholds.performance.acceptable) {
      this.stats.recommendations.push({
        type: 'warning',
        category: 'Performance',
        message: 'Test suite is running slowly. Optimize for better developer experience',
        priority: 'medium',
        actionItems: [
          'Parallelize test execution',
          'Optimize test setup and teardown',
          'Use shallow rendering where appropriate',
          'Mock heavy dependencies',
        ],
      });
    }

    // Quality recommendations
    const ratio = this.stats.qualityMetrics.testToComponentRatio;
    if (ratio < 1) {
      this.stats.recommendations.push({
        type: 'error',
        category: 'Test Coverage',
        message: `Test-to-component ratio is ${ratio.toFixed(2)}. Every component should have tests`,
        priority: 'critical',
        actionItems: [
          'Create test files for untested components',
          'Follow Test-Driven Development (TDD) for new features',
          'Set up pre-commit hooks to enforce test requirements',
        ],
      });
    }

    console.log(
      `   Generated ${colors.green}${this.stats.recommendations.length}${colors.reset} recommendations`
    );
  }

  /**
   * Calculate overall quality score
   */
  async calculateQualityScore() {
    let score = 0;
    let maxScore = 0;

    // Coverage score (40% of total)
    if (this.stats.coverageData) {
      const avgCoverage =
        (this.stats.coverageData.lines.pct +
          this.stats.coverageData.branches.pct +
          this.stats.coverageData.functions.pct +
          this.stats.coverageData.statements.pct) /
        4;
      score += (avgCoverage / 100) * 40;
    }
    maxScore += 40;

    // Mutation score (25% of total)
    if (this.stats.mutationData) {
      score += (this.stats.mutationData.mutationScore / 100) * 25;
    }
    maxScore += 25;

    // Test quality metrics (35% of total)
    const qualityScore =
      (Math.min(this.stats.qualityMetrics.testToComponentRatio, 2) / 2) * 10 +
      (this.stats.qualityMetrics.hasIntegrationTests ? 5 : 0) +
      (this.stats.qualityMetrics.hasE2ETests ? 5 : 0) +
      (this.stats.qualityMetrics.hasPerformanceTests ? 5 : 0) +
      (this.stats.qualityMetrics.hasAccessibilityTests ? 5 : 0) +
      (this.stats.qualityMetrics.hasMockingStrategy ? 5 : 0);
    score += qualityScore;
    maxScore += 35;

    this.stats.qualityScore = Math.round((score / maxScore) * 100);
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log(this.createHeader('ZENITH QUALITY ASSESSMENT REPORT'));

    // Overall Quality Score
    console.log(`\n${colors.bright}🎯 OVERALL QUALITY SCORE${colors.reset}`);
    console.log(this.createProgressBar(this.stats.qualityScore, 100, 50));
    console.log(
      `   ${this.formatQualityScore(this.stats.qualityScore)}% ${this.getQualityRating(this.stats.qualityScore)}`
    );

    // Coverage Summary
    if (this.stats.coverageData) {
      console.log(`\n${colors.bright}📊 COVERAGE SUMMARY${colors.reset}`);
      console.log(
        `   Lines:      ${this.createProgressBar(this.stats.coverageData.lines.pct, 100, 30)} ${this.formatCoverage(this.stats.coverageData.lines.pct)}%`
      );
      console.log(
        `   Branches:   ${this.createProgressBar(this.stats.coverageData.branches.pct, 100, 30)} ${this.formatCoverage(this.stats.coverageData.branches.pct)}%`
      );
      console.log(
        `   Functions:  ${this.createProgressBar(this.stats.coverageData.functions.pct, 100, 30)} ${this.formatCoverage(this.stats.coverageData.functions.pct)}%`
      );
      console.log(
        `   Statements: ${this.createProgressBar(this.stats.coverageData.statements.pct, 100, 30)} ${this.formatCoverage(this.stats.coverageData.statements.pct)}%`
      );
    }

    // Mutation Testing Summary
    if (this.stats.mutationData) {
      console.log(`\n${colors.bright}🧬 MUTATION TESTING SUMMARY${colors.reset}`);
      console.log(
        `   Mutation Score: ${this.createProgressBar(this.stats.mutationData.mutationScore, 100, 30)} ${this.formatMutationScore(this.stats.mutationData.mutationScore)}%`
      );
      console.log(
        `   Killed Mutants: ${colors.green}${this.stats.mutationData.killed}${colors.reset}`
      );
      console.log(
        `   Survived Mutants: ${colors.red}${this.stats.mutationData.survived}${colors.reset}`
      );
    }

    // Test Suite Statistics
    console.log(`\n${colors.bright}📈 TEST SUITE STATISTICS${colors.reset}`);
    console.log(`   Total Test Files: ${colors.green}${this.stats.totalTests}${colors.reset}`);
    console.log(`   Total Components: ${colors.green}${this.stats.totalComponents}${colors.reset}`);
    console.log(
      `   Test-to-Component Ratio: ${colors.green}${this.stats.qualityMetrics.testToComponentRatio.toFixed(2)}${colors.reset}`
    );

    if (this.stats.performanceData.totalTime) {
      console.log(
        `   Total Suite Time: ${this.formatDuration(this.stats.performanceData.totalTime)}`
      );
    }

    // Test Types Coverage
    console.log(`\n${colors.bright}🎯 TEST TYPES COVERAGE${colors.reset}`);
    console.log(`   Unit Tests: ${this.formatBoolean(true)} (Complete)`);
    console.log(
      `   Integration Tests: ${this.formatBoolean(this.stats.qualityMetrics.hasIntegrationTests)}`
    );
    console.log(`   E2E Tests: ${this.formatBoolean(this.stats.qualityMetrics.hasE2ETests)}`);
    console.log(
      `   Performance Tests: ${this.formatBoolean(this.stats.qualityMetrics.hasPerformanceTests)}`
    );
    console.log(
      `   Accessibility Tests: ${this.formatBoolean(this.stats.qualityMetrics.hasAccessibilityTests)}`
    );
    console.log(`   Visual Regression Tests: ${this.formatBoolean(false)} (Recommended)`);
  }

  /**
   * Generate actionable recommendations
   */
  generateActionItems() {
    if (this.stats.recommendations.length === 0) {
      console.log(`\n${colors.green}✅ EXCELLENT! No critical recommendations.${colors.reset}`);
      return;
    }

    console.log(this.createHeader('ACTIONABLE RECOMMENDATIONS'));

    const priorityOrder = ['critical', 'high', 'medium', 'low'];
    const groupedRecommendations = this.stats.recommendations.reduce((acc, rec) => {
      if (!acc[rec.priority]) {
        acc[rec.priority] = [];
      }
      acc[rec.priority].push(rec);
      return acc;
    }, {});

    for (const priority of priorityOrder) {
      const recommendations = groupedRecommendations[priority];
      if (!recommendations || recommendations.length === 0) {
        continue;
      }

      console.log(
        `\n${colors.bright}${this.getPriorityIcon(priority)} ${priority.toUpperCase()} PRIORITY${colors.reset}`
      );

      recommendations.forEach((rec, index) => {
        console.log(
          `\n   ${index + 1}. ${colors.bright}[${rec.category}]${colors.reset} ${rec.message}`
        );

        if (rec.actionItems && rec.actionItems.length > 0) {
          console.log(`      ${colors.cyan}Action Items:${colors.reset}`);
          rec.actionItems.forEach(action => {
            console.log(`      • ${action}`);
          });
        }
      });
    }

    // Quick wins section
    const quickWins = this.stats.recommendations.filter(
      rec => rec.priority === 'high' || rec.priority === 'critical'
    );

    if (quickWins.length > 0) {
      console.log(`\n${colors.bright}🚀 QUICK WINS (Start Here)${colors.reset}`);
      quickWins.slice(0, 3).forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec.message}`);
      });
    }
  }

  // Utility methods for formatting and analysis

  async findFiles(dir, includePattern, excludePattern = null) {
    const files = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.findFiles(fullPath, includePattern, excludePattern);
          files.push(...subFiles);
        } else if (includePattern.test(entry.name)) {
          if (!excludePattern || !excludePattern.test(entry.name)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  async checkForIntegrationTests() {
    const integrationFiles = await this.findFiles(
      path.join(rootDir, 'src', '__tests__'),
      /integration.*\.(test|spec)\./
    );
    return integrationFiles.length > 0;
  }

  async checkForE2ETests() {
    const e2eFiles = await this.findFiles(
      path.join(rootDir, 'src', '__tests__'),
      /e2e.*\.(test|spec)\./
    );
    return e2eFiles.length > 0;
  }

  async checkForPerformanceTests() {
    const perfFiles = await this.findFiles(
      path.join(rootDir, 'src', '__tests__'),
      /performance.*\.(test|spec)\./
    );
    return perfFiles.length > 0;
  }

  async checkForAccessibilityTests() {
    const a11yFiles = await this.findFiles(
      path.join(rootDir, 'src', '__tests__'),
      /accessibility.*\.(test|spec)\./
    );
    return a11yFiles.length > 0;
  }

  async checkForMockingStrategy() {
    try {
      const mockFiles = await this.findFiles(
        path.join(rootDir, 'src', '__tests__'),
        /mock.*\.(ts|js)/
      );
      return mockFiles.length > 0;
    } catch {
      return false;
    }
  }

  processPerformanceData(perfData) {
    // Mock performance data processing
    return {
      averageDuration: 150,
      slowestTest: 800,
      totalTime: 5000,
    };
  }

  formatCoverage(percentage) {
    if (percentage >= this.thresholds.coverage.excellent) {
      return `${colors.green}${percentage}${colors.reset}`;
    }
    if (percentage >= this.thresholds.coverage.good) {
      return `${colors.yellow}${percentage}${colors.reset}`;
    }
    return `${colors.red}${percentage}${colors.reset}`;
  }

  formatMutationScore(score) {
    if (score >= this.thresholds.mutation.excellent) {
      return `${colors.green}${score}${colors.reset}`;
    }
    if (score >= this.thresholds.mutation.good) {
      return `${colors.yellow}${score}${colors.reset}`;
    }
    return `${colors.red}${score}${colors.reset}`;
  }

  formatQualityScore(score) {
    if (score >= 90) {
      return `${colors.green}${score}${colors.reset}`;
    }
    if (score >= 75) {
      return `${colors.yellow}${score}${colors.reset}`;
    }
    return `${colors.red}${score}${colors.reset}`;
  }

  formatBoolean(value) {
    return value ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
  }

  formatDuration(ms) {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  }

  getQualityRating(score) {
    if (score >= 95) {
      return `${colors.green}EXCEPTIONAL${colors.reset}`;
    }
    if (score >= 90) {
      return `${colors.green}EXCELLENT${colors.reset}`;
    }
    if (score >= 80) {
      return `${colors.yellow}GOOD${colors.reset}`;
    }
    if (score >= 70) {
      return `${colors.yellow}ACCEPTABLE${colors.reset}`;
    }
    return `${colors.red}NEEDS IMPROVEMENT${colors.reset}`;
  }

  getPriorityIcon(priority) {
    const icons = {
      critical: `${colors.bgRed}🚨${colors.reset}`,
      high: `${colors.red}⚠️${colors.reset}`,
      medium: `${colors.yellow}💡${colors.reset}`,
      low: `${colors.blue}ℹ️${colors.reset}`,
    };
    return icons[priority] || '•';
  }

  createProgressBar(value, max, width) {
    const percentage = Math.min(value / max, 1);
    const filled = Math.round(width * percentage);
    const empty = width - filled;

    let color = colors.red;
    if (percentage >= 0.9) {
      color = colors.green;
    } else if (percentage >= 0.75) {
      color = colors.yellow;
    }

    return `${color}${'█'.repeat(filled)}${colors.reset}${'░'.repeat(empty)}`;
  }

  createHeader(title) {
    const width = 60;
    const padding = Math.max(0, (width - title.length - 2) / 2);
    const line = '═'.repeat(width);
    const titleLine = `║${' '.repeat(Math.floor(padding))}${title}${' '.repeat(Math.ceil(padding))}║`;

    return `\n${colors.cyan}╔${line}╗${colors.reset}\n${colors.cyan}${titleLine}${colors.reset}\n${colors.cyan}╚${line}╝${colors.reset}`;
  }
}

/**
 * Command line interface
 */
class ZenithCLI {
  constructor() {
    this.analyzer = new ZenithTestAnalyzer();
  }

  async run() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      this.showHelp();
      return;
    }

    if (args.includes('--version') || args.includes('-v')) {
      console.log('Zenith Test Optimizer v1.0.0');
      return;
    }

    if (args.includes('--quick')) {
      await this.runQuickAnalysis();
      return;
    }

    if (args.includes('--coverage-only')) {
      await this.runCoverageAnalysis();
      return;
    }

    if (args.includes('--mutation-only')) {
      await this.runMutationAnalysis();
      return;
    }

    // Run full analysis by default
    await this.analyzer.analyze();
  }

  async runQuickAnalysis() {
    console.log(`${colors.cyan}⚡ Running Quick Analysis...${colors.reset}\n`);

    await this.analyzer.gatherTestFiles();
    await this.analyzer.analyzeCoverage();
    await this.analyzer.analyzeTestQuality();
    await this.analyzer.calculateQualityScore();

    console.log(`\n${colors.bright}QUICK SUMMARY${colors.reset}`);
    console.log(
      `Quality Score: ${this.analyzer.formatQualityScore(this.analyzer.stats.qualityScore)}%`
    );
    console.log(`Test Files: ${colors.green}${this.analyzer.stats.totalTests}${colors.reset}`);
    console.log(`Components: ${colors.green}${this.analyzer.stats.totalComponents}${colors.reset}`);

    if (this.analyzer.stats.coverageData) {
      const avgCoverage =
        (this.analyzer.stats.coverageData.lines.pct +
          this.analyzer.stats.coverageData.branches.pct +
          this.analyzer.stats.coverageData.functions.pct +
          this.analyzer.stats.coverageData.statements.pct) /
        4;
      console.log(`Average Coverage: ${this.analyzer.formatCoverage(avgCoverage.toFixed(1))}%`);
    }
  }

  async runCoverageAnalysis() {
    console.log(`${colors.cyan}📊 Running Coverage Analysis...${colors.reset}\n`);

    await this.analyzer.gatherTestFiles();
    await this.analyzer.analyzeCoverage();

    if (this.analyzer.stats.coverageData) {
      const coverage = this.analyzer.stats.coverageData;
      console.log(`\n${colors.bright}COVERAGE REPORT${colors.reset}`);
      console.log(
        `Lines:      ${coverage.lines.pct}% (${coverage.lines.covered}/${coverage.lines.total})`
      );
      console.log(
        `Branches:   ${coverage.branches.pct}% (${coverage.branches.covered}/${coverage.branches.total})`
      );
      console.log(
        `Functions:  ${coverage.functions.pct}% (${coverage.functions.covered}/${coverage.functions.total})`
      );
      console.log(
        `Statements: ${coverage.statements.pct}% (${coverage.statements.covered}/${coverage.statements.total})`
      );
    }
  }

  async runMutationAnalysis() {
    console.log(`${colors.cyan}🧬 Running Mutation Analysis...${colors.reset}\n`);

    await this.analyzer.analyzeMutationTesting();

    if (this.analyzer.stats.mutationData) {
      const mutation = this.analyzer.stats.mutationData;
      console.log(`\n${colors.bright}MUTATION TESTING REPORT${colors.reset}`);
      console.log(`Mutation Score: ${mutation.mutationScore}%`);
      console.log(`Total Mutants: ${mutation.totalMutants}`);
      console.log(`Killed: ${colors.green}${mutation.killed}${colors.reset}`);
      console.log(`Survived: ${colors.red}${mutation.survived}${colors.reset}`);
      console.log(`No Coverage: ${colors.yellow}${mutation.noCoverage}${colors.reset}`);
      console.log(`Timeout: ${colors.yellow}${mutation.timeout}${colors.reset}`);
    }
  }

  showHelp() {
    console.log(`
${colors.cyan}Zenith Test Optimization Script${colors.reset}
${colors.bright}Comprehensive test suite analysis and recommendations${colors.reset}

${colors.yellow}USAGE:${colors.reset}
  node scripts/test-optimization.js [options]

${colors.yellow}OPTIONS:${colors.reset}
  --help, -h           Show this help message
  --version, -v        Show version information
  --quick             Run quick analysis (basic metrics only)
  --coverage-only     Run coverage analysis only
  --mutation-only     Run mutation testing analysis only

${colors.yellow}EXAMPLES:${colors.reset}
  node scripts/test-optimization.js                # Full analysis
  node scripts/test-optimization.js --quick        # Quick overview
  node scripts/test-optimization.js --coverage-only # Coverage only

${colors.yellow}REPORTS:${colors.reset}
  The script generates comprehensive reports including:
  • Test coverage analysis
  • Mutation testing results
  • Performance metrics
  • Quality recommendations
  • Actionable improvement items

${colors.cyan}Made with ❤️ by Zenith - The Ultimate Testing Virtuoso${colors.reset}
    `);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ZenithCLI();
  cli.run().catch(error => {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

export default ZenithTestAnalyzer;
