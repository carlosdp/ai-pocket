drop policy "Public assets" on storage.objects;
create policy "Public assets" on storage.objects for select using (bucket_id = 'assets' and lower((storage.foldername(name))[2]) = 'stories');

alter table videos add column screenshot_storage_key varchar;