import { describe, it, expect } from 'vitest';
import {
  unfoldHeaders,
  getHeader,
  getHeaders,
  parseReceivedChain,
  formatDeltaMs,
  parseAuthenticationResults,
  summarizeAuthResults,
  extractAddressFields,
  detectMismatches,
  decodeM365Headers,
  describeSclValue,
  describeBclValue,
} from '../src/utils/emailHeaders';

// A hand-built, fabricated sample header block (RFC 5737 documentation-range
// IPs, example.* domains) — never a real captured message. Received headers
// are listed newest-first, exactly like a real pasted header block (each new
// hop is prepended by the server that adds it): mx3 (newest) at :42, mx2 at
// :12, mx1 (oldest/originating) at :14:58.
const SAMPLE = `Received: from mx3.example.com (mx3.example.com [203.0.113.9])
\tby final.example.com with ESMTP id ccc333;
\tWed, 01 Jan 2025 08:15:42 -0800
Received: from mx2.example.net (mx2.example.net [198.51.100.23])
\tby mx3.example.com with ESMTP id bbb222;
\tWed, 01 Jan 2025 08:15:12 -0800
Received: from mx1.example.org (mx1.example.org [192.0.2.5])
\tby mx2.example.net with ESMTP id aaa111;
\tWed, 01 Jan 2025 08:14:58 -0800
Authentication-Results: mx.example.com;
\tdkim=pass header.i=@example.org header.s=selector1 header.b=xyz789;
\tspf=pass smtp.mailfrom=billing@example.org;
\tdmarc=pass header.from=example.org
From: "Billing" <billing@example.org>
Reply-To: payments@notexample.net
Return-Path: <bounce@example.org>
Subject: Test invoice
`;

describe('unfoldHeaders / getHeader(s)', () => {
  it('joins RFC 5322 folded continuation lines into one logical header', () => {
    const text = 'Subject: Hello\n  World\nFrom: a@example.com\n';
    const headers = unfoldHeaders(text);
    expect(headers.find((h) => h.name === 'Subject')?.value).toBe('Hello World');
    expect(headers.find((h) => h.name === 'From')?.value).toBe('a@example.com');
  });

  it('stops at the first blank line (header/body boundary)', () => {
    const text = 'Subject: Hello\n\nThis is the body, not a header.\n';
    expect(unfoldHeaders(text)).toHaveLength(1);
  });

  it('getHeaders finds every occurrence of a repeated header, case-insensitively', () => {
    const text = 'received: one\nReceived: two\n';
    expect(getHeaders(text, 'RECEIVED').map((h) => h.value)).toEqual(['one', 'two']);
  });

  it('getHeader returns null when the header is absent', () => {
    expect(getHeader('Subject: hi\n', 'From')).toBeNull();
  });
});

describe('parseReceivedChain', () => {
  it('reorders hops oldest-first (bottom-to-top of the raw pasted text) with correct from/by fields', () => {
    const hops = parseReceivedChain(SAMPLE);
    expect(hops).toHaveLength(3);
    expect(hops[0].from).toMatch(/mx1\.example\.org/);
    expect(hops[0].by).toMatch(/mx2\.example\.net/);
    expect(hops[1].from).toMatch(/mx2\.example\.net/);
    expect(hops[2].from).toMatch(/mx3\.example\.com/);
    expect(hops.map((h) => h.index)).toEqual([1, 2, 3]);
  });

  it('computes correct inter-hop time deltas in milliseconds', () => {
    const hops = parseReceivedChain(SAMPLE);
    // First hop has nothing before it.
    expect(hops[0].deltaMs).toBeNull();
    // 08:14:58 -> 08:15:12 = 14s
    expect(hops[1].deltaMs).toBe(14_000);
    // 08:15:12 -> 08:15:42 = 30s
    expect(hops[2].deltaMs).toBe(30_000);
  });

  it('parses each hop timestamp into the correct canonical instant', () => {
    const hops = parseReceivedChain(SAMPLE);
    expect(hops[0].ns).not.toBeNull();
    expect(hops[2].ns! > hops[0].ns!).toBe(true);
  });

  it('returns an empty array when there are no Received headers', () => {
    expect(parseReceivedChain('From: a@example.com\n')).toEqual([]);
  });

  it('handles a hop with no parseable timestamp without breaking the rest of the chain', () => {
    const text = `Received: from a.example.com by b.example.com; not a real date
Received: from c.example.com by a.example.com; Wed, 01 Jan 2025 08:00:00 -0800
`;
    const hops = parseReceivedChain(text);
    expect(hops).toHaveLength(2);
    expect(hops[0].ns).not.toBeNull();
    expect(hops[1].ns).toBeNull();
    expect(hops[1].deltaMs).toBeNull();
  });
});

describe('formatDeltaMs', () => {
  it('formats sub-minute deltas as seconds', () => {
    expect(formatDeltaMs(14_000)).toBe('+14s');
  });
  it('formats multi-unit deltas with the larger units first', () => {
    expect(formatDeltaMs(3_725_000)).toBe('+1h 2m 5s');
  });
  it('formats a negative delta with a leading minus', () => {
    expect(formatDeltaMs(-5_000)).toBe('-5s');
  });
});

describe('parseAuthenticationResults / summarizeAuthResults', () => {
  it('extracts SPF, DKIM, and DMARC verdicts from a sample Authentication-Results header', () => {
    const results = parseAuthenticationResults(SAMPLE);
    const summary = summarizeAuthResults(results);
    expect(summary.spf?.verdict).toBe('pass');
    expect(summary.dkim?.verdict).toBe('pass');
    expect(summary.dmarc?.verdict).toBe('pass');
    expect(summary.spf?.detail).toContain('smtp.mailfrom=billing@example.org');
  });

  it('distinguishes a fail verdict from a pass verdict', () => {
    const text = 'Authentication-Results: mx.example.com; spf=fail smtp.mailfrom=spoofed@example.net; dkim=none; dmarc=fail\n';
    const summary = summarizeAuthResults(parseAuthenticationResults(text));
    expect(summary.spf?.verdict).toBe('fail');
    expect(summary.dkim?.verdict).toBe('none');
    expect(summary.dmarc?.verdict).toBe('fail');
  });

  it('returns an empty summary when no Authentication-Results header is present', () => {
    const summary = summarizeAuthResults(parseAuthenticationResults('From: a@example.com\n'));
    expect(summary.spf).toBeNull();
    expect(summary.dkim).toBeNull();
    expect(summary.dmarc).toBeNull();
  });
});

describe('extractAddressFields / detectMismatches', () => {
  it('flags a From vs. Reply-To domain mismatch, and does not flag a matching From vs. Return-Path pair', () => {
    const fields = extractAddressFields(SAMPLE);
    expect(fields.from.domain).toBe('example.org');
    expect(fields.replyTo.domain).toBe('notexample.net');
    expect(fields.returnPath.domain).toBe('example.org');

    const flags = detectMismatches(fields);
    const fromReplyTo = flags.find((f) => f.label === 'From vs. Reply-To');
    const fromReturnPath = flags.find((f) => f.label === 'From vs. Return-Path');
    expect(fromReplyTo?.mismatch).toBe(true);
    expect(fromReturnPath?.mismatch).toBe(false);
  });

  it('flags nothing when every address domain matches', () => {
    const text = 'From: alice@example.com\nReply-To: alice@example.com\nReturn-Path: <alice@example.com>\n';
    const flags = detectMismatches(extractAddressFields(text));
    expect(flags.every((f) => f.mismatch === false)).toBe(true);
  });

  it('never flags a mismatch when one side is missing entirely', () => {
    const text = 'From: alice@example.com\n';
    const flags = detectMismatches(extractAddressFields(text));
    expect(flags.every((f) => f.mismatch === false)).toBe(true);
  });
});

describe('decodeM365Headers', () => {
  it('extracts X-MS-Exchange-Organization-* headers and X-Forefront-Antispam-Report SCL/BCL fields', () => {
    const text = [
      'X-MS-Exchange-Organization-AuthAs: Internal',
      'X-MS-Exchange-Organization-SCL: 1',
      'X-Forefront-Antispam-Report: CIP:203.0.113.45;CTRY:US;SCL:1;BCL:0;',
      '',
    ].join('\n');
    const decoded = decodeM365Headers(text);
    expect(decoded.present).toBe(true);
    expect(decoded.orgHeaders.some((h) => h.name.toLowerCase() === 'x-ms-exchange-organization-authas')).toBe(true);
    const scl = decoded.antispam.find((f) => f.key.toLowerCase() === 'scl');
    expect(scl?.value).toBe('1');
    expect(scl?.description).toMatch(/not.*spam/i);
    const bcl = decoded.antispam.find((f) => f.key.toLowerCase() === 'bcl');
    expect(bcl?.description).toMatch(/not from a bulk sender/i);
  });

  it('reports present: false when no M365/Exchange headers exist', () => {
    const decoded = decodeM365Headers('From: a@example.com\n');
    expect(decoded.present).toBe(false);
    expect(decoded.orgHeaders).toEqual([]);
    expect(decoded.antispam).toEqual([]);
  });
});

describe('describeSclValue / describeBclValue', () => {
  it('maps the documented SCL bands', () => {
    expect(describeSclValue('-1')).toMatch(/skipped/i);
    expect(describeSclValue('1')).toMatch(/not.*spam/i);
    expect(describeSclValue('6')).toMatch(/marked as spam/i);
    expect(describeSclValue('9')).toMatch(/high confidence spam/i);
  });

  it('returns null for a non-numeric value', () => {
    expect(describeSclValue('n/a')).toBeNull();
  });

  it('maps the documented BCL bands', () => {
    expect(describeBclValue('0')).toMatch(/not from a bulk sender/i);
    expect(describeBclValue('2')).toMatch(/few complaints/i);
    expect(describeBclValue('5')).toMatch(/mixed\/moderate/i);
    expect(describeBclValue('8')).toMatch(/high number/i);
  });
});
