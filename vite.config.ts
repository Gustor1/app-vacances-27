import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { output: { manualChunks: { translations: ['./src/locales/app-en.ts', './src/locales/tools-en.ts', './src/locales/common-en.ts'], map: ['leaflet'], markdown: ['react-markdown', 'remark-gfm'] } } } }
});
