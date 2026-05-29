create or replace function api.login_user(
  user_email text,
  user_password text
)
returns table (
  id uuid,
  username text,
  email text
)
language plpgsql
security definer
set search_path = app, public
as $$
begin
  return query
  select
    u.id,
    u.username,
    u.email
  from app.users u
  where lower(u.email) = lower(trim(user_email))
    and u.password_hash = crypt(user_password, u.password_hash);

  if not found then
    raise exception 'Invalid email or password';
  end if;
end;
$$;

grant execute on function api.login_user(text, text) to meetpoint_web;