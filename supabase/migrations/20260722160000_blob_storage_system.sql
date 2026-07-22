-- Migration for Blob Storage System
CREATE TABLE IF NOT EXISTS public.blob_storage_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id TEXT NOT NULL DEFAULT 'media',
  file_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  is_public BOOLEAN NOT NULL DEFAULT true,
  storage_provider TEXT NOT NULL DEFAULT 'supabase_storage',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast bucket and path lookups
CREATE INDEX IF NOT EXISTS idx_blob_storage_bucket ON public.blob_storage_files(bucket_id);
CREATE INDEX IF NOT EXISTS idx_blob_storage_created ON public.blob_storage_files(created_at DESC);

-- RLS
ALTER TABLE public.blob_storage_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to blob_storage_files" ON public.blob_storage_files
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read public blob files" ON public.blob_storage_files
  FOR SELECT TO authenticated
  USING (is_public = true OR created_by = auth.uid());
