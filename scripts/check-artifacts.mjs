// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';

import { scanDirectory } from './lib/quality-policy.mjs';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node scripts/check-artifacts.mjs <directory> [...]');
  process.exit(2);
}

let failed = false;
for (const target of targets) {
  const root = path.resolve(target);
  const result = await scanDirectory(root);
  console.log(`${target}: scanned ${result.filesScanned} files`);
  for (const violation of result.violations) {
    failed = true;
    console.error(`- ${target}/${violation.path}: ${violation.rule}`);
  }
}

if (failed) process.exitCode = 1;
