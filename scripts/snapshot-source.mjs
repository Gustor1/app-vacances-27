import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';

// No checkout, index, branch or working file is changed. Ignored credentials stay excluded.
const root = process.cwd();
const destination = path.resolve(process.argv[2] || '');
if (!process.argv[2] || destination === root || destination.startsWith(root + path.sep)) throw new Error('Choose a destination outside the working directory.');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 10_000_000 });
const files = [...new Set(git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean))].sort();
const rows = [];
const blocked = [];
for (const file of files) {
  const bytes = await readFile(path.join(root, file));
  const text = bytes.toString('utf8');
  if (/(?:-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bsb_secret_[A-Za-z0-9_-]{12,}|\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}\b|\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,})/.test(text)) blocked.push(file);
  rows.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
if (blocked.length) throw new Error('Potential credentials require inspection (values hidden): ' + blocked.join(', '));
await mkdir(destination, { recursive: false });
for (const { file } of rows) {
  const target = path.join(destination, 'source', file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, file), target);
}
git('bundle', 'create', path.join(destination, 'history.bundle'), '--all');
const fingerprint = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
const manifest = { date: new Date().toISOString(), baseRevision: git('rev-parse', 'HEAD').trim(), fingerprint, files: rows, status: git('status', '--short'), exclusions: ['ignored files, including .env.local, .vercel, node_modules, dist, browser data'], secretScan: 'common credential signatures; not a complete security audit' };
await writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ destination, fingerprint, files: rows.length, baseRevision: manifest.baseRevision }));
