-- Enterprise Admin Panel Migration

-- 1. admin_activity_logs
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. system_feature_flags
CREATE TABLE IF NOT EXISTS public.system_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default feature flags
INSERT INTO public.system_feature_flags (flag_key, flag_name, category, is_enabled, description) VALUES
  ('feature_blog', 'Blog & Articles CMS', 'content', true, 'Enable public blog and CMS editing'),
  ('feature_ai_interview', 'AI Guided Interview', 'ai', true, 'Enable AI family history interview assistant'),
  ('feature_book_generator', 'Book Manuscript Generator', 'core', true, 'Enable compilation of PDF & DOCX manuscripts'),
  ('feature_payments', 'Payment Gateways & Checkout', 'billing', true, 'Enable Stripe, PayPal, LemonSqueezy, Payoneer payments'),
  ('feature_downloads', 'Digital Book Downloads', 'core', true, 'Allow users to download exported PDF & Word files'),
  ('feature_coupons', 'Promo Coupons & Discounts', 'billing', true, 'Enable discount code validation at checkout'),
  ('feature_referrals', 'Referral & Rewards Program', 'marketing', true, 'Enable user referral codes and commission tracking'),
  ('feature_support_center', 'Help Center & Ticket Portal', 'support', true, 'Enable in-app user support ticket submission'),
  ('feature_notifications', 'In-App & Email Notifications', 'system', true, 'Enable system notifications and alerts'),
  ('feature_google_login', 'Google OAuth Login', 'auth', true, 'Allow users to sign in with Google accounts'),
  ('feature_maintenance_mode', 'System Maintenance Mode', 'system', false, 'Lock user portal for scheduled maintenance')
ON CONFLICT (flag_key) DO NOTHING;

-- 3. system_media_files
CREATE TABLE IF NOT EXISTS public.system_media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'uncategorized', -- book_covers, blog, logos, icons, pdf
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. system_seo_configs
CREATE TABLE IF NOT EXISTS public.system_seo_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL, -- homepage, blog, interview, pricing
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  og_image TEXT,
  canonical_url TEXT,
  json_ld JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. system_redirects
CREATE TABLE IF NOT EXISTS public.system_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  status_code INT NOT NULL DEFAULT 301,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants
GRANT ALL ON public.admin_activity_logs TO authenticated, service_role;
GRANT ALL ON public.system_feature_flags TO authenticated, service_role;
GRANT ALL ON public.system_media_files TO authenticated, service_role;
GRANT ALL ON public.system_seo_configs TO authenticated, service_role;
GRANT ALL ON public.system_redirects TO authenticated, service_role;

-- RLS
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_seo_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin activity logs policy" ON public.admin_activity_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Feature flags view" ON public.system_feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Feature flags admin manage" ON public.system_feature_flags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Media files policy" ON public.system_media_files FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "SEO configs policy" ON public.system_seo_configs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Redirects policy" ON public.system_redirects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
