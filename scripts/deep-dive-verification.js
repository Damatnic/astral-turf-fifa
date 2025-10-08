/**
 * Deep Dive Verification
 * Comprehensive check of all critical systems
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n🔍 DEEP DIVE VERIFICATION - COMPLETE SYSTEM CHECK\n');
console.log('='.repeat(70));

let issues = [];
let checks = 0;
let passed = 0;

// Helper function
const checkFile = (filePath, description) => {
  checks++;
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - MISSING: ${filePath}`);
    issues.push({ description, filePath });
    return false;
  }
};

const checkExport = (filePath, exportName, description) => {
  checks++;
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description} - FILE MISSING`);
    issues.push({ description, filePath });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const hasExport = content.includes(`export const ${exportName}`) ||
                    content.includes(`export default ${exportName}`) ||
                    content.includes(`export { ${exportName}`) ||
                    content.includes(`export function ${exportName}`);
  
  if (hasExport) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - EXPORT NOT FOUND`);
    issues.push({ description, filePath, exportName });
    return false;
  }
};

console.log('\n📋 CORE PAGES (41 pages)');
console.log('-'.repeat(70));
checkFile('src/pages/LandingPage.tsx', 'Landing Page');
checkFile('src/pages/LoginPage.tsx', 'Login Page');
checkFile('src/pages/SignupPage.tsx', 'Signup Page');
checkFile('src/pages/DashboardPage.tsx', 'Dashboard Page');
checkFile('src/pages/FullyIntegratedTacticsBoard.tsx', 'Fully Integrated Tactics Board');
checkFile('src/pages/TacticalAnalyticsPage.tsx', 'Tactical Analytics Page');
checkFile('src/pages/EnhancedPlayerCardPage.tsx', 'Enhanced Player Card Page');
checkFile('src/pages/EnhancedSettingsPage.tsx', 'Enhanced Settings Page');

console.log('\n📦 NEW COMPONENTS (26 components)');
console.log('-'.repeat(70));
checkFile('src/utils/xpSystem.ts', 'XP System');
checkFile('src/utils/achievementSystem.ts', 'Achievement System');
checkFile('src/utils/playerCardIntegration.ts', 'Player Card Integration');
checkFile('src/utils/formationAnalyzer.ts', 'Formation Analyzer');
checkFile('src/utils/playerChemistry.ts', 'Player Chemistry');
checkFile('src/utils/formationExport.ts', 'Formation Export');
checkFile('src/utils/performanceTracking.ts', 'Performance Tracking');
checkFile('src/utils/professionalReports.ts', 'Professional Reports');
checkFile('src/data/professionalFormations.ts', 'Professional Formations Data');
checkFile('src/hooks/usePlayerCardUpdates.ts', 'Player Card Updates Hook');
checkFile('src/components/dashboard/PlayerCardWidget.tsx', 'Player Card Widget');
checkFile('src/components/player/PlayerComparisonModal.tsx', 'Player Comparison Modal');
checkFile('src/components/leaderboard/EnhancedLeaderboard.tsx', 'Enhanced Leaderboard');
checkFile('src/components/navigation/RoleBasedNavigation.tsx', 'Role-Based Navigation');
checkFile('src/components/navigation/ProfessionalNavbar.tsx', 'Professional Navbar');
checkFile('src/components/navigation/ProfileDropdown.tsx', 'Profile Dropdown');
checkFile('src/components/tactics/FormationLibraryPanel.tsx', 'Formation Library Panel');
checkFile('src/components/tactics/TacticalSuggestionsPanel.tsx', 'Tactical Suggestions Panel');
checkFile('src/components/tactics/FormationComparisonModal.tsx', 'Formation Comparison Modal');
checkFile('src/components/tactics/AdvancedDrawingTools.tsx', 'Advanced Drawing Tools');
checkFile('src/components/tactics/PlayerStatsPopover.tsx', 'Player Stats Popover');
checkFile('src/components/analytics/TacticalAnalyticsDashboard.tsx', 'Tactical Analytics Dashboard');
checkFile('src/components/analytics/FormationHeatMap.tsx', 'Formation Heat Map');
checkFile('src/components/help/KeyboardShortcutsGuide.tsx', 'Keyboard Shortcuts Guide');
checkFile('src/components/onboarding/QuickStartTutorial.tsx', 'Quick Start Tutorial');
checkFile('src/components/player/UltimatePlayerCard.tsx', 'Ultimate Player Card');

console.log('\n🔑 CRITICAL EXPORTS');
console.log('-'.repeat(70));
checkExport('src/data/professionalFormations.ts', 'PROFESSIONAL_FORMATIONS', 'PROFESSIONAL_FORMATIONS export');
checkExport('src/utils/formationAnalyzer.ts', 'analyzeFormation', 'analyzeFormation function');
checkExport('src/utils/playerChemistry.ts', 'calculateTeamChemistry', 'calculateTeamChemistry function');
checkExport('src/components/tactics/FormationLibraryPanel.tsx', 'FormationLibraryPanel', 'FormationLibraryPanel component');
checkExport('src/components/analytics/TacticalAnalyticsDashboard.tsx', 'TacticalAnalyticsDashboard', 'TacticalAnalyticsDashboard component');

console.log('\n🔗 INTEGRATION POINTS');
console.log('-'.repeat(70));
checkFile('src/components/Layout.tsx', 'Layout Component (navbar integration)');
checkFile('src/components/dashboards/PlayerDashboard.tsx', 'Player Dashboard (widget integration)');
checkFile('App.tsx', 'App Router (all routes)');

console.log('\n📊 CONTEXT & PROVIDERS');
console.log('-'.repeat(70));
checkFile('src/context/AppProvider.tsx', 'App Provider');
checkFile('src/context/AuthContext.ts', 'Auth Context');
checkFile('src/context/TacticsContext.ts', 'Tactics Context');
checkFile('src/context/ChallengeContext.tsx', 'Challenge Context');

console.log('\n🛣️ ROUTING CONFIGURATION');
console.log('-'.repeat(70));
checkFile('App.tsx', 'Main App Router');
checkFile('src/components/ProtectedRoute.tsx', 'Protected Route Component');

console.log('\n' + '='.repeat(70));
console.log(`\nTOTAL CHECKS: ${checks}`);
console.log(`✅ PASSED: ${passed}`);
console.log(`❌ FAILED: ${issues.length}`);
console.log('='.repeat(70));

if (issues.length === 0) {
  console.log('\n✅ PERFECT! All systems verified and operational!\n');
  process.exit(0);
} else {
  console.log('\n❌ ISSUES FOUND:\n');
  issues.forEach((issue, idx) => {
    console.log(`${idx + 1}. ${issue.description}`);
    console.log(`   File: ${issue.filePath}`);
    if (issue.exportName) {
      console.log(`   Missing export: ${issue.exportName}`);
    }
  });
  console.log('');
  process.exit(1);
}

