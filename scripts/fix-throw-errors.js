import fs from 'fs';
import path from 'path';

const filesToProcess = [
  'src/services/authService.ts',
  'src/services/databaseAuthService.ts',
  'src/services/secureAuthService.ts',
  'src/services/apiService.ts',
  'src/services/aiService.ts',
  'src/services/advancedAiService.ts',
  'src/services/challengeService.ts',
];

console.log('Starting to fix throw error vs _error inconsistencies...');

filesToProcess.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fixed = false;

  // Fix the pattern: catch (_error) { ... throw error; }
  const regex = /catch\s*\(\s*_error\s*\)\s*\{([^}]*?)throw\s+error\s*;/gs;

  content = content.replace(regex, (match, body) => {
    fixed = true;
    return match.replace('throw error;', 'throw _error;');
  });

  if (fixed) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed throw error inconsistencies: ${filePath}`);
  } else {
    console.log(`⚪ No throw error inconsistencies found: ${filePath}`);
  }
});

console.log('✅ All throw error inconsistencies have been fixed!');
