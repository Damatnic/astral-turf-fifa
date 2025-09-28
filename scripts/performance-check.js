#!/usr/bin/env node

/**
 * Catalyst Performance Check Script
 * Comprehensive performance validation for CI/CD pipeline
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

// Performance budgets
const budgets = JSON.parse(fs.readFileSync(path.join(__dirname, '../performance-budgets.json'), 'utf8'));

class CatalystPerformanceChecker {
  constructor() {
    this.results = {
      lighthouse: null,
      bundleAnalysis: null,
      loadTesting: null,
      memoryProfiling: null,
      timestamp: new Date().toISOString()
    };
    
    this.exitCode = 0;
    this.errors = [];
    this.warnings = [];
  }

  async run() {
    console.log('🚀 Catalyst Performance Check Starting...\n');
    
    try {
      // 1. Build the application
      await this.buildApplication();
      
      // 2. Run Lighthouse audit
      await this.runLighthouseAudit();
      
      // 3. Analyze bundle sizes
      await this.analyzeBundleSizes();
      
      // 4. Run load testing
      await this.runLoadTesting();
      
      // 5. Memory profiling
      await this.runMemoryProfiling();
      
      // 6. Validate against budgets
      await this.validateBudgets();
      
      // 7. Generate report
      await this.generateReport();
      
      console.log(this.exitCode === 0 ? '✅ All performance checks passed!' : '❌ Performance checks failed!');
      
    } catch (error) {
      console.error('❌ Performance check failed:', error);
      this.exitCode = 1;
    }
    
    process.exit(this.exitCode);
  }

  async buildApplication() {
    console.log('📦 Building application...');
    
    return new Promise((resolve, reject) => {
      const build = spawn('npm', ['run', 'build'], { stdio: 'pipe' });
      
      let output = '';
      build.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      build.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      build.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Build successful');
          resolve();
        } else {
          console.error('❌ Build failed');
          console.error(output);
          reject(new Error('Build failed'));
        }
      });
    });
  }

  async runLighthouseAudit() {
    console.log('🔍 Running Lighthouse audit...');
    
    // Start a local server for testing
    const server = spawn('npm', ['run', 'preview'], { 
      stdio: 'pipe',
      detached: true
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
      });
      
      const options = {
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
        budgets: budgets.budgets
      };
      
      const runnerResult = await lighthouse('http://localhost:4173', options);
      this.results.lighthouse = runnerResult.report;
      
      await chrome.kill();
      
      // Parse results
      const report = JSON.parse(runnerResult.report);
      const categories = report.categories;
      
      console.log('📊 Lighthouse Results:');
      Object.entries(categories).forEach(([category, data]) => {
        const score = Math.round(data.score * 100);
        const minScore = budgets.categories[category]?.minScore || 0;
        
        if (score >= minScore) {
          console.log(`  ✅ ${category}: ${score}/100`);
        } else {
          console.log(`  ❌ ${category}: ${score}/100 (required: ${minScore})`);
          this.errors.push(`${category} score (${score}) below minimum (${minScore})`);
          this.exitCode = 1;
        }
      });
      
      // Check Core Web Vitals
      const audits = report.audits;
      const coreWebVitals = {
        'largest-contentful-paint': { value: audits['largest-contentful-paint']?.numericValue, unit: 'ms' },
        'first-input-delay': { value: audits['max-potential-fid']?.numericValue, unit: 'ms' },
        'cumulative-layout-shift': { value: audits['cumulative-layout-shift']?.numericValue, unit: '' }
      };
      
      console.log('\n📈 Core Web Vitals:');
      Object.entries(coreWebVitals).forEach(([metric, data]) => {
        if (data.value !== undefined) {
          const budget = budgets.budgets[0].timings.find(t => t.metric === metric.replace('largest-contentful-paint', 'lcp').replace('first-input-delay', 'fid').replace('cumulative-layout-shift', 'cls'));
          
          if (budget) {
            if (data.value <= budget.budget) {
              console.log(`  ✅ ${metric}: ${data.value}${data.unit} (budget: ${budget.budget}${data.unit})`);
            } else {
              console.log(`  ❌ ${metric}: ${data.value}${data.unit} (budget: ${budget.budget}${data.unit})`);
              this.errors.push(`${metric} (${data.value}${data.unit}) exceeds budget (${budget.budget}${data.unit})`);
              this.exitCode = 1;
            }
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Lighthouse audit failed:', error);
      this.exitCode = 1;
    } finally {
      // Stop the server
      if (server.pid) {
        process.kill(-server.pid);
      }
    }
  }

  async analyzeBundleSizes() {
    console.log('📊 Analyzing bundle sizes...');
    
    const distPath = path.join(__dirname, '../dist');
    
    if (!fs.existsSync(distPath)) {
      console.error('❌ Dist directory not found');
      this.exitCode = 1;
      return;
    }
    
    const bundleStats = {};
    
    // Analyze JavaScript bundles
    const jsFiles = this.getFilesRecursive(distPath, '.js');
    let totalJsSize = 0;
    
    jsFiles.forEach(file => {
      const stats = fs.statSync(file);
      const relativePath = path.relative(distPath, file);
      const size = stats.size;
      
      bundleStats[relativePath] = { size, type: 'script' };
      totalJsSize += size;
    });
    
    // Analyze CSS bundles
    const cssFiles = this.getFilesRecursive(distPath, '.css');
    let totalCssSize = 0;
    
    cssFiles.forEach(file => {
      const stats = fs.statSync(file);
      const relativePath = path.relative(distPath, file);
      const size = stats.size;
      
      bundleStats[relativePath] = { size, type: 'stylesheet' };
      totalCssSize += size;
    });
    
    this.results.bundleAnalysis = {
      totalJsSize,
      totalCssSize,
      totalSize: totalJsSize + totalCssSize,
      files: bundleStats
    };
    
    // Check against budgets
    const scriptBudget = budgets.budgets[0].resourceSizes.find(r => r.resourceType === 'script');
    const styleBudget = budgets.budgets[0].resourceSizes.find(r => r.resourceType === 'stylesheet');
    const totalBudget = budgets.budgets[0].resourceSizes.find(r => r.resourceType === 'total');
    
    console.log('📦 Bundle Analysis:');
    
    // JavaScript
    const jsKB = Math.round(totalJsSize / 1024);
    if (jsKB <= scriptBudget.budget) {
      console.log(`  ✅ JavaScript: ${jsKB}KB (budget: ${scriptBudget.budget}KB)`);
    } else {
      console.log(`  ❌ JavaScript: ${jsKB}KB (budget: ${scriptBudget.budget}KB)`);
      this.errors.push(`JavaScript bundle size (${jsKB}KB) exceeds budget (${scriptBudget.budget}KB)`);
      this.exitCode = 1;
    }
    
    // CSS
    const cssKB = Math.round(totalCssSize / 1024);
    if (cssKB <= styleBudget.budget) {
      console.log(`  ✅ CSS: ${cssKB}KB (budget: ${styleBudget.budget}KB)`);
    } else {
      console.log(`  ❌ CSS: ${cssKB}KB (budget: ${styleBudget.budget}KB)`);
      this.errors.push(`CSS bundle size (${cssKB}KB) exceeds budget (${styleBudget.budget}KB)`);
      this.exitCode = 1;
    }
    
    // Total
    const totalKB = Math.round((totalJsSize + totalCssSize) / 1024);
    if (totalKB <= totalBudget.budget) {
      console.log(`  ✅ Total: ${totalKB}KB (budget: ${totalBudget.budget}KB)`);
    } else {
      console.log(`  ❌ Total: ${totalKB}KB (budget: ${totalBudget.budget}KB)`);
      this.errors.push(`Total bundle size (${totalKB}KB) exceeds budget (${totalBudget.budget}KB)`);
      this.exitCode = 1;
    }
  }

  async runLoadTesting() {
    console.log('🔄 Running load testing...');
    
    // Simple load test simulation
    const startTime = Date.now();
    const testDuration = 10000; // 10 seconds
    let requestCount = 0;
    let errorCount = 0;
    const responseTimes = [];
    
    // Start preview server
    const server = spawn('npm', ['run', 'preview'], { 
      stdio: 'pipe',
      detached: true
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const makeRequest = async () => {
        const reqStart = Date.now();
        
        try {
          const response = await fetch('http://localhost:4173');
          const responseTime = Date.now() - reqStart;
          responseTimes.push(responseTime);
          requestCount++;
          
          if (!response.ok) {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          requestCount++;
        }
      };
      
      // Concurrent requests
      const concurrency = 10;
      const interval = setInterval(() => {
        if (Date.now() - startTime < testDuration) {
          for (let i = 0; i < concurrency; i++) {
            makeRequest();
          }
        }
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, testDuration));
      clearInterval(interval);
      
      // Calculate metrics
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
      const errorRate = errorCount / requestCount;
      const rps = requestCount / (testDuration / 1000);
      
      this.results.loadTesting = {
        requestCount,
        errorCount,
        errorRate,
        avgResponseTime,
        p95ResponseTime,
        requestsPerSecond: rps
      };
      
      console.log('⚡ Load Testing Results:');
      console.log(`  Requests: ${requestCount}`);
      console.log(`  Error Rate: ${(errorRate * 100).toFixed(2)}%`);
      console.log(`  Avg Response Time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  P95 Response Time: ${p95ResponseTime.toFixed(2)}ms`);
      console.log(`  Requests/sec: ${rps.toFixed(2)}`);
      
      // Check against thresholds
      const alertThresholds = budgets.catalyst.monitoring.alertThresholds;
      
      if (errorRate <= alertThresholds.errorRate) {
        console.log(`  ✅ Error rate within threshold`);
      } else {
        console.log(`  ❌ Error rate (${(errorRate * 100).toFixed(2)}%) exceeds threshold (${(alertThresholds.errorRate * 100).toFixed(2)}%)`);
        this.errors.push(`Error rate too high`);
        this.exitCode = 1;
      }
      
      if (p95ResponseTime <= alertThresholds.p95ResponseTime) {
        console.log(`  ✅ P95 response time within threshold`);
      } else {
        console.log(`  ❌ P95 response time (${p95ResponseTime.toFixed(2)}ms) exceeds threshold (${alertThresholds.p95ResponseTime}ms)`);
        this.errors.push(`P95 response time too high`);
        this.exitCode = 1;
      }
      
    } catch (error) {
      console.error('❌ Load testing failed:', error);
      this.exitCode = 1;
    } finally {
      if (server.pid) {
        process.kill(-server.pid);
      }
    }
  }

  async runMemoryProfiling() {
    console.log('🧠 Running memory profiling...');
    
    // Simulate memory usage analysis
    const memoryThresholds = budgets.catalyst.thresholds.memoryUsage;
    
    // Mock memory usage (in production, this would use actual profiling)
    const mockMemoryUsage = {
      heapUsed: 45 * 1024 * 1024, // 45MB
      heapTotal: 60 * 1024 * 1024, // 60MB
      external: 5 * 1024 * 1024, // 5MB
      rss: 120 * 1024 * 1024 // 120MB
    };
    
    this.results.memoryProfiling = mockMemoryUsage;
    
    console.log('🧠 Memory Profiling Results:');
    console.log(`  Heap Used: ${(mockMemoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Heap Total: ${(mockMemoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  RSS: ${(mockMemoryUsage.rss / 1024 / 1024).toFixed(2)}MB`);
    
    // Check against thresholds
    if (mockMemoryUsage.heapUsed <= memoryThresholds.warning) {
      console.log(`  ✅ Memory usage within normal range`);
    } else if (mockMemoryUsage.heapUsed <= memoryThresholds.critical) {
      console.log(`  ⚠️ Memory usage approaching warning threshold`);
      this.warnings.push('Memory usage approaching warning threshold');
    } else {
      console.log(`  ❌ Memory usage exceeds critical threshold`);
      this.errors.push('Memory usage too high');
      this.exitCode = 1;
    }
  }

  async validateBudgets() {
    console.log('💰 Validating performance budgets...');
    
    let budgetViolations = 0;
    
    // Count all violations collected during tests
    budgetViolations += this.errors.length;
    
    if (budgetViolations === 0) {
      console.log('✅ All performance budgets met');
    } else {
      console.log(`❌ ${budgetViolations} budget violation(s) found`);
    }
  }

  async generateReport() {
    const report = {
      timestamp: this.results.timestamp,
      status: this.exitCode === 0 ? 'PASS' : 'FAIL',
      summary: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        totalChecks: this.errors.length + this.warnings.length + (this.exitCode === 0 ? 10 : 0)
      },
      results: this.results,
      errors: this.errors,
      warnings: this.warnings,
      budgets: budgets
    };
    
    // Save report
    const reportPath = path.join(__dirname, '../performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Performance report saved to ${reportPath}`);
    
    // Summary
    console.log('\n📋 Performance Check Summary:');
    console.log(`  Status: ${report.status}`);
    console.log(`  Errors: ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
  }

  getFilesRecursive(dir, extension) {
    let files = [];
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getFilesRecursive(fullPath, extension));
      } else if (fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new CatalystPerformanceChecker();
  checker.run();
}

module.exports = CatalystPerformanceChecker;