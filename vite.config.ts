import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Ensure __dirname is available in ES modules
const __dirname = new URL('.', import.meta.url).pathname;

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      server: {
        port: parseInt(env.PORT) || 8081,
        strictPort: true,
        host: true, // This allows external connections
      },
      define: {
        // Define global process object for client-side compatibility
        global: 'globalThis',
        // Define environment variables
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || mode),
        'process.env.APP_VERSION': JSON.stringify(env.APP_VERSION || '8.0.0'),
        'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
        'process.env.JWT_SECRET': JSON.stringify(env.JWT_SECRET),
        // Process polyfill is handled by src/utils/processPolyfill.ts
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, '.'),
        },
      },
      esbuild: {
        loader: 'tsx',
        include: /\.(tsx?|jsx?)$/,
        exclude: [],
      },
      build: {
        rollupOptions: {
          output: {
            // Improved manual chunking strategy
            manualChunks: (id) => {
              // Vendor libraries
              if (id.includes('node_modules')) {
                // React ecosystem
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                  return 'react-vendor';
                }
                // Large AI/ML libraries
                if (id.includes('@google/genai') || id.includes('google-ai')) {
                  return 'google-genai';
                }
                // Animation libraries
                if (id.includes('framer-motion') || id.includes('react-spring')) {
                  return 'animation-vendor';
                }
                // Chart libraries
                if (id.includes('chart') || id.includes('d3') || id.includes('recharts')) {
                  return 'charts-vendor';
                }
                // UI libraries
                if (id.includes('react-aria') || id.includes('@headlessui') || id.includes('radix')) {
                  return 'ui-vendor';
                }
                // Font libraries
                if (id.includes('@fontsource') || id.includes('font')) {
                  return 'fonts-vendor';
                }
                // Other large vendor libraries
                if (id.includes('lodash') || id.includes('date-fns') || id.includes('moment')) {
                  return 'utils-vendor';
                }
                // Default vendor chunk for smaller libraries
                return 'vendor';
              }

              // Application code chunking
              // Large page components
              if (id.includes('src/pages/')) {
                if (id.includes('TacticsBoardPage') || id.includes('AdvancedAnalyticsPage')) {
                  return 'heavy-pages';
                }
                if (id.includes('DashboardPage') || id.includes('CoachDashboard') || id.includes('PlayerDashboard')) {
                  return 'dashboard-pages';
                }
                return 'pages';
              }

              // Popup components (conditionally loaded)
              if (id.includes('src/components/popups/')) {
                return 'popups';
              }

              // Chart components
              if (id.includes('src/components/charts/')) {
                return 'charts';
              }

              // Services
              if (id.includes('src/services/')) {
                if (id.includes('aiService') || id.includes('ai-services')) {
                  return 'ai-services';
                }
                if (id.includes('performanceService') || id.includes('errorTrackingService')) {
                  return 'monitoring-services';
                }
                return 'services';
              }

              // Context providers
              if (id.includes('src/context/')) {
                return 'context';
              }

              // Security components
              if (id.includes('src/security/') || id.includes('src/components/security/')) {
                return 'security';
              }
            },
            // Optimize chunk naming for better caching
            chunkFileNames: (chunkInfo) => {
              const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '') : 'chunk';
              return `assets/${facadeModuleId}-[hash].js`;
            },
            // Optimize asset naming
            assetFileNames: (assetInfo) => {
              const info = assetInfo.name.split('.');
              let extType = info[info.length - 1];
              if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
                extType = 'images';
              } else if (/woff2?|eot|ttf|otf/i.test(extType)) {
                extType = 'fonts';
              }
              return `assets/${extType}/[name]-[hash][extname]`;
            },
          },
        },
        // More aggressive chunk size limits
        chunkSizeWarningLimit: 250,
        // Disable source maps for production
        sourcemap: false,
        // Use terser for better minification in production
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        // Target modern browsers for better optimization
        target: 'esnext',
        // Optimize dependencies
        commonjsOptions: {
          transformMixedEsModules: true,
        },
        // Enable CSS code splitting
        cssCodeSplit: true,
      },
    };
});
