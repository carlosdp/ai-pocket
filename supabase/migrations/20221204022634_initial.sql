create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  url varchar not null,
  title varchar,
  screenshot_key varchar,
  story jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  contents jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table bookmarks add constraint bookmarks_user_id_url_key unique (user_id, url);

insert into storage.buckets (id, name) values ('assets', 'assets');
create policy "Public story assets" on storage.objects for select using (bucket_id = 'assets');

create view queued_bookmarks as 
  select 
    bk.*
  from 
    bookmarks bk
  where 
    bk.user_id not in (
      select 
        b.user_id
      from 
        briefings b
        cross join lateral jsonb_array_elements(b.contents) as c(content)
      where 
        (c.content->>'id')::uuid = bk.id
    );

create view users as select id, email from auth.users;

create or replace function briefing_by_id(id uuid) returns briefings as $$
  select * from briefings where id = $1
$$ language sql stable security definer;

create or replace function bookmark_by_id(id uuid) returns bookmarks as $$
  select * from bookmarks where id = $1
$$ language sql stable security definer;

-- postgres function to get bookmarks for a briefing id
create or replace function briefing_bookmarks(briefing_id uuid) returns setof bookmarks as $$
  select 
    b.*
  from 
    bookmarks b
    cross join lateral jsonb_array_elements((select briefing.contents from briefing_by_id(briefing_id) as briefing)) as c(content)
  where 
    (c.content->>'id')::uuid = b.id
$$ language sql stable security definer;

alter table bookmarks enable row level security;
create policy "Bookmarks are private" on bookmarks for select using (user_id = auth.uid());

alter table briefings enable row level security;
create policy "Briefings are private" on briefings for select using (user_id = auth.uid());
