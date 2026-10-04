// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
export const CACHE_ADVISORY = 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp';
export const CACHE_EXCEPTION_EXPIRES = '2026-10-17T00:00:00Z';
// See DEPENDENCY_REVIEW.md. Any config/caller change requires a new reachability review.
export const REVIEWED_CACHE_BOUNDARY_FILES = {
  'astro.config.mjs': 'a25e0878706a8e3dffe800c9b9c20161597e450f9f6b79f40afaddd70213b656',
  'wrangler.jsonc': 'e3f1d938b268baf8d79178175289999b7f850ef539251fde95d106b4063a8655',
  'package-lock.json': 'ad5da3bb6e55d6d1e9fa66ab0a40fcf2c3e28fcff0bba7301303d4cd31fb661a',
  'node_modules/astro/dist/assets/build/remote.js': 'f373fa76e3112446db327c79b34e2bbb1ef1dcad41affb60788adf30edc9588e',
};

export function reviewedCacheBoundaryMatches(files, astroVersion) {
  return astroVersion === '7.2.8' && Object.entries(REVIEWED_CACHE_BOUNDARY_FILES).every(([file, digest]) =>
    typeof files[file] === 'string' && createHash('sha256').update(files[file]).digest('hex') === digest);
}

export function reviewDependencyAudit(report, boundary) {
  if (report?.auditReportVersion !== 2 || report.error || !report.vulnerabilities
    || typeof report.vulnerabilities !== 'object' || Array.isArray(report.vulnerabilities)
    || report.metadata?.vulnerabilities?.total !== Object.keys(report.vulnerabilities).length) {
    throw new Error('Invalid npm audit report');
  }
  const vulnerabilities = report.vulnerabilities;
  const severities = ['info', 'low', 'moderate', 'high', 'critical'];
  for (const [name, entry] of Object.entries(vulnerabilities)) {
    if (entry?.name !== name || !severities.includes(entry.severity)
      || !Array.isArray(entry.via) || !entry.via.length || entry.via.some(cause => typeof cause === 'string'
        ? !Object.hasOwn(vulnerabilities, cause)
        : !cause || typeof cause.name !== 'string' || typeof cause.url !== 'string'
          || typeof cause.range !== 'string' || !severities.includes(cause.severity)
          || severities.indexOf(cause.severity) > severities.indexOf(entry.severity))) {
      throw new Error('Invalid npm audit report');
    }
  }
  for (const severity of severities) {
    if (report.metadata.vulnerabilities[severity] !== Object.values(vulnerabilities)
      .filter(entry => entry.severity === severity).length) throw new Error('Invalid npm audit report');
  }
  const visited = new Set();
  function validateGraph(name, ancestors = new Set()) {
    if (ancestors.has(name)) throw new Error('Invalid npm audit report');
    if (visited.has(name)) return;
    const next = new Set([...ancestors, name]);
    for (const cause of vulnerabilities[name].via) if (typeof cause === 'string') validateGraph(cause, next);
    visited.add(name);
  }
  for (const name of Object.keys(vulnerabilities)) validateGraph(name);
  const applicable = boundary.reviewedBoundaryMatches === true
    && boundary.lockedVersion === '4.2.0'
    && Number.isFinite(boundary.now?.getTime())
    && boundary.now.getTime() < Date.parse(CACHE_EXCEPTION_EXPIRES);
  function excepted(name) {
    const entry = vulnerabilities[name];
    return entry.via.every(cause => typeof cause === 'string'
      ? excepted(cause)
      : applicable && name === 'http-cache-semantics' && cause.name === name && cause.url === CACHE_ADVISORY
        && cause.range === '<=4.2.0' && cause.severity === 'high' && entry.severity === 'high'
        && entry.nodes?.length === 1 && entry.nodes[0] === 'node_modules/http-cache-semantics');
  }
  const blocked = [];
  const exceptions = [];
  for (const [name, entry] of Object.entries(vulnerabilities)) {
    if (excepted(name)) exceptions.push(name);
    else if (['high', 'critical'].includes(entry.severity)) blocked.push(name);
  }
  return { blocked: blocked.sort(), exceptions: exceptions.sort() };
}
