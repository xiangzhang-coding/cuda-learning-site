// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import { scanFiles } from './lib/quality-policy.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '..');
const allowedRootEntries = new Set([
  '.gitattributes',
  '.github',
  '.gitignore',
  '.node-version',
  '.npmrc',
  'CONTENT_LICENSES.md',
  'CONTRIBUTING.md',
  'DEPENDENCY_REVIEW.md',
  'DEPLOYMENT.md',
  'examples',
  'LICENSE',
  'LICENSE-CONTENT',
  'MAINTENANCE_SOURCES.md',
  'NOTICE',
  'README.md',
  'SECURITY.md',
  'THIRD_PARTY_NOTICES.md',
  'astro.config.mjs',
  'package-lock.json',
  'package.json',
  'playwright.config.ts',
  'playwright.release.config.ts',
  'public',
  'scripts',
  'src',
  'tests',
  'tsconfig.json',
  'vitest.config.ts',
  'wrangler.jsonc',
]);
const allowedGithubFiles = new Set([
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/ISSUE_TEMPLATE/problem-report.yml',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/workflows/web-quality.yml',
  '.github/workflows/cuda-compile.yml',
  '.github/workflows/release-smoke.yml',
]);

const { stdout } = await execFileAsync('git', ['ls-files', '-z'], { cwd: projectRoot, encoding: 'utf8' });
const trackedFiles = stdout.split('\0').filter(Boolean).sort();
const violations = [];

for (const relativePath of trackedFiles) {
  const rootEntry = relativePath.split('/')[0];
  if (!allowedRootEntries.has(rootEntry)) violations.push({ path: relativePath, rule: 'path is outside the public source allowlist' });
  if (rootEntry === '.github' && !allowedGithubFiles.has(relativePath)) {
    violations.push({ path: relativePath, rule: 'path is outside the recursive .github allowlist' });
  }
}

const sourceScan = await scanFiles(projectRoot, trackedFiles.map((relativePath) => path.join(projectRoot, relativePath)));
violations.push(...sourceScan.violations);

if (violations.length > 0) {
  for (const violation of violations) console.error(`- ${violation.path}: ${violation.rule}`);
  process.exitCode = 1;
} else {
  console.log(`Source policy passed for ${trackedFiles.length} tracked files.`);
}
