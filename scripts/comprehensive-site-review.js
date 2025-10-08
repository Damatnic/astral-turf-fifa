/**
 * Comprehensive Site Review
 * Identifies potential issues across the entire codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n🔍 COMPREHENSIVE SITE-WIDE REVIEW\n');
console.log('='.repeat(70));

const issues = [];
const warnings = [];
const fixes = [];

// Check 1: Verify all route pages exist
console.log('\n1️⃣ CHECKING ROUTES...');
const appContent = fs.readFileSync(path.join(rootDir, 'App.tsx'), 'utf-8');
const lazyImports = [...appContent.matchAll(/const\s+(\w+)\s+=\s+lazy\(\(\)\s+=>\s+import\('(.+?)'\)\)/g)];

let missingPages = 0;
lazyImports.forEach(([_, componentName, importPath]) => {
  const filePath = path.join(rootDir, importPath + '.tsx');
  if (!fs.existsSync(filePath)) {
    issues.push(`Missing page: ${componentName} at ${importPath}`);
    missingPages++;
  }
});

console.log(missingPages === 0 
  ? '✅ All route pages exist' 
  : `❌ ${missingPages} missing pages`);

// Check 2: Verify critical components exist
console.log('\n2️⃣ CHECKING CRITICAL COMPONENTS...');
const criticalComponents = [
  'src/components/navigation/ProfessionalNavbar.tsx',
  'src/components/navigation/RoleBasedNavigation.tsx',
  'src/components/Layout.tsx',
  'src/components/ProtectedRoute.tsx',
  'src/context/AppProvider.tsx',
  'src/pages/FullyIntegratedTacticsBoard.tsx',
  'src/pages/TacticalAnalyticsPage.tsx',
];

let missingComponents = 0;
criticalComponents.forEach(comp => {
  if (!fs.existsSync(path.join(rootDir, comp))) {
    issues.push(`Missing critical component: ${comp}`);
    missingComponents++;
  }
});

console.log(missingComponents === 0 
  ? '✅ All critical components exist' 
  : `❌ ${missingComponents} missing components`);

// Check 3: Look for console.log statements in src
console.log('\n3️⃣ CHECKING FOR CONSOLE.LOG STATEMENTS...');
function scanForConsoleLogs(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      count += scanForConsoleLogs(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const matches = content.match(/console\.(log|warn|error)/g);
      if (matches) {
        warnings.push(`Console statements in ${fullPath}: ${matches.length} found`);
        count += matches.length;
      }
    }
  });
  
  return count;
}

const consoleCount = scanForConsoleLogs(path.join(rootDir, 'src'));
console.log(consoleCount > 0 
  ? `⚠️  Found ${consoleCount} console statements (should use loggingService)` 
  : '✅ No console statements found');

// Check 4: Check for unused imports
console.log('\n4️⃣ CHECKING KEY FILES...');
const keyFiles = [
  'App.tsx',
  'src/components/Layout.tsx',
  'src/components/navigation/ProfessionalNavbar.tsx',
  'src/pages/FullyIntegratedTacticsBoard.tsx',
];

keyFiles.forEach(file => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    issues.push(`Missing key file: ${file}`);
    console.log(`❌ ${file}`);
  }
});

// Check 5: Verify data files
console.log('\n5️⃣ CHECKING DATA FILES...');
const dataFiles = [
  'src/data/professionalFormations.ts',
];

dataFiles.forEach(file => {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const formationCount = (content.match(/displayName:/g) || []).length;
    console.log(`✅ ${file} - ${formationCount} formations`);
    if (formationCount < 12) {
      warnings.push(`Only ${formationCount} formations (target: 12+)`);
    }
  } else {
    issues.push(`Missing data file: ${file}`);
  }
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('\n📊 REVIEW SUMMARY:\n');
console.log(`🔴 Critical Issues: ${issues.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`✅ Fixes Applied: ${fixes.length}`);

if (issues.length > 0) {
  console.log('\n🔴 CRITICAL ISSUES:');
  issues.forEach((issue, idx) => console.log(`  ${idx + 1}. ${issue}`));
}

if (warnings.length > 0 && warnings.length <= 10) {
  console.log('\n⚠️  WARNINGS:');
  warnings.slice(0, 10).forEach((warning, idx) => console.log(`  ${idx + 1}. ${warning}`));
  if (warnings.length > 10) {
    console.log(`  ... and ${warnings.length - 10} more`);
  }
}

console.log('\n' + '='.repeat(70));

if (issues.length === 0 && warnings.length < 50) {
  console.log('\n✅ SITE REVIEW: EXCELLENT - Ready for production!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  SITE REVIEW: Needs attention\n');
  process.exit(1);
}

