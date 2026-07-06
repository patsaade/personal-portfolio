// Build-time renderer for social cards + brand marks (satori -> SVG -> sharp -> PNG).
// Runs only at build (prerendered OG endpoint) and in scripts/gen-brand.mjs — it
// ships nothing to the browser. Fonts are the self-hosted Redaction (OTF) + Fira
// Mono (TTF); satori embeds glyphs as paths so the output PNG needs no fonts.
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { starCells, STAR_GRID } from './star.mjs';

const FONT = (name) => readFileSync(resolve(process.cwd(), 'src/og/fonts', name));
const FONTS = [
  { name: 'Redaction', data: FONT('Redaction-Regular.otf'), weight: 400, style: 'normal' },
  { name: 'Redaction', data: FONT('Redaction-Bold.otf'), weight: 700, style: 'normal' },
  { name: 'Redaction 50', data: FONT('Redaction50-Bold.otf'), weight: 700, style: 'normal' },
  { name: 'Fira Mono', data: FONT('FiraMono-Regular.ttf'), weight: 400, style: 'normal' },
  { name: 'Fira Mono', data: FONT('FiraMono-Medium.ttf'), weight: 500, style: 'normal' },
];

// Brand palette = the site's default dark theme (Mauve Mocha), so cards read as
// the site regardless of the visitor's chosen theme.
const C = {
  bg: '#1b1518',
  card: '#2c2429',
  border: '#473b45',
  text: '#ede4ec',
  muted: '#b8a6b6',
  primary: '#cba8de',
  accent: '#edab8d',
};

const h = (type, style, children) => ({ type, props: { style, ...(children !== undefined ? { children } : {}) } });

// ── Brand mark: a pixelated 5-point star (a nod to "Patrick" Star) in soft pink,
//    on the rounded theme tile. Drives the favicon/app icons and the card lockup.
const STAR = '#f4a3c0'; // soft Patrick-pink, pops on the dark mauve tile
const GRID = STAR_GRID; // star raster resolution (chunky, legible at 16px)
const STAR_PAD = 0.13; // tile padding around the star, as a fraction of size

// The mark as a self-contained SVG string (rounded tile + pixel-star rects).
function markSvg(size, { bleed = true } = {}) {
  const tileR = Math.round(size * (bleed ? 0.2 : 0.24));
  const pad = size * STAR_PAD;
  const cell = (size - pad * 2) / GRID;
  const px = (cell + 0.6).toFixed(2); // overlap avoids hairline seams when rasterized
  const rects = starCells(GRID)
    .map(([x, y]) => `<rect x="${(pad + x * cell).toFixed(2)}" y="${(pad + y * cell).toFixed(2)}" width="${px}" height="${px}" fill="${STAR}"/>`)
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" rx="${tileR}" fill="${bleed ? C.bg : C.card}"/>` +
    `<rect x="0.75" y="0.75" width="${(size - 1.5).toFixed(2)}" height="${(size - 1.5).toFixed(2)}" rx="${Math.max(0, tileR - 1)}" fill="none" stroke="#5a4b58" stroke-width="1.5"/>` +
    rects +
    '</svg>'
  );
}

// The same mark as a satori node, for the social-card lockup tile.
function markNode(size) {
  const pad = size * STAR_PAD;
  const cell = (size - pad * 2) / GRID;
  const pixels = starCells(GRID).map(([x, y]) =>
    h('div', { position: 'absolute', left: pad + x * cell, top: pad + y * cell, width: cell + 0.6, height: cell + 0.6, backgroundColor: STAR }),
  );
  return h(
    'div',
    {
      position: 'relative',
      display: 'flex',
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.24),
      backgroundColor: C.card,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: C.border,
    },
    pixels,
  );
}

function titleSize(t) {
  const n = t.length;
  if (n <= 18) return 90;
  if (n <= 30) return 76;
  if (n <= 46) return 64;
  if (n <= 64) return 54;
  return 46;
}

function clamp(s, max) {
  s = String(s || '').trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
}

// The 1200x630 social card. `title` is the page heading, `eyebrow` the section.
function cardTree({ title, eyebrow }) {
  title = clamp(title, 84);
  eyebrow = clamp((eyebrow || '').toUpperCase(), 42);
  return h('div', { width: 1200, height: 630, display: 'flex', backgroundColor: C.bg, fontFamily: 'Redaction', color: C.text, padding: 48 }, [
    h(
      'div',
      {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexGrow: 1,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: C.border,
        borderRadius: 24,
        paddingTop: 56,
        paddingBottom: 56,
        paddingLeft: 66,
        paddingRight: 66,
      },
      [
        // brand lockup
        h('div', { display: 'flex', alignItems: 'center' }, [
          markNode(58),
          h('div', { fontFamily: 'Redaction 50', fontWeight: 700, fontSize: 34, color: C.text, marginLeft: 20 }, 'Patrick Saade'),
        ]),
        // eyebrow + title
        h('div', { display: 'flex', flexDirection: 'column' }, [
          h('div', { fontFamily: 'Fira Mono', fontWeight: 500, fontSize: 25, letterSpacing: 3, color: C.primary, marginBottom: 18 }, eyebrow || ' '),
          h('div', { display: 'flex', fontWeight: 700, fontSize: titleSize(title), lineHeight: 1.05, letterSpacing: -1, color: C.text, maxWidth: 1000 }, title),
        ]),
        // url + tagline
        h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
          h('div', { fontFamily: 'Fira Mono', fontSize: 26, color: C.muted }, 'www.patricksaade.com'),
          h('div', { fontFamily: 'Fira Mono', fontSize: 22, color: C.muted }, 'Digital Forensics & Incident Response'),
        ]),
      ],
    ),
  ]);
}

async function toSvg(tree, w, h2) {
  return satori(tree, { width: w, height: h2, fonts: FONTS });
}

/** Render a 1200x630 social card PNG. */
export async function renderCardPng({ title, eyebrow }) {
  const svg = await toSvg(cardTree({ title, eyebrow }), 1200, 630);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** The brand mark as a self-contained SVG (pixel-star, scales cleanly as a favicon). */
export async function renderMarkSvg(size) {
  return markSvg(size, { bleed: true });
}

/** Render the brand mark to a PNG of `size`px (icons / apple-touch). */
export async function renderMarkPng(size) {
  // Render large for crisp pixels, downscale with sharp.
  return sharp(Buffer.from(markSvg(512, { bleed: true }))).resize(size, size).png().toBuffer();
}

export { C as OG_PALETTE };
