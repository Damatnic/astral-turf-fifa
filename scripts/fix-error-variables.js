import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of files and their error issues
const fixes = [
  // Security files
  {
    file: 'src/security/logging.ts',
    line: 207,
    old: "console.error('Alert callback failed:', error);",
    new: "console.error('Alert callback failed:', _error);",
  },

  // Service files
  {
    file: 'src/services/cloudStorageService.ts',
    fixes: [
      {
        old: "console.error('❌ Failed to save state:', error);",
        new: "console.error('❌ Failed to save state:', _error);",
      },
      {
        old: "console.error('❌ Failed to load state:', error);",
        new: "console.error('❌ Failed to load state:', _error);",
      },
      {
        old: "console.error('❌ Backup creation failed:', error);",
        new: "console.error('❌ Backup creation failed:', _error);",
      },
      {
        old: "console.error('❌ Backup restoration failed:', error);",
        new: "console.error('❌ Backup restoration failed:', _error);",
      },
      {
        old: "console.error('❌ Failed to decrypt local state:', error);",
        new: "console.error('❌ Failed to decrypt local state:', _error);",
      },
      {
        old: "console.error('❌ Failed to load cloud state:', error);",
        new: "console.error('❌ Failed to load cloud state:', _error);",
      },
    ],
  },

  {
    file: 'src/services/challengeService.ts',
    fixes: [
      {
        old: "console.error('Failed to load challenge data:', error);",
        new: "console.error('Failed to load challenge data:', _error);",
      },
      {
        old: "console.error('Failed to save challenge data:', error);",
        new: "console.error('Failed to save challenge data:', _error);",
      },
    ],
  },

  {
    file: 'src/services/calendarIntegrationService.ts',
    fixes: [
      {
        old: "console.error('❌ Failed to connect Google Calendar:', error);",
        new: "console.error('❌ Failed to connect Google Calendar:', _error);",
      },
      {
        old: "console.error('❌ Failed to connect Outlook Calendar:', error);",
        new: "console.error('❌ Failed to connect Outlook Calendar:', _error);",
      },
      {
        old: "console.error('❌ Failed to create calendar event:', error);",
        new: "console.error('❌ Failed to create calendar event:', _error);",
      },
      {
        old: 'console.error(`❌ Failed to sync ${provider.name}:`, error);',
        new: 'console.error(`❌ Failed to sync ${provider.name}:`, _error);',
      },
    ],
  },

  {
    file: 'src/services/backupService.ts',
    fixes: [
      {
        old: "console.error('❌ Backup Service initialization failed:', error);",
        new: "console.error('❌ Backup Service initialization failed:', _error);",
      },
      {
        old: "backup.error = error instanceof Error ? error.message : 'Unknown error';",
        new: "backup.error = _error instanceof Error ? _error.message : 'Unknown error';",
      },
      {
        old: 'console.error(`❌ Backup failed: ${backupId}`, error);',
        new: 'console.error(`❌ Backup failed: ${backupId}`, _error);',
      },
      {
        old: 'console.error(`❌ Restore failed: ${options.backupId}`, error);',
        new: 'console.error(`❌ Restore failed: ${options.backupId}`, _error);',
      },
      {
        old: "console.error('❌ Backup system test failed:', error);",
        new: "console.error('❌ Backup system test failed:', _error);",
      },
    ],
  },
];

// Read all files that need fixing
const filesToFix = [
  'src/security/logging.ts',
  'src/services/cloudStorageService.ts',
  'src/services/challengeService.ts',
  'src/services/calendarIntegrationService.ts',
  'src/services/backupService.ts',
  'src/services/syncService.ts',
  'src/services/apiService.ts',
  'src/services/sportsDataApiService.ts',
  'src/services/aiServiceLoader.ts',
  'src/services/socialMediaIntegrationService.ts',
  'src/services/intelligentTrainingService.ts',
  'src/services/playerRankingService.ts',
  'src/services/performanceService.ts',
  'src/services/initializationService.ts',
  'src/services/notificationService.ts',
  'src/services/matchStrategyService.ts',
  'src/services/deviceContinuityService.ts',
  'src/services/loggingService.ts',
  'src/components/popups/PlayerConversationPopup.tsx',
  'src/components/popups/AIChatPopup.tsx',
];

console.log('Starting to fix error variable references...');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fixed = false;

  // Fix the pattern: catch (_error) { ... console.error('...', error); }
  const regex = /catch\s*\(\s*_error\s*\)\s*\{[^}]*console\.error\(([^,]+),\s*error\s*([\);])/g;

  content = content.replace(regex, (match, message, ending) => {
    fixed = true;
    return match.replace(', error' + ending, ', _error' + ending);
  });

  if (fixed) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  } else {
    console.log(`⚪ No issues found: ${filePath}`);
  }
});

console.log('✅ All error variable references have been fixed!');
