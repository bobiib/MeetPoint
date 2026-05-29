select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'app'
order by
  tc.table_name,
  kcu.column_name;

select
  g.name as group_name,
  u.username as owner_username
from app.groups g
join app.users u
  on u.id = g.owner_id;

select
  gm.group_id,
  gm.user_id,
  gm.role
from app.group_members gm
join app.groups g
  on g.id = gm.group_id
join app.users u
  on u.id = gm.user_id;
