-- Release verification on the beta database. Requires two existing Auth users.
-- Uses authenticated permissions; all fixture data is rolled back.
begin;
do $test$
declare
 a uuid; b uuid; trip text:='release-money-check-'||gen_random_uuid()::text;
 content jsonb; r jsonb; before jsonb; invite jsonb; old_token text; denied boolean;
begin
 select id into a from auth.users order by created_at,id limit 1;
 select id into b from auth.users order by created_at,id offset 1 limit 1;
 if a is null or b is null then raise exception 'Two users required'; end if;
 content:=jsonb_build_object('shared',jsonb_build_object('version',1,'journey',jsonb_build_object('id',trip,'title','Release fixture','currency','CNY'),'cities','[]'::jsonb,'notes','{}'::jsonb,'favorites','[]'::jsonb,'done','[]'::jsonb,'bookings','[]'::jsonb),
 'private','{"notes":{"general":"preserved contribution"},"expenses":[{"id":"expense","cityId":"","label":"Meal","amount":10,"currency":"EUR","category":"food","conversions":{"CNY":{"rate":7.5,"date":"2026-10-07","source":"manual"}}}],"rateQuotes":{"EUR":{"rate":7.5,"date":"2026-10-07","source":"manual"}},"budgetConversions":{"CNY":{"rate":1,"date":"2026-10-07","source":"manual"}}}'::jsonb);
 execute 'set local role authenticated';
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 r:=public.detours_save_trip(trip,0,0,content,'initial-'||trip);
 if r->>'status'<>'saved' then raise exception 'Create failed';end if;
 perform public.detours_enable_full_share(trip);
 denied:=false;begin perform public.detours_leave_trip(trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Owner can leave';end if;
 invite:=public.detours_invite(trip);old_token:=invite->>'token';
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 perform public.detours_accept_invite(old_token);
 r:=public.detours_get_trip(trip);
 if r#>>'{content,private,expenses,0,conversions,CNY,rate}'<>'7.5' then raise exception 'Expense conversion lost';end if;
 denied:=false;begin perform public.detours_set_member(trip,a,'reader');exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Reader manages roles';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.detours_set_member(trip,b,'editor');
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 r:=public.detours_get_trip(trip);
 content:=jsonb_set(r->'content','{private,notes,general}','"kept editor contribution"');
 if public.detours_save_trip(trip,(r->>'revision')::bigint,(r->>'private_revision')::bigint,content,'editor-'||trip)->>'status'<>'saved' then raise exception 'Editor failed';end if;
 r:=public.detours_get_trip(trip);
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.detours_set_member(trip,b,'reader');
 before:=public.detours_get_trip(trip);
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 denied:=false;begin perform public.detours_save_trip(trip,(r->>'revision')::bigint,(r->>'private_revision')::bigint,r->'content','stale-'||trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Demoted editor saves stale page';end if;
 perform public.detours_leave_trip(trip);
 denied:=false;begin perform public.detours_get_trip(trip);exception when insufficient_privilege then denied:=true;end;if not denied then raise exception 'Former member reads';end if;
 denied:=false;begin perform public.detours_accept_invite(old_token);exception when others then denied:=true;end;if not denied then raise exception 'Old link rejoins';end if;
 if exists(select 1 from jsonb_array_elements(public.detours_list_trips()) t where t->>'id'=trip) then raise exception 'Trip stays listed';end if;
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 if public.detours_get_trip(trip)<>before then raise exception 'Owner data changed';end if;
 invite:=public.detours_invite(trip);
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 perform public.detours_accept_invite(invite->>'token');
 if public.detours_get_trip(trip)->>'role'<>'reader' then raise exception 'Rejoin role wrong';end if;
 -- Also leave as editor.
 perform set_config('request.jwt.claim.sub',a::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',a,'role','authenticated')::text,true);
 perform public.detours_set_member(trip,b,'editor');
 perform set_config('request.jwt.claim.sub',b::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',b,'role','authenticated')::text,true);
 perform public.detours_leave_trip(trip);
 execute 'reset role';
end $test$;
rollback;
