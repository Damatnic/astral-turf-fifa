import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: ['node_modules', 'dist', '.git', '.cache'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/__tests__/', 'dist/', '*.config.*'],
      },
      testTimeout: 10000,
      hookTimeout: 10000,
    },
    server: {
      port: 8081,
      strictPort: true,
      host: true, // This allows external connections
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'react/jsx-runtime'],
      force: true,
      esbuildOptions: {
        target: 'es2020',
        jsx: 'automatic'
      }
    },
    esbuild: {
      loader: 'tsx',
      include: /\.(tsx?|jsx?)$/,
      exclude: [],
    },
    build: {
      rollupOptions: {
        external: (id) => {
          // Don't externalize React - keep it bundled to prevent context issues
          return false;
        },
        output: {
          manualChunks: id => {
            // Vendor libraries
            if (id.includes('node_modules')) {
              // Google GenAI - large external library
              if (id.includes('@google/genai')) {
                return 'google-genai';
              }
              // Keep React and React-DOM together in vendor chunk
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor';
              }
              // Other vendors
              return 'vendor';
            }

            // AI services - large functionality
            if (id.includes('src/services/ai') || id.includes('src/services/advanced')) {
              return 'ai-services';
            }

            // Large page components
            if (id.includes('src/pages/')) {
              // Group analytics and advanced pages
              if (
                id.includes('Analytics') ||
                id.includes('Advanced') ||
                id.includes('TacticsBoard')
              ) {
                return 'analytics-pages';
              }
              // Group dashboard pages
              if (id.includes('Dashboard') || id.includes('Player') || id.includes('Coach')) {
                return 'dashboard-pages';
              }
              // Group settings and admin pages
              if (id.includes('Settings') || id.includes('Staff') || id.includes('Finances')) {
                return 'admin-pages';
              }
              return 'pages';
            }

            // Popup components
            if (id.includes('src/components/popups/')) {
              return 'popups';
            }

            // Chart components
            if (id.includes('src/components/charts/') || id.includes('src/components/analytics/')) {
              return 'charts';
            }

            // Dashboard components
            if (id.includes('src/components/dashboards/')) {
              return 'dashboards';
            }

            // Field and tactical components
            if (id.includes('src/components/field/') || id.includes('src/components/tactics/')) {
              return 'tactical';
            }
          },
        },
      },
      // Optimize chunk size warning limit to be more aggressive
      chunkSizeWarningLimit: 250,
      // Disable source maps in production for smaller bundles
      sourcemap: false,
      // Enable minification with esbuild for faster builds
      minify: 'esbuild',
      // Target modern browsers for better optimization
      target: ['es2020', 'chrome80', 'firefox74', 'safari13'],
      // Optimize dependencies
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      // Compress assets
      assetsInlineLimit: 4096,
      // Enable CSS code splitting
      cssCodeSplit: true,
    },
  };
});
