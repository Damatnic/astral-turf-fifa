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
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Higher thresholds for critical components
        'src/services/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/context/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/hooks/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    // Configure test timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    // Mock specific modules
    deps: {
      inline: [
        // Inline dependencies that need to be processed by Vitest
        '@google/genai',
        'html-to-image',
      ],
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
    'process.env.API_KEY': JSON.stringify('test-api-key'),
    'process.env.GEMINI_API_KEY': JSON.stringify('test-gemini-api-key'),
  },
});