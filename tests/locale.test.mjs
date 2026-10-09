import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePreferences, translate, formatCivilDate } from '../src/locale-utils.ts';
import { appEnglish } from '../src/locales/app-en.ts';
import { toolsEnglish } from '../src/locales/tools-en.ts';
import { commonEnglish } from '../src/locales/common-en.ts';
import { journeysEnglish } from '../src/locales/journeys-en.ts';
import { chinese } from '../src/locales/zh.ts';
import { spanish } from '../src/locales/es.ts';
import { interfaceLanguages, localeFor } from '../src/locale-utils.ts';

test('les préférences tolèrent un stockage absent, corrompu ou des options inconnues', () => {
  for (const raw of [null, '{broken', '[]', 'null', '42', '{"language":"zh","theme":"purple"}'])
    assert.deepEqual(parsePreferences(raw), { language: 'fr', theme: 'system' });
  assert.deepEqual(parsePreferences('{"language":"en","theme":"dark","unexpected":true}'), { language: 'en', theme: 'dark' });
});
test('les traductions préservent chaque variable dynamique', () => {
  for (const dictionary of [commonEnglish, appEnglish, toolsEnglish, journeysEnglish, chinese, spanish]) {
    for (const [source, english] of Object.entries(dictionary)) {
      const fields = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
      assert.deepEqual(fields(english), fields(source), `Variables de : ${source}`);
      assert.ok(english.trim(), `Traduction vide : ${source}`);
    }
  }
});

test('dates civiles localisées sans déplacement de jour, dates invalides gardées telles quelles', () => {
  const previousTimezone = process.env.TZ;
  try { for (const timezone of ['America/Los_Angeles', 'Asia/Shanghai', 'Pacific/Kiritimati']) {
  process.env.TZ = timezone;
  assert.equal(new Intl.DateTimeFormat().resolvedOptions().timeZone, timezone);
  for (const { id, dateLocale } of interfaceLanguages) {
    const date = '2027-05-01';
    const expected = new Intl.DateTimeFormat(dateLocale, { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(date + 'T00:00:00Z'));
    assert.equal(formatCivilDate(date, id), expected);
    for (const invalid of ['', '2027-02-29', '2027-05-01T00:00', 'not-a-date']) assert.equal(formatCivilDate(invalid, id), invalid);
    assert.ok(formatCivilDate('2028-02-29', id));
  }
  } } finally { if (previousTimezone === undefined) delete process.env.TZ; else process.env.TZ = previousTimezone; }
});

test('les quatre langues sont mémorisées et choisissent le bon format de date', () => {
  for (const { id, dateLocale } of interfaceLanguages) {
    assert.deepEqual(parsePreferences(JSON.stringify({ language: id, theme: 'light' })), { language: id, theme: 'light' });
    assert.equal(localeFor(id), dateLocale);
  }
  assert.equal(translate('Jour {count}', 'zh-CN', { count: 2 }), '第2天');
  assert.equal(translate('Jour {count}', 'es', { count: 2 }), 'Día 2');
});

test('chinois et espagnol couvrent le catalogue anglais sans modifier les valeurs personnelles', () => {
  const english = { ...commonEnglish, ...appEnglish, ...toolsEnglish, ...journeysEnglish };
  for (const [language, dictionary] of [['zh-CN', chinese], ['es', spanish]]) {
    for (const key of Object.keys(english)) assert.ok(Object.hasOwn(dictionary, key), `${language}: ${key}`);
    assert.equal(translate('Mon carnet personnel 中文 en Japón', language), 'Mon carnet personnel 中文 en Japón');
    assert.equal(translate('constructor', language), 'constructor');
    assert.equal(translate('__proto__', language), '__proto__');
    assert.ok(translate('Carte de {city} ↗', language, { city: '<Kyoto>' }).includes('<Kyoto>'));
  }
});
test('la langue conserve les textes personnels et interpole les valeurs sans les retraduire', () => {
  assert.equal(translate('Mon texte personnel 中文', 'en'), 'Mon texte personnel 中文');
  assert.equal(translate('constructor', 'en'), 'constructor');
  assert.equal(translate('__proto__', 'en'), '__proto__');
  assert.equal(translate('Carte de {city} ↗', 'en', { city: '<Shanghai>' }), 'Map of <Shanghai> ↗');
  assert.equal(translate('Carte de {city} ↗', 'fr', { city: 'Shanghai' }), 'Carte de Shanghai ↗');
});
