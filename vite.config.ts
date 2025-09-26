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
      exclude: ['node_modules', 'dist', '.git', '.cache', 'src/**/*.spec.ts', 'src/**/*e2e*', 'src/**/*E2E*'],
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
      'process.env.API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.API_KEY),
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
            // Vendor libraries - split into smaller chunks
            if (id.includes('node_modules')) {
              // OpenAI - large external library
              if (id.includes('openai')) {
                return 'openai-vendor';
              }
              // React ecosystem - core chunk
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              // React Router - separate chunk
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              // Framer Motion - large animation library
              if (id.includes('framer-motion')) {
                return 'animation-vendor';
              }
              // UI libraries (lucide, etc)
              if (id.includes('lucide') || id.includes('@headlessui') || id.includes('@radix-ui')) {
                return 'ui-vendor';
              }
              // Charts and visualization
              if (id.includes('chart') || id.includes('d3') || id.includes('plotly')) {
                return 'charts-vendor';
              }
              // Date and time libraries
              if (id.includes('date-fns') || id.includes('moment') || id.includes('dayjs')) {
                return 'date-vendor';
              }
              // Form and validation libraries
              if (id.includes('formik') || id.includes('yup') || id.includes('joi') || id.includes('zod')) {
                return 'forms-vendor';
              }
              // HTTP and API libraries
              if (id.includes('axios') || id.includes('fetch') || id.includes('request')) {
                return 'http-vendor';
              }
              // Utility libraries (lodash, ramda, etc)
              if (id.includes('lodash') || id.includes('ramda') || id.includes('underscore')) {
                return 'lodash-vendor';
              }
              // Crypto and security libraries
              if (id.includes('crypto') || id.includes('bcrypt') || id.includes('jwt')) {
                return 'crypto-vendor';
              }
              // All other vendors
              return 'misc-vendor';
            }

            // AI services - large functionality
            if (id.includes('src/services/ai') || id.includes('src/services/advanced')) {
              return 'ai-services';
            }

            // Large page components - more granular splitting
            if (id.includes('src/pages/')) {
              // Tactics and Analytics - heavy pages
              if (id.includes('TacticsBoard')) {
                return 'tactics-pages';
              }
              if (id.includes('Analytics')) {
                return 'analytics-pages';
              }
              if (id.includes('Advanced')) {
                return 'advanced-pages';
              }
              // Dashboard pages
              if (id.includes('Dashboard')) {
                return 'dashboard-pages';
              }
              // User management pages
              if (id.includes('Player') || id.includes('Coach') || id.includes('Staff')) {
                return 'user-pages';
              }
              // Admin and settings pages
              if (id.includes('Settings') || id.includes('Finances') || id.includes('Admin')) {
                return 'admin-pages';
              }
              // Authentication pages
              if (id.includes('Login') || id.includes('Register') || id.includes('Auth')) {
                return 'auth-pages';
              }
              // Remaining pages
              return 'core-pages';
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
      chunkSizeWarningLimit: 200,
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
