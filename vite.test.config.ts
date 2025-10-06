import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Test server configuration for port 6000
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  server: {
    port: 6020,
    host: '0.0.0.0',
    open: true,
    cors: true,
    hmr: {
      port: 6021,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
    'process.env.TEST_MODE': JSON.stringify('true'),
  },
  build: {
    outDir: 'dist-test',
    sourcemap: true,
    rollupOptions: {
      input: './test-index.html',
    },
  },
});
