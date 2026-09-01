// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const learningUnits = [
  'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'M09', 'M10', 'M11', 'M12', 'M13', 'M14',
  'M15', 'M16', 'M17', 'M18', 'M19',
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09',
  'Q01', 'Q02', 'Q03', 'Q04', 'Q05',
] as const;
const currentLearningUnits = [
  ...learningUnits.slice(0, 44),
  'A14',
  ...learningUnits.slice(44),
  'Q06', 'Q07', 'Q08', 'Q09', 'Q10',
] as const;
const runnableExamples = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX10',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
] as const;
const labs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB07'] as const;
const currentLabs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08', 'LAB09'] as const;
const visualExplainers = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
  'VIS09', 'VIS10', 'VIS11', 'VIS12', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;
const currentVisualExplainers = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
  'VIS09', 'VIS10', 'VIS11', 'VIS12', 'VIS13', 'VIS14', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;
const noCompileCheckedClaim = [
  'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
  'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB07',
] as const;
const pendingHardwareVerification = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
  ...labs,
] as const;
const currentNoCompileCheckedClaim = [
  'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
  'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08', 'LAB09',
] as const;
const currentPendingHardwareVerification = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
  ...currentLabs,
] as const;

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

function destinationIds(pattern: RegExp) {
  return Object.keys(PUBLISHED_DESTINATIONS).filter((id) => pattern.test(id));
}

function expectExactMembers(actual: readonly string[], expected: readonly string[]) {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining([...expected]));
}

describe('R2 release review', () => {
  it('publishes an exact aggregate R2 contract while preserving R1 as history', async () => {
    const [r1Manifest, r2Manifest, release] = await Promise.all([
      readJson('src/r1-release-manifest.json'),
      readJson('src/r2-release-manifest.json'),
      readJson('dist/release.json'),
    ]);

    expect(r1Manifest).toMatchObject({ releaseId: 'R1', reviewDate: '2026-08-29' });
    expect(release).toEqual({
      ...r2Manifest,
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    expect(r2Manifest).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 3,
      releaseId: 'R2',
      reviewDate: '2026-08-31',
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
            pairedDriver: '520.61.05',
            driverFloor: '450.80.02',
            dialects: ['c++17'],
          },
          {
            id: 'cuda-12.9',
            toolkit: '12.9.2',
            host: 'Ubuntu 24.04 x86-64',
            nvcc: '12.9.86',
            pairedDriver: '575.57.08',
            driverFloor: '525.60.13',
            dialects: ['c++17', 'c++20'],
          },
          {
            id: 'cuda-13.3',
            toolkit: '13.3.1',
            host: 'Ubuntu 24.04 x86-64',
            nvcc: '13.3.73',
            pairedDriver: '610.43.02',
            driverFloor: '580',
            dialects: ['c++17', 'c++20'],
          },
        ],
        dialectProbes: [
          {
            id: 'R1-GCC13-CXX23',
            subject: 'historical-r1-exact-image',
            toolkit: '13.3.1',
            nvcc: '13.3.73',
            hostCompiler: 'GCC 13.3.0',
            dialect: 'c++23',
            result: 'unsupported',
            grantsOrdinaryDialectSupport: false,
            retainedCompileRun: 32720214527,
          },
          {
            id: 'EX10-GCC14-CXX23',
            subject: 'EX10',
            toolkit: '13.3.1',
            nvcc: '13.3.73',
            hostCompiler: 'GCC 14.2.0',
            dialect: 'c++23',
            result: 'passed',
            grantsOrdinaryDialectSupport: false,
            retainedCompileRun: 33275734951,
          },
        ],
        componentBoundaries: {
          cccl: {
            version: '3.4.2',
            toolkitLanes: ['cuda-12.9', 'cuda-13.3'],
            excludedToolkitLanes: ['cuda-11.8'],
            excludedLaneRequires: 'separately reviewed library versions',
          },
        },
      },
    });
    expect(r2Manifest.scope).toEqual({
      publicationPairs: 186,
      sourceRoutes: 372,
      learningUnits,
      runnableExamples,
      labs,
      visualExplainers,
      practiceBankEntries: 50,
      glossaryTerms: 151,
      sourceRecords: 61,
    });
    expect(r2Manifest.scope.learningUnits).toHaveLength(49);
    expect(r2Manifest.scope.labs).toHaveLength(6);
    expect(r2Manifest.scope.visualExplainers).toHaveLength(16);
    expect(
      r2Manifest.scope.labs.length +
      r2Manifest.scope.practiceBankEntries +
      r2Manifest.scope.visualExplainers.length +
      r2Manifest.scope.glossaryTerms +
      r2Manifest.scope.sourceRecords,
    ).toBe(284);
    expect(release.scope).toEqual(r2Manifest.scope);
    expect(r2Manifest.evidence).toEqual({
      compileChecked: ['EX02', 'EX10', 'LAB02'],
      noCompileCheckedClaim,
      pendingHardwareVerification,
      runtimeNotApplicable: ['EX10'],
      runtimeVerified: [],
      referenceEnvironments: [],
      performanceObservations: [],
      retainedCompileRuns: [32720214527, 33275734951],
    });
    expect(r2Manifest.knownLimitations).toEqual(expect.arrayContaining([
      'Native Linux is the only Supported Environment; the website executes no CUDA.',
      'No Reference Environment or Runtime-Verified R2 subject is declared.',
      'EX02, EX10, and LAB02 have retained Compile-Checked evidence; every other R2 CUDA compile job is a non-evidentiary build gate.',
      'EX10 is Runtime-Not-Applicable; its narrow GCC 14.2.0 C++23 probe does not grant ordinary C++23 Toolkit Lane support.',
      'EX11, EX12, EX13, EX14, and EX15 have empty compilation evidence and remain Pending Hardware Verification.',
      'R2 records no sanitizer, profiler, numerical-output, timing, overlap, migration, contention, performance, or speedup observation.',
      'CCCL 3.4.2 is reviewed only for the CUDA 12.9 and 13.3 Toolkit Lanes; CUDA 11.8 requires separately reviewed library versions.',
      'R3 and later curriculum material is outside this release.',
    ]));
  });

  it('matches the rolling publication record to the pending R3 increment without changing R2', async () => {
    const [r1Manifest, r2Manifest, currentManifest, publication, publishedRoutes] = await Promise.all([
      readJson('src/r1-release-manifest.json'),
      readJson('src/r2-release-manifest.json'),
      readJson('src/current-publication-manifest.json'),
      readJson('dist/publication.json'),
      discoverPublishedRoutes(),
    ]);

    expect(publication).toEqual({
      ...currentManifest,
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    expect(currentManifest).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      publicationId: 'current',
      reviewDate: '2026-09-01',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
      releaseReview: { latestCompleted: 'R2', next: 'R3', status: 'pending' },
    });
    expect(currentManifest.scope).toEqual({
      publicationPairs: 209,
      sourceRoutes: 418,
      learningUnits: currentLearningUnits,
      runnableExamples,
      labs: currentLabs,
      visualExplainers: currentVisualExplainers,
      practiceBankEntries: 56,
      glossaryTerms: 165,
      sourceRecords: 68,
    });
    expect(currentManifest.compatibility).toEqual(r2Manifest.compatibility);
    expect(currentManifest.evidence).toEqual({
      compileChecked: ['EX02', 'EX10', 'LAB02'],
      noCompileCheckedClaim: currentNoCompileCheckedClaim,
      pendingHardwareVerification: currentPendingHardwareVerification,
      runtimeNotApplicable: ['EX10'],
      runtimeVerified: [],
      referenceEnvironments: [],
      performanceObservations: [],
      retainedCompileRuns: [32720214527, 33275734951],
    });
    expect(currentManifest.knownLimitations).toEqual([
      'Native Linux is the only Supported Environment; the website executes no CUDA.',
      'No Reference Environment or Runtime-Verified current subject is declared.',
      'EX02, EX10, and LAB02 have retained Compile-Checked evidence; every other current CUDA compile job is a non-evidentiary build gate.',
      'EX10 is Runtime-Not-Applicable; its narrow GCC 14.2.0 C++23 probe does not grant ordinary C++23 Toolkit Lane support.',
      'EX11, EX12, EX13, EX14, and EX15 have empty compilation evidence and remain Pending Hardware Verification.',
      'The current publication records no sanitizer, profiler, numerical-output, timing, overlap, migration, contention, performance, or speedup observation.',
      'CCCL 3.4.2 is reviewed only for the CUDA 12.9 and 13.3 Toolkit Lanes; CUDA 11.8 requires separately reviewed library versions.',
      'Q11 and LAB10 have no current public destination; LAB10 remains unpublished until Q11 supplies its evidence-based optimization prerequisite.',
      'Q13, L06, and LAB12 have no current public destination; LAB12 remains unpublished until both prerequisites are published.',
      'Q06-Q10, A14, LAB06, LAB08, LAB09, VIS13, and VIS14 are incremental R3 publications; the aggregate R3 release review remains pending.',
      'R3 material beyond this incremental publication and all later curriculum material remain outside the current publication.',
    ]);
    expect(currentManifest.knownLimitations).not.toContain('LAB06 has no current public destination.');
    for (const field of ['learningUnits', 'runnableExamples', 'labs', 'visualExplainers']) {
      expect(r2Manifest.scope[field]).toEqual(expect.arrayContaining(r1Manifest.scope[field]));
      expect(currentManifest.scope[field]).toEqual(expect.arrayContaining(r2Manifest.scope[field]));
    }

    expectExactMembers(destinationIds(/^(?:O|F|M|A|Q)\d{2}$/), currentLearningUnits);
    expectExactMembers(destinationIds(/^EX\d{2}$/), runnableExamples);
    expectExactMembers(destinationIds(/^LAB\d{2}$/), currentLabs);
    expectExactMembers(destinationIds(/^VIS\d{2}$/), currentVisualExplainers);
    for (const absentId of ['Q11', 'LAB10', 'Q13', 'L06', 'LAB12']) {
      expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(absentId);
    }

    const recordsByGroup = Object.groupBy(RESOURCE_INDEX_RECORDS, ({ group }) => group);
    expect(recordsByGroup.labs).toHaveLength(9);
    expect(recordsByGroup.practice).toHaveLength(56);
    expect(recordsByGroup.visuals).toHaveLength(18);
    expect(recordsByGroup.glossary).toHaveLength(165);
    expect(recordsByGroup.sources).toHaveLength(68);
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(316);
    expect(publishedRoutes).toHaveLength(418);
    expect(new Set(publishedRoutes).size).toBe(418);
  });

  it('documents R2 as completed without pre-certifying dynamic acceptance evidence', async () => {
    const [readme, deployment, maintenance, contentLicenses] = await Promise.all([
      readFile(path.join(projectRoot, 'README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'DEPLOYMENT.md'), 'utf8'),
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8'),
    ]);

    for (const document of [readme, deployment, maintenance]) {
      expect(document).toContain('R2');
      expect(document).toContain('src/r2-release-manifest.json');
      expect(document).toContain('current-publication-manifest.json');
      expect(document).toMatch(/R2.*latest completed aggregate (?:release )?review/i);
      expect(document).toMatch(/issue #24/i);
      expect(document).toMatch(/issue #26/i);
      expect(document).toMatch(/R3 aggregate review remains pending/i);
      expect(document).not.toMatch(/R2 aggregate review.*pending|pending R2 aggregate review|R2.*separately gated/i);
      expect(document).not.toMatch(/R3.*latest completed aggregate (?:release )?review/i);
    }
    for (const document of [readme, deployment, maintenance, contentLicenses]) {
      expect(document).toMatch(/186 (?:bilingual )?Publication Pairs/i);
      expect(document).toContain('372 source routes');
      expect(document).toMatch(/209 (?:bilingual )?Publication Pairs/i);
      expect(document).toContain('418 source routes');
      expect(document).toMatch(/49 Learning Units.*6 Labs.*16 Visual Explainers.*50 Practice Bank entries.*151 Glossary terms.*61 source records.*284 catalog records/is);
      expect(document).toMatch(/55 Learning Units/i);
      expect(document).toMatch(/(?:9|nine) Labs/i);
      expect(document).toMatch(/(?:18|eighteen)(?: formal| deterministic)? Visual Explainers/i);
      expect(document).toMatch(/56 Practice Bank entries/i);
      expect(document).toMatch(/165 Glossary terms/i);
      expect(document).toMatch(/68 source(?:\/version)? records/i);
      expect(document).toMatch(/316(?:-record catalog| catalog records| records)/i);
    }
    expect(maintenance).toContain('Review date: 2026-09-01');
    expect(maintenance).toMatch(/`SRC-CUDA-050` through `SRC-CUDA-052`/);
    expect(maintenance).toMatch(/LAB09.*empty compilation.*recorded-observation/is);
    expect(maintenance).toMatch(/issue #24.*dynamic acceptance|dynamic acceptance.*issue #24/i);
    expect(maintenance).toMatch(/A14.*Q09-Q10.*LAB09.*VIS13/is);
    expect(contentLicenses).toContain('src/r2-release-manifest.json');
    expect(contentLicenses).toContain('Issue #26 is an incremental publication');
  });
});
