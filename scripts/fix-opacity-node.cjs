/**
 * Script to replace semi-transparent Tailwind utilities with solid colors
 * Pure Node.js implementation (no external dependencies)
 */

const fs = require('fs');
const path = require('path');

// Opacity to solid color mappings
const opacityMappings = {
  // Background opacity
  'bg-slate-900/95': 'bg-slate-900',
  'bg-slate-900/90': 'bg-slate-900',
  'bg-slate-900/80': 'bg-slate-900',
  'bg-slate-900/60': 'bg-slate-800',
  'bg-slate-900/40': 'bg-slate-750',
  'bg-slate-900/20': 'bg-slate-700',
  
  'bg-slate-800/90': 'bg-slate-800',
  'bg-slate-800/80': 'bg-slate-800',
  'bg-slate-800/60': 'bg-slate-750',
  'bg-slate-800/40': 'bg-slate-700',
  'bg-slate-800/20': 'bg-slate-650',
  
  'bg-slate-700/80': 'bg-slate-700',
  'bg-slate-700/60': 'bg-slate-650',
  'bg-slate-700/40': 'bg-slate-600',
  'bg-slate-700/20': 'bg-slate-550',
  
  // Black colors
  'bg-black/90': 'bg-slate-950',
  'bg-black/80': 'bg-slate-900',
  'bg-black/60': 'bg-slate-850',
  'bg-black/50': 'bg-slate-800',
  'bg-black/40': 'bg-slate-750',
  'bg-black/30': 'bg-slate-700',
  'bg-black/20': 'bg-slate-650',
  
  // White colors
  'bg-white/20': 'bg-slate-700',
  'bg-white/10': 'bg-slate-800',
  
  // Other colors
  'bg-red-900/20': 'bg-red-950',
  'bg-rose-500/20': 'bg-rose-900',
  'bg-blue-500/15': 'bg-blue-950',
  'bg-blue-400/60': 'bg-blue-500',
  'bg-emerald-500/20': 'bg-emerald-950',
  'bg-amber-500/20': 'bg-amber-950',
  
  // Border opacity
  'border-slate-700/50': 'border-slate-700',
  'border-slate-700/60': 'border-slate-700',
  'border-slate-700/40': 'border-slate-750',
  'border-white/20': 'border-slate-600',
  'border-white/10': 'border-slate-700',
  'border-red-500/20': 'border-red-800',
  'border-blue-500/40': 'border-blue-700',
};

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, coverage
      if (!['node_modules', 'dist', 'coverage', '.git', 'build'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function replaceOpacityInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    const originalContent = content;
    
    // Replace all mapped patterns
    Object.entries(opacityMappings).forEach(([pattern, replacement]) => {
      // Escape special regex characters
      const escapedPattern = pattern.replace(/\//g, '\\/');
      const regex = new RegExp(escapedPattern, 'g');
      
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  console.log('🔍 Finding TypeScript/JavaScript files in src/...');
  const files = walkDirectory(srcDir);
  console.log(`📁 Found ${files.length} files to scan\n`);
  
  let scannedCount = 0;
  let updatedCount = 0;
  let filesWithOpacity = [];
  
  files.forEach((file, index) => {
    // Check if file contains opacity patterns
    const content = fs.readFileSync(file, 'utf8');
    const hasOpacity = /bg-[a-zA-Z0-9-]+\/[0-9]{2,3}|border-[a-zA-Z0-9-]+\/[0-9]{2,3}/.test(content);
    
    if (hasOpacity) {
      filesWithOpacity.push(file);
      console.log(`[${index + 1}/${files.length}] Processing: ${path.relative(process.cwd(), file)}`);
      if (replaceOpacityInFile(file)) {
        updatedCount++;
      }
    }
    scannedCount++;
  });
  
  console.log(`\n✨ Complete!`);
  console.log(`   Scanned: ${scannedCount} files`);
  console.log(`   Found with opacity: ${filesWithOpacity.length} files`);
  console.log(`   Updated: ${updatedCount} files`);
  
  console.log('\n⚠️  Note: Some patterns may need manual review:');
  console.log('   - Custom opacity values not in the mapping');
  console.log('   - Hover/focus state opacity utilities (hover:bg-*/20)');
  console.log('   - Shadow opacity utilities');
  console.log('\n📝 Run tests and visual inspection to verify changes');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { replaceOpacityInFile, opacityMappings };


