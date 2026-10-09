import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

if (!process.argv[2]) { console.error('NON EXÉCUTÉ : fournir le dossier PGlite/dist hors dépôt.'); process.exit(2); }
const base = resolve(process.argv[2]);
const { PGlite } = await import(pathToFileURL(resolve(base, 'index.js')));
const { pgcrypto } = await import(pathToFileURL(resolve(base, 'contrib/pgcrypto.js')));
const db = new PGlite({ extensions: { pgcrypto } });
try {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;
    insert into auth.users(id,email) values('10000000-0000-4000-8000-000000000001','owner@example.invalid'),('10000000-0000-4000-8000-000000000002','friend@example.invalid');`);
  for (const name of (await readdir('supabase/migrations')).filter(name=>name.endsWith('.sql')).sort()) await db.exec(await readFile('supabase/migrations/'+name,'utf8'));
  await db.exec(`begin;
    select set_config('detours.test_a','10000000-0000-4000-8000-000000000001',true),set_config('detours.test_b','10000000-0000-4000-8000-000000000002',true);
    ${await readFile('scripts/collaboration-check.sql', 'utf8')}
    ${await readFile('scripts/full-sharing-check.sql', 'utf8')}
    rollback;`);
  const result = await db.query('select count(*)::int fixtures from public.detours_trips');
  if (result.rows[0].fixtures !== 0) throw new Error('Fixtures were not rolled back');
  console.log('27 contrôles historiques et le scénario de carnet commun, notes, documents, masquage, concurrence, emails et révocation réussis ; écritures annulées.');
} catch (error) {
  console.error('ÉCHEC SQL :', error.message, error.detail || '', error.where || ''); process.exitCode = 1;
} finally { await db.close(); }
