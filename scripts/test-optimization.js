#!/usr/bin/env node

/**
 * Test Optimization Script
 * Analyzes and optimizes test execution for maximum efficiency
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TestOptimizer {
  constructor() {
    this.testFiles = [];
    this.executionTimes = new Map();
    this.testGroups = new Map();
  }

  /**
   * Analyze test files and execution patterns
   */
  analyzeTestFiles() {
    console.log('🔍 Analyzing test files...');

    const testDirs = [
      'src/__tests__/components',
      'src/__tests__/hooks',
      'src/__tests__/services',
      'src/__tests__/context',
      'src/__tests__/integration',
      'src/__tests__/utils',
      'src/__tests__/visual',
      'src/__tests__/accessibility',
      'src/__tests__/performance',
    ];

    testDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        const files = this.getTestFiles(fullPath);
        files.forEach(file => {
          const stats = fs.statSync(file);
          const size = stats.size;
          const category = this.categorizeTest(file);

          this.testFiles.push({
            file,
            size,
            category,
            lastModified: stats.mtime,
          });
        });
      }
    });

    console.log(`📊 Found ${this.testFiles.length} test files`);
  }

  /**
   * Get all test files in a directory
   */
  getTestFiles(dir) {
    const files = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...this.getTestFiles(fullPath));
      } else if (entry.name.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/)) {
        files.push(fullPath);
      }
    });

    return files;
  }

  /**
   * Categorize tests by type and complexity
   */
  categorizeTest(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Count different types of test patterns
    const patterns = {
      unit: content.match(/describe\(|it\(/g)?.length || 0,
      integration: content.match(/render\(|renderHook\(/g)?.length || 0,
      async: content.match(/async|await|Promise/g)?.length || 0,
      mocks: content.match(/vi\.mock|jest\.mock|mockImplementation/g)?.length || 0,
      snapshots: content.match(/toMatchSnapshot/g)?.length || 0,
    };

    // Calculate complexity score
    const complexity =
      patterns.unit +
      patterns.integration * 2 +
      patterns.async * 1.5 +
      patterns.mocks * 0.5 +
      patterns.snapshots * 0.5;

    return {
      type: this.getTestType(filePath),
      complexity,
      patterns,
      estimatedTime: this.estimateExecutionTime(complexity, patterns),
    };
  }

  /**
   * Determine test type from file path
   */
  getTestType(filePath) {
    if (filePath.includes('/components/')) {
      return 'component';
    }
    if (filePath.includes('/hooks/')) {
      return 'hook';
    }
    if (filePath.includes('/services/')) {
      return 'service';
    }
    if (filePath.includes('/context/')) {
      return 'context';
    }
    if (filePath.includes('/integration/')) {
      return 'integration';
    }
    if (filePath.includes('/utils/')) {
      return 'utility';
    }
    if (filePath.includes('/visual/')) {
      return 'visual';
    }
    if (filePath.includes('/accessibility/')) {
      return 'accessibility';
    }
    if (filePath.includes('/performance/')) {
      return 'performance';
    }
    return 'other';
  }

  /**
   * Estimate test execution time based on patterns
   */
  estimateExecutionTime(complexity, patterns) {
    const baseTime = 100; // 100ms base
    const integrationPenalty = patterns.integration * 50;
    const asyncPenalty = patterns.async * 30;
    const complexityMultiplier = Math.log(complexity + 1) * 100;

    return baseTime + integrationPenalty + asyncPenalty + complexityMultiplier;
  }

  /**
   * Create optimal test groups for parallel execution
   */
  createTestGroups(maxGroupTime = 30000) {
    // 30 seconds max per group
    console.log('⚡ Creating optimal test groups...');

    // Sort tests by estimated execution time (longest first)
    const sortedTests = [...this.testFiles].sort(
      (a, b) => b.category.estimatedTime - a.category.estimatedTime
    );

    const groups = [];
    let currentGroup = [];
    let currentGroupTime = 0;

    sortedTests.forEach(test => {
      const testTime = test.category.estimatedTime;

      // If adding this test would exceed the group time limit, start a new group
      if (currentGroupTime + testTime > maxGroupTime && currentGroup.length > 0) {
        groups.push({
          tests: [...currentGroup],
          estimatedTime: currentGroupTime,
          types: this.getGroupTypes(currentGroup),
        });

        currentGroup = [test];
        currentGroupTime = testTime;
      } else {
        currentGroup.push(test);
        currentGroupTime += testTime;
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({
        tests: currentGroup,
        estimatedTime: currentGroupTime,
        types: this.getGroupTypes(currentGroup),
      });
    }

    this.testGroups = groups;

    console.log(`📦 Created ${groups.length} test groups`);
    groups.forEach((group, i) => {
      console.log(
        `   Group ${i + 1}: ${group.tests.length} tests (~${Math.round(group.estimatedTime)}ms)`
      );
    });

    return groups;
  }

  /**
   * Get test types in a group
   */
  getGroupTypes(tests) {
    const types = new Set();
    tests.forEach(test => types.add(test.category.type));
    return Array.from(types);
  }

  /**
   * Generate optimized test scripts
   */
  generateOptimizedScripts() {
    console.log('📝 Generating optimized test scripts...');

    const scripts = {
      'test:fast': this.generateFastTestScript(),
      'test:parallel': this.generateParallelTestScript(),
      'test:critical': this.generateCriticalTestScript(),
      'test:unit-only': this.generateUnitOnlyScript(),
      'test:integration-only': this.generateIntegrationOnlyScript(),
    };

    // Write scripts to package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    Object.assign(packageJson.scripts, scripts);

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with optimized scripts');

    return scripts;
  }

  /**
   * Generate fast test script for quick feedback
   */
  generateFastTestScript() {
    const fastTests = this.testFiles
      .filter(test => test.category.estimatedTime < 1000) // Under 1 second
      .filter(test => ['component', 'hook', 'utility'].includes(test.category.type))
      .map(test => test.file)
      .slice(0, 20); // Limit to 20 fastest tests

    return `vitest run ${fastTests.join(' ')} --reporter=dot --no-coverage`;
  }

  /**
   * Generate parallel test script
   */
  generateParallelTestScript() {
    const groups =
      this.testGroups.size > 0 ? Array.from(this.testGroups.values()) : this.createTestGroups();

    // Create separate commands for each group
    const commands = groups.map((group, i) => {
      const files = group.tests.map(test => test.file).join(' ');
      return `vitest run ${files} --reporter=verbose`;
    });

    return commands.join(' && ');
  }

  /**
   * Generate critical path test script
   */
  generateCriticalTestScript() {
    const criticalPaths = [
      'src/__tests__/services/authService.test.ts',
      'src/__tests__/context/AppProvider.test.tsx',
      'src/__tests__/integration/TacticsBoard.test.tsx',
      'src/__tests__/components/Layout.test.tsx',
    ];

    return `vitest run ${criticalPaths.join(' ')} --reporter=verbose --bail=1`;
  }

  /**
   * Generate unit-only test script
   */
  generateUnitOnlyScript() {
    const unitTests = this.testFiles
      .filter(test => ['component', 'hook', 'utility'].includes(test.category.type))
      .filter(test => test.category.patterns.integration < 3) // Low integration complexity
      .map(test => test.file);

    return `vitest run ${unitTests.join(' ')} --reporter=verbose --coverage`;
  }

  /**
   * Generate integration-only test script
   */
  generateIntegrationOnlyScript() {
    const integrationTests = this.testFiles
      .filter(test => ['integration', 'context', 'service'].includes(test.category.type))
      .map(test => test.file);

    return `vitest run ${integrationTests.join(' ')} --reporter=verbose --timeout=10000`;
  }

  /**
   * Analyze test performance from previous runs
   */
  analyzePerformance() {
    console.log('📊 Analyzing test performance...');

    // Try to read previous test results
    const reportPaths = [
      'coverage/test-report.json',
      'test-results.json',
      '.vitest-cache/results.json',
    ];

    reportPaths.forEach(reportPath => {
      if (fs.existsSync(reportPath)) {
        try {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          this.extractExecutionTimes(report);
        } catch (e) {
          console.log(`⚠️ Could not parse ${reportPath}`);
        }
      }
    });

    return this.executionTimes;
  }

  /**
   * Extract execution times from test reports
   */
  extractExecutionTimes(report) {
    // This would parse actual test results to get real execution times
    // Implementation depends on test runner output format
    if (report.testResults) {
      report.testResults.forEach(result => {
        this.executionTimes.set(result.name, result.duration || 0);
      });
    }
  }

  /**
   * Generate performance report
   */
  generateReport() {
    console.log('📋 Generating optimization report...');

    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.testFiles.length,
      testsByType: this.getTestsByType(),
      estimatedTotalTime: this.getEstimatedTotalTime(),
      groups: this.testGroups.size || 0,
      optimization: this.getOptimizationSuggestions(),
    };

    fs.writeFileSync('test-optimization-report.json', JSON.stringify(report, null, 2));

    console.log('\n📊 Test Optimization Report:');
    console.log(`   Total tests: ${report.totalTests}`);
    console.log(`   Estimated execution time: ${Math.round(report.estimatedTotalTime / 1000)}s`);
    console.log(`   Parallel groups: ${report.groups}`);
    console.log(`   Optimization suggestions: ${report.optimization.length}`);

    return report;
  }

  /**
   * Get tests grouped by type
   */
  getTestsByType() {
    const byType = {};
    this.testFiles.forEach(test => {
      const type = test.category.type;
      byType[type] = (byType[type] || 0) + 1;
    });
    return byType;
  }

  /**
   * Get estimated total execution time
   */
  getEstimatedTotalTime() {
    return this.testFiles.reduce((total, test) => total + test.category.estimatedTime, 0);
  }

  /**
   * Get optimization suggestions
   */
  getOptimizationSuggestions() {
    const suggestions = [];

    // Check for slow tests
    const slowTests = this.testFiles.filter(test => test.category.estimatedTime > 5000);
    if (slowTests.length > 0) {
      suggestions.push({
        type: 'slow-tests',
        message: `${slowTests.length} tests are estimated to take >5s`,
        files: slowTests.map(test => test.file),
      });
    }

    // Check for large test files
    const largeTests = this.testFiles.filter(test => test.size > 50000); // 50KB
    if (largeTests.length > 0) {
      suggestions.push({
        type: 'large-files',
        message: `${largeTests.length} test files are >50KB`,
        files: largeTests.map(test => test.file),
      });
    }

    // Check for excessive mocking
    const heavyMockTests = this.testFiles.filter(test => test.category.patterns.mocks > 20);
    if (heavyMockTests.length > 0) {
      suggestions.push({
        type: 'heavy-mocking',
        message: `${heavyMockTests.length} tests have excessive mocking`,
        files: heavyMockTests.map(test => test.file),
      });
    }

    return suggestions;
  }

  /**
   * Run the optimization process
   */
  async run() {
    console.log('🚀 Starting test optimization...\n');

    this.analyzeTestFiles();
    this.analyzePerformance();
    this.createTestGroups();
    this.generateOptimizedScripts();
    const report = this.generateReport();

    console.log('\n✅ Test optimization complete!');
    console.log('📝 Run optimized tests with:');
    console.log('   npm run test:fast     # Quick feedback loop');
    console.log('   npm run test:parallel # Parallel execution');
    console.log('   npm run test:critical # Critical path only');

    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new TestOptimizer();
  optimizer.run().catch(console.error);
}

module.exports = TestOptimizer;
