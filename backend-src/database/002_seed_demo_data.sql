insert into app.users (username, email, password_hash)
values
  ('boris', 'boris@example.com', crypt('MeetPoint123', gen_salt('bf'))),
  ('dmytro', 'dmytro@example.com', crypt('MeetPoint123', gen_salt('bf'))),
  ('fabio', 'fabio@example.com', crypt('MeetPoint123', gen_salt('bf'))),
  ('noel', 'noel@example.com', crypt('MeetPoint123', gen_salt('bf')))
on conflict (email) do nothing;

with boris as (
  select id
  from app.users
  where email = 'boris@example.com'
),
demo_group as (
  insert into app.groups (name, description, owner_id)
  select 'Demo Gruppe', 'Beispielgruppe fuer MeetPoint', id
  from boris
  where not exists (
    select 1
    from app.groups
    where name = 'Demo Gruppe'
  )
  returning id
)
insert into app.activities (group_id, title, description, created_by)
select
  coalesce((select id from demo_group), (select id from app.groups where name = 'Demo Gruppe' limit 1)),
  'Kinoabend',
  'Gemeinsame Aktivitaet zum Testen der Terminplanung',
  (select id from boris)
where not exists (
  select 1
  from app.activities
  where title = 'Kinoabend'
);
