// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const r1LearningUnits = [
  'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'Q01', 'Q03', 'Q04', 'Q05',
] as const;
const currentLearningUnits = [
  'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'M09', 'M10', 'M11', 'M12', 'M13', 'M14',
  'M15', 'M16', 'M17', 'M18', 'M19',
  'Q01', 'Q03', 'Q04', 'Q05',
] as const;
const r1Examples = ['EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX16'] as const;
const currentExamples = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX10', 'EX16',
] as const;
const expectedLabs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB07'] as const;
const r1Visuals = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07',
  'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;
const currentVisuals = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
  'VIS09', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;
const currentNoCompileCheckedClaim = [
  'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX16',
  'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB07',
] as const;
const currentPendingHardwareVerification = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX16',
  ...expectedLabs,
] as const;

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

function expectExactMembers(actual: readonly string[], expected: readonly string[]) {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining([...expected]));
}

function destinationIds(pattern: RegExp) {
  return Object.keys(PUBLISHED_DESTINATIONS).filter((id) => pattern.test(id));
}

describe('R1 release review and current publication boundary', () => {
  it('preserves the immutable reviewed R1 contract as exact historical release metadata', async () => {
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
      compatibility: {
        supportedEnvironment: 'native-linux',
        gpuCapabilityTiers: {
          baseline: {
            minimumComputeCapability: '7.5',
            maximumProblemMemoryBytes: 8_000_000_000,
            requiredGpuCount: 1,
            additionalFeatureRequirements: [],
          },
          modernSingleGpu: {
            minimumComputeCapability: '8.0',
            minimumDeviceMemoryBytes: 8_000_000_000,
            requiredGpuCount: 1,
            additionalFeatureRequirements: [],
          },
        },
        architectureSpecificLabsRequireAdditionalFeatures: true,
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
    expect(sourceManifest.scope).toEqual({
      publicationPairs: 109,
      sourceRoutes: 218,
      learningUnits: r1LearningUnits,
      runnableExamples: r1Examples,
      labs: expectedLabs,
      visualExplainers: r1Visuals,
      practiceBankEntries: 29,
      glossaryTerms: 95,
      sourceRecords: 39,
    });
    expect(sourceManifest.evidence).toEqual({
      compileChecked: ['EX02', 'LAB02'],
      noCompileCheckedClaim: [
        'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX16',
        'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB07',
      ],
      pendingHardwareVerification: [...r1Examples, ...expectedLabs],
      runtimeVerified: [],
      referenceEnvironments: [],
      retainedCompileRun: 32720214527,
    });
    expect(sourceManifest.knownLimitations).toEqual([
      'Native Linux is the only Supported Environment; the website executes no CUDA.',
      'No Reference Environment or Runtime-Verified R1 subject is declared.',
      'Only EX02 and LAB02 have retained Compile-Checked evidence; other CUDA jobs are build gates only.',
      'R1 records no sanitizer, profiler, timing, performance, overlap, or speedup observation.',
      'R2 and later curriculum material is outside this release.',
    ]);
  });

  it('treats R1 as a historical subset and matches the current manifest to the live publication', async () => {
    const [r1Manifest, currentManifest, publishedRoutes] = await Promise.all([
      readJson('src/r1-release-manifest.json'),
      readJson('src/current-publication-manifest.json'),
      discoverPublishedRoutes(),
    ]);

    expect(currentManifest).toEqual({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      publicationId: 'current',
      reviewDate: '2026-08-29',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
      releaseReview: { latestCompleted: 'R1', next: 'R2', status: 'pending' },
      scope: {
        publicationPairs: 148,
        sourceRoutes: 296,
        learningUnits: currentLearningUnits,
        runnableExamples: currentExamples,
        labs: expectedLabs,
        visualExplainers: currentVisuals,
        practiceBankEntries: 40,
        glossaryTerms: 125,
        sourceRecords: 50,
      },
      evidence: {
        compileChecked: ['EX02', 'EX10', 'LAB02'],
        noCompileCheckedClaim: currentNoCompileCheckedClaim,
        pendingHardwareVerification: currentPendingHardwareVerification,
        runtimeNotApplicable: ['EX10'],
        runtimeVerified: [],
        referenceEnvironments: [],
        performanceObservations: [],
        retainedCompileRuns: [32720214527, 33266515216],
      },
      knownLimitations: [
        'Native Linux is the only Supported Environment; the website executes no CUDA.',
        'No current Reference Environment or Runtime-Verified subject is declared.',
        'EX02, EX10, and LAB02 have retained Compile-Checked evidence; all other current Runnable Examples and Labs have no Compile-Checked claim.',
        'EX10 is Runtime-Not-Applicable because its acceptance contract inspects artifacts without executing the final host artifact or any GPU executable.',
        'EX10 has five ordinary Compile-Checked records from run 33266515216; its separate CUDA 13.3.1/NVCC 13.3.73/GCC 14.2.0 C++23-Dialect-Probe passed narrowly and does not declare ordinary C++23 support, runtime, or performance.',
        'No measured overlap, migration, graph performance, timing, speedup, or other performance observation is published.',
        'LAB06 has no current public destination.',
        'This incremental publication record is not a completed R2 aggregate release review.',
      ],
    });
    for (const field of ['learningUnits', 'runnableExamples', 'labs', 'visualExplainers']) {
      expect(currentManifest.scope[field]).toEqual(expect.arrayContaining(r1Manifest.scope[field]));
    }
    for (const field of ['publicationPairs', 'sourceRoutes', 'practiceBankEntries', 'glossaryTerms', 'sourceRecords']) {
      expect(r1Manifest.scope[field]).toBeLessThanOrEqual(currentManifest.scope[field]);
    }

    expectExactMembers(destinationIds(/^(?:O|F|M|Q)\d{2}$/), currentLearningUnits);
    expectExactMembers(destinationIds(/^EX\d{2}$/), currentExamples);
    expectExactMembers(destinationIds(/^LAB\d{2}$/), expectedLabs);
    expectExactMembers(destinationIds(/^VIS\d{2}$/), currentVisuals);
    expect(PUBLISHED_DESTINATIONS).not.toHaveProperty('LAB06');

    const recordsByGroup = Object.groupBy(RESOURCE_INDEX_RECORDS, ({ group }) => group);
    expect(recordsByGroup.labs?.map(({ planningId }) => planningId)).toEqual(expectedLabs);
    expect(recordsByGroup.practice).toHaveLength(currentManifest.scope.practiceBankEntries);
    expect(recordsByGroup.visuals?.map(({ planningId }) => planningId)).toEqual(currentVisuals);
    expect(recordsByGroup.glossary).toHaveLength(currentManifest.scope.glossaryTerms);
    expect(recordsByGroup.sources).toHaveLength(currentManifest.scope.sourceRecords);
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(234);

    expect(publishedRoutes).toHaveLength(currentManifest.scope.sourceRoutes);
    expect(new Set(publishedRoutes).size).toBe(currentManifest.scope.sourceRoutes);
    const chineseRoutes = publishedRoutes.filter((route) => !route.startsWith('/en/'));
    expect(chineseRoutes).toHaveLength(currentManifest.scope.publicationPairs);
    const routeSet = new Set(publishedRoutes);
    for (const route of chineseRoutes) expect(routeSet.has(route === '/' ? '/en/' : `/en${route}`), route).toBe(true);
  });

  it('documents the current publication without rewriting it as a completed R2 review', async () => {
    const [readme, deployment, maintenance, contentLicenses] = await Promise.all([
      readFile(path.join(projectRoot, 'README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'DEPLOYMENT.md'), 'utf8'),
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8'),
    ]);

    for (const document of [readme, deployment, maintenance]) {
      expect(document).toContain('R1');
      expect(document).toContain('current-publication-manifest.json');
      expect(document).toMatch(/latest completed aggregate release review/i);
      expect(document).toMatch(/issue #24/i);
      expect(document).toMatch(/R2 aggregate review.*pending|pending R2 aggregate review/i);
      expect(document).not.toMatch(/\bR2 (?:is|was) (?:now )?complete(?:d)?\b/i);
    }
    for (const document of [readme, deployment, maintenance, contentLicenses]) {
      expect(document).toMatch(/148 (?:bilingual )?Publication Pairs/i);
      expect(document).toContain('296 source routes');
    }
    expect(maintenance).toContain('Review date: 2026-08-29');
    expect(maintenance).toMatch(/issue #19/i);
    expect(maintenance).toContain('Context7');
    expect(maintenance).toContain('`/websites/nvidia_cuda` on 2026-08-29');
    expect(maintenance).toContain('exact owner');
    for (const sourceId of ['SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034', 'SRC-CUDA-035']) {
      expect(maintenance).toContain(sourceId);
    }
    expect(readme).toContain('make -C examples/ex07-streams-events-overlap host-test');
    expect(readme).toContain('make -C examples/ex08-unified-memory-migration host-test');
    expect(readme).toContain('make -C examples/ex09-graph-capture host-test');
    expect(readme).toContain('Runtime-Not-Applicable');
    expect(readme).toMatch(/EX10.*C\+\+23 probe.*(?:passed|pass)/i);
    expect(readme).toMatch(/no measured overlap, migration, or graph performance/i);
    expect(contentLicenses).toContain('VIS09');
    expect(contentLicenses).toContain('EX10');
    expect(contentLicenses).toContain('src/current-publication-manifest.json');
  });
});
