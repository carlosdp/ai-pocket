create view queued_contents as 
  select 
    sc.*
  from 
    saved_contents sc
  where 
    sc.user_id not in (
      select 
        v.user_id
      from 
        videos v
        cross join lateral jsonb_array_elements(v.contents) as c(content)
      where 
        (c.content->>'id')::uuid = sc.id
    );