import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
} from "docx";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const kindEnum = z.enum(["pdf", "docx", "print_pdf"]);
type Kind = z.infer<typeof kindEnum>;

type ThemePalette = {
  bg: [number, number, number];
  ink: [number, number, number];
  accent: [number, number, number];
  muted: [number, number, number];
};

const THEME_PALETTES: Record<string, ThemePalette> = {
  classic: { bg: [1, 0.992, 0.976], ink: [0.11, 0.1, 0.09], accent: [0.71, 0.46, 0.04], muted: [0.47, 0.44, 0.42] },
  vintage: { bg: [0.98, 0.95, 0.88], ink: [0.23, 0.15, 0.08], accent: [0.63, 0.25, 0.0], muted: [0.55, 0.43, 0.38] },
  modern: { bg: [1, 1, 1], ink: [0.06, 0.06, 0.06], accent: [0.26, 0.26, 0.26], muted: [0.45, 0.45, 0.45] },
  leather_journal: { bg: [0.95, 0.91, 0.82], ink: [0.17, 0.11, 0.07], accent: [0.55, 0.28, 0.08], muted: [0.48, 0.37, 0.29] },
  family_album: { bg: [1, 0.99, 0.97], ink: [0.12, 0.16, 0.23], accent: [0.85, 0.59, 0.04], muted: [0.39, 0.45, 0.55] },
  timeline_split: { bg: [0.98, 0.97, 0.95], ink: [0.15, 0.15, 0.15], accent: [0.01, 0.52, 0.78], muted: [0.45, 0.45, 0.45] },
  heritage: { bg: [0.97, 0.96, 0.93], ink: [0.06, 0.09, 0.16], accent: [0.71, 0.33, 0.04], muted: [0.28, 0.33, 0.41] },
  luxury_minimal: { bg: [0.98, 0.97, 0.96], ink: [0.09, 0.09, 0.09], accent: [0.32, 0.32, 0.32], muted: [0.45, 0.45, 0.45] },
  scrapbook_memories: { bg: [0.96, 0.94, 0.9], ink: [0.17, 0.17, 0.17], accent: [0.62, 0.27, 0.14], muted: [0.43, 0.43, 0.43] },
  coffee_table: { bg: [0.07, 0.07, 0.07], ink: [0.9, 0.9, 0.9], accent: [0.96, 0.62, 0.04], muted: [0.64, 0.64, 0.64] },
  magazine_style: { bg: [1, 1, 1], ink: [0.09, 0.09, 0.11], accent: [0.86, 0.15, 0.15], muted: [0.44, 0.44, 0.48] },
  storybook: { bg: [1, 0.99, 0.98], ink: [0.18, 0.21, 0.28], accent: [0.01, 0.52, 0.78], muted: [0.39, 0.45, 0.55] },
};

async function loadBookData(supabase: any, bookId: string) {
  const { data: book, error: bErr } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();
  if (bErr) throw new Error(bErr.message);
  if (!book) throw new Error("Book not found");

  const { data: manuscript } = await supabase
    .from("book_manuscripts")
    .select("*")
    .eq("book_id", bookId)
    .maybeSingle();

  const { data: chapters } = await supabase
    .from("book_chapters")
    .select("*")
    .eq("book_id", bookId)
    .order("position");

  const { data: photos } = await supabase
    .from("book_photos")
    .select("*")
    .eq("book_id", bookId);

  return {
    book,
    manuscript,
    chapters: (chapters ?? []) as Array<{
      id: string;
      position: number;
      topic: string;
      title: string;
      narrative: string;
      timeline: Array<{ year: string; event: string }>;
      quotes: string[];
    }>,
    photos: (photos ?? []) as Array<{
      id: string;
      category: string;
      url: string | null;
      filename: string;
      caption?: string;
    }>,
  };
}

// --------- PDF Visual Design Engine ---------

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.replace(/\r/g, "").split(/(\s+)/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur + w;
    const width = font.widthOfTextAtSize(trial.replace(/\n/g, " "), size);
    if (width > maxWidth && cur.trim().length > 0) {
      lines.push(cur.trimEnd());
      cur = w.trimStart();
    } else {
      cur = trial;
    }
  }
  if (cur.length) lines.push(cur.trimEnd());
  const out: string[] = [];
  for (const l of lines) {
    const parts = l.split("\n");
    out.push(...parts);
  }
  return out;
}

async function fetchImageBuffer(url: string): Promise<{ bytes: Uint8Array; format: "png" | "jpg" } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const isPng = url.toLowerCase().endsWith(".png") || (res.headers.get("content-type") || "").includes("image/png");
    return { bytes, format: isPng ? "png" : "jpg" };
  } catch {
    return null;
  }
}

async function buildPdf(
  data: Awaited<ReturnType<typeof loadBookData>>,
  print: boolean,
  activeThemeOverride?: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Embed Serif & Sans fonts
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const sansOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  // Trim size 6x9 inches (432x648 pts); print-ready adds 0.125" bleed
  const trimW = 432;
  const trimH = 648;
  const bleed = print ? 9 : 0;
  const pageW = trimW + bleed * 2;
  const pageH = trimH + bleed * 2;

  const themeId = (activeThemeOverride || data.manuscript?.theme || "classic") as string;
  const palette = THEME_PALETTES[themeId] ?? THEME_PALETTES.classic;

  const isSansTheme = ["modern", "magazine_style", "luxury_minimal"].includes(themeId);
  const mainFont = isSansTheme ? sans : serif;
  const mainFontBold = isSansTheme ? sansBold : serifBold;
  const mainFontItalic = isSansTheme ? sansOblique : serifItalic;

  const marginX = 54 + bleed;
  const marginTop = 72 + bleed;
  const marginBottom = 72 + bleed;
  const contentW = pageW - marginX * 2;

  const inkColor = rgb(palette.ink[0], palette.ink[1], palette.ink[2]);
  const accentColor = rgb(palette.accent[0], palette.accent[1], palette.accent[2]);
  const mutedColor = rgb(palette.muted[0], palette.muted[1], palette.muted[2]);

  const drawPageBg = (page: any) => {
    // Fill Page Background Color
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageW,
      height: pageH,
      color: rgb(palette.bg[0], palette.bg[1], palette.bg[2]),
    });

    // Template Specific Page Border / Accent Features
    if (themeId === "classic" || themeId === "heritage") {
      const inset = 18 + bleed;
      page.drawRectangle({
        x: inset,
        y: inset,
        width: pageW - inset * 2,
        height: pageH - inset * 2,
        borderColor: accentColor,
        borderWidth: 1,
      });
      page.drawRectangle({
        x: inset + 4,
        y: inset + 4,
        width: pageW - (inset + 4) * 2,
        height: pageH - (inset + 4) * 2,
        borderColor: accentColor,
        borderWidth: 0.5,
      });
    } else if (themeId === "vintage") {
      const inset = 20 + bleed;
      const bracketLen = 24;
      const c = accentColor;
      page.drawLine({ start: { x: inset, y: pageH - inset }, end: { x: inset + bracketLen, y: pageH - inset }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: inset, y: pageH - inset }, end: { x: inset, y: pageH - inset - bracketLen }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: pageW - inset, y: pageH - inset }, end: { x: pageW - inset - bracketLen, y: pageH - inset }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: pageW - inset, y: pageH - inset }, end: { x: pageW - inset, y: pageH - inset - bracketLen }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: inset, y: inset }, end: { x: inset + bracketLen, y: inset }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: inset, y: inset }, end: { x: inset, y: inset + bracketLen }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: pageW - inset, y: inset }, end: { x: pageW - inset - bracketLen, y: inset }, thickness: 1.5, color: c });
      page.drawLine({ start: { x: pageW - inset, y: inset }, end: { x: pageW - inset, y: inset + bracketLen }, thickness: 1.5, color: c });
    } else if (themeId === "modern") {
      page.drawRectangle({
        x: 0,
        y: pageH - 6 - bleed,
        width: pageW,
        height: 6,
        color: inkColor,
      });
    } else if (themeId === "leather_journal") {
      const inset = 16 + bleed;
      page.drawRectangle({
        x: inset,
        y: inset,
        width: pageW - inset * 2,
        height: pageH - inset * 2,
        borderColor: accentColor,
        borderWidth: 1,
      });
    } else if (themeId === "magazine_style") {
      page.drawRectangle({
        x: 0,
        y: pageH - 4 - bleed,
        width: pageW,
        height: 4,
        color: accentColor,
      });
    } else if (themeId === "timeline_split") {
      page.drawLine({
        start: { x: marginX - 14, y: bleed + 40 },
        end: { x: marginX - 14, y: pageH - bleed - 40 },
        thickness: 2,
        color: accentColor,
      });
    }

    if (print) {
      // Crop marks
      const c = rgb(0, 0, 0);
      const l = 12;
      page.drawLine({ start: { x: bleed, y: pageH - bleed + 2 }, end: { x: bleed, y: pageH - bleed + l + 2 }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: bleed - 2, y: pageH - bleed }, end: { x: bleed - l - 2, y: pageH - bleed }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: pageW - bleed, y: pageH - bleed + 2 }, end: { x: pageW - bleed, y: pageH - bleed + l + 2 }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: pageW - bleed + 2, y: pageH - bleed }, end: { x: pageW - bleed + l + 2, y: pageH - bleed }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: bleed, y: bleed - 2 }, end: { x: bleed, y: bleed - l - 2 }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: bleed - 2, y: bleed }, end: { x: bleed - l - 2, y: bleed }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: pageW - bleed, y: bleed - 2 }, end: { x: pageW - bleed, y: bleed - l - 2 }, thickness: 0.5, color: c });
      page.drawLine({ start: { x: pageW - bleed + 2, y: bleed }, end: { x: pageW - bleed + l + 2, y: bleed }, thickness: 0.5, color: c });
    }
  };

  let page = doc.addPage([pageW, pageH]);
  let cursorY = pageH - marginTop;
  let pageNum = 1;
  drawPageBg(page);

  const newPage = () => {
    // Footer page number
    const label = String(pageNum);
    const w = mainFont.widthOfTextAtSize(label, 9);
    page.drawText(label, {
      x: (pageW - w) / 2,
      y: bleed + 36,
      size: 9,
      font: mainFont,
      color: mutedColor,
    });
    page = doc.addPage([pageW, pageH]);
    drawPageBg(page);
    cursorY = pageH - marginTop;
    pageNum += 1;
  };

  const ensureSpace = (needed: number) => {
    if (cursorY - needed < marginBottom) newPage();
  };

  const drawParagraph = (
    text: string,
    opts: { font?: any; size?: number; color?: any; align?: "left" | "center"; leading?: number; spaceAfter?: number } = {},
  ) => {
    const font = opts.font ?? mainFont;
    const size = opts.size ?? 11;
    const color = opts.color ?? inkColor;
    const leading = opts.leading ?? size * 1.5;
    const paragraphs = text.split(/\n\n+/);
    for (const p of paragraphs) {
      const lines = wrapText(p.trim(), font, size, contentW);
      for (const line of lines) {
        ensureSpace(leading);
        const w = font.widthOfTextAtSize(line, size);
        const x = opts.align === "center" ? (pageW - w) / 2 : marginX;
        page.drawText(line, { x, y: cursorY - size, size, font, color });
        cursorY -= leading;
      }
      cursorY -= (opts.spaceAfter ?? 6);
    }
  };

  const drawNarrativeWithDropCap = (narrativeText: string) => {
    const paragraphs = narrativeText.split(/\n\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length === 0) return;

    const firstP = paragraphs[0].trim();
    const firstLetter = firstP.charAt(0);
    const restFirstP = firstP.slice(1);

    ensureSpace(60);

    // Draw Drop Cap Box
    const boxSize = 32;
    const dropCapX = marginX;
    const dropCapY = cursorY - boxSize;

    page.drawRectangle({
      x: dropCapX,
      y: dropCapY,
      width: boxSize,
      height: boxSize,
      color: accentColor,
    });

    const letterW = mainFontBold.widthOfTextAtSize(firstLetter, 22);
    page.drawText(firstLetter, {
      x: dropCapX + (boxSize - letterW) / 2,
      y: dropCapY + 6,
      size: 22,
      font: mainFontBold,
      color: rgb(1, 1, 1),
    });

    // Wrap first 2 lines beside drop cap box
    const lines = wrapText(restFirstP, mainFont, 11, contentW);

    let isIndented = true;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (i < 2) {
        ensureSpace(16);
        page.drawText(line, {
          x: marginX + boxSize + 10,
          y: cursorY - 12,
          size: 11,
          font: mainFont,
          color: inkColor,
        });
        cursorY -= 16;
      } else {
        if (isIndented) {
          cursorY -= 4;
          isIndented = false;
        }
        ensureSpace(16);
        page.drawText(line, {
          x: marginX,
          y: cursorY - 12,
          size: 11,
          font: mainFont,
          color: inkColor,
        });
        cursorY -= 16;
      }
    }
    cursorY -= 10;

    // Remaining paragraphs full width
    for (let k = 1; k < paragraphs.length; k++) {
      drawParagraph(paragraphs[k], { size: 11, leading: 17, spaceAfter: 10 });
    }
  };

  const drawQuoteBlock = (quoteText: string) => {
    const q = quoteText.trim();
    if (!q) return;
    ensureSpace(65);

    const qLines = wrapText(`“${q}”`, mainFontItalic, 11.5, contentW - 48);
    const textHeight = qLines.length * 17;
    const boxHeight = textHeight + 36; // top padding for star symbol & bottom padding

    // Card Fill & Border styling per theme (Matching the user's screenshot!)
    let cardBg = rgb(palette.bg[0] * 0.96, palette.bg[1] * 0.96, palette.bg[2] * 0.96);
    let cardBorder = accentColor;

    if (themeId === "storybook" || themeId === "family_album" || themeId === "timeline_split" || themeId === "classic") {
      cardBg = rgb(0.91, 0.96, 1.0); // Soft Blue Pill Card Fill as shown in user screenshot
      cardBorder = rgb(0.7, 0.88, 1.0);
    } else if (themeId === "leather_journal" || themeId === "scrapbook_memories") {
      cardBg = rgb(1, 0.98, 0.88); // Soft Sticky Note Yellow fill
      cardBorder = rgb(0.95, 0.8, 0.4);
    } else if (themeId === "coffee_table") {
      cardBg = rgb(0.14, 0.14, 0.14);
      cardBorder = rgb(0.96, 0.62, 0.04);
    }

    const cardX = marginX + 6;
    const cardW = contentW - 12;
    const cardY = cursorY - boxHeight;

    // Draw Quote Card Rectangle Container
    page.drawRectangle({
      x: cardX,
      y: cardY,
      width: cardW,
      height: boxHeight,
      color: cardBg,
      borderColor: cardBorder,
      borderWidth: 1,
    });

    // Draw Star / Sparkles symbol at top center of card
    const starSymbol = "✦";
    const starW = mainFontBold.widthOfTextAtSize(starSymbol, 11);
    page.drawText(starSymbol, {
      x: (pageW - starW) / 2,
      y: cursorY - 16,
      size: 11,
      font: mainFontBold,
      color: accentColor,
    });

    // Draw Centered Italic Quote Lines
    let textY = cursorY - 32;
    for (const line of qLines) {
      const lw = mainFontItalic.widthOfTextAtSize(line, 11.5);
      page.drawText(line, {
        x: (pageW - lw) / 2,
        y: textY,
        size: 11.5,
        font: mainFontItalic,
        color: inkColor,
      });
      textY -= 17;
    }

    cursorY -= (boxHeight + 14);
  };

  const drawTimelineNodes = (timelineItems: Array<{ year: string; event: string }>) => {
    if (!Array.isArray(timelineItems) || timelineItems.length === 0) return;
    ensureSpace(40);

    drawParagraph("Chronological Timeline", { font: mainFontBold, size: 13, color: accentColor, leading: 18, spaceAfter: 10 });

    for (const item of timelineItems) {
      ensureSpace(24);
      const yrText = String(item.year || "");
      const yrW = mainFontBold.widthOfTextAtSize(yrText, 9) + 12;

      page.drawRectangle({
        x: marginX,
        y: cursorY - 16,
        width: yrW,
        height: 16,
        color: accentColor,
      });

      page.drawText(yrText, {
        x: marginX + 6,
        y: cursorY - 12,
        size: 9,
        font: mainFontBold,
        color: rgb(1, 1, 1),
      });

      const lines = wrapText(item.event, mainFont, 10.5, contentW - yrW - 14);
      let ey = cursorY - 13;
      for (const line of lines) {
        page.drawText(line, {
          x: marginX + yrW + 10,
          y: ey,
          size: 10.5,
          font: mainFont,
          color: inkColor,
        });
        ey -= 15;
      }
      cursorY -= Math.max(22, lines.length * 15 + 6);
    }
  };

  const drawDivider = () => {
    ensureSpace(20);
    if (themeId === "classic" || themeId === "heritage") {
      page.drawLine({
        start: { x: marginX + 40, y: cursorY - 10 },
        end: { x: pageW - marginX - 40, y: cursorY - 10 },
        thickness: 1,
        color: accentColor,
      });
      cursorY -= 20;
    } else if (themeId === "modern" || themeId === "magazine_style") {
      page.drawRectangle({
        x: marginX,
        y: cursorY - 6,
        width: 40,
        height: 3,
        color: accentColor,
      });
      cursorY -= 16;
    } else if (themeId === "leather_journal" || themeId === "scrapbook_memories") {
      page.drawLine({
        start: { x: marginX, y: cursorY - 10 },
        end: { x: pageW - marginX, y: cursorY - 10 },
        thickness: 1,
        color: mutedColor,
        dashArray: [4, 4],
      });
      cursorY -= 20;
    } else if (themeId === "coffee_table") {
      page.drawRectangle({
        x: marginX,
        y: cursorY - 4,
        width: contentW,
        height: 2,
        color: accentColor,
      });
      cursorY -= 16;
    } else {
      page.drawLine({
        start: { x: marginX + 20, y: cursorY - 10 },
        end: { x: pageW - marginX - 20, y: cursorY - 10 },
        thickness: 0.5,
        color: mutedColor,
      });
      cursorY -= 18;
    }
  };

  // ---- Cover Page ----
  if (themeId === "coffee_table") {
    cursorY = pageH * 0.6;
    drawParagraph(data.book.name || "A Family History", {
      font: mainFontBold,
      size: 36,
      color: accentColor,
      align: "center",
      leading: 42,
      spaceAfter: 16,
    });
    drawParagraph("HEIRLOOM PHOTOGRAPHY & BIOGRAPHY", {
      font: mainFont,
      size: 10,
      color: mutedColor,
      align: "center",
      leading: 14,
      spaceAfter: 40,
    });
  } else if (themeId === "heritage") {
    cursorY = pageH * 0.65;
    drawParagraph("★ THE CHRONICLES OF OUR LEGACY ★", {
      font: mainFontItalic,
      size: 10,
      color: accentColor,
      align: "center",
      leading: 14,
      spaceAfter: 20,
    });
    drawParagraph(data.book.name || "A Family History", {
      font: mainFontBold,
      size: 32,
      color: inkColor,
      align: "center",
      leading: 38,
      spaceAfter: 16,
    });
    drawDivider();
  } else if (themeId === "magazine_style") {
    cursorY = pageH * 0.7;
    page.drawRectangle({ x: marginX, y: cursorY, width: 110, height: 18, color: accentColor });
    page.drawText("SPECIAL EDITION", { x: marginX + 8, y: cursorY + 5, size: 8, font: mainFontBold, color: rgb(1, 1, 1) });
    cursorY -= 30;
    drawParagraph(data.book.name || "A Family History", {
      font: mainFontBold,
      size: 36,
      color: inkColor,
      align: "left",
      leading: 42,
      spaceAfter: 20,
    });
  } else {
    cursorY = pageH * 0.66;
    drawParagraph(data.book.name || "A Family History", {
      font: mainFontBold,
      size: 34,
      color: accentColor,
      align: "center",
      leading: 40,
      spaceAfter: 20,
    });
    drawParagraph("A Family History Memoir", {
      font: mainFontItalic,
      size: 14,
      color: mutedColor,
      align: "center",
      leading: 18,
      spaceAfter: 40,
    });
    drawDivider();
  }

  if (data.book.date_of_birth || data.book.country) {
    const meta = [data.book.date_of_birth, data.book.country].filter(Boolean).join(" · ");
    drawParagraph(meta, { size: 11, color: mutedColor, align: "center" });
  }
  newPage();

  // ---- Introduction ----
  if (data.manuscript?.introduction) {
    drawParagraph("Introduction", { font: mainFontBold, size: 22, color: accentColor, leading: 28, spaceAfter: 16 });
    drawNarrativeWithDropCap(data.manuscript.introduction);
    newPage();
  }

  // ---- Chapters ----
  for (const ch of data.chapters) {
    // Chapter Opener Badge
    ensureSpace(60);
    const chipText = `Chapter ${ch.position}`;
    const chipW = mainFontBold.widthOfTextAtSize(chipText, 9) + 16;
    page.drawRectangle({
      x: marginX,
      y: cursorY - 18,
      width: chipW,
      height: 18,
      color: accentColor,
    });
    page.drawText(chipText, {
      x: marginX + 8,
      y: cursorY - 13,
      size: 9,
      font: mainFontBold,
      color: rgb(1, 1, 1),
    });
    cursorY -= 28;

    drawParagraph(ch.title || ch.topic, { font: mainFontBold, size: 22, color: inkColor, leading: 28, spaceAfter: 12 });
    drawDivider();

    if (ch.narrative) {
      drawNarrativeWithDropCap(ch.narrative);
    }

    if (Array.isArray(ch.timeline) && ch.timeline.length > 0) {
      drawTimelineNodes(ch.timeline);
    }

    if (Array.isArray(ch.quotes) && ch.quotes.length > 0) {
      for (const q of ch.quotes) {
        drawQuoteBlock(q);
      }
    }
    newPage();
  }

  // ---- Ending ----
  if (data.manuscript?.ending) {
    drawParagraph("Ending Message", { font: mainFontBold, size: 22, color: accentColor, leading: 28, spaceAfter: 16 });
    drawNarrativeWithDropCap(data.manuscript.ending);
  }

  // Final footer
  {
    const label = String(pageNum);
    const w = mainFont.widthOfTextAtSize(label, 9);
    page.drawText(label, {
      x: (pageW - w) / 2,
      y: bleed + 36,
      size: 9,
      font: mainFont,
      color: mutedColor,
    });
  }

  return await doc.save();
}

// --------- DOCX Engine ---------

async function buildDocx(data: Awaited<ReturnType<typeof loadBookData>>): Promise<Uint8Array> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 4000, after: 400 },
      children: [
        new TextRun({ text: data.book.name || "A Family History", bold: true, size: 64, font: "Georgia" }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "A Family History", italics: true, size: 28, font: "Georgia" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: [data.book.date_of_birth, data.book.country].filter(Boolean).join(" · "),
          size: 22,
          font: "Georgia",
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  if (data.manuscript?.introduction) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [new TextRun({ text: "Introduction", bold: true, size: 40, font: "Georgia" })],
      }),
    );
    for (const p of data.manuscript.introduction.split(/\n\n+/)) {
      children.push(
        new Paragraph({
          spacing: { after: 200, line: 340 },
          children: [new TextRun({ text: p.trim(), size: 24, font: "Georgia" })],
        }),
      );
    }
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  for (const ch of data.chapters) {
    children.push(
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: `Chapter ${ch.position}`, italics: true, size: 20, color: "6b6b6b", font: "Georgia" })],
      }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [new TextRun({ text: ch.title || ch.topic, bold: true, size: 40, font: "Georgia" })],
      }),
    );
    for (const p of (ch.narrative || "").split(/\n\n+/)) {
      if (!p.trim()) continue;
      children.push(
        new Paragraph({
          spacing: { after: 200, line: 340 },
          children: [new TextRun({ text: p.trim(), size: 24, font: "Georgia" })],
        }),
      );
    }

    if (Array.isArray(ch.timeline) && ch.timeline.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: "Timeline", bold: true, size: 26, font: "Georgia" })],
        }),
      );
      for (const t of ch.timeline) {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${t.year} — `, bold: true, size: 22, font: "Georgia" }),
              new TextRun({ text: t.event, size: 22, font: "Georgia" }),
            ],
          }),
        );
      }
    }

    if (Array.isArray(ch.quotes) && ch.quotes.length > 0) {
      for (const q of ch.quotes) {
        if (!q?.trim()) continue;
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: `"${q.trim()}"`,
                italics: true,
                size: 26,
                color: "8B5E3C",
                font: "Georgia",
              }),
            ],
          }),
        );
      }
    }

    children.push(new Paragraph({ children: [new PageBreak()] }));
  }

  if (data.manuscript?.ending) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
        children: [new TextRun({ text: "Ending Message", bold: true, size: 40, font: "Georgia" })],
      }),
    );
    for (const p of data.manuscript.ending.split(/\n\n+/)) {
      children.push(
        new Paragraph({
          spacing: { after: 200, line: 340 },
          children: [new TextRun({ text: p.trim(), size: 24, font: "Georgia" })],
        }),
      );
    }
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

// --------- Server Exports Functions ---------

function slugify(s: string): string {
  return (s || "family-history")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "family-history";
}

async function ensureBucketExists(bucketName: string, isPublic = false) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bucket } = await supabaseAdmin.storage.getBucket(bucketName);
    if (!bucket) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 104857600,
      });
    }
  } catch {
    // Ignore bucket check error
  }
}

export const exportBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string; kind: Kind; theme?: string }) =>
    z.object({ bookId: z.string().uuid(), kind: kindEnum, theme: z.string().optional() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const loaded = await loadBookData(context.supabase, data.bookId);

    let bytes: Uint8Array;
    let ext: "pdf" | "docx";
    let contentType: string;
    let suffix: string;

    const activeTheme = data.theme || loaded.manuscript?.theme || "classic";

    if (data.kind === "pdf") {
      bytes = await buildPdf(loaded, false, activeTheme);
      ext = "pdf";
      contentType = "application/pdf";
      suffix = `-${activeTheme}`;
    } else if (data.kind === "print_pdf") {
      bytes = await buildPdf(loaded, true, activeTheme);
      ext = "pdf";
      contentType = "application/pdf";
      suffix = `-${activeTheme}-print-ready`;
    } else {
      bytes = await buildDocx(loaded);
      ext = "docx";
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      suffix = `-${activeTheme}`;
    }

    const base = slugify(loaded.book.name);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${base}${suffix}-${stamp}.${ext}`;
    const path = `${context.userId}/${data.bookId}/${filename}`;

    await ensureBucketExists("book-exports", false);

    let upErr: any = null;
    try {
      const res = await context.supabase.storage
        .from("book-exports")
        .upload(path, bytes, { contentType, upsert: true });
      upErr = res.error;
    } catch (err: any) {
      upErr = err;
    }

    if (upErr) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.storage.createBucket("book-exports", { public: false }).catch(() => {});
      const { error: adminUpErr } = await supabaseAdmin.storage
        .from("book-exports")
        .upload(path, bytes, { contentType, upsert: true });
      if (adminUpErr) throw new Error(adminUpErr.message || upErr?.message || "Storage upload error");
    }

    const { data: row, error: insErr } = await context.supabase
      .from("book_exports")
      .insert({
        book_id: data.bookId,
        user_id: context.userId,
        kind: data.kind,
        storage_path: path,
        filename,
        size_bytes: bytes.byteLength,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);

    return {
      ...row,
      url: `/api/downloads/${row.id}`,
    };
  });

export const generateExport = exportBook;

export const listExports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string }) =>
    z.object({ bookId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("book_exports")
      .select("*")
      .eq("book_id", data.bookId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r: any) => ({
      ...r,
      url: `/api/downloads/${r.id}`,
    }));
  });

export const deleteExport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error: fErr } = await context.supabase
      .from("book_exports")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!row) throw new Error("Not found");
    try {
      await context.supabase.storage.from("book-exports").remove([row.storage_path]);
    } catch {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.storage.from("book-exports").remove([row.storage_path]).catch(() => {});
    }
    const { error } = await context.supabase.from("book_exports").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllMyExports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("book_exports")
      .select("id, book_id, kind, filename, storage_path, created_at, size_bytes, books(name)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (rows ?? []).map((r: any) => ({
      ...r,
      book_name: r.books?.name ?? "Family History Book",
      url: `/api/downloads/${r.id}`,
    }));
  });
