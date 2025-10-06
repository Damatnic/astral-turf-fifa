/**
 * Stryker Mutation Testing Configuration
 * Advanced mutation testing for bulletproof code quality
 */

export default {
  $schema: './node_modules/@stryker-mutator/core/schema/stryker-schema.json',

  // Test runner configuration
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],

  // Coverage analysis
  coverageAnalysis: 'perTest',

  // Files to mutate
  mutate: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '!src/__tests__/**/*',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/App.tsx',
    '!src/vite-env.d.ts',
  ],

  // Test files
  testFiles: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],

  // Mutators to use
  mutator: {
    name: 'typescript',
    plugins: ['@stryker-mutator/typescript-checker'],
    excludedMutations: [
      // Exclude mutations that don't add value
      'StringLiteral', // String constants rarely need mutation testing
      'ArrayDeclaration', // Array declarations are usually simple
    ],
  },

  // TypeScript configuration
  tsconfigFile: 'tsconfig.json',
  typescriptChecker: {
    enabled: true,
    prioritizePerformanceOverAccuracy: false,
  },

  // Performance optimization
  concurrency: 4,
  timeoutMS: 60000,
  timeoutFactor: 2,
  dryRunTimeoutMinutes: 10,

  // Thresholds for quality gates
  thresholds: {
    high: 90, // High quality threshold
    low: 85, // Minimum acceptable threshold
    break: 80, // Build breaking threshold
  },

  // Reporting configuration
  reporters: ['progress', 'clear-text', 'html', 'json', 'dashboard'],

  htmlReporter: {
    baseDir: 'reports/mutation/html',
    fileName: 'mutation-report.html',
  },

  jsonReporter: {
    fileName: 'reports/mutation/mutation.json',
  },

  dashboard: {
    project: 'astral-turf',
    version: process.env.GITHUB_SHA || 'main',
    module: 'tactics-board',
    reportType: 'full',
  },

  // Build configuration
  buildCommand: 'npm run build',

  // Plugin configuration
  plugins: ['@stryker-mutator/vitest-runner', '@stryker-mutator/typescript-checker'],

  // Advanced mutation configuration
  mutationRange: {
    // Only mutate changed files in PR
    ...(process.env.GITHUB_EVENT_NAME === 'pull_request' && {
      files: process.env.CHANGED_FILES?.split(',') || [],
    }),
  },

  // Ignored files/patterns
  ignore: [
    // Configuration files
    '**/*.config.{js,ts,mjs}',
    '**/vite.config.ts',
    '**/vitest.config.ts',
    '**/playwright.config.ts',

    // Build outputs
    'dist/**/*',
    'build/**/*',
    'coverage/**/*',
    'reports/**/*',

    // Dependencies
    'node_modules/**/*',

    // Generated files
    '**/*.generated.{js,ts}',
    '**/generated/**/*',

    // Constants that shouldn't be mutated
    'src/constants.ts',

    // Type definitions
    'src/types.ts',

    // Mock files
    'src/__tests__/mocks/**/*',
    'src/__tests__/utils/**/*',
  ],

  // Environment variables
  env: {
    NODE_ENV: 'test',
    VITEST: 'true',
    MUTATION_TESTING: 'true',
  },

  // Custom mutators for React/TypeScript patterns
  customMutators: [
    {
      name: 'ReactHookDependencyMutator',
      description: 'Mutates React hook dependencies',
      pattern: /useEffect\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*\[(.*?)\]/g,
      replacement: (match, deps) => {
        // Add/remove dependencies to test effect behavior
        return match.replace(`[${deps}]`, deps ? '[]' : '[unknownDep]');
      },
    },
    {
      name: 'AsyncAwaitMutator',
      description: 'Mutates async/await patterns',
      pattern: /await\s+/g,
      replacement: '',
    },
    {
      name: 'OptionalChainingMutator',
      description: 'Mutates optional chaining operators',
      pattern: /\?\./g,
      replacement: '.',
    },
  ],

  // Test result analysis
  incremental: {
    enabled: true,
    ignoreStatic: true,
  },

  // Parallel execution
  maxConcurrentTestRunners: 4,

  // Logging configuration
  logLevel: 'info',
  fileLogLevel: 'debug',
  allowConsoleColors: true,

  // Advanced reporting
  clearTextReporter: {
    allowColor: true,
    allowEmojis: true,
    logTests: true,
    maxTestsToLog: 3,
  },

  // Performance monitoring
  profileRuntime: true,

  // Integration with CI/CD
  commandRunner: {
    command: 'npm run test:unit -- --run --reporter=json',
  },

  // Specific component targeting
  componentTargets: {
    // Focus on critical components
    critical: [
      'src/components/tactics/UnifiedTacticsBoard.tsx',
      'src/components/tactics/ModernField.tsx',
      'src/components/tactics/PlayerToken.tsx',
      'src/services/authService.ts',
      'src/context/AppProvider.tsx',
    ],

    // Focus on utility functions
    utilities: ['src/utils/**/*.ts', 'src/hooks/**/*.ts'],

    // Focus on business logic
    business: ['src/services/**/*.ts', '!src/services/**/*.test.ts'],
  },

  // Custom test patterns
  testPatterns: {
    // Unit tests should have high mutation score
    unit: {
      pattern: '**/*.test.{ts,tsx}',
      threshold: 95,
    },

    // Integration tests can have lower threshold
    integration: {
      pattern: '**/integration/*.test.{ts,tsx}',
      threshold: 85,
    },

    // E2E tests focus on user journeys
    e2e: {
      pattern: '**/e2e/*.spec.ts',
      threshold: 75,
    },
  },

  // Mutation analysis rules
  mutationAnalysis: {
    // Skip mutations that are likely false positives
    skipPatterns: [
      // Console statements
      /console\.(log|warn|error|info)/,

      // Development-only code
      /if\s*\(\s*process\.env\.NODE_ENV\s*===\s*['"]development['"]\s*\)/,

      // Error boundary fallbacks
      /catch\s*\([^)]*\)\s*\{[\s\S]*?console\.error/,
    ],

    // Focus on high-impact mutations
    prioritizePatterns: [
      // Conditional logic
      /if\s*\(/,
      /\?\s*:/,
      /&&|\|\|/,

      // Loop conditions
      /for\s*\(/,
      /while\s*\(/,

      // Function parameters
      /function\s+\w+\s*\([^)]*\)/,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,

      // State updates
      /setState|setCount|setData/,

      // Event handlers
      /onClick|onChange|onSubmit/,
    ],
  },

  // Report generation
  reports: {
    // Generate detailed component reports
    componentReports: true,

    // Generate test effectiveness analysis
    testEffectivenessReport: true,

    // Generate recommendations
    recommendations: true,

    // Historical comparison
    historicalComparison: {
      enabled: true,
      baseline: 'main',
      threshold: -5, // Alert if mutation score drops by 5%
    },
  },

  // Quality gates integration
  qualityGates: {
    // Block deployment if mutation score too low
    blockOnLowScore: true,

    // Require improvement for new code
    newCodeThreshold: 90,

    // Alert on regression
    regressionThreshold: -3,
  },

  // Notification configuration
  notifications: {
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#quality-alerts',
      onlyOnFailure: true,
    },

    github: {
      enabled: !!process.env.GITHUB_TOKEN,
      token: process.env.GITHUB_TOKEN,
      postComment: true,
      updateStatus: true,
    },
  },
};
