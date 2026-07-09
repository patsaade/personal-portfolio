// @ts-nocheck — vanilla DOM client utility
// Smoothly animates a <details> element's open/close (height + opacity)
// instead of the native instant toggle. Used site-wide (see
// AnimatedDetails.astro, mounted once in BaseLayout) for every collapsible
// group: Tools, Glossary, Certifications, ATT&CK/D3FEND maps, the Cheat
// Sheet, and the mobile nav accordion.
//
// 1s — deliberately slow/dramatic (see CLAUDE.md invariant 12), matching the
// nav dropdown's own reveal (global.css's .nav-more-menu). On expand, the
// group's own <summary> heading additionally "declassifies" (motion.css's
// `declassify` keyframe) in step with the height reveal, reusing the exact
// same visual language as post/section titles rather than inventing a new
// one — every collapsible group opening reads as a small reveal, matching
// the nav dropdown's own font-decode. `:scope > summary > h2, h3` is a plain
// structural selector (every page happens to put its group heading directly
// there) so this works site-wide with no markup changes on any page.
//
// No-ops under prefers-reduced-motion — the native instant toggle is already
// a fully visible, settled state, satisfying motion.css's reduced-motion
// rule without extra code here (the declassify retrigger below never runs
// either, since this whole function returns before reaching it). Only
// <summary> clicks are intercepted; programmatic opens (CollapseAll's bulk
// toggle, native fragment/`:target` auto-expand, exclusive accordion groups
// closing a sibling) still just snap — animating every path that can change
// `.open` isn't worth the added complexity for a decorative flourish.
// motion/mini: the smaller WAAPI-only build — covers a plain height animation
// just fine (invariant 5 in CLAUDE.md explains why the full `motion` build is
// avoided).
import { animate } from 'motion/mini';

const DURATION = 1; // seconds — see file header for why

export function animateDetails(details) {
  if (details.__animatedDetails) return;
  details.__animatedDetails = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const summary = details.querySelector(':scope > summary');
  if (!summary) return;
  const heading = summary.querySelector(':scope > h2, :scope > h3');

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
    animate(details, { height: [`${startH}px`, `${endH}px`] }, { duration: DURATION, easing: 'ease' }).finished.then(
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

    // Restart the heading's declassify decode on every expand, not just the
    // first — a plain class re-add wouldn't restart an already-finished CSS
    // animation, so remove it, force a reflow to commit the "off" state,
    // then re-add it.
    if (heading) {
      heading.classList.remove('declassify');
      heading.offsetWidth; // force reflow
      heading.classList.add('declassify');
    }

    animate(details, { height: [`${startH}px`, `${endH}px`] }, { duration: DURATION, easing: 'ease' }).finished.then(
      settle,
    );
  }
}
