// Shared prose styles for simple static "info" pages (About, Colophon,
// Privacy) — plain paragraphs/headings/links with no page-specific layout,
// hoisted here since each page was independently re-declaring the exact
// same three css() calls.
import { css } from 'styled-system/css';

export const prosePara = css({ color: 'textMuted', lineHeight: 1.8, mb: '1rem' });
export const proseH2 = css({ fontSize: '1.3rem', fontWeight: 700, mt: '2.25rem', mb: '0.75rem' });
// Exported as a plain object (not just the compiled proseLink class below) so
// a consumer needing a variant — e.g. colophon.astro's stack-item names,
// which want proseLink's underline/hover behavior but stackName's own
// color/weight to win over proseLink's default color — can
// css(proseLinkBase, variantBase), a deep object merge that deterministically
// resolves the conflicting `color`. Composing two already-compiled classes as
// `${proseLink} ${variant}` would instead leave that resolution up to Panda's
// atomic-class ordering (see STYLE_GUIDE.md "Buttons" for the exact failure
// mode this avoids).
export const proseLinkBase = { color: 'primary', textDecoration: 'underline', _hover: { color: 'primaryHover' } } as const;
export const proseLink = css(proseLinkBase);
