import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

/**
 * Performance-optimized Vite configuration
 * Implements code splitting, tree shaking, and bundle optimization
 */

// Custom plugin for additional optimizations
const performanceOptimizationPlugin = (): Plugin => ({
  name: 'performance-optimization',
  config(config, env) {
    return {
      esbuild: {
        ...config.esbuild,
        // Remove console and debugger in production
        drop: env.mode === 'production' ? ['console', 'debugger'] : [],
        // Disable React dev mode helpers in production
        jsxDev: env.mode !== 'production',
      },
    };
  },
});

// Bundle analyzer plugin (only in analyze mode)
const bundleAnalyzerPlugin = (): Plugin => {
  return visualizer({
    filename: './dist/stats.html',
    open: true,
    gzipSize: true,
    brotliSize: true,
    template: 'treemap', // 'sunburst', 'treemap', 'network'
  }) as Plugin;
};

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    plugins: [
      react({
        // Use SWC for faster builds
        jsxRuntime: 'automatic',
        // Babel plugins for optimization
        babel: {
          plugins: isProd
            ? [
                // Remove PropTypes in production
                ['transform-remove-console'],
                // Optimize styled-components if used
                ['babel-plugin-styled-components', { displayName: false, ssr: false }],
              ]
            : [],
        },
      }),
      performanceOptimizationPlugin(),
      // Compression plugins
      ...(isProd
        ? [
            // Gzip compression
            compression({
              algorithm: 'gzip',
              ext: '.gz',
              threshold: 10240, // Only compress files > 10KB
              deleteOriginFile: false,
            }),
            // Brotli compression
            compression({
              algorithm: 'brotliCompress',
              ext: '.br',
              threshold: 10240,
              deleteOriginFile: false,
            }),
          ]
        : []),
      // Bundle analyzer (only when ANALYZE=true)
      ...(isAnalyze ? [bundleAnalyzerPlugin()] : []),
    ],

    // Build optimizations
    build: {
      target: 'es2020',
      minify: isProd ? 'esbuild' : false,
      cssMinify: isProd,
      sourcemap: isProd ? 'hidden' : true, // Hidden sourcemaps for production debugging

      // Rollup options for code splitting
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: id => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              // Router
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              // Framer Motion (animation)
              if (id.includes('framer-motion')) {
                return 'vendor-animation';
              }
              // Chart libraries
              if (id.includes('chart') || id.includes('recharts')) {
                return 'vendor-charts';
              }
              // AI/ML libraries
              if (id.includes('@tensorflow') || id.includes('openai')) {
                return 'vendor-ai';
              }
              // Icons
              if (id.includes('lucide-react') || id.includes('react-icons')) {
                return 'vendor-icons';
              }
              // Date utilities
              if (id.includes('date-fns')) {
                return 'vendor-date';
              }
              // Other vendors
              return 'vendor-misc';
            }

            // Application chunks
            // Tactics board (largest component)
            if (id.includes('/components/tactics/') || id.includes('/pages/TacticsBoardPage')) {
              return 'app-tactics';
            }
            // Analytics
            if (id.includes('/components/analytics/') || id.includes('/pages/AnalyticsPage')) {
              return 'app-analytics';
            }
            // AI features
            if (id.includes('/services/ai') || id.includes('/components/ai/')) {
              return 'app-ai';
            }
            // Collaboration
            if (id.includes('/collaboration/')) {
              return 'app-collaboration';
            }

            // Default: no specific chunk (will be in main bundle)
            return undefined;
          },

          // Asset naming for better caching
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name?.split('.');
            const ext = info?.[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
              return 'images/[name]-[hash][extname]';
            }
            if (/woff|woff2|eot|ttf|otf/i.test(ext || '')) {
              return 'fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },

        // Tree shaking
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
        },
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 600,

      // Optimize dependencies
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },

      // Minify options
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug'],
              passes: 2,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
    },

    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        'date-fns',
      ],
      exclude: ['@tauri-apps/api'],
      esbuildOptions: {
        target: 'es2020',
      },
    },

    // Server configuration
    server: {
      port: 8081,
      strictPort: true,
      host: true,
      // Compression for dev server
      compress: true,
    },

    // Preview server (production preview)
    preview: {
      port: 8082,
      strictPort: true,
      host: true,
    },

    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@utils': resolve(__dirname, './src/utils'),
        '@services': resolve(__dirname, './src/services'),
        '@types': resolve(__dirname, './src/types'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
      // PostCSS configuration (see postcss.config.js for PurgeCSS)
      postcss: './postcss.config.js',
    },

    // JSON optimization
    json: {
      stringify: isProd, // Stringify large JSON in production
    },

    // Performance hints
    logLevel: 'info',
    clearScreen: false,
  };
});
