create or replace function api.delete_activity(
  p_activity_id uuid,
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
  select g.owner_id, a.created_by
  into v_group_owner_id, v_created_by
  from app.activities a
  join app.groups g on a.group_id = g.id
  where a.id = p_activity_id;

  if not found then
    raise exception 'Activity not found';
  end if;

  if p_user_id = v_group_owner_id or p_user_id = v_created_by then
    delete from app.activities where id = p_activity_id;
  else
    raise exception 'Permission denied: Only group owner or activity creator can delete this activity';
  end if;
end;
$$;

create or replace function api.delete_appointment(
  p_appointment_id uuid,
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
  select g.owner_id, a.created_by
  into v_group_owner_id, v_created_by
  from app.appointments a
  join app.activities act on a.activity_id = act.id
  join app.groups g on act.group_id = g.id
  where a.id = p_appointment_id;

  if not found then
    raise exception 'Appointment not found';
  end if;

  if p_user_id = v_group_owner_id or p_user_id = v_created_by then
    delete from app.appointments where id = p_appointment_id;
  else
    raise exception 'Permission denied: Only group owner or appointment creator can delete this appointment';
  end if;
end;
$$;
