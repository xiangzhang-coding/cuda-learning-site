// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const expectedLearningUnits = [
  'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'Q01', 'Q03', 'Q04', 'Q05',
] as const;
const expectedExamples = ['EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX16'] as const;
const expectedLabs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB07'] as const;
const expectedVisuals = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07',
  'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

describe('R1 release review', () => {
  it('emits the reviewed source manifest with exact R1 scope and compatibility boundaries', async () => {
    const [sourceManifest, release] = await Promise.all([
      readJson('src/r1-release-manifest.json'),
      readJson('dist/release.json'),
    ]);

    expect(release).toEqual({
      ...sourceManifest,
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    expect(sourceManifest).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 2,
      releaseId: 'R1',
      reviewDate: '2026-08-29',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
      scope: {
        publicationPairs: 109,
        sourceRoutes: 218,
        learningUnits: expectedLearningUnits,
        runnableExamples: expectedExamples,
        labs: expectedLabs,
        visualExplainers: expectedVisuals,
        practiceBankEntries: 29,
        glossaryTerms: 95,
        sourceRecords: 39,
      },
      compatibility: {
        supportedEnvironment: 'native-linux',
        gpuCapabilityTiers: {
          baseline: '7.5+',
          modernSingleGpu: '8.0+',
        },
        toolkitLanes: [
          {
            id: 'cuda-11.8',
            toolkit: '11.8.0',
            host: 'Ubuntu 22.04 x86-64',
            nvcc: '11.8.89',
            driverFloor: '450.80.02',
            dialects: ['c++17'],
          },
          {
            id: 'cuda-12.9',
            toolkit: '12.9.2',
            host: 'Ubuntu 24.04 x86-64',
            nvcc: '12.9.86',
            driverFloor: '525.60.13',
            dialects: ['c++17', 'c++20'],
          },
          {
            id: 'cuda-13.3',
            toolkit: '13.3.1',
            host: 'Ubuntu 24.04 x86-64',
            nvcc: '13.3.73',
            driverFloor: '580',
            dialects: ['c++17', 'c++20'],
            cxx23Probe: 'unsupported',
          },
        ],
      },
    });
  });

  it('keeps catalog counts, evidence inventory, and post-R1 exclusions explicit', async () => {
    const manifest = await readJson('src/r1-release-manifest.json');
    const recordsByGroup = Object.groupBy(RESOURCE_INDEX_RECORDS, ({ group }) => group);

    expect(recordsByGroup.labs).toHaveLength(manifest.scope.labs.length);
    expect(recordsByGroup.practice).toHaveLength(manifest.scope.practiceBankEntries);
    expect(recordsByGroup.visuals).toHaveLength(manifest.scope.visualExplainers.length);
    expect(recordsByGroup.glossary).toHaveLength(manifest.scope.glossaryTerms);
    expect(recordsByGroup.sources).toHaveLength(manifest.scope.sourceRecords);
    expect(manifest.scope.practiceBankEntries).toBeGreaterThanOrEqual(25);
    expect(manifest.evidence).toEqual({
      compileChecked: ['EX02', 'LAB02'],
      noCompileCheckedClaim: [
        'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX16',
        'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB07',
      ],
      pendingHardwareVerification: [...expectedExamples, ...expectedLabs],
      runtimeVerified: [],
      referenceEnvironments: [],
      retainedCompileRun: 32720214527,
    });
    expect(manifest.knownLimitations).toEqual([
      'Native Linux is the only Supported Environment; the website executes no CUDA.',
      'No Reference Environment or Runtime-Verified R1 subject is declared.',
      'Only EX02 and LAB02 have retained Compile-Checked evidence; other CUDA jobs are build gates only.',
      'R1 records no sanitizer, profiler, timing, performance, overlap, or speedup observation.',
      'R2 and later curriculum material is outside this release.',
    ]);
  });

  it('records R1 release authority and the aggregate source review without claiming future scope', async () => {
    const [readme, deployment, maintenance, chineseSources, englishSources] = await Promise.all([
      readFile(path.join(projectRoot, 'README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'DEPLOYMENT.md'), 'utf8'),
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/sources-and-versions.mdx'), 'utf8'),
    ]);

    for (const document of [readme, deployment, maintenance]) {
      expect(document).toContain('R1');
      expect(document).toContain('issue #18');
      expect(document).toMatch(/R2 and later|R2 or later/);
    }
    expect(maintenance).toContain('Review date: 2026-08-29');
    expect(maintenance).toContain('109 bilingual Publication Pairs and 218 source routes');
    expect(maintenance).toContain('Context7');
    expect(maintenance).toContain('exact owner');
    for (const sources of [chineseSources, englishSources]) {
      expect(sources).toContain("factCheckDate: '2026-08-29'");
      expect(sources).toContain("content: '2026-08-29'");
      expect(sources).toContain('2026-08-29');
      expect(sources).toContain('R1');
    }
  });
});
