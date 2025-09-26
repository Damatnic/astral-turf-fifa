// Mutation Testing Configuration for Stryker
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'json'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',

  // Files to mutate
  mutate: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/__tests__/**/*',
    '!src/**/*.d.ts',
    '!src/vite-env.d.ts',
    '!src/main.tsx', // Entry point
  ],

  // Test files
  testFiles: ['src/__tests__/**/*.test.{js,jsx,ts,tsx}', 'src/__tests__/**/*.spec.{js,jsx,ts,tsx}'],

  // Ignore patterns
  ignorePatterns: ['node_modules', 'dist', 'coverage', '.git', 'public', 'src-tauri', 'reports'],

  // Mutation score thresholds
  thresholds: {
    high: 85,
    low: 75,
    break: 70,
  },

  // Specific mutators to enable/disable
  mutator: {
    // Enable all mutators except risky ones
    excludedMutations: [
      'ArrayNewExpression', // Can cause infinite loops
      'FalseAlwaysLiteral', // Too basic
      'TrueAlwaysLiteral', // Too basic
    ],
  },

  // Timeouts
  timeoutMS: 30000,
  timeoutFactor: 1.5,

  // Concurrency
  concurrency: 4,

  // Plugins
  plugins: ['@stryker-mutator/vitest-runner', '@stryker-mutator/typescript-checker'],

  // TypeScript configuration
  tsconfigFile: 'tsconfig.json',

  // Incremental mode for faster subsequent runs
  incremental: true,
  incrementalFile: 'reports/mutation/incremental.json',

  // Disable mutants on specific files that don't need mutation testing
  disableTypeChecks: false,

  // Custom mutation ranges for critical code paths
  mutationRange: {
    // Focus on business logic
    'src/services/**/*.ts': {
      high: 90,
      low: 85,
    },
    'src/components/**/*.tsx': {
      high: 85,
      low: 80,
    },
    'src/hooks/**/*.ts': {
      high: 90,
      low: 85,
    },
    'src/context/**/*.ts*': {
      high: 85,
      low: 80,
    },
  },
};
