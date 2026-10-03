// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { reviewDependencyAudit, reviewedCacheBoundaryMatches } from '../../scripts/lib/dependency-audit-policy.mjs';

const advisory = 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp';
const boundary = {
  now: new Date('2026-10-03T00:00:00Z'),
  reviewedBoundaryMatches: true,
  lockedVersion: '4.2.0',
};
const report = (vulnerabilities) => ({
  auditReportVersion: 2, vulnerabilities,
  metadata: { vulnerabilities: {
    total: Object.keys(vulnerabilities).length,
    ...Object.fromEntries(['info', 'low', 'moderate', 'high', 'critical']
      .map(level => [level, Object.values(vulnerabilities).filter(entry => entry.severity === level).length])),
  } },
});
const cache = () => ({
  name: 'http-cache-semantics', severity: 'high', nodes: ['node_modules/http-cache-semantics'],
  via: [{ name: 'http-cache-semantics', url: advisory, severity: 'high', range: '<=4.2.0' }],
});

describe('dependency audit release gate', () => {
  it('requires the exact reviewed static configuration and installed Astro caller', async () => {
    const files = Object.fromEntries(await Promise.all([
      'astro.config.mjs', 'wrangler.jsonc', 'package-lock.json', 'node_modules/astro/dist/assets/build/remote.js',
    ].map(async file => [file, await readFile(file, 'utf8')])));
    expect(reviewedCacheBoundaryMatches(files, '7.2.8')).toBe(true);
    expect(reviewedCacheBoundaryMatches(files, '7.2.9')).toBe(false);
    expect(reviewedCacheBoundaryMatches({}, '7.2.8')).toBe(false);
    for (const file of Object.keys(files)) {
      expect(reviewedCacheBoundaryMatches({ ...files, [file]: `${files[file]}\n` }, '7.2.8')).toBe(false);
    }
    const changedLock = JSON.parse(files['package-lock.json']);
    changedLock.packages['node_modules/unreviewed-proxy'] = { version: '1.0.0', dependencies: { 'http-cache-semantics': '4.2.0' } };
    expect(reviewedCacheBoundaryMatches({ ...files, 'package-lock.json': JSON.stringify(changedLock) }, '7.2.8')).toBe(false);
  });
  it.each([
    null, {}, { auditReportVersion: 3, vulnerabilities: {} },
    { ...report({}), error: { code: 'ENOAUDIT' } },
    { ...report({}), metadata: { vulnerabilities: { total: 1 } } },
    report({ bad: { name: 'bad', severity: 'unknown', via: [] } }),
    report({ bad: { name: 'bad', severity: 'high', via: [null] } }),
    report({ bad: { name: 'bad', severity: 'high', via: 'missing' } }),
  ])('fails closed for invalid or unavailable audit data: %j', input => {
    expect(() => reviewDependencyAudit(input, boundary)).toThrow(/Invalid npm audit report/);
  });
  it.each([
    { missing: { name: 'missing', severity: 'low', via: ['absent'] } },
    { cycle: { name: 'cycle', severity: 'low', via: ['cycle'] } },
    { empty: { name: 'empty', severity: 'high', via: [] } },
    { 'http-cache-semantics': { ...cache(), severity: 'low' } },
  ])('rejects incomplete graphs or understated direct severity regardless of the threshold: %j', entries => {
    expect(() => reviewDependencyAudit(report(entries), boundary)).toThrow(/Invalid npm audit report/);
  });
  it('rejects inconsistent severity totals and permits a clean audit after exception expiry', () => {
    const input = report({ 'http-cache-semantics': cache() });
    input.metadata.vulnerabilities.high = 0;
    expect(() => reviewDependencyAudit(input, boundary)).toThrow(/Invalid npm audit report/);
    expect(reviewDependencyAudit(report({}), { ...boundary, now: new Date('2026-11-01') }))
      .toEqual({ blocked: [], exceptions: [] });
  });
  it.each([
    { now: new Date('2026-10-17T00:00:00Z') },
    { now: new Date('invalid') },
    { reviewedBoundaryMatches: false },
    { lockedVersion: '4.2.1' },
  ])('blocks the exception when the reviewed boundary is invalid: %j', change => {
    expect(reviewDependencyAudit(report({ 'http-cache-semantics': cache() }), { ...boundary, ...change }).blocked)
      .toEqual(['http-cache-semantics']);
  });
  it('blocks changed nodes, new advisories and unrelated high-risk dependency chains', () => {
    const changed = { ...cache(), nodes: ['node_modules/other/node_modules/http-cache-semantics'] };
    expect(reviewDependencyAudit(report({ 'http-cache-semantics': changed }), boundary).blocked).toEqual(['http-cache-semantics']);
    const mixed = cache();
    mixed.via.push({ name: 'http-cache-semantics', url: 'https://github.com/advisories/GHSA-other', severity: 'high', range: '*' });
    expect(reviewDependencyAudit(report({ 'http-cache-semantics': mixed }), boundary).blocked).toEqual(['http-cache-semantics']);
    expect(reviewDependencyAudit(report({
      'http-cache-semantics': cache(),
      other: { name: 'other', severity: 'high', via: [{ name: 'other', url: 'https://github.com/advisories/GHSA-other', severity: 'high', range: '*' }] },
      parent: { name: 'parent', severity: 'high', via: ['http-cache-semantics', 'other'] },
      moderate: { name: 'moderate', severity: 'moderate', via: [{ name: 'moderate', url: 'https://github.com/advisories/GHSA-moderate', severity: 'moderate', range: '*' }] },
    }), boundary)).toEqual({ blocked: ['other', 'parent'], exceptions: ['http-cache-semantics'] });
  });
  it('accepts only the reviewed advisory and its advisory-only parent chain before expiry', () => {
    const result = reviewDependencyAudit(report({
      'http-cache-semantics': cache(),
      astro: { name: 'astro', severity: 'high', via: ['http-cache-semantics'] },
      '@astrojs/mdx': { name: '@astrojs/mdx', severity: 'high', via: ['astro'] },
    }), boundary);
    expect(result.blocked).toEqual([]);
    expect(result.exceptions).toEqual(['@astrojs/mdx', 'astro', 'http-cache-semantics']);
  });
});
