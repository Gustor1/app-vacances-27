import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { blankTrip } from '../src/journeys.ts';
import { splitContent } from '../src/cloud/projection.ts';

if (!process.argv[2]) throw new Error('Fournir le dossier PGlite/dist hors dépôt.');
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], 'index.js')));
const { pgcrypto } = await import(pathToFileURL(resolve(process.argv[2], 'contrib/pgcrypto.js')));
const db = new PGlite({ extensions: { pgcrypto } });
const [A,B,C]=[1,2,3].map(n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0'));
let checks=0;
try {
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema extensions;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated;`);
  for(const [id,name] of [[A,'creator'],[B,'editor'],[C,'reader']]) await db.query('insert into auth.users(id,email) values($1,$2)',[id,name+'@example.invalid']);
  for(const name of (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort()) await db.exec(await readFile('supabase/migrations/'+name,'utf8'));
  await db.exec('update detours_private.settings set editors_enabled=true where id');
  const rpc=async(name,args=[])=>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) value`,args)).rows[0].value;
  const user=async(id,fn)=>{await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);try{return await fn();}finally{await db.exec('reset role');}};
  const check=(actual,expected)=>{assert.deepEqual(actual,expected);checks++;};
  const denied=async(fn)=>{await assert.rejects(fn);checks++;};
  const trip=blankTrip({id:'participation',title:'Ensemble',currency:'EUR'});
  trip.notes.general='Avant';trip.expenses=[{id:'expense',cityId:'',label:'Repas',amount:10,currency:'USD',category:'food',conversions:{EUR:{rate:.9,date:'2026-10-07',source:'manual'}}}];
  trip.rateQuotes={USD:{rate:.9,date:'2026-10-07',source:'manual'}};
  const save=record=>rpc('detours_save_trip',[trip.journey.id,record?.revision||0,record?.private_revision||0,record?.content||splitContent(trip),crypto.randomUUID()]);
  await user(A,async()=>{check((await save()).status,'saved');await rpc('detours_enable_full_share',['participation']);await denied(()=>rpc('detours_leave_trip',['participation']));});
  const invites=[];
  for(const id of [B,C]){const invite=await user(A,()=>rpc('detours_invite',['participation']));invites.push(invite);await user(id,()=>rpc('detours_accept_invite',[invite.token]));}
  await user(A,async()=>{await rpc('detours_set_member',['participation',B,'editor']);const roster=await rpc('detours_roster',['participation']);check(roster.map(p=>p.role),['owner','editor','reader']);await denied(()=>rpc('detours_set_member',['participation',A,'reader']));});
  await user(C,async()=>{await denied(()=>saveRecordForReader());await denied(()=>rpc('detours_set_member',['participation',B,'reader']));await denied(()=>rpc('detours_invite',['participation']));});
  async function saveRecordForReader(){return save(await rpc('detours_get_trip',['participation']));}
  const edited=await user(B,async()=>{const r=await rpc('detours_get_trip',['participation']);r.content.private.notes.general='Contribution conservée';check((await save(r)).status,'saved');return (await rpc('detours_get_trip',['participation']));});
  await user(A,()=>rpc('detours_set_member',['participation',B,'reader']));
  await user(B,()=>denied(()=>save({...edited,content:{...edited.content,private:{...edited.content.private,notes:{general:'Ancien formulaire'}}}})));
  await user(A,async()=>{check((await rpc('detours_roster',['participation'])).map(p=>p.role),['owner','reader','reader']);await rpc('detours_set_member',['participation',B,'editor']);});
  const before=await user(A,()=>rpc('detours_get_trip',['participation']));
  await user(B,async()=>{await rpc('detours_leave_trip',['participation']);check(await rpc('detours_list_trips'),[]);await denied(()=>rpc('detours_get_trip',['participation']));await denied(()=>rpc('detours_roster',['participation']));await denied(()=>rpc('detours_accept_invite',[invites[0].token]));check((await save(edited)).status,'revoked');await rpc('detours_leave_trip',['participation']);});
  await user(A,async()=>{check(await rpc('detours_get_trip',['participation']),before);check((await rpc('detours_roster',['participation'])).map(p=>p.role),['owner','reader']);});
  await user(C,async()=>{check((await rpc('detours_get_trip',['participation'])).content.private.notes.general,'Contribution conservée');await rpc('detours_leave_trip',['participation']);check(await rpc('detours_list_trips'),[]);await denied(()=>rpc('detours_accept_invite',[invites[1].token]));});
  const newInvite=await user(A,()=>rpc('detours_invite',['participation']));
  await user(B,async()=>{check(await rpc('detours_accept_invite',[newInvite.token]),'participation');check((await rpc('detours_get_trip',['participation'])).role,'reader');await denied(()=>rpc('detours_accept_invite',[invites[0].token]));});
  await user(A,async()=>{
    let r=await rpc('detours_get_trip',['participation']);check(r.content.private.expenses[0].conversions.EUR.rate,.9);
    for(const bad of [{rate:0,date:'2026-10-07',source:'manual'},{rate:1,date:'2026-02-30',source:'manual'},{rate:1,date:'',source:'manual'},{rate:1,date:'2026-10-07',source:'unknown'}]) {
      const content=structuredClone(r.content);content.private.expenses[0].conversions.EUR=bad;await denied(()=>save({...r,content}));
    }
    await rpc('detours_set_share_fields',['participation',B,['notes']]);
  });
  await user(B,async()=>{const r=await rpc('detours_get_trip',['participation']);check(r.content.private.expenses,undefined);check(r.content.private.rateQuotes,undefined);});
  await db.exec('set role anon');await denied(()=>rpc('detours_leave_trip',['participation']));await db.exec('reset role');
  console.log(checks+' contrôles SQL : créateur/éditeur/lecteur, rôles indépendants, ancien formulaire, départ, anciens liens, réinvitation, contributions et taux datés. Base isolée en mémoire.');
} finally { await db.close(); }
