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
    expect(guard).toContain("'src/r3-release-manifest.json'");
    expect(guard).toContain("'src/current-publication-manifest.json'");
    expect(guard).toContain("'dist/publication.json'");
    expect(guard).toContain("scanDirectory(path.join(projectRoot, 'dist'))");
    expect(guard).toContain('Built release output failed artifact policy');
    expect(guard).toContain('artifactScan.filesScanned');
    expect(guard.indexOf('artifactScan.violations.length')).toBeLessThan(
      guard.indexOf("const sourceManifest = parseManifest(sourceManifestText"),
    );
    expect(guard).toContain("new Set(artifactScan.violations.map(({ rule }) => rule))");
    expect(guard).toContain('Built ${label} is not valid JSON.');
    expect(guard).toContain("console.error(error instanceof ReleaseSourceError ? error.message : 'Release source check failed before upload.')");
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
      readFile(path.join(projectRoot, 'src/r3-release-manifest.json'), 'utf8').then(JSON.parse),
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
    expect(release).toMatchObject({
      releaseId: 'R3',
      scope: {
        publicationPairs: 232,
        sourceRoutes: 464,
        exerciseSetPublicationPairs: 61,
        solutionSetPublicationPairs: 61,
        practiceBankEntries: 66,
        nsightReportAnalysisPracticeEntries: expect.arrayContaining(['PB-R3-002', 'PB-R3-012']),
        glossaryTerms: 176,
        sourceRecords: 76,
      },
    });
    expect(release.scope.learningUnits).toHaveLength(62);
    expect(release.scope.labs).toHaveLength(10);
    expect(release.scope.visualExplainers).toHaveLength(19);
    expect(
      release.scope.labs.length +
      release.scope.practiceBankEntries +
      release.scope.visualExplainers.length +
      release.scope.glossaryTerms +
      release.scope.sourceRecords,
    ).toBe(347);
    expect(publication).toMatchObject({
      publicationId: 'current',
      reviewDate: '2026-09-05',
      releaseReview: { latestCompleted: 'R3', next: 'R4', status: 'pending' },
      scope: {
        publicationPairs: 246,
        sourceRoutes: 492,
        exerciseSetPublicationPairs: 65,
        solutionSetPublicationPairs: 65,
        practiceBankEntries: 70,
        glossaryTerms: 184,
        sourceRecords: 80,
      },
      compatibility: {
        componentBoundaries: {
          cccl: {
            version: '3.4.2',
            selection: 'independent',
            commit: 'd36012203ef73ac7f966e848dd88482273e91e02',
            toolkitLanes: ['cuda-12.9', 'cuda-13.3'],
            excludedToolkitLanes: ['cuda-11.8'],
          },
          cub: {
            bundled: [
              {
                toolkitLane: 'cuda-11.8',
                version: '1.15.1',
                versionMacro: 101501,
                package: 'cuda-cccl-11-8=11.8.89-1',
              },
              {
                toolkitLane: 'cuda-12.9',
                version: '2.8.2',
                versionMacro: 200802,
                package: 'cuda-cccl-12-9=12.9.27-1',
              },
              {
                toolkitLane: 'cuda-13.3',
                version: '3.3.4',
                versionMacro: 300304,
                package: 'cccl-13-3=13.3.3.4.1-1',
              },
            ],
            selected: {
              version: '3.4.2',
              versionMacro: 300402,
              commit: 'd36012203ef73ac7f966e848dd88482273e91e02',
              toolkitLanes: ['cuda-12.9', 'cuda-13.3'],
            },
          },
        },
      },
      evidence: {
        noCompileCheckedClaim: expect.arrayContaining(['EX17', 'LAB06', 'LAB08', 'LAB09', 'LAB10', 'LAB11']),
        pendingHardwareVerification: expect.arrayContaining(['EX17', 'LAB06', 'LAB08', 'LAB09', 'LAB10', 'LAB11']),
        communityObserved: [],
        runtimeVerified: [],
        referenceEnvironments: [],
        performanceObservations: [],
        expectedOnlyProfilerReportPlans: expect.arrayContaining([
          '/assets/profiler-report-fixtures/lab06-nsight-systems.expected.json',
          '/assets/profiler-report-fixtures/lab11-nsight-compute.expected.json',
          '/assets/profiler-report-fixtures/q13-nsight-compute.expected.json',
        ]),
        capturedProfilerReports: [],
        r4EvidenceNeutralLearningUnits: ['L01', 'L02', 'L03', 'L04'],
      },
    });
    expect(publication.evidence.noCompileCheckedClaim).not.toContain('Q11');
    expect(publication.evidence.pendingHardwareVerification).not.toContain('Q11');
    expect(publication.evidence.noCompileCheckedClaim).not.toContain('Q12');
    expect(publication.evidence.pendingHardwareVerification).not.toContain('Q12');
    expect(publication.evidence.noCompileCheckedClaim).not.toContain('Q13');
    expect(publication.evidence.pendingHardwareVerification).not.toContain('Q13');
    expect(publication.evidence.noCompileCheckedClaim).toContain('LAB10');
    expect(publication.evidence.pendingHardwareVerification).toContain('LAB10');
    expect(publication.evidence.noCompileCheckedClaim).toContain('EX17');
    expect(publication.evidence.pendingHardwareVerification).toContain('EX17');
    expect(publication.evidence.noCompileCheckedClaim).toContain('LAB11');
    expect(publication.evidence.pendingHardwareVerification).toContain('LAB11');
    expect(publication.evidence.expectedOnlyProfilerReportPlans).toHaveLength(6);
    expect(publication.scope.learningUnits).toHaveLength(66);
    expect(publication.scope.learningUnits).toEqual(expect.arrayContaining(['A10', 'A11', 'A12', 'A13', 'A14', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'L01', 'L02', 'L03', 'L04']));
    expect(publication.scope.runnableExamples).toHaveLength(17);
    expect(publication.scope.runnableExamples).toContain('EX17');
    expect(publication.scope.labs).toHaveLength(11);
    expect(publication.scope.labs).toEqual(expect.arrayContaining(['LAB06', 'LAB08', 'LAB09', 'LAB10', 'LAB11']));
    expect(publication.scope.visualExplainers).toHaveLength(19);
    expect(publication.scope.visualExplainers).toEqual(expect.arrayContaining(['VIS13', 'VIS14', 'VIS18']));
    expect(
      publication.scope.labs.length +
      publication.scope.practiceBankEntries +
      publication.scope.visualExplainers.length +
      publication.scope.glossaryTerms +
      publication.scope.sourceRecords,
    ).toBe(364);
    expect(publication.knownLimitations).toEqual(expect.arrayContaining([
      'No Reference Environment, Community-Observed subject, or Runtime-Verified R3 subject is declared.',
      'Q06-Q13 and A10-A14 are Learning Units with all four evidence arrays empty and grant no Evidence Status.',
      'L01-L04 are R4 Learning Units with all four evidence arrays empty and grant no Evidence Status; API presence, owner tests, static decisions, and primitive contracts provide no local compilation, runtime, synchronization, or performance evidence.',
      'The six profiler report fixtures are expected-only plans with unfilled Environment Manifests and empty recorded observations; they are not captured reports.',
      'Q12 summarizes linked EX11 and now leads to LAB11; EX11, EX17, and LAB11 retain empty compilation and recorded observations and remain Pending Hardware Verification, while their build gates, VIS10, canonical imports, and expected-only plans add no runtime or performance evidence.',
      "L03 and LAB11, L06 and LAB12, and L13 and EX20 have no R3 public destination. LAB11 waits for L03, LAB12 waits for L06, and EX20 waits for L13's exact cuSPARSE API contract.",
      'EX17 and LAB11 have five declared bundled-or-selected CUB build profiles, but no retained compilation record, queried temporary-storage value, GPU output, timing, traffic, kernel mapping, maintenance result, speedup, or winner.',
      'L01-L04 are published in the rolling R4 surface; L05-L13 and the R4 aggregate review remain pending and outside the latest completed R3 release.',
    ]));
    expect(publication.knownLimitations).not.toContain(
      'Q11 and LAB10 have no current public destination; LAB10 remains unpublished until Q11 supplies its evidence-based optimization prerequisite.',
    );
    expect(publication.knownLimitations).not.toContain('LAB06 has no current public destination.');
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
    expect(deployment).toContain('Workers Builds: reviewed, disabled for R3');
    expect(deployment).toContain('Source branch: clean, protected `main`');
    expect(deployment).toContain('Build command: `npm run build:release`');
    expect(deployment).toContain('Production deploy command: `npm run deploy`');
    expect(deployment).toContain('Preview deploy command: `npm run deploy:preview`');
    expect(deployment).toContain('reject tracked or untracked source changes');
    expect(deployment).toMatch(/production additionally requires the checked-out branch to be `main`/i);
    expect(deployment).toContain('dist/publication.json');
    expect(deployment).toContain('62 Learning Units');
    expect(deployment).toContain('66 Learning Units');
    expect(deployment).toContain('sixteen Runnable Examples EX01-EX16');
    expect(deployment).toContain('ten Labs LAB01-LAB10');
    expect(deployment).toContain('17 Runnable Examples');
    expect(deployment).toContain('11 Labs');
    expect(deployment).toContain('nineteen Visual Explainers');
    expect(deployment).toContain('70 Practice Bank entries, 184 Glossary terms, 80 source records');
    expect(deployment).toContain('364 catalog records');
    expect(deployment).toContain('246 Publication Pairs, and 492 source routes');
    expect(deployment).toContain('65 Exercise-set and 65 solution-set Publication Pairs');
    expect(deployment).toContain('10 Nsight report-analysis Practice Bank entries');
    expect(deployment).toContain('Q01-Q13');
    expect(deployment).toContain('LAB09-LAB11 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification.');
    expect(deployment).toContain('Q06-Q13, A10-A14, and current L01-L04');
    expect(deployment).toContain('It grants no Evidence Status and summarizes the linked EX14/LAB10 subjects, whose compilation and recorded-observation arrays are empty and whose runtime remains Pending Hardware Verification.');
    expect(deployment).toContain('VIS13');
    expect(deployment).toMatch(/LAB12 still waits for L06/i);
    expect(deployment).toContain('EX10 is Runtime-Not-Applicable');
    expect(deployment).toMatch(/EX10.*Runtime-Not-Applicable/i);
    expect(deployment).toMatch(/EX11-EX17.*empty compilation evidence/i);
    expect(deployment).toMatch(/bundled\/selected component matrix/i);
    expect(deployment).toMatch(/No Reference Environment.*performance observation/i);
    expect(deployment).toMatch(/R3.*latest completed aggregate review/i);
    expect(deployment).toMatch(/R4 aggregate review remains pending/i);
    expect(deployment).toMatch(/issue #32/i);
    expect(deployment).toMatch(/issue #26/i);
    expect(deployment).toMatch(/issue #27/i);
    expect(deployment).toMatch(/issue #28/i);
    expect(deployment).toMatch(/issue #29/i);
    expect(deployment).toMatch(/issue #30/i);
    expect(deployment).toMatch(/issue #31/i);
    expect(deployment).toMatch(/issue #33/i);
    expect(deployment).toMatch(/issue #34/i);
    expect(deployment).toMatch(/administrator-approved non-admin performance-counter access/i);
    expect(deployment).toMatch(/denied or unavailable metric/i);
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
