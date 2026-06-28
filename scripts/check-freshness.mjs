// Freshness check — audits the parts of the site that rot over time and prints a
// report with action items (link liveness, ATT&CK version drift, content counts,
// data age) plus a manual-review checklist. Run it when asked "is the site up to
// date?".
//
//   npm run check:freshness            # full run
//   node scripts/check-freshness.mjs --limit=20   # quick sample (fewer link checks)
//
// It checks: external link liveness (tools, glossary/reference sources, certs,
// socials), the MITRE ATT&CK data version vs MITRE's latest release, content
// counts, and how long ago each data file was last touched. It never changes
// files and always exits 0 — it reports; a human (or Claude) acts on the findings.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith('--limit='));
  return a ? parseInt(a.split('=')[1], 10) : Infinity;
})();

const read = (p) => {
  try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return ''; }
};
const gitDate = (p) => {
  try { return execSync(`git log -1 --format=%cs -- "${p}"`, { cwd: ROOT }).toString().trim() || 'untracked'; } catch { return '?'; }
};
const count = (s, re) => (s.match(re) || []).length;
const cmpVer = (a, b) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d; }
  return 0;
};

const toolsSrc = read('src/data/tools.ts');
const refsSrc = read('src/data/references.ts');
const genSrc = read('src/data/attack-techniques.generated.ts');
const certsSrc = read('src/data/certifications.ts');

// ── content counts ──────────────────────────────────────────────────────────
const tools = count(toolsSrc, /slug: '/g);
const attack = count(genSrc, /"id":/g);
let terms = count(read('src/data/securityTerms.ts'), /slug: '/g);
try {
  const dir = path.join(ROOT, 'src/data/terms');
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.json')) terms += count(fs.readFileSync(path.join(dir, f), 'utf8'), /"slug":/g);
} catch {}
const certs = count(certsSrc, /earned:/g);

// ── ATT&CK version drift ────────────────────────────────────────────────────
const ourVer = (genSrc.match(/STIX bundle \(v([\d.]+)\)/) || [])[1] || '?';
let mitreVer = null;
async function fetchMitreVersion() {
  try {
    const r = await fetch('https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/index.json', { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return;
    const j = await r.json();
    const ent = (j.collections || []).find((c) => /enterprise/i.test(c.name));
    if (ent?.versions?.length) mitreVer = ent.versions.map((v) => v.version).sort(cmpVer).pop();
  } catch {}
}

// ── URL extraction (skip the authoritative, generated ATT&CK technique pages) ─
const sources = {
  'tools.ts': toolsSrc,
  'references.ts': refsSrc,
  'certifications.ts': certsSrc,
  'consts.ts': read('src/consts.ts'),
};
const urlMap = new Map();
for (const [src, text] of Object.entries(sources)) {
  const re = /https?:\/\/[^\s'"`)]+/g;
  let m;
  while ((m = re.exec(text))) {
    const u = m[0].replace(/[.,;]+$/, '');
    if (/attack\.mitre\.org\/techniques\/T\d/.test(u)) continue; // generated, authoritative
    if (!urlMap.has(u)) urlMap.set(u, new Set());
    urlMap.get(u).add(src);
  }
}
let urls = [...urlMap.keys()].sort();
const totalUrls = urls.length;
if (LIMIT < urls.length) urls = urls.slice(0, LIMIT);

// Statuses that mean "the bot was rejected", not "the page is gone". LinkedIn
// answers 999 to everything automated; many sites 403/429 a HEAD or odd UA.
const BLOCKED = new Set([401, 403, 429, 999]);
async function checkUrl(u) {
  const opt = {
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) freshness-check', Accept: '*/*' },
  };
  try {
    let r = await fetch(u, { method: 'HEAD', ...opt });
    // Many servers mis-answer HEAD from a bot (404/405/406/501) — confirm with GET
    // before calling a link dead, so we don't chase false positives.
    if (r.status >= 400 && !(r.status >= 300 && r.status < 400)) {
      try { r = await fetch(u, { method: 'GET', ...opt }); } catch {}
    }
    const s = r.status;
    if (s >= 200 && s < 300) return { u, ok: true, status: s };
    if (s >= 300 && s < 400) return { u, ok: true, status: s, redirect: r.headers.get('location') };
    if (BLOCKED.has(s)) return { u, ok: true, status: s, note: 'blocked/rate-limited' };
    return { u, ok: false, status: s };
  } catch (e) {
    return { u, ok: false, status: 0, note: e.name === 'TimeoutError' ? 'timeout' : 'unreachable' };
  }
}
async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  }));
  return out;
}

// ── run ─────────────────────────────────────────────────────────────────────
console.log('\nDFIR portfolio — freshness report');
console.log('='.repeat(50));

console.log('\n▸ Content counts (from source)');
console.log(`  Tools ${tools} · Glossary terms ~${terms} · ATT&CK techniques ${attack} · Certifications ~${certs}`);

console.log('\n▸ Data last updated (git committer date)');
for (const f of ['src/data/tools.ts', 'src/data/references.ts', 'src/data/securityTerms.ts', 'src/data/certifications.ts', 'src/pages/about.astro'])
  console.log(`  ${f.replace('src/', '')}  ${gitDate(f)}`);

await fetchMitreVersion();
console.log('\n▸ MITRE ATT&CK version');
if (mitreVer) {
  const drift = cmpVer(mitreVer, ourVer) > 0;
  console.log(`  Site v${ourVer} · MITRE latest v${mitreVer}  →  ${drift ? 'UPDATE AVAILABLE — re-run scripts/gen-attack-map.mjs' : 'up to date'}`);
} else {
  console.log(`  Site v${ourVer} · MITRE latest: (could not fetch)`);
}

console.log(`\n▸ Link liveness (${urls.length}${LIMIT < totalUrls ? ` of ${totalUrls}, --limit` : ''} external URLs)`);
const results = await pool(urls, 12, checkUrl);
const ok = results.filter((r) => r.ok && !r.redirect && !r.note);
const blocked = results.filter((r) => r.note === 'blocked/rate-limited');
const redir = results.filter((r) => r.ok && r.redirect);
const dead = results.filter((r) => !r.ok);
console.log(`  ✓ ${ok.length} ok${blocked.length ? ` · ${blocked.length} blocked/rate-limited (verify manually)` : ''}`);
if (redir.length) {
  console.log(`  ⚠ ${redir.length} redirected (consider updating to the final URL):`);
  redir.forEach((r) => console.log(`     ${r.u}  →  ${r.redirect}  [${[...urlMap.get(r.u)].join(', ')}]`));
}
console.log(`  ${dead.length ? '✗' : '✓'} ${dead.length} dead`);
dead.forEach((r) => console.log(`     ${r.u}  (${r.status || r.note})  [${[...urlMap.get(r.u)].join(', ')}]`));

console.log('\n▸ Manual review (judgment calls — not automatable)');
[
  'Tools (data/tools.ts): new must-have tools, deprecations/renames, or cost-tier changes?',
  'Glossary (data/terms/*.json): prevalent new terms or techniques worth adding?',
  'Certifications (data/certifications.ts): earned/pursuing status current? new certs?',
  'Experience (pages/about.astro): new role, title change, or an end date to set?',
  'ATT&CK: if a newer version is flagged above, re-run scripts/gen-attack-map.mjs.',
  'Dependencies: skim `npm outdated` (Dependabot opens PRs for real fixes).',
].forEach((s) => console.log(`  [ ] ${s}`));

const verState = mitreVer ? (cmpVer(mitreVer, ourVer) > 0 ? 'UPDATE AVAILABLE' : 'current') : 'unknown';
console.log(`\nSummary: ${dead.length} dead link(s), ${redir.length} redirect(s); ATT&CK ${verState}.`);
console.log('Fix ✗ dead links first, then review ⚠ redirects and the manual checklist above.\n');
