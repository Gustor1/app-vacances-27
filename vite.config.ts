import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  // Dependencies used only inside the DOCX worker must be discovered before
  // first import, otherwise dev optimization reloads an open review dialog.
  optimizeDeps: { include: ['fflate', 'saxes', 'pdfjs-dist'] },
  build: { rollupOptions: { output: {
    // Keep shared React/runtime helpers out of deferred feature chunks.
    onlyExplicitManualChunks: true,
    manualChunks(id) {
      const file = id.replaceAll('\\', '/');
      if (/\/node_modules\/(react|react-dom|scheduler)\//.test(file) || file.includes('commonjsHelpers.js')) return 'react';
      if (/\/src\/locales\/(app-en|tools-en|common-en|journeys-en|zh|es|beta)\.ts$/.test(file)) return 'translations';
      if (file.includes('/node_modules/@supabase/')) return 'cloud';
      if (file.includes('/node_modules/leaflet/')) return 'map';
      if (/\/node_modules\/(react-markdown|remark-gfm)\//.test(file)) return 'markdown';
    },
  } } },
});
