import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, cp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { runChecks } from './verify-runner.mjs';

const root = process.cwd();
const output = await mkdtemp(path.join(tmpdir(), 'detours-verify-'));
const env = { ...process.env, CI: '1', DETOURS_LOCAL_VERIFY: '1', VITE_SUPABASE_URL: 'https://detourstest.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local_fixture', VITE_ENABLE_COLLABORATION: 'true' };
delete env.PRODUCTION_TEST_URL; delete env.BETA_TEST_URL; delete env.DETOURS_ALLOW_NETWORK;
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', cwd: root });
const fingerprint = async () => {
  const files = git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(file => file && !file.startsWith('docs/') && !file.endsWith('.md')).sort();
  const hash = createHash('sha256');
  for (const file of files) hash.update(file).update('\0').update(await readFile(file)).update('\0');
  return hash.digest('hex');
};
const sourceFingerprint = await fingerprint();
const baseRevision = git('rev-parse', 'HEAD').trim();
const local = (name, script, args = [], cwd = root) => ({ name, script: path.join(root, script), args, cwd });
const steps = [
  local('types produit', 'node_modules/typescript/bin/tsc', ['-p', 'tsconfig.json']),
  local('types tests/configurations', 'node_modules/typescript/bin/tsc', ['-p', 'tsconfig.tests.json']),
  local('lint', 'node_modules/eslint/bin/eslint.js', ['.', '--max-warnings', '0']),
  { name: 'tests unitaires', args: ['--test', 'tests/*.test.mjs'], cwd: root },
  local('build Vite', 'node_modules/vite/bin/vite.js', ['build']),
  local('service worker et manifeste', 'scripts/build-sw.mjs'),
  local('intégrité du build', 'scripts/check-build.mjs'),
  local('compatibilité SQL L6', 'scripts/test-l6-sql-local.mjs', [process.env.DETOURS_PGLITE_PATH || '']),
  local('notifications SQL : isolation et reprise', 'scripts/test-notifications-sql-local.mjs', [process.env.DETOURS_PGLITE_PATH || '']),
  local('notifications serveur : types Deno', 'scripts/check-notifications-server.mjs'),
  local('récaps et calendrier dans le navigateur', 'node_modules/@playwright/test/cli.js', ['test', 'tests/e2e/notifications.spec.ts', 'tests/e2e/notifications-calendar.spec.ts']),
  local('tests navigateur retenus', 'node_modules/@playwright/test/cli.js', ['test', 'tests/e2e/l2-accessibility.spec.ts', 'tests/e2e/full-backup.spec.ts', 'tests/e2e/multi-trip.spec.ts', 'tests/e2e/world-languages.spec.ts', 'tests/e2e/fluid-navigation.spec.ts', 'tests/e2e/live-converter.spec.ts']),
  local('états L4/L5/L6 et préférences dans le navigateur', 'node_modules/@playwright/test/cli.js', ['test', 'tests/e2e/l4-status.spec.ts', 'tests/e2e/l5-now.spec.ts', 'tests/e2e/l5-maps.spec.ts', 'tests/e2e/map-preferences.spec.ts', 'tests/e2e/l6-preparation.spec.ts']),
  ...['smoke-production', 'smoke-backup', 'smoke-ui', 'smoke-common-sharing', 'smoke-l4-offline', 'smoke-l4-persistence', 'smoke-l5-now', 'smoke-l6-preparation', 'smoke-l8-release'].map(name => local(name, `scripts/${name}.mjs`, [], output)),
];
console.log(`Vérification locale : profils jetables, URL Supabase factice, sorties ${output}`);
let prepared = false;
const report = await runChecks(steps, async step => {
  if (step.cwd === output && !prepared) {
    await mkdir(path.join(output, 'dist')); await cp(path.join(root, 'dist'), path.join(output, 'dist'), { recursive: true });
    await writeFile(path.join(output, '.env.local'), 'VITE_SUPABASE_URL=https://detourstest.supabase.co\n');
    prepared = true;
  }
  console.log(`\nContrôle : ${step.name}`);
  return await new Promise(resolve => {
    const child = spawn(process.execPath, [...(step.script ? [step.script] : []), ...step.args], { cwd: step.cwd, env, stdio: 'inherit' });
    child.once('error', () => resolve(1)); child.once('exit', code => resolve(code ?? 1));
  });
});
const sourceUnchanged = sourceFingerprint === await fingerprint();
if (!sourceUnchanged) report.exitCode = 1;
let buildId = null;
try { buildId = JSON.parse(await readFile(path.join(root, 'dist/build-info.json'), 'utf8')).id; } catch { /* A build may not have run after a preceding failure. */ }
const result = { date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()), generatedAt: new Date().toISOString(), timezone: 'Asia/Shanghai', baseRevision, sourceFingerprint, fingerprintScope: 'Git-visible code, configs, tests and assets; docs/ and Markdown excluded; ignored files excluded', sourceUnchanged, buildId, environment: { platform: process.platform, node: process.version, browser: 'Playwright Chromium / installed Chrome', backend: 'simulated, isolated profiles' }, ...report, limits: ['No remote service, Google OAuth, physical device or full browser suite verification', 'Browser external DNS blocked; loopback and intercepted mocks available; network test commands not invoked'], output };
await writeFile(path.join(output, 'validation.json'), JSON.stringify(result, null, 2));
console.log(`Rapport : ${path.join(output, 'validation.json')} — ${report.exitCode === 0 ? 'RÉUSSI' : 'ÉCHEC'}`);
process.exitCode = report.exitCode;
