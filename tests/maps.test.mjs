import test from 'node:test';
import assert from 'node:assert/strict';
import { googlePlaceLink, amapLink } from '../src/lib.ts';
import { directionsLink, placeLink } from '../src/maps.ts';

test('Google listing searches use name, address and city even with coordinates; all entry points agree', () => {
  for (const [city, place, query] of [
    [{ name: 'Paris', chineseName: '' }, { title: 'Café d’Orsay & fils #1', address: '1 rue A+B', coordinates: [48.86, 2.32] }, 'Café d’Orsay & fils #1 1 rue A+B Paris'],
    [{ name: 'Shanghai', chineseName: '上海' }, { title: 'Le Bund', chineseName: '外滩', address: '中山东一路', coordinates: [31.24, 121.49] }, '外滩 中山东一路 上海'],
    [{ name: 'Lyon' }, { title: 'Café de la Paix' }, 'Café de la Paix Lyon'],
    [{ name: 'Paris' }, { title: '' }, 'Paris'],
  ]) {
    const before = JSON.stringify({ city, place });
    const selected = { ...city, mapProvider: 'google' };
    const url = new URL(googlePlaceLink(selected, place));
    assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/search/');
    assert.deepEqual([...url.searchParams], [['api', '1'], ['query', query]]);
    assert.equal(amapLink(selected, place), url.href);
    assert.equal(placeLink(selected, place), url.href);
    assert.equal(JSON.stringify({ city, place }), before);
  }
  assert.notEqual(googlePlaceLink({ name: 'Paris' }, { title: 'Café de la Paix' }), googlePlaceLink({ name: 'Lyon' }, { title: 'Café de la Paix' }));
});

test('directions preserve valid coordinates, modes and previous stop, omitting an unspecified origin', () => {
  const city = { name: 'Paris', mapProvider: 'google' };
  const place = { title: 'Musée', coordinates: [48.86, 2.32] };
  for (const mode of ['walking', 'driving', 'transit']) {
    const current = new URL(directionsLink(city, place, mode));
    assert.equal(current.searchParams.get('api'), '1');
    assert.equal(current.searchParams.get('destination'), '48.86,2.32');
    assert.equal(current.searchParams.get('travelmode'), mode);
    assert.equal(current.searchParams.has('origin'), false);
    const previous = new URL(directionsLink(city, place, mode, { title: 'Gare', address: 'Rue A&B' }));
    assert.equal(previous.searchParams.get('origin'), 'Gare Rue A&B Paris');
  }
  for (const coordinates of [[NaN, 2], [91, 2], [48, 181]]) {
    assert.equal(new URL(directionsLink(city, { title: 'Musée', coordinates })).searchParams.get('destination'), 'Musée Paris');
  }
});

test('explicit Google listing ignores Amap preference and URL; generic links and directions preserve Amap', () => {
  const city = { name: 'Shanghai', chineseName: '上海', mapProvider: 'amap' };
  const place = { title: 'Bund', chineseName: '外滩', coordinates: [31.24, 121.49], amapUrl: 'https://uri.amap.com/search?keyword=外滩' };
  assert.equal(new URL(googlePlaceLink(city, place)).hostname, 'www.google.com');
  assert.equal(placeLink(city, place), new URL(place.amapUrl).href);
  assert.equal(directionsLink(city, place, 'transit'), new URL(place.amapUrl).href);
  const fallback = new URL(directionsLink(city, { ...place, amapUrl: 'https://amap.com.evil.test/' }));
  assert.equal(fallback.hostname, 'uri.amap.com');
  assert.equal(fallback.searchParams.get('keyword'), '上海 外滩');
  assert.equal(fallback.href.includes('121.49'), false);
});
