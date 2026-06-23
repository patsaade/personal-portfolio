// Build-time renderer for social cards + brand marks (satori -> SVG -> sharp -> PNG).
// Runs only at build (prerendered OG endpoint) and in scripts/gen-brand.mjs — it
// ships nothing to the browser. Fonts are the self-hosted Redaction (OTF) + Fira
// Mono (TTF); satori embeds glyphs as paths so the output PNG needs no fonts.
import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

// The "ps" monogram mark — a rounded tile with an eroded-Redaction wordmark and
// a small accent underbar. Used in the card lockup and (full-bleed) as the icon.
function mark(size, { bleed = false, eroded = false } = {}) {
  return h(
    'div',
    {
      width: size,
      height: size,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderRadius: Math.round(size * (bleed ? 0.2 : 0.24)),
      backgroundColor: bleed ? C.bg : C.card,
      borderWidth: Math.max(1, Math.round(size * 0.02)),
      borderStyle: 'solid',
      borderColor: bleed ? '#5a4b58' : C.border,
    },
    [
      h(
        'div',
        {
          // Eroded grade for the large card lockup; clean Redaction for the small
          // favicon/icons so the "ps" stays legible at 16px.
          fontFamily: eroded ? 'Redaction 50' : 'Redaction',
          fontWeight: 700,
          fontSize: Math.round(size * (eroded ? 0.46 : 0.5)),
          lineHeight: 1,
          color: C.primary,
        },
        'ps',
      ),
      h('div', {
        position: 'absolute',
        bottom: Math.round(size * 0.18),
        width: Math.round(size * 0.34),
        height: Math.max(2, Math.round(size * 0.05)),
        borderRadius: 99,
        backgroundColor: C.accent,
      }),
    ],
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
          mark(58, { eroded: true }),
          h('div', { fontFamily: 'Redaction 50', fontWeight: 700, fontSize: 34, color: C.text, marginLeft: 20 }, 'Patrick Saade'),
        ]),
        // eyebrow + title
        h('div', { display: 'flex', flexDirection: 'column' }, [
          h('div', { fontFamily: 'Fira Mono', fontWeight: 500, fontSize: 25, letterSpacing: 3, color: C.primary, marginBottom: 18 }, eyebrow || ' '),
          h('div', { display: 'flex', fontWeight: 700, fontSize: titleSize(title), lineHeight: 1.05, letterSpacing: -1, color: C.text, maxWidth: 1000 }, title),
        ]),
        // url + tagline
        h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
          h('div', { fontFamily: 'Fira Mono', fontSize: 26, color: C.muted }, 'patricksaade.com'),
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

/** Render the brand mark as a self-contained SVG (glyphs as paths) at `size`px.
 *  satori already emits width/height + viewBox, so it scales cleanly as a favicon. */
export async function renderMarkSvg(size) {
  const tree = h('div', { display: 'flex', width: size, height: size }, [mark(size, { bleed: true })]);
  return toSvg(tree, size, size);
}

/** Render the brand mark to a PNG of `size`px (icons / apple-touch). */
export async function renderMarkPng(size) {
  // Render large for crispness, downscale with sharp.
  const svg = await renderMarkSvg(512);
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

export { C as OG_PALETTE };
