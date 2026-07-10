// @ts-nocheck — vanilla DOM client utility
// Animates a segmented-switch's active-position indicator — a "thumb" that
// slides behind the active segment — on click. Used site-wide (see
// AnimatedSwitch.astro, mounted once in BaseLayout) for every
// role="radiogroup" segmented switch: ModeToggle, ViewToggle, and
// HashCalculator's Input source switch (IocExtractor's fang row and
// DorkBuilder's engine row are slated to adopt this same markup shape next —
// see AnimatedSwitch.astro's header for the retrofit contract; nothing below
// needs to change for them to pick it up).
//
// 150ms/ease-out — deliberately snappy (matches this codebase's existing
// "fast UI feedback" rhythm — segBtn/modeBtn/engineBtn's own `transition:
// all 150ms ease` hover states use the exact same duration), NOT the
// ~0.45-0.5s timing this codebase uses elsewhere for reveals (animatedDetails.ts,
// the nav dropdown's `.nav-more-menu`, `declassify-hero`). Those are staged,
// once-per-load (or once-per-open) reveals meant to read as a decode. A
// switch thumb is direct-manipulation UI feedback tracking a click that
// already happened — it has to feel immediate, not staged, or the control
// reads as laggy. (Originally shipped at 220ms — dropped to 150ms after it
// still read as sluggish once the double-indicator bug below was found and
// fixed; a slower thumb was partly masking/competing with the second
// indicator rather than the duration alone being the problem.)
//
// IMPORTANT — suppressing the redundant per-button indicator: every switch's
// button already carries its own `&[data-active]` background/border/shadow
// (the pre-existing, JS-free, fully-accessible flat color swap). Once this
// script arms a thumb, that per-button background becomes a SECOND,
// independently-timed indicator (its own 150ms CSS `transition: all`) racing
// the thumb's animate() call — the two don't share a clock, so for a window
// mid-transition you'd see the newly-active button's own background already
// fully lit via CSS while the thumb (also fully-colored) is still visibly
// sliding across the *other*, still-unselected buttons underneath: a
// double-indicator flicker that reads as broken, not as one switch. The fix
// is NOT to delete the per-button background from each component's CSS —
// that background is the only indicator reduced-motion/no-JS visitors ever
// see (this script returns before creating anything under reduced motion —
// see below), so removing it would break that fallback. Instead, once the
// thumb has actually been placed at a real position for the first time —
// inside place(), past its `if (!w) return` guard, NOT unconditionally right
// after the thumb element is created — this script sets `data-switch-armed`
// on the GROUP; each consuming component adds one small CSS override —
// `'[data-switch-armed] &[data-active]': { bg: 'transparent', borderColor:
// 'transparent', boxShadow: 'none' }` — that suppresses ONLY the background/
// border/shadow (never the active-state text/icon `color`, which stays a
// normal, non-competing 150ms fade layered on top of the sliding thumb) and
// ONLY while a thumb actually exists to replace it. No-JS/reduced-motion
// visitors never see `data-switch-armed` at all, so their experience is
// byte-for-byte unchanged from before this feature existed.
//
// No-ops entirely under prefers-reduced-motion — mirrors animatedDetails.ts's
// own shape (idempotent init guard, then an immediate reduced-motion bailout
// before touching the DOM at all). Each switch's plain `[data-active]` color
// swap, already rendered server-side with no JS required, is a fully correct
// and fully accessible control on its own — the thumb is a pure enhancement
// layer painted in behind the button content, never required for
// correctness. A belt-and-suspenders `.switch-thumb { transition: none }`
// rule still lives in motion.css's reduced-motion block (see that file) in
// case anything outside this guard ever adds the class.
//
// Thumb coloring is *not* hardcoded per component: on every placement this
// clones the currently-active button's own resolved background/border/
// shadow/radius via getComputedStyle and copies it onto the thumb, so colors
// always match that switch's own theme exactly — including staying in sync
// across a live palette change (see the `themechange` listener below) — with
// zero color-matching code required in any consuming component. Combined
// with the group being the thumb's only required markup change (see
// AnimatedSwitch.astro), a future switch needs nothing beyond
// `position: 'relative', zIndex: 0` on its track.
//
// Groups can be hidden (`display: none`) at the moment this runs — every
// WorkspaceShell-based tool (Hash Calculator, IOC Extractor, Dork Builder)
// stays hidden until its OWN script marks it ready, and this script's mount
// point in BaseLayout runs before any of those, so `place()` reads 0 for
// offsetLeft/offsetWidth on the first pass. A ResizeObserver on the group
// re-places the thumb (unanimated) whenever its size changes — including the
// display:none → flex flip — so the thumb self-corrects the instant the
// track actually becomes visible, without this script needing to run after
// every consumer's own script. This is exactly why `data-switch-armed` is
// set inside `place()` on its first SUCCESSFUL placement rather than
// unconditionally at setup: if it were set up front, a group still hidden
// at that point would have its fallback indicator suppressed with nothing
// yet in its place — neither indicator visible — for however long the
// ResizeObserver takes to fire. Gating the attribute on real placement
// means the fallback stays visible right up until the thumb has something
// real to show, so there is never a frame with no visible indicator at all.
//
// motion/mini: the smaller WAAPI-only build (see CLAUDE.md invariant 5).
import { animate } from 'motion/mini';

const DURATION = 0.15; // seconds — see file header for why this differs from the ~0.45-0.5s reveals
const EASING = 'ease-out';

export function animateSwitch(group) {
  if (group.__animatedSwitch) return;
  group.__animatedSwitch = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const buttons = Array.prototype.filter.call(group.children, function (el) {
    return el.getAttribute && el.getAttribute('role') === 'radio';
  });
  if (buttons.length < 2) return;

  const thumb = document.createElement('span');
  thumb.className = 'switch-thumb';
  thumb.setAttribute('aria-hidden', 'true');
  thumb.style.position = 'absolute';
  thumb.style.top = '0';
  thumb.style.bottom = '0';
  thumb.style.left = '0';
  thumb.style.zIndex = '-1'; // group carries position:relative + z-index:0 (its own stacking
  // context), so a negative z-index here reliably paints below the group's
  // other children — the buttons — regardless of whether they're positioned
  // themselves. No button CSS changes needed.
  thumb.style.pointerEvents = 'none';
  // group is the first (and only) insertion point this script requires on
  // every consuming component — see file header.
  group.insertBefore(thumb, group.firstChild);

  function activeButton() {
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].hasAttribute('data-active')) return buttons[i];
    }
    return buttons[0];
  }

  // Clones the active button's own resolved visual treatment onto the thumb
  // — background, border, shadow, corner radius — so the thumb is always a
  // pixel-for-pixel match for that switch's own `[data-active]` styling,
  // with no per-component color code and no drift if a theme's tokens
  // change. Colors swap instantly (matching the flat, non-animated
  // `[data-active]` convention) — only position/size animate.
  //
  // Must read the button's color with `data-switch-armed` temporarily OFF.
  // That attribute is what suppresses the active button's own (redundant)
  // background via each consumer's `'[data-switch-armed] &'` CSS rule — so
  // once the group is armed (true for every call after the first), reading
  // getComputedStyle(btn) straight would read back that already-suppressed
  // *transparent* value instead of the real color the thumb is supposed to
  // clone, permanently blanking the thumb on the very next reposition (any
  // click, ResizeObserver fire, or theme change). getComputedStyle() forces
  // a synchronous style recalc, so remove/read/restore here never paints an
  // intermediate frame — no flicker, just an accurate read.
  function syncColors(btn) {
    const wasArmed = group.hasAttribute('data-switch-armed');
    if (wasArmed) group.removeAttribute('data-switch-armed');
    const s = getComputedStyle(btn);
    thumb.style.backgroundColor = s.backgroundColor;
    thumb.style.borderRadius = s.borderRadius;
    thumb.style.borderWidth = s.borderWidth;
    thumb.style.borderStyle = s.borderStyle;
    thumb.style.borderColor = s.borderColor;
    thumb.style.boxShadow = s.boxShadow;
    if (wasArmed) group.setAttribute('data-switch-armed', '');
  }

  // Reads the thumb's own live rendered position/width — including
  // mid-animation, since getComputedStyle reflects the current interpolated
  // value of a running Web Animation — so a rapid second click redirects
  // smoothly from wherever the thumb currently is, not from a stale
  // previously-recorded target.
  function currentTranslateX() {
    const t = getComputedStyle(thumb).transform;
    if (!t || t === 'none') return 0;
    const parts = t
      .slice(t.indexOf('(') + 1, -1)
      .split(',')
      .map(function (n) {
        return parseFloat(n);
      });
    // matrix(a, b, c, d, tx, ty) — translateX lives at index 4.
    return parts.length >= 6 ? parts[4] || 0 : 0;
  }
  function currentWidthPx() {
    return parseFloat(getComputedStyle(thumb).width) || 0;
  }

  function place(animated) {
    const btn = activeButton();
    const w = btn.offsetWidth;
    if (!w) return; // group is currently hidden (display:none) — ResizeObserver retries
    const x = btn.offsetLeft;
    syncColors(btn);
    // Suppresses each button's own (now-redundant) [data-active] background —
    // see file header's "IMPORTANT" section. Set only here, on the thumb's
    // FIRST successful placement — not unconditionally at setup time above —
    // so a group that's still hidden (WorkspaceShell tools stay display:none
    // until their own script marks them ready) never has its fallback
    // indicator suppressed before the thumb has an actual position to show
    // in its place. Setting this unconditionally at setup previously left a
    // real "neither indicator visible" gap whenever a switch's group was
    // still hidden when this script ran (its own component script hadn't
    // revealed it yet) and something (a fast reflow, a hidden-tab throttle)
    // caused the ResizeObserver retry to be delayed — this is what made the
    // IOC Extractor's fang switch render with no visible active indicator.
    group.setAttribute('data-switch-armed', '');

    if (animated) {
      const fromX = currentTranslateX();
      const fromW = currentWidthPx();
      animate(
        thumb,
        { transform: [`translateX(${fromX}px)`, `translateX(${x}px)`], width: [`${fromW}px`, `${w}px`] },
        { duration: DURATION, easing: EASING },
      );
    } else {
      thumb.style.transform = `translateX(${x}px)`;
      thumb.style.width = `${w}px`;
    }
  }

  // Initial placement: instant, never animated — a slide-in on page load
  // would be a jarring first impression.
  place(false);

  if (window.ResizeObserver) {
    const ro = new ResizeObserver(function () {
      place(false);
    });
    ro.observe(group);
  }

  // Keeps thumb colors in sync with a live palette/mode change even when the
  // change didn't come from clicking *this* switch (e.g. the ThemePicker,
  // not ModeToggle, changing the active palette) — window.__theme dispatches
  // this on every change (see CLAUDE.md invariant 4).
  document.addEventListener('themechange', function () {
    place(false);
  });

  // Deliberately NOT the existing per-component click handler — that logic
  // (which button gets `data-active`) is untouched. This is a second,
  // independent listener that reacts to the result. A rapid repeat click
  // retargeting the thumb mid-flight is correct, expected UX (motion/mini's
  // animate() naturally redirects from the thumb's current live position —
  // see currentTranslateX/currentWidthPx above) — no debounce here; that
  // hard rule (CLAUDE.md invariant 12) is for toggles that fully reverse
  // each other, not a multi-position switch redirecting mid-slide.
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      // Deferred to the next frame so this always runs after the
      // component's own (possibly later-registered) click handler has
      // already set the new `data-active`, regardless of listener
      // attachment order.
      requestAnimationFrame(function () {
        place(true);
      });
    });
  });
}
