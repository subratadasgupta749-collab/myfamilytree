
-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- app_role enum + user_roles
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

-- auto-create profile + default 'user' role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;

  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;

CREATE TYPE public.book_status AS ENUM ('draft', 'in_progress', 'completed');

CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT,
  gender TEXT,
  date_of_birth DATE,
  country TEXT,
  relationship TEXT,
  status public.book_status NOT NULL DEFAULT 'draft',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.books TO authenticated;
GRANT ALL ON public.books TO service_role;

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books" ON public.books FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON public.books FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON public.books FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON public.books FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX books_user_id_updated_at_idx ON public.books (user_id, updated_at DESC);

CREATE TRIGGER update_books_updated_at
BEFORE UPDATE ON public.books
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TYPE public.topic_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE public.interview_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  status public.topic_status NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, topic)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_topics TO authenticated;
GRANT ALL ON public.interview_topics TO service_role;

ALTER TABLE public.interview_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interview topics" ON public.interview_topics
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id AND b.user_id = auth.uid()));

CREATE TRIGGER update_interview_topics_updated_at
BEFORE UPDATE ON public.interview_topics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.interview_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  position INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, topic, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_qa TO authenticated;
GRANT ALL ON public.interview_qa TO service_role;

ALTER TABLE public.interview_qa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own interview qa" ON public.interview_qa
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id AND b.user_id = auth.uid()));

CREATE INDEX interview_qa_book_topic_idx ON public.interview_qa (book_id, topic, position);

CREATE TRIGGER update_interview_qa_updated_at
BEFORE UPDATE ON public.interview_qa
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Photo category enum
CREATE TYPE public.photo_category AS ENUM ('baby','school','wedding','career','family','retirement');

-- Photos table
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  category public.photo_category NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  size_bytes BIGINT,
  width INT,
  height INT,
  mime_type TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX photos_book_id_idx ON public.photos(book_id);
CREATE INDEX photos_category_idx ON public.photos(book_id, category);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own photos" ON public.photos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER photos_updated_at
  BEFORE UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage RLS: user can access only their own folder in 'photos' bucket
-- Path convention: {user_id}/{book_id}/{uuid}.{ext}
CREATE POLICY "Users view own photo files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own photo files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own photo files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own photo files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE TYPE public.book_theme AS ENUM ('classic', 'vintage', 'modern', 'leather_journal', 'family_album');

CREATE TABLE public.book_manuscripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL UNIQUE REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme public.book_theme NOT NULL DEFAULT 'classic',
  introduction TEXT NOT NULL DEFAULT '',
  ending TEXT NOT NULL DEFAULT '',
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_manuscripts TO authenticated;
GRANT ALL ON public.book_manuscripts TO service_role;

ALTER TABLE public.book_manuscripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own manuscripts" ON public.book_manuscripts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_book_manuscripts_updated_at
  BEFORE UPDATE ON public.book_manuscripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  position INT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  narrative TEXT NOT NULL DEFAULT '',
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  quotes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, topic)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_chapters TO authenticated;
GRANT ALL ON public.book_chapters TO service_role;

ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own chapters" ON public.book_chapters
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_book_chapters_updated_at
  BEFORE UPDATE ON public.book_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX book_chapters_book_id_position_idx ON public.book_chapters(book_id, position);

-- book exports table
CREATE TYPE public.export_kind AS ENUM ('pdf', 'docx', 'print_pdf');

CREATE TABLE public.book_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.export_kind NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_exports TO authenticated;
GRANT ALL ON public.book_exports TO service_role;

ALTER TABLE public.book_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own exports"
  ON public.book_exports FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX book_exports_book_id_idx ON public.book_exports(book_id, created_at DESC);

-- storage.objects policies for the book-exports bucket
CREATE POLICY "Users read their own book exports"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'book-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users write their own book exports"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'book-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete their own book exports"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'book-exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enum for mode
DO $$ BEGIN
  CREATE TYPE public.gateway_mode AS ENUM ('sandbox','live');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending','processing','succeeded','failed','refunded','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- payment_gateways
CREATE TABLE public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  logo_url text,
  enabled boolean NOT NULL DEFAULT false,
  mode public.gateway_mode NOT NULL DEFAULT 'sandbox',
  credentials_encrypted text,
  webhook_secret_encrypted text,
  success_url text,
  cancel_url text,
  currency text NOT NULL DEFAULT 'USD',
  country_restriction text[] NOT NULL DEFAULT '{}',
  payment_instructions text,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  webhook_verified boolean NOT NULL DEFAULT false,
  last_webhook_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gateways" ON public.payment_gateways FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_payment_gateways_updated BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- gateway_settings (extra key/value pairs, not encrypted; use for non-secrets)
CREATE TABLE public.gateway_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid NOT NULL REFERENCES public.payment_gateways(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(gateway_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gateway_settings TO authenticated;
GRANT ALL ON public.gateway_settings TO service_role;
ALTER TABLE public.gateway_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage gateway settings" ON public.gateway_settings FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_gateway_settings_updated BEFORE UPDATE ON public.gateway_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- payment_transactions
CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gateway_id uuid REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  gateway_slug text,
  external_id text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status public.transaction_status NOT NULL DEFAULT 'pending',
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.payment_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage transactions" ON public.payment_transactions FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- webhook_logs
CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  gateway_slug text NOT NULL,
  event_type text,
  headers jsonb,
  payload jsonb,
  verified boolean NOT NULL DEFAULT false,
  processed boolean NOT NULL DEFAULT false,
  error text,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view webhook logs" ON public.webhook_logs FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- payment_logs
CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  gateway_slug text,
  level text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_logs TO authenticated;
GRANT ALL ON public.payment_logs TO service_role;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view payment logs" ON public.payment_logs FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- refund_logs
CREATE TABLE public.refund_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  external_id text,
  reason text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.refund_logs TO authenticated;
GRANT ALL ON public.refund_logs TO service_role;
ALTER TABLE public.refund_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage refunds" ON public.refund_logs FOR ALL
  TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_refunds_updated BEFORE UPDATE ON public.refund_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial gateways (disabled, no credentials)
INSERT INTO public.payment_gateways (slug, name, description, display_order, currency) VALUES
  ('lemonsqueezy', 'Lemon Squeezy', 'Merchant of record for digital products & subscriptions.', 1, 'USD'),
  ('wise', 'Wise', 'International bank transfers with low fees.', 2, 'USD'),
  ('payoneer', 'Payoneer', 'Global payment platform for freelancers & businesses.', 3, 'USD')
ON CONFLICT (slug) DO NOTHING;

-- Blog posts for Family History Book Blog (single fixed category)
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  featured_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  category TEXT NOT NULL DEFAULT 'Family History Book Blog',
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX blog_posts_published_idx ON public.blog_posts (published, published_at DESC);
CREATE INDEX blog_posts_slug_idx ON public.blog_posts (slug);

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON public.blog_posts FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can read all posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) between 1 and 100
    and length(email) between 3 and 255
    and length(message) between 10 and 2000
  );
CREATE POLICY "Admins read contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- App settings (admin-only key/value)
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('site', '{"name":"My Family History Book","tagline":"Turn your family''s memories into a book","support_email":"hello@myfamilyhistorybook.app"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_admin_for_manorhub()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) = 'manorhub533@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_manorhub ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_manorhub
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_manorhub();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_manorhub ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_manorhub
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_manorhub();

-- Grant now if the user already exists and is verified
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE lower(email) = 'manorhub533@gmail.com' AND email_confirmed_at IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;
REVOKE EXECUTE ON FUNCTION public.grant_admin_for_manorhub() FROM PUBLIC, anon, authenticated;

CREATE POLICY "Admins upload blog images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update blog images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete blog images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone reads blog images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images');

-- ============ AI PROVIDERS ============
CREATE TABLE public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  provider_type text NOT NULL DEFAULT 'openai_compatible', -- openai_compatible | gemini | anthropic
  enabled boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  api_key_encrypted text,
  base_url text,
  default_model text,
  system_prompt text,
  max_tokens integer,
  temperature numeric,
  top_p numeric,
  frequency_penalty numeric,
  presence_penalty numeric,
  timeout_ms integer NOT NULL DEFAULT 60000,
  retry_attempts integer NOT NULL DEFAULT 2,
  priority integer NOT NULL DEFAULT 100,
  monthly_budget numeric,
  daily_token_limit integer,
  status text NOT NULL DEFAULT 'unknown', -- unknown | ok | error
  last_tested_at timestamptz,
  last_test_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX ai_providers_single_default
  ON public.ai_providers ((is_default)) WHERE is_default;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_providers TO authenticated;
GRANT ALL ON public.ai_providers TO service_role;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage providers" ON public.ai_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_providers_updated
  BEFORE UPDATE ON public.ai_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AI MODELS ============
CREATE TABLE public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  name text NOT NULL,
  label text,
  is_default boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  max_tokens integer,
  temperature numeric,
  top_p numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_models TO authenticated;
GRANT ALL ON public.ai_models TO service_role;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage models" ON public.ai_models
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_models_updated
  BEFORE UPDATE ON public.ai_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AI PROMPTS ============
CREATE TABLE public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  system_prompt text,
  user_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT ALL ON public.ai_prompts TO service_role;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage prompts" ON public.ai_prompts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ai_prompts_updated
  BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AI REQUEST LOGS ============
CREATE TABLE public.ai_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  provider_slug text,
  model text,
  prompt_key text,
  user_id uuid,
  book_id uuid,
  status text NOT NULL, -- success | error
  response_time_ms integer,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_request_logs_created_idx ON public.ai_request_logs (created_at DESC);
CREATE INDEX ai_request_logs_provider_idx ON public.ai_request_logs (provider_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_request_logs TO authenticated;
GRANT ALL ON public.ai_request_logs TO service_role;
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read logs" ON public.ai_request_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete logs" ON public.ai_request_logs
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Views for convenience
CREATE VIEW public.ai_usage_logs
WITH (security_invoker = on) AS
  SELECT id, provider_id, provider_slug, model, prompt_key, user_id, book_id,
         response_time_ms, tokens_in, tokens_out, estimated_cost, created_at
  FROM public.ai_request_logs
  WHERE status = 'success';

CREATE VIEW public.ai_error_logs
WITH (security_invoker = on) AS
  SELECT id, provider_id, provider_slug, model, prompt_key, user_id, book_id,
         response_time_ms, error, created_at
  FROM public.ai_request_logs
  WHERE status = 'error';

GRANT SELECT ON public.ai_usage_logs TO authenticated;
GRANT SELECT ON public.ai_error_logs TO authenticated;

-- ============ SEED PROVIDERS ============
INSERT INTO public.ai_providers (slug, name, provider_type, base_url, default_model, temperature, max_tokens, priority) VALUES
  ('gemini',     'Google Gemini', 'gemini',            'https://generativelanguage.googleapis.com', 'gemini-2.5-flash', 0.7, 2048, 10),
  ('openai',     'OpenAI',         'openai_compatible', 'https://api.openai.com/v1',                 'gpt-4o-mini',     0.7, 2048, 20),
  ('openrouter', 'OpenRouter',     'openai_compatible', 'https://openrouter.ai/api/v1',              'openai/gpt-4o-mini', 0.7, 2048, 30),
  ('deepseek',   'DeepSeek',       'openai_compatible', 'https://api.deepseek.com',                  'deepseek-chat',   0.7, 2048, 40);

INSERT INTO public.ai_models (provider_id, name, is_default, enabled)
SELECT id, default_model, true, true FROM public.ai_providers;

-- ============ SEED PROMPTS ============
INSERT INTO public.ai_prompts (key, name, description, system_prompt, user_template) VALUES
 ('interview_question', 'Interview â€” Next Question',
  'Generates the next single interview question for a given topic.',
  'You are a warm, empathetic interviewer helping a family capture the life story of {{subject}}. You ask ONE thoughtful, open-ended question at a time on the current topic. Questions should feel personal and invite storytelling. NEVER repeat a question already asked. Do NOT number the question or add commentary â€” output only the question itself.',
  'Current topic: {{topic}}\n\nQuestions already asked on this topic (build on the answers, do not repeat):\n{{topic_qa}}\n\nQuestions asked in other topics (do not repeat):\n{{prior_questions}}\n\nGenerate the next single question for the "{{topic}}" topic. Output only the question.'),
 ('biography_chapter', 'Biography â€” Chapter',
  'Writes one memoir chapter from interview Q&A.',
  'You are a professional biographer writing a warm, literary family memoir about {{subject}}. Write flowing third-person narrative prose. Preserve authentic voice, dates, names, and places from the answers. Never invent facts. Output ONLY valid JSON â€” no prose outside JSON, no markdown fences.',
  'Write chapter {{index}} of {{total}} for the memoir. Topic: "{{topic}}".\n\nInterview material (source of truth):\n{{qa_text}}\n\nReturn JSON: { "title": "â€¦", "narrative": "400-700 words in paragraphs", "timeline": [ { "year": "â€¦", "event": "â€¦" } ], "quotes": [ "â€¦" ] }'),
 ('biography_intro', 'Biography â€” Introduction',
  'Writes the memoir introduction.',
  'You are a professional biographer. Output ONLY valid JSON.',
  'Write a warm 150-220 word Introduction to this memoir about {{subject}}. Topics present: {{overview}}. Return JSON: { "text": "..." }'),
 ('biography_ending', 'Biography â€” Ending',
  'Writes the closing message.',
  'You are a professional biographer. Output ONLY valid JSON.',
  'Write a heartfelt 120-200 word closing Ending Message for this memoir about {{subject}}, addressed to future family readers. Return JSON: { "text": "..." }'),
 ('photo_caption', 'Photo Caption',
  'Generates a short caption for a photo.',
  'You write short, warm, factual photo captions for a family memoir. Two sentences max.',
  'Category: {{category}}. Existing note: {{note}}. Write a caption.'),
 ('summary', 'Summary',
  'Summarises long text into a short paragraph.',
  'You write concise, faithful summaries.',
  'Summarise the following text in 3-5 sentences:\n\n{{text}}'),
 ('title_generator', 'Title Generator',
  'Generates a short evocative title.',
  'You generate short evocative titles. Output the title only.',
  'Generate a title (max 8 words) for the following content:\n\n{{text}}'),
 ('seo', 'SEO Meta',
  'Generates SEO meta title & description.',
  'You are an SEO copywriter. Output ONLY valid JSON.',
  'Content:\n{{text}}\n\nReturn JSON: { "meta_title": "â‰¤60 chars", "meta_description": "â‰¤160 chars" }');

CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  variables JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view email logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.email_templates (key, name, description, subject, html_body, text_body, variables) VALUES
('welcome', 'Welcome Email', 'Sent when a new user registers', 'Welcome to {{site_name}}, {{name}}!',
'<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8F2;color:#222"><h1 style="font-family:Fraunces,serif;color:#8B5E3C">Welcome, {{name}}!</h1><p>Thank you for joining <strong>{{site_name}}</strong>. We''re excited to help you preserve your family''s story.</p><p><a href="{{app_url}}/dashboard" style="display:inline-block;background:#8B5E3C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Go to Dashboard</a></p><p style="color:#666;font-size:13px;margin-top:32px">â€” The {{site_name}} Team</p></div>',
'Welcome, {{name}}! Thank you for joining {{site_name}}. Visit {{app_url}}/dashboard to begin.',
'["name","site_name","app_url"]'::jsonb),

('password_reset', 'Password Reset', 'Sent when user requests a password reset', 'Reset your {{site_name}} password',
'<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8F2;color:#222"><h1 style="font-family:Fraunces,serif;color:#8B5E3C">Reset your password</h1><p>Hi {{name}}, click the button below to reset your password. This link expires in 1 hour.</p><p><a href="{{reset_url}}" style="display:inline-block;background:#8B5E3C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Reset Password</a></p></div>',
'Hi {{name}}, reset your password: {{reset_url}}',
'["name","site_name","reset_url"]'::jsonb),

('order_confirmation', 'Order Confirmation', 'Sent after successful payment', 'Your {{site_name}} order is confirmed',
'<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8F2;color:#222"><h1 style="font-family:Fraunces,serif;color:#8B5E3C">Order Confirmed ðŸŽ‰</h1><p>Hi {{name}}, thank you for your purchase!</p><table style="width:100%;border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px 0;border-bottom:1px solid #eee">Order ID</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right"><code>{{order_id}}</code></td></tr><tr><td style="padding:8px 0;border-bottom:1px solid #eee">Amount</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">{{amount}}</td></tr></table><p><a href="{{app_url}}/dashboard" style="display:inline-block;background:#8B5E3C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">View Dashboard</a></p></div>',
'Order {{order_id}} confirmed for {{amount}}. Thank you, {{name}}!',
'["name","order_id","amount","site_name","app_url"]'::jsonb),

('contact_reply', 'Contact Reply', 'Manual reply to a contact form message', 'Re: {{subject}}',
'<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8F2;color:#222"><p>Hi {{name}},</p><div style="white-space:pre-wrap">{{message}}</div><p style="color:#666;font-size:13px;margin-top:32px">â€” The {{site_name}} Team</p></div>',
'Hi {{name}},\n\n{{message}}\n\nâ€” The {{site_name}} Team',
'["name","subject","message","site_name"]'::jsonb),

('book_ready', 'Book Ready for Download', 'Sent when export generation completes', 'Your book "{{book_title}}" is ready',
'<div style="font-family:Inter,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#FFF8F2;color:#222"><h1 style="font-family:Fraunces,serif;color:#8B5E3C">Your book is ready ðŸ“–</h1><p>Hi {{name}}, "<strong>{{book_title}}</strong>" has been generated and is ready to download.</p><p><a href="{{download_url}}" style="display:inline-block;background:#8B5E3C;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Download Book</a></p></div>',
'Hi {{name}}, your book "{{book_title}}" is ready: {{download_url}}',
'["name","book_title","download_url","site_name"]'::jsonb);

CREATE TYPE public.discount_type AS ENUM ('percent','fixed');

CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type public.discount_type NOT NULL DEFAULT 'percent',
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated can read active coupons" ON public.coupons FOR SELECT TO authenticated
  USING (active = true);

CREATE TRIGGER coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  reward_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users insert own referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = referrer_user_id);
CREATE POLICY "Admins update referrals" ON public.referrals FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete referrals" ON public.referrals FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER referrals_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX referrals_referrer_idx ON public.referrals(referrer_user_id);

ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL;

INSERT INTO public.email_templates (key, name, subject, html_body, text_body, variables, enabled)
VALUES
 ('admin_new_order','Admin: New order','New order â€” {{amount}} {{currency}} from {{customer_email}}',
  '<h2>New order received</h2><p><strong>Customer:</strong> {{customer_email}}</p><p><strong>Amount:</strong> {{amount}} {{currency}}</p><p><strong>Gateway:</strong> {{gateway}}</p><p><strong>Transaction:</strong> {{transaction_id}}</p><p><a href="{{app_url}}/admin/orders">View in dashboard</a></p>',
  'New order from {{customer_email}} â€” {{amount}} {{currency}} via {{gateway}}. Transaction: {{transaction_id}}',
  '["customer_email","amount","currency","gateway","transaction_id"]'::jsonb, true),
 ('admin_new_message','Admin: New contact message','New contact message from {{name}}',
  '<h2>New message</h2><p><strong>From:</strong> {{name}} &lt;{{email}}&gt;</p><p><strong>Subject:</strong> {{subject}}</p><blockquote>{{message}}</blockquote><p><a href="{{app_url}}/admin/messages">Reply from dashboard</a></p>',
  'From {{name}} <{{email}}>: {{subject}}

{{message}}',
  '["name","email","subject","message"]'::jsonb, true)
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.ai_providers (slug, name, provider_type, base_url, default_model, enabled, priority)
VALUES ('lovable', 'Lovable AI Gateway', 'lovable', 'https://ai.gateway.lovable.dev/v1', 'google/gemini-3-flash-preview', true, 5)
ON CONFLICT (slug) DO NOTHING;
ALTER TYPE public.book_theme ADD VALUE IF NOT EXISTS 'timeline_split';

CREATE POLICY "Authenticated users can upload their own avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = 'avatars');

CREATE POLICY "Authenticated users can update avatars they own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = 'avatars' AND owner = auth.uid());

CREATE POLICY "Authenticated users can delete avatars they own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND (storage.foldername(name))[1] = 'avatars' AND owner = auth.uid());

-- ============================================================
-- Enterprise AI Provider Management: schema extension
-- ============================================================

-- 1) Extend ai_providers
ALTER TABLE public.ai_providers
  ADD COLUMN IF NOT EXISTS organization_id text,
  ADD COLUMN IF NOT EXISTS project_id text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS weight integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS seed integer,
  ADD COLUMN IF NOT EXISTS supports_vision boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_reasoning boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_image_gen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_embedding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_speech boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_moderation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS supports_streaming boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_json_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_health_check timestamptz,
  ADD COLUMN IF NOT EXISTS last_latency_ms integer,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS key_rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS key_expires_at timestamptz;

-- 2) Extend ai_models
ALTER TABLE public.ai_models
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS context_window integer,
  ADD COLUMN IF NOT EXISTS cost_input_per_1k numeric(12,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_output_per_1k numeric(12,6) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supports_streaming boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS supports_json_mode boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- 3) Feature mapping
CREATE TABLE IF NOT EXISTS public.ai_feature_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  primary_provider_id uuid REFERENCES public.ai_providers(id) ON DELETE SET NULL,
  primary_model text,
  fallback_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  routing_strategy text NOT NULL DEFAULT 'priority',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_feature_mapping TO authenticated;
GRANT ALL ON public.ai_feature_mapping TO service_role;
ALTER TABLE public.ai_feature_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage feature mapping" ON public.ai_feature_mapping
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ai_feature_mapping_updated
  BEFORE UPDATE ON public.ai_feature_mapping
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Routing rules
CREATE TABLE IF NOT EXISTS public.ai_routing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  strategy text NOT NULL DEFAULT 'priority',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_routing_rules TO authenticated;
GRANT ALL ON public.ai_routing_rules TO service_role;
ALTER TABLE public.ai_routing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage routing rules" ON public.ai_routing_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ai_routing_rules_updated
  BEFORE UPDATE ON public.ai_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Fallback rules
CREATE TABLE IF NOT EXISTS public.ai_fallback_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text NOT NULL,
  trigger text NOT NULL,
  fallback_provider_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (feature_key, trigger)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_fallback_rules TO authenticated;
GRANT ALL ON public.ai_fallback_rules TO service_role;
ALTER TABLE public.ai_fallback_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage fallback rules" ON public.ai_fallback_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ai_fallback_rules_updated
  BEFORE UPDATE ON public.ai_fallback_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) Provider health history
CREATE TABLE IF NOT EXISTS public.ai_provider_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.ai_providers(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  latency_ms integer,
  error text
);
CREATE INDEX IF NOT EXISTS idx_ai_provider_health_provider ON public.ai_provider_health(provider_id, checked_at DESC);
GRANT SELECT, INSERT ON public.ai_provider_health TO authenticated;
GRANT ALL ON public.ai_provider_health TO service_role;
ALTER TABLE public.ai_provider_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read provider health" ON public.ai_provider_health
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 7) Cost logs
CREATE TABLE IF NOT EXISTS public.ai_cost_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid REFERENCES public.ai_request_logs(id) ON DELETE SET NULL,
  user_id uuid,
  organization_id text,
  feature_key text,
  provider_slug text,
  model text,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_created ON public.ai_cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_user ON public.ai_cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_logs_feature ON public.ai_cost_logs(feature_key);
GRANT SELECT ON public.ai_cost_logs TO authenticated;
GRANT ALL ON public.ai_cost_logs TO service_role;
ALTER TABLE public.ai_cost_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read cost logs" ON public.ai_cost_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 8) Usage limits
CREATE TABLE IF NOT EXISTS public.ai_usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,           -- global | role | user | org
  scope_id text,                  -- role name / user id / org id / null for global
  daily_requests integer,
  monthly_requests integer,
  daily_tokens bigint,
  monthly_tokens bigint,
  monthly_cost_usd numeric(12,2),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_usage_limits TO authenticated;
GRANT ALL ON public.ai_usage_limits TO service_role;
ALTER TABLE public.ai_usage_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage usage limits" ON public.ai_usage_limits
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ai_usage_limits_updated
  BEFORE UPDATE ON public.ai_usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9) Audit logs
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  target_type text,
  target_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_audit_created ON public.ai_audit_logs(created_at DESC);
GRANT SELECT, INSERT ON public.ai_audit_logs TO authenticated;
GRANT ALL ON public.ai_audit_logs TO service_role;
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit logs" ON public.ai_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
