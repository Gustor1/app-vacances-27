import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePreferences, translate } from '../src/locale-utils.ts';
import { appEnglish } from '../src/locales/app-en.ts';
import { toolsEnglish } from '../src/locales/tools-en.ts';
import { commonEnglish } from '../src/locales/common-en.ts';

test('les préférences tolèrent un stockage absent, corrompu ou des options inconnues', () => {
  for (const raw of [null, '{broken', '[]', 'null', '42', '{"language":"zh","theme":"purple"}'])
    assert.deepEqual(parsePreferences(raw), { language: 'fr', theme: 'system' });
  assert.deepEqual(parsePreferences('{"language":"en","theme":"dark","unexpected":true}'), { language: 'en', theme: 'dark' });
});
test('les traductions préservent chaque variable dynamique', () => {
  for (const dictionary of [commonEnglish, appEnglish, toolsEnglish]) {
    for (const [source, english] of Object.entries(dictionary)) {
      const fields = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
      assert.deepEqual(fields(english), fields(source), `Variables de : ${source}`);
      assert.ok(english.trim(), `Traduction vide : ${source}`);
    }
  }
});
test('la langue conserve les textes personnels et interpole les valeurs sans les retraduire', () => {
  assert.equal(translate('Mon texte personnel 中文', 'en'), 'Mon texte personnel 中文');
  assert.equal(translate('constructor', 'en'), 'constructor');
  assert.equal(translate('__proto__', 'en'), '__proto__');
  assert.equal(translate('Carte de {city} ↗', 'en', { city: '<Shanghai>' }), 'Map of <Shanghai> ↗');
  assert.equal(translate('Carte de {city} ↗', 'fr', { city: 'Shanghai' }), 'Carte de Shanghai ↗');
});
