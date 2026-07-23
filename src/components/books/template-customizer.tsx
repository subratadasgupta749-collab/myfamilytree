import React from "react";
import { type CustomizationSettings } from "./book-template-system";
import { Settings2, Type, Image, Quote, GitCommit, LayoutGrid, Printer, Eye, Palette } from "lucide-react";

export function TemplateCustomizer({
  settings,
  onChange,
}: {
  settings: CustomizationSettings;
  onChange: (updated: CustomizationSettings) => void;
}) {
  const update = <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-amber-600" />
          <h3 className="font-semibold text-sm text-neutral-900">Book Design Studio & Customizer</h3>
        </div>
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          Live Editor
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Font Pairings */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <Type className="h-3.5 w-3.5 text-neutral-500" /> Typography Style
          </label>
          <select
            value={settings.fontPairing}
            onChange={(e) => update("fontPairing", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="default">Template Default</option>
            <option value="classic_serif">Elegant Serif (Garamond/Playfair)</option>
            <option value="old_book">Old Book Typography (Cinzel/Caslon)</option>
            <option value="minimal_sans">Minimal Sans (Inter/Helvetica)</option>
            <option value="handwritten">Handwritten Script & Serif</option>
            <option value="luxury_serif">Luxury Monograph (Bodoni/Cormorant)</option>
            <option value="calligraphy">Fairytale Calligraphy</option>
            <option value="typewriter">Typewriter & Craft Sans</option>
          </select>
        </div>

        {/* Background Style */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <Palette className="h-3.5 w-3.5 text-neutral-500" /> Background Texture
          </label>
          <select
            value={settings.customBg}
            onChange={(e) => update("customBg", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="default">Template Default</option>
            <option value="plain_white">Plain Crisp White</option>
            <option value="old_paper">Old Sepia Paper</option>
            <option value="craft_paper">Textured Craft Paper</option>
            <option value="linen_fabric">Fabric Linen Texture</option>
            <option value="dark_leather">Dark Saddle Leather</option>
            <option value="soft_watercolor">Soft Watercolor Wash</option>
            <option value="minimal_greige">Minimal Greige Tone</option>
            <option value="soft_floral">Soft Floral Watermark</option>
            <option value="vintage_pattern">Vintage Damask Pattern</option>
            <option value="dark_photo">Dark Photo Overlay</option>
          </select>
        </div>

        {/* Photo Layout Mode */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <Image className="h-3.5 w-3.5 text-neutral-500" /> Photo Layout Mode
          </label>
          <select
            value={settings.photoLayoutMode}
            onChange={(e) => update("photoLayoutMode", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="default">Template Default</option>
            <option value="single_hero">Single Full Page Photo</option>
            <option value="two_split">Two Photos Side-by-Side</option>
            <option value="three_grid">Three Photo Trio</option>
            <option value="four_grid">Four Photo Grid</option>
            <option value="polaroid">Polaroid Taped Style</option>
            <option value="vintage_mount">Vintage Photo Corners</option>
            <option value="rounded">Rounded Vignette Frames</option>
            <option value="borderless">Clean Borderless Gallery</option>
            <option value="magazine">Magazine Shadow Layout</option>
          </select>
        </div>

        {/* Quote Style */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <Quote className="h-3.5 w-3.5 text-neutral-500" /> Quote Design Style
          </label>
          <select
            value={settings.quoteStyleMode}
            onChange={(e) => update("quoteStyleMode", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="default">Template Default</option>
            <option value="center_serif">Large Center Quote</option>
            <option value="side_bar">Side Callout Bar</option>
            <option value="highlight_box">Highlight Box</option>
            <option value="sticky_note">Handwritten Memory Note</option>
            <option value="calligraphy_cloud">Calligraphy Watercolor Cloud</option>
            <option value="editorial_bar">Editorial Magazine Bar</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2 border-t border-neutral-100">
        {/* Timeline Style */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <GitCommit className="h-3.5 w-3.5 text-neutral-500" /> Timeline Visualization
          </label>
          <select
            value={settings.timelineStyleMode}
            onChange={(e) => update("timelineStyleMode", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="default">Template Default</option>
            <option value="vertical">Vertical Timeline Line</option>
            <option value="horizontal">Horizontal Timeline Banner</option>
            <option value="milestone_cards">Milestone Card Stack</option>
            <option value="journey_ribbon">Family Journey Ribbon</option>
            <option value="illustrated_nodes">Illustrated Node Path</option>
          </select>
        </div>

        {/* Spacing & Margins */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <LayoutGrid className="h-3.5 w-3.5 text-neutral-500" /> Margins & Spacing
          </label>
          <select
            value={settings.marginSpacing}
            onChange={(e) => update("marginSpacing", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="compact">Compact (Higher Density)</option>
            <option value="balanced">Balanced Standard</option>
            <option value="spacious">Spacious (Editorial Wide Margins)</option>
          </select>
        </div>

        {/* Page Trim Size */}
        <div>
          <label className="font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
            <Printer className="h-3.5 w-3.5 text-neutral-500" /> Page Trim Size
          </label>
          <select
            value={settings.pageSize}
            onChange={(e) => update("pageSize", e.target.value as any)}
            className="w-full rounded-md border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500"
          >
            <option value="6x9">6" x 9" Digest Book Size</option>
            <option value="A4">A4 (210 x 297 mm)</option>
            <option value="Letter">US Letter (8.5" x 11")</option>
          </select>
        </div>

        {/* Toggles */}
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showHeaderFooter}
              onChange={(e) => update("showHeaderFooter", e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Header / Footer & Numbers</span>
          </label>
          <label className="flex items-center gap-2 text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showBleed}
              onChange={(e) => update("showBleed", e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span className="font-medium text-amber-800">Print Bleed Area (0.125")</span>
          </label>
        </div>
      </div>
    </div>
  );
}
