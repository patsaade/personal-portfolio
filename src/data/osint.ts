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
//
// Engine roster (verified 2026, see each id's DORK_OPERATORS notes for the
// per-operator breakdown): Google, Bing, and DuckDuckGo as before, plus
// **Brave** — Brave Search now runs a fully independent, self-built crawler
// and index (its own docs: search.brave.com/help/brave-search-crawler; Brave
// has publicly described ending its prior fallback calls to Bing), so it's a
// genuine coverage-gap filler, not a re-skin of an engine already listed.
// Brave's own operator documentation (search.brave.com/help/operators) uses
// the *same literal* site:/filetype:/intitle:/""/-/OR syntax already modeled
// below, so it slots into the existing single-`prefix`-per-operator schema
// cleanly — it's deliberately NOT added to inurl:/intext:/before:/after:
// (see those operators' notes: Brave has no URL-substring or date operator,
// and its body-text operator is a differently-named inbody:, not intext:).
// Two other engines were researched and deliberately left out:
//   - **Startpage** — still a privacy-preserving *proxy in front of Google's
//     own index* (confirmed current as of this review), not an independently
//     crawled index. Per this file's own crawler-independence rule, that
//     makes it a redundant duplicate of the Google entry already here, not a
//     coverage-gap filler.
//   - **Yandex** — genuinely independently crawled, with real strength in
//     Russian/CIS-language coverage relevant to some threat-intel OSINT work.
//     Rejected anyway: its own official docs (yandex.com/support/search)
//     show its operator syntax diverges too far from the Google-style syntax
//     this schema assumes for a single shared `prefix` string — `mime:` not
//     `filetype:`, `|` not `OR`, `date:>YYYYMMDD`/`date:<YYYYMMDD` (or a
//     `date:YYYYMMDD..YYYYMMDD` range) not `before:`/`after:`, and a literal-
//     address `url:`/`host:`/`domain:` family rather than a substring
//     `inurl:`. Wiring Yandex in without a per-engine syntax layer (a real
//     but out-of-scope refactor) would silently emit incorrect queries for
//     most of the presets below, so it's excluded rather than guessed at.
//   - (Also researched: **Mojeek**, a genuinely independent UK-based crawler.
//     Its own operator docs — mojeek.com/support/search-operators.html — are
//     an explicit, exhaustive list: site:/intitle:/inurl:/intext:/before:/
//     since:, and nothing else. No filetype:, no OR, no documented exact-
//     phrase or minus-exclude syntax, and its date keyword is `since:` not
//     `after:`. Too little verified, literally-matching overlap with the
//     operators below to support correctly — left out for the same reason
//     as Yandex, not because its index isn't independent.)

export type EngineId = 'google' | 'bing' | 'duckduckgo' | 'brave';

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
  { id: 'brave', label: 'Brave', searchUrl: 'https://search.brave.com/search?q=' },
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
    engines: ['google', 'bing', 'duckduckgo', 'brave'],
    note: 'Officially documented on all four engines (Brave: search.brave.com/help/operators). Google\'s own docs note it "doesn\'t necessarily return all indexed URLs" under a domain — treat it as a search convenience, not a guaranteed asset inventory.',
  },
  {
    id: 'filetype',
    label: 'File type',
    placeholder: 'pdf',
    description: 'Only files of this extension (or several, as "pdf OR docx").',
    kind: 'prefix',
    prefix: 'filetype:',
    engines: ['google', 'bing', 'duckduckgo', 'brave'],
    note: 'Officially documented on all four engines (Brave also aliases it as ext:). DuckDuckGo supports a narrower, explicitly listed set of extensions (pdf, doc(x), xls(x), ppt(x), html) than Google/Bing/Brave. Brave\'s own docs flag its whole operator set as "experimental and in the early stage of development."',
  },
  {
    id: 'intitle',
    label: 'Title contains',
    placeholder: 'index of',
    description: 'Only pages with this text in the page title.',
    kind: 'prefix',
    prefix: 'intitle:',
    engines: ['google', 'bing', 'duckduckgo', 'brave'],
    note: 'Officially documented on Bing, DuckDuckGo, and Brave. Long-standing and still functional on Google, but Google\'s current public docs no longer formally list it.',
  },
  {
    id: 'inurl',
    label: 'URL contains',
    placeholder: 'admin',
    description: 'Only pages with this text in the URL path (or several, as "login OR admin").',
    kind: 'prefix',
    prefix: 'inurl:',
    engines: ['google', 'duckduckgo'],
    note: 'Officially documented on DuckDuckGo. Still functional on Google (undocumented). Bing suspended inurl: around 2007 to curb data-mining abuse and never restored it. Brave has no equivalent — its own operator docs list inbody:/inpage: (body/title text) but no URL-substring operator, so it\'s deliberately left out here rather than mapped onto a prefix Brave wouldn\'t recognize.',
  },
  {
    id: 'intext',
    label: 'Body text contains',
    placeholder: 'confidential',
    description: 'Only pages with this text in the page body.',
    kind: 'prefix',
    prefix: 'intext:',
    engines: ['google'],
    note: 'Still functional on Google, but undocumented by Google today. Bing/DuckDuckGo have no direct equivalent operator. Brave has a same-purpose inbody: operator, but under a different literal keyword than intext: — not wired in here, since this schema shares one literal prefix string per operator across engines and inbody: would need its own.',
  },
  {
    id: 'phrase',
    label: 'Exact phrase',
    placeholder: 'internal use only',
    description: 'Match this exact phrase, wrapped in quotes.',
    kind: 'phrase',
    engines: ['google', 'bing', 'duckduckgo', 'brave'],
    note: 'Officially documented, identical behavior, on all four engines.',
  },
  {
    id: 'exclude',
    label: 'Exclude terms',
    placeholder: 'jobs careers',
    description: 'Drop results containing any of these words.',
    kind: 'exclude',
    engines: ['google', 'bing', 'duckduckgo', 'brave'],
    note: 'Officially documented on all four. Bing requires the alternate NOT keyword to be capitalized if used instead of "-". Brave documents the same "-" syntax alongside its logical AND/OR/NOT keywords.',
  },
  {
    id: 'or',
    label: 'Match any of these terms',
    placeholder: 'login signin',
    description: 'Match any one of these words (space-separated) instead of all of them.',
    kind: 'or',
    engines: ['google', 'bing', 'brave'],
    note: 'Officially documented on Bing (capital OR, or "|") and Brave (capital OR, alongside AND/NOT as logical operators). Still functional on Google (undocumented). DuckDuckGo has no explicit OR keyword — space-separated terms already match loosely by default there.',
  },
  {
    id: 'before',
    label: 'Last updated before',
    placeholder: '2024-01-01',
    description: 'Only pages last updated before this date (YYYY-MM-DD or YYYY).',
    kind: 'prefix',
    prefix: 'before:',
    engines: ['google'],
    note: 'Officially documented on Google only. Bing and DuckDuckGo expose date filtering solely as a results-page UI control, not a query operator. Brave\'s own operator docs list no date operator at all.',
  },
  {
    id: 'after',
    label: 'Last updated after',
    placeholder: '2023-01-01',
    description: 'Only pages last updated after this date (YYYY-MM-DD or YYYY).',
    kind: 'prefix',
    prefix: 'after:',
    engines: ['google'],
    note: 'Officially documented on Google only — combine with "before" for a range. Brave\'s own operator docs list no date operator at all.',
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
  {
    id: 'breach',
    label: 'Paste Sites & Breach Exposure',
    desc: "Indexed mentions of your organization on public paste sites, or paired with breach/leak vocabulary anywhere on the web — the same low-effort first move a threat actor makes after a suspected compromise, useful defensively to catch exposure early. Type your company name or domain into the phrase field below.",
    highlight: ['site', 'phrase', 'or'],
    presets: [
      {
        title: 'Org name on major paste sites',
        desc: 'Searches the two most-indexed public paste/markdown-paste services for mentions of your organization — a common place stolen credentials, internal notes, or source-code snippets end up, whether pasted unintentionally by an employee or deliberately by an attacker advertising a breach.',
        queryTemplate: '(site:pastebin.com OR site:rentry.co) "<company name>"',
        values: { site: 'pastebin.com OR rentry.co' },
      },
      {
        title: 'Domain paired with breach/leak terminology',
        desc: 'Pairs your domain or organization name with common breach/leak vocabulary — a fast way to check whether it is being discussed anywhere indexed in a breach or leak context, not limited to one specific paste site.',
        queryTemplate: '"<company name>" (breach OR leak OR dump OR compromised OR exposed)',
        values: { or: 'breach leak dump compromised exposed' },
      },
    ],
    tip: 'Search-engine indexing of paste sites can lag by hours to days, so this is a periodic spot-check, not real-time monitoring — a dedicated paste/leak-monitoring feed complements rather than replaces it for time-sensitive credential-leak detection.',
  },
  {
    id: 'executive',
    label: 'Executive & VIP Exposure',
    desc: "Assesses a named executive or public figure's protective-intelligence exposure — publicly aggregated personal data and predictable public appearances — distinct from the Find a Person focus above, which is about verifying a claimed identity rather than assessing exposure risk for someone already known. Type the individual's full name into the phrase field below.",
    highlight: ['phrase', 'site', 'intitle'],
    presets: [
      {
        title: 'Data-broker / people-search exposure',
        desc: "Checks the highest-traffic U.S. people-search and data-broker sites for a named individual — these aggregate home addresses, phone numbers, relatives, and property records from public records, and are the standard starting point for a protective-intelligence exposure review or a pre-opt-out audit.",
        queryTemplate: '"<name>" (site:whitepages.com OR site:spokeo.com OR site:truepeoplesearch.com)',
        values: { site: 'whitepages.com OR spokeo.com OR truepeoplesearch.com' },
      },
      {
        title: 'Public appearance & speaking-schedule exposure',
        desc: "Finds conference, panel, or event pages publishing an individual's name alongside a schedule or agenda — a published keynote listing effectively hands anyone watching that person's location, date, and time, which is exactly the predictable-appearance exposure protective-intelligence teams screen for ahead of travel.",
        queryTemplate: '"<name>" (intitle:speaker OR intitle:agenda OR intitle:schedule)',
        values: { intitle: 'speaker OR agenda OR schedule' },
      },
    ],
    tip: "To narrow a common name to the specific individual, pair it with a known employer or city as a second exact phrase — the same two-phrase-clause technique noted under Find a Person above.",
  },
];
