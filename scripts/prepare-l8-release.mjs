import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { checkLocalBuild } from './build-identity.mjs';

// Prepare only. No migration, network request, deployment, commit or alias change.
const root = process.cwd(), destination = path.resolve(process.argv[2] || '');
if (!process.argv[2] || destination === root || destination.startsWith(root + path.sep)) throw new Error('Choose a new directory outside the checkout.');
const validation = JSON.parse(await readFile(process.argv[3] || '', 'utf8'));
if (validation.exitCode !== 0 || !validation.sourceUnchanged || validation.notRun.length) throw new Error('A complete successful local validation report is required.');
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).split('\0').filter(f => f && !f.startsWith('docs/') && !f.endsWith('.md')).sort();
const { createHash } = await import('node:crypto');
async function fingerprint() {
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(await readFile(file)).update('\0');
  return hash.digest('hex');
}
if (await fingerprint() !== validation.sourceFingerprint) throw new Error('Source differs from the validated report. Rerun the local gate.');
await mkdir(destination, { recursive: false });
const env = { ...process.env };
// Vite loads the intended local configuration; do not carry gate fixtures forward.
for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_ANON_KEY', 'VITE_ENABLE_COLLABORATION']) delete env[key];
execFileSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', path.join(destination, 'dist')], { cwd: root, env, stdio: 'inherit' });
execFileSync(process.execPath, [path.join(root, 'scripts/build-sw.mjs')], { cwd: destination, env, stdio: 'inherit' });
const build = await checkLocalBuild(path.join(destination, 'dist'));
if (await fingerprint() !== validation.sourceFingerprint) throw new Error('Source changed while preparing the release. Candidate must not be published.');
build.baseRevision = validation.baseRevision;
build.sourceFingerprint = validation.sourceFingerprint;
await writeFile(path.join(destination, 'dist/build-info.json'), JSON.stringify(build, null, 2));
const release = { generatedAt: new Date().toISOString(), baseRevision: validation.baseRevision, sourceFingerprint: validation.sourceFingerprint, validationReport: path.resolve(process.argv[3]), validationBuildId: validation.buildId, candidateBuildId: build.id, entry: build.entry, configuration: 'Vite configuration from this checkout; environment values not copied into this report', published: false, remoteMigrationApplied: false, remaining: ['Check remote RPC drift and apply 202610090001_day_preparation.sql before publishing the L6 frontend', 'Publish only after user authorization', 'Verify all actually served assets against the candidate manifest and a critical authenticated/offline path'], rollback: 'Keep the previous deployment and database helper migration. Code rollback does not revert data; export a complete notebook backup before any explicit data restoration.' };
await writeFile(path.join(destination, 'release.json'), JSON.stringify(release, null, 2));
console.log(JSON.stringify({ destination, candidateBuildId: build.id, published: false }));
