// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';

import { reviewLockfile } from './lib/quality-policy.mjs';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const lockfile = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
const review = reviewLockfile(lockfile, manifest);

if (review.errors.length > 0) {
  for (const error of review.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(review.summary, null, 2));
}
