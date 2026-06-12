create schema if not exists app;
create schema if not exists api;

create extension if not exists pgcrypto;

create table if not exists app.users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_length check (char_length(trim(username)) >= 2),
  constraint users_email_unique unique (email),
  constraint users_username_unique unique (username),
  constraint users_email_format check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists app.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null references app.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_name_length check (char_length(trim(name)) >= 2)
);

create table if not exists app.group_members (
  group_id uuid not null references app.groups(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (group_id, user_id),
  constraint group_members_role_valid check (role in ('owner', 'admin', 'member'))
);

create table if not exists app.interests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references app.groups(id) on delete cascade,
  name text not null,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint interests_name_length check (char_length(trim(name)) >= 2),
  constraint interests_group_name_unique unique (group_id, name)
);

create table if not exists app.activities (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references app.groups(id) on delete cascade,
  title text not null,
  description text,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_title_length check (char_length(trim(title)) >= 2)
);

create table if not exists app.activity_interests (
  activity_id uuid not null references app.activities(id) on delete cascade,
  interest_id uuid not null references app.interests(id) on delete cascade,
  primary key (activity_id, interest_id)
);

create table if not exists app.appointments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references app.activities(id) on delete cascade,
  starts_at timestamptz not null,
  description text,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists app.availabilities (
  appointment_id uuid not null references app.appointments(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  is_available boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (appointment_id, user_id)
);

create index if not exists idx_groups_owner_id on app.groups(owner_id);
create index if not exists idx_group_members_user_id on app.group_members(user_id);
create index if not exists idx_interests_group_id on app.interests(group_id);
create index if not exists idx_activities_group_id on app.activities(group_id);
create index if not exists idx_activity_interests_interest_id on app.activity_interests(interest_id);
create index if not exists idx_appointments_activity_id on app.appointments(activity_id);
create index if not exists idx_availabilities_user_id on app.availabilities(user_id);

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on app.users;
create trigger set_users_updated_at
before update on app.users
for each row execute function app.set_updated_at();

drop trigger if exists set_groups_updated_at on app.groups;
create trigger set_groups_updated_at
before update on app.groups
for each row execute function app.set_updated_at();

drop trigger if exists set_activities_updated_at on app.activities;
create trigger set_activities_updated_at
before update on app.activities
for each row execute function app.set_updated_at();

drop trigger if exists set_availabilities_updated_at on app.availabilities;
create trigger set_availabilities_updated_at
before update on app.availabilities
for each row execute function app.set_updated_at();

create or replace view api.users as
select
  id,
  username,
  email,
  null::text as password,
  created_at
from app.users;

create or replace function api.insert_user()
returns trigger
language plpgsql
security definer
set search_path = app, public
as $$
begin
  if new.password is null or char_length(new.password) < 8 then
    raise exception 'Password must contain at least 8 characters';
  end if;

  insert into app.users (username, email, password_hash)
  values (
    trim(new.username),
    lower(trim(new.email)),
    crypt(new.password, gen_salt('bf'))
  )
  returning id, username, email, created_at
  into new.id, new.username, new.email, new.created_at;

  new.password = null;
  return new;
end;
$$;

drop trigger if exists insert_user on api.users;
create trigger insert_user
instead of insert on api.users
for each row execute function api.insert_user();

create or replace function app.add_group_owner_member()
returns trigger
language plpgsql
as $$
begin
  insert into app.group_members (group_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (group_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists add_group_owner_member on app.groups;
create trigger add_group_owner_member
after insert on app.groups
for each row execute function app.add_group_owner_member();

create or replace view api.groups as
select id, name, description, owner_id, created_at, updated_at
from app.groups;

create or replace view api.group_members as
select group_id, user_id, role, created_at
from app.group_members;

create or replace view api.interests as
select id, group_id, name, created_by, created_at
from app.interests;

create or replace view api.activities as
select id, group_id, title, description, created_by, created_at, updated_at
from app.activities;

create or replace view api.appointments as
select id, activity_id, starts_at, description, created_by, created_at
from app.appointments;

create or replace view api.availabilities as
select appointment_id, user_id, is_available, created_at, updated_at
from app.availabilities;

create or replace view api.activity_interests as
select activity_id, interest_id
from app.activity_interests;
