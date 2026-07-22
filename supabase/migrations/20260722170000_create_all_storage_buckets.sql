-- Migration to ensure all storage buckets exist in Supabase storage schema
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('book-exports', 'book-exports', false, 104857600, NULL),
  ('photos', 'photos', true, 26214400, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('blog-images', 'blog-images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('media', 'media', true, 52428800, NULL),
  ('documents', 'documents', false, 104857600, NULL),
  ('covers', 'covers', true, 26214400, NULL),
  ('manuscripts', 'manuscripts', false, 104857600, NULL),
  ('exports', 'exports', false, 209715200, NULL),
  ('avatars', 'avatars', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('support-attachments', 'support-attachments', false, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public;

-- Ensure RLS policies for storage.objects on book-exports bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can select own book exports'
  ) THEN
    CREATE POLICY "Users can select own book exports" ON storage.objects
      FOR SELECT TO authenticated
      USING (bucket_id = 'book-exports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can insert own book exports'
  ) THEN
    CREATE POLICY "Users can insert own book exports" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'book-exports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own book exports'
  ) THEN
    CREATE POLICY "Users can delete own book exports" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'book-exports' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
