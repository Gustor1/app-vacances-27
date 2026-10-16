import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { parsePlanning } from '../src/planning-import/parser.ts';
import { validateDraft } from '../src/planning-import/draft.ts';
import { corpus } from '../tests/fixtures/planning/corpus.mjs';

// A reproducible contract benchmark, not a claim about arbitrary documents.
// Never transmits inputs, downloads models, or writes application storage.
const rows = [];
for (const entry of corpus) {
  const started = performance.now();
  const checks = [];
  const check = (name, actual, expected) => {
    try { assert.deepEqual(actual, expected); checks.push({ name, passed: true }); }
    catch { checks.push({ name, passed: false, actual, expected }); }
  };
  try {
    const draft = parsePlanning(entry.source);
    validateDraft(draft, entry.source, false, true);
    const days = draft.cities.flatMap(city => city.days);
    const items = days.flatMap(day => day.items);
    check('cities in source order', draft.cities.map(city => city.name), entry.cities);
    check('day count', days.length, entry.days);
    check('item count', items.length, entry.items);
    if ('date' in entry) check('first date', days[0]?.date, entry.date);
    if ('time' in entry) check('first clock time', items[0]?.time, entry.time);
    for (const [key, field] of [['times', 'time'], ['titles', 'title'], ['periods', 'period'], ['kinds', 'kind'], ['booked', 'booked']]) {
      if (entry[key]) check(key, items.map(item => item[field]), entry[key]);
    }
    if (entry.description) check('continuation retained', items[0].description.includes(entry.description), true);
    for (const note of entry.notes || []) check('unstructured note retained', draft.notes.some(value => value.includes(note)), true);
    check('no coordinates invented', items.every(item => item.coordinates === null), true);
    rows.push({ name: entry.name, milliseconds: +(performance.now() - started).toFixed(3), checks, passed: checks.every(result => result.passed) });
  } catch (error) {
    rows.push({ name: entry.name, milliseconds: +(performance.now() - started).toFixed(3), passed: false, error: error.message, checks });
  }
}

const bundledSource = await readFile(new URL('../public/documents/planning-original.md', import.meta.url), 'utf8');
const started = performance.now();
let bundled;
try {
  const draft = parsePlanning(bundledSource);
  validateDraft(draft, bundledSource, false, true);
  bundled = { file: 'public/documents/planning-original.md', milliseconds: +(performance.now() - started).toFixed(3),
    cities: draft.cities.map(city => ({ name: city.name, days: city.days.length, items: city.days.reduce((sum, day) => sum + day.items.length, 0) })),
    notes: draft.notes.length,
    limitation: 'Structural inspection of the existing bundled document; not an independently annotated activity-level accuracy score.' };
} catch (error) { bundled = { file: 'public/documents/planning-original.md', error: error.message }; }

const result = { generatedAt: new Date().toISOString(), node: process.version,
  method: 'Actual local parser on synthetic source text; no mocked extraction responses and no model.',
  cases: rows.length, passed: rows.filter(row => row.passed).length,
  checks: rows.reduce((sum, row) => sum + row.checks.length, 0),
  failedChecks: rows.reduce((sum, row) => sum + row.checks.filter(check => !check.passed).length, 0),
  rows, bundled,
  limits: ['This corpus is a regression set, not a representative traveler evaluation.', 'PDF, Word, OCR and arbitrary narrative understanding are outside this benchmark.'] };
if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ cases: result.cases, passed: result.passed, checks: result.checks, failedChecks: result.failedChecks, bundled }, null, 2));
if (result.passed !== result.cases || bundled.error) process.exitCode = 1;
