#!/usr/bin/env node

/**
 * Bundle Size Analysis and Monitoring Script
 * Analyzes bundle size and enforces size limits for production builds
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size thresholds (in KB)
const SIZE_LIMITS = {
  // Main application bundle
  'index.js': 500, // 500KB max
  'index.css': 100, // 100KB max

  // Vendor/chunk limits
  vendor: 800, // 800KB max for vendor chunks
  'async-chunks': 200, // 200KB max per async chunk

  // Total bundle size
  total: 2000, // 2MB total max

  // Asset limits
  images: 50, // 50KB max per image
  fonts: 30, // 30KB max per font
};

// Performance budget alerts
const PERFORMANCE_BUDGETS = {
  critical: 150, // Critical resources: 150KB
  warning: 300, // Warning threshold: 300KB
  error: 500, // Error threshold: 500KB
};

class BundleAnalyzer {
  constructor() {
    this.distPath = path.resolve(__dirname, '../dist');
    this.reportPath = path.resolve(__dirname, '../bundle-analysis');
    this.violations = [];
    this.warnings = [];
    this.metrics = {
      totalSize: 0,
      chunkCount: 0,
      assetCount: 0,
      compressionRatio: 0,
    };
  }

  async analyze() {
    console.log('🔍 Starting bundle size analysis...\n');

    try {
      // Ensure dist directory exists
      await this.ensureDistExists();

      // Create report directory
      await this.ensureReportDir();

      // Analyze bundle contents
      await this.analyzeBundleContents();

      // Generate size report
      await this.generateSizeReport();

      // Check size limits
      await this.checkSizeLimits();

      // Generate recommendations
      await this.generateRecommendations();

      // Output results
      this.outputResults();

      // Exit with appropriate code
      this.exitWithStatus();
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      process.exit(1);
    }
  }

  async ensureDistExists() {
    try {
      await fs.access(this.distPath);
    } catch (error) {
      throw new Error(
        `Distribution directory not found: ${this.distPath}. Run 'npm run build' first.`
      );
    }
  }

  async ensureReportDir() {
    try {
      await fs.mkdir(this.reportPath, { recursive: true });
    } catch (error) {
      console.warn('⚠️ Could not create report directory:', error.message);
    }
  }

  async analyzeBundleContents() {
    const files = await this.getDistFiles();

    for (const file of files) {
      const filePath = path.join(this.distPath, file);
      const stats = await fs.stat(filePath);
      const sizeKB = Math.round((stats.size / 1024) * 100) / 100;

      // Update metrics
      this.metrics.totalSize += sizeKB;

      if (file.endsWith('.js')) {
        this.metrics.chunkCount++;
      } else {
        this.metrics.assetCount++;
      }

      // Check individual file limits
      this.checkFileSize(file, sizeKB);
    }
  }

  async getDistFiles() {
    const getAllFiles = async (dir, fileList = []) => {
      const files = await fs.readdir(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          await getAllFiles(filePath, fileList);
        } else {
          const relativePath = path.relative(this.distPath, filePath);
          fileList.push(relativePath);
        }
      }

      return fileList;
    };

    return await getAllFiles(this.distPath);
  }

  checkFileSize(file, sizeKB) {
    const fileName = path.basename(file);
    const ext = path.extname(file);

    // Check specific file limits
    if (SIZE_LIMITS[fileName] && sizeKB > SIZE_LIMITS[fileName]) {
      this.violations.push({
        type: 'file_size',
        file,
        actual: sizeKB,
        limit: SIZE_LIMITS[fileName],
        severity: 'error',
      });
    }

    // Check by file type
    if (ext === '.js' && fileName.includes('vendor') && sizeKB > SIZE_LIMITS.vendor) {
      this.violations.push({
        type: 'vendor_size',
        file,
        actual: sizeKB,
        limit: SIZE_LIMITS.vendor,
        severity: 'error',
      });
    }

    if (ext === '.js' && !fileName.includes('vendor') && sizeKB > SIZE_LIMITS['async-chunks']) {
      this.warnings.push({
        type: 'chunk_size',
        file,
        actual: sizeKB,
        limit: SIZE_LIMITS['async-chunks'],
        severity: 'warning',
      });
    }

    // Performance budget checks
    if (sizeKB > PERFORMANCE_BUDGETS.error) {
      this.violations.push({
        type: 'performance_budget',
        file,
        actual: sizeKB,
        limit: PERFORMANCE_BUDGETS.error,
        severity: 'error',
      });
    } else if (sizeKB > PERFORMANCE_BUDGETS.warning) {
      this.warnings.push({
        type: 'performance_budget',
        file,
        actual: sizeKB,
        limit: PERFORMANCE_BUDGETS.warning,
        severity: 'warning',
      });
    }
  }

  async checkSizeLimits() {
    // Check total bundle size
    if (this.metrics.totalSize > SIZE_LIMITS.total) {
      this.violations.push({
        type: 'total_size',
        file: 'entire bundle',
        actual: this.metrics.totalSize,
        limit: SIZE_LIMITS.total,
        severity: 'error',
      });
    }
  }

  async generateSizeReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      limits: SIZE_LIMITS,
      violations: this.violations,
      warnings: this.warnings,
      summary: {
        totalViolations: this.violations.length,
        totalWarnings: this.warnings.length,
        passed: this.violations.length === 0,
        grade: this.calculateGrade(),
      },
    };

    try {
      await fs.writeFile(
        path.join(this.reportPath, 'bundle-size-report.json'),
        JSON.stringify(report, null, 2)
      );

      // Generate human-readable report
      await this.generateHumanReport(report);
    } catch (error) {
      console.warn('⚠️ Could not write bundle size report:', error.message);
    }
  }

  async generateHumanReport(report) {
    const humanReport = `
# Bundle Size Analysis Report

**Generated:** ${report.timestamp}
**Overall Grade:** ${report.summary.grade}
**Status:** ${report.summary.passed ? '✅ PASSED' : '❌ FAILED'}

## Metrics Summary

- **Total Bundle Size:** ${report.metrics.totalSize.toFixed(2)} KB
- **Chunk Count:** ${report.metrics.chunkCount}
- **Asset Count:** ${report.metrics.assetCount}
- **Size Limit:** ${SIZE_LIMITS.total} KB
- **Utilization:** ${((report.metrics.totalSize / SIZE_LIMITS.total) * 100).toFixed(1)}%

## Size Violations (${report.violations.length})

${report.violations
  .map(v => `- **${v.file}**: ${v.actual} KB (limit: ${v.limit} KB) - *${v.type}*`)
  .join('\n')}

## Warnings (${report.warnings.length})

${report.warnings
  .map(w => `- **${w.file}**: ${w.actual} KB (recommended: ${w.limit} KB) - *${w.type}*`)
  .join('\n')}

## Recommendations

${this.getRecommendations().join('\n')}

---
*Generated by Zenith Bundle Analyzer*
`;

    try {
      await fs.writeFile(path.join(this.reportPath, 'bundle-size-report.md'), humanReport);
    } catch (error) {
      console.warn('⚠️ Could not write human-readable report:', error.message);
    }
  }

  calculateGrade() {
    const violationCount = this.violations.length;
    const warningCount = this.warnings.length;
    const utilizationPct = (this.metrics.totalSize / SIZE_LIMITS.total) * 100;

    if (violationCount > 0) {
      return 'F';
    }
    if (warningCount > 3 || utilizationPct > 90) {
      return 'D';
    }
    if (warningCount > 1 || utilizationPct > 80) {
      return 'C';
    }
    if (warningCount > 0 || utilizationPct > 70) {
      return 'B';
    }
    return 'A';
  }

  getRecommendations() {
    const recommendations = [];

    if (this.metrics.totalSize > SIZE_LIMITS.total * 0.8) {
      recommendations.push('🔍 Consider implementing code splitting to reduce bundle size');
      recommendations.push(
        '📦 Analyze dependencies with `npm run analyze` to identify large packages'
      );
    }

    if (this.violations.some(v => v.type === 'vendor_size')) {
      recommendations.push('📚 Vendor bundle is too large - consider using dynamic imports');
      recommendations.push('🌳 Implement tree shaking to remove unused code');
    }

    if (this.warnings.some(w => w.type === 'chunk_size')) {
      recommendations.push('✂️ Split large chunks using dynamic imports');
      recommendations.push('⚡ Implement lazy loading for non-critical components');
    }

    if (this.metrics.chunkCount > 20) {
      recommendations.push('🎯 Consider consolidating small chunks to reduce HTTP requests');
    }

    recommendations.push('💡 Use compression (gzip/brotli) in production');
    recommendations.push('📊 Monitor bundle size changes in CI/CD pipeline');

    return recommendations;
  }

  async generateRecommendations() {
    const recommendations = this.getRecommendations();

    try {
      await fs.writeFile(
        path.join(this.reportPath, 'optimization-recommendations.md'),
        `# Bundle Optimization Recommendations\n\n${recommendations.map(r => `- ${r}`).join('\n')}\n`
      );
    } catch (error) {
      console.warn('⚠️ Could not write recommendations:', error.message);
    }
  }

  outputResults() {
    console.log('📊 Bundle Size Analysis Results\n');
    console.log('='.repeat(50));
    console.log(`Total Bundle Size: ${this.metrics.totalSize.toFixed(2)} KB`);
    console.log(`Size Limit: ${SIZE_LIMITS.total} KB`);
    console.log(`Utilization: ${((this.metrics.totalSize / SIZE_LIMITS.total) * 100).toFixed(1)}%`);
    console.log(`Grade: ${this.calculateGrade()}`);
    console.log('='.repeat(50));

    if (this.violations.length > 0) {
      console.log('\n❌ Size Violations:');
      this.violations.forEach(v => {
        console.log(`  • ${v.file}: ${v.actual} KB (limit: ${v.limit} KB)`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(w => {
        console.log(`  • ${w.file}: ${w.actual} KB (recommended: ${w.limit} KB)`);
      });
    }

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All bundle size checks passed!');
    }

    console.log(`\n📁 Detailed reports saved to: ${this.reportPath}`);
  }

  exitWithStatus() {
    if (this.violations.length > 0) {
      console.log('\n❌ Bundle size analysis failed due to violations.');
      process.exit(1);
    } else {
      console.log('\n✅ Bundle size analysis passed.');
      process.exit(0);
    }
  }
}

// Execute if run directly
if (process.argv[1] === __filename) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('💥 Bundle analysis crashed:', error);
    process.exit(1);
  });
}

export default BundleAnalyzer;
