insert into app.users (username, email, password_hash)
values
  ('boris', 'boris@example.com', crypt('MeetPoint123', gen_salt('bf'))),
  ('dmytro', 'dmytro@example.com', crypt('MeetPoint123', gen_salt('bf')))
on conflict (email) do nothing;

insert into app.groups (name, description, owner_id)
select 'Demo Gruppe', 'Beispielgruppe fuer MeetPoint', id
from app.users
where email = 'boris@example.com'
on conflict do nothing;
