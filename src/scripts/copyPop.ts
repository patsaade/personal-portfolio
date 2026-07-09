// @ts-nocheck — vanilla DOM client utility
// Shared copy-confirm "pop": toggles a `data-copied` attribute for a moment
// after a successful copy (motion.css's [data-copy-pop] rule drives the
// actual visual pop animation off this attribute). Used by every interactive
// tool's per-item copy buttons (Hash Calculator, IOC Extractor, Timestamp
// Decoder) — previously each redefined this same three-line function locally.
export function pop(btn, ms = 1600) {
  btn.setAttribute('data-copied', '');
  setTimeout(function () {
    btn.removeAttribute('data-copied');
  }, ms);
}
