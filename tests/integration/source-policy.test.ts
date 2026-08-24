// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const ignoredDirectories = new Set(['.git', '.astro', 'coverage', 'dist', 'node_modules', 'playwright-report', 'test-results']);
const forbiddenPathSegments = [
  'CONTEXT.md',
  'DESIGN.md',
  'backlog',
  'reference',
  '.serena',
  'docs/adr',
  'docs/agents',
];
const forbiddenContent = [
  ['/Users', 'a0', 'Desktop', 'vibe_coding', 'inference', 'cuda'].join('/'),
  ['Private', 'Maintainer', 'Material'].join(' '),
  ['Private', 'Reference', 'Library'].join(' '),
  ['R0', 'Implementation', 'Contract'].join(' '),
];

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => !ignoredDirectories.has(entry.name))
      .map(async (entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? filesBelow(target) : [target];
      }),
  );
  return files.flat();
}

describe('source, license, and privacy policy', () => {
  it('records file-level licenses and original provenance for public content', async () => {
    const contentFiles = (await filesBelow(path.join(projectRoot, 'src/content/docs'))).filter((file) =>
      /\.(md|mdx)$/.test(file),
    );

    expect(contentFiles).toHaveLength(10);
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

  it('keeps forbidden private paths and phrases out of source and built output', async () => {
    const files = await filesBelow(projectRoot);

    for (const file of files) {
      const relativePath = path.relative(projectRoot, file);
      expect(
        forbiddenPathSegments.some((segment) => relativePath.includes(segment)),
        relativePath,
      ).toBe(false);

      if (/\.(css|html|js|json|md|mdx|mjs|ts|txt|xml)$/.test(file)) {
        const content = await readFile(file, 'utf8');
        for (const phrase of forbiddenContent) expect(content, `${relativePath}: ${phrase}`).not.toContain(phrase);
      }
    }

    const builtFiles = await filesBelow(path.join(projectRoot, 'dist'));
    for (const file of builtFiles) {
      if (/\.(css|html|js|json|txt|xml)$/.test(file)) {
        const content = await readFile(file, 'utf8');
        for (const phrase of forbiddenContent) expect(content, file).not.toContain(phrase);
      }
    }
  });
});
