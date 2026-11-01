import { writeFile } from 'node:fs/promises';
import { paletteStylesheet, paletteBootstrap } from './palette-assets.mjs';
await writeFile('public/palettes.css', paletteStylesheet());
await writeFile('public/palette-bootstrap.js', paletteBootstrap());
console.log('Palette catalog generated for light/dark and pre-React startup.');
