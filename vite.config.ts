import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
export default defineConfig({
  plugins: [react(), {
    name: 'version-install-manifest',
    transformIndexHtml(html) {
      // A previous worker can still serve its cached manifest after navigation
      // loads the new HTML. A content version bypasses that old cache entry;
      // the manifest's explicit id keeps the installed application unchanged.
      const version = createHash('sha256').update(readFileSync(new URL('./public/manifest.webmanifest', import.meta.url))).digest('hex').slice(0, 12);
      return html.replace('href="/manifest.webmanifest"', `href="/manifest.webmanifest?v=${version}"`);
    },
  }],
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
