import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const buildId = files => sha256(JSON.stringify(files));

export function validateIdentity(info, expectedId) {
  assert.equal(info.version, 1, 'Unknown build manifest version');
  assert.ok(Array.isArray(info.files) && info.files.length > 0, 'Empty build manifest');
  const paths = new Set();
  for (const file of info.files) {
    assert.match(file.path, /^\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/);
    assert.ok(!file.path.split('/').includes('..') && !paths.has(file.path), 'Invalid or duplicate asset path');
    paths.add(file.path);
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(file.bytes) && file.bytes >= 0, 'Invalid asset size');
  }
  assert.equal(info.id, buildId(info.files), 'Build manifest identity mismatch');
  assert.ok(paths.has(info.entry) && info.entry.endsWith('.js'), 'Missing entry module');
  if (expectedId) assert.equal(info.id, expectedId, 'Unexpected build identity');
  return info;
}

export async function checkLocalBuild(root = 'dist') {
  const info = validateIdentity(JSON.parse(await readFile(`${root}/build-info.json`, 'utf8')));
  for (const file of info.files) {
    const bytes = await readFile(root + file.path);
    assert.equal(bytes.length, file.bytes, `Asset size: ${file.path}`);
    assert.equal(sha256(bytes), file.sha256, `Asset hash: ${file.path}`);
  }
  const html = await readFile(`${root}/index.html`, 'utf8');
  assert.ok(html.includes(`src="${info.entry}"`), 'HTML does not serve the manifest entry');
  const worker = await readFile(`${root}/sw.js`, 'utf8');
  assert.ok(worker.includes(`a-l-est-${info.id.slice(0, 12)}`) && worker.includes('/build-info.json'), 'Worker identity/cache mismatch');
  return info;
}

export async function checkServedBuild(page, expectedId) {
  const response = await page.request.get(new URL('/build-info.json', page.url()).href);
  assert.equal(response.status(), 200, 'Build manifest unavailable');
  const info = validateIdentity(await response.json(), expectedId);
  const entry = await page.locator('script[type="module"][src]').getAttribute('src');
  assert.equal(new URL(entry, page.url()).pathname, info.entry, 'Served HTML entry mismatch');
  const asset = await page.request.get(new URL(info.entry, page.url()).href);
  assert.equal(asset.status(), 200);
  assert.equal(sha256(await asset.body()), info.files.find(file => file.path === info.entry).sha256, 'Served entry hash mismatch');
  return info;
}
