import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { chromiumTestOptions } from './browser-test-options.ts';

// Approved source artwork, resized without redrawing or changing its colors.
const master = await readFile('docs/design/palette-claire-detours/oiseau-lin-vert-profond.png');
const source = 'data:image/png;base64,' + master.toString('base64');
const browser = await chromium.launch(chromiumTestOptions());
try {
  const page = await browser.newPage();
  await mkdir('public/icons', { recursive: true });
  for (const [name, size, maskable] of [['brand-128', 128, false], ['favicon-32', 32, false], ['favicon-48', 48, false], ['apple-touch-icon', 180, false], ['icon-192', 192, false], ['icon-512', 512, false], ['maskable-512', 512, true]]) {
    const data = await page.evaluate(async ({ source, size, maskable }) => {
      const image = new Image();
      image.src = source;
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#e1d6c4'; ctx.fillRect(0, 0, size, size);
      ctx.imageSmoothingQuality = 'high';
      // Original bird tips extend near the circular safe zone; inset for all Android masks.
      const scale = maskable ? .8 : 1;
      const inset = (1 - scale) * size / 2;
      ctx.drawImage(image, inset, inset, size * scale, size * scale);
      return canvas.toDataURL('image/png').split(',')[1];
    }, { source, size, maskable });
    await writeFile(`public/icons/${name}.png`, Buffer.from(data, 'base64'));
  }
  // Compatibility for bookmarks that still request the previous SVG path.
  // The artwork is the same generated PNG, not an approximation drawn with paths.
  const brand = await readFile('public/icons/brand-128.png');
  await writeFile('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${brand.toString('base64')}"/></svg>\n`);
  const dark = await readFile('docs/design/palette-claire-detours/oiseau-sombre-ivoire-sable.png');
  const darkPng = await page.evaluate(async source => {
    const image = new Image(); image.src = source; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d'); context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, 128, 128);
    return canvas.toDataURL('image/png').split(',')[1];
  }, 'data:image/png;base64,' + dark.toString('base64'));
  await writeFile('public/icons/brand-dark-128.png', Buffer.from(darkPng, 'base64'));
} finally { await browser.close(); }
