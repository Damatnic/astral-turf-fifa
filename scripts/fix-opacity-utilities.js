/**
 * Script to replace semi-transparent Tailwind utilities with solid colors
 * 
 * Pattern: bg-{color}-{shade}/{opacity} → bg-{color}-{adjusted-shade}
 * 
 * Example replacements:
 * - bg-slate-800/80 → bg-slate-800
 * - bg-slate-800/60 → bg-slate-750
 * - bg-slate-800/40 → bg-slate-700
 * - bg-slate-800/20 → bg-slate-650
 * 
 * - bg-black/50 → bg-slate-900
 * - bg-black/60 → bg-slate-800
 * - bg-black/80 → bg-gray-900
 * 
 * - bg-white/10 → bg-slate-800
 * - bg-white/20 → bg-slate-700
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Opacity to solid color mappings
const opacityMappings = {
  // Slate colors
  'slate-900/95': 'slate-900',
  'slate-900/90': 'slate-900',
  'slate-900/80': 'slate-850',
  'slate-900/60': 'slate-800',
  'slate-900/40': 'slate-750',
  'slate-900/20': 'slate-700',
  
  'slate-800/90': 'slate-800',
  'slate-800/80': 'slate-800',
  'slate-800/60': 'slate-750',
  'slate-800/40': 'slate-700',
  'slate-800/20': 'slate-650',
  
  'slate-700/80': 'slate-700',
  'slate-700/60': 'slate-650',
  'slate-700/40': 'slate-600',
  'slate-700/20': 'slate-550',
  
  // Black colors
  'black/90': 'slate-950',
  'black/80': 'slate-900',
  'black/60': 'slate-850',
  'black/50': 'slate-800',
  'black/40': 'slate-750',
  'black/30': 'slate-700',
  'black/20': 'slate-650',
  
  // White colors
  'white/20': 'slate-700',
  'white/10': 'slate-800',
  
  // Red colors
  'red-900/20': 'red-950',
  'rose-500/20': 'rose-900',
  
  // Blue colors
  'blue-500/15': 'blue-950',
  'blue-400/60': 'blue-500',
  
  // Emerald colors
  'emerald-500/20': 'emerald-950',
  
  // Amber colors
  'amber-500/20': 'amber-950',
};

// Border opacity mappings
const borderOpacityMappings = {
  'slate-700/50': 'slate-700',
  'slate-700/60': 'slate-700',
  'slate-700/40': 'slate-750',
  'white/20': 'slate-600',
  'white/10': 'slate-700',
  'red-500/20': 'red-800',
  'blue-500/40': 'blue-700',
};

function findFilesWithOpacity(directory) {
  try {
    const result = execSync(
      `rg "bg-[a-zA-Z0-9-]+/[0-9]{2,3}" "${directory}" --files-with-matches --type tsx --type ts`,
      { encoding: 'utf8', shell: true }
    );
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding files:', error.message);
    return [];
  }
}

function replaceOpacityInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    
    // Replace background opacity utilities
    Object.entries(opacityMappings).forEach(([pattern, replacement]) => {
      const regex = new RegExp(`bg-${pattern.replace('/', '\\/')}`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `bg-${replacement}`);
        changed = true;
      }
    });
    
    // Replace border opacity utilities
    Object.entries(borderOpacityMappings).forEach(([pattern, replacement]) => {
      const regex = new RegExp(`border-${pattern.replace('/', '\\/')}`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `border-${replacement}`);
        changed = true;
      }
    });
    
    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
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
  
  console.log('🔍 Finding files with opacity utilities...');
  const files = findFilesWithOpacity(srcDir);
  console.log(`📁 Found ${files.length} files to process\n`);
  
  let updatedCount = 0;
  files.forEach((file, index) => {
    console.log(`[${index + 1}/${files.length}] Processing: ${file}`);
    if (replaceOpacityInFile(file)) {
      updatedCount++;
    }
  });
  
  console.log(`\n✨ Complete! Updated ${updatedCount} out of ${files.length} files`);
  console.log('\n⚠️  Note: Some patterns may need manual review:');
  console.log('   - Custom opacity values not in the mapping');
  console.log('   - Hover/focus state opacity utilities');
  console.log('   - Shadow opacity utilities');
  console.log('\n📝 Run tests to verify visual appearance');
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { replaceOpacityInFile, opacityMappings };


