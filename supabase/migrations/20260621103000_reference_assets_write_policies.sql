drop policy if exists "reference assets authenticated upload" on storage.objects;
create policy "reference assets authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'reference-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "reference assets authenticated update" on storage.objects;
create policy "reference assets authenticated update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'reference-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'reference-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "reference assets authenticated delete" on storage.objects;
create policy "reference assets authenticated delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'reference-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
