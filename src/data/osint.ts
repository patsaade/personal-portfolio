// OSINT / search-engine "dorking" data for the interactive Dork Builder
// (/osint/). Every operator's syntax and support status is verified against
// each engine's own current help documentation — Google has both formally
// deprecated several classic "dork" operators over the years (cache:,
// related:, info:, the + prefix, the ~ synonym operator — all excluded here)
// AND quietly stopped *documenting* several others that are still
// long-standing and functional (intitle:, inurl:, intext:, OR, before:/
// after:) without retiring them; `note` flags that distinction per operator
// rather than presenting undocumented-but-working and officially-documented
// syntax as equivalent. Recipes are well-established attack-surface-discovery
// patterns, framed for authorized/defensive use (assessing your own or a
// client's exposure) — consistent with this site's dual-use-tool guidance.
// `queryTemplate` always shows the full, literal, verified query (a
// `<domain>` placeholder, matching this site's tools.ts convention) so the
// recipe library stays useful without JS; `values` is present only when the
// query maps cleanly onto the builder's one-value-per-operator model — many
// of the richer recipes use a parenthesized OR across several values of the
// *same* operator (e.g. `(filetype:pdf OR filetype:docx)`), which the
// builder's simple field model can't represent, so those are left
// static-reference-only rather than force-fit into a misleading "Load"
// button.

export type EngineId = 'google' | 'bing' | 'duckduckgo';

export interface SearchEngine {
  id: EngineId;
  label: string;
  /** Prefix; the builder appends `encodeURIComponent(query)`. */
  searchUrl: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google', label: 'Google', searchUrl: 'https://www.google.com/search?q=' },
  { id: 'bing', label: 'Bing', searchUrl: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', label: 'DuckDuckGo', searchUrl: 'https://duckduckgo.com/?q=' },
];

export type DorkOperatorKind = 'prefix' | 'phrase' | 'exclude' | 'or';

export interface DorkOperator {
  /** Also the builder's form-field id. */
  id: string;
  label: string;
  placeholder: string;
  description: string;
  kind: DorkOperatorKind;
  /** Literal syntax prefix, e.g. 'site:' — used when kind is 'prefix'. */
  prefix?: string;
  /** Which engines currently honor this operator (drives field visibility). */
  engines: EngineId[];
  /** Cross-engine support caveat, shown in the operator reference table. */
  note?: string;
}

export const DORK_OPERATORS: DorkOperator[] = [
  {
    id: 'site',
    label: 'Site / domain',
    placeholder: 'example.com',
    description: 'Restrict results to one domain (or subdomain).',
    kind: 'prefix',
    prefix: 'site:',
    engines: ['google', 'bing', 'duckduckgo'],
    note: 'Officially documented on all three engines. Google\'s own docs note it "doesn\'t necessarily return all indexed URLs" under a domain — treat it as a search convenience, not a guaranteed asset inventory.',
  },
  {
    id: 'filetype',
    label: 'File type',
    placeholder: 'pdf',
    description: 'Only return files of this extension.',
    kind: 'prefix',
    prefix: 'filetype:',
    engines: ['google', 'bing', 'duckduckgo'],
    note: 'Officially documented on all three. DuckDuckGo supports a narrower, explicitly listed set of extensions (pdf, doc(x), xls(x), ppt(x), html) than Google/Bing.',
  },
  {
    id: 'intitle',
    label: 'Title contains',
    placeholder: 'index of',
    description: 'Only pages with this text in the page title.',
    kind: 'prefix',
    prefix: 'intitle:',
    engines: ['google', 'bing', 'duckduckgo'],
    note: 'Officially documented on Bing and DuckDuckGo. Long-standing and still functional on Google, but Google\'s current public docs no longer formally list it.',
  },
  {
    id: 'inurl',
    label: 'URL contains',
    placeholder: 'admin',
    description: 'Only pages with this text in the URL path.',
    kind: 'prefix',
    prefix: 'inurl:',
    engines: ['google', 'duckduckgo'],
    note: 'Officially documented on DuckDuckGo. Still functional on Google (undocumented). Bing suspended inurl: around 2007 to curb data-mining abuse and never restored it.',
  },
  {
    id: 'intext',
    label: 'Body text contains',
    placeholder: 'confidential',
    description: 'Only pages with this text in the page body.',
    kind: 'prefix',
    prefix: 'intext:',
    engines: ['google'],
    note: 'Still functional on Google, but undocumented by Google today. Bing/DuckDuckGo have no direct equivalent operator.',
  },
  {
    id: 'phrase',
    label: 'Exact phrase',
    placeholder: 'internal use only',
    description: 'Match this exact phrase, wrapped in quotes.',
    kind: 'phrase',
    engines: ['google', 'bing', 'duckduckgo'],
    note: 'Officially documented, identical behavior, on all three engines.',
  },
  {
    id: 'exclude',
    label: 'Exclude terms',
    placeholder: 'jobs careers',
    description: 'Drop results containing any of these words.',
    kind: 'exclude',
    engines: ['google', 'bing', 'duckduckgo'],
    note: 'Officially documented on all three. Bing requires the alternate NOT keyword to be capitalized if used instead of "-".',
  },
  {
    id: 'or',
    label: 'Match any of these terms',
    placeholder: 'login signin',
    description: 'Match any one of these words (space-separated) instead of all of them.',
    kind: 'or',
    engines: ['google', 'bing'],
    note: 'Officially documented on Bing (capital OR, or "|"). Still functional on Google (undocumented). DuckDuckGo has no explicit OR keyword — space-separated terms already match loosely by default there.',
  },
  {
    id: 'before',
    label: 'Last updated before',
    placeholder: '2024-01-01',
    description: 'Only pages last updated before this date (YYYY-MM-DD or YYYY).',
    kind: 'prefix',
    prefix: 'before:',
    engines: ['google'],
    note: 'Officially documented on Google only. Bing and DuckDuckGo expose date filtering solely as a results-page UI control, not a query operator.',
  },
  {
    id: 'after',
    label: 'Last updated after',
    placeholder: '2023-01-01',
    description: 'Only pages last updated after this date (YYYY-MM-DD or YYYY).',
    kind: 'prefix',
    prefix: 'after:',
    engines: ['google'],
    note: 'Officially documented on Google only — combine with "before" for a range.',
  },
];

export interface DorkRecipe {
  category: string;
  title: string;
  desc: string;
  /** The full, literal, verified query — a `<domain>` placeholder shown as-is. */
  queryTemplate: string;
  /**
   * operator id -> value to hydrate the builder ("Load into builder"). Present
   * only when the query maps cleanly onto the one-value-per-operator model —
   * omitted (not force-fit) for recipes using a composite OR across multiple
   * values of the same operator, or a fixed non-domain site: target.
   */
  values?: Record<string, string>;
  tags: string[];
}

export const DORK_RECIPES: DorkRecipe[] = [
  {
    category: 'Exposed Directory Listings',
    title: 'Open directory index',
    desc: "Finds pages where a web server's directory-listing feature was left enabled, exposing the raw file/folder structure instead of a proper index page — a classic misconfiguration that can leak internal files, old backups, or unlinked assets never meant to be browsed directly.",
    queryTemplate: 'site:<domain> intitle:"index of /"',
    values: { intitle: 'index of /' },
    tags: ['misconfiguration', 'directory-listing', 'recon'],
  },
  {
    category: 'Exposed Directory Listings',
    title: 'Parent-directory browsing on a subpath',
    desc: 'Narrows the open-directory search to a specific path (e.g. /backup) — useful for confirming whether a particular known folder on your own infrastructure is inadvertently browsable.',
    queryTemplate: 'site:<domain> intitle:"index of" inurl:backup',
    values: { intitle: 'index of', inurl: 'backup' },
    tags: ['misconfiguration', 'directory-listing', 'backup'],
  },
  {
    category: 'Exposed Documents & Files',
    title: 'Indexed PDFs and office documents',
    desc: 'Surfaces publicly indexed PDF, Word, and Excel files under a domain. Useful for checking whether internal reports, HR documents, or contracts were accidentally published or linked from a public page.',
    queryTemplate: 'site:<domain> (filetype:pdf OR filetype:docx OR filetype:xlsx)',
    tags: ['document-exposure', 'sensitive-data', 'recon'],
  },
  {
    category: 'Exposed Documents & Files',
    title: 'Documents mentioning sensitive markings',
    desc: 'Combines a filetype filter with body-text matching to find files marked confidential/internal that still got indexed — a common sign a document was uploaded to a public-facing path by mistake.',
    queryTemplate: 'site:<domain> filetype:pdf intext:confidential',
    values: { filetype: 'pdf', intext: 'confidential' },
    tags: ['document-exposure', 'data-leak', 'recon'],
  },
  {
    category: 'Exposed Login/Admin Panels',
    title: 'Admin login pages',
    desc: 'Finds indexed administrative login pages on a domain. On an authorized assessment this flags admin interfaces that are internet-facing and discoverable when they should be restricted to a VPN, allowlist, or internal network.',
    queryTemplate: 'site:<domain> intitle:admin (inurl:login OR inurl:admin)',
    tags: ['admin-panel', 'exposure', 'attack-surface'],
  },
  {
    category: 'Exposed Login/Admin Panels',
    title: 'Common CMS/dashboard login paths',
    desc: 'Looks for well-known admin/dashboard URL patterns (wp-admin, /manager, /dashboard) that got indexed, helping confirm whether known management interfaces are reachable from the open internet.',
    queryTemplate: 'site:<domain> (inurl:wp-admin OR inurl:dashboard OR inurl:manager)',
    tags: ['admin-panel', 'cms', 'attack-surface'],
  },
  {
    category: 'Exposed Config/Backup/Credential Files',
    title: 'Environment and config files',
    desc: 'Targets .env, .ini, and .conf files, which frequently contain database credentials, API keys, and secret tokens for web frameworks when accidentally deployed to a public web root.',
    queryTemplate: 'site:<domain> (filetype:env OR filetype:ini OR filetype:conf)',
    tags: ['credential-exposure', 'config-file', 'secrets'],
  },
  {
    category: 'Exposed Config/Backup/Credential Files',
    title: 'Database dumps and backup archives',
    desc: 'Finds SQL dumps and generic backup/archive files that may have been left in a web-accessible path — a high-severity finding since these can contain full table exports including user data.',
    queryTemplate: 'site:<domain> (filetype:sql OR filetype:bak OR filetype:zip) intext:backup',
    tags: ['credential-exposure', 'backup', 'database-dump'],
  },
  {
    category: 'Exposed Config/Backup/Credential Files',
    title: 'Log files with sensitive strings',
    desc: 'Finds indexed .log files and filters for common secret-bearing terms — useful for catching error/debug logs that leaked stack traces, passwords, or internal hostnames.',
    queryTemplate: 'site:<domain> filetype:log intext:password',
    values: { filetype: 'log', intext: 'password' },
    tags: ['credential-exposure', 'log-file', 'secrets'],
  },
  {
    category: 'Cloud Storage Exposure',
    title: 'Indexed AWS S3 bucket content',
    desc: "Looks for indexed pages served directly from an organization's S3 bucket, which can reveal a publicly readable bucket containing files that should be private — a very common real-world misconfiguration.",
    queryTemplate: 'site:s3.amazonaws.com "<domain>"',
    tags: ['cloud-storage', 's3', 'misconfiguration'],
  },
  {
    category: 'Cloud Storage Exposure',
    title: 'Indexed Azure Blob Storage content',
    desc: "Same idea applied to Azure's blob storage hostname — surfaces publicly readable blob containers tied to the organization's name, which may expose uploaded files, backups, or logs.",
    queryTemplate: 'site:blob.core.windows.net "<domain>"',
    tags: ['cloud-storage', 'azure', 'misconfiguration'],
  },
  {
    category: 'Cloud Storage Exposure',
    title: 'Indexed Google Cloud Storage content',
    desc: "Checks whether content from a Google Cloud Storage bucket associated with the organization has been indexed, indicating public read access on a bucket that may hold sensitive assets.",
    queryTemplate: 'site:storage.googleapis.com "<domain>"',
    tags: ['cloud-storage', 'gcs', 'misconfiguration'],
  },
  {
    category: 'Subdomain & Asset Enumeration',
    title: 'All indexed subdomains',
    desc: 'Lists indexed hosts under the domain, helping build an inventory of externally visible subdomains — including forgotten staging, dev, or legacy hosts that may not be tracked in current asset records.',
    queryTemplate: 'site:*.<domain> -site:www.<domain>',
    tags: ['subdomain-enum', 'asset-inventory', 'recon'],
  },
  {
    category: 'Subdomain & Asset Enumeration',
    title: 'Non-production environment hosts',
    desc: 'Filters indexed subdomains for common pre-production naming patterns (dev/staging/test/uat), which are frequently less hardened than production and a common source of accidental exposure.',
    queryTemplate: 'site:<domain> (inurl:dev OR inurl:staging OR inurl:test OR inurl:uat)',
    tags: ['subdomain-enum', 'staging', 'attack-surface'],
  },
  {
    category: 'Technology/Version Fingerprinting',
    title: 'Default install/setup pages',
    desc: 'Finds leftover default installation, setup, or "it works" pages for common web software, which reveal the underlying stack and sometimes still allow completing setup if never locked down.',
    queryTemplate: 'site:<domain> intitle:"welcome to" ("nginx" OR "apache" OR "IIS")',
    tags: ['fingerprinting', 'default-install', 'misconfiguration'],
  },
  {
    category: 'Exposed Source Code/Repos',
    title: 'Exposed .git directories',
    desc: "Finds indexed .git metadata paths, which indicate a deployed application's source-controlled directory (including history and possibly credentials in old commits) is reachable over HTTP.",
    queryTemplate: 'site:<domain> inurl:.git intitle:"index of"',
    values: { inurl: '.git', intitle: 'index of' },
    tags: ['source-code-exposure', 'git', 'misconfiguration'],
  },
  {
    category: 'Exposed Source Code/Repos',
    title: 'Internal code or credentials on public code-hosting sites',
    desc: "Searches public code repositories for references to the organization's domain, which can reveal internal scripts, hardcoded credentials, or infrastructure notes committed to a public repo by mistake.",
    queryTemplate: 'site:github.com "<domain>" (password OR secret OR api_key)',
    tags: ['source-code-exposure', 'github', 'credential-exposure'],
  },
  {
    category: 'Exposed Database Interfaces',
    title: 'Internet-facing phpMyAdmin instances',
    desc: 'Finds indexed phpMyAdmin login interfaces — a widely deployed MySQL administration tool that should never be reachable from the open internet without additional access controls; indexing implies it is publicly routable.',
    queryTemplate: 'site:<domain> intitle:phpMyAdmin inurl:phpmyadmin',
    values: { intitle: 'phpMyAdmin', inurl: 'phpmyadmin' },
    tags: ['database-exposure', 'phpmyadmin', 'attack-surface'],
  },
  {
    category: 'Exposed Database Interfaces',
    title: 'Other exposed DB admin/management UIs',
    desc: 'Looks for indexed pages from common database web-management tools (Adminer, pgAdmin) whose presence in the public index confirms an admin console is exposed rather than confined to an internal network.',
    queryTemplate: 'site:<domain> (intitle:Adminer OR intitle:pgAdmin)',
    tags: ['database-exposure', 'admin-panel', 'attack-surface'],
  },
];
