// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import {
  CACHE_ADVISORY, CACHE_EXCEPTION_EXPIRES, REVIEWED_CACHE_BOUNDARY_FILES,
  reviewDependencyAudit, reviewedCacheBoundaryMatches,
} from './lib/dependency-audit-policy.mjs';

try {
  const cwd = new URL('../', import.meta.url);
  const audit = spawnSync('npm', ['audit', '--json', '--ignore-scripts'], {
    cwd, encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
  });
  if (audit.error || ![0, 1].includes(audit.status)) throw new Error('Audit service unavailable');
  const report = JSON.parse(audit.stdout);
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const files = Object.fromEntries(await Promise.all(Object.keys(REVIEWED_CACHE_BOUNDARY_FILES)
    .map(async file => [file, await readFile(new URL(file, cwd), 'utf8')])));
  const result = reviewDependencyAudit(report, {
    now: new Date(),
    lockedVersion: lock.packages['node_modules/http-cache-semantics']?.version,
    reviewedBoundaryMatches: reviewedCacheBoundaryMatches(files, lock.packages['node_modules/astro']?.version),
  });
  console.log(JSON.stringify({
    auditLevel: 'high', ...result,
    ...(result.exceptions.length ? { advisory: CACHE_ADVISORY, expiresExclusive: CACHE_EXCEPTION_EXPIRES,
      disposition: 'not reachable in reviewed static deployment; package remains vulnerable' } : {}),
  }, null, 2));
  if (result.blocked.length) process.exitCode = 1;
} catch {
  console.error('Dependency audit failed closed: unavailable/malformed report or unreviewed boundary. No raw diagnostics retained.');
  process.exitCode = 1;
}
