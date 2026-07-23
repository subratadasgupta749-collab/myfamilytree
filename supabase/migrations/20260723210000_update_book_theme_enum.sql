-- Update book_manuscripts theme column to TEXT to support all 12 unique templates without enum restrictions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'book_manuscripts' AND column_name = 'theme'
  ) THEN
    ALTER TABLE public.book_manuscripts ALTER COLUMN theme TYPE TEXT USING theme::text;
    ALTER TABLE public.book_manuscripts ALTER COLUMN theme SET DEFAULT 'classic';
  END IF;
END $$;
