// Per-page social cards, generated at build (one static PNG per route). The
// matching <meta og:image>/<meta twitter:image> is set in BaseHead via the same
// route module, so every page's card is in sync. See src/og/card.mjs for the design.
export const prerender = true;

import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgEntries } from '../../og/routes';
import { renderCardPng } from '../../og/card.mjs';

export const getStaticPaths: GetStaticPaths = async () => {
  const entries = await getOgEntries();
  return entries.map((e) => ({ params: { slug: e.slug }, props: { title: e.title, eyebrow: e.eyebrow } }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCardPng({ title: props.title as string, eyebrow: props.eyebrow as string });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
