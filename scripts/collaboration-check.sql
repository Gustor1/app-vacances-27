-- Run in the beta project's SQL connection. Supply two existing Auth user IDs
-- through detours.test_a / detours.test_b before this block, inside BEGIN.
-- Every call switches to the authenticated role: no service-role bypass.
-- Finish with ROLLBACK: all fixtures and the temporary editor activation vanish.
do $checks$
declare
  a uuid := current_setting('detours.test_a')::uuid;
  b uuid := current_setting('detours.test_b')::uuid;
  trip text := 'collaboration-check-' || gen_random_uuid()::text;
  content jsonb := jsonb_build_object('shared', jsonb_build_object(
    'version',1,'journey',jsonb_build_object('id',trip,'title','Collaboration test'),
    'cities','[]'::jsonb,'notes','{}'::jsonb,'favorites','[]'::jsonb,
    'done','[]'::jsonb,'bookings','[]'::jsonb),
    'private',jsonb_build_object('notes',jsonb_build_object('general','OWNER_PRIVATE')));
  editor_content jsonb;
  first_record jsonb; latest jsonb; restored jsonb; invite jsonb;
  denied boolean; prior_gate boolean; checks integer := 0;
begin
  if a=b or not exists(select 1 from auth.users where id=a) or not exists(select 1 from auth.users where id=b) then raise exception 'Two distinct existing Auth users required'; end if;
  select editors_enabled into prior_gate from detours_private.settings where id;
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  first_record := public.detours_save_trip(trip,0,0,content,'first-'||trip,false,'edit');
  if first_record->>'status' <> 'saved' then raise exception 'Owner creation failed'; end if; checks:=checks+1;
  if public.detours_save_trip(trip,0,0,content,'first-'||trip,false,'edit') <> first_record then raise exception 'Retry not idempotent'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  if exists(select 1 from public.detours_trips where id=trip) or exists(select 1 from public.detours_personal where trip_id=trip) or exists(select 1 from public.detours_versions where trip_id=trip) then raise exception 'Non-member RLS leak'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_get_trip(trip); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Non-member RPC leak'; end if; checks:=checks+1;
  denied:=false; begin insert into public.detours_members(trip_id,user_id,role) values(trip,b,'editor'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Direct membership write allowed'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  invite := public.detours_invite(trip);
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  if public.detours_accept_invite(invite->>'token') <> trip or public.detours_accept_invite(invite->>'token') <> trip then raise exception 'Invitation/retry failed'; end if; checks:=checks+1;
  latest:=public.detours_get_trip(trip);
  if latest->>'role'<>'reader' or latest::text like '%OWNER_PRIVATE%' or exists(select 1 from public.detours_personal where trip_id=trip) then raise exception 'Reader private-data leak'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_list_members(trip); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Reader can read private member names'; end if; checks:=checks+1;
  editor_content:=jsonb_set(content,'{private}', '{"notes":{"general":"EDITOR_PRIVATE"}}'::jsonb);
  denied:=false; begin perform public.detours_save_trip(trip,1,0,editor_content,'reader-'||trip,false,'edit'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Reader write allowed'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_set_member(trip,b,'editor'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Reader can upgrade access'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_invite(trip); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Reader can invite'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  latest:=public.detours_list_members(trip);
  if jsonb_array_length(latest)<>1 or latest#>>'{0,user_id}'<>b::text or latest#>>'{0,display_name}' is null or (latest->0 ? 'email') then raise exception 'Owner member labels failed'; end if; checks:=checks+1;
  invite := public.detours_invite(trip);
  perform public.detours_manage_invite((invite->>'id')::uuid);
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  denied:=false; begin perform public.detours_accept_invite(invite->>'token'); exception when others then denied:=true; end;
  if not denied then raise exception 'Cancelled invitation accepted'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  execute 'reset role';
  update detours_private.settings set editors_enabled=false where id;
  execute 'set local role authenticated';
  denied:=false; begin perform public.detours_set_member(trip,b,'editor'); exception when others then denied:=true; end;
  if not denied then raise exception 'Editor activation gate ignored'; end if; checks:=checks+1;
  execute 'reset role';
  update detours_private.settings set editors_enabled=true where id;
  execute 'set local role authenticated';
  perform public.detours_set_member(trip,b,'editor');
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  editor_content:=jsonb_set(editor_content,'{shared,journey,title}','"Edited together"'::jsonb);
  latest:=public.detours_save_trip(trip,1,0,editor_content,'editor-'||trip,false,'edit');
  if latest->>'status'<>'saved' or latest#>>'{record,role}'<>'editor' or latest#>>'{record,revision}'<>'2' then raise exception 'Editor write failed'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_save_trip(trip,2,1,editor_content,'editor-delete-'||trip,true,'edit'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Editor can delete journal'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_set_member(trip,b,'reader'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Editor can manage members'; end if; checks:=checks+1;
  denied:=false; begin perform public.detours_list_members(trip); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Editor can read private member names'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  latest:=public.detours_get_trip(trip);
  if latest#>>'{content,shared,journey,title}'<>'Edited together' or latest::text like '%EDITOR_PRIVATE%' or latest#>>'{content,private,notes,general}'<>'OWNER_PRIVATE' then raise exception 'Editor change or private isolation failed'; end if; checks:=checks+1;
  if public.detours_save_trip(trip,1,1,content,'stale-'||trip,false,'edit')->>'status'<>'conflict' then raise exception 'Concurrent stale write did not conflict'; end if; checks:=checks+1;
  restored:=public.detours_save_trip(trip,2,1,content,'restore-'||trip,false,'restore');
  if restored#>>'{record,revision}'<>'3' then raise exception 'Restoration did not create revision'; end if; checks:=checks+1;
  if exists(select 1 from public.detours_versions v where trip_id=trip and (v.content::text like '%OWNER_PRIVATE%' or v.content::text like '%EDITOR_PRIVATE%')) then raise exception 'History private-data leak'; end if; checks:=checks+1;
  perform public.detours_set_member(trip,b,'reader');
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  denied:=false; begin perform public.detours_save_trip(trip,3,1,editor_content,'demoted-'||trip,false,'edit'); exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Demoted editor can still write'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  perform public.detours_set_member(trip,b,'remove');
  perform set_config('request.jwt.claim.sub',b::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
  if public.detours_save_trip(trip,3,1,editor_content,'revoked-'||trip,false,'edit')->>'status'<>'revoked' then raise exception 'Revoked editor write allowed'; end if; checks:=checks+1;
  if exists(select 1 from public.detours_trips where id=trip) or exists(select 1 from public.detours_personal where trip_id=trip) then raise exception 'Revoked member RLS leak'; end if; checks:=checks+1;
  perform set_config('request.jwt.claim.sub',a::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
  latest:=public.detours_save_trip(trip,3,2,content,'delete-'||trip,true,'edit');
  if latest#>>'{record,deleted}'<>'true' then raise exception 'Owner deletion failed'; end if; checks:=checks+1;
  if public.detours_save_trip(trip,3,2,content,'old-device-'||trip,false,'edit')->>'status'<>'conflict' then raise exception 'Deleted journal recreated'; end if; checks:=checks+1;
  execute 'reset role';
  if checks<>27 then raise exception 'Unexpected check count: %',checks; end if;
end $checks$;
