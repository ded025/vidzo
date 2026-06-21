insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reference-assets',
  'reference-assets',
  true,
  2500000,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "reference assets public read" on storage.objects;
create policy "reference assets public read"
on storage.objects for select
using (bucket_id = 'reference-assets');

drop policy if exists "reference assets authenticated upload" on storage.objects;
create policy "reference assets authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'reference-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
