// Security check — audits the parts of the site that actually matter given its
// architecture (static Astro build, no backend, no auth, no form submits
// anywhere) and prints a report with action items plus a manual-review
// checklist. Run it when asked "is the site secure?" / periodically per
// *Security* in CLAUDE.md.
//
//   npm run check:security
//
// It checks: npm audit severity + dependency posture, the client-side
// injection (DOM XSS) sink surface, HTTP security headers in vercel.json,
// target=_blank/noopener pairing, hardcoded-secret-shaped patterns in source,
// and whether each GitHub Actions workflow scopes its own permissions. It
// never changes files and always exits 0 — it reports; a human (or Claude)
// judges and acts on the findings, the same way check-freshness.mjs does for
// content/link rot.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const read = (p) => {
  try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return ''; }
};
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name === 'node_modules' || name.name === '.git' || name.name === 'dist' || name.name === '.astro' || name.name === 'styled-system') continue;
    const full = path.join(dir, name.name);
    if (name.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}
const srcFiles = walk(path.join(ROOT, 'src'));
const rel = (p) => path.relative(ROOT, p);

console.log('\nDFIR portfolio — security report');
console.log('='.repeat(50));

// ── npm audit ────────────────────────────────────────────────────────────────
console.log('\n▸ Dependency audit (npm audit)');
try {
  const out = execSync('npm audit --json', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const { metadata } = JSON.parse(out);
  const v = metadata.vulnerabilities;
  console.log(`  critical:${v.critical} high:${v.high} moderate:${v.moderate} low:${v.low} (total ${v.total})`);
  if (v.total) {
    console.log('  Trace each before reacting: a devDependency-only advisory (e.g. @astrojs/check\'s');
    console.log('  language-server chain) is lower real risk than one reachable in the client bundle');
    console.log('  (only @floating-ui/dom + motion/mini ship to the browser — CLAUDE.md invariant 5).');
    console.log('  Run `npm audit fix` (no --force) first for any non-breaking fixes; never `--force`.');
  } else {
    console.log('  ✓ none reported');
  }
} catch (e) {
  // npm audit exits non-zero when it finds vulnerabilities — still parse its stdout.
  try {
    const { metadata } = JSON.parse(e.stdout.toString());
    const v = metadata.vulnerabilities;
    console.log(`  critical:${v.critical} high:${v.high} moderate:${v.moderate} low:${v.low} (total ${v.total})`);
    console.log('  Trace each before reacting — see CLAUDE.md Security section for the dev-only-vs-client-shipped method.');
  } catch {
    console.log('  ? could not run npm audit');
  }
}

// ── client-side injection (DOM XSS) sink surface ────────────────────────────
console.log('\n▸ Client-side injection sinks (set:html / innerHTML / eval-family)');
const SINK_RE = /\bset:html\b|\.innerHTML\s*=|\.outerHTML\s*=|\.insertAdjacentHTML\s*\(|\beval\s*\(|\bnew Function\s*\(|\bdocument\.write\s*\(/g;
let sinkHits = 0;
for (const f of srcFiles) {
  if (!/\.(astro|ts|mjs|js)$/.test(f)) continue;
  const text = read(rel(f));
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (SINK_RE.test(line)) {
      sinkHits++;
      console.log(`  - ${rel(f)}:${i + 1}  ${line.trim().slice(0, 90)}`);
    }
    SINK_RE.lastIndex = 0;
  });
}
console.log(`  ${sinkHits} sink(s) found — for each, confirm the inserted value is never user-controllable`);
console.log('  input (typed/pasted text, a URL query param) rendered unescaped. A clear-only');
console.log('  assignment (`.innerHTML = \'\'`) or a build-time-only value (JSON-LD, icon map) is safe.');

// ── HTTP security headers ───────────────────────────────────────────────────
console.log('\n▸ HTTP security headers (vercel.json)');
const RECOMMENDED_HEADERS = [
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
];
let vercelJson = {};
try { vercelJson = JSON.parse(read('vercel.json')); } catch {}
const configuredHeaders = new Set(
  (vercelJson.headers || []).flatMap((block) => (block.headers || []).map((h) => h.key)),
);
const missingHeaders = RECOMMENDED_HEADERS.filter((h) => !configuredHeaders.has(h));
if (missingHeaders.length) {
  console.log(`  ✗ ${missingHeaders.length} missing: ${missingHeaders.join(', ')}`);
} else {
  console.log('  ✓ all 8 recommended headers present');
}
console.log("  Note: CSP's `script-src` carries 'unsafe-inline' — a deliberate tradeoff for a");
console.log('  fully static, prerendered site with zero <form> elements (see CLAUDE.md Security).');

// ── target=_blank / rel=noopener pairing ────────────────────────────────────
console.log('\n▸ target="_blank" / rel="noopener" pairing (reverse-tabnabbing)');
let blankCount = 0, unsafeBlank = 0;
for (const f of srcFiles) {
  if (!/\.astro$/.test(f)) continue;
  const text = read(rel(f));
  const tagRe = /<a\b[^>]*>/g;
  let m;
  while ((m = tagRe.exec(text))) {
    const tag = m[0];
    if (/target\s*=\s*["'{]?_blank/.test(tag)) {
      blankCount++;
      if (!/rel\s*=\s*["'{][^"'}]*noopener/.test(tag)) {
        unsafeBlank++;
        const line = text.slice(0, m.index).split('\n').length;
        console.log(`  ✗ ${rel(f)}:${line}  target="_blank" without rel="noopener"`);
      }
    }
  }
}
console.log(unsafeBlank ? `  ${unsafeBlank} of ${blankCount} target="_blank" link(s) missing noopener` : `  ✓ all ${blankCount} target="_blank" link(s) carry rel="noopener"`);

// ── hardcoded-secret-shaped patterns ─────────────────────────────────────────
console.log('\n▸ Hardcoded secret-shaped patterns');
const SECRET_PATTERNS = [
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'generic API key assignment', re: /(api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i },
  { name: 'PEM private key header', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];
let secretHits = 0;
for (const f of srcFiles) {
  const text = read(rel(f));
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) {
      secretHits++;
      console.log(`  ✗ ${rel(f)} — matches "${name}" pattern (value not printed — inspect directly)`);
    }
  }
}
console.log(secretHits ? `  ${secretHits} match(es) — verify each by hand before assuming it's a real secret` : '  ✓ none found in src/');

// ── GitHub Actions permissions scoping ──────────────────────────────────────
console.log('\n▸ GitHub Actions workflow permissions');
try {
  const wfDir = path.join(ROOT, '.github/workflows');
  for (const f of fs.readdirSync(wfDir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    const text = read(`.github/workflows/${f}`);
    const hasPermissions = /^permissions:/m.test(text);
    console.log(`  ${hasPermissions ? '✓' : '⚠'} ${f}${hasPermissions ? '' : ' — no top-level `permissions:` block (inherits repo/org default)'}`);
  }
} catch {
  console.log('  ? .github/workflows not found');
}

// ── manual review (judgment calls — not automatable) ────────────────────────
console.log('\n▸ Manual review (judgment calls — not automatable)');
try {
  const prot = execSync('gh api repos/:owner/:repo/branches/main/protection', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const p = JSON.parse(prot);
  console.log(`  [i] main branch protection: enabled (required checks: ${(p.required_status_checks?.contexts || []).join(', ') || 'none'})`);
} catch {
  console.log('  [ ] main branch protection — not enabled (or `gh` unavailable/unauthenticated to check). Low urgency for a');
  console.log('      solo-maintainer repo, but consider requiring the CI `verify` job before merge.');
}
[
  'Any newly added third-party script/embed — does it need a CSP script-src/style-src addition?',
  'Any newly added <form> or fetch() to an external endpoint — does it change the "nothing entered',
  '  ever leaves the browser" posture the Hash Calculator/IOC Extractor/etc. currently document?',
  'New env vars — client-exposed ones MUST be PUBLIC_-prefixed (Vite convention); anything else stays server-only.',
  'Any newly vendored/CDN-loaded script — self-host it instead (CLAUDE.md invariant 5) unless there\'s a strong reason.',
  'New GitHub Actions workflow — plain `pull_request`, not `pull_request_target`, unless deliberately reviewed.',
].forEach((s) => console.log(`  [ ] ${s}`));

console.log(`\nSummary: ${missingHeaders.length} missing header(s), ${sinkHits} injection sink(s) to review, ${unsafeBlank} unsafe target="_blank" link(s), ${secretHits} secret-pattern match(es).`);
console.log('Fix ✗ items first, then review the manual checklist above.\n');
