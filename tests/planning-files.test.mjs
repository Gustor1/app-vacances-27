import test from 'node:test';
import assert from 'node:assert/strict';
import { readPlanningFile, MAX_PLANNING_FILE_BYTES } from '../src/planning-import/files.ts';

const file = (name, content) => new File([content], name, { type: 'text/plain' });
const rejectsWith = (input, code) => assert.rejects(() => readPlanningFile(input), error => error.code === code);

test('planning file reads UTF-8 text and Markdown without altering source, accents, newlines or BOM', async () => {
  for (const name of ['voyage.txt', 'Chine.MD', 'programme.markdown']) {
    const source = '\uFEFF# Été à 上海\r\n\r\nJour 1\r\n- 09:00 Musée 🏛️\r\n';
    assert.equal(await readPlanningFile(file(name, source)), source);
  }
});

test('planning file rejects unsupported and renamed binary documents', async () => {
  for (const name of ['voyage.pdf', 'voyage.docx', 'voyage.csv', 'voyage.json', 'voyage', 'voyage.txt.exe']) {
    await rejectsWith(file(name, 'Jour 1 : musée'), 'format');
  }
  for (const source of ['%PDF-1.7\ntext', 'PK\u0003\u0004document', 'Jour 1\u0000musée', 'Jour 1\u001bmusée']) {
    await rejectsWith(file('voyage.txt', source), 'binary');
  }
});

test('planning file rejects invalid UTF-8 and UTF-16 instead of replacing undecodable bytes', async () => {
  await rejectsWith(file('voyage.txt', new Uint8Array([0xc3, 0x28])), 'encoding');
  await rejectsWith(file('voyage.txt', new Uint8Array([0xff, 0xfe, 0x41, 0x00])), 'encoding');
});

test('planning file enforces byte and character limits without truncation or premature reads', async () => {
  let reads = 0;
  await rejectsWith({ name: 'voyage.md', size: MAX_PLANNING_FILE_BYTES + 1, arrayBuffer: async () => { reads++; return new ArrayBuffer(0); } }, 'size');
  assert.equal(reads, 0);
  await rejectsWith(file('voyage.md', 'é'.repeat(50_001)), 'length');
  const source = 'é'.repeat(50_000);
  assert.equal(await readPlanningFile(file('voyage.md', source)), source);
  await rejectsWith({ name: 'voyage.txt', size: 1, arrayBuffer: async () => new ArrayBuffer(MAX_PLANNING_FILE_BYTES + 1) }, 'size');
});

test('planning file reports empty content and read failures explicitly', async () => {
  await rejectsWith(file('voyage.md', '\uFEFF\r\n\t  '), 'empty');
  await rejectsWith({ name: 'voyage.txt', size: 10, arrayBuffer: async () => { throw new Error('Unreadable'); } }, 'read');
});
