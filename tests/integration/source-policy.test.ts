// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { scanDirectory, walkFiles } from '../../scripts/lib/quality-policy.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const ignoredDirectories = new Set([
  '.git',
  '.astro',
  '.quality',
  'artifacts',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

describe('source, license, and privacy policy', () => {
  it('records file-level licenses and original provenance for public content', async () => {
    const contentFiles = (await walkFiles(path.join(projectRoot, 'src/content/docs'))).filter((file: string) =>
      /\.(md|mdx)$/.test(file),
    );

    expect(contentFiles).toHaveLength(38);
    for (const file of contentFiles) {
      const content = await readFile(file, 'utf8');
      expect(content, file).toMatch(/^license: CC-BY-4\.0$/m);
      expect(content, file).toMatch(/^provenance: original$/m);
    }

    await expect(readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8')).resolves.toContain(
      'No adapted content or assets',
    );
    await expect(readFile(path.join(projectRoot, 'THIRD_PARTY_NOTICES.md'), 'utf8')).resolves.toMatch(
      /`@astrojs\/starlight` \| 0\.41\.7/,
    );
  });

  it('keeps Visual Explainers original, owner-sourced, and explicitly non-evidentiary', async () => {
    for (const relativePath of [
      'visuals/kernel-journey.mdx',
      'en/visuals/kernel-journey.mdx',
      'visuals/indexing.mdx',
      'en/visuals/indexing.mdx',
    ]) {
      const content = await readFile(path.join(projectRoot, 'src/content/docs', relativePath), 'utf8');
      expect(content, relativePath).toMatch(/^resourceKind: visual-explainer$/m);
      expect(content, relativePath).toMatch(/https:\/\/docs\.nvidia\.com\/cuda\/cuda-programming-guide\//);
      expect(content, relativePath).toContain('Compile-Checked');
      expect(content, relativePath).toContain('Community-Observed');
      expect(content, relativePath).toContain('Runtime-Verified');
      expect(content, relativePath).toMatch(/original|原创/);
      expect(content, relativePath).toMatch(/not copied|no .* (?:copied|mirrored)|没有镜像|未复制/i);
    }
  });

  it('keeps forbidden private paths and phrases out of source and built output', async () => {
    const sourceResult = await scanDirectory(projectRoot, { ignoredNames: ignoredDirectories });
    const builtResult = await scanDirectory(path.join(projectRoot, 'dist'));

    expect(sourceResult.violations).toEqual([]);
    expect(builtResult.violations).toEqual([]);
  });
});
