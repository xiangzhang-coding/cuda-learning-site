// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  loadCanonicalExample,
  readCanonicalRange,
  validateCanonicalExample,
} from './lib/canonical-examples.mjs';
import { walkFiles } from './lib/quality-policy.mjs';

const projectRoot = path.resolve(import.meta.dirname, '..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const contentFiles = (await walkFiles(docsRoot)).filter((file) => /\.(?:md|mdx)$/.test(file));
const declarations = [];
const errors = [];

function readFrontmatterList(content, key) {
  const match = new RegExp(`^${key}:\\s*\\n((?:  - [^\\n]+\\n?)+)`, 'm').exec(content);
  return match ? [...match[1].matchAll(/^  - ([^\n]+)$/gm)].map((entry) => entry[1].trim()) : [];
}

for (const file of contentFiles) {
  const content = await readFile(file, 'utf8');
  const match = /^canonicalExample:\s*['"]?([^'"\n]+)['"]?$/m.exec(content);
  if (!match) continue;

  const example = match[1].trim();
  const ranges = readFrontmatterList(content, 'canonicalRanges');
  const imports = [...content.matchAll(/<CanonicalCode\s+exampleId="([^"]+)"\s+range="([^"]+)"\s*\/>/g)]
    .map((entry) => ({ example: entry[1], range: entry[2] }));
  declarations.push({ file, content, example, ranges, imports });
}

for (const exampleId of new Set(declarations.map(({ example }) => example))) {
  errors.push(...(await validateCanonicalExample(projectRoot, exampleId)));
  const example = await loadCanonicalExample(projectRoot, exampleId);
  const pages = declarations.filter(({ example: declared }) => declared === exampleId);
  if (pages.length !== 2) errors.push(`${exampleId} must be published by exactly one Chinese/English pair`);

  for (const page of pages) {
    const relativePath = path.relative(docsRoot, page.file).split(path.sep).join('/');
    const counterpartPath = relativePath.startsWith('en/')
      ? relativePath.slice(3)
      : `en/${relativePath}`;
    if (!pages.some(({ file }) => path.relative(docsRoot, file).split(path.sep).join('/') === counterpartPath)) {
      errors.push(`${relativePath} has no canonical counterpart at ${counterpartPath}`);
    }
    if (page.ranges.length === 0) errors.push(`${relativePath} must declare canonicalRanges`);
    if (new Set(page.ranges).size !== page.ranges.length) errors.push(`${relativePath} duplicates a canonical range`);
    if (!page.content.includes('import CanonicalCode')) errors.push(`${relativePath} does not import CanonicalCode`);
    if (!page.content.includes(example.sourceUrl)) errors.push(`${relativePath} does not link to the canonical project tree`);
    if (/```(?:cuda|cpp|c\+\+)/i.test(page.content)) {
      errors.push(`${relativePath} contains a manually maintained CUDA/C++ code fence`);
    }

    const importedRanges = page.imports
      .filter(({ example: importedExample }) => importedExample === exampleId)
      .map(({ range }) => range);
    if (page.imports.some(({ example: importedExample }) => importedExample !== exampleId)) {
      errors.push(`${relativePath} imports a different canonical example`);
    }
    if (JSON.stringify(importedRanges) !== JSON.stringify(page.ranges)) {
      errors.push(`${relativePath} displayed ranges do not match canonicalRanges in order`);
    }
    for (const range of page.ranges) {
      try {
        await readCanonicalRange(projectRoot, exampleId, range);
      } catch (error) {
        errors.push(`${relativePath}: ${error.message}`);
      }
    }
  }

  if (pages.length === 2 && JSON.stringify(pages[0].ranges) !== JSON.stringify(pages[1].ranges)) {
    errors.push(`${exampleId} Publication Pair declares different canonical ranges`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else if (declarations.length === 0) {
  console.log('Canonical import check: no published page declares a Runnable Example.');
} else {
  console.log(`Canonical import check passed for ${declarations.length} published pages.`);
}
