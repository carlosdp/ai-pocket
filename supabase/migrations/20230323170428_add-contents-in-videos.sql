alter table videos add column contents jsonb not null; 
alter table videos alter column storage_key drop not null;

alter table saved_contents add constraint saved_contents_user_id_url_key unique (user_id, url);