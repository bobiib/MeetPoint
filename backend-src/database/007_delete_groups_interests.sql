create or replace function api.delete_group(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = app, public
as $$
declare
  v_owner_id uuid;
begin
  select owner_id
  into v_owner_id
  from app.groups
  where id = p_group_id;

  if not found then
    raise exception 'Group not found';
  end if;

  if p_user_id = v_owner_id then
    delete from app.groups where id = p_group_id;
  else
    raise exception 'Permission denied: Only group owner can delete this group';
  end if;
end;
$$;

create or replace function api.delete_interest(
  p_interest_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = app, public
as $$
declare
  v_group_owner_id uuid;
  v_created_by uuid;
begin
  select g.owner_id, i.created_by
  into v_group_owner_id, v_created_by
  from app.interests i
  join app.groups g on i.group_id = g.id
  where i.id = p_interest_id;

  if not found then
    raise exception 'Interest not found';
  end if;

  if p_user_id = v_group_owner_id or p_user_id = v_created_by then
    delete from app.interests where id = p_interest_id;
  else
    raise exception 'Permission denied: Only group owner or interest creator can delete this interest';
  end if;
end;
$$;
