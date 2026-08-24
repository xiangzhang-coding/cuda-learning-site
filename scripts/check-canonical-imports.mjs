// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { walkFiles } from './lib/quality-policy.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const contentFiles = (await walkFiles(docsRoot)).filter((file) => /\.(?:md|mdx)$/.test(file));
const declarations = [];

for (const file of contentFiles) {
  const content = await readFile(file, 'utf8');
  const match = /^canonicalExample:\s*['"]?([^'"\n]+)['"]?$/m.exec(content);
  if (match) declarations.push({ file, example: match[1].trim() });
}

if (declarations.length > 0) {
  throw new Error(
    'Runnable Example publication is blocked until its owning Ticket extends this validator to verify paired range declarations, build inputs, displayed imports, downloads, and copied-code absence.',
  );
}

console.log('Canonical import check: no published page declares a Runnable Example; not applicable to the current Orientation routes.');
