import React from "react";
import { type BookThemeId } from "@/lib/manuscript.functions";
import { QrCode, BookOpen, Calendar, MapPin, Heart, Award, Compass, Users, Mail, Feather, Leaf, Star, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

export type CustomizationSettings = {
  fontPairing: "default" | "classic_serif" | "old_book" | "minimal_sans" | "handwritten" | "luxury_serif" | "calligraphy" | "typewriter";
  customBg: "default" | "plain_white" | "old_paper" | "craft_paper" | "linen_fabric" | "dark_leather" | "soft_watercolor" | "minimal_greige" | "soft_floral" | "vintage_pattern" | "dark_photo";
  photoLayoutMode: "default" | "single_hero" | "two_split" | "three_grid" | "four_grid" | "collage" | "polaroid" | "rounded" | "vintage_mount" | "borderless" | "magazine";
  quoteStyleMode: "default" | "center_serif" | "side_bar" | "highlight_box" | "sticky_note" | "calligraphy_cloud" | "editorial_bar";
  timelineStyleMode: "default" | "vertical" | "horizontal" | "milestone_cards" | "journey_ribbon" | "illustrated_nodes";
  marginSpacing: "compact" | "balanced" | "spacious";
  showHeaderFooter: boolean;
  pageSize: "6x9" | "A4" | "Letter";
  showBleed: boolean;
};

export const DEFAULT_CUSTOMIZATION: CustomizationSettings = {
  fontPairing: "default",
  customBg: "default",
  photoLayoutMode: "default",
  quoteStyleMode: "default",
  timelineStyleMode: "default",
  marginSpacing: "balanced",
  showHeaderFooter: true,
  pageSize: "6x9",
  showBleed: false,
};

export type ThemeConfig = {
  id: BookThemeId;
  label: string;
  fontFamilyClass: string;
  headingFontClass: string;
  accentFontClass: string;
  bgStyle: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  mutedColor: string;
  ruleColor: string;
  cardBg: string;
  chipClass: string;
  dropCapClass: string;
  dividerType: "flourish_gold" | "sepia_ornament" | "crisp_line" | "stitched_thread" | "gold_crest" | "craft_tape" | "minimal_dot" | "magazine_kicker" | "watercolor_vine";
  photoFrameType: "border" | "vintage_corner" | "borderless" | "stitched" | "gold_filigree" | "polaroid_tape" | "vignette_rounded" | "magazine_shadow";
  quoteStyleType: "center_serif" | "side_bar" | "highlight_box" | "sticky_note" | "calligraphy_cloud" | "editorial_bar";
  timelineStyleType: "vertical" | "horizontal" | "milestone_cards" | "journey_ribbon" | "illustrated_nodes";
};

export const TEMPLATE_CONFIGS: Record<BookThemeId, ThemeConfig> = {
  classic: {
    id: "classic",
    label: "Classic",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-serif tracking-tight",
    accentFontClass: "font-serif italic",
    bgStyle: "bg-[#FFFDF9] text-[#1c1917]",
    textColor: "text-[#292524]",
    headingColor: "text-[#78350f]",
    accentColor: "text-[#b45309]",
    mutedColor: "text-[#78716c]",
    ruleColor: "bg-[#d97706]/40",
    cardBg: "bg-[#fef3c7]/20 border-[#fde68a]",
    chipClass: "bg-[#78350f]/10 text-[#78350f] border-[#78350f]/20",
    dropCapClass: "float-left text-5xl font-serif font-bold text-[#78350f] mr-3 leading-none mt-1 uppercase",
    dividerType: "flourish_gold",
    photoFrameType: "border",
    quoteStyleType: "center_serif",
    timelineStyleType: "vertical",
  },
  vintage: {
    id: "vintage",
    label: "Vintage",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-serif uppercase tracking-widest",
    accentFontClass: "font-serif italic",
    bgStyle: "bg-[#FAF3E0] text-[#3b2716]",
    textColor: "text-[#4a3525]",
    headingColor: "text-[#6e2c00]",
    accentColor: "text-[#a04000]",
    mutedColor: "text-[#8d6e63]",
    ruleColor: "bg-[#a04000]/40",
    cardBg: "bg-[#f5e6ca] border-[#d7ccc8]",
    chipClass: "bg-[#6e2c00]/10 text-[#6e2c00] border-[#6e2c00]/30",
    dropCapClass: "float-left text-6xl font-serif font-bold text-[#6e2c00] mr-3 leading-none mt-1 p-1 border border-[#a04000]/40 bg-[#f5e6ca]",
    dividerType: "sepia_ornament",
    photoFrameType: "vintage_corner",
    quoteStyleType: "side_bar",
    timelineStyleType: "milestone_cards",
  },
  modern: {
    id: "modern",
    label: "Modern",
    fontFamilyClass: "font-sans",
    headingFontClass: "font-sans font-extrabold tracking-tighter",
    accentFontClass: "font-sans font-medium",
    bgStyle: "bg-white text-neutral-900",
    textColor: "text-neutral-800",
    headingColor: "text-neutral-950",
    accentColor: "text-neutral-700",
    mutedColor: "text-neutral-500",
    ruleColor: "bg-neutral-300",
    cardBg: "bg-neutral-50 border-neutral-200",
    chipClass: "bg-neutral-900 text-white font-mono text-[11px]",
    dropCapClass: "float-left text-6xl font-sans font-black text-neutral-950 mr-3 leading-none mt-1 tracking-tighter",
    dividerType: "crisp_line",
    photoFrameType: "borderless",
    quoteStyleType: "highlight_box",
    timelineStyleType: "horizontal",
  },
  leather_journal: {
    id: "leather_journal",
    label: "Leather Journal",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-serif font-bold tracking-normal",
    accentFontClass: "font-serif italic",
    bgStyle: "bg-[#F4E8D1] text-[#2c1d11]",
    textColor: "text-[#3d2a1c]",
    headingColor: "text-[#542d10]",
    accentColor: "text-[#8c4815]",
    mutedColor: "text-[#7a5e4b]",
    ruleColor: "bg-[#542d10]/40",
    cardBg: "bg-[#e8d7b8] border-[#cbb28b]",
    chipClass: "bg-[#542d10] text-[#f4e8d1] font-serif",
    dropCapClass: "float-left text-5xl font-serif font-bold text-[#542d10] mr-3 leading-none mt-1 border-b-2 border-[#8c4815]",
    dividerType: "stitched_thread",
    photoFrameType: "stitched",
    quoteStyleType: "sticky_note",
    timelineStyleType: "journey_ribbon",
  },
  family_album: {
    id: "family_album",
    label: "Family Album",
    fontFamilyClass: "font-sans",
    headingFontClass: "font-serif font-bold tracking-tight",
    accentFontClass: "font-sans italic",
    bgStyle: "bg-[#FFFDF7] text-[#1e293b]",
    textColor: "text-[#334155]",
    headingColor: "text-[#0f172a]",
    accentColor: "text-[#d97706]",
    mutedColor: "text-[#64748b]",
    ruleColor: "bg-[#f59e0b]/40",
    cardBg: "bg-[#fef3c7]/30 border-[#fde68a]",
    chipClass: "bg-[#f59e0b]/15 text-[#b45309] font-medium",
    dropCapClass: "float-left text-5xl font-serif font-extrabold text-[#d97706] mr-3 leading-none mt-1",
    dividerType: "flourish_gold",
    photoFrameType: "border",
    quoteStyleType: "highlight_box",
    timelineStyleType: "milestone_cards",
  },
  timeline_split: {
    id: "timeline_split",
    label: "Timeline Split",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-serif font-bold",
    accentFontClass: "font-sans font-semibold tracking-wider uppercase",
    bgStyle: "bg-[#FAF7F2] text-[#262626]",
    textColor: "text-[#383838]",
    headingColor: "text-[#171717]",
    accentColor: "text-[#0284c7]",
    mutedColor: "text-[#737373]",
    ruleColor: "bg-[#0284c7]/40",
    cardBg: "bg-white border-[#e5e5e5] shadow-sm",
    chipClass: "bg-[#0284c7] text-white font-sans text-[11px]",
    dropCapClass: "float-left text-5xl font-serif font-bold text-[#0284c7] mr-3 leading-none mt-1",
    dividerType: "crisp_line",
    photoFrameType: "borderless",
    quoteStyleType: "side_bar",
    timelineStyleType: "journey_ribbon",
  },
  heritage: {
    id: "heritage",
    label: "Heritage",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-serif font-black tracking-wider uppercase",
    accentFontClass: "font-serif italic",
    bgStyle: "bg-[#F7F4EE] text-[#0f172a]",
    textColor: "text-[#1e293b]",
    headingColor: "text-[#1e1b4b]",
    accentColor: "text-[#b45309]",
    mutedColor: "text-[#475569]",
    ruleColor: "bg-[#b45309]/50",
    cardBg: "bg-[#f1edb9]/20 border-[#cbd5e1]",
    chipClass: "bg-[#1e1b4b] text-[#fef3c7] font-serif text-[11px] tracking-widest uppercase",
    dropCapClass: "float-left text-6xl font-serif font-black text-[#1e1b4b] mr-3 leading-none mt-1 p-2 bg-[#fef3c7]/60 border-2 border-[#b45309]",
    dividerType: "gold_crest",
    photoFrameType: "gold_filigree",
    quoteStyleType: "center_serif",
    timelineStyleType: "illustrated_nodes",
  },
  luxury_minimal: {
    id: "luxury_minimal",
    label: "Luxury Minimal",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-sans font-light tracking-[0.25em] uppercase",
    accentFontClass: "font-serif italic",
    bgStyle: "bg-[#F9F8F6] text-[#171717]",
    textColor: "text-[#262626]",
    headingColor: "text-[#0a0a0a]",
    accentColor: "text-[#525252]",
    mutedColor: "text-[#737373]",
    ruleColor: "bg-[#d4d4d4]",
    cardBg: "bg-white border-[#e5e5e5]",
    chipClass: "border border-[#171717] text-[#171717] font-sans text-[10px] tracking-widest uppercase px-3 py-1",
    dropCapClass: "float-left text-7xl font-sans font-thin text-[#0a0a0a] mr-4 leading-none mt-0 tracking-tighter",
    dividerType: "minimal_dot",
    photoFrameType: "borderless",
    quoteStyleType: "editorial_bar",
    timelineStyleType: "vertical",
  },
  scrapbook_memories: {
    id: "scrapbook_memories",
    label: "Scrapbook Memories",
    fontFamilyClass: "font-sans",
    headingFontClass: "font-serif font-bold italic",
    accentFontClass: "font-mono text-sm",
    bgStyle: "bg-[#F5EFE6] text-[#2b2b2b]",
    textColor: "text-[#3b3b3b]",
    headingColor: "text-[#6b3e26]",
    accentColor: "text-[#9e4624]",
    mutedColor: "text-[#6e6e6e]",
    ruleColor: "bg-[#9e4624]/30",
    cardBg: "bg-[#fffcf7] border-[#e2d5c3] shadow-md -rotate-1",
    chipClass: "bg-[#e8d5b7] text-[#6b3e26] font-mono text-xs shadow-sm",
    dropCapClass: "float-left text-5xl font-serif font-bold text-[#9e4624] mr-3 leading-none mt-1 p-2 bg-[#fff8eb] border border-dashed border-[#9e4624]",
    dividerType: "craft_tape",
    photoFrameType: "polaroid_tape",
    quoteStyleType: "sticky_note",
    timelineStyleType: "milestone_cards",
  },
  coffee_table: {
    id: "coffee_table",
    label: "Coffee Table Book",
    fontFamilyClass: "font-sans",
    headingFontClass: "font-serif font-black text-4xl md:text-5xl tracking-tight",
    accentFontClass: "font-sans font-semibold tracking-widest uppercase",
    bgStyle: "bg-[#121212] text-[#e5e5e5]",
    textColor: "text-[#d4d4d4]",
    headingColor: "text-white",
    accentColor: "text-[#f59e0b]",
    mutedColor: "text-[#a3a3a3]",
    ruleColor: "bg-[#f59e0b]/50",
    cardBg: "bg-[#1c1c1c] border-[#262626]",
    chipClass: "bg-[#f59e0b] text-black font-sans font-bold text-xs uppercase tracking-widest",
    dropCapClass: "float-left text-6xl font-serif font-black text-[#f59e0b] mr-3 leading-none mt-1",
    dividerType: "crisp_line",
    photoFrameType: "magazine_shadow",
    quoteStyleType: "center_serif",
    timelineStyleType: "horizontal",
  },
  magazine_style: {
    id: "magazine_style",
    label: "Magazine Style",
    fontFamilyClass: "font-sans",
    headingFontClass: "font-sans font-black tracking-tight uppercase",
    accentFontClass: "font-serif italic font-bold",
    bgStyle: "bg-white text-[#18181b]",
    textColor: "text-[#27272a]",
    headingColor: "text-[#09090b]",
    accentColor: "text-[#dc2626]",
    mutedColor: "text-[#71717a]",
    ruleColor: "bg-[#dc2626]",
    cardBg: "bg-[#fafafa] border-[#e4e4e7]",
    chipClass: "bg-[#dc2626] text-white font-sans font-black text-xs uppercase tracking-widest px-2 py-0.5",
    dropCapClass: "float-left text-6xl font-sans font-black text-[#dc2626] mr-3 leading-none mt-1 p-1 bg-black text-white",
    dividerType: "magazine_kicker",
    photoFrameType: "magazine_shadow",
    quoteStyleType: "editorial_bar",
    timelineStyleType: "journey_ribbon",
  },
  storybook: {
    id: "storybook",
    label: "Storybook",
    fontFamilyClass: "font-serif",
    headingFontClass: "font-serif font-bold italic tracking-wide",
    accentFontClass: "font-serif italic",
    bgStyle: "bg-[#FFFDFB] text-[#2d3748]",
    textColor: "text-[#334155]",
    headingColor: "text-[#1e3a8a]",
    accentColor: "text-[#0284c7]",
    mutedColor: "text-[#64748b]",
    ruleColor: "bg-[#38bdf8]/40",
    cardBg: "bg-[#f0f9ff] border-[#bae6fd]",
    chipClass: "bg-[#e0f2fe] text-[#0369a1] font-serif italic text-xs",
    dropCapClass: "float-left text-6xl font-serif font-bold text-[#1e3a8a] mr-3 leading-none mt-1 p-2 bg-[#e0f2fe] rounded-full border border-[#38bdf8]",
    dividerType: "watercolor_vine",
    photoFrameType: "vignette_rounded",
    quoteStyleType: "calligraphy_cloud",
    timelineStyleType: "illustrated_nodes",
  },
};

// Decorative Dividers Component
export function ChapterDivider({ type, colorClass }: { type: ThemeConfig["dividerType"]; colorClass: string }) {
  if (type === "flourish_gold") {
    return (
      <div className="my-8 flex items-center justify-center gap-3">
        <div className={`h-px w-20 ${colorClass}`} />
        <span className="text-xl text-[#d97706]">❖</span>
        <div className={`h-px w-20 ${colorClass}`} />
      </div>
    );
  }
  if (type === "sepia_ornament") {
    return (
      <div className="my-8 flex items-center justify-center gap-2 text-[#a04000]">
        <span className="text-lg">❦</span>
        <div className={`h-px w-24 ${colorClass}`} />
        <span className="text-lg">❧</span>
      </div>
    );
  }
  if (type === "stitched_thread") {
    return (
      <div className="my-8 border-b-2 border-dashed border-[#8c4815]/40" />
    );
  }
  if (type === "gold_crest") {
    return (
      <div className="my-8 flex items-center justify-center gap-3">
        <div className={`h-0.5 w-16 ${colorClass}`} />
        <Award className="h-5 w-5 text-[#b45309]" />
        <div className={`h-0.5 w-16 ${colorClass}`} />
      </div>
    );
  }
  if (type === "craft_tape") {
    return (
      <div className="my-8 flex justify-center">
        <div className="h-4 w-32 bg-[#e8d5b7]/60 border border-dashed border-[#9e4624]/40 rotate-1 rounded-sm shadow-sm" />
      </div>
    );
  }
  if (type === "magazine_kicker") {
    return (
      <div className="my-8 flex items-center gap-2">
        <div className="h-1.5 w-8 bg-[#dc2626]" />
        <div className="h-0.5 flex-1 bg-neutral-200" />
      </div>
    );
  }
  if (type === "watercolor_vine") {
    return (
      <div className="my-8 flex items-center justify-center gap-3 text-[#0284c7]">
        <Leaf className="h-4 w-4 transform -scale-x-100" />
        <div className={`h-0.5 w-20 ${colorClass}`} />
        <Sparkles className="h-4 w-4" />
        <div className={`h-0.5 w-20 ${colorClass}`} />
        <Leaf className="h-4 w-4" />
      </div>
    );
  }
  if (type === "minimal_dot") {
    return (
      <div className="my-8 flex justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      </div>
    );
  }
  return <div className={`my-8 h-px w-24 mx-auto ${colorClass}`} />;
}

// Illuminated Drop Cap Paragraph
export function DropCapText({ text, dropCapClass, bodyClass }: { text: string; dropCapClass: string; bodyClass: string }) {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  if (paragraphs.length === 0) return null;

  const firstP = paragraphs[0];
  const firstLetter = firstP.charAt(0);
  const restFirstP = firstP.slice(1);

  return (
    <div className={`space-y-5 ${bodyClass}`}>
      <p className="leading-relaxed">
        <span className={dropCapClass}>{firstLetter}</span>
        {restFirstP}
      </p>
      {paragraphs.slice(1).map((p, idx) => (
        <p key={idx} className="leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}

// Quote Renderer Component
export function QuoteBlock({
  quote,
  theme,
  customMode,
}: {
  quote: string;
  theme: ThemeConfig;
  customMode?: CustomizationSettings["quoteStyleMode"];
}) {
  const mode = customMode && customMode !== "default" ? customMode : theme.quoteStyleType;

  if (mode === "side_bar") {
    return (
      <blockquote className={`my-6 border-l-4 pl-6 py-2 italic text-lg leading-relaxed ${theme.headingColor}`} style={{ borderColor: "currentColor" }}>
        “{quote}”
      </blockquote>
    );
  }

  if (mode === "highlight_box") {
    return (
      <div className={`my-6 p-6 rounded-xl ${theme.cardBg}`}>
        <p className={`italic text-lg text-center font-medium ${theme.headingColor}`}>
          “{quote}”
        </p>
      </div>
    );
  }

  if (mode === "sticky_note") {
    return (
      <div className="my-6 max-w-lg mx-auto p-6 bg-[#fff9c4] text-[#332a15] rounded-sm shadow-md border border-[#fbc02d] rotate-1 font-serif">
        <div className="text-xs uppercase tracking-widest font-mono text-[#8c6d1f] mb-2">Memory Note</div>
        <p className="italic text-lg">“{quote}”</p>
      </div>
    );
  }

  if (mode === "calligraphy_cloud") {
    return (
      <div className="my-6 p-8 rounded-3xl bg-gradient-to-r from-[#e0f2fe]/60 via-[#f0f9ff] to-[#e0f2fe]/60 border border-[#bae6fd] text-center shadow-sm">
        <Sparkles className="h-5 w-5 mx-auto text-[#0284c7] mb-2" />
        <p className="font-serif italic text-xl text-[#0369a1] leading-relaxed">
          “{quote}”
        </p>
      </div>
    );
  }

  if (mode === "editorial_bar") {
    return (
      <div className="my-8 border-y-2 border-neutral-900 py-6 px-4">
        <p className="font-sans font-bold uppercase tracking-tight text-xl text-center md:text-2xl text-neutral-900 leading-snug">
          “{quote}”
        </p>
      </div>
    );
  }

  // Default Center Serif
  return (
    <div className="my-8 text-center px-6 py-4">
      <span className={`block text-5xl font-serif leading-none ${theme.accentColor}`}>“</span>
      <p className={`-mt-3 font-serif italic text-xl md:text-2xl leading-relaxed ${theme.headingColor}`}>
        {quote}
      </p>
      <span className={`block text-5xl font-serif leading-none mt-2 ${theme.accentColor}`}>”</span>
    </div>
  );
}

// Photo Layout Renderer
export function PhotoLayoutGallery({
  photos,
  theme,
  layoutMode,
}: {
  photos: Array<{ id: string; url: string; filename: string; caption?: string }>;
  theme: ThemeConfig;
  layoutMode?: CustomizationSettings["photoLayoutMode"];
}) {
  if (!photos || photos.length === 0) return null;

  const mode = layoutMode && layoutMode !== "default" ? layoutMode : theme.photoFrameType;

  const getFrameClass = (m: string) => {
    if (m === "vintage_corner") {
      return "border-8 border-[#f5e6ca] shadow-md p-1 bg-white relative rounded-none";
    }
    if (m === "gold_filigree") {
      return "border-4 border-[#b45309] p-1 bg-[#fffdfa] shadow-lg rounded-sm";
    }
    if (m === "polaroid_tape") {
      return "bg-white p-3 shadow-md rounded-none rotate-1 border border-neutral-200";
    }
    if (m === "vignette_rounded") {
      return "rounded-2xl overflow-hidden shadow-md border-2 border-[#bae6fd]";
    }
    if (m === "stitched") {
      return "border-2 border-dashed border-[#8c4815] p-2 bg-[#f4e8d1] shadow-sm rounded-sm";
    }
    if (m === "magazine_shadow") {
      return "shadow-2xl rounded-none border border-neutral-800";
    }
    if (m === "borderless") {
      return "rounded-none overflow-hidden shadow-sm";
    }
    return "rounded-lg border border-neutral-200 shadow-sm overflow-hidden bg-white p-1";
  };

  const frameClass = getFrameClass(mode);

  if (photos.length === 1 || mode === "single_hero") {
    const p = photos[0];
    return (
      <figure className={`my-8 max-w-2xl mx-auto ${frameClass}`}>
        <img src={p.url} alt={p.filename} className="w-full h-auto object-cover max-h-[500px]" />
        {p.caption && (
          <figcaption className={`mt-2 text-center text-xs italic ${theme.mutedColor}`}>
            {p.caption || p.filename}
          </figcaption>
        )}
      </figure>
    );
  }

  if (photos.length === 2 || mode === "two_split") {
    return (
      <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {photos.slice(0, 2).map((p) => (
          <figure key={p.id} className={frameClass}>
            <img src={p.url} alt={p.filename} className="w-full h-56 object-cover" />
            <figcaption className={`mt-2 text-center text-xs italic ${theme.mutedColor}`}>
              {p.filename}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }

  if (mode === "polaroid_tape") {
    return (
      <div className="my-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {photos.slice(0, 3).map((p, idx) => (
          <div key={p.id} className={`bg-white p-3 shadow-lg border border-neutral-200 transform ${idx % 2 === 0 ? "rotate-2" : "-rotate-2"}`}>
            <div className="h-4 w-16 bg-[#e8d5b7]/70 border border-dashed border-[#9e4624]/40 mx-auto -mt-5 mb-2 shadow-xs" />
            <img src={p.url} alt={p.filename} className="w-full h-40 object-cover" />
            <div className="mt-3 text-center font-serif italic text-xs text-neutral-700">
              {p.filename}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="my-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.slice(0, 4).map((p) => (
        <figure key={p.id} className={frameClass}>
          <img src={p.url} alt={p.filename} className="w-full h-36 object-cover" />
          <figcaption className={`mt-1 text-center text-[10px] truncate px-1 ${theme.mutedColor}`}>
            {p.filename}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

// Timeline Renderer Component
export function TimelineVisualizer({
  items,
  theme,
  customMode,
}: {
  items: Array<{ year: string; event: string }>;
  theme: ThemeConfig;
  customMode?: CustomizationSettings["timelineStyleMode"];
}) {
  if (!items || items.length === 0) return null;

  const mode = customMode && customMode !== "default" ? customMode : theme.timelineStyleType;

  if (mode === "horizontal") {
    return (
      <div className="my-8 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {items.map((t, idx) => (
            <div key={idx} className={`p-4 rounded-xl w-48 ${theme.cardBg}`}>
              <div className={`text-lg font-bold ${theme.accentColor}`}>{t.year}</div>
              <div className={`mt-1 text-xs leading-snug ${theme.textColor}`}>{t.event}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "milestone_cards") {
    return (
      <div className="my-8 space-y-3">
        {items.map((t, idx) => (
          <div key={idx} className={`p-4 rounded-xl border flex gap-4 items-center ${theme.cardBg}`}>
            <div className={`px-3 py-1 rounded-lg text-sm font-bold shadow-xs ${theme.chipClass}`}>
              {t.year}
            </div>
            <div className={`text-sm ${theme.textColor}`}>{t.event}</div>
          </div>
        ))}
      </div>
    );
  }

  if (mode === "illustrated_nodes") {
    return (
      <div className="my-8 relative pl-8 border-l-2 border-dashed border-[#0284c7]/40 space-y-6">
        {items.map((t, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-[#e0f2fe] border-2 border-[#0284c7] flex items-center justify-center text-[10px] text-[#0284c7] font-bold">
              ✦
            </span>
            <div className={`text-sm font-bold ${theme.accentColor}`}>{t.year}</div>
            <div className={`text-sm mt-0.5 ${theme.textColor}`}>{t.event}</div>
          </div>
        ))}
      </div>
    );
  }

  // Vertical Default
  return (
    <div className="my-8 relative pl-6 border-l-2 space-y-4" style={{ borderColor: "currentColor" }}>
      {items.map((t, idx) => (
        <div key={idx} className="relative">
          <span className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ${theme.accentColor}`} style={{ backgroundColor: "currentColor" }} />
          <div className={`text-sm font-bold ${theme.accentColor}`}>{t.year}</div>
          <div className={`text-sm ${theme.textColor}`}>{t.event}</div>
        </div>
      ))}
    </div>
  );
}

// Special Pages Suite
export function SpecialPagesSuite({
  bookName,
  theme,
}: {
  bookName: string;
  theme: ThemeConfig;
}) {
  return (
    <div className="mt-20 space-y-20 border-t pt-16 border-dashed border-neutral-300">
      {/* Family Tree */}
      <section className={`p-8 rounded-2xl ${theme.cardBg}`}>
        <div className="text-center">
          <Leaf className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
          <h3 className={`text-2xl font-bold ${theme.headingColor}`}>Family Tree & Lineage</h3>
          <p className={`text-xs mt-1 ${theme.mutedColor}`}>Generational connection of {bookName}</p>
        </div>
        <div className="mt-8 flex flex-col items-center gap-6">
          <div className="px-6 py-3 rounded-xl bg-white border-2 border-emerald-600 shadow-sm text-center">
            <div className="text-xs uppercase tracking-widest text-emerald-700 font-bold">Grandparents</div>
            <div className="text-sm font-semibold mt-0.5">Arthur & Eleanor</div>
          </div>
          <div className="h-6 w-0.5 bg-emerald-400" />
          <div className="grid grid-cols-2 gap-8">
            <div className="px-5 py-2.5 rounded-lg bg-white border border-emerald-300 shadow-xs text-center">
              <div className="text-xs font-bold text-emerald-800">Father's Line</div>
              <div className="text-xs text-neutral-600">Robert & Margaret</div>
            </div>
            <div className="px-5 py-2.5 rounded-lg bg-white border border-emerald-300 shadow-xs text-center">
              <div className="text-xs font-bold text-emerald-800">Mother's Line</div>
              <div className="text-xs text-neutral-600">Thomas & Clara</div>
            </div>
          </div>
          <div className="h-6 w-0.5 bg-emerald-400" />
          <div className="px-8 py-4 rounded-2xl bg-emerald-950 text-white shadow-md text-center">
            <div className="text-xs uppercase tracking-widest text-emerald-400 font-bold">Subject</div>
            <div className="text-lg font-bold">{bookName}</div>
          </div>
        </div>
      </section>

      {/* Important Dates */}
      <section className={`p-8 rounded-2xl ${theme.cardBg}`}>
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-amber-600" />
          <h3 className={`text-xl font-bold ${theme.headingColor}`}>Milestone Calendar & Dates</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { date: "May 14, 1948", event: "Birth & Early Life Begins" },
            { date: "June 22, 1970", event: "University Graduation" },
            { date: "September 18, 1974", event: "Wedding Ceremony" },
            { date: "August 3, 1980", event: "First Child Born" },
          ].map((item, idx) => (
            <div key={idx} className="p-3 bg-white rounded-lg border border-neutral-200 flex justify-between items-center text-xs">
              <span className="font-bold text-amber-700">{item.date}</span>
              <span className="text-neutral-700">{item.event}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Life Lessons & Favorite Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className={`p-6 rounded-2xl ${theme.cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-[#b45309]" />
            <h4 className={`font-bold text-lg ${theme.headingColor}`}>Life Lessons & Principles</h4>
          </div>
          <ul className="space-y-3 text-xs leading-relaxed">
            <li className="flex gap-2"><span className="text-amber-600 font-bold">•</span> "Always leave places cleaner than you found them."</li>
            <li className="flex gap-2"><span className="text-amber-600 font-bold">•</span> "Family love is the only true enduring wealth."</li>
            <li className="flex gap-2"><span className="text-amber-600 font-bold">•</span> "Listen twice as much as you speak."</li>
          </ul>
        </section>

        <section className={`p-6 rounded-2xl ${theme.cardBg}`}>
          <div className="flex items-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-rose-600" />
            <h4 className={`font-bold text-lg ${theme.headingColor}`}>Favorite Family Recipe</h4>
          </div>
          <div className="text-xs space-y-2">
            <div className="font-bold text-rose-800 text-sm">Grandma's Sunday Apple Pie</div>
            <p className="text-neutral-600 italic">"Passed down through 4 generations during autumn harvests."</p>
            <div className="pt-2 text-neutral-700 font-mono text-[11px]">Key: Cinnamon, Honey, Golden Apples, Handmade Butter Crust.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Cover, Dust Jacket & Spine Renderer
export function BookCoverSpread({
  book,
  theme,
  coverPhotoUrl,
}: {
  book: { name?: string; nickname?: string; date_of_birth?: string; country?: string; relationship?: string };
  theme: ThemeConfig;
  coverPhotoUrl?: string | null;
}) {
  return (
    <div className="space-y-12">
      {/* 3D Premium Hardcover */}
      <div className="mx-auto max-w-xl p-8 rounded-2xl bg-neutral-900 text-white shadow-2xl border-4 border-amber-600/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-neutral-900 to-amber-950 opacity-90" />
        <div className="relative z-10 text-center py-12 px-6 border-2 border-amber-500/30 rounded-xl">
          <div className="text-xs uppercase tracking-[0.35em] text-amber-400 font-bold">Hardcover Edition</div>
          <h1 className="mt-6 text-4xl md:text-5xl font-serif font-extrabold tracking-tight text-amber-100">
            {book.name || "A Family History"}
          </h1>
          {book.nickname && (
            <div className="mt-2 text-lg italic text-amber-300">“{book.nickname}”</div>
          )}

          {coverPhotoUrl && (
            <div className="my-8 max-w-xs mx-auto overflow-hidden rounded-lg border-2 border-amber-400/40 shadow-lg">
              <img src={coverPhotoUrl} alt="Cover" className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="mt-8 text-xs text-amber-200/80 tracking-widest uppercase">
            {[book.date_of_birth, book.country, book.relationship].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      {/* Dust Jacket Wrap View */}
      <div className="p-6 rounded-2xl border border-neutral-300 bg-neutral-100 shadow-inner">
        <div className="text-xs uppercase tracking-widest font-bold text-neutral-500 mb-3 text-center">
          Dust Jacket Wrap & Spine Layout
        </div>
        <div className="grid grid-cols-12 gap-2 text-center text-xs">
          {/* Left Flap */}
          <div className="col-span-3 p-4 bg-white rounded border border-neutral-200 flex flex-col justify-between">
            <div className="font-bold text-neutral-800">Inside Front Flap</div>
            <p className="text-[11px] text-neutral-600 italic leading-relaxed">
              "Every family has a story. This volume preserves the memories, wisdom, and heritage of {book.name} for future generations."
            </p>
            <div className="text-[10px] text-neutral-400">Printed in USA</div>
          </div>

          {/* Spine */}
          <div className="col-span-2 p-4 bg-amber-950 text-amber-200 rounded border border-amber-800 flex flex-col justify-between items-center writing-mode-vertical">
            <div className="font-serif font-bold text-sm tracking-widest uppercase">
              {book.name}
            </div>
            <QrCode className="h-4 w-4 my-2 text-amber-400" />
            <div className="text-[10px]">MEMOIR PRESS</div>
          </div>

          {/* Right Flap & Back */}
          <div className="col-span-7 p-4 bg-white rounded border border-neutral-200 flex flex-col justify-between text-left">
            <div>
              <div className="font-bold text-neutral-900 text-sm mb-1">Back Cover Summary</div>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                A rich chronicle detailing life milestones, family trees, favorite recipes, and timeless guidance.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-neutral-200">
              <div className="flex items-center gap-2">
                <QrCode className="h-8 w-8 text-neutral-800" />
                <span className="text-[10px] text-neutral-500">Scan for Digital Portal</span>
              </div>
              <div className="font-mono text-[10px] text-neutral-400">ISBN 978-1-800-FAMILY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
