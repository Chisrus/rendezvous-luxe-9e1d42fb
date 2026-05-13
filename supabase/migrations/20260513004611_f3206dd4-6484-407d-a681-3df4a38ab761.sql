
CREATE POLICY "Users can upload own profile photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos'
  AND (name LIKE auth.uid()::text || '-%' OR name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "Users can update own profile photo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (name LIKE auth.uid()::text || '-%' OR name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "Users can delete own profile photo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'profile-photos'
  AND (name LIKE auth.uid()::text || '-%' OR name LIKE auth.uid()::text || '/%')
);
