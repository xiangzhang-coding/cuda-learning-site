// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { validateProfilerReportFixture } from '../../scripts/lib/profiler-report-fixture-policy.mjs';
import {
  R3_NSIGHT_REPORT_ANALYSIS_PRACTICE_IDS,
  RESOURCE_INDEX_RECORDS,
} from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

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
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16',
  ...labs,
] as const;
const profilerReportPlans = [
  '/assets/profiler-report-fixtures/lab06-nsight-systems.expected.json',
  '/assets/profiler-report-fixtures/lab08-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/lab10-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/q12-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/q13-nsight-compute.expected.json',
] as const;
const nsightReportAnalysisPracticeIds = [
  'PB-R3-002', 'PB-R3-003', 'PB-R3-004', 'PB-R3-005', 'PB-R3-007',
  'PB-R3-008', 'PB-R3-009', 'PB-R3-010', 'PB-R3-011', 'PB-R3-012',
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

describe('R3 release review', () => {
  it('publishes the exact immutable R3 contract and advances the rolling boundary to R4', async () => {
    const r3Source = await readFile(path.join(projectRoot, 'src/r3-release-manifest.json'), 'utf8');
    const [r1Manifest, r2Manifest, r3Manifest, currentManifest, release, publication, publishedRoutes] = await Promise.all([
      readJson('src/r1-release-manifest.json'),
      readJson('src/r2-release-manifest.json'),
      readJson('src/r3-release-manifest.json'),
      readJson('src/current-publication-manifest.json'),
      readJson('dist/release.json'),
      readJson('dist/publication.json'),
      discoverPublishedRoutes(),
    ]);

    expect(createHash('sha256').update(r3Source).digest('hex')).toBe(
      '9ec90ad5af973ebcb37b1439e7ebbe63f97738f7d38effed58f767ed5eee7dba',
    );
    expect(r1Manifest).toMatchObject({ releaseId: 'R1', reviewDate: '2026-08-29' });
    expect(r2Manifest).toMatchObject({ releaseId: 'R2', reviewDate: '2026-08-31' });
    expect(r3Manifest).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 4,
      releaseId: 'R3',
      reviewDate: '2026-09-04',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
    });
    expect(release).toEqual({
      ...r3Manifest,
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    expect(publication).toEqual({
      ...currentManifest,
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    expect(publication.sourceCommit).toBe(release.sourceCommit);
    expect(currentManifest).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      publicationId: 'current',
      reviewDate: '2026-09-04',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
      releaseReview: { latestCompleted: 'R3', next: 'R4', status: 'pending' },
    });

    expect(r3Manifest.scope).toEqual({
      publicationPairs: 232,
      sourceRoutes: 464,
      exerciseSetPublicationPairs: 61,
      solutionSetPublicationPairs: 61,
      learningUnits,
      runnableExamples,
      labs,
      visualExplainers,
      practiceBankEntries: 66,
      nsightReportAnalysisPracticeEntries: nsightReportAnalysisPracticeIds,
      glossaryTerms: 176,
      sourceRecords: 76,
    });
    expect(currentManifest.scope).toEqual(r3Manifest.scope);
    expect(r3Manifest.compatibility).toMatchObject({
      supportedEnvironment: 'native-linux',
      profilerComponents: {
        nsightSystems: {
          currentDocumentationVersion: '2026.4',
          currentReleaseVersion: '2026.4.1',
          toolkitLaneVersions: {
            'cuda-11.8': '2022.4.2.1',
            'cuda-12.9': '2025.1.3.140',
            'cuda-13.3': '2026.1.3.425',
          },
          reportFormat: '.nsys-rep',
        },
        nsightCompute: {
          currentVersion: '2026.2.1',
          toolkitLaneVersions: {
            'cuda-11.8': '2022.3.0.22',
            'cuda-12.9': '2025.2.1.3',
            'cuda-13.3': '2026.2.1.5',
          },
          reportFormat: '.ncu-rep',
        },
        cupti: {
          currentVersion: '2026.2.1',
          toolkitLaneVersions: {
            'cuda-11.8': '11.8.87',
            'cuda-12.9': '12.9.79',
            'cuda-13.3': '13.3.75',
          },
        },
        permissionPolicy: {
          performanceCounters: 'administrator-approved-non-admin-access',
          privilegeEscalationAllowed: false,
          deniedOrUnavailableMetrics: 'block-and-record',
        },
      },
    });
    expect(currentManifest.compatibility).toEqual(r3Manifest.compatibility);
    expect(r3Manifest.evidence).toEqual({
      compileChecked: ['EX02', 'EX10', 'LAB02'],
      noCompileCheckedClaim,
      pendingHardwareVerification,
      runtimeNotApplicable: ['EX10'],
      communityObserved: [],
      runtimeVerified: [],
      referenceEnvironments: [],
      performanceObservations: [],
      r3EvidenceNeutralLearningUnits,
      evidenceNeutralVisualExplainers: visualExplainers,
      expectedOnlyProfilerReportPlans: profilerReportPlans,
      capturedProfilerReports: [],
      retainedCompileRuns: [32720214527, 33275734951],
    });
    expect(currentManifest.evidence).toEqual(r3Manifest.evidence);
    expect(currentManifest.knownLimitations).toEqual(r3Manifest.knownLimitations);
    expect(r3Manifest.knownLimitations).toEqual(expect.arrayContaining([
      'No Reference Environment, Community-Observed subject, or Runtime-Verified R3 subject is declared.',
      'Q06-Q13 and A10-A14 are Learning Units with all four evidence arrays empty and grant no Evidence Status.',
      'The five profiler report fixtures are expected-only plans with unfilled Environment Manifests and empty recorded observations; they are not captured reports.',
      'L01-L13 production-library Learning Units and all R4 or later curriculum material are outside this release.',
    ]));

    expect(R3_NSIGHT_REPORT_ANALYSIS_PRACTICE_IDS).toEqual(nsightReportAnalysisPracticeIds);
    const practiceRecords = RESOURCE_INDEX_RECORDS.filter(({ planningId }) =>
      R3_NSIGHT_REPORT_ANALYSIS_PRACTICE_IDS.includes(
        planningId as (typeof R3_NSIGHT_REPORT_ANALYSIS_PRACTICE_IDS)[number],
      ));
    expect(practiceRecords.map(({ planningId }) => planningId)).toEqual(nsightReportAnalysisPracticeIds);
    for (const record of practiceRecords) {
      expect(record.group).toBe('practice');
      expect(record.resourceType).toBe('evidence-review');
      expect(record.prerequisites.length).toBeGreaterThan(0);
      expect(record.hardwareGate.en).toBeTruthy();
      expect(record.versionGate.en).toBeTruthy();
      expect([
        record.title.en,
        record.hardwareGate.en,
        record.versionGate.en,
        record.keywords?.en ?? '',
      ].join(' ')).toMatch(/Nsight/i);
      expect([
        record.title.en,
        record.hardwareGate.en,
        record.versionGate.en,
        record.keywords?.en ?? '',
      ].join(' ')).toMatch(/report/i);
      expect(record.reviewedOn).toMatch(/^2026-(?:08-31|09-0[1-3])$/);
    }

    expectExactMembers(destinationIds(/^(?:O|F|M|A|Q)\d{2}$/), learningUnits);
    expectExactMembers(destinationIds(/^EX\d{2}$/), runnableExamples);
    expectExactMembers(destinationIds(/^LAB\d{2}$/), labs);
    expectExactMembers(destinationIds(/^VIS\d{2}$/), visualExplainers);
    for (const absentId of ['L03', 'LAB11', 'L06', 'LAB12', 'L13', 'EX20']) {
      expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(absentId);
    }

    const recordsByGroup = Object.groupBy(RESOURCE_INDEX_RECORDS, ({ group }) => group);
    expect(recordsByGroup.labs).toHaveLength(10);
    expect(recordsByGroup.practice).toHaveLength(66);
    expect(recordsByGroup.visuals).toHaveLength(19);
    expect(recordsByGroup.glossary).toHaveLength(176);
    expect(recordsByGroup.sources).toHaveLength(76);
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(347);
    expect(publishedRoutes).toHaveLength(464);
    expect(new Set(publishedRoutes).size).toBe(464);

    for (const publicPath of profilerReportPlans) {
      const source = await readFile(path.join(projectRoot, 'public', publicPath.slice(1)), 'utf8');
      const fixture = JSON.parse(source);
      expect(validateProfilerReportFixture(fixture, source), publicPath).toEqual({ valid: true, errors: [] });
      expect(fixture).toMatchObject({
        fixtureType: 'expected-only-profiler-report-plan',
        captureStatus: 'pending-hardware-verification',
        recordedObservations: [],
      });
      expect(new Set(Object.values(fixture.environmentManifest))).toEqual(new Set(['unfilled']));
    }
  });

  it('documents the completed R3 review without pre-certifying dynamic acceptance', async () => {
    const [readme, deployment, maintenance, contentLicenses, dependencyReview, vitestConfig, zhHome, enHome, zhAbout, enAbout, zhUsing, enUsing, zhSources, enSources, zhPractice, enPractice] = await Promise.all([
      readFile(path.join(projectRoot, 'README.md'), 'utf8'),
      readFile(path.join(projectRoot, 'DEPLOYMENT.md'), 'utf8'),
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8'),
      readFile(path.join(projectRoot, 'DEPENDENCY_REVIEW.md'), 'utf8'),
      readFile(path.join(projectRoot, 'vitest.config.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/index.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/index.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/about.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/about.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/start/using-the-learning-site.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/start/using-the-learning-site.md'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/practice.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/practice.mdx'), 'utf8'),
    ]);

    for (const document of [readme, deployment, maintenance, contentLicenses]) {
      expect(document).toContain('src/r3-release-manifest.json');
      expect(document).toMatch(/R3.*latest completed aggregate (?:release )?review/i);
      expect(document).toMatch(/issue #32/i);
      expect(document).toMatch(/R4.*pending/i);
      expect(document).toMatch(/232 (?:bilingual )?Publication Pairs/i);
      expect(document).toContain('464 source routes');
      expect(document).toMatch(/62 Learning Units/i);
      expect(document).toMatch(/66 Practice Bank entries/i);
      expect(document).toMatch(/10 Nsight report-analysis/i);
      expect(document).not.toMatch(/R3 aggregate review remains pending/i);
    }
    expect(dependencyReview).toContain('Review date: 2026-09-04');
    expect(dependencyReview).toContain('R3 authority');
    expect(maintenance).toMatch(/Nsight Systems 2026\.4\/2026\.4\.1/);
    expect(maintenance).toMatch(/Nsight Compute 2026\.2\.1/);
    expect(maintenance).toMatch(/administrator-approved non-admin performance-counter access/i);
    expect(maintenance).toMatch(/five expected-only profiler report plans/i);
    expect(maintenance).toMatch(/retains no path-bearing JSON coverage report/i);
    expect(vitestConfig).toContain("reporter: ['text']");
    expect(vitestConfig).not.toContain('json-summary');

    for (const document of [zhHome, enHome, zhAbout, enAbout, zhUsing, enUsing, zhSources, enSources]) {
      expect(document).toMatch(/issue #32/i);
      expect(document).toMatch(/R3/);
      expect(document).toMatch(/R4/);
      expect(document).not.toMatch(/R3 aggregate review remains pending|R3 聚合复核仍待完成/i);
    }
    for (const practice of [zhPractice, enPractice]) {
      expect(practice).toMatch(/66 (?:complete entries|个完整条目|道完整题目)/i);
      expect(practice).not.toMatch(/64 (?:complete|道完整)/i);
      for (const id of nsightReportAnalysisPracticeIds) expect(practice).toContain(id);
    }
  });
});
