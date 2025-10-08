import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { getSecurityHeaders } from './src/security/securityHeaders';

// Performance optimization plugins
const optimizeReactPlugin = () => ({
  name: 'optimize-react',
  config(config: any) {
    config.esbuild = {
      ...config.esbuild,
      jsxDev: false, // Disable React dev mode in production
      drop: ['console', 'debugger'], // Remove console.log and debugger statements
    };
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  const isVercel = env.VERCEL === '1' || process.env.VERCEL === '1';

  return {
    plugins: [
      react({
        // Use SWC for faster compilation
        jsxRuntime: 'automatic',
      }),
      ...(isProd ? [optimizeReactPlugin()] : []),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: [
        'node_modules',
        'dist',
        '.git',
        '.cache',
        'src/**/*.spec.ts',
        'src/**/*e2e*',
        'src/**/*E2E*',
      ],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/__tests__/', 'dist/', '*.config.*'],
      },
      testTimeout: 10000,
      hookTimeout: 10000,
    },
    server: {
      port: 5173,
      strictPort: false,
      host: true, // This allows external connections
      headers: {
        // Guardian Security Headers for Development
        ...getSecurityHeaders(),
        // Additional development-specific headers
        'X-Powered-By': '', // Remove server fingerprinting
        Server: '', // Remove server information
        'X-DNS-Prefetch-Control': 'off',
        'X-Download-Options': 'noopen',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': [
          'geolocation=()',
          'microphone=()',
          'camera=()',
          'payment=()',
          'usb=()',
          'magnetometer=()',
          'gyroscope=()',
          'speaker=(self)',
          'fullscreen=(self)',
          'autoplay=(self)',
        ].join(', '),
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY || env.API_KEY),
      global: 'globalThis',
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react/jsx-runtime',
        'framer-motion',
        'lucide-react',
        '@react-spring/web',
        'chart.js',
        'react-chartjs-2',
        'axios',
      ],
      exclude: ['@tauri-apps/api'], // Exclude Tauri APIs from optimization
      force: true,
      esbuildOptions: {
        target: 'es2022',
        jsx: 'automatic',
        treeShaking: true,
        minifyIdentifiers: isProd,
        minifyWhitespace: isProd,
        minifySyntax: isProd,
        legalComments: 'none',
        keepNames: false,
        platform: 'browser',
      },
    },

    // Performance-focused resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
        '@services': resolve(__dirname, 'src/services'),
        '@context': resolve(__dirname, 'src/context'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'], // Prioritize TypeScript
      mainFields: ['module', 'jsnext:main', 'main'], // Prefer ES modules
    },
    esbuild: {
      loader: 'tsx',
      include: /\.(tsx?|jsx?)$/,
      exclude: [],
      target: 'es2022',
      jsx: 'automatic',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      tsconfigRaw: {
        compilerOptions: {
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
      },
      drop: isProd ? ['console', 'debugger'] : [],
      pure: isProd ? ['console.log', 'console.warn', 'console.error'] : [],
      legalComments: 'none',
      keepNames: false,
    },
    build: {
      target: 'es2022', // Target newer ES for better optimization
      sourcemap: isProd && !isVercel ? false : 'hidden', // Source maps for Vercel debugging
      minify: 'esbuild', // Use esbuild for fastest minification
      reportCompressedSize: !isVercel, // Skip gzip size analysis for Vercel builds
      chunkSizeWarningLimit: isVercel ? 500 : 100, // Relaxed limits for Vercel edge functions

      // Ultra-aggressive asset optimization
      assetsInlineLimit: 4096, // Inline smaller assets (4KB) for fewer requests
      cssCodeSplit: true,
      cssMinify: 'esbuild',

      // Catalyst-specific optimizations
      modulePreload: {
        polyfill: false, // Modern browsers only
      },

      // Advanced compression
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          pure_funcs: isProd ? ['console.log', 'console.warn'] : [],
          passes: 3,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },

      rollupOptions: {
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
        external: _id => {
          // Don't externalize React - keep it bundled to prevent context issues
          return false;
        },
        output: {
          // Optimized chunk naming for better caching
          entryFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          chunkFileNames: isProd ? 'js/[name]-[hash].js' : 'js/[name].js',
          assetFileNames: isProd ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]',

          // Ultra-aggressive manual chunking for Catalyst performance
          manualChunks: id => {
            // CRITICAL PATH - Priority 1 (sub-100KB chunks)
            if (
              id.includes('react') &&
              !id.includes('router') &&
              !id.includes('spring') &&
              !id.includes('aria')
            ) {
              return 'react-core';
            }

            // Performance utilities - Critical
            if (
              id.includes('performanceOptimizations') ||
              id.includes('cachingOptimizations') ||
              id.includes('animationOptimizations') ||
              id.includes('lazyLoadingOptimizations')
            ) {
              return 'performance-core';
            }

            // Essential UI components - Critical
            if (
              id.includes('UnifiedTacticsBoard') ||
              id.includes('ModernField') ||
              id.includes('PlayerToken') ||
              id.includes('ContextualToolbar')
            ) {
              return 'tactics-essential';
            }

            // Formation engine - Critical
            if (
              id.includes('formationAutoAssignment') ||
              id.includes('formationCalculationWorker') ||
              id.includes('tacticsReducer')
            ) {
              return 'formation-engine';
            }

            // PRIORITY 2 - High-performance features (sub-150KB)

            // Advanced tactical components
            if (
              id.includes('QuickActionsPanel') ||
              id.includes('PlayerStatsOverlay') ||
              id.includes('TacticalDrawingTools') ||
              id.includes('PositioningModeToggle')
            ) {
              return 'tactics-advanced';
            }

            // Canvas and rendering
            if (
              id.includes('DrawingCanvas') ||
              id.includes('CanvasRenderer') ||
              id.includes('TacticalHeatMapCanvas') ||
              id.includes('performance/CanvasRenderer')
            ) {
              return 'render-engine';
            }

            // Analytics and visualization
            if (
              id.includes('AdvancedAnalyticsDashboard') ||
              id.includes('AdvancedMetricsRadar') ||
              id.includes('HeatMapAnalytics') ||
              id.includes('ChemistryVisualization')
            ) {
              return 'analytics-core';
            }

            // Animation system
            if (
              id.includes('framer-motion') ||
              id.includes('@react-spring') ||
              id.includes('AnimationTimeline') ||
              id.includes('AnimationSystem')
            ) {
              return 'animations';
            }

            // PRIORITY 3 - Feature modules (lazy-loaded)

            // Chart libraries
            if (
              id.includes('chart.js') ||
              id.includes('react-chartjs') ||
              id.includes('RadarChart') ||
              id.includes('PerformanceChart')
            ) {
              return 'charts';
            }

            // UI icons and assets
            if (id.includes('lucide-react')) {
              return 'ui-icons';
            }

            // Collaboration features
            if (
              id.includes('CollaborationFeatures') ||
              id.includes('ChallengeManagement') ||
              id.includes('ConflictResolutionMenu')
            ) {
              return 'collaboration';
            }

            // Export/Import features
            if (
              id.includes('EnhancedExportImport') ||
              id.includes('PrintableLineup') ||
              id.includes('PresentationControls')
            ) {
              return 'export-import';
            }

            // Management features
            if (
              id.includes('DugoutManagement') ||
              id.includes('ExpandedPlayerCard') ||
              id.includes('ChallengeCreator')
            ) {
              return 'management';
            }

            // PRIORITY 4 - External services (lazy-loaded)

            // AI services
            if (
              id.includes('openai') ||
              id.includes('@google/genai') ||
              id.includes('IntelligentAssistant')
            ) {
              return 'ai-services';
            }

            // Database and persistence
            if (
              id.includes('@prisma/client') ||
              id.includes('indexedDBOptimizations') ||
              id.includes('dexie')
            ) {
              return 'data-layer';
            }

            // Security and crypto
            if (
              id.includes('crypto-js') ||
              id.includes('bcryptjs') ||
              id.includes('jsonwebtoken') ||
              id.includes('jose')
            ) {
              return 'security';
            }

            // PRIORITY 5 - Utilities and libraries

            // HTTP and validation
            if (
              id.includes('axios') ||
              id.includes('zod') ||
              id.includes('joi') ||
              id.includes('validator')
            ) {
              return 'utilities';
            }

            // Router (separate for code splitting)
            if (id.includes('react-router')) {
              return 'router';
            }

            // Accessibility
            if (id.includes('react-aria') || id.includes('@react-aria')) {
              return 'accessibility';
            }

            // Internationalization
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }

            // Everything else in node_modules
            if (id.includes('node_modules')) {
              // Split large vendor packages
              if (id.includes('node_modules/react-dom')) {
                return 'react-dom';
              }
              if (id.includes('node_modules/winston')) {
                return 'logging';
              }
              if (id.includes('node_modules/prisma')) {
                return 'database-client';
              }

              return 'vendor';
            }

            // Application code fallback
            return 'app';
          },

          // Optimize imports
          hoistTransitiveImports: false,
          generatedCode: {
            preset: 'es2015',
            arrowFunctions: true,
            constBindings: true,
            objectShorthand: true,
          },

          // Reduce bundle size
          compact: true,
        },

        // Optimize external dependencies
        onwarn(warning, warn) {
          // Suppress 'this' has been rewritten to 'undefined' warning
          if (warning.code === 'THIS_IS_UNDEFINED') {
            return;
          }
          warn(warning);
        },
      },

      // Performance optimizations
      commonjsOptions: {
        transformMixedEsModules: true,
        include: [/node_modules/],
        exclude: [/node_modules\/@tauri-apps/],
      },

      // Advanced build optimizations
      copyPublicDir: true,
      emptyOutDir: true,

      // Catalyst-specific build pipeline
      plugins: isProd
        ? [
            // Additional production optimizations would go here
          ]
        : [],

      // Experimental features for better performance
      experimental: {
        renderBuiltUrl(filename: string) {
          return `/${filename}`;
        },
      },
    },

    // Catalyst Performance Features
    experimental: {
      hmrPartialAccept: true, // Enable partial HMR for better dev performance
    },

    // Advanced preview configuration with Guardian Security
    preview: {
      port: 8080,
      strictPort: true,
      host: true,
      cors: {
        origin: [
          'http://localhost:3011',
          'http://localhost:3012',
          'http://127.0.0.1:3011',
          'http://127.0.0.1:3012',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
      },
      headers: {
        // Guardian Enterprise Security Headers
        ...getSecurityHeaders(),
        // Production-optimized caching
        'Cache-Control': 'public, max-age=31536000, immutable',
        Vary: 'Accept-Encoding',
        // Security hardening
        'X-Powered-By': '',
        Server: '',
        'X-DNS-Prefetch-Control': 'off',
        'X-Download-Options': 'noopen',
        'X-Permitted-Cross-Domain-Policies': 'none',
        // Feature policy for enhanced security
        'Permissions-Policy': [
          'geolocation=()',
          'microphone=()',
          'camera=()',
          'payment=()',
          'usb=()',
          'magnetometer=()',
          'gyroscope=()',
          'speaker=(self)',
          'fullscreen=(self)',
          'autoplay=(self)',
          'encrypted-media=(self)',
          'picture-in-picture=(self)',
        ].join(', '),
        // Additional security headers
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',
      },
    },

    // Worker configuration for better performance
    worker: {
      format: 'es',
      plugins: () => [react()],
    },

    // JSON optimization
    json: {
      namedExports: true,
      stringify: isProd,
    },
  };
});
