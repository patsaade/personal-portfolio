// Generates the static brand assets into public/ from the shared card renderer:
// the SVG favicon, the PNG icon sizes, and the default og.png (home card).
// Run from the project root: `npm run gen:brand`. Re-run after changing the mark
// or the default-dark palette in src/og/card.mjs.
import { writeFileSync } from 'node:fs';
import { renderMarkSvg, renderMarkPng, renderCardPng } from '../src/og/card.mjs';

const out = (name) => new URL('../public/' + name, import.meta.url);

writeFileSync(out('favicon.svg'), await renderMarkSvg(64));
writeFileSync(out('favicon-16x16.png'), await renderMarkPng(16));
writeFileSync(out('favicon-32x32.png'), await renderMarkPng(32));
writeFileSync(out('apple-touch-icon.png'), await renderMarkPng(180));
writeFileSync(out('icon-192.png'), await renderMarkPng(192));
writeFileSync(out('icon-512.png'), await renderMarkPng(512));
// Static /og.png = the home card. Pages use the per-page /og/<slug>.png endpoint
// now, but this stays as a back-compat fallback for any old share that cached the
// previous site's /og.png reference. Mirrors the /og/index.png the endpoint renders.
writeFileSync(out('og.png'), await renderCardPng({ title: 'Patrick Saade', eyebrow: 'DFIR portfolio & blog' }));

console.log('Brand assets written to public/ (favicon.svg, icons, og.png).');
