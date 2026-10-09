import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { trip } from './l6-fixture.mjs';
import { splitContent } from '../src/cloud/projection.ts';
if(!process.argv[2])throw Error('Supply the isolated PGlite/dist directory.');
const base=resolve(process.argv[2]),{PGlite}=await import(pathToFileURL(resolve(base,'index.js'))),{pgcrypto}=await import(pathToFileURL(resolve(base,'contrib/pgcrypto.js')));
const db=new PGlite({extensions:{pgcrypto}}),A='10000000-0000-4000-8000-000000000001',B='10000000-0000-4000-8000-000000000002';
try {
  await db.exec("create role anon;create role authenticated;create schema auth;create schema extensions;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}');create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth to anon,authenticated;");
  await db.query('insert into auth.users(id,email) values($1,$2),($3,$4)',[A,'a@example.invalid',B,'b@example.invalid']);
  for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile('supabase/migrations/'+name,'utf8'));
  await db.exec(await readFile('supabase/migrations/202610090001_day_preparation.sql','utf8'));
  const content=splitContent(trip);
  const validate=async value=>db.query('select detours_private.assert_shared($1::jsonb,$2)',[value,trip.journey.id]);
  await validate(content.shared);const old=structuredClone(content.shared);old.cities[0].days.forEach(d=>delete d.preparation);await validate(old);
  for(const change of [p=>p.marginMinutes=-1,p=>p.timings['urban-a'].durationMinutes=1.5,p=>p.timings['urban-a'].checkedAt='2026-02-30',p=>p.alternatives[0].reason=null,p=>p.alternatives[0].stepIds=['missing'],p=>p.activeAlternativeId='missing',p=>p.secret='private']){const value=structuredClone(content.shared);change(value.cities[0].days[0].preparation);await assert.rejects(()=>validate(value));}
  await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[A]);
  const save=async(expected,personal,value)=> (await db.query('select public.detours_save_trip($1,$2,$3,$4::jsonb,$5) as value',[trip.journey.id,expected,personal,value,crypto.randomUUID()])).rows[0].value;
  const first=await save(0,0,content);assert.equal(first.status,'saved');
  const variant=structuredClone(content);variant.shared.cities[0].days[0].preparation.activeAlternativeId='urban-alternative';
  const changed=await save(first.record.revision,first.record.private_revision,variant);assert.equal(changed.status,'saved');assert.deepEqual(changed.record.content.private.bookings,content.private.bookings);assert.deepEqual(changed.record.content.private.expenses,content.private.expenses);
  const initial=await save(changed.record.revision,changed.record.private_revision,content);assert.equal(initial.status,'saved');assert.deepEqual(initial.record.content.shared.cities,content.shared.cities);
  const legacy=structuredClone(content);legacy.shared.cities[0].days.forEach(d=>delete d.preparation);legacy.shared.cities[0].subtitle='Édité depuis une ancienne version';
  const compatible=await save(initial.record.revision,initial.record.private_revision,legacy);assert.equal(compatible.status,'saved');assert.deepEqual(compatible.record.content.shared.cities[0].days[0].preparation,content.shared.cities[0].days[0].preparation);
  const removed=structuredClone(legacy);removed.shared.cities[0].days[0].steps=removed.shared.cities[0].days[0].steps.filter(s=>s.id!=='urban-a');
  const cleaned=await save(compatible.record.revision,compatible.record.private_revision,removed);assert.equal(cleaned.status,'saved');assert.equal(cleaned.record.content.shared.cities[0].days[0].preparation.anchorStepId,undefined);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[B]);assert.equal((await save(0,0,content)).status,'revoked');await assert.rejects(()=>db.query('select public.detours_get_trip($1)',[trip.journey.id]));
  await db.exec('reset role');const grants=await db.query("select has_function_privilege('anon','detours_private.assert_day_preparation(jsonb)','execute') as granted");assert.equal(grants.rows[0].granted,false);
  console.log('L6 PostgreSQL passed: additive migration repeatable, old/new archives, legacy edits preserve preparation and clean deleted references, invalid timings/references/private fields rejected, owner adoption/return, bookings/expenses intact, unrelated account refused. In-memory database only.');
}finally{await db.close();}
