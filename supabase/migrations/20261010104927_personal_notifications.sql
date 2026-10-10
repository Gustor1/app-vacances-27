begin;
create table public.detours_notification_preferences (
 user_id uuid not null references auth.users(id) on delete cascade, trip_id text not null references public.detours_trips(id) on delete cascade,
 preferences jsonb not null check(octet_length(preferences::text)<100000), language text not null default 'fr' check(language in ('fr','en','es','zh','zh-CN')), activated_at timestamptz not null default now(), primary key(user_id,trip_id));
create table public.detours_push_devices(user_id uuid not null references auth.users(id) on delete cascade,device_id text not null check(length(device_id) between 1 and 200),endpoint text not null unique,p256dh text not null,auth text not null,enabled boolean not null default true,primary key(user_id,device_id));
alter table public.detours_notification_preferences enable row level security;
alter table public.detours_push_devices enable row level security;
create policy own_notification_preferences on public.detours_notification_preferences for select to authenticated using(user_id=(select auth.uid()) and public.detours_role(trip_id) is not null);
create policy own_push_device on public.detours_push_devices for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.detours_notification_preferences,public.detours_push_devices from public,anon,authenticated;
grant select on public.detours_notification_preferences to authenticated;
create table detours_private.notification_config(id boolean primary key default true check(id),enabled boolean not null default false,push boolean not null default false,email boolean not null default false,vapid_public_key text);
insert into detours_private.notification_config(id) values(true);
create table detours_private.notification_occurrences(key text primary key,user_id uuid not null references auth.users(id) on delete cascade,trip_id text not null references public.detours_trips(id) on delete cascade, occurrence jsonb not null,due_at timestamptz not null,expires_at timestamptz not null,state text not null default 'pending' check(state in ('pending','claimed','sending','accepted','cancelled','uncertain','failed')),attempts integer not null default 0,lease_until timestamptz,token uuid,source_revision text not null);
create index notification_due on detours_private.notification_occurrences(due_at) where state in ('pending','claimed','sending');
create table detours_private.notification_recaps(user_id uuid not null references auth.users(id) on delete cascade,trip_id text not null references public.detours_trips(id) on delete cascade,date text not null,recap jsonb not null,reference_revision text not null,sent_at timestamptz not null default now(),primary key(user_id,trip_id,date));
alter table detours_private.notification_recaps enable row level security;
alter table detours_private.notification_occurrences enable row level security;
alter table detours_private.notification_config enable row level security;
create function public.detours_notification_capabilities() returns jsonb language sql stable security definer set search_path='' as $$ select jsonb_build_object('enabled',enabled,'push',enabled and push,'email',enabled and email,'vapidPublicKey',case when enabled and push then vapid_public_key else null end) from detours_private.notification_config where id $$;
create function public.detours_notification_preferences(p_trip text,p_preferences jsonb default null,p_language text default 'fr') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; v jsonb; n integer; rule record;
begin
 if auth.uid() is null or public.detours_role(p_trip) is null or not exists(select 1 from public.detours_trips where id=p_trip and not deleted) then raise exception 'Access denied' using errcode='42501';end if;
 if p_preferences is not null then
  if p_preferences->>'version' is distinct from '1' or p_language not in ('fr','en','es','zh','zh-CN') or coalesce(p_preferences->>'timezone','') not in (select name from pg_timezone_names) or coalesce(p_preferences->>'recapTime','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Invalid preferences';end if;
  foreach v in array array[p_preferences->'activityPush',p_preferences->'recapPush',p_preferences->'email',p_preferences->'followed'] loop if jsonb_typeof(v) is distinct from 'boolean' then raise exception 'Invalid channel';end if;end loop;
  if jsonb_typeof(p_preferences->'offsets') is distinct from 'array' or jsonb_array_length(p_preferences->'offsets') not between 1 and 5 or jsonb_typeof(p_preferences->'overrides') is distinct from 'object' or jsonb_typeof(p_preferences->'categories') is distinct from 'array' then raise exception 'Invalid reminder rules';end if;
  for v in select value from jsonb_array_elements(p_preferences->'offsets') loop n:=(v#>>'{}')::integer;if n not between 1 and 10080 then raise exception 'Invalid offset';end if;end loop;
  if exists(select 1 from jsonb_object_keys(p_preferences) key where key not in ('version','timezone','recapTime','offsets','categories','activityPush','recapPush','email','followed','overrides')) or jsonb_array_length(p_preferences->'categories')>6 then raise exception 'Invalid preference fields';end if;
  for v in select value from jsonb_array_elements(p_preferences->'categories') loop if (v#>>'{}') not in ('visit','food','transport','hotel','walk','shopping') or jsonb_typeof(v)<>'string' then raise exception 'Invalid category';end if;end loop;
  for rule in select key,value from jsonb_each(p_preferences->'overrides') loop
   if length(rule.key)>220 or coalesce(rule.value->>'mode','') not in ('default','off','custom') or exists(select 1 from jsonb_object_keys(rule.value) key where key not in ('mode','offsets')) then raise exception 'Invalid override';end if;
   if rule.value->>'mode'='custom' then
    if jsonb_typeof(rule.value->'offsets') is distinct from 'array' or jsonb_array_length(rule.value->'offsets') not between 1 and 5 then raise exception 'Invalid override offsets';end if;
    for v in select value from jsonb_array_elements(rule.value->'offsets') loop n:=(v#>>'{}')::integer;if n not between 1 and 10080 or jsonb_typeof(v)<>'number' then raise exception 'Invalid override offset';end if;end loop;
   end if;
  end loop;
  insert into public.detours_notification_preferences(user_id,trip_id,preferences,language) values(auth.uid(),p_trip,p_preferences,p_language) on conflict(user_id,trip_id) do update set preferences=excluded.preferences,language=excluded.language,activated_at=now();
  update detours_private.notification_occurrences set state='cancelled' where user_id=auth.uid() and trip_id=p_trip and state in ('pending','claimed');
 end if;
 select preferences into result from public.detours_notification_preferences where user_id=auth.uid() and trip_id=p_trip;return result;
end $$;
create function public.detours_register_push(p_device text,p_endpoint text,p_p256dh text,p_auth text) returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if length(p_endpoint)>4096 or p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com)/[^#]+$' or p_p256dh !~ '^[A-Za-z0-9_-]{80,100}={0,2}$' or p_auth !~ '^[A-Za-z0-9_-]{20,30}={0,2}$' then raise exception 'Invalid subscription';end if;
 -- Endpoint belongs to exactly one account on this browser, transferred only by explicit enrollment.
 delete from public.detours_push_devices where endpoint=p_endpoint and user_id<>auth.uid();
 insert into public.detours_push_devices(user_id,device_id,endpoint,p256dh,auth) values(auth.uid(),p_device,p_endpoint,p_p256dh,p_auth) on conflict(user_id,device_id) do update set endpoint=excluded.endpoint,p256dh=excluded.p256dh,auth=excluded.auth,enabled=true;
end $$;
create function public.detours_disable_push(p_device text default null) returns void language plpgsql security definer set search_path='' as $$ begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 delete from public.detours_push_devices where user_id=auth.uid() and (p_device is null or device_id=p_device);
 update detours_private.notification_occurrences set state='cancelled' where user_id=auth.uid() and occurrence->>'channel'='push' and (p_device is null or occurrence->>'deviceId'=p_device) and state in ('pending','claimed');
end $$;
create function detours_private.notification_source(p_user uuid,p_trip text) returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('record',detours_private.trip_record(p_trip,p_user),'preferences',p.preferences,'language',p.language,'activatedAt',p.activated_at,'sourceRevision',md5(detours_private.trip_record(p_trip,p_user)::text || p.preferences::text),'email',case when u.email_confirmed_at is not null then u.email else null end,'devices',coalesce((select jsonb_agg(jsonb_build_object('deviceId',d.device_id,'endpoint',d.endpoint,'p256dh',d.p256dh,'auth',d.auth)) from public.detours_push_devices d where d.user_id=p_user and d.enabled),'[]'::jsonb))
 from public.detours_notification_preferences p join public.detours_trips t on t.id=p.trip_id join auth.users u on u.id=p.user_id where p.user_id=p_user and p.trip_id=p_trip and not t.deleted and (t.owner_id=p_user or exists(select 1 from public.detours_members m where m.trip_id=p_trip and m.user_id=p_user)); $$;
create function public.detours_notification_sources(p_limit integer default 100,p_offset integer default 0) returns jsonb language sql stable security definer set search_path='' as $$ select coalesce(jsonb_agg(jsonb_build_object('userId',s.user_id,'tripId',s.trip_id,'source',detours_private.notification_source(s.user_id,s.trip_id))),'[]') from (select user_id,trip_id from public.detours_notification_preferences order by user_id,trip_id limit least(100,greatest(1,p_limit)) offset greatest(0,p_offset)) s $$;
create function public.detours_notification_source(p_user uuid,p_trip text) returns jsonb language sql stable security definer set search_path='' as $$ select detours_private.notification_source(p_user,p_trip) $$;
create function public.detours_notification_reconcile(p_user uuid,p_trip text,p_occurrences jsonb,p_revision text) returns void language plpgsql security definer set search_path='' as $$ declare o jsonb;begin
 if detours_private.notification_source(p_user,p_trip) is null then update detours_private.notification_occurrences set state='cancelled' where user_id=p_user and trip_id=p_trip and state in ('pending','claimed');return;end if;
 if jsonb_array_length(p_occurrences)>20000 then raise exception 'Occurrence limit';end if;
 update detours_private.notification_occurrences q set state='cancelled' where user_id=p_user and trip_id=p_trip and state in ('pending','claimed') and not exists(select 1 from jsonb_array_elements(p_occurrences) candidate where candidate->>'key'=q.key and candidate->>'revision'=q.occurrence->>'revision');
 for o in select value from jsonb_array_elements(p_occurrences) loop
 if o->>'recipient'<>p_user::text or o->>'tripId'<>p_trip then raise exception 'Recipient mismatch';end if;
 insert into detours_private.notification_occurrences(key,user_id,trip_id,occurrence,due_at,expires_at,source_revision) values(o->>'key',p_user,p_trip,o,to_timestamp((o->>'due')::double precision/1000),to_timestamp((o->>'expires')::double precision/1000),p_revision)
 on conflict(key) do update set occurrence=excluded.occurrence,due_at=case when notification_occurrences.occurrence is distinct from excluded.occurrence then excluded.due_at else notification_occurrences.due_at end,expires_at=excluded.expires_at,source_revision=excluded.source_revision,state=case when notification_occurrences.state='claimed' then 'claimed' else 'pending' end,attempts=case when notification_occurrences.occurrence is distinct from excluded.occurrence then 0 else notification_occurrences.attempts end,lease_until=case when notification_occurrences.state='claimed' then notification_occurrences.lease_until else null end,token=case when notification_occurrences.state='claimed' then notification_occurrences.token else null end where notification_occurrences.state in ('cancelled','pending','claimed');
 end loop;
end $$;
create function public.detours_notification_claim(p_now timestamptz,p_limit integer default 50) returns jsonb language plpgsql security definer set search_path='' as $$ declare result jsonb;begin
 if not (select enabled from detours_private.notification_config where id) then return '[]';end if;
 update detours_private.notification_occurrences set state='uncertain' where state='sending' and lease_until<p_now;
 update detours_private.notification_occurrences set state='cancelled' where state in ('pending','claimed') and expires_at<=p_now;
 with picked as (select key from detours_private.notification_occurrences where due_at<=p_now and expires_at>p_now and attempts<3 and (state='pending' or (state='claimed' and lease_until<p_now)) order by due_at limit least(100,greatest(1,p_limit)) for update skip locked), claimed as (update detours_private.notification_occurrences q set state='claimed',attempts=attempts+1,token=gen_random_uuid(),lease_until=p_now+interval '2 minutes' from picked where q.key=picked.key returning q.*) select coalesce(jsonb_agg(occurrence||jsonb_build_object('status',state,'attempts',attempts,'token',token,'sourceRevision',source_revision)),'[]') into result from claimed;return result;
end $$;
create function public.detours_notification_begin(p_key text,p_token uuid,p_now timestamptz) returns boolean language plpgsql security definer set search_path='' as $$ begin
 update detours_private.notification_occurrences q set state='sending' where key=p_key and token=p_token and state='claimed' and lease_until>p_now and expires_at>p_now and (select enabled from detours_private.notification_config where id) and detours_private.notification_source(q.user_id,q.trip_id)->>'sourceRevision'=q.source_revision and case when q.occurrence->>'channel'='email' then (select email from detours_private.notification_config where id) else (select push from detours_private.notification_config where id) and exists(select 1 from public.detours_push_devices d where d.user_id=q.user_id and d.device_id=q.occurrence->>'deviceId' and d.enabled) end;
 if found then return true;end if;
 update detours_private.notification_occurrences set state='cancelled' where key=p_key and token=p_token and state='claimed';return false;
end $$;
create function public.detours_notification_finish(p_key text,p_token uuid,p_state text,p_next timestamptz default null,p_recap jsonb default null) returns void language plpgsql security definer set search_path='' as $$ declare q detours_private.notification_occurrences;begin
 if p_state not in ('accepted','cancelled','uncertain','failed','pending') then raise exception 'Invalid result';end if;
 update detours_private.notification_occurrences set state=p_state,due_at=coalesce(p_next,due_at),lease_until=null where key=p_key and token=p_token and state in ('claimed','sending') returning * into q;
 if found and p_state='accepted' and q.occurrence->>'type'='recap' and p_recap is not null then
  if p_recap->>'tripId' is distinct from q.trip_id or p_recap->>'date' is distinct from q.occurrence->>'objectId' or p_recap->>'revision' is distinct from q.occurrence->>'revision' or octet_length(p_recap::text)>2000000 then raise exception 'Invalid recap snapshot';end if;
  if detours_private.notification_source(q.user_id,q.trip_id) is not null then insert into detours_private.notification_recaps(user_id,trip_id,date,recap,reference_revision) values(q.user_id,q.trip_id,p_recap->>'date',p_recap,q.occurrence->>'revision') on conflict do nothing;end if;
 end if;
 delete from detours_private.notification_recaps where sent_at<now()-interval '31 days';
 delete from detours_private.notification_occurrences where expires_at<now()-interval '31 days' and state not in ('claimed','sending');
end $$;
create function detours_private.purge_notification_access() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if tg_table_name='detours_members' then delete from public.detours_notification_preferences where user_id=old.user_id and trip_id=old.trip_id;delete from detours_private.notification_occurrences where user_id=old.user_id and trip_id=old.trip_id;delete from detours_private.notification_recaps where user_id=old.user_id and trip_id=old.trip_id;
 elsif new.deleted then delete from public.detours_notification_preferences where trip_id=new.id;delete from detours_private.notification_occurrences where trip_id=new.id;delete from detours_private.notification_recaps where trip_id=new.id;end if;return null;
end $$;
create trigger notification_member_removed after delete on public.detours_members for each row execute function detours_private.purge_notification_access();
create trigger notification_trip_deleted after update of deleted on public.detours_trips for each row execute function detours_private.purge_notification_access();
create function detours_private.purge_notification_perimeter() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if old.share_fields is distinct from new.share_fields then
  delete from detours_private.notification_recaps where user_id=new.user_id and trip_id=new.trip_id;
  update detours_private.notification_occurrences set state='cancelled' where user_id=new.user_id and trip_id=new.trip_id and state in ('pending','claimed');
 end if;return null;
end $$;
create trigger notification_member_perimeter after update of share_fields on public.detours_members for each row execute function detours_private.purge_notification_perimeter();
revoke all on function detours_private.purge_notification_perimeter() from public,anon,authenticated;
revoke all on function public.detours_notification_capabilities(),public.detours_notification_preferences(text,jsonb,text),public.detours_register_push(text,text,text,text),public.detours_disable_push(text) from public,anon;
grant execute on function public.detours_notification_capabilities() to anon,authenticated,service_role;
grant execute on function public.detours_notification_preferences(text,jsonb,text),public.detours_register_push(text,text,text,text),public.detours_disable_push(text) to authenticated;
revoke all on function detours_private.notification_source(uuid,text),detours_private.purge_notification_access(),public.detours_notification_sources(integer,integer),public.detours_notification_source(uuid,text),public.detours_notification_reconcile(uuid,text,jsonb,text),public.detours_notification_claim(timestamptz,integer),public.detours_notification_begin(text,uuid,timestamptz),public.detours_notification_finish(text,uuid,text,timestamptz,jsonb) from public,anon,authenticated;
grant execute on function public.detours_notification_sources(integer,integer),public.detours_notification_source(uuid,text),public.detours_notification_reconcile(uuid,text,jsonb,text),public.detours_notification_claim(timestamptz,integer),public.detours_notification_begin(text,uuid,timestamptz),public.detours_notification_finish(text,uuid,text,timestamptz,jsonb) to service_role;
create function public.detours_notification_expire_device(p_user uuid,p_device text) returns void language plpgsql security definer set search_path='' as $$ begin delete from public.detours_push_devices where user_id=p_user and device_id=p_device;update detours_private.notification_occurrences set state='cancelled' where user_id=p_user and occurrence->>'deviceId'=p_device and state in ('pending','claimed');end $$;
revoke all on function public.detours_notification_expire_device(uuid,text) from public,anon,authenticated;
grant execute on function public.detours_notification_expire_device(uuid,text) to service_role;
create function public.detours_notification_recap_references(p_trip text) returns jsonb language sql stable security definer set search_path='' as $$ select coalesce(jsonb_object_agg(date,reference_revision),'{}') from detours_private.notification_recaps where user_id=auth.uid() and trip_id=p_trip and public.detours_role(p_trip) is not null and sent_at>=now()-interval '31 days' $$;
revoke all on function public.detours_notification_recap_references(text) from public,anon;
grant execute on function public.detours_notification_recap_references(text) to authenticated;
create function public.detours_notification_recap_snapshots(p_trip text) returns jsonb language sql stable security definer set search_path='' as $$ select coalesce(jsonb_agg(jsonb_build_object('recap',recap,'referenceRevision',reference_revision,'capturedAt',sent_at) order by date),'[]') from detours_private.notification_recaps where user_id=auth.uid() and trip_id=p_trip and public.detours_role(p_trip) is not null and sent_at>=now()-interval '31 days' $$;
revoke all on function public.detours_notification_recap_snapshots(text) from public,anon;
grant execute on function public.detours_notification_recap_snapshots(text) to authenticated;
commit;





