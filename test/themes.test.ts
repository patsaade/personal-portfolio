import { describe, it, expect } from 'vitest';
import {
  THEMES,
  DARK_THEMES,
  LIGHT_THEMES,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  THEME_MODES,
  buildThemeCss,
  type ThemeColors,
} from '../src/themes';

const COLOR_KEYS: (keyof ThemeColors)[] = [
  'bg',
  'bgSubtle',
  'bgCard',
  'border',
  'text',
  'textMuted',
  'primary',
  'primaryHover',
  'accent',
  'codeBg',
];

describe('theme registry', () => {
  it('offers exactly 5 dark and 5 light themes', () => {
    expect(DARK_THEMES).toHaveLength(5);
    expect(LIGHT_THEMES).toHaveLength(5);
    expect(THEMES).toHaveLength(10);
  });

  it('has unique theme ids', () => {
    const ids = THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every theme a complete, non-empty color set', () => {
    for (const theme of THEMES) {
      for (const key of COLOR_KEYS) {
        expect(theme.colors[key], `${theme.id}.${key}`).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
    }
  });

  it('maps every theme id to its mode', () => {
    for (const theme of THEMES) {
      expect(THEME_MODES[theme.id]).toBe(theme.mode);
    }
  });

  it('uses valid, mode-correct defaults', () => {
    expect(THEME_MODES[DEFAULT_DARK]).toBe('dark');
    expect(THEME_MODES[DEFAULT_LIGHT]).toBe('light');
  });
});

describe('buildThemeCss', () => {
  const css = buildThemeCss();

  it('emits a scoped rule for every theme', () => {
    for (const theme of THEMES) {
      expect(css).toContain(`:root[data-theme="${theme.id}"]`);
    }
  });

  it('declares color-scheme matching each theme mode', () => {
    expect(css).toContain('color-scheme:dark');
    expect(css).toContain('color-scheme:light');
  });

  it('overrides the core Panda color variables', () => {
    expect(css).toContain('--colors-bg:');
    expect(css).toContain('--colors-primary:');
    expect(css).toContain('--colors-text:');
  });
});
