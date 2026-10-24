import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { contrastRatio, defaultPalettes, paletteIds, paletteTokens, parsePalettes } from '../src/palettes.ts';
import { paletteStylesheet, paletteBootstrap } from '../scripts/palette-assets.mjs';

test('palette preferences are additive, recover from invalid data and preserve each valid appearance', () => {
  for (const raw of [null, '', 'oops', 'null', '[]', '{}', '{"version":2,"light":"corail"}']) assert.deepEqual(parsePalettes(raw), defaultPalettes);
  assert.deepEqual(parsePalettes('{"version":1,"light":"violet","dark":"__proto__"}'), { version: 1, light: 'violet', dark: 'signature' });
  assert.deepEqual(parsePalettes('{"version":1,"light":42,"dark":"glacier"}'), { version: 1, light: 'signature', dark: 'glacier' });
  assert.deepEqual(parsePalettes(JSON.stringify({ version: 1, light: 'corail', dark: 'foret' })), { version: 1, light: 'corail', dark: 'foret' });
});

for (const id of paletteIds) for (const mode of ['light', 'dark']) {
  test(`${id} ${mode}: text, selection, links, filled actions, control edges and focus remain readable`, () => {
    const t = paletteTokens(id, mode);
    for (const bg of ['--surface-alt', '--surface', '--field', '--selected-surface']) {
      for (const fg of ['--text', '--muted', '--green']) assert.ok(contrastRatio(t[fg], t[bg]) >= 4.5, `${fg} on ${bg}`);
    }
    assert.ok(contrastRatio(t['--on-action'], t['--action']) >= 4.5);
    for (const bg of ['--surface-alt', '--surface', '--field']) {
      assert.ok(contrastRatio(t['--control-line'], t[bg]) >= 3, `control on ${bg}`);
      assert.ok(contrastRatio(t['--focus'], t[bg]) >= 3, `focus on ${bg}`);
    }
  });
}

test('generated startup assets agree with the palette catalog', () => {
  assert.equal(readFileSync('public/palettes.css', 'utf8'), paletteStylesheet());
  assert.equal(readFileSync('public/palette-bootstrap.js', 'utf8'), paletteBootstrap());
});

test('pre-React bootstrap resolves custom palettes and survives unavailable or malformed storage without writes', () => {
  for (const [preferences, palettes, systemDark, theme, palette] of [
    [{theme:'light',language:'es'}, {version:1,light:'violet',dark:'corail'}, true, 'light', 'violet'],
    [{theme:'dark',language:'en'}, {version:1,light:'violet',dark:'glacier'}, false, 'dark', 'glacier'],
    [{theme:'system'}, {version:1,light:'soleil',dark:'foret'}, true, 'dark', 'foret'],
    [null, null, false, 'light', 'signature'],
    [null, null, true, 'dark', 'signature'],
    ['malformed', {version:1,dark:'__proto__'}, true, 'dark', 'signature'],
  ]) {
    const root = { dataset:{}, style:{} }, meta = {};
    let writes = 0;
    const storage = { getItem: key => key === 'a-l-est-preferences-v1' ? typeof preferences === 'string' ? preferences : JSON.stringify(preferences) : JSON.stringify(palettes), setItem: () => writes++ };
    vm.runInNewContext(paletteBootstrap(), { document:{documentElement:root,querySelector:()=>({setAttribute:(_,value)=>meta.color=value})},localStorage:storage,matchMedia:()=>({matches:systemDark}) });
    assert.equal(root.dataset.theme, theme); assert.equal(root.dataset.palette, palette);
    assert.equal(meta.color, paletteTokens(palette, theme)['--surface-alt']); assert.equal(writes, 0);
  }
  const root = { dataset:{}, style:{} };
  vm.runInNewContext(paletteBootstrap(), { document:{documentElement:root,querySelector:()=>null},localStorage:{getItem:()=>{throw Error('blocked');}},matchMedia:()=>({matches:false}) });
  assert.equal(root.dataset.palette, 'signature'); assert.equal(root.dataset.theme, 'light');
});
