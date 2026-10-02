import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
// Natural Earth 1:50m, public domain. Country outlines for the regional overview.
const world = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const geo = feature(world, world.objects.countries);
const countries = new Set(['156', '158', '704', '418', '104', '356', '524', '064', '643', '496', '408', '410', '392', '764', '116', '050', '608', '458', '360', '398', '417', '762', '586', '004']);
geo.features = geo.features.filter(item => countries.has(item.id));
writeFileSync('public/asia-geography.json', JSON.stringify(geo));
console.log(`Generated local background: ${geo.features.length} country outlines.`);
