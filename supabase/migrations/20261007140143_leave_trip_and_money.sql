-- Voluntary departure removes membership only. All shared contributions survive.
begin;
create function public.detours_leave_trip(p_trip text) returns void
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); owner uuid;
begin
  if u is null then raise exception 'Sign in required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_trip,0));
  select owner_id into owner from public.detours_trips where id=p_trip;
  if owner is null then raise exception 'Trip unavailable' using errcode='42501'; end if;
  if owner=u then raise exception 'Owner cannot leave their trip' using errcode='42501'; end if;
  delete from public.detours_members where trip_id=p_trip and user_id=u;
  -- A used invitation can be retried only while membership exists; invalidate it
  -- permanently so rejoining always requires a new invitation.
  update detours_private.invitations set cancelled=true where trip_id=p_trip and accepted_by=u;
end $$;
revoke execute on function public.detours_leave_trip(text) from public,anon;
grant execute on function public.detours_leave_trip(text) to authenticated;

create or replace function public.detours_set_member(p_trip text,p_user uuid,p_role text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_trip,0));
  if public.detours_role(p_trip) is distinct from 'owner' then raise exception 'Access denied' using errcode='42501'; end if;
  if p_user is null or exists(select 1 from public.detours_trips where id=p_trip and owner_id=p_user) then raise exception 'Creator role cannot change' using errcode='42501'; end if;
  if p_role='remove' then
    delete from public.detours_members where trip_id=p_trip and user_id=p_user;
    update detours_private.invitations set cancelled=true where trip_id=p_trip and accepted_by=p_user;
  elsif p_role in ('reader','editor') then
    if p_role='editor' and not (select editors_enabled from detours_private.settings where id) then raise exception 'Editors not enabled'; end if;
    update public.detours_members set role=p_role where trip_id=p_trip and user_id=p_user;
    if not found then raise exception 'Member unavailable'; end if;
  else raise exception 'Invalid role'; end if;
end $$;

-- Use the same trip lock before the invitation row lock as save/leave/remove.
create or replace function public.detours_accept_invite(p_token text) returns text
language plpgsql security definer set search_path='' as $$
declare i detours_private.invitations;
begin
  if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'Invitation unavailable'; end if;
  select * into i from detours_private.invitations where token_hash=extensions.digest(p_token,'sha256');
  if i.id is null then raise exception 'Invitation unavailable'; end if;
  perform pg_advisory_xact_lock(hashtextextended(i.trip_id,0));
  select * into i from detours_private.invitations where id=i.id for update;
  if i.id is null or i.cancelled or i.expires_at<=now() or (select deleted from public.detours_trips where id=i.trip_id) then raise exception 'Invitation unavailable'; end if;
  if i.accepted_by is not null then
    if i.accepted_by=auth.uid() and public.detours_role(i.trip_id) is not null then return i.trip_id; end if;
    raise exception 'Invitation already used';
  end if;
  if public.detours_role(i.trip_id) is distinct from 'owner' then
    insert into public.detours_members(trip_id,user_id,role) values(i.trip_id,auth.uid(),'reader') on conflict do nothing;
  end if;
  update detours_private.invitations set accepted_by=auth.uid() where id=i.id;
  return i.trip_id;
end $$;

create function detours_private.assert_rate_quotes(p jsonb) returns void
language plpgsql immutable set search_path='' as $$
declare pair record; q jsonb; d text;
begin
  if jsonb_typeof(p) is distinct from 'object' then raise exception 'Invalid conversion dictionary'; end if;
  for pair in select * from jsonb_each(p) loop
    q:=pair.value;
    if not detours_private.valid_currency(pair.key) or jsonb_typeof(q) is distinct from 'object'
      or jsonb_typeof(q->'rate') is distinct from 'number' or (q->>'rate')::numeric<=0 or (q->>'rate')::numeric>1e308
      or jsonb_typeof(q->'source') is distinct from 'string' or q->>'source' not in ('manual','frankfurter','legacy')
      or jsonb_typeof(q->'date') is distinct from 'string' then raise exception 'Invalid conversion'; end if;
    d:=q->>'date';
    if d='' and q->>'source'='legacy' then continue; end if;
    if d !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or left(d,4)='0000' or to_char(d::date,'YYYY-MM-DD')<>d then raise exception 'Invalid conversion date'; end if;
  end loop;
end $$;
revoke all on function detours_private.assert_rate_quotes(jsonb) from public,anon,authenticated;

create or replace function detours_private.category_keys(category text) returns text[]
language sql immutable set search_path='' as $$
  select case category
    when 'notes' then array['notes','cityNotes','stayNotes','bonusPrivate']
    when 'reservations' then array['bookings','transferPrivate']
    when 'budget' then array['expenses','budget','budgetCurrency','exchangeRates','rateQuotes','budgetConversions']
    when 'documents' then array['documents']
    when 'preparation' then array['favorites','done','packing','phrases']
    else array[]::text[] end;
$$;

create or replace function detours_private.assert_details(p jsonb) returns void
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
  if p ? 'budget' and (jsonb_typeof(p->'budget')<>'number' or ((p->>'budget')::numeric<=0 or (p->>'budget')::numeric>1e308)) then raise exception 'Invalid budget'; end if;
  if p ? 'budgetCurrency' and (jsonb_typeof(p->'budgetCurrency')<>'string' or not detours_private.valid_currency(p->>'budgetCurrency')) then raise exception 'Invalid currency'; end if;
  for pair in select * from jsonb_each(coalesce(p->'exchangeRates','{}')) loop if not detours_private.valid_currency(pair.key) or jsonb_typeof(pair.value)<>'number' or (pair.value::text::numeric<=0 or pair.value::text::numeric>1e308) then raise exception 'Invalid rate'; end if; end loop;
  foreach k in array array['documents','expenses','packing','phrases'] loop
    if p ? k then
      if jsonb_typeof(p->k)<>'array' or jsonb_array_length(p->k)>10000 then raise exception 'Invalid detail collection'; end if;
      if (select count(*)<>count(distinct v->>'id') from jsonb_array_elements(p->k) v) then raise exception 'Duplicate detail IDs'; end if;
      for item in select * from jsonb_array_elements(p->k) loop
        if jsonb_typeof(item)<>'object' or jsonb_typeof(item->'id') is distinct from 'string' or length(btrim(item->>'id'))=0 then raise exception 'Invalid detail item'; end if;
        if k='documents' and (jsonb_typeof(item->'title') is distinct from 'string' or length(btrim(item->>'title'))=0 or jsonb_typeof(item->'content') is distinct from 'string' or length(item->>'content')>500000 or jsonb_array_length(p->k)>100) then raise exception 'Invalid document'; end if;
        if k='packing' and (jsonb_typeof(item->'label') is distinct from 'string' or length(btrim(item->>'label'))=0 or jsonb_typeof(item->'packed') is distinct from 'boolean') then raise exception 'Invalid packing item'; end if;
        if k='phrases' and (jsonb_typeof(item->'category') is distinct from 'string' or jsonb_typeof(item->'meaning') is distinct from 'string' or jsonb_typeof(item->'local') is distinct from 'string' or jsonb_typeof(item->'pronunciation') is distinct from 'string') then raise exception 'Invalid phrase'; end if;
        if k='expenses' and (jsonb_typeof(item->'label') is distinct from 'string' or length(btrim(item->>'label'))=0 or jsonb_typeof(item->'cityId') is distinct from 'string' or jsonb_typeof(item->'amount') is distinct from 'number' or (item->>'amount')::numeric<=0 or (item->>'amount')::numeric>1e308 or jsonb_typeof(item->'currency') is distinct from 'string' or not detours_private.valid_currency(item->>'currency') or jsonb_typeof(item->'category') is distinct from 'string' or item->>'category' not in ('food','transport','hotel','visit','shopping','other')) then raise exception 'Invalid expense'; end if;
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
  perform detours_private.assert_rate_quotes(coalesce(p->'rateQuotes','{}'));
  perform detours_private.assert_rate_quotes(coalesce(p->'budgetConversions','{}'));
  for item in select * from jsonb_array_elements(coalesce(p->'expenses','[]')) loop
    if item ? 'conversions' then perform detours_private.assert_rate_quotes(item->'conversions'); end if;
  end loop;
end $$;
create or replace function detours_private.merge_details(original jsonb, incoming jsonb, fields text[]) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb := coalesce(original,'{}'); category text; field text;
begin
  perform detours_private.assert_keys(incoming,array['notes','favorites','done','bookings','cityNotes','stayNotes','transferPrivate','bonusPrivate','expenses','budget','budgetCurrency','exchangeRates','rateQuotes','budgetConversions','documents','packing','phrases','resume']);
  foreach category in array fields loop
    foreach field in array detours_private.category_keys(category) loop
      result := result - field;
      if incoming ? field then result := result || jsonb_build_object(field,incoming->field); end if;
    end loop;
  end loop;
  return result;
end $$;
commit;
