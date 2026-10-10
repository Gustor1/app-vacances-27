-- Optional encrypted configuration for deployments managed through the connector.
-- No secret value or scheduled job belongs to migration history.
begin;
create or replace function public.detours_notification_worker_configuration()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare configuration jsonb;
begin
 if to_regclass('vault.decrypted_secrets') is null then return '{}'::jsonb; end if;
 execute 'select decrypted_secret::jsonb from vault.decrypted_secrets where name = $1'
 into configuration using 'detours_notification_worker';
 return coalesce(configuration,'{}'::jsonb);
end $$;
revoke all on function public.detours_notification_worker_configuration() from public,anon,authenticated;
grant execute on function public.detours_notification_worker_configuration() to service_role;
commit;
