/**
 * Bundle Size Analyzer
 * 
 * Analyzes build output and reports on:
 * - Total bundle size
 * - Individual chunk sizes
 * - Size budget violations
 * - Recommendations for optimization
 */

const fs = require('fs');
const path = require('path');

// Size budgets (in KB)
const SIZE_BUDGETS = {
  'index.html': 50, // 50 KB
  'css': 300, // 300 KB total CSS
  'vendor': 350, // 350 KB for vendor bundle
  'main': 850, // 850 KB for main app bundle
  'total': 2000, // 2 MB total (gzipped)
};

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function walkDirectory(dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(walkDirectory(fullPath));
      } else {
        files.push({
          path: fullPath,
          name: item,
          size: stat.size,
          relativePath: path.relative(path.join(__dirname, '..', 'dist'), fullPath),
        });
      }
    });
  } catch (error) {
    // Directory might not exist
  }
  
  return files;
}

function analyzeBundle() {
  const distDir = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist/ directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  console.log('📊 Bundle Size Analysis\n');
  console.log('═'.repeat(80));

  // Get all files
  const files = walkDirectory(distDir);
  
  // Categorize files
  const categories = {
    html: files.filter(f => f.name.endsWith('.html')),
    css: files.filter(f => f.name.endsWith('.css')),
    js: files.filter(f => f.name.endsWith('.js')),
    assets: files.filter(f => !f.name.endsWith('.html') && !f.name.endsWith('.css') && !f.name.endsWith('.js')),
  };

  // Calculate totals
  const totals = {
    html: categories.html.reduce((sum, f) => sum + f.size, 0),
    css: categories.css.reduce((sum, f) => sum + f.size, 0),
    js: categories.js.reduce((sum, f) => sum + f.size, 0),
    assets: categories.assets.reduce((sum, f) => sum + f.size, 0),
  };

  const grandTotal = totals.html + totals.css + totals.js + totals.assets;

  // Print HTML files
  console.log('\n📄 HTML Files:');
  categories.html.forEach(file => {
    console.log(`   ${file.relativePath}: ${formatBytes(file.size)}`);
  });
  console.log(`   Total: ${formatBytes(totals.html)}`);

  // Print CSS files
  console.log('\n🎨 CSS Files:');
  categories.css.forEach(file => {
    const status = file.size > SIZE_BUDGETS.css * 1024 ? '⚠️ ' : '✅ ';
    console.log(`   ${status}${file.relativePath}: ${formatBytes(file.size)}`);
  });
  console.log(`   Total: ${formatBytes(totals.css)}`);
  if (totals.css > SIZE_BUDGETS.css * 1024) {
    console.log(`   ⚠️  Exceeds budget of ${SIZE_BUDGETS.css} KB`);
  }

  // Print JS files (sorted by size)
  console.log('\n📦 JavaScript Files (sorted by size):');
  const jsSorted = categories.js.sort((a, b) => b.size - a.size);
  jsSorted.slice(0, 15).forEach(file => {
    const sizeKB = file.size / 1024;
    const status = sizeKB > 500 ? '🔴' : sizeKB > 200 ? '🟡' : '✅';
    console.log(`   ${status} ${file.relativePath}: ${formatBytes(file.size)}`);
  });
  
  if (jsSorted.length > 15) {
    const remainingSize = jsSorted.slice(15).reduce((sum, f) => sum + f.size, 0);
    console.log(`   ... and ${jsSorted.length - 15} more files (${formatBytes(remainingSize)})`);
  }
  
  console.log(`   Total JS: ${formatBytes(totals.js)}`);

  // Print assets
  if (categories.assets.length > 0) {
    console.log('\n🖼️  Assets:');
    console.log(`   ${categories.assets.length} files, Total: ${formatBytes(totals.assets)}`);
  }

  // Print summary
  console.log('\n═'.repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`   HTML:   ${formatBytes(totals.html)}`);
  console.log(`   CSS:    ${formatBytes(totals.css)}`);
  console.log(`   JS:     ${formatBytes(totals.js)}`);
  console.log(`   Assets: ${formatBytes(totals.assets)}`);
  console.log(`   ─`.repeat(40));
  console.log(`   TOTAL:  ${formatBytes(grandTotal)}`);

  // Estimate gzipped size (rough approximation: 30% of original)
  const estimatedGzipped = grandTotal * 0.3;
  console.log(`   Gzipped (est.): ${formatBytes(estimatedGzipped)}`);

  // Check budgets
  console.log('\n💰 Budget Status:\n');
  const budgetChecks = [
    { name: 'CSS', actual: totals.css, budget: SIZE_BUDGETS.css * 1024 },
    { name: 'Total (gzipped)', actual: estimatedGzipped, budget: SIZE_BUDGETS.total * 1024 },
  ];

  let budgetViolations = 0;
  budgetChecks.forEach(check => {
    const percentage = (check.actual / check.budget) * 100;
    const status = percentage <= 100 ? '✅' : percentage <= 120 ? '⚠️ ' : '🔴';
    
    console.log(`   ${status} ${check.name}: ${formatBytes(check.actual)} / ${formatBytes(check.budget)} (${Math.round(percentage)}%)`);
    
    if (percentage > 100) {
      budgetViolations++;
    }
  });

  // Recommendations
  if (budgetViolations > 0) {
    console.log('\n💡 Recommendations:\n');
    
    if (totals.css > SIZE_BUDGETS.css * 1024) {
      console.log('   • CSS is large - consider:');
      console.log('     - Removing unused Tailwind classes (PurgeCSS)');
      console.log('     - Splitting critical and non-critical CSS');
      console.log('     - Using CSS-in-JS for component-specific styles');
    }
    
    const largeChunks = jsSorted.filter(f => f.size > 500 * 1024);
    if (largeChunks.length > 0) {
      console.log('   • Large JavaScript chunks detected:');
      largeChunks.forEach(chunk => {
        console.log(`     - ${chunk.name} (${formatBytes(chunk.size)}) - consider code splitting`);
      });
    }
    
    console.log('   • General optimizations:');
    console.log('     - Use dynamic imports for large dependencies');
    console.log('     - Enable tree-shaking for unused code');
    console.log('     - Lazy load routes and heavy components');
    console.log('     - Consider using lighter alternatives for heavy libraries');
  } else {
    console.log('\n✅ All bundle sizes are within budget!');
  }

  console.log('\n═'.repeat(80));
  
  // Exit code based on budget violations
  if (budgetViolations > 0) {
    console.log('\n⚠️  Build completed with bundle size warnings');
    process.exit(0); // Don't fail build, just warn
  } else {
    console.log('\n✅ Build completed successfully');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };


