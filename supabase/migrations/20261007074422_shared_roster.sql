-- Only current members of this private trip can see its participant identities.
-- Authorization relies on membership, never on editable profile metadata.
begin;
create function public.detours_roster(p_trip text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or public.detours_role(p_trip) is null
    or not exists(select 1 from public.detours_trips where id=p_trip and not deleted) then
    raise exception 'Trip access required' using errcode='42501';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'user_id',people.user_id,'role',people.role,'email',u.email,
      'display_name',left(coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
        nullif(btrim(u.raw_user_meta_data->>'name'),''),'Membre'),80))
      order by case when people.role='owner' then 0 else 1 end,people.user_id),'[]'::jsonb)
    from (
      select owner_id as user_id,'owner'::text as role from public.detours_trips where id=p_trip
      union all
      select user_id,role from public.detours_members where trip_id=p_trip
    ) people join auth.users u on u.id=people.user_id
  );
end $$;
revoke execute on function public.detours_roster(text) from public,anon;
grant execute on function public.detours_roster(text) to authenticated;
commit;
