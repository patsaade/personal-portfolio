// Shared prose styles for simple static "info" pages (About, Colophon,
// Privacy) — plain paragraphs/headings/links with no page-specific layout,
// hoisted here since each page was independently re-declaring the exact
// same three css() calls.
import { css } from 'styled-system/css';

export const prosePara = css({ color: 'textMuted', lineHeight: 1.8, mb: '1rem' });
export const proseH2 = css({ fontSize: '1.3rem', fontWeight: 700, mt: '2.25rem', mb: '0.75rem' });
export const proseLink = css({ color: 'primary', textDecoration: 'underline', _hover: { color: 'primaryHover' } });
