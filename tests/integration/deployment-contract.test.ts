// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');

describe('Cloudflare assets-only deployment contract', () => {
  it('pins Wrangler and declares only static assets for workers.dev production and previews', async () => {
    const [manifest, rawConfig, astroConfig] = await Promise.all([
      readFile(path.join(projectRoot, 'package.json'), 'utf8').then(JSON.parse),
      readFile(path.join(projectRoot, 'wrangler.jsonc'), 'utf8'),
      readFile(path.join(projectRoot, 'astro.config.mjs'), 'utf8'),
    ]);
    const config = JSON.parse(rawConfig.replace(/^\s*\/\/.*$/gm, ''));

    expect(manifest.devDependencies.wrangler).toBe('4.125.0');
    expect(manifest.scripts['quality:deployment']).toBe(
      'wrangler deploy --dry-run --outdir .quality/wrangler-dry-run',
    );
    expect(manifest.scripts.deploy).toBe('node scripts/check-release-source.mjs --require-main && wrangler deploy');
    expect(manifest.scripts['deploy:preview']).toBe('node scripts/check-release-source.mjs && wrangler versions upload');
    expect(config).toEqual({
      $schema: './node_modules/wrangler/config-schema.json',
      name: 'cuda-learning-site',
      compatibility_date: '2026-08-24',
      workers_dev: true,
      preview_urls: true,
      assets: {
        directory: './dist',
        html_handling: 'auto-trailing-slash',
      },
    });
    expect(astroConfig).toContain("output: 'static'");
    expect(astroConfig).not.toMatch(/adapter|output:\s*['"]server['"]/);
  });

  it('rejects dirty, stale, or non-main production release inputs before upload', async () => {
    const guard = await readFile(path.join(projectRoot, 'scripts/check-release-source.mjs'), 'utf8');

    expect(guard).toContain("['status', '--porcelain=v1', '--untracked-files=all']");
    expect(guard).toContain("['rev-parse', 'HEAD']");
    expect(guard).toContain("['branch', '--show-current']");
    expect(guard).toContain("'src/current-publication-manifest.json'");
    expect(guard).toContain("'dist/publication.json'");
    expect(guard).toContain('releaseSourceCommit !== head');
    expect(guard).toContain('publicationSourceCommit !== head');
    expect(guard).toContain('JSON.stringify(embeddedReleaseManifest) !== JSON.stringify(sourceManifest)');
    expect(guard).toContain(
      'JSON.stringify(embeddedPublicationManifest) !== JSON.stringify(currentSourceManifest)',
    );
    expect(guard).toContain("requireMain && branch !== 'main'");
    expect(guard).toContain('Release upload requires a clean tracked and untracked source tree.');
  });

  it('emits both source identities and complete project and bundled-interface notices without a Worker application', async () => {
    const [release, publication, sourceManifest, currentSourceManifest] = await Promise.all([
      readFile(path.join(projectRoot, 'dist/release.json'), 'utf8').then(JSON.parse),
      readFile(path.join(projectRoot, 'dist/publication.json'), 'utf8').then(JSON.parse),
      readFile(path.join(projectRoot, 'src/r1-release-manifest.json'), 'utf8').then(JSON.parse),
      readFile(path.join(projectRoot, 'src/current-publication-manifest.json'), 'utf8').then(JSON.parse),
    ]);
    const builtFiles = (await readdir(path.join(projectRoot, 'dist'), { recursive: true })).map((file) =>
      file.split(path.sep).join('/'),
    );
    const legalFiles = new Map(
      await Promise.all(
        [
          'Apache-2.0.txt',
          'CC-BY-4.0.txt',
          'PROJECT-NOTICE.txt',
          'CONTENT_LICENSES.md',
          'THIRD_PARTY_NOTICES.md',
          'astro-7.2.4-MIT.txt',
          'starlight-0.41.7-MIT.txt',
          'pagefind-1.5.2-MIT.txt',
          'pagefind-vscode-ripgrep-MIT.txt',
        ].map(async (file) => [file, await readFile(path.join(projectRoot, 'dist/legal', file), 'utf8')] as const),
      ),
    );

    expect(release).toEqual({ ...sourceManifest, sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/) });
    expect(publication).toEqual({
      ...currentSourceManifest,
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    expect(publication.sourceCommit).toBe(release.sourceCommit);
    expect(release.releaseId).toBe('R1');
    expect(publication).toMatchObject({
      publicationId: 'current',
      releaseReview: { latestCompleted: 'R1', next: 'R2', status: 'pending' },
      scope: { publicationPairs: 186, sourceRoutes: 372 },
    });
    expect(builtFiles).toEqual(expect.arrayContaining(['release.json', 'publication.json']));
    expect(builtFiles).not.toContain('_worker.js');
    expect(builtFiles.some((file) => /(?:^|\/)server(?:\/|$)/.test(file))).toBe(false);
    expect(legalFiles.get('Apache-2.0.txt')).toContain('Apache License');
    expect(legalFiles.get('CC-BY-4.0.txt')).toContain('Attribution 4.0 International');
    expect(legalFiles.get('THIRD_PARTY_NOTICES.md')).toContain('`wrangler` | 4.125.0');
    expect(legalFiles.get('astro-7.2.4-MIT.txt')).toContain('Copyright (c) 2021 Fred K. Schott');
    expect(legalFiles.get('starlight-0.41.7-MIT.txt')).toContain('Copyright (c) 2023');
    expect(legalFiles.get('pagefind-1.5.2-MIT.txt')).toContain('Copyright (c) Pagefind');
    expect(legalFiles.get('pagefind-vscode-ripgrep-MIT.txt')).toContain('Copyright (c) Microsoft Corporation');
  });

  it('publishes the selected Wrangler authority plus reviewed Workers Builds, preview, smoke, and rollback boundaries', async () => {
    const [deployment, readme, maintenanceSources, chineseSources, englishSources] = await Promise.all([
      readFile(path.join(projectRoot, 'DEPLOYMENT.md'), 'utf8'),
      readFile(path.join(projectRoot, 'README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/sources-and-versions.mdx'), 'utf8'),
    ]);

    expect(deployment).toContain('Cloudflare Workers Builds');
    expect(deployment).toContain('only deployment authority');
    expect(deployment).toContain('Workers Builds: reviewed, disabled for R1');
    expect(deployment).toContain('Source branch: clean, protected `main`');
    expect(deployment).toContain('Build command: `npm run build:release`');
    expect(deployment).toContain('Production deploy command: `npm run deploy`');
    expect(deployment).toContain('Preview deploy command: `npm run deploy:preview`');
    expect(deployment).toContain('reject tracked or untracked source changes');
    expect(deployment).toMatch(/production additionally requires the checked-out branch to be `main`/i);
    expect(deployment).toContain('dist/publication.json');
    expect(deployment).toContain('49 Learning Units');
    expect(deployment).toContain('sixteen Runnable Examples EX01-EX16');
    expect(deployment).toContain('sixteen Visual Explainers');
    expect(deployment).toContain('50 Practice Bank entries, 151 Glossary terms, and 61 source records');
    expect(deployment).toContain('five catalog groups total 284 records');
    expect(deployment).toContain('186 Publication Pairs and 372 source routes');
    expect(deployment).toContain('LAB12 remains absent until Q13 and L06 are published');
    expect(deployment).toContain('EX10 is Runtime-Not-Applicable');
    expect(deployment).toMatch(/EX10.*Runtime-Not-Applicable/i);
    expect(deployment).toMatch(/EX11-EX15.*empty compilation evidence/i);
    expect(deployment).toMatch(/No Reference Environment.*performance observation/i);
    expect(deployment).toMatch(/R2 aggregate review.*pending/i);
    expect(deployment).toMatch(/issue #24/i);
    expect(deployment).toContain('npm run test:release-smoke');
    expect(deployment).toContain('wrangler rollback');
    expect(deployment).toContain('No Worker application code or runtime binding');
    expect(readme).toContain('Repository-pinned Wrangler deploys static output from a clean `main` checkout');
    expect(readme).toContain('Workers Builds behavior is reviewed but its account automation remains disabled');

    for (const sourceRecord of [maintenanceSources, chineseSources, englishSources]) {
      expect(sourceRecord).toContain('4.125.0');
      expect(sourceRecord).toMatch(/Workers Builds/);
      expect(sourceRecord).toMatch(/Static Assets/);
      expect(sourceRecord).toMatch(/Preview URL|预览 URL/);
      expect(sourceRecord).toContain('workers.dev');
    }
  });

  it('accepts only the production origin, a Cloudflare Preview URL, or loopback in explicit local mode', async () => {
    const listTests = (environment: Record<string, string>) =>
      execFileAsync('npm', ['exec', 'playwright', '--', 'test', '--config=playwright.release.config.ts', '--list'], {
        cwd: projectRoot,
        env: {
          ...process.env,
          RELEASE_SOURCE_COMMIT: '0000000000000000000000000000000000000000',
          ...environment,
        },
      });

    await expect(
      listTests({ RELEASE_BASE_URL: 'https://preview.example.com', RELEASE_KIND: 'preview' }),
    ).rejects.toMatchObject({ stderr: expect.stringContaining('Cloudflare Preview URL') });
    await expect(
      listTests({
        RELEASE_BASE_URL: 'https://r1-cuda-learning-site.hmzhangxiang.workers.dev',
        RELEASE_KIND: 'preview',
      }),
    ).resolves.toMatchObject({ stdout: expect.stringContaining('Total: 5 tests') });
    await expect(
      listTests({ RELEASE_BASE_URL: 'http://127.0.0.1:4321', RELEASE_KIND: 'local' }),
    ).resolves.toMatchObject({ stdout: expect.stringContaining('Total: 5 tests') });
  }, 20_000);
});
