/**
 * Component Import Verification
 * Checks if all imported components in critical files actually exist
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const criticalFiles = [
  'src/pages/FullyIntegratedTacticsBoard.tsx',
  'src/pages/TacticalAnalyticsPage.tsx',
  'src/components/dashboards/PlayerDashboard.tsx',
  'src/pages/MyPlayerRankingPage.tsx',
];

console.log('\n🔍 COMPONENT IMPORT VERIFICATION\n');
console.log('='.repeat(70));

let allValid = true;

criticalFiles.forEach(filePath => {
  const fullPath = path.join(rootDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ FILE MISSING: ${filePath}`);
    allValid = false;
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  
  // Extract imports
  const importRegex = /import\s+(?:{[^}]+}|[\w\s,]+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  console.log(`\n📄 ${filePath}`);
  console.log('   Imports to verify: ' + imports.length);

  imports.forEach(importPath => {
    // Skip type-only imports and external packages
    if (importPath.startsWith('../types') || 
        importPath.startsWith('./types') ||
        !importPath.includes('/components/') &&
        !importPath.includes('/utils/') &&
        !importPath.includes('/data/') &&
        !importPath.includes('/hooks/') &&
        !importPath.includes('/systems/')) {
      return;
    }

    // Resolve path
    const dir = path.dirname(fullPath);
    let resolvedPath = path.join(dir, importPath);
    
    // Try with .tsx, .ts, .jsx, .js extensions
    const exists = 
      fs.existsSync(resolvedPath + '.tsx') ||
      fs.existsSync(resolvedPath + '.ts') ||
      fs.existsSync(resolvedPath + '.jsx') ||
      fs.existsSync(resolvedPath + '.js') ||
      fs.existsSync(resolvedPath + '/index.tsx') ||
      fs.existsSync(resolvedPath + '/index.ts');

    if (!exists) {
      console.log(`   ❌ MISSING: ${importPath}`);
      allValid = false;
    }
  });
});

console.log('\n' + '='.repeat(70));

if (allValid) {
  console.log('✅ ALL IMPORTS VALID - No missing components!\n');
  process.exit(0);
} else {
  console.log('❌ MISSING COMPONENTS DETECTED!\n');
  process.exit(1);
}

