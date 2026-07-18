import { Link } from "@tanstack/react-router";
import { BookHeart, Facebook, Instagram, Youtube, Twitter, Linkedin, MessageCircle, Send, Music2, Image as ImageIcon, AtSign, HelpCircle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";

const SOCIAL_ICONS: Record<string, { Icon: typeof Facebook; label: string }> = {
  facebook: { Icon: Facebook, label: "Facebook" },
  instagram: { Icon: Instagram, label: "Instagram" },
  youtube: { Icon: Youtube, label: "YouTube" },
  pinterest: { Icon: ImageIcon, label: "Pinterest" },
  x: { Icon: Twitter, label: "X" },
  twitter: { Icon: Twitter, label: "Twitter" },
  threads: { Icon: AtSign, label: "Threads" },
  linkedin: { Icon: Linkedin, label: "LinkedIn" },
  tiktok: { Icon: Music2, label: "TikTok" },
  whatsapp: { Icon: MessageCircle, label: "WhatsApp" },
  telegram: { Icon: Send, label: "Telegram" },
  quora: { Icon: HelpCircle, label: "Quora" },
};

const cols = [
  {
    title: "Product",
    links: [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms & Conditions" },
      { to: "/cookies", label: "Cookie Policy" },
      { to: "/disclaimer", label: "Disclaimer" },
    ],
  },
];

export function SiteFooter() {
  const { general, homepage, social } = useSettings();
  const socialLinks = Object.entries(SOCIAL_ICONS)
    .map(([key, meta]) => ({ key, url: (social ?? {})[key]?.trim(), ...meta }))
    .filter((s) => !!s.url);
  const siteName = general?.site_name || "My Family History Book";
  const logo = general?.footer_logo_url || general?.logo_url;
  const desc =
    homepage?.footer_description ||
    "Preserve the stories, memories, and legacy of your family in a beautifully crafted book.";
  const company = general?.company_name || siteName;
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold">
            {logo ? (
              <img src={logo} alt={siteName} className="h-6 w-auto" />
            ) : (
              <BookHeart className="h-5 w-5 text-primary" />
            )}
            {siteName}
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{desc}</p>
          {socialLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socialLinks.map(({ key, url, Icon, label }) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} className="grid h-8 w-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition hover:bg-primary hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold">{c.title}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} {company}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
