import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // publicDir changed to 'static' so the legacy public/index.html doesn't
  // overwrite the Vite-processed dist/index.html at build time
  publicDir: 'static',
  build: { outDir: 'dist' },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
