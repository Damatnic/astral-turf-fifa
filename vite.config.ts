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
        port: 8081,
        strictPort: true,
        host: true, // This allows external connections
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.API_KEY),
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
            manualChunks: {
              // AI Service chunk - large functionality that can be lazy loaded
              'ai-services': ['src/services/aiService.ts'],
              // Google GenAI dependency - large external library
              'google-genai': ['@google/genai'],
              // React core dependencies
              'react-vendor': ['react', 'react-dom'],
              // Router dependency
              'router': ['react-router-dom'],
              // Chart related components (can be lazy loaded)
              'charts': [
                'src/components/charts/BarChart.tsx',
                'src/components/charts/LineChart.tsx',
                'src/components/charts/RadarChart.tsx',
                'src/components/charts/ScatterPlot.tsx',
              ],
              // Large popup components that are conditionally rendered
              'popups': [
                'src/components/popups/MatchSimulatorPopup.tsx',
                'src/components/popups/CustomFormationEditorPopup.tsx',
                'src/components/popups/PlayerComparePopup.tsx',
                'src/components/popups/TransferMarketPopup.tsx',
                'src/components/popups/ScoutingPopup.tsx',
              ],
              // Dashboard components (heavy components)
              'dashboards': [
                'src/components/dashboards/CoachDashboard.tsx',
                'src/components/dashboards/PlayerDashboard.tsx',
              ],
            },
          },
        },
        // Optimize chunk size warning limit to be more aggressive
        chunkSizeWarningLimit: 300,
        // Enable source maps for better debugging while keeping production optimized
        sourcemap: false,
        // Enable minification
        minify: 'esbuild',
        // Optimize dependencies
        commonjsOptions: {
          transformMixedEsModules: true,
        },
      },
    };
});
