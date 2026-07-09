// @ts-nocheck — vanilla DOM client utility
// Smoothly animates a <details> element's open/close (height + opacity)
// instead of the native instant toggle. Used site-wide (see
// AnimatedDetails.astro, mounted once in BaseLayout) for every collapsible
// group: Tools, Glossary, Certifications, ATT&CK/D3FEND maps, the Cheat
// Sheet, and the mobile nav accordion.
//
// No-ops under prefers-reduced-motion — the native instant toggle is already
// a fully visible, settled state, satisfying motion.css's reduced-motion
// rule without extra code here. Only <summary> clicks are intercepted;
// programmatic opens (CollapseAll's bulk toggle, native fragment/`:target`
// auto-expand, exclusive accordion groups closing a sibling) still just snap
// — animating every path that can change `.open` isn't worth the added
// complexity for a decorative flourish.
// motion/mini: the smaller WAAPI-only build — covers a plain height animation
// just fine (invariant 5 in CLAUDE.md explains why the full `motion` build is
// avoided).
import { animate } from 'motion/mini';

export function animateDetails(details) {
  if (details.__animatedDetails) return;
  details.__animatedDetails = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const summary = details.querySelector(':scope > summary');
  if (!summary) return;

  let busy = false;
  summary.addEventListener('click', (e) => {
    e.preventDefault();
    if (busy) return;
    if (details.open) collapse();
    else expand();
  });

  function settle() {
    details.style.height = '';
    details.style.overflow = '';
    busy = false;
  }

  function collapse() {
    busy = true;
    const startH = details.offsetHeight;
    details.style.overflow = 'hidden';
    details.style.height = `${startH}px`;
    details.offsetHeight; // force reflow so the browser registers the start height
    const endH = summary.offsetHeight;
    animate(details, { height: [`${startH}px`, `${endH}px`] }, { duration: 0.22, easing: 'ease' }).finished.then(
      () => {
        details.open = false;
        settle();
      },
    );
  }

  function expand() {
    busy = true;
    const startH = details.offsetHeight;
    details.open = true;
    const endH = details.scrollHeight;
    details.style.overflow = 'hidden';
    details.style.height = `${startH}px`;
    details.offsetHeight; // force reflow
    animate(details, { height: [`${startH}px`, `${endH}px`] }, { duration: 0.24, easing: 'ease' }).finished.then(
      settle,
    );
  }
}
