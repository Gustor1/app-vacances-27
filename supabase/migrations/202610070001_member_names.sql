-- Labels help the owner assign the right access to each invited friend.
-- Only the owner can read them; emails and other Auth metadata are never returned.
begin;
create function public.detours_list_members(p_trip text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.detours_role(p_trip) is distinct from 'owner' then
    raise exception 'Only the owner can list member names' using errcode='42501';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'user_id',m.user_id,'role',m.role,
      'display_name',left(coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
        nullif(btrim(u.raw_user_meta_data->>'name'),''),'Membre'),80)) order by m.user_id),'[]'::jsonb)
    from public.detours_members m join auth.users u on u.id=m.user_id where m.trip_id=p_trip
  );
end $$;
revoke execute on function public.detours_list_members(text) from public, anon;
grant execute on function public.detours_list_members(text) to authenticated;
commit;
