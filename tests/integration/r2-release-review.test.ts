// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const learningUnits = [
  'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19',
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09',
  'Q01', 'Q02', 'Q03', 'Q04', 'Q05',
] as const;
const runnableExamples = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX10',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
] as const;
const labs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB07'] as const;
const visualExplainers = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
  'VIS09', 'VIS10', 'VIS11', 'VIS12', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
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

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

describe('R2 immutable release history', () => {
  it('preserves the exact R2 snapshot after R3 becomes the active release', async () => {
    const r2Source = await readFile(path.join(projectRoot, 'src/r2-release-manifest.json'), 'utf8');
    const [r1Manifest, r2Manifest, r3Manifest] = await Promise.all([
      readJson('src/r1-release-manifest.json'),
      readJson('src/r2-release-manifest.json'),
      readJson('src/r3-release-manifest.json'),
    ]);

    expect(createHash('sha256').update(r2Source).digest('hex')).toBe(
      'b58ad7072d04b1cb9b7cf613803f9aacb1e079b8cbfb7df75b0de8c64303620e',
    );
    expect(r1Manifest).toMatchObject({ releaseId: 'R1', reviewDate: '2026-08-29' });
    expect(r2Manifest).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 3,
      releaseId: 'R2',
      reviewDate: '2026-08-31',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
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
    expect(r2Manifest.compatibility).toMatchObject({
      supportedEnvironment: 'native-linux',
      componentBoundaries: {
        cccl: {
          version: '3.4.2',
          toolkitLanes: ['cuda-12.9', 'cuda-13.3'],
          excludedToolkitLanes: ['cuda-11.8'],
        },
      },
    });
    expect(r2Manifest.knownLimitations).toEqual(expect.arrayContaining([
      'No Reference Environment or Runtime-Verified R2 subject is declared.',
      'R2 records no sanitizer, profiler, numerical-output, timing, overlap, migration, contention, performance, or speedup observation.',
      'R3 and later curriculum material is outside this release.',
    ]));
    expect(r3Manifest.scope.learningUnits).toEqual(expect.arrayContaining([...r2Manifest.scope.learningUnits]));
    expect(r3Manifest.scope.runnableExamples).toEqual(r2Manifest.scope.runnableExamples);
    expect(r3Manifest.scope.labs).toEqual(expect.arrayContaining([...r2Manifest.scope.labs]));
    expect(r3Manifest.scope.visualExplainers).toEqual(expect.arrayContaining([...r2Manifest.scope.visualExplainers]));
  });
});
