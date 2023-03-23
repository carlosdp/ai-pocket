delete from saved_contents;

alter table saved_contents add column user_id uuid references auth.users(id) not null;
alter table saved_contents add column storage_key varchar;

create table videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  storage_key varchar not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);