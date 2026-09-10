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
  'A10', 'A11', 'A12', 'A13', 'A14',
  'Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13',
] as const;
const r3EvidenceNeutralLearningUnits = [
  'Q06', 'Q07', 'Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13',
  'A10', 'A11', 'A12', 'A13', 'A14',
] as const;
const runnableExamples = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX10',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
] as const;
const labs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08', 'LAB09', 'LAB10'] as const;
const visualExplainers = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
  'VIS09', 'VIS10', 'VIS11', 'VIS12', 'VIS13', 'VIS14', 'VIS18', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;
const noCompileCheckedClaim = [
  'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
  'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08', 'LAB09', 'LAB10',
] as const;
const pendingHardwareVerification = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16', ...labs,
] as const;
const nsightReportAnalysisPracticeIds = [
  'PB-R3-002', 'PB-R3-003', 'PB-R3-004', 'PB-R3-005', 'PB-R3-007',
  'PB-R3-008', 'PB-R3-009', 'PB-R3-010', 'PB-R3-011', 'PB-R3-012',
] as const;

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

describe('R3 immutable release history', () => {
  it('preserves the exact R3 snapshot after R4 becomes the active release', async () => {
    const source = await readFile(path.join(projectRoot, 'src/r3-release-manifest.json'), 'utf8');
    const [r1, r2, r3, r4] = await Promise.all([
      readJson('src/r1-release-manifest.json'), readJson('src/r2-release-manifest.json'),
      readJson('src/r3-release-manifest.json'), readJson('src/r4-release-manifest.json'),
    ]);
    expect(createHash('sha256').update(source).digest('hex')).toBe('9ec90ad5af973ebcb37b1439e7ebbe63f97738f7d38effed58f767ed5eee7dba');
    expect(r1).toMatchObject({ releaseId: 'R1', reviewDate: '2026-08-29' });
    expect(r2).toMatchObject({ releaseId: 'R2', reviewDate: '2026-08-31' });
    expect(r3).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0', schemaVersion: 4, releaseId: 'R3', reviewDate: '2026-09-04',
      artifactType: 'static-assets', canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
    });
    expect(r3.scope).toEqual({
      publicationPairs: 232, sourceRoutes: 464, exerciseSetPublicationPairs: 61, solutionSetPublicationPairs: 61,
      learningUnits, runnableExamples, labs, visualExplainers, practiceBankEntries: 66,
      nsightReportAnalysisPracticeEntries: nsightReportAnalysisPracticeIds, glossaryTerms: 176, sourceRecords: 76,
    });
    expect(r3.compatibility).toMatchObject({
      supportedEnvironment: 'native-linux',
      profilerComponents: {
        nsightSystems: {
          currentDocumentationVersion: '2026.4', currentReleaseVersion: '2026.4.1',
          toolkitLaneVersions: { 'cuda-11.8': '2022.4.2.1', 'cuda-12.9': '2025.1.3.140', 'cuda-13.3': '2026.1.3.425' },
          reportFormat: '.nsys-rep',
        },
        nsightCompute: {
          currentVersion: '2026.2.1',
          toolkitLaneVersions: { 'cuda-11.8': '2022.3.0.22', 'cuda-12.9': '2025.2.1.3', 'cuda-13.3': '2026.2.1.5' },
          reportFormat: '.ncu-rep',
        },
        cupti: {
          currentVersion: '2026.2.1',
          toolkitLaneVersions: { 'cuda-11.8': '11.8.87', 'cuda-12.9': '12.9.79', 'cuda-13.3': '13.3.75' },
        },
        permissionPolicy: {
          performanceCounters: 'administrator-approved-non-admin-access', privilegeEscalationAllowed: false,
          deniedOrUnavailableMetrics: 'block-and-record',
        },
      },
    });
    expect(r3.evidence).toEqual({
      compileChecked: ['EX02', 'EX10', 'LAB02'], noCompileCheckedClaim, pendingHardwareVerification,
      runtimeNotApplicable: ['EX10'], communityObserved: [], runtimeVerified: [], referenceEnvironments: [], performanceObservations: [],
      r3EvidenceNeutralLearningUnits, evidenceNeutralVisualExplainers: visualExplainers,
      expectedOnlyProfilerReportPlans: [
        '/assets/profiler-report-fixtures/lab06-nsight-systems.expected.json',
        '/assets/profiler-report-fixtures/lab08-nsight-compute.expected.json',
        '/assets/profiler-report-fixtures/lab10-nsight-compute.expected.json',
        '/assets/profiler-report-fixtures/q12-nsight-compute.expected.json',
        '/assets/profiler-report-fixtures/q13-nsight-compute.expected.json',
      ],
      capturedProfilerReports: [], retainedCompileRuns: [32720214527, 33275734951],
    });
    expect(r3.knownLimitations).toEqual(expect.arrayContaining([
      'No Reference Environment, Community-Observed subject, or Runtime-Verified R3 subject is declared.',
      'Q06-Q13 and A10-A14 are Learning Units with all four evidence arrays empty and grant no Evidence Status.',
      'The five profiler report fixtures are expected-only plans with unfilled Environment Manifests and empty recorded observations; they are not captured reports.',
      "L03 and LAB11, L06 and LAB12, and L13 and EX20 have no R3 public destination. LAB11 waits for L03, LAB12 waits for L06, and EX20 waits for L13's exact cuSPARSE API contract.",
      'L01-L13 production-library Learning Units and all R4 or later curriculum material are outside this release.',
    ]));
    for (const key of ['learningUnits', 'runnableExamples', 'labs', 'visualExplainers']) {
      expect(r4.scope[key]).toEqual(expect.arrayContaining(r3.scope[key]));
    }
  });
});
