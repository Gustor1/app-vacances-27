import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { countryMarkerPosition } from '../src/world-marker.ts';

function insideRing([y, x], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
test('favorite markers stay on land for every bundled country, including Vietnam', async () => {
  const data = JSON.parse(await readFile(new URL('../public/world-geography.json', import.meta.url), 'utf8'));
  for (const feature of data.features) {
    const position = countryMarkerPosition(feature.geometry);
    assert.ok(position, `country ${feature.id}`);
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    assert.ok(polygons.some(p => insideRing(position, p[0]) && !p.slice(1).some(r => insideRing(position, r))), `marker outside country ${feature.id}: ${position}`);
  }
});
test('concave shapes and holes never receive a marker outside land', () => {
  const geometry = { type: 'Polygon', coordinates: [[[0,0],[10,0],[10,2],[2,2],[2,10],[0,10],[0,0]]] };
  assert.ok(insideRing(countryMarkerPosition(geometry), geometry.coordinates[0]));
  const holed = { type: 'Polygon', coordinates: [[[0,0],[10,0],[10,10],[0,10],[0,0]],[[3,3],[7,3],[7,7],[3,7],[3,3]]] };
  const point = countryMarkerPosition(holed);
  assert.ok(insideRing(point, holed.coordinates[0]));
  assert.equal(insideRing(point, holed.coordinates[1]), false);
});
test('archipelago marker uses largest landmass and invalid geometry is omitted', () => {
  assert.equal(countryMarkerPosition(null), null);
  const geometry = {type:'MultiPolygon', coordinates:[[[[0,0],[1,0],[1,1],[0,1],[0,0]]],[[[10,10],[20,10],[20,20],[10,20],[10,10]]]]};
  assert.ok(insideRing(countryMarkerPosition(geometry), geometry.coordinates[1][0]));
});
