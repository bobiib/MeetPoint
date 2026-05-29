do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'meetpoint_web') then
    create role meetpoint_web nologin;
  end if;
end;
$$;

grant usage on schema api to meetpoint_web;

grant select, insert on api.users to meetpoint_web;
grant select, insert, update on api.groups to meetpoint_web;
grant select, insert on api.appointments to meetpoint_web;

grant select, insert, delete on api.group_members to meetpoint_web;

grant select on
  api.interests,
  api.activities,
  api.availabilities
to meetpoint_web;

grant execute on function api.insert_user() to meetpoint_web;
