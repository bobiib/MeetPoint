do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'meetpoint_web') then
    create role meetpoint_web nologin;
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'meetpoint') then
    grant meetpoint_web to meetpoint;
  end if;
end;
$$;

grant usage on schema api to meetpoint_web;
grant usage on schema app to meetpoint_web;

grant select, insert on api.users to meetpoint_web;
grant select, insert, update on api.groups to meetpoint_web;
grant select, insert on api.appointments to meetpoint_web;
grant select on api.activities to meetpoint_web;
grant select, insert on api.interests to meetpoint_web;
grant select, insert, update on api.availabilities to meetpoint_web;

grant select, insert, delete on api.group_members to meetpoint_web;

grant execute on function api.insert_user() to meetpoint_web;

grant select, insert, update on app.groups to meetpoint_web;
grant select, insert, delete on app.group_members to meetpoint_web;
grant select, insert on app.appointments to meetpoint_web;
grant select, insert on app.interests to meetpoint_web;
grant select, insert, update on app.availabilities to meetpoint_web;
grant select on app.users, app.activities to meetpoint_web;
