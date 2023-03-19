create table saved_contents (
  id uuid primary key default gen_random_uuid(),
  url varchar not null,
  story jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

insert into storage.buckets (id, name) values ('assets', 'assets');