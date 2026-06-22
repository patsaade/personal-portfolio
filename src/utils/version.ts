// Build-time site version + source commit, surfaced in the footer.
//
// Resolution order: the Vercel (or CI) commit SHA from the environment, else the
// local git HEAD, else nothing. This module is imported only by server-rendered
// (prerendered) components, so `node:child_process` never reaches the browser.
import { execSync } from 'node:child_process';
import pkg from '../../package.json';
import { REPO } from '../consts';

function resolveCommit(): string {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    '';
  if (fromEnv) return fromEnv;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

const commit = resolveCommit();

/** Semantic version from package.json (e.g. "1.1.0"). */
export const VERSION: string = pkg.version;
/** First 7 chars of the commit SHA, or "". */
export const SHORT_COMMIT = commit ? commit.slice(0, 7) : '';
/** Link to the exact commit on GitHub (falls back to the repo root). */
export const COMMIT_URL = commit ? `${REPO}/commit/${commit}` : REPO;
