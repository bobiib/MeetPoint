do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'meetpoint_web') then
    create role meetpoint_web nologin;
  end if;
end;
$$;

grant usage on schema api to meetpoint_web;

grant select, insert on api.users to meetpoint_web;
grant select on
  api.groups,
  api.group_members,
  api.interests,
  api.activities,
  api.appointments,
  api.availabilities
to meetpoint_web;

grant execute on function api.insert_user() to meetpoint_web;
