import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Use exact slashes to avoid matching 'react-icons', 'react-bootstrap', etc.
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('/firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('/bootstrap/') || id.includes('/react-bootstrap/')) {
              return 'vendor-bootstrap';
            }
            if (id.includes('/framer-motion/')) {
              return 'vendor-motion';
            }
            return 'vendor-core';
          }
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger']
  }
});
