/**
 * Bundle Analysis Script
 * Analyzes the production build for size, performance, and optimization opportunities
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

const DIST_DIR = './dist';
const ASSETS_DIR = join(DIST_DIR, 'assets');

// Size thresholds (in KB)
const THRESHOLDS = {
  JS_CHUNK_WARNING: 300,
  JS_CHUNK_ERROR: 500,
  CSS_WARNING: 50,
  TOTAL_WARNING: 2000,
  TOTAL_ERROR: 5000,
};

class BundleAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      gzippedSize: 0,
      files: [],
      warnings: [],
      errors: [],
      recommendations: [],
    };
  }

  analyze() {
    console.log('🔍 Analyzing production bundle...\n');

    try {
      this.analyzeFiles();
      this.checkThresholds();
      this.generateRecommendations();
      this.printReport();
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error.message);
      process.exit(1);
    }
  }

  analyzeFiles() {
    if (!this.directoryExists(DIST_DIR)) {
      throw new Error(`Distribution directory not found: ${DIST_DIR}`);
    }

    // Analyze main HTML file
    const indexPath = join(DIST_DIR, 'index.html');
    if (this.fileExists(indexPath)) {
      this.analyzeFile(indexPath);
    }

    // Analyze assets
    if (this.directoryExists(ASSETS_DIR)) {
      const assetFiles = readdirSync(ASSETS_DIR);

      assetFiles.forEach(file => {
        const filePath = join(ASSETS_DIR, file);
        this.analyzeFile(filePath);
      });
    }

    // Sort files by size (largest first)
    this.results.files.sort((a, b) => b.size - a.size);
  }

  analyzeFile(filePath) {
    try {
      const stats = statSync(filePath);
      const content = readFileSync(filePath);
      const gzipped = gzipSync(content);

      const fileInfo = {
        name: filePath.replace(DIST_DIR, ''),
        size: stats.size,
        gzippedSize: gzipped.length,
        type: this.getFileType(filePath),
        compressionRatio: (((stats.size - gzipped.length) / stats.size) * 100).toFixed(1),
      };

      this.results.files.push(fileInfo);
      this.results.totalSize += stats.size;
      this.results.gzippedSize += gzipped.length;
    } catch (error) {
      console.warn(`⚠️  Could not analyze file: ${filePath}`);
    }
  }

  getFileType(filePath) {
    const ext = extname(filePath).toLowerCase();
    const typeMap = {
      '.js': 'JavaScript',
      '.css': 'CSS',
      '.html': 'HTML',
      '.woff': 'Font',
      '.woff2': 'Font',
      '.png': 'Image',
      '.jpg': 'Image',
      '.jpeg': 'Image',
      '.svg': 'SVG',
      '.ico': 'Icon',
    };
    return typeMap[ext] || 'Other';
  }

  checkThresholds() {
    this.results.files.forEach(file => {
      const sizeKB = file.size / 1024;

      if (file.type === 'JavaScript') {
        if (sizeKB > THRESHOLDS.JS_CHUNK_ERROR) {
          this.results.errors.push(
            `JavaScript chunk too large: ${file.name} (${sizeKB.toFixed(1)}KB)`,
          );
        } else if (sizeKB > THRESHOLDS.JS_CHUNK_WARNING) {
          this.results.warnings.push(
            `Large JavaScript chunk: ${file.name} (${sizeKB.toFixed(1)}KB)`,
          );
        }
      }

      if (file.type === 'CSS' && sizeKB > THRESHOLDS.CSS_WARNING) {
        this.results.warnings.push(`Large CSS file: ${file.name} (${sizeKB.toFixed(1)}KB)`);
      }
    });

    const totalKB = this.results.totalSize / 1024;
    if (totalKB > THRESHOLDS.TOTAL_ERROR) {
      this.results.errors.push(`Total bundle size too large: ${totalKB.toFixed(1)}KB`);
    } else if (totalKB > THRESHOLDS.TOTAL_WARNING) {
      this.results.warnings.push(`Large total bundle size: ${totalKB.toFixed(1)}KB`);
    }
  }

  generateRecommendations() {
    const jsFiles = this.results.files.filter(f => f.type === 'JavaScript');
    const largeJsFiles = jsFiles.filter(f => f.size / 1024 > THRESHOLDS.JS_CHUNK_WARNING);

    if (largeJsFiles.length > 0) {
      this.results.recommendations.push('Consider code splitting for large JavaScript chunks');
      this.results.recommendations.push('Implement lazy loading for non-critical components');
    }

    const totalJsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
    const totalSize = this.results.totalSize;
    const jsPercentage = ((totalJsSize / totalSize) * 100).toFixed(1);

    if (parseFloat(jsPercentage) > 80) {
      this.results.recommendations.push(
        'JavaScript represents a large portion of the bundle - consider tree shaking',
      );
    }

    const fontFiles = this.results.files.filter(f => f.type === 'Font');
    if (fontFiles.length > 10) {
      this.results.recommendations.push('Consider reducing the number of font variants');
    }

    const avgCompressionRatio =
      this.results.files.reduce((sum, f) => sum + parseFloat(f.compressionRatio), 0) /
      this.results.files.length;

    if (avgCompressionRatio < 60) {
      this.results.recommendations.push('Enable gzip/brotli compression on your server');
    }
  }

  printReport() {
    console.log('📊 Bundle Analysis Report');
    console.log('========================\n');

    // Summary
    console.log('📈 Summary:');
    console.log(`   Total Size: ${this.formatSize(this.results.totalSize)}`);
    console.log(`   Gzipped Size: ${this.formatSize(this.results.gzippedSize)}`);
    console.log(
      `   Compression Ratio: ${(((this.results.totalSize - this.results.gzippedSize) / this.results.totalSize) * 100).toFixed(1)}%`,
    );
    console.log(`   Number of Files: ${this.results.files.length}\n`);

    // File breakdown
    console.log('📁 Largest Files:');
    this.results.files.slice(0, 10).forEach((file, index) => {
      const sizeStr = this.formatSize(file.size);
      const gzippedStr = this.formatSize(file.gzippedSize);
      console.log(`   ${index + 1}. ${file.name} (${file.type})`);
      console.log(
        `      Size: ${sizeStr} | Gzipped: ${gzippedStr} | Compression: ${file.compressionRatio}%`,
      );
    });
    console.log();

    // Type breakdown
    const typeStats = this.getTypeStatistics();
    console.log('📊 File Type Breakdown:');
    Object.entries(typeStats).forEach(([type, stats]) => {
      console.log(
        `   ${type}: ${stats.count} files, ${this.formatSize(stats.size)} (${stats.percentage}%)`,
      );
    });
    console.log();

    // Warnings
    if (this.results.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.results.warnings.forEach(warning => console.log(`   • ${warning}`));
      console.log();
    }

    // Errors
    if (this.results.errors.length > 0) {
      console.log('❌ Errors:');
      this.results.errors.forEach(error => console.log(`   • ${error}`));
      console.log();
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      this.results.recommendations.forEach(rec => console.log(`   • ${rec}`));
      console.log();
    }

    // Overall status
    const status =
      this.results.errors.length > 0
        ? '❌ FAILED'
        : this.results.warnings.length > 0
          ? '⚠️  WARNINGS'
          : '✅ PASSED';
    console.log(`🎯 Overall Status: ${status}\n`);

    // Exit with error if there are critical issues
    if (this.results.errors.length > 0) {
      process.exit(1);
    }
  }

  getTypeStatistics() {
    const typeStats = {};

    this.results.files.forEach(file => {
      if (!typeStats[file.type]) {
        typeStats[file.type] = { count: 0, size: 0 };
      }
      typeStats[file.type].count++;
      typeStats[file.type].size += file.size;
    });

    // Add percentages
    Object.values(typeStats).forEach(stats => {
      stats.percentage = ((stats.size / this.results.totalSize) * 100).toFixed(1);
    });

    return typeStats;
  }

  formatSize(bytes) {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  fileExists(path) {
    try {
      statSync(path);
      return true;
    } catch {
      return false;
    }
  }

  directoryExists(path) {
    try {
      const stats = statSync(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }
}

// Run the analyzer
const analyzer = new BundleAnalyzer();
analyzer.analyze();
