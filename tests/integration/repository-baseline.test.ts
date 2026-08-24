// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readProjectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

describe('public repository baseline', () => {
  it('tracks an npm v3 lockfile for the exact dependency contract', async () => {
    const manifest = JSON.parse(await readProjectFile('package.json')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const lockfile = JSON.parse(await readProjectFile('package-lock.json')) as {
      lockfileVersion: number;
      packages: Record<string, { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; version?: string }>;
    };
    const { stdout } = await execFileAsync('git', ['ls-files', '--error-unmatch', 'package-lock.json'], {
      cwd: projectRoot,
    });

    expect(stdout.trim()).toBe('package-lock.json');
    expect(lockfile.lockfileVersion).toBe(3);
    expect(lockfile.packages[''].dependencies).toEqual(manifest.dependencies);
    expect(lockfile.packages[''].devDependencies).toEqual(manifest.devDependencies);
    expect(lockfile.packages['node_modules/@pagefind/default-ui'].version).toBe('1.5.2');
    expect(manifest.devDependencies['@axe-core/playwright']).toBe('4.13.0');
    expect(manifest.devDependencies['@vitest/coverage-v8']).toBe('4.1.11');
  });

  it('publishes complete dual-license and contribution contracts', async () => {
    const [apache, contentLicense, contributing, security] = await Promise.all([
      readProjectFile('LICENSE'),
      readProjectFile('LICENSE-CONTENT'),
      readProjectFile('CONTRIBUTING.md'),
      readProjectFile('SECURITY.md'),
    ]);

    expect(createHash('sha256').update(apache).digest('hex')).toBe(
      'cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30',
    );
    expect(createHash('sha256').update(contentLicense).digest('hex')).toBe(
      '9ba9550ad48438d0836ddab3da480b3b69ffa0aac7b7878b5a0039e7ab429411',
    );
    for (const heading of [
      'Publication Pairs',
      'Canonical Runnable Examples',
      'Evidence and environment claims',
      'Accessibility',
      'Sources, licenses, and attribution',
      'Public and private boundary',
    ]) {
      expect(contributing).toContain(`## ${heading}`);
    }
    expect(security).toContain('GitHub Security Advisories');
  });
});
