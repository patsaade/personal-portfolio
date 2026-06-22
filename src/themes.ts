// DFIR theme registry — single source of truth.
// Each theme defines the full set of semantic color variables Panda emits.
// `mode` drives code-block (Shiki) light/dark and native form control rendering.

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
   *  dark value for light/bright primaries (matrix, amber) for legibility. */
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
    id: 'midnight',
    name: 'Midnight Recon',
    mode: 'dark',
    blurb: 'Deep slate & electric blue — the default analyst console.',
    colors: {
      bg: '#030712',
      bgSubtle: '#0f172a',
      bgCard: '#111a2e',
      border: '#1e293b',
      text: '#ffffff',
      textMuted: '#94a3b8',
      primary: '#3b82f6',
      primaryHover: '#60a5fa',
      accent: '#4ade80',
      codeBg: '#0f172a',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix Shell',
    mode: 'dark',
    blurb: 'Phosphor-green on near-black. Pure terminal.',
    colors: {
      bg: '#04100a',
      bgSubtle: '#08180f',
      bgCard: '#0a1f13',
      border: '#15532e',
      text: '#d1fae5',
      textMuted: '#6f9d82',
      primary: '#22c55e',
      primaryHover: '#4ade80',
      accent: '#a3e635',
      codeBg: '#08180f',
      onPrimary: '#04100a',
    },
  },
  {
    id: 'amber',
    name: 'Amber CRT',
    mode: 'dark',
    blurb: 'Warm amber glow of a vintage forensic workstation.',
    colors: {
      bg: '#140d02',
      bgSubtle: '#1d1404',
      bgCard: '#241a06',
      border: '#4d3a12',
      text: '#fde9c8',
      textMuted: '#b08d5b',
      primary: '#f59e0b',
      primaryHover: '#fbbf24',
      accent: '#f97316',
      codeBg: '#1d1404',
      onPrimary: '#1d1404',
    },
  },
  {
    id: 'blackout',
    name: 'Incident Red',
    mode: 'dark',
    blurb: 'Blackout with alert-red highlights. Containment mode.',
    colors: {
      bg: '#0c0909',
      bgSubtle: '#1a1212',
      bgCard: '#211616',
      border: '#4c1d1d',
      text: '#fef2f2',
      textMuted: '#bb9a9a',
      primary: '#ef4444',
      primaryHover: '#f87171',
      accent: '#f59e0b',
      codeBg: '#1a1212',
    },
  },
  {
    id: 'synthwave',
    name: 'Synthwave C2',
    mode: 'dark',
    blurb: 'Indigo night, magenta primary, cyan beacons.',
    colors: {
      bg: '#0d0a1f',
      bgSubtle: '#16112e',
      bgCard: '#1b1539',
      border: '#322a5e',
      text: '#ede9fe',
      textMuted: '#a99fd6',
      primary: '#a855f7',
      primaryHover: '#c084fc',
      accent: '#22d3ee',
      codeBg: '#16112e',
    },
  },

  // ───────────────────────── LIGHT ─────────────────────────
  {
    id: 'paper',
    name: 'Forensic Paper',
    mode: 'light',
    blurb: 'Clean white report stock. Deep blue & green.',
    colors: {
      bg: '#ffffff',
      bgSubtle: '#f8fafc',
      bgCard: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
      textMuted: '#475569',
      primary: '#1e40af',
      primaryHover: '#1e3a8a',
      accent: '#15803d',
      codeBg: '#f1f5f9',
    },
  },
  {
    id: 'tape',
    name: 'Evidence Tape',
    mode: 'light',
    blurb: 'Caution-tape warm paper with amber accents.',
    colors: {
      bg: '#fffdf4',
      bgSubtle: '#fdf6e3',
      bgCard: '#fffef9',
      border: '#ece2c4',
      text: '#2b2410',
      textMuted: '#7a6a3a',
      primary: '#b45309',
      primaryHover: '#92400e',
      accent: '#a16207',
      codeBg: '#f7eed3',
    },
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    mode: 'light',
    blurb: 'Cool blue-grey schematic. Navy & teal.',
    colors: {
      bg: '#eef3fb',
      bgSubtle: '#e2eaf6',
      bgCard: '#f7faff',
      border: '#c5d4ec',
      text: '#16243b',
      textMuted: '#4a5e7e',
      primary: '#1e3a8a',
      primaryHover: '#1e40af',
      accent: '#0e7490',
      codeBg: '#dde7f6',
    },
  },
  {
    id: 'sandstorm',
    name: 'Sandstorm',
    mode: 'light',
    blurb: 'Earthy desert beige, terracotta & olive.',
    colors: {
      bg: '#faf4e8',
      bgSubtle: '#f3e9d6',
      bgCard: '#fdf9f0',
      border: '#e0cfab',
      text: '#2f2412',
      textMuted: '#7c6740',
      primary: '#9a3412',
      primaryHover: '#7c2d12',
      accent: '#4d7c0f',
      codeBg: '#efe2c8',
    },
  },
  {
    id: 'lab',
    name: 'Clean Lab',
    mode: 'light',
    blurb: 'Clinical mint with teal & blue. Sterile and crisp.',
    colors: {
      bg: '#f2faf7',
      bgSubtle: '#e3f3ed',
      bgCard: '#fbfffe',
      border: '#c4e4d8',
      text: '#0f2b22',
      textMuted: '#44705f',
      primary: '#0f766e',
      primaryHover: '#115e59',
      accent: '#2563eb',
      codeBg: '#def0e9',
    },
  },
];

export const DARK_THEMES = THEMES.filter((t) => t.mode === 'dark');
export const LIGHT_THEMES = THEMES.filter((t) => t.mode === 'light');

export const DEFAULT_DARK = 'midnight';
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
