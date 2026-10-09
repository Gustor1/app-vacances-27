-- Additive transition: existing trips keep their original private perimeter.
begin;
alter table public.detours_trips add column full_sharing boolean not null default false;
alter table public.detours_members add column share_fields text[] not null
  default array['notes','reservations','budget','documents','preparation'];
alter table public.detours_members add constraint detours_share_fields_valid
  check (share_fields <@ array['notes','reservations','budget','documents','preparation']::text[]);

create function detours_private.category_keys(category text) returns text[]
language sql immutable set search_path='' as $$
  select case category
    when 'notes' then array['notes','cityNotes','stayNotes','bonusPrivate']
    when 'reservations' then array['bookings','transferPrivate']
    when 'budget' then array['expenses','budget','budgetCurrency','exchangeRates']
    when 'documents' then array['documents']
    when 'preparation' then array['favorites','done','packing','phrases']
    else array[]::text[] end;
$$;
create function detours_private.visible_details(details jsonb, fields text[]) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb := '{"notes":{},"favorites":[],"done":[],"bookings":[],"cityNotes":{},"stayNotes":{},"transferPrivate":{},"bonusPrivate":{}}'; category text; field text;
begin
  foreach category in array fields loop
    foreach field in array detours_private.category_keys(category) loop
      if details ? field then result := result || jsonb_build_object(field,details->field); end if;
    end loop;
  end loop;
  return result;
end $$;
create function detours_private.merge_details(original jsonb, incoming jsonb, fields text[]) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb := coalesce(original,'{}'); category text; field text;
begin
  perform detours_private.assert_keys(incoming,array['notes','favorites','done','bookings','cityNotes','stayNotes','transferPrivate','bonusPrivate','expenses','budget','budgetCurrency','exchangeRates','documents','packing','phrases','resume']);
  foreach category in array fields loop
    foreach field in array detours_private.category_keys(category) loop
      result := result - field;
      if incoming ? field then result := result || jsonb_build_object(field,incoming->field); end if;
    end loop;
  end loop;
  return result;
end $$;

create function detours_private.assert_details(p jsonb) returns void
language plpgsql immutable set search_path='' as $$
declare k text; item jsonb; pair record;
begin
  if jsonb_typeof(p) is distinct from 'object' then raise exception 'Invalid common details'; end if;
  foreach k in array array['notes','stayNotes'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'object' then raise exception 'Invalid notes'; end if;
      for pair in select * from jsonb_each(p->k) loop if jsonb_typeof(pair.value)<>'string' then raise exception 'Invalid note text'; end if; end loop;
    end if;
  end loop;
  foreach k in array array['favorites','done','bookings'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'array' then raise exception 'Invalid checklist'; end if;
      for item in select * from jsonb_array_elements(p->k) loop if jsonb_typeof(item)<>'string' then raise exception 'Invalid checklist item'; end if; end loop;
    end if;
  end loop;
  if p ? 'cityNotes' then
    if jsonb_typeof(p->'cityNotes')<>'object' then raise exception 'Invalid city notes'; end if;
    for pair in select * from jsonb_each(p->'cityNotes') loop
      if jsonb_typeof(pair.value)<>'array' then raise exception 'Invalid city notes'; end if;
      for item in select * from jsonb_array_elements(pair.value) loop if jsonb_typeof(item)<>'string' then raise exception 'Invalid city note'; end if; end loop;
    end loop;
  end if;
  foreach k in array array['transferPrivate','bonusPrivate','exchangeRates'] loop
    if p ? k and jsonb_typeof(p->k)<>'object' then raise exception 'Invalid details dictionary'; end if;
  end loop;
  for pair in select * from jsonb_each(coalesce(p->'transferPrivate','{}')) loop
    if jsonb_typeof(pair.value)<>'object' or jsonb_typeof(pair.value->'reference') is distinct from 'string' or jsonb_typeof(pair.value->'notes') is distinct from 'string' or jsonb_typeof(pair.value->'booked') is distinct from 'boolean' then raise exception 'Invalid transfer details'; end if;
  end loop;
  for pair in select * from jsonb_each(coalesce(p->'bonusPrivate','{}')) loop
    if jsonb_typeof(pair.value)<>'object' or (pair.value ? 'tip' and jsonb_typeof(pair.value->'tip')<>'string') or (pair.value ? 'sourceUrl' and jsonb_typeof(pair.value->'sourceUrl')<>'string') then raise exception 'Invalid bonus details'; end if;
  end loop;
  if p ? 'budget' and (jsonb_typeof(p->'budget')<>'number' or (p->>'budget')::numeric<0) then raise exception 'Invalid budget'; end if;
  if p ? 'budgetCurrency' and (jsonb_typeof(p->'budgetCurrency')<>'string' or p->>'budgetCurrency'!~'^[A-Z]{3}$') then raise exception 'Invalid currency'; end if;
  for pair in select * from jsonb_each(coalesce(p->'exchangeRates','{}')) loop if pair.key!~'^[A-Z]{3}$' or jsonb_typeof(pair.value)<>'number' or pair.value::text::numeric<=0 then raise exception 'Invalid rate'; end if; end loop;
  foreach k in array array['documents','expenses','packing','phrases'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'array' or jsonb_array_length(p->k)>10000 then raise exception 'Invalid detail collection'; end if;
      if (select count(*)<>count(distinct v->>'id') from jsonb_array_elements(p->k) v) then raise exception 'Duplicate detail IDs'; end if;
      for item in select * from jsonb_array_elements(p->k) loop
        if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(item->>'id')=0 then raise exception 'Invalid detail item'; end if;
        if k='documents' and (jsonb_typeof(item->'title') is distinct from 'string' or length(item->>'title')=0 or jsonb_typeof(item->'content') is distinct from 'string' or length(item->>'content')>500000 or jsonb_array_length(p->k)>100) then raise exception 'Invalid document'; end if;
        if k='packing' and (jsonb_typeof(item->'label') is distinct from 'string' or jsonb_typeof(item->'packed') is distinct from 'boolean') then raise exception 'Invalid packing item'; end if;
        if k='phrases' and (jsonb_typeof(item->'category') is distinct from 'string' or jsonb_typeof(item->'meaning') is distinct from 'string' or jsonb_typeof(item->'local') is distinct from 'string' or jsonb_typeof(item->'pronunciation') is distinct from 'string') then raise exception 'Invalid phrase'; end if;
        if k='expenses' and (jsonb_typeof(item->'label') is distinct from 'string' or length(item->>'label')=0 or jsonb_typeof(item->'cityId') is distinct from 'string' or jsonb_typeof(item->'amount') is distinct from 'number' or (item->>'amount')::numeric<0 or (item->>'amount')::numeric>1e308 or jsonb_typeof(item->'currency') is distinct from 'string' or item->>'currency'!~'^[A-Z]{3}$' or jsonb_typeof(item->'category') is distinct from 'string' or item->>'category' not in ('food','transport','hotel','visit','shopping','other')) then raise exception 'Invalid expense'; end if;
        if k='expenses' and item ? 'date' then
          if jsonb_typeof(item->'date') is distinct from 'string' then raise exception 'Invalid expense date'; end if;
          if item->>'date'<>'' then
            if item->>'date'!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid expense date'; end if;
            perform (item->>'date')::date;
          end if;
        end if;
      end loop;
    end if;
  end loop;
end $$;

create function public.detours_enable_full_share(p_trip text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_trip,0));
  if public.detours_role(p_trip) is distinct from 'owner' then raise exception 'Owner required' using errcode='42501'; end if;
  perform detours_private.assert_details(coalesce((select p.content from public.detours_personal p join public.detours_trips t on t.id=p.trip_id and t.owner_id=p.user_id where t.id=p_trip),'{}'));
  update public.detours_trips set full_sharing=true,revision=revision+1,updated_at=now() where id=p_trip and not deleted and not full_sharing;
end $$;
create function public.detours_set_share_fields(p_trip text,p_user uuid,p_fields text[]) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_trip,0));
  if public.detours_role(p_trip) is distinct from 'owner' then raise exception 'Owner required' using errcode='42501'; end if;
  if p_fields is null or not (p_fields <@ array['notes','reservations','budget','documents','preparation']::text[]) then raise exception 'Invalid sharing fields'; end if;
  update public.detours_members set share_fields=p_fields where trip_id=p_trip and user_id=p_user;
  if not found then raise exception 'Member unavailable'; end if;
  -- Force cached members to fetch their newly filtered snapshot.
  update public.detours_trips set revision=revision+1,updated_at=now() where id=p_trip and not deleted;
end $$;
revoke all on function detours_private.category_keys(text),detours_private.visible_details(jsonb,text[]),detours_private.merge_details(jsonb,jsonb,text[]),detours_private.assert_details(jsonb) from public,anon,authenticated;
revoke execute on function public.detours_enable_full_share(text),public.detours_set_share_fields(text,uuid,text[]) from public,anon;
grant execute on function public.detours_enable_full_share(text),public.detours_set_share_fields(text,uuid,text[]) to authenticated;

create or replace function detours_private.trip_record(p_trip text, p_user uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object('content',jsonb_build_object('shared',t.content,'private',case when t.full_sharing then detours_private.visible_details(p.content,case when t.owner_id=p_user then array['notes','reservations','budget','documents','preparation']::text[] else m.share_fields end) else coalesce(p.content,'{"notes":{},"favorites":[],"done":[],"bookings":[],"cityNotes":{},"stayNotes":{},"transferPrivate":{},"bonusPrivate":{}}'::jsonb) end), 'revision',t.revision,'private_revision',coalesce(p.revision,0),'deleted',t.deleted,'fullSharing',t.full_sharing,'allowedFields',case when t.owner_id=p_user then to_jsonb(array['notes','reservations','budget','documents','preparation']::text[]) else to_jsonb(m.share_fields) end,'role',case when t.owner_id=p_user then 'owner' else m.role end)
  from public.detours_trips t left join public.detours_personal p on p.trip_id=t.id and p.user_id=case when t.full_sharing then t.owner_id else p_user end left join public.detours_members m on m.trip_id=t.id and m.user_id=p_user where t.id=p_trip;
$$;

create or replace function public.detours_list_trips() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'journey',t.content->'journey','departureDate',t.content->'departureDate','revision',t.revision,'privateRevision',coalesce(p.revision,0),'deleted',t.deleted,'fullSharing',t.full_sharing,'role',case when t.owner_id=auth.uid() then 'owner' else m.role end,'cityCount',jsonb_array_length(t.content->'cities')) order by t.updated_at desc),'[]')
  from public.detours_trips t left join public.detours_personal p on p.trip_id=t.id and p.user_id=case when t.full_sharing then t.owner_id else auth.uid() end left join public.detours_members m on m.trip_id=t.id and m.user_id=auth.uid() where auth.uid() is not null and (t.owner_id=auth.uid() or m.user_id=auth.uid());
$$;


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

create or replace function public.detours_roster(p_trip text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.detours_role(p_trip) is null
    or not exists(select 1 from public.detours_trips where id=p_trip and not deleted) then
    raise exception 'Trip access required' using errcode='42501';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'user_id',people.user_id,'role',people.role,'email',u.email,'share_fields',people.share_fields,
      'display_name',left(coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
        nullif(btrim(u.raw_user_meta_data->>'name'),''),'Membre'),80))
      order by case when people.role='owner' then 0 else 1 end,people.user_id),'[]'::jsonb)
    from (
      select owner_id as user_id,'owner'::text as role,array['notes','reservations','budget','documents','preparation']::text[] as share_fields from public.detours_trips where id=p_trip
      union all
      select user_id,role,share_fields from public.detours_members where trip_id=p_trip
    ) people join auth.users u on u.id=people.user_id
  );
end $$;

commit;
