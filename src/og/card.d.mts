// Types for the build-time card renderer (card.mjs).
export function renderCardPng(opts: { title: string; eyebrow: string }): Promise<Buffer>;
export function renderMarkSvg(size: number): Promise<string>;
export function renderMarkPng(size: number): Promise<Buffer>;
export const OG_PALETTE: Record<string, string>;
