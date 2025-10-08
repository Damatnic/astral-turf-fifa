/**
 * Route Verification Script
 * Verifies all routes in App.tsx have corresponding page files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Read App.tsx
const appTsxPath = path.join(rootDir, 'App.tsx');
const appContent = fs.readFileSync(appTsxPath, 'utf-8');

// Extract all lazy imports
const lazyImportRegex = /const\s+(\w+)\s+=\s+lazy\(\(\)\s+=>\s+import\('(.+?)'\)\);/g;
const lazyImports = [];
let match;

while ((match = lazyImportRegex.exec(appContent)) !== null) {
  lazyImports.push({
    componentName: match[1],
    importPath: match[2],
  });
}

console.log('\n📋 ROUTE VERIFICATION REPORT\n');
console.log('='.repeat(60));
console.log('Total Lazy Imports:', lazyImports.length);
console.log('='.repeat(60));

let allExist = true;
let missingCount = 0;
let existingCount = 0;

lazyImports.forEach(({ componentName, importPath }) => {
  // Convert import path to file path
  const filePath = path.join(rootDir, importPath + '.tsx');
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    console.log(`✅ ${componentName.padEnd(35)} ${importPath}`);
    existingCount++;
  } else {
    console.log(`❌ ${componentName.padEnd(35)} ${importPath} (MISSING!)`);
    allExist = false;
    missingCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Existing: ${existingCount}`);
console.log(`❌ Missing: ${missingCount}`);
console.log('='.repeat(60));

if (allExist) {
  console.log('\n✅ ALL ROUTES VALID - All page files exist!');
  process.exit(0);
} else {
  console.log('\n❌ MISSING PAGES DETECTED - Some routes will fail!');
  process.exit(1);
}

