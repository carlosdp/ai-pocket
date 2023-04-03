alter table bookmarks drop constraint bookmarks_user_id_url_key;

-- function that sets the "deleted_at" column to now() on a bookmark, by url, if it shows up in the queued_bookmarks view
create or replace function delete_bookmark_by_url(url_to_remove text) returns void as $$
begin
  update bookmarks
  set deleted_at = now()
  where url = $1
  and id in (select id from queued_bookmarks where user_id = auth.uid());
end;
$$ language plpgsql security definer;

create or replace view queued_bookmarks as 
  select 
    bk.*
  from 
    bookmarks bk
  where 
    bk.deleted_at is null and
    bk.user_id not in (
      select 
        b.user_id
      from 
        briefings b
        cross join lateral jsonb_array_elements(b.contents) as c(content)
      where 
        (c.content->>'id')::uuid = bk.id
    );