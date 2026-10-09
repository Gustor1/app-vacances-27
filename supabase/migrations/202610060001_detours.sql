-- Apply to a new Supabase project. No legacy browser data is touched.
begin;
create schema if not exists detours_private;
revoke all on schema detours_private from public, anon, authenticated;
create extension if not exists pgcrypto with schema extensions;

create table public.detours_trips (
  id text primary key check (length(id) between 1 and 200),
  owner_id uuid not null references auth.users(id),
  content jsonb not null check (octet_length(content::text) <= 1000000),
  revision bigint not null default 1 check (revision > 0),
  deleted boolean not null default false,
  updated_at timestamptz not null default now()
);
create index detours_trips_owner on public.detours_trips(owner_id);
create table public.detours_members (
  trip_id text not null references public.detours_trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('reader','editor')),
  primary key (trip_id, user_id)
);
create index detours_members_user on public.detours_members(user_id, trip_id);
create table public.detours_personal (
  trip_id text not null references public.detours_trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content jsonb not null check (octet_length(content::text) <= 1000000),
  revision bigint not null default 1,
  primary key (trip_id,user_id)
);
create table public.detours_world (
  user_id uuid primary key references auth.users(id) on delete cascade,
  content jsonb not null check (octet_length(content::text) <= 1000000),
  revision bigint not null default 1
);
create table public.detours_versions (
  trip_id text not null references public.detours_trips(id) on delete cascade,
  revision bigint not null,
  content jsonb not null,
  author_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  action text not null default 'edit',
  primary key (trip_id, revision)
);
create table detours_private.operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check(length(operation) <= 200),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key(user_id,operation)
);
create table detours_private.invitations (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null references public.detours_trips(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  accepted_by uuid references auth.users(id),
  cancelled boolean not null default false,
  created_at timestamptz not null default now()
);
create table detours_private.settings (id boolean primary key default true check(id), editors_enabled boolean not null default false);
insert into detours_private.settings(id) values(true);

create function public.detours_role(p_trip text) returns text
language sql stable security definer set search_path = '' as $$
  select case when t.owner_id = (select auth.uid()) then 'owner' else m.role end
  from public.detours_trips t left join public.detours_members m on m.trip_id=t.id and m.user_id=(select auth.uid())
  where t.id=p_trip;
$$;
alter table public.detours_trips enable row level security;
alter table public.detours_members enable row level security;
alter table public.detours_personal enable row level security;
alter table public.detours_world enable row level security;
alter table public.detours_versions enable row level security;
create policy trips_read on public.detours_trips for select to authenticated using(public.detours_role(id) is not null);
create policy members_read on public.detours_members for select to authenticated using(public.detours_role(trip_id) is not null);
create policy personal_read on public.detours_personal for select to authenticated using(user_id=(select auth.uid()) and public.detours_role(trip_id) is not null);
create policy world_read on public.detours_world for select to authenticated using(user_id=(select auth.uid()));
create policy versions_read on public.detours_versions for select to authenticated using(public.detours_role(trip_id) is not null);
revoke all on public.detours_trips, public.detours_members, public.detours_personal, public.detours_world, public.detours_versions from anon, authenticated;
grant select on public.detours_trips, public.detours_members, public.detours_personal, public.detours_world, public.detours_versions to authenticated;

-- Reject accidental private fields and future fields unknown to the shared schema.
create function detours_private.assert_keys(p_value jsonb, p_keys text[]) returns void
language plpgsql set search_path = '' as $$
begin
  if jsonb_typeof(p_value) <> 'object' or exists(select 1 from jsonb_object_keys(p_value) k where not k=any(p_keys)) then raise exception 'Invalid shared fields'; end if;
end $$;
create function detours_private.assert_shared(p jsonb, p_id text) returns void
language plpgsql set search_path = '' as $$
declare c jsonb; d jsonb; s jsonb;
begin
  perform detours_private.assert_keys(p,array['version','journey','cities','departureDate','notes','favorites','done','bookings','stays','transfers','bonusCatalog','customBonus']);
  if p->>'version' is distinct from '1' or p#>>'{journey,id}' is distinct from p_id or coalesce(length(p#>>'{journey,title}'),0) not between 1 and 140 or p->'notes' is distinct from '{}'::jsonb or p->'favorites' is distinct from '[]'::jsonb or p->'done' is distinct from '[]'::jsonb or p->'bookings' is distinct from '[]'::jsonb or jsonb_typeof(p->'cities') is distinct from 'array' or jsonb_array_length(p->'cities')>100 then raise exception 'Invalid shared trip'; end if;
  perform detours_private.assert_keys(p->'journey',array['id','title','destinations','description','cover','currency','timezone','source','followsCatalog','status','countries','endDate','highlights']);
  for c in select value from jsonb_array_elements(p->'cities') loop
    perform detours_private.assert_keys(c,array['id','name','chineseName','subtitle','color','coordinates','image','nights','mapProvider','timezone','notes','days']);
    if c->'notes' is distinct from '[]'::jsonb or jsonb_array_length(c->'days')>365 then raise exception 'Private city notes or too many days'; end if;
    for d in select value from jsonb_array_elements(c->'days') loop
      perform detours_private.assert_keys(d,array['id','title','date','steps']);
      if jsonb_array_length(d->'steps')>1000 then raise exception 'Too many steps'; end if;
      for s in select value from jsonb_array_elements(d->'steps') loop
        perform detours_private.assert_keys(s,array['id','title','chineseName','description','address','category','period','optional','booking','coordinates','amapUrl']);
      end loop;
    end loop;
  end loop;
  for s in select value from jsonb_array_elements(coalesce(p->'stays','[]')) loop
    perform detours_private.assert_keys(s,array['cityId','name','chineseName','address','checkIn','checkOut','notes']);
    if s->>'notes' is distinct from '' then raise exception 'Private stay notes'; end if;
  end loop;
  for s in select value from jsonb_array_elements(coalesce(p->'transfers','[]')) loop
    perform detours_private.assert_keys(s,array['id','fromCityId','toCityId','label','mode','departure','arrival','departureTimezone','arrivalTimezone','fromStation','toStation','notes','reference','booked']);
    if s->>'notes' is distinct from '' or s->>'reference' is distinct from '' or s->'booked' is distinct from 'false'::jsonb then raise exception 'Private booking details'; end if;
  end loop;
  for s in select value from jsonb_array_elements(coalesce(p->'bonusCatalog','[]') || coalesce(p->'customBonus','[]')) loop
    perform detours_private.assert_keys(s,array['id','cityId','title','chineseName','category','description','address','budget','amapUrl']);
  end loop;
end $$;

create function detours_private.trip_record(p_trip text, p_user uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('content',jsonb_build_object('shared',t.content,'private',coalesce(p.content,'{"notes":{},"favorites":[],"done":[],"bookings":[],"cityNotes":{},"stayNotes":{},"transferPrivate":{},"bonusPrivate":{}}'::jsonb)), 'revision',t.revision,'private_revision',coalesce(p.revision,0),'deleted',t.deleted,'role',case when t.owner_id=p_user then 'owner' else m.role end)
  from public.detours_trips t left join public.detours_personal p on p.trip_id=t.id and p.user_id=p_user left join public.detours_members m on m.trip_id=t.id and m.user_id=p_user where t.id=p_trip;
$$;
create function public.detours_get_trip(p_trip text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.detours_role(p_trip) is null then raise exception 'Access denied' using errcode='42501'; end if;
  return detours_private.trip_record(p_trip,auth.uid());
end $$;
create function public.detours_list_trips() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'journey',t.content->'journey','departureDate',t.content->'departureDate','revision',t.revision,'privateRevision',coalesce(p.revision,0),'deleted',t.deleted,'role',case when t.owner_id=auth.uid() then 'owner' else m.role end,'cityCount',jsonb_array_length(t.content->'cities')) order by t.updated_at desc),'[]')
  from public.detours_trips t left join public.detours_personal p on p.trip_id=t.id and p.user_id=auth.uid() left join public.detours_members m on m.trip_id=t.id and m.user_id=auth.uid() where auth.uid() is not null and (t.owner_id=auth.uid() or m.user_id=auth.uid());
$$;

create function public.detours_save_trip(p_trip text, p_expected bigint, p_private_expected bigint, p_content jsonb, p_operation text, p_deleted boolean default false, p_action text default 'edit') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); t public.detours_trips; role text; result jsonb; old_result jsonb; private_rev bigint;
begin
  if u is null then raise exception 'Sign in required' using errcode='42501'; end if;
  -- Serialize idempotency and creation too (a nonexistent row cannot be locked).
  perform pg_advisory_xact_lock(hashtextextended(p_trip,0));
  select o.result into old_result from detours_private.operations o where o.user_id=u and o.operation=p_operation;
  if old_result is not null then
    -- Recheck rights, so a stored success cannot bypass a later revocation.
    if public.detours_role(p_trip) is null then return jsonb_build_object('status','revoked'); end if;
    if old_result->>'trip' is distinct from p_trip then raise exception 'Operation already used'; end if;
    result:=detours_private.trip_record(p_trip,u);
    return jsonb_build_object('status',case when result->>'revision'=old_result->>'revision' and result->>'private_revision'=old_result->>'private_revision' then 'saved' else 'conflict' end,'record',result);
  end if;
  select * into t from public.detours_trips where id=p_trip for update;
  if t.id is null then
    if p_expected<>0 or p_deleted then raise exception 'Trip unavailable'; end if;
    if position('~' in p_trip)>0 and split_part(p_trip,'~',1)<>u::text then raise exception 'Reserved attachment identity' using errcode='42501'; end if;
    if (select count(*) from public.detours_trips where owner_id=u and not deleted)>=100 then raise exception 'Trip limit reached. Export unused trips.'; end if;
    perform detours_private.assert_shared(p_content->'shared',p_trip);
    insert into public.detours_trips(id,owner_id,content) values(p_trip,u,p_content->'shared') returning * into t;
    role:='owner';
  else
    role:=public.detours_role(p_trip);
    if role is null then return jsonb_build_object('status','revoked'); end if;
    if t.revision<>p_expected then return jsonb_build_object('status','conflict','record',detours_private.trip_record(p_trip,u)); end if;
    if t.deleted then return jsonb_build_object('status','conflict','record',detours_private.trip_record(p_trip,u)); end if;
    select coalesce(revision,0) into private_rev from public.detours_personal where trip_id=p_trip and user_id=u for update;
    if coalesce(private_rev,0)<>p_private_expected then return jsonb_build_object('status','conflict','record',detours_private.trip_record(p_trip,u)); end if;
    if p_deleted and role<>'owner' then raise exception 'Only the owner can delete' using errcode='42501'; end if;
    if role='reader' or (role='editor' and not (select editors_enabled from detours_private.settings where id)) then raise exception 'Read only access' using errcode='42501'; end if;
    perform detours_private.assert_shared(p_content->'shared',p_trip);
    -- Personal writes do not fabricate a shared revision or journal event.
    if p_deleted or p_action='restore' or t.content is distinct from p_content->'shared' then
      update public.detours_trips set content=p_content->'shared',deleted=p_deleted,revision=revision+1,updated_at=now() where id=p_trip returning * into t;
    end if;
  end if;
  insert into public.detours_personal(trip_id,user_id,content) values(p_trip,u,p_content->'private') on conflict(trip_id,user_id) do update set content=excluded.content,revision=public.detours_personal.revision+1;
  insert into public.detours_versions(trip_id,revision,content,author_id,action) values(p_trip,t.revision,t.content,u,case when p_deleted then 'delete' when p_action='restore' then 'restore' else 'edit' end) on conflict do nothing;
  delete from public.detours_versions where trip_id=p_trip and revision < t.revision-29;
  if p_deleted then
    update detours_private.invitations set cancelled=true where trip_id=p_trip;
    delete from public.detours_members where trip_id=p_trip;
  end if;
  if (select coalesce(sum(octet_length(content::text)),0) from public.detours_personal where user_id=u) > 20000000 then raise exception 'Personal storage quota reached. Export documents and contact the administrator.'; end if;
  -- Bound account storage, including retained shared history. No paid plan is enabled.
  if not p_deleted and (select coalesce(sum(octet_length(v.content::text)),0) from public.detours_versions v join public.detours_trips tr on tr.id=v.trip_id where tr.owner_id=t.owner_id) + (select coalesce(sum(octet_length(content::text)),0) from public.detours_trips where owner_id=t.owner_id) > 20000000 then raise exception 'Storage quota reached. Export unused trips and contact the administrator.'; end if;
  result:=jsonb_build_object('status','saved','record',detours_private.trip_record(p_trip,u));
  insert into detours_private.operations(user_id,operation,result) values(u,p_operation,jsonb_build_object('trip',p_trip,'revision',t.revision,'private_revision',(select revision from public.detours_personal where trip_id=p_trip and user_id=u)));
  delete from detours_private.operations where user_id=u and created_at<now()-interval '30 days';
  delete from detours_private.operations where user_id=u and operation not in (select operation from detours_private.operations where user_id=u order by created_at desc limit 2000);
  return result;
end $$;
create function public.detours_save_world(p_expected bigint,p_content jsonb,p_operation text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); w public.detours_world; result jsonb;
begin
  if u is null then raise exception 'Sign in required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text||':world',0));
  select o.result into result from detours_private.operations o where o.user_id=u and o.operation=p_operation;
  if result is not null then
    if result->>'kind' is distinct from 'world' then raise exception 'Operation already used'; end if;
    select * into w from public.detours_world where user_id=u;
    return jsonb_build_object('status',case when w.revision=(result->>'revision')::bigint then 'saved' else 'conflict' end,'record',jsonb_build_object('content',w.content,'revision',w.revision,'private_revision',0,'role','owner','deleted',false));
  end if;
  select * into w from public.detours_world where user_id=u for update;
  if coalesce(w.revision,0)<>p_expected then return jsonb_build_object('status','conflict','record',jsonb_build_object('content',w.content,'revision',w.revision,'private_revision',0,'role','owner','deleted',false)); end if;
  if p_content->>'version' is distinct from '1' or jsonb_typeof(p_content->'visits') is distinct from 'array' or jsonb_array_length(p_content->'visits')>10000 then raise exception 'Invalid visits'; end if;
  insert into public.detours_world(user_id,content) values(u,p_content) on conflict(user_id) do update set content=excluded.content,revision=public.detours_world.revision+1 returning * into w;
  result:=jsonb_build_object('status','saved','record',jsonb_build_object('content',w.content,'revision',w.revision,'private_revision',0,'role','owner','deleted',false));
  insert into detours_private.operations(user_id,operation,result) values(u,p_operation,jsonb_build_object('kind','world','revision',w.revision));
  delete from detours_private.operations where user_id=u and created_at<now()-interval '30 days';
  delete from detours_private.operations where user_id=u and operation not in (select operation from detours_private.operations where user_id=u order by created_at desc limit 2000);
  return result;
end $$;

create function public.detours_invite(p_trip text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare token text; invitation detours_private.invitations;
begin
  if public.detours_role(p_trip) is distinct from 'owner' or (select deleted from public.detours_trips where id=p_trip) then raise exception 'Only the owner can invite' using errcode='42501'; end if;
  if (select count(*) from detours_private.invitations where trip_id=p_trip and not cancelled and accepted_by is null and expires_at>now())>=20 then raise exception 'Too many active invitations'; end if;
  token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into detours_private.invitations(trip_id,token_hash,expires_at) values(p_trip,extensions.digest(token,'sha256'),now()+interval '72 hours') returning * into invitation;
  return jsonb_build_object('id',invitation.id,'token',token,'expires_at',invitation.expires_at);
end $$;
create function public.detours_accept_invite(p_token text) returns text
language plpgsql security definer set search_path = '' as $$
declare i detours_private.invitations;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if length(p_token)<>64 then raise exception 'Invitation unavailable'; end if;
  select * into i from detours_private.invitations where token_hash=extensions.digest(p_token,'sha256') for update;
  if i.id is null or i.cancelled or i.expires_at<=now() or (select deleted from public.detours_trips where id=i.trip_id) then raise exception 'Invitation unavailable'; end if;
  if i.accepted_by is not null then if i.accepted_by=auth.uid() and public.detours_role(i.trip_id) is not null then return i.trip_id; end if; raise exception 'Invitation already used'; end if;
  if public.detours_role(i.trip_id) is distinct from 'owner' then insert into public.detours_members(trip_id,user_id,role) values(i.trip_id,auth.uid(),'reader') on conflict do nothing; end if;
  update detours_private.invitations set accepted_by=auth.uid() where id=i.id;
  return i.trip_id;
end $$;
create function public.detours_manage_invite(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select public.detours_role(trip_id) from detours_private.invitations where id=p_id) is distinct from 'owner' then raise exception 'Access denied' using errcode='42501'; end if;
  update detours_private.invitations set cancelled=true where id=p_id;
end $$;
create function public.detours_list_invites(p_trip text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if public.detours_role(p_trip) is distinct from 'owner' then raise exception 'Access denied' using errcode='42501'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id',id,'expires_at',expires_at,'accepted',accepted_by is not null,'cancelled',cancelled) order by created_at desc),'[]') from detours_private.invitations where trip_id=p_trip);
end $$;
create function public.detours_set_member(p_trip text,p_user uuid,p_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.detours_role(p_trip) is distinct from 'owner' then raise exception 'Access denied' using errcode='42501'; end if;
  if p_role='remove' then delete from public.detours_members where trip_id=p_trip and user_id=p_user;
  elsif p_role in ('reader','editor') then
    if p_role='editor' and not (select editors_enabled from detours_private.settings where id) then raise exception 'Editors not enabled'; end if;
    update public.detours_members set role=p_role where trip_id=p_trip and user_id=p_user;
  else raise exception 'Invalid role'; end if;
end $$;
-- No table writes are granted to authenticated users; all mutations enforce rights.
revoke all on all functions in schema detours_private from public, anon, authenticated;
revoke execute on function public.detours_role(text),public.detours_get_trip(text),public.detours_list_trips(),public.detours_save_trip(text,bigint,bigint,jsonb,text,boolean,text),public.detours_save_world(bigint,jsonb,text),public.detours_invite(text),public.detours_accept_invite(text),public.detours_manage_invite(uuid),public.detours_list_invites(text),public.detours_set_member(text,uuid,text) from public, anon;
grant execute on function public.detours_role(text),public.detours_get_trip(text),public.detours_list_trips(),public.detours_save_trip(text,bigint,bigint,jsonb,text,boolean,text),public.detours_save_world(bigint,jsonb,text),public.detours_invite(text),public.detours_accept_invite(text),public.detours_manage_invite(uuid),public.detours_list_invites(text),public.detours_set_member(text,uuid,text) to authenticated;
commit;
