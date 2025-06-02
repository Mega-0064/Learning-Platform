import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Server configuration for development
  server: {
    port: 3000,
    open: true, // Automatically open browser
    // Proxy API requests to the Express backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSocket
        rewrite: (path) => path, // Don't rewrite paths
      }
    },
    // CORS settings
    cors: true,
  },
  build: {
    // Increase the warning limit for chunk size to 800KB
    chunkSizeWarningLimit: 800,
    // Optimization options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Module preload options
    modulePreload: {
      polyfill: true,
    },
    // Configure manual chunks for better code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Group React and related libraries into a vendor chunk
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Group Material-UI libraries into a single chunk
          'vendor-mui': [
            '@mui/material',
            '@mui/icons-material',
            '@mui/system',
            '@emotion/react',
            '@emotion/styled',
          ],
          // Redux and related libraries
          'vendor-redux': [
            'redux',
            'react-redux',
            '@reduxjs/toolkit',
          ],
          // Utility libraries - only include what's actually used in the project
          'vendor-utils': [
            'axios',
          ],
        },
      },
    },
  },
  // Optimize module handling and improve development experience
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
  },
})
