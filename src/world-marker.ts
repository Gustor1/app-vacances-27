import type { Geometry, Position } from 'geojson';

type Point = [number, number];
const project = ([x, latitude]: Position): Point => [x, Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, latitude)) * Math.PI / 360)) * 180 / Math.PI];
function distance([x, y]: Point, rings: Point[][]) {
  let inside = false, squared = Infinity;
  for (const ring of rings) for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[i], [bx, by] = ring[j];
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside;
    const dx = bx - ax, dy = by - ay;
    const fraction = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0;
    squared = Math.min(squared, (x - ax - fraction * dx) ** 2 + (y - ay - fraction * dy) ** 2);
  }
  return (inside ? 1 : -1) * Math.sqrt(squared);
}

// Find the most spacious interior point of the largest landmass in the same
// Mercator projection as Leaflet. Bounding-box centers can be outside a country.
export function countryMarkerPosition(geometry: Geometry | null): Point | null {
  const polygons = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
  const projected = polygons.filter(p => p[0]?.length >= 3).map(p => {
    const origin = p[0][0][0];
    return p.map(ring => ring.map(position => {
      const point = project(position);
      while (point[0] - origin > 180) point[0] -= 360;
      while (point[0] - origin < -180) point[0] += 360;
      return point;
    }));
  });
  const area = (ring: Point[]) => Math.abs(ring.reduce((sum, [x, y], i) => { const next = ring[(i + 1) % ring.length]; return sum + x * next[1] - next[0] * y; }, 0));
  projected.sort((a, b) => area(b[0]) - area(a[0]));
  const rings = projected[0];
  if (!rings) return null;
  const xs = rings[0].map(p => p[0]), ys = rings[0].map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const extent = Math.max(maxX - minX, maxY - minY);
  if (!extent) return null;
  const cell = (x: number, y: number, half: number) => { const d = distance([x, y], rings); return { x, y, half, d, max: d + half * Math.SQRT2 }; };
  let best = cell((minX + maxX) / 2, (minY + maxY) / 2, 0);
  const queue = [cell(best.x, best.y, extent / 2)];
  const precision = Math.max(extent / 1000, 0.00001);
  while (queue.length) {
    queue.sort((a, b) => a.max - b.max);
    const current = queue.pop()!;
    if (current.d > best.d) best = current;
    if (current.max - best.d <= precision) continue;
    const half = current.half / 2;
    for (const dx of [-half, half]) for (const dy of [-half, half]) queue.push(cell(current.x + dx, current.y + dy, half));
  }
  if (best.d <= 0) return null;
  return [Math.atan(Math.sinh(best.y * Math.PI / 180)) * 180 / Math.PI, ((best.x + 180) % 360 + 360) % 360 - 180];
}
