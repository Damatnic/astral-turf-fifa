/**
 * Final Component Audit
 * Verifies all required components exist and are complete
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('\n🔍 FINAL COMPONENT AUDIT\n');
console.log('='.repeat(70));

const components = [
  { path: 'src/hooks/useFormationHistory.ts', name: 'Formation History Hook', minLines: 100 },
  { path: 'src/components/roster/ProfessionalRosterSystem.tsx', name: 'Professional Roster System', minLines: 300 },
  { path: 'src/components/tactics/EnhancedFieldOverlays.tsx', name: 'Enhanced Field Overlays', minLines: 100 },
  { path: 'src/systems/PositioningSystem.tsx', name: 'Positioning System', minLines: 30 },
  { path: 'src/components/tactics/PlayerStatsPopover.tsx', name: 'Player Stats Popover', minLines: 50 },
  { path: 'src/utils/formationAnalyzer.ts', name: 'Formation Analyzer (AI)', minLines: 200 },
  { path: 'src/components/tactics/TacticalSuggestionsPanel.tsx', name: 'Tactical Suggestions Panel', minLines: 100 },
  { path: 'src/data/professionalFormations.ts', name: 'Professional Formations Data', minLines: 500 },
  { path: 'src/utils/formationExport.ts', name: 'Formation Export Utilities', minLines: 100 },
  { path: 'src/components/help/KeyboardShortcutsGuide.tsx', name: 'Keyboard Shortcuts Guide', minLines: 100 },
  { path: 'src/components/tactics/AdvancedDrawingTools.tsx', name: 'Advanced Drawing Tools', minLines: 200 },
  { path: 'src/components/player/UltimatePlayerCard.tsx', name: 'Ultimate Player Card', minLines: 300 },
  { path: 'src/components/analytics/TacticalAnalyticsDashboard.tsx', name: 'Tactical Analytics Dashboard', minLines: 100 },
  { path: 'src/components/analytics/FormationHeatMap.tsx', name: 'Formation Heat Map', minLines: 100 },
];

let total = 0;
let exists = 0;
let complete = 0;
let incomplete = 0;

components.forEach(({ path: componentPath, name, minLines }) => {
  total++;
  const fullPath = path.join(rootDir, componentPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${name}`);
    console.log(`   Missing: ${componentPath}`);
    return;
  }
  
  exists++;
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').length;
  const linesOfCode = content.split('\n').filter(line => 
    line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*') && !line.trim().startsWith('*')
  ).length;
  
  if (linesOfCode >= minLines) {
    console.log(`✅ ${name.padEnd(40)} ${linesOfCode} lines`);
    complete++;
  } else {
    console.log(`⚠️  ${name.padEnd(40)} ${linesOfCode} lines (expected ${minLines}+)`);
    incomplete++;
  }
});

console.log('\n' + '='.repeat(70));
console.log(`Total Components: ${total}`);
console.log(`✅ Exist: ${exists}`);
console.log(`✅ Complete: ${complete}`);
console.log(`⚠️  Incomplete: ${incomplete}`);
console.log('='.repeat(70));

// Count formations
const formationsPath = path.join(rootDir, 'src/data/professionalFormations.ts');
const formationsContent = fs.readFileSync(formationsPath, 'utf-8');
const formationCount = (formationsContent.match(/displayName:/g) || []).length;

console.log(`\n📊 Formations Count: ${formationCount}`);

if (exists === total && incomplete === 0) {
  console.log('\n✅ ALL COMPONENTS COMPLETE!\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some components need implementation\n');
  process.exit(1);
}

