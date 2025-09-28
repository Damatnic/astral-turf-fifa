import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'build', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'node_modules/**',
        'src/__tests__/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/vite.config.*',
        '**/vitest.config.*',
        '**/.{eslint,prettier}rc.*',
        // Exclude specific files that don't need testing
        'src/main.tsx',
        'src/App.tsx',
        'index.tsx',
        'App.tsx',
        'index.html',
        // Exclude type-only files
        'src/types.ts',
        'src/constants.ts',
      ],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        // Ultra-high thresholds for critical components
        'src/services/**': {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98,
        },
        'src/context/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/hooks/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
        'src/components/**': {
          branches: 92,
          functions: 92,
          lines: 92,
          statements: 92,
        },
        'src/utils/**': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
    // Configure test timeouts
    testTimeout: 30000,
    hookTimeout: 10000,
    // Enable parallel test execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
        minThreads: 2,
      },
    },
    // Test reporting
    reporter: [
      'default',
      'verbose',
      'json',
      'html',
    ],
    outputFile: {
      json: './coverage/test-results.json',
      html: './coverage/test-results.html',
    },
    // Retry configuration for flaky tests
    retry: 2,
    // Watch configuration
    watch: {
      enabled: false,
      ignore: ['**/node_modules/**', '**/dist/**'],
    },
    // Performance optimization
    isolate: true,
    passWithNoTests: false,
    logHeapUsage: true,
    // Mock specific modules
    deps: {
      inline: [
        // Inline dependencies that need to be processed by Vitest
        '@google/genai',
        'html-to-image',
        'framer-motion',
        'react-spring',
        'chart.js',
        'react-chartjs-2',
        'lucide-react',
      ],
    },
    // Mock server setup
    server: {
      deps: {
        inline: ['@testing-library/user-event'],
      },
    },
    // Advanced configuration
    sequence: {
      hooks: 'stack',
    },
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['**/*.{test,spec}.{ts,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/context': resolve(__dirname, 'src/context'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/pages': resolve(__dirname, 'src/pages'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/assets': resolve(__dirname, 'assets'),
    },
  },
  define: {
    // Mock environment variables for testing
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.API_KEY': JSON.stringify('test-api-key'),
    'process.env.GEMINI_API_KEY': JSON.stringify('test-gemini-api-key'),
    'process.env.DATABASE_URL': JSON.stringify('test://localhost:5432/test'),
    'process.env.REDIS_URL': JSON.stringify('redis://localhost:6379/0'),
    'process.env.JWT_SECRET': JSON.stringify('test-jwt-secret'),
    'process.env.ENCRYPTION_KEY': JSON.stringify('test-encryption-key'),
    'process.env.WEBHOOK_SECRET': JSON.stringify('test-webhook-secret'),
    '__VITEST__': JSON.stringify(true),
  },
});
