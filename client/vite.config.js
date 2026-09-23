import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        // Use IPv4 explicitly so Windows' localhost IPv6 preference cannot
        // produce ECONNREFUSED when the API is listening on 0.0.0.0.
        target: process.env.VITE_API_PROXY || 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: true,
    port: 4173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'axios']
        }
      }
    }
  }
});
