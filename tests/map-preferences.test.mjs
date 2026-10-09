import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMapPreference, preferredMapCity } from '../src/map-preferences.ts';
import { placeLink, directionsLink } from '../src/maps.ts';

test('préférence cartes : Google par défaut même avec une ancienne ville Amap, sans mutation', () => {
  for (const raw of [null,'broken','null','[]','{"provider":"unknown"}']) assert.equal(parseMapPreference(raw),'google');
  const city = {id:'c',name:'Shanghai',chineseName:'上海',mapProvider:'amap',days:[],notes:[]};
  const place = {title:'Le Bund',chineseName:'外滩',amapUrl:'https://uri.amap.com/search?keyword=Bund'};
  const selected = preferredMapCity(city,parseMapPreference(null));
  assert.equal(new URL(placeLink(selected,place)).hostname,'www.google.com');
  assert.equal(new URL(directionsLink(selected,place,'transit')).searchParams.get('travelmode'),'transit');
  assert.equal(city.mapProvider,'amap');
  assert.equal(new URL(placeLink(preferredMapCity(city,parseMapPreference('{"provider":"amap"}')),place)).hostname,'uri.amap.com');
});
