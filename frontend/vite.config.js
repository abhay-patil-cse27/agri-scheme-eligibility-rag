import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    mkcert()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'axios', 'lucide-react']
        }
      }
    }
  }
});
