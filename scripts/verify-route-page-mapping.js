/**
 * Route to Page Mapping Verification
 * Ensures all navigation paths have corresponding routes in App.tsx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n🗺️ ROUTE-TO-PAGE MAPPING VERIFICATION\n');
console.log('='.repeat(70));

// Read navigation file
const navPath = path.join(rootDir, 'src/components/navigation/RoleBasedNavigation.tsx');
const navContent = fs.readFileSync(navPath, 'utf-8');

// Read App.tsx
const appPath = path.join(rootDir, 'App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

// Extract all paths from navigation
const pathRegex = /path:\s*['"]([^'"]+)['"]/g;
const navPaths = [];
let match;

while ((match = pathRegex.exec(navContent)) !== null) {
  const navPath = match[1].replace(/^\//, ''); // Remove leading slash
  if (navPath && !navPaths.includes(navPath)) {
    navPaths.push(navPath);
  }
}

console.log(`Navigation Paths Found: ${navPaths.length}\n`);

// Extract all routes from App.tsx
const routeRegex = /path="([^"]+)"/g;
const appRoutes = [];

while ((match = routeRegex.exec(appContent)) !== null) {
  const route = match[1];
  if (route && route !== '/*' && route !== '*') {
    // Normalize route (remove params)
    const normalizedRoute = route.replace(/\/:[^/]+/g, '').replace(/\/\*/g, '');
    if (!appRoutes.includes(normalizedRoute)) {
      appRoutes.push(normalizedRoute);
    }
  }
}

console.log(`App Routes Found: ${appRoutes.length}\n`);
console.log('='.repeat(70));

// Check each navigation path has a route
let missingRoutes = [];
let foundRoutes = [];

navPaths.forEach(navPath => {
  const hasRoute = appRoutes.includes(navPath);
  
  if (hasRoute) {
    console.log(`✅ ${navPath}`);
    foundRoutes.push(navPath);
  } else {
    console.log(`❌ ${navPath} - NO ROUTE IN APP.TSX!`);
    missingRoutes.push(navPath);
  }
});

console.log('\n' + '='.repeat(70));
console.log(`✅ Routes Found: ${foundRoutes.length}`);
console.log(`❌ Missing Routes: ${missingRoutes.length}`);
console.log('='.repeat(70));

if (missingRoutes.length > 0) {
  console.log('\n⚠️ MISSING ROUTES IN APP.TSX:');
  missingRoutes.forEach(route => console.log(`   - ${route}`));
}

// Check for duplicate routes in App.tsx
console.log('\n🔍 CHECKING FOR DUPLICATE ROUTES');
console.log('='.repeat(70));

const routeRegexFull = /path="([^"]+)"/g;
const allRoutes = [];
const duplicates = [];

while ((match = routeRegexFull.exec(appContent)) !== null) {
  const route = match[1];
  if (route !== '/*' && route !== '*') {
    if (allRoutes.includes(route)) {
      if (!duplicates.includes(route)) {
        duplicates.push(route);
      }
    }
    allRoutes.push(route);
  }
}

if (duplicates.length > 0) {
  console.log('⚠️ DUPLICATE ROUTES FOUND:');
  duplicates.forEach(route => {
    const count = allRoutes.filter(r => r === route).length;
    console.log(`   ${route} - appears ${count} times`);
  });
} else {
  console.log('✅ No duplicate routes');
}

console.log('\n' + '='.repeat(70));

if (missingRoutes.length === 0 && duplicates.length === 0) {
  console.log('✅ PERFECT! All navigation paths have valid routes!\n');
  process.exit(0);
} else {
  console.log('⚠️ ISSUES DETECTED - See above for details\n');
  process.exit(1);
}

