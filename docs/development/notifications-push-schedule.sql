select cron.schedule('detours-notifications-push','* * * * *',$worker$
 select net.http_post(
  url:='https://ehvgecfakbxeatrcnfhm.supabase.co/functions/v1/notifications',
  headers:=jsonb_build_object('Content-Type','application/json','x-notification-secret',(select decrypted_secret::jsonb->>'NOTIFICATION_WORKER_SECRET' from vault.decrypted_secrets where name='detours_notification_worker')),
  body:=jsonb_build_object('offset',((floor(extract(epoch from now())/60)::bigint % greatest(1,(select ceil(count(*)/500.0)::bigint from public.detours_notification_preferences)))*500)),
  timeout_milliseconds:=20000
 )
 where (select enabled and push and not email from detours_private.notification_config where id)
 and exists(select 1 from public.detours_notification_preferences p where p.preferences->>'followed'='true' and (p.preferences->>'activityPush'='true' or p.preferences->>'recapPush'='true'))
 and exists(select 1 from public.detours_push_devices where enabled);
$worker$);
