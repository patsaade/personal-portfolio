// Build-time site version + source commit, surfaced in the footer.
//
// The version is calendar + build based, derived from git history:
//
//     <YYYY.MM.DD of the deployed commit>+build.<total commits>
//     e.g. "2026.06.23+build.35"
//
// The date answers *when* this build is from; the build count answers *how many
// pushes it took to get here* — the cumulative number of commits across the whole
// history. (Git records commits, not push events, so the commit count is the
// deterministic proxy for "amount of pushes"; pushing N commits at once advances
// it by N.) The `+build.N` suffix is SemVer "build metadata" syntax. The short
// SHA links the footer to the exact commit on GitHub.
//
// Resolution prefers the Vercel/CI commit SHA from the environment, then local
// git for the date + count (with the build date as a last-resort date fallback).
// This module is imported only by server-rendered (prerendered) components, so
// node:child_process never reaches the browser.
import { execSync } from 'node:child_process';
import { REPO } from '../consts';

/** Run a git command at build time; "" if git isn't available. */
function git(cmd: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

/** The deployed commit SHA — CI/Vercel env first, then local git HEAD. */
function resolveCommit(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    git('git rev-parse HEAD')
  );
}

/** YYYY.MM.DD of the deployed commit (git committer date), else the build date. */
function resolveDate(): string {
  const fromGit = git("git show -s --format=%cd --date=format:'%Y.%m.%d' HEAD");
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(fromGit)) return fromGit;
  return new Date().toISOString().slice(0, 10).replace(/-/g, '.');
}

/** Total commits in history = the cumulative "amount of pushes" to get here. */
function resolveCount(): number {
  const n = parseInt(git('git rev-list --count HEAD'), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const commit = resolveCommit();
const date = resolveDate();
const count = resolveCount();

/** Calendar + build version, e.g. "2026.06.23+build.35" (date only if count is 0). */
export const VERSION: string = count > 0 ? `${date}+build.${count}` : date;
/** First 7 chars of the commit SHA, or "". */
export const SHORT_COMMIT: string = commit ? commit.slice(0, 7) : '';
/** Link to the exact commit on GitHub (falls back to the repo root). */
export const COMMIT_URL: string = commit ? `${REPO}/commit/${commit}` : REPO;
