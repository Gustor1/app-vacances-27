-- Additive validation only. Apply before publishing the L6 frontend.
-- No row, table, invitation, role or private field is changed.
create or replace function detours_private.assert_day_preparation(d jsonb) returns void
language plpgsql set search_path = '' as $$
declare p jsonb:=d->'preparation'; item jsonb; timing jsonb; k text; key_name text; ids text[]; alternatives text[]:=array[]::text[]; count_ids integer;
begin
  if p is null then return; end if;
  perform detours_private.assert_keys(p,array['anchorStepId','startTime','endTime','marginMinutes','timings','alternatives','activeAlternativeId']);
  select coalesce(array_agg(value->>'id'),array[]::text[]) into ids from jsonb_array_elements(d->'steps');
  if p ? 'anchorStepId' and (jsonb_typeof(p->'anchorStepId')<>'string' or not (p->>'anchorStepId'=any(ids))) then raise exception 'Invalid day anchor'; end if;
  foreach key_name in array array['startTime','endTime'] loop
    if p ? key_name and (jsonb_typeof(p->key_name)<>'string' or (p->>key_name)!~'^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$') then raise exception 'Invalid day time'; end if;
  end loop;
  if p ? 'startTime' and p ? 'endTime' and p->>'endTime' <= p->>'startTime' then raise exception 'Invalid day window'; end if;
  if p ? 'marginMinutes' then
    if jsonb_typeof(p->'marginMinutes')<>'number' then raise exception 'Invalid day margin'; end if;
    if (p->>'marginMinutes')::numeric not between 0 and 1440 or trunc((p->>'marginMinutes')::numeric)<>(p->>'marginMinutes')::numeric then raise exception 'Invalid day margin'; end if;
  end if;
  if p ? 'timings' then
    if jsonb_typeof(p->'timings')<>'object' then raise exception 'Invalid day timings'; end if;
    for k,timing in select key,value from jsonb_each(p->'timings') loop
      if not (k=any(ids)) then raise exception 'Unknown timing step'; end if;
      perform detours_private.assert_keys(timing,array['durationMinutes','transferMinutes','fromStepId','startTime','source','checkedAt']);
      if timing ? 'fromStepId' and (jsonb_typeof(timing->'fromStepId')<>'string' or timing->>'fromStepId'=k or not (timing->>'fromStepId'=any(ids))) then raise exception 'Invalid transfer origin'; end if;
      foreach key_name in array array['durationMinutes','transferMinutes'] loop
        if timing ? key_name then
          if jsonb_typeof(timing->key_name)<>'number' then raise exception 'Invalid timing minutes'; end if;
          if (timing->>key_name)::numeric not between 0 and 1440 or trunc((timing->>key_name)::numeric)<>(timing->>key_name)::numeric then raise exception 'Invalid timing minutes'; end if;
        end if;
      end loop;
      if timing ? 'startTime' and (jsonb_typeof(timing->'startTime')<>'string' or (timing->>'startTime')!~'^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$') then raise exception 'Invalid step time'; end if;
      if timing ? 'source' and (jsonb_typeof(timing->'source')<>'string' or length(timing->>'source')>1000) then raise exception 'Invalid timing source'; end if;
      if timing ? 'checkedAt' then
        if jsonb_typeof(timing->'checkedAt')<>'string' or (timing->>'checkedAt')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char((timing->>'checkedAt')::date,'YYYY-MM-DD')<>timing->>'checkedAt' then raise exception 'Invalid timing check date'; end if;
      end if;
    end loop;
  end if;
  if p ? 'alternatives' then
    if jsonb_typeof(p->'alternatives')<>'array' or jsonb_array_length(p->'alternatives')>8 then raise exception 'Invalid alternatives'; end if;
    for item in select value from jsonb_array_elements(p->'alternatives') loop
      perform detours_private.assert_keys(item,array['id','label','reason','stepIds']);
      if jsonb_typeof(item->'id') is distinct from 'string' or length(btrim(item->>'id')) not between 1 and 200 or jsonb_typeof(item->'label') is distinct from 'string' or length(btrim(item->>'label')) not between 1 and 100 or jsonb_typeof(item->'reason') is distinct from 'string' or item->>'reason' not in ('rain','fatigue') or not (item ? 'reason') then raise exception 'Invalid alternative'; end if;
      if item->>'id'=any(alternatives) then raise exception 'Duplicate alternative'; end if;
      alternatives:=array_append(alternatives,item->>'id');
      if jsonb_typeof(item->'stepIds') is distinct from 'array' or jsonb_array_length(item->'stepIds') not between 1 and 1000 then raise exception 'Invalid alternative steps'; end if;
      if exists(select 1 from jsonb_array_elements(item->'stepIds') x where jsonb_typeof(x)<>'string' or not (x#>>'{}'=any(ids))) then raise exception 'Unknown alternative step'; end if;
      select count(distinct value) into count_ids from jsonb_array_elements_text(item->'stepIds');
      if count_ids<>jsonb_array_length(item->'stepIds') then raise exception 'Duplicate alternative step'; end if;
    end loop;
  end if;
  if p ? 'activeAlternativeId' and (jsonb_typeof(p->'activeAlternativeId')<>'string' or not (p->>'activeAlternativeId'=any(alternatives))) then raise exception 'Unknown active alternative'; end if;
end $$;
revoke all on function detours_private.assert_day_preparation(jsonb) from public,anon,authenticated;

-- Old frontends omit this field from their public projection. Preserve it
-- during ordinary edits, cleaning only references to explicitly removed steps.
create or replace function detours_private.retain_day_preparation(incoming jsonb, previous jsonb) returns jsonb
language plpgsql set search_path = '' as $$
declare c jsonb; d jsonb; old_day jsonb; p jsonb; a jsonb; t jsonb; k text; cities jsonb:='[]'; days jsonb; alts jsonb; timings jsonb; ids text[]; chosen jsonb;
begin
  for c in select value from jsonb_array_elements(incoming->'cities') loop
    days:='[]';
    for d in select value from jsonb_array_elements(c->'days') loop
      if not (d ? 'preparation') then
        select od into old_day from jsonb_array_elements(previous->'cities') oc cross join lateral jsonb_array_elements(oc->'days') od where od->>'id'=d->>'id' limit 1;
        p:=old_day->'preparation';
        if p is not null then
          select coalesce(array_agg(value->>'id'),array[]::text[]) into ids from jsonb_array_elements(d->'steps');
          if not (p->>'anchorStepId'=any(ids)) then p:=p-'anchorStepId'; end if;
          if p ? 'timings' then
            timings:='{}';
            for k,t in select key,value from jsonb_each(p->'timings') loop
              if k=any(ids) then
                if t ? 'fromStepId' and not (t->>'fromStepId'=any(ids)) then t:=t-'fromStepId'; end if;
                timings:=timings||jsonb_build_object(k,t);
              end if;
            end loop;
            p:=jsonb_set(p,'{timings}',timings);
          end if;
          if p ? 'alternatives' then
            alts:='[]';
            for a in select value from jsonb_array_elements(p->'alternatives') loop
              select coalesce(jsonb_agg(value),'[]') into chosen from jsonb_array_elements_text(a->'stepIds') where value=any(ids);
              if jsonb_array_length(chosen)>0 then alts:=alts||jsonb_build_array(jsonb_set(a,'{stepIds}',chosen)); end if;
            end loop;
            p:=jsonb_set(p,'{alternatives}',alts);
            if not exists(select 1 from jsonb_array_elements(alts) x where x->>'id'=p->>'activeAlternativeId') then p:=p-'activeAlternativeId'; end if;
          end if;
          d:=jsonb_set(d,'{preparation}',p);
        end if;
      end if;
      days:=days||jsonb_build_array(d);
    end loop;
    cities:=cities||jsonb_build_array(jsonb_set(c,'{days}',days));
  end loop;
  return jsonb_set(incoming,'{cities}',cities);
end $$;
revoke all on function detours_private.retain_day_preparation(jsonb,jsonb) from public,anon,authenticated;

create or replace function detours_private.assert_shared(p jsonb, p_id text) returns void
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
      perform detours_private.assert_keys(d,array['id','title','date','steps','preparation']);
      perform detours_private.assert_day_preparation(d);
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

create or replace function public.detours_save_trip(p_trip text, p_expected bigint, p_private_expected bigint, p_content jsonb, p_operation text, p_deleted boolean default false, p_action text default 'edit') returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid:=auth.uid(); t public.detours_trips; role text; result jsonb; old_result jsonb; private_rev bigint; private_user uuid; shared_fields text[]; effective_private jsonb;
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
    private_user:=case when t.full_sharing then t.owner_id else u end;
    select coalesce(revision,0) into private_rev from public.detours_personal where trip_id=p_trip and user_id=private_user for update;
    if coalesce(private_rev,0)<>p_private_expected then return jsonb_build_object('status','conflict','record',detours_private.trip_record(p_trip,u)); end if;
    if p_deleted and role<>'owner' then raise exception 'Only the owner can delete' using errcode='42501'; end if;
    if role='reader' or (role='editor' and not (select editors_enabled from detours_private.settings where id)) then raise exception 'Read only access' using errcode='42501'; end if;
    if p_action='edit' then p_content:=jsonb_set(p_content,'{shared}',detours_private.retain_day_preparation(p_content->'shared',t.content)); end if;
    perform detours_private.assert_shared(p_content->'shared',p_trip);
    -- Personal writes do not fabricate a shared revision or journal event.
    if p_deleted or p_action='restore' or t.content is distinct from p_content->'shared' then
      update public.detours_trips set content=p_content->'shared',deleted=p_deleted,revision=revision+1,updated_at=now() where id=p_trip returning * into t;
    end if;
  end if;
  private_user:=case when t.full_sharing then t.owner_id else u end;
  effective_private:=p_content->'private';
  if t.full_sharing then
    shared_fields:=case when role='owner' then array['notes','reservations','budget','documents','preparation']::text[] else (select share_fields from public.detours_members where trip_id=p_trip and user_id=u) end;
    effective_private:=detours_private.merge_details((select content from public.detours_personal where trip_id=p_trip and user_id=private_user),effective_private,shared_fields);
    perform detours_private.assert_details(effective_private);
    if exists(select 1 from jsonb_array_elements(coalesce(effective_private->'expenses','[]')) expense where expense->>'cityId'<>'' and not exists(select 1 from jsonb_array_elements(p_content->'shared'->'cities') city where city->>'id'=expense->>'cityId')) then raise exception 'Invalid expense city'; end if;
  end if;
  insert into public.detours_personal(trip_id,user_id,content) values(p_trip,private_user,effective_private) on conflict(trip_id,user_id) do update set content=excluded.content,revision=public.detours_personal.revision+1 where not t.full_sharing or public.detours_personal.content is distinct from excluded.content;
  insert into public.detours_versions(trip_id,revision,content,author_id,action) values(p_trip,t.revision,t.content,u,case when p_deleted then 'delete' when p_action='restore' then 'restore' else 'edit' end) on conflict do nothing;
  delete from public.detours_versions where trip_id=p_trip and revision < t.revision-29;
  if p_deleted then
    update detours_private.invitations set cancelled=true where trip_id=p_trip;
    delete from public.detours_members where trip_id=p_trip;
  end if;
  if (select coalesce(sum(octet_length(content::text)),0) from public.detours_personal where user_id=private_user) > 20000000 then raise exception 'Personal storage quota reached. Export documents and contact the administrator.'; end if;
  -- Bound account storage, including retained shared history. No paid plan is enabled.
  if not p_deleted and (select coalesce(sum(octet_length(v.content::text)),0) from public.detours_versions v join public.detours_trips tr on tr.id=v.trip_id where tr.owner_id=t.owner_id) + (select coalesce(sum(octet_length(content::text)),0) from public.detours_trips where owner_id=t.owner_id) > 20000000 then raise exception 'Storage quota reached. Export unused trips and contact the administrator.'; end if;
  result:=jsonb_build_object('status','saved','record',detours_private.trip_record(p_trip,u));
  insert into detours_private.operations(user_id,operation,result) values(u,p_operation,jsonb_build_object('trip',p_trip,'revision',t.revision,'private_revision',(select revision from public.detours_personal where trip_id=p_trip and user_id=private_user)));
  delete from detours_private.operations where user_id=u and created_at<now()-interval '30 days';
  delete from detours_private.operations where user_id=u and operation not in (select operation from detours_private.operations where user_id=u order by created_at desc limit 2000);
  return result;
end $$;
