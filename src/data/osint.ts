// OSINT / search-engine "dorking" data for the interactive Dork Builder
// (/osint/) — modeled as a recipe: a Focus (culinary "style") highlights
// which Ingredients (operator fields) matter and offers a few named Presets;
// picking a Preset fills those ingredients, and the live-assembled Recipe is
// the final query. Every operator's syntax and support status is verified
// against each engine's own current help documentation — Google has both
// formally deprecated several classic "dork" operators over the years
// (cache:, related:, info:, the + prefix, the ~ synonym operator — all
// excluded here) AND quietly stopped *documenting* several others that are
// still long-standing and functional (intitle:, inurl:, intext:, OR,
// before:/after:) without retiring them; `note` flags that distinction per
// operator rather than presenting undocumented-but-working and officially-
// documented syntax as equivalent. Focuses/presets are well-established
// OSINT patterns, framed for authorized/defensive use (assessing your own
// exposure, or an authorized investigation) — consistent with this site's
// dual-use-tool guidance. A preset's `values` can put multiple alternatives
// on a single prefix-kind ingredient as "termA OR termB" (the builder expands
// this into the correct parenthesized `(filetype:termA OR filetype:termB)`
// syntax) — see DorkBuilder.astro's fragmentFor(). `values.site`, when
// present, deliberately overrides the domain field (e.g. a preset that's
// inherently about a third-party host like an S3 bucket, not the user's own
// site) — the builder only preserves the user's typed domain when a preset
// does NOT specify one.

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
    description: 'Restrict results to one domain (or several, as "a.com OR b.com").',
    kind: 'prefix',
    prefix: 'site:',
    engines: ['google', 'bing', 'duckduckgo'],
    note: 'Officially documented on all three engines. Google\'s own docs note it "doesn\'t necessarily return all indexed URLs" under a domain — treat it as a search convenience, not a guaranteed asset inventory.',
  },
  {
    id: 'filetype',
    label: 'File type',
    placeholder: 'pdf',
    description: 'Only files of this extension (or several, as "pdf OR docx").',
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
    description: 'Only pages with this text in the URL path (or several, as "login OR admin").',
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

export interface DorkPreset {
  title: string;
  desc: string;
  /** The full, literal, verified query — a `<domain>`/`<name>` placeholder shown as a reference caption. */
  queryTemplate: string;
  /** operator id -> value to hydrate the ingredients when this preset is picked. */
  values: Record<string, string>;
}

export interface DorkFocus {
  id: string;
  label: string;
  desc: string;
  /** Ingredient (operator) ids to visually highlight while this focus is active. */
  highlight: string[];
  presets: DorkPreset[];
  /** A technique worth knowing that doesn't map cleanly onto a single preset. */
  tip?: string;
}

export const DORK_FOCUSES: DorkFocus[] = [
  {
    id: 'files',
    label: 'Exposed Files & Documents',
    desc: 'Publicly indexed files that may have been published by mistake — reports, contracts, or logs never meant for a public page.',
    highlight: ['site', 'filetype', 'intext'],
    presets: [
      {
        title: 'Indexed PDFs & office docs',
        desc: 'Surfaces publicly indexed PDF, Word, and Excel files under a domain — useful for checking whether internal reports, HR documents, or contracts were accidentally published or linked from a public page.',
        queryTemplate: 'site:<domain> (filetype:pdf OR filetype:docx OR filetype:xlsx)',
        values: { filetype: 'pdf OR docx OR xlsx' },
      },
      {
        title: 'Documents with sensitive markings',
        desc: 'Combines a filetype filter with body-text matching to find files marked confidential/internal that still got indexed — a common sign a document was uploaded to a public-facing path by mistake.',
        queryTemplate: 'site:<domain> filetype:pdf intext:confidential',
        values: { filetype: 'pdf', intext: 'confidential' },
      },
      {
        title: 'Log files with secrets',
        desc: 'Finds indexed .log files and filters for common secret-bearing terms — useful for catching error/debug logs that leaked stack traces, passwords, or internal hostnames.',
        queryTemplate: 'site:<domain> filetype:log intext:password',
        values: { filetype: 'log', intext: 'password' },
      },
    ],
  },
  {
    id: 'directories',
    label: 'Directory Listings',
    desc: "A web server's directory-listing feature left enabled, exposing the raw file/folder structure instead of a proper index page.",
    highlight: ['site', 'intitle', 'inurl'],
    presets: [
      {
        title: 'Open directory index',
        desc: 'A classic misconfiguration that can leak internal files, old backups, or unlinked assets never meant to be browsed directly.',
        queryTemplate: 'site:<domain> intitle:"index of /"',
        values: { intitle: 'index of /' },
      },
      {
        title: 'Backup folder browsing',
        desc: 'Narrows the open-directory search to a specific path — useful for confirming whether a particular known folder on your own infrastructure is inadvertently browsable.',
        queryTemplate: 'site:<domain> intitle:"index of" inurl:backup',
        values: { intitle: 'index of', inurl: 'backup' },
      },
    ],
  },
  {
    id: 'panels',
    label: 'Login & Admin Panels',
    desc: 'Administrative or database-management interfaces that are internet-facing and discoverable when they should be restricted to a VPN or internal network.',
    highlight: ['site', 'intitle', 'inurl'],
    presets: [
      {
        title: 'Admin login pages',
        desc: 'Finds indexed administrative login pages on a domain.',
        queryTemplate: 'site:<domain> intitle:admin (inurl:login OR inurl:admin)',
        values: { intitle: 'admin', inurl: 'login OR admin' },
      },
      {
        title: 'Common CMS/dashboard paths',
        desc: 'Looks for well-known admin/dashboard URL patterns (wp-admin, /manager, /dashboard) that got indexed.',
        queryTemplate: 'site:<domain> (inurl:wp-admin OR inurl:dashboard OR inurl:manager)',
        values: { inurl: 'wp-admin OR dashboard OR manager' },
      },
      {
        title: 'Internet-facing phpMyAdmin',
        desc: 'Finds indexed phpMyAdmin login interfaces — a widely deployed MySQL admin tool that should never be reachable from the open internet; indexing implies it is publicly routable.',
        queryTemplate: 'site:<domain> intitle:phpMyAdmin inurl:phpmyadmin',
        values: { intitle: 'phpMyAdmin', inurl: 'phpmyadmin' },
      },
      {
        title: 'Other exposed DB admin UIs',
        desc: 'Looks for indexed pages from common database web-management tools (Adminer, pgAdmin).',
        queryTemplate: 'site:<domain> (intitle:Adminer OR intitle:pgAdmin)',
        values: { intitle: 'Adminer OR pgAdmin' },
      },
    ],
  },
  {
    id: 'credentials',
    label: 'Credentials & Backups',
    desc: 'Config, backup, and dump files that frequently contain database credentials, API keys, and secret tokens.',
    highlight: ['site', 'filetype'],
    presets: [
      {
        title: 'Environment & config files',
        desc: 'Targets .env, .ini, and .conf files, which frequently contain database credentials, API keys, and secret tokens for web frameworks when accidentally deployed to a public web root.',
        queryTemplate: 'site:<domain> (filetype:env OR filetype:ini OR filetype:conf)',
        values: { filetype: 'env OR ini OR conf' },
      },
      {
        title: 'Database dumps & archives',
        desc: 'Finds SQL dumps and generic backup/archive files that may have been left in a web-accessible path — a high-severity finding since these can contain full table exports including user data.',
        queryTemplate: 'site:<domain> (filetype:sql OR filetype:bak OR filetype:zip) intext:backup',
        values: { filetype: 'sql OR bak OR zip', intext: 'backup' },
      },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud Storage',
    desc: "Publicly readable cloud storage buckets tied to an organization's name — a very common real-world misconfiguration.",
    highlight: ['site', 'phrase'],
    presets: [
      {
        title: 'Public bucket exposure (S3 / Azure / GCS)',
        desc: "Checks the three major cloud-storage hostnames for indexed content mentioning your organization's name — a publicly readable bucket can expose files, backups, or logs that should be private. Type your company or domain name into the phrase field below.",
        queryTemplate: '(site:s3.amazonaws.com OR site:blob.core.windows.net OR site:storage.googleapis.com) "<company name>"',
        values: { site: 's3.amazonaws.com OR blob.core.windows.net OR storage.googleapis.com' },
      },
    ],
  },
  {
    id: 'assets',
    label: 'Subdomains, Assets & Source Code',
    desc: 'External asset inventory — forgotten staging hosts, default install pages, and source code or credentials leaked to public repos.',
    highlight: ['site', 'inurl', 'intitle'],
    presets: [
      {
        title: 'Non-production hosts',
        desc: 'Filters indexed subdomains for common pre-production naming patterns (dev/staging/test/uat), which are frequently less hardened than production and a common source of accidental exposure.',
        queryTemplate: 'site:<domain> (inurl:dev OR inurl:staging OR inurl:test OR inurl:uat)',
        values: { inurl: 'dev OR staging OR test OR uat' },
      },
      {
        title: 'Default install/setup pages',
        desc: 'Finds leftover default installation, setup, or "it works" pages for common web software, which reveal the underlying stack and sometimes still allow completing setup if never locked down.',
        queryTemplate: 'site:<domain> intitle:"welcome to" ("nginx" OR "apache" OR "IIS")',
        values: { intitle: 'welcome to', or: 'nginx apache IIS' },
      },
      {
        title: 'Exposed .git directories',
        desc: "Finds indexed .git metadata paths, which indicate a deployed application's source-controlled directory (including history and possibly credentials in old commits) is reachable over HTTP.",
        queryTemplate: 'site:<domain> inurl:.git intitle:"index of"',
        values: { inurl: '.git', intitle: 'index of' },
      },
      {
        title: 'Code or credentials on GitHub',
        desc: "Searches GitHub for references to your domain alongside common secret-bearing terms, which can reveal internal scripts, hardcoded credentials, or infrastructure notes committed to a public repo by mistake. Type your domain into the phrase field below.",
        queryTemplate: 'site:github.com "<domain>" (password OR secret OR api_key)',
        values: { site: 'github.com', or: 'password secret api_key' },
      },
    ],
    tip: 'To enumerate every indexed subdomain at once (excluding just the main www host), try site:*.<domain> -site:www.<domain> directly — it doesn\'t map onto a single ingredient, so it isn\'t a preset above, but it\'s a genuinely useful pattern to type in by hand.',
  },
  {
    id: 'person',
    label: 'Find a Person',
    desc: 'Cross-reference a name against professional, social, and document sources — verifying a claimed identity, vetting a candidate or vendor, or confirming the registrant behind a suspicious contact during an authorized investigation. Type the name into the phrase field below.',
    highlight: ['phrase', 'site'],
    presets: [
      {
        title: 'Professional profile lookup',
        desc: "Finds a person's LinkedIn profile page directly — the well-established recruiter/OSINT \"X-ray search\" technique for bypassing LinkedIn's own limited on-site search. A standard first step for verifying a claimed employer/title on a resume or a threat actor's claimed professional identity.",
        queryTemplate: 'site:linkedin.com/in "<name>"',
        values: { site: 'linkedin.com/in' },
      },
      {
        title: 'Cross-platform social footprint',
        desc: 'Searches multiple major social platforms at once for the same name, surfacing accounts that may not be linked to each other — used to build an authorized subject profile or confirm which public accounts actually belong to a person under investigation, rather than a same-named individual.',
        queryTemplate: '"<name>" (site:facebook.com OR site:twitter.com OR site:instagram.com)',
        values: { site: 'facebook.com OR twitter.com OR instagram.com' },
      },
      {
        title: 'Resume or CV discovery',
        desc: 'Finds resumes/CVs a person has published or had indexed as PDF/Word/Excel/PowerPoint files, often surfacing employment history, a phone number, or an email not shown on a locked-down social profile.',
        queryTemplate: '"<name>" (filetype:pdf OR filetype:docx OR filetype:xlsx OR filetype:pptx) intext:resume',
        values: { filetype: 'pdf OR docx OR xlsx OR pptx', intext: 'resume' },
      },
    ],
    tip: 'To rule out a same-named person, pair the name with a known employer or city as two separate exact phrases: "<name>" "<employer-or-location>". That needs two phrase clauses at once, which doesn\'t map onto a single ingredient — worth typing in by hand.',
  },
  {
    id: 'business',
    label: 'Find a Business',
    desc: "Verify a company's public footprint for vendor risk assessments, threat-actor attribution, or confirming the organization behind a suspicious domain or claimed employer. Type the company name into the phrase field below.",
    highlight: ['phrase', 'site', 'filetype'],
    presets: [
      {
        title: 'Corporate LinkedIn presence',
        desc: "Confirms a company's official LinkedIn footprint and lets you cross-check claimed employees/executives against it — a standard first step in vendor and candidate due diligence.",
        queryTemplate: 'site:linkedin.com/company "<company name>"',
        values: { site: 'linkedin.com/company' },
      },
      {
        title: 'Public reports & documents',
        desc: 'Surfaces publicly indexed PDFs (annual reports, whitepapers, filings) a company has published or accidentally exposed on its own domain — useful for financial/vendor-risk review.',
        queryTemplate: 'site:<domain> filetype:pdf intext:"annual report"',
        values: { filetype: 'pdf', intext: 'annual report' },
      },
      {
        title: 'Press & news wire coverage',
        desc: "Searches the two major newswire services for a company's official press releases and third-party coverage — corroborates claims made by or about the organization (acquisitions, leadership changes, incidents) against independently published material.",
        queryTemplate: '(site:businesswire.com OR site:prnewswire.com) "<company name>"',
        values: { site: 'businesswire.com OR prnewswire.com' },
      },
    ],
  },
];
