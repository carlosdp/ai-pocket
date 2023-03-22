alter table saved_contents add column storage_key varchar;

create table videos (
  id uuid primary key default gen_random_uuid(),
  storage_key varchar not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);