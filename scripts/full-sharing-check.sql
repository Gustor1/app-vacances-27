-- Transactional checks under real authenticated roles. Both IDs must already exist.
do $check$
declare a uuid:=current_setting('detours.test_a')::uuid; b uuid:=current_setting('detours.test_b')::uuid;
  trip text:='full-sharing-check-'||gen_random_uuid()::text; content jsonb; received jsonb; saved jsonb; denied boolean; bad jsonb;
begin
  content:=jsonb_build_object('shared',jsonb_build_object('version',1,'journey',jsonb_build_object('id',trip,'title','Full sharing fixture','destinations','','description','','cover','/travel-landscape.svg','currency','EUR','timezone','UTC','source','custom','followsCatalog',false),'departureDate','','cities','[]'::jsonb,'notes','{}'::jsonb,'favorites','[]'::jsonb,'done','[]'::jsonb,'bookings','[]'::jsonb),
    'private','{"notes":{"general":"COMMON_NOTE"},"favorites":[],"done":[],"bookings":[],"cityNotes":{},"stayNotes":{},"transferPrivate":{},"bonusPrivate":{},"documents":[{"id":"doc","title":"Common document","content":"DOCUMENT_SECRET"}],"budget":123,"budgetCurrency":"EUR","expenses":[],"packing":[]}'::jsonb);
  execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub',a::text,true);
  saved:=public.detours_save_trip(trip,0,0,content,'initial-'||trip);
  perform public.detours_accept_invite(public.detours_invite(trip)->>'token'); -- owner retry must not create a membership
  perform set_config('request.jwt.claim.sub',b::text,true);
  denied:=false;begin perform public.detours_roster(trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Nonmember roster leak';end if;
  perform set_config('request.jwt.claim.sub',a::text,true);
  received:=public.detours_invite(trip);
  perform set_config('request.jwt.claim.sub',b::text,true);perform public.detours_accept_invite(received->>'token');
  received:=public.detours_get_trip(trip);if received::text like '%COMMON_NOTE%' or received::text like '%DOCUMENT_SECRET%' then raise exception 'Legacy private data changed';end if;
  if jsonb_array_length(public.detours_roster(trip))<>2 then raise exception 'Roster missing participants';end if;
  if exists(select 1 from jsonb_array_elements(public.detours_roster(trip)) p where p->>'email' is null) then raise exception 'Roster email missing';end if;
  denied:=false;begin perform public.detours_enable_full_share(trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Member can enable full sharing';end if;
  perform set_config('request.jwt.claim.sub',a::text,true);perform public.detours_enable_full_share(trip);
  perform set_config('request.jwt.claim.sub',b::text,true);
  received:=public.detours_get_trip(trip);if received#>>'{content,private,notes,general}'<>'COMMON_NOTE' or received#>>'{content,private,documents,0,content}'<>'DOCUMENT_SECRET' or received#>>'{content,private,budget}'<>'123' then raise exception 'Common details differ from owner';end if;
  if received->>'fullSharing'<>'true' then raise exception 'Full sharing metadata absent';end if;
  denied:=false;begin perform public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,received->'content','reader-'||trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Reader can edit common details';end if;
  execute 'reset role';update detours_private.settings set editors_enabled=true where id;execute 'set local role authenticated';
  perform set_config('request.jwt.claim.sub',a::text,true);perform public.detours_set_member(trip,b,'editor');
  perform set_config('request.jwt.claim.sub',b::text,true);
  content:=jsonb_set(received->'content','{private,notes,general}','"COMMON_EDITOR_NOTE"');
  saved:=public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,content,'editor-'||trip);
  if saved->>'status'<>'saved' then raise exception 'Common editor save failed';end if;
  if public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,content,'editor-'||trip) <> saved then raise exception 'Common retry not idempotent';end if;
  if public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,content,'stale-'||trip)->>'status'<>'conflict' then raise exception 'Concurrent note overwrite not detected';end if;
  perform set_config('request.jwt.claim.sub',a::text,true);received:=public.detours_get_trip(trip);if received#>>'{content,private,notes,general}'<>'COMMON_EDITOR_NOTE' then raise exception 'Owner does not see editor note';end if;
  perform public.detours_set_share_fields(trip,b,array['notes','reservations','budget','preparation']);
  perform set_config('request.jwt.claim.sub',b::text,true);received:=public.detours_get_trip(trip);if received::text like '%DOCUMENT_SECRET%' or received#>'{content,private,documents}' is not null then raise exception 'Masked document leaked';end if;
  denied:=false;begin perform public.detours_set_share_fields(trip,a,array[]::text[]);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Member can change category permissions';end if;
  content:=jsonb_set(received->'content','{private,documents}','[{"id":"bad","title":"Attack","content":"OVERWRITE_HIDDEN"}]');
  saved:=public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,content,'masked-attempt-'||trip);
  if saved->>'status'<>'saved' then raise exception 'Visible edit rejected';end if;
  perform set_config('request.jwt.claim.sub',a::text,true);received:=public.detours_get_trip(trip);if received#>>'{content,private,documents,0,content}'<>'DOCUMENT_SECRET' then raise exception 'Hidden canonical document overwritten';end if;
  content:=jsonb_set(received->'content','{private,notes}','[]');
  denied:=false;begin perform public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,content,'malformed-'||trip);exception when others then denied:=true;end;if not denied then raise exception 'Malformed common details accepted';end if;
  for bad in select value from jsonb_array_elements('[{"budget":0},{"budget":1e400},{"budgetCurrency":"ZZZ"},{"packing":[{"id":"p","label":" ","packed":false}]},{"expenses":[{"id":"e","cityId":"","label":"Test","amount":1,"currency":"ZZZ","category":"other"}]}]'::jsonb) loop
    denied:=false;begin perform public.detours_save_trip(trip,(received->>'revision')::bigint,(received->>'private_revision')::bigint,jsonb_set(received->'content','{private}',(received#>'{content,private}')||bad),'invalid-'||gen_random_uuid()::text);exception when others then denied:=true;end;
    if not denied then raise exception 'Invalid shared amount/currency/text accepted';end if;
  end loop;
  perform public.detours_set_member(trip,b,'remove');perform set_config('request.jwt.claim.sub',b::text,true);
  denied:=false;begin perform public.detours_get_trip(trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Revoked member can read common details';end if;
  denied:=false;begin perform public.detours_roster(trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Revoked member can read roster';end if;
  if exists(select 1 from public.detours_personal where trip_id=trip and user_id=a) then raise exception 'Canonical details exposed through table RLS';end if;
  execute 'reset role';
  if has_function_privilege('anon','public.detours_roster(text)','EXECUTE') or has_function_privilege('anon','public.detours_enable_full_share(text)','EXECUTE') then raise exception 'Anonymous RPC permissions';end if;
end $check$;
