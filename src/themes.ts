// DFIR theme registry — single source of truth.
// Each theme defines the full set of semantic color variables Panda emits.
// `mode` drives code-block (Shiki) light/dark and native form control rendering.
//
// Palette direction: warm, muted, pastel — each theme a distinct, readable
// concept (every text/bg pair clears WCAG AA, most AAA). Dark + light, 5 each.

export interface ThemeColors {
  bg: string;
  bgSubtle: string;
  bgCard: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  codeBg: string;
  /** Text/icon color on a `primary` fill (buttons). Defaults to white; set a
   *  dark value for light/bright (pastel) primaries so labels stay legible. */
  onPrimary?: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: 'dark' | 'light';
  blurb: string;
  colors: ThemeColors;
}

export const THEMES: Theme[] = [
  // ───────────────────────── DARK ─────────────────────────
  {
    id: 'amber',
    name: 'Amber CRT',
    mode: 'dark',
    blurb: 'The warm amber glow of a vintage phosphor terminal, cozy against a deep roasted-brown night.',
    colors: {
      bg: '#150d02',
      bgSubtle: '#1e1505',
      bgCard: '#251b08',
      border: '#4d3813',
      text: '#fbe7c6',
      textMuted: '#c69d63',
      primary: '#f0a838',
      primaryHover: '#f8c463',
      accent: '#e8a23f',
      codeBg: '#1e1505',
      onPrimary: '#150d02',
    },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    mode: 'dark',
    blurb: 'Dusty 80s pastels — a soft magenta and dreamy aqua drifting over deep indigo dusk.',
    colors: {
      bg: '#161226',
      bgSubtle: '#1f1a34',
      bgCard: '#26203f',
      border: '#3d365c',
      text: '#ece7f6',
      textMuted: '#a99fc6',
      primary: '#dc92c2',
      primaryHover: '#e8abd4',
      accent: '#7ad0d6',
      codeBg: '#1f1a34',
      onPrimary: '#161226',
    },
  },
  {
    id: 'forest',
    name: 'Forest Ember',
    mode: 'dark',
    blurb: 'Woodland at dusk — muted sage greens warmed by the glow of a low amber ember.',
    colors: {
      bg: '#121913',
      bgSubtle: '#19221b',
      bgCard: '#1e2921',
      border: '#37483a',
      text: '#e4ecdc',
      textMuted: '#9bb198',
      primary: '#9cc488',
      primaryHover: '#b6d6a4',
      accent: '#e3a55c',
      codeBg: '#19221b',
      onPrimary: '#121913',
    },
  },
  {
    id: 'mauve',
    name: 'Mauve Mocha',
    mode: 'dark',
    blurb: 'Coffee-house cozy — soft mauve and lavender with a warm peach glow, steeped in dark roast.',
    colors: {
      bg: '#1b1518',
      bgSubtle: '#241d22',
      bgCard: '#2c2429',
      border: '#473b45',
      text: '#ede4ec',
      textMuted: '#b8a6b6',
      primary: '#cba8de',
      primaryHover: '#dbbeec',
      accent: '#edab8d',
      codeBg: '#241d22',
      onPrimary: '#1b1518',
    },
  },
  {
    id: 'rose',
    name: 'Rosé Dusk',
    mode: 'dark',
    blurb: 'Soft rosé twilight with a warm gold accent, hushed against a charcoal-plum night.',
    colors: {
      bg: '#1a1521',
      bgSubtle: '#231d2b',
      bgCard: '#2a2333',
      border: '#463c54',
      text: '#ece6ef',
      textMuted: '#b2a5bf',
      primary: '#e29db1',
      primaryHover: '#efb5c6',
      accent: '#e9cb8c',
      codeBg: '#231d2b',
      onPrimary: '#1a1521',
    },
  },

  // ───────────────────────── LIGHT ─────────────────────────
  // Ordered to mirror the dark themes above — each light is the daylight
  // complement of the dark in the same position (amber↔sand, vaporwave↔mist,
  // forest↔latte, mauve↔café crème, rosé dusk↔rosé dawn).
  {
    id: 'sand',
    name: 'Sandstorm',
    mode: 'light',
    blurb: 'Sun-warmed desert paper in sand and clay, with fired terracotta and a dusty olive accent.',
    colors: {
      bg: '#f8f1e2',
      bgSubtle: '#f1e5cf',
      bgCard: '#fdf8ee',
      border: '#dcc499',
      text: '#2c2414',
      textMuted: '#74613b',
      primary: '#a64a26',
      primaryHover: '#8a3c1d',
      accent: '#566425',
      codeBg: '#efe1c5',
      onPrimary: '#fdf8ee',
    },
  },
  {
    id: 'mist',
    name: 'Lavender Mist',
    mode: 'light',
    blurb: 'A soft lavender haze of muted violet and dusty teal drifting over pale petal-white.',
    colors: {
      bg: '#f6f3fb',
      bgSubtle: '#eee8f6',
      bgCard: '#fdfbff',
      border: '#d2c6e4',
      text: '#2c2738',
      textMuted: '#635a7c',
      primary: '#6d52a7',
      primaryHover: '#5a4290',
      accent: '#36686f',
      codeBg: '#e9e2f4',
    },
  },
  {
    id: 'latte',
    name: 'Matcha Latte',
    mode: 'light',
    blurb: 'Matcha-latte calm — soft muted green over warm cream, finished with a clay-terracotta accent.',
    colors: {
      bg: '#f6f3e8',
      bgSubtle: '#ece8d7',
      bgCard: '#fffef9',
      border: '#d6cdb4',
      text: '#232217',
      textMuted: '#5d5942',
      primary: '#4f6b2e',
      primaryHover: '#3d551f',
      accent: '#a5512d',
      codeBg: '#efead9',
    },
  },
  {
    id: 'paper',
    name: 'Café Crème',
    mode: 'light',
    blurb: 'Creamy café-au-lait light — soft mauve and peach over warm parchment.',
    colors: {
      bg: '#f5f1f2',
      bgSubtle: '#ebe4e8',
      bgCard: '#fffdfe',
      border: '#ddd1d8',
      text: '#2a2127',
      textMuted: '#6d5e68',
      primary: '#82548f',
      primaryHover: '#6b4277',
      accent: '#a94f38',
      codeBg: '#ede4ea',
    },
  },
  {
    id: 'dawn',
    name: 'Rosé Dawn',
    mode: 'light',
    blurb: 'A blush off-white morning brushed with muted rose and quiet pine — gentle and pastel.',
    colors: {
      bg: '#fbf4f2',
      bgSubtle: '#f6e8e5',
      bgCard: '#fffafa',
      border: '#e3c8c2',
      text: '#2e252a',
      textMuted: '#765c63',
      primary: '#a4426a',
      primaryHover: '#883354',
      accent: '#2f6f64',
      codeBg: '#f4e2dd',
    },
  },
];

export const DARK_THEMES = THEMES.filter((t) => t.mode === 'dark');
export const LIGHT_THEMES = THEMES.filter((t) => t.mode === 'light');

export const DEFAULT_DARK = 'mauve';
export const DEFAULT_LIGHT = 'paper';

/** Map of theme id -> mode, for the inline pre-paint script. */
export const THEME_MODES: Record<string, 'dark' | 'light'> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.mode]),
);

/** Map of theme id -> page bg, so the pre-paint script can keep the mobile
 *  browser-chrome `theme-color` meta in sync with the active palette. */
export const THEME_BG: Record<string, string> = Object.fromEntries(
  THEMES.map((t) => [t.id, t.colors.bg]),
);

/** CSS-var name for each color key (matches Panda's generated names).
 *  `onPrimary` is excluded — it's emitted separately (with a default) in buildThemeCss. */
const VAR_NAMES: Record<Exclude<keyof ThemeColors, 'onPrimary'>, string> = {
  bg: '--colors-bg',
  bgSubtle: '--colors-bg-subtle',
  bgCard: '--colors-bg-card',
  border: '--colors-border',
  text: '--colors-text',
  textMuted: '--colors-text-muted',
  primary: '--colors-primary',
  primaryHover: '--colors-primary-hover',
  accent: '--colors-accent',
  codeBg: '--colors-code-bg',
};

/** Build the unlayered CSS that maps each theme id to its variable overrides. */
export function buildThemeCss(): string {
  return THEMES.map((theme) => {
    const decls = (Object.keys(VAR_NAMES) as Exclude<keyof ThemeColors, 'onPrimary'>[])
      .map((key) => `${VAR_NAMES[key]}: ${theme.colors[key]};`)
      .join('');
    // onPrimary is optional in the registry; default to white.
    const onPrimary = `--colors-on-primary: ${theme.colors.onPrimary ?? '#ffffff'};`;
    return `:root[data-theme="${theme.id}"]{color-scheme:${theme.mode};${decls}${onPrimary}}`;
  }).join('\n');
}
