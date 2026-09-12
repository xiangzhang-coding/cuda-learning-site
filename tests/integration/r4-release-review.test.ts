// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  R3_NSIGHT_REPORT_ANALYSIS_PRACTICE_IDS,
  R4_LIBRARY_ALGORITHM_CHOICE_PRACTICE_IDS,
  RESOURCE_INDEX_RECORDS,
} from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { validateProfilerReportFixture } from '../../scripts/lib/profiler-report-fixture-policy.mjs';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const execFileAsync = promisify(execFile);
const learningUnits = [
  'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
  'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10',
  'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19',
  'A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10', 'A11', 'A12', 'A13', 'A14',
  'Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13',
  'L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12', 'L13',
] as const;
const runnableExamples = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX10',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16', 'EX17', 'EX18', 'EX19', 'EX20',
] as const;
const labs = ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08', 'LAB09', 'LAB10', 'LAB11', 'LAB12'] as const;
const visualExplainers = [
  'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
  'VIS09', 'VIS10', 'VIS11', 'VIS12', 'VIS13', 'VIS14', 'VIS18', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
] as const;
const noCompileCheckedClaim = [
  'EX01', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16', 'EX17', 'EX18', 'EX19', 'EX20',
  'LAB01', 'LAB03', 'LAB04', 'LAB05', 'LAB06', 'LAB07', 'LAB08', 'LAB09', 'LAB10', 'LAB11', 'LAB12',
] as const;
const pendingHardwareVerification = [
  'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09',
  'EX11', 'EX12', 'EX13', 'EX14', 'EX15', 'EX16', 'EX17', 'EX18', 'EX19', 'EX20', ...labs,
] as const;
const r3EvidenceNeutralLearningUnits = ['Q06', 'Q07', 'Q08', 'Q09', 'Q10', 'Q11', 'Q12', 'Q13', 'A10', 'A11', 'A12', 'A13', 'A14'] as const;
const r4EvidenceNeutralLearningUnits = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12', 'L13'] as const;
const profilerReportPlans = [
  '/assets/profiler-report-fixtures/lab06-nsight-systems.expected.json',
  '/assets/profiler-report-fixtures/lab08-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/lab10-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/lab11-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/q12-nsight-compute.expected.json',
  '/assets/profiler-report-fixtures/q13-nsight-compute.expected.json',
] as const;
const nsightReportAnalysisPracticeIds = [
  'PB-R3-002', 'PB-R3-003', 'PB-R3-004', 'PB-R3-005', 'PB-R3-007',
  'PB-R3-008', 'PB-R3-009', 'PB-R3-010', 'PB-R3-011', 'PB-R3-012',
] as const;
const libraryAlgorithmChoicePracticeIds = [
  'PB-R4-001', 'PB-R4-002', 'PB-R4-003', 'PB-R4-004',
  'PB-R4-008', 'PB-R4-011', 'PB-R4-012', 'PB-R4-016',
] as const;

async function readJson(relativePath: string) {
  return JSON.parse(await readFile(path.join(projectRoot, relativePath), 'utf8'));
}

async function readRoute(route: string) {
  return parseHTML(await readFile(path.join(projectRoot, 'dist', route.slice(1), 'index.html'), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="cuda:${name}"]`)?.getAttribute('content');
}

function expectExactMembers(actual: readonly string[], expected: readonly string[]) {
  expect([...actual].sort()).toEqual([...expected].sort());
}

describe('R4 release review', () => {
  it.each(['', 'en/'])('static: distinguishes the current Python summary from frozen R4 history in %s', async (prefix) => {
    for (const file of ['index.mdx', 'about.md', 'start/using-the-learning-site.md']) {
      const raw = await readFile(path.join(projectRoot, 'src/content/docs', prefix, file), 'utf8');
      const { frontmatter } = parseFrontmatter(raw);
      expect(frontmatter.factCheckDate, `${prefix}${file}`).toBe('2026-09-12');
      expect(frontmatter.head.find((entry: { attrs: { name: string } }) => entry.attrs.name === 'cuda:fact-check-date')?.attrs.content)
        .toBe('2026-09-12');
      const prose = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replaceAll('**', '').replace(/（[^）]*）/g, '');
      for (const count of [
        /287 (?:Publication Pairs|个双语发布对)/, /574 (?:source routes|条源路由)/,
        /78 (?:Learning Units|个学习单元)/, /21 (?:Runnable Examples|个可运行示例)/,
        /77 (?:Exercise sets|组练习)/, /77 (?:separate reviewed-solution sets|组独立参考解答)/,
        /85 (?:Practice Bank entries|个练习题库条目)/, /200 (?:Glossary terms|个术语表词条)/,
        /95 (?:source records|条来源记录)/, /411 (?:catalog records|条资源目录记录)/, /32 (?:subjects|个主体)/,
      ]) expect(prose, `${prefix}${file}: ${count}`).toMatch(count);
      expect(prose).toMatch(/R4[^\n]*2026-09-10|2026-09-10[^\n]*R4/);
      expect(prose).toMatch(/R5[^\n]*(?:pending|待完成)/);
      expect(prose).not.toMatch(/R4 and (?:the )?current catalog|R4 与当前[^。\n]*均|currently has the same inventory|当前具有相同清单/);
      for (const slug of ['python/cuda-python-bridge', 'python/devices-contexts-launches', 'python/runtime-compilation-linking', 'examples/cuda-python-launch']) {
        expect(raw, `${prefix}${file}`).toContain(`/${prefix}${slug}/`);
      }
      for (const edge of ['[F04,M07]', '[P01,F07]', '[P02,M15,M16]', '[P02]']) expect(raw).toContain(edge);
      expect(prose).toMatch(/EX21[^\n]*Pending Hardware Verification|EX21[^\n]*待硬件验证/);
      if (file === 'index.mdx') {
        expect(raw).toContain(`className="route-card" href="/${prefix}python/cuda-python-bridge/"`);
        const document = parseHTML(raw).document;
        for (const [slug, count] of [['practice', '85'], ['glossary', '200'], ['sources-and-versions', '95']]) {
          expect(document.querySelector(`a[href="/${prefix}${slug}/"] small`)?.textContent, `${prefix} ${slug} card`).toContain(count);
        }
      }
      if (file === 'start/using-the-learning-site.md') {
        expect(frontmatter.prerequisites).toEqual([]);
        expect(frontmatter.evidence).toEqual({ compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] });
      }
    }
  });

  it('keeps all R1-R4 manifest bytes identical to the fixed review baseline', async () => {
    for (const [id, sha256] of [
      ['r1', 'ad684a62d30402ed0a0fc9ba36c619f2897e6595c1d533b5241e789335e342e4'],
      ['r2', 'b58ad7072d04b1cb9b7cf613803f9aacb1e079b8cbfb7df75b0de8c64303620e'],
      ['r3', '9ec90ad5af973ebcb37b1439e7ebbe63f97738f7d38effed58f767ed5eee7dba'],
      ['r4', '26b0897efbfed9d697570f475e25fd88dbd3442b13357581f9ff96b87c098df7'],
    ]) {
      const bytes = await readFile(path.join(projectRoot, `src/${id}-release-manifest.json`));
      expect(createHash('sha256').update(bytes).digest('hex'), id).toBe(sha256);
    }
  });

  it('qualifies exactly eight existing bilingual library-and-algorithm-choice entries', async () => {
    expect(R4_LIBRARY_ALGORITHM_CHOICE_PRACTICE_IDS).toEqual(libraryAlgorithmChoicePracticeIds);
    const prerequisites = ['L01', 'L02', 'L03', 'L04', 'L07', 'L10', 'L11', 'L13'];
    const records = RESOURCE_INDEX_RECORDS.filter(({ planningId }) =>
      libraryAlgorithmChoicePracticeIds.some((id) => id === planningId));
    expect(records.map(({ planningId }) => planningId)).toEqual(libraryAlgorithmChoicePracticeIds);
    for (const locale of ['zh-CN', 'en'] as const) {
      const document = await readRoute(locale === 'en' ? '/en/practice/' : '/practice/');
      for (const [index, record] of records.entries()) {
        expect(record.group).toBe('practice');
        expect(record.prerequisites).toEqual([prerequisites[index]]);
        expect(record.hardwareGate[locale]).toBeTruthy();
        expect(record.versionGate[locale]).toBeTruthy();
        expect(record.evidence).toBeUndefined();
        const card = document.querySelector(`[data-resource-id="${record.planningId}"]`);
        expect(card?.querySelector('h3 a')?.getAttribute('href')).toBe(record.href[locale]);
        expect(card?.textContent).toContain(record.hardwareGate[locale]);
        expect(card?.textContent).toContain(record.versionGate[locale]);
        expect(card?.querySelector('[data-resource-evidence]')).toBeNull();
        expect(document.querySelectorAll(`span[id="${record.planningId.toLowerCase()}"]`)).toHaveLength(1);
      }
    }
  });

  it('prepares reviewed R4 metadata and the current R5 review boundary without building the site', async () => {
    const current = await readJson('src/current-publication-manifest.json');
    expect(current).toMatchObject({
      schemaVersion: 1,
      publicationId: 'current',
      reviewDate: '2026-09-12',
      releaseReview: { latestCompleted: 'R4', next: 'R5', status: 'pending' },
      scope: { libraryAlgorithmChoicePracticeEntries: libraryAlgorithmChoicePracticeIds },
    });
    const reviewed = await readJson('src/r4-release-manifest.json');
    expect(reviewed).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 5,
      releaseId: 'R4',
      reviewDate: '2026-09-10',
      artifactType: 'static-assets',
      canonicalOrigin: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
      scope: {
        publicationPairs: 277, sourceRoutes: 554, exerciseSetPublicationPairs: 74, solutionSetPublicationPairs: 74,
        learningUnits, runnableExamples, labs, visualExplainers,
        practiceBankEntries: 82, glossaryTerms: 196, sourceRecords: 92,
        nsightReportAnalysisPracticeEntries: nsightReportAnalysisPracticeIds,
        libraryAlgorithmChoicePracticeEntries: libraryAlgorithmChoicePracticeIds,
      },
    });
    for (const key of ['learningUnits', 'runnableExamples', 'labs', 'visualExplainers']) {
      expect(current.scope[key]).toEqual(expect.arrayContaining(reviewed.scope[key]));
    }

    const root = await mkdtemp(path.join(tmpdir(), 'r4-release-output-'));
    const sourceCommit = '0000000000000000000000000000000000000041';
    try {
      // Run the real metadata emitter in isolation, never touching the coordinated site build.
      for (const file of [
        'scripts/prepare-release-output.mjs',
        'src/r3-release-manifest.json', 'src/r4-release-manifest.json', 'src/current-publication-manifest.json',
        'LICENSE', 'LICENSE-CONTENT', 'NOTICE', 'CONTENT_LICENSES.md', 'THIRD_PARTY_NOTICES.md',
        'node_modules/astro/LICENSE', 'node_modules/@astrojs/starlight/LICENSE',
        'node_modules/pagefind/LICENSE/LICENSE', 'node_modules/pagefind/LICENSE/LICENSE-vscode-ripgrep',
      ]) {
        await mkdir(path.dirname(path.join(root, file)), { recursive: true });
        await cp(path.join(projectRoot, file), path.join(root, file));
      }
      await execFileAsync(process.execPath, [path.join(root, 'scripts/prepare-release-output.mjs')], {
        cwd: root,
        env: { ...process.env, WORKERS_CI_COMMIT_SHA: sourceCommit },
      });
      expect(JSON.parse(await readFile(path.join(root, 'dist/release.json'), 'utf8'))).toEqual({ ...reviewed, sourceCommit });
      expect(JSON.parse(await readFile(path.join(root, 'dist/publication.json'), 'utf8'))).toEqual({ ...current, sourceCommit });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('retains the component, evidence, and limitation contracts without runtime upgrades', async () => {
    const [r3, reviewed, current] = await Promise.all([
      readJson('src/r3-release-manifest.json'), readJson('src/r4-release-manifest.json'), readJson('src/current-publication-manifest.json'),
    ]);
    expect(reviewed.compatibility).toMatchObject(r3.compatibility);
    expect(reviewed.compatibility.toolkitLanes).toEqual(r3.compatibility.toolkitLanes);
    expect(reviewed.compatibility.componentBoundaries).toEqual({
      cccl: {
        version: '3.4.2', selection: 'independent', commit: 'd36012203ef73ac7f966e848dd88482273e91e02', releasedOn: '2026-08-05',
        toolkitLanes: ['cuda-12.9', 'cuda-13.3'], excludedToolkitLanes: ['cuda-11.8'], excludedLaneRequires: 'separately reviewed library versions',
      },
      cub: {
        bundled: [
          { toolkitLane: 'cuda-11.8', version: '1.15.1', versionMacro: 101501, package: 'cuda-cccl-11-8=11.8.89-1' },
          { toolkitLane: 'cuda-12.9', version: '2.8.2', versionMacro: 200802, package: 'cuda-cccl-12-9=12.9.27-1' },
          { toolkitLane: 'cuda-13.3', version: '3.3.4', versionMacro: 300304, package: 'cccl-13-3=13.3.3.4.1-1' },
        ],
        selected: { version: '3.4.2', versionMacro: 300402, commit: 'd36012203ef73ac7f966e848dd88482273e91e02', toolkitLanes: ['cuda-12.9', 'cuda-13.3'] },
      },
      cublas: {
        bundled: [
          { toolkitLane: 'cuda-11.8', version: '11.11.3.6' },
          { toolkitLane: 'cuda-12.9', version: '12.9.2.10' },
          { toolkitLane: 'cuda-13.3', version: '13.6.0.2' },
        ],
        apiTeachingBaseline: 'Toolkit 12.9.2 archived cuBLAS guide, label 12.9',
        currentApiComparison: 'Live cuBLAS guide label 13.3, accessed 2026-09-06',
        currentReleaseNotes: 'Live CUDA 13.3 Update 1 release notes, accessed 2026-09-06',
        exact1331Archive: 'API and release-note archives returned HTTP 404 on 2026-09-06; both returned HTTP 200 on 2026-09-10. The earlier live comparison remains historical.',
        exampleToolkitLanes: ['cuda-11.8', 'cuda-12.9', 'cuda-13.3'], labToolkitLanes: ['cuda-13.3'],
      },
      cufft: {
        bundled: [
          { toolkitLane: 'cuda-11.8', version: '10.9.0.58' },
          { toolkitLane: 'cuda-12.9', version: '11.4.1.4' },
          { toolkitLane: 'cuda-13.3', version: '12.3.0.29' },
        ],
        apiTeachingBaseline: 'Toolkit 12.9.2 archived cuFFT guide, label 12.9',
        currentApiComparison: 'Live cuFFT guide label 13.3, accessed 2026-09-08',
        currentReleaseNotes: 'Live CUDA 13.3 Update 1 release notes, accessed 2026-09-08',
        exact1331Archive: 'API and release-note archives returned HTTP 404 on 2026-09-08; both returned HTTP 200 on 2026-09-10. The earlier live comparison remains historical.',
        exampleToolkitLanes: ['cuda-11.8', 'cuda-12.9', 'cuda-13.3'], exampleDialects: ['c++17'],
      },
      cusparse: {
        bundled: [
          { toolkitLane: 'cuda-11.8', version: '11.7.5.86' },
          { toolkitLane: 'cuda-12.9', version: '12.5.10.65' },
          { toolkitLane: 'cuda-13.3', version: '12.8.2.51' },
        ],
        apiTeachingBaseline: 'Toolkit 12.9.2 archived cuSPARSE guide',
        currentApiComparison: 'Exact Toolkit 13.3.1 archived cuSPARSE guide, accessed 2026-09-09',
        currentReleaseNotes: 'Exact CUDA 13.3 Update 1 archived release notes, accessed 2026-09-09',
        exampleToolkitLanes: ['cuda-11.8', 'cuda-12.9', 'cuda-13.3'], exampleDialects: ['c++17'],
        examplePreprocessing: 'not used; SpMV preprocessing is absent in the 11.8 lane',
      },
      cudnn: { version: '9.24.0', selection: 'independent-reference-only', reviewedOn: '2026-09-07', compileCheckedToolkitLanes: [] },
      cudnnFrontend: {
        version: '1.27.0', selection: 'independent-reference-only', commit: 'f77fbc3d21be3f24cd0286b9b368105f7c518b8a',
        releasedOn: '2026-08-06', reviewedOn: '2026-09-07', compileCheckedToolkitLanes: [],
      },
      cutlassCpp: {
        version: '4.7.0', selection: 'independent-reference-only', commit: 'dcf215af68a2d08d305076c152a06f201728cd53', releasedOn: '2026-08-13',
        apiTeachingBaseline: 'Retained 2.x-style C++ GEMM API with a bounded 3.x collective comparison',
        proposedBuildTarget: {
          toolkit: '13.3.1', nvcc: '13.3.73', host: 'Ubuntu 24.04 x86-64', hostCompiler: 'GCC 13.3.0',
          dialect: 'c++17', architecture: 'sm_75', status: 'not-built',
        },
        compileCheckedToolkitLanes: [], pythonDslIncluded: false,
      },
    });
    expect(reviewed.evidence).toEqual({
      compileChecked: ['EX02', 'EX10', 'LAB02'], noCompileCheckedClaim, pendingHardwareVerification,
      runtimeNotApplicable: ['EX10'], communityObserved: [], runtimeVerified: [], referenceEnvironments: [], performanceObservations: [],
      r3EvidenceNeutralLearningUnits, r4EvidenceNeutralLearningUnits, evidenceNeutralVisualExplainers: visualExplainers,
      expectedOnlyProfilerReportPlans: profilerReportPlans, capturedProfilerReports: [], retainedCompileRuns: [32720214527, 33275734951],
    });
    expect(current.compatibility).toMatchObject(reviewed.compatibility);
    for (const field of ['compileChecked', 'runtimeNotApplicable', 'communityObserved', 'runtimeVerified',
      'referenceEnvironments', 'performanceObservations', 'capturedProfilerReports', 'retainedCompileRuns']) {
      expect(current.evidence[field], field).toEqual(reviewed.evidence[field]);
    }
    for (const field of ['noCompileCheckedClaim', 'pendingHardwareVerification']) {
      expect(current.evidence[field], field).toEqual(expect.arrayContaining(reviewed.evidence[field]));
    }
    expect(reviewed.knownLimitations).toEqual(expect.arrayContaining([
      'No Reference Environment, Community-Observed subject, or Runtime-Verified R4 subject is declared.',
      'Q06-Q13 and A10-A14 are Learning Units with all four evidence arrays empty and grant no Evidence Status.',
      'L01-L13 are R4 Learning Units with all four evidence arrays empty and grant no Evidence Status; API presence, owner tests, static decisions, and library contracts provide no local compilation, runtime, synchronization, or performance evidence.',
      'The six profiler report fixtures are expected-only plans with unfilled Environment Manifests and empty recorded observations; they are not captured reports.',
      'Q12 summarizes linked EX11 and now leads to LAB11; EX11, EX17, and LAB11 retain empty compilation and recorded observations and remain Pending Hardware Verification, while their build gates, VIS10, canonical imports, and expected-only plans add no runtime or performance evidence.',
      'L03/LAB11, L06/LAB12, and L13/EX20 have reviewed R4 destinations, not immutable R3 destinations. LAB11 requires Q12/L03, LAB12 requires Q13/L06, L13 requires A12/A13/L01, and EX20 requires L13.',
      'EX17 and LAB11 have five declared bundled-or-selected CUB build profiles, but no retained compilation record, queried temporary-storage value, GPU output, timing, traffic, kernel mapping, maintenance result, speedup, or winner.',
      'EX18 and LAB12 have empty compilation and recorded observations and remain Pending Hardware Verification. Their fixed traditional FP32 pedantic comparison grants no cuBLASLt candidate, workspace, epilogue, timing, Tensor Core, speedup, or winner observation.',
      'EX19 has empty compilation and recorded observations and remains Pending Hardware Verification. Its three pinned Toolkit Lane C++17 build gates provide no retained evidence; callbacks, low precision, multi-GPU execution, and timing are outside its contract.',
      'L13 uses the archived 12.9.2 cuSPARSE teaching baseline and exact 13.3.1 archive reviewed 2026-09-09. SpMV and SpMM preprocessing, algorithm determinism, narrow precision, and structured sparsity retain distinct version and hardware gates.',
      'EX20 has empty compilation and recorded observations and remains Pending Hardware Verification. Its three pinned C++17 build gates do not execute CUDA; the FP32 non-transposed CSR SpMV path excludes preprocessing, SpMM, mixed precision, structured sparsity, and timing.',
      'R5 framework-integration and Triton Learning Units, Labs, Runnable Examples, and all later curriculum material are outside this release; library-selection comparisons grant no framework or Triton destination, compilation, runtime, or performance evidence.',
    ]));
    expect(reviewed.knownLimitations.join(' ')).not.toMatch(/R4 aggregate review remains pending|rolling R4 destinations/);
  });

  it('retains all ten Nsight report-analysis entries and six expected-only profiler plans', async () => {
    expect(R3_NSIGHT_REPORT_ANALYSIS_PRACTICE_IDS).toEqual(nsightReportAnalysisPracticeIds);
    const records = RESOURCE_INDEX_RECORDS.filter(({ planningId }) => nsightReportAnalysisPracticeIds.some((id) => id === planningId));
    expect(records.map(({ planningId }) => planningId)).toEqual(nsightReportAnalysisPracticeIds);
    for (const record of records) {
      expect(record.group).toBe('practice');
      expect(record.resourceType).toBe('evidence-review');
      expect(record.prerequisites.length).toBeGreaterThan(0);
      expect(record.hardwareGate.en).toBeTruthy();
      expect(record.versionGate.en).toBeTruthy();
      const text = [record.title.en, record.hardwareGate.en, record.versionGate.en, record.keywords?.en ?? ''].join(' ');
      expect(text).toMatch(/Nsight/i);
      expect(text).toMatch(/report/i);
      expect(record.reviewedOn).toMatch(/^2026-(?:08-31|09-0[1-3])$/);
    }
    for (const publicPath of profilerReportPlans) {
      const source = await readFile(path.join(projectRoot, 'public', publicPath.slice(1)), 'utf8');
      const fixture = JSON.parse(source);
      expect(validateProfilerReportFixture(fixture, source), publicPath).toEqual({ valid: true, errors: [] });
      expect(fixture).toMatchObject({
        fixtureType: 'expected-only-profiler-report-plan', captureStatus: 'pending-hardware-verification', recordedObservations: [],
      });
      expect(new Set(Object.values(fixture.environmentManifest))).toEqual(new Set(['unfilled']));
      expect(await readFile(path.join(projectRoot, 'dist', publicPath.slice(1)), 'utf8')).toBe(source);
      const sidecar = await readFile(path.join(projectRoot, 'public', `${publicPath.slice(1)}.license.json`), 'utf8');
      expect(JSON.parse(sidecar)).toMatchObject({ license: 'CC-BY-4.0', provenance: 'original' });
      expect(await readFile(path.join(projectRoot, 'dist', `${publicPath.slice(1)}.license.json`), 'utf8')).toBe(sidecar);
      if (publicPath.endsWith('lab11-nsight-compute.expected.json')) {
        expect(fixture).toMatchObject({
          schemaVersion: 2, fixtureId: 'LAB11-NCU-EXPECTED', labId: 'LAB11', exampleId: 'EX17',
          method: { exampleIds: ['EX11', 'EX17'], canonicalExampleId: 'EX17' }, sanitization: { status: 'passed', reviewDate: '2026-09-05' },
        });
        expect(fixture.method.componentProfiles.map(({ id }: { id: string }) => id)).toEqual([
          'cuda-11-8-bundled-cub-1-15-1', 'cuda-12-9-bundled-cub-2-8-2', 'cuda-13-3-bundled-cub-3-3-4',
          'cuda-12-9-selected-cccl-3-4-2', 'cuda-13-3-selected-cccl-3-4-2',
        ]);
        expect(Object.keys(fixture.captureCommands)).toEqual(['custom', 'cub']);
        expect(fixture.captureCommands.custom).toMatch(/--candidate custom --timing none/);
        expect(fixture.captureCommands.cub).toMatch(/--candidate cub --timing none/);
        expect(fixture.claimBoundary).toMatch(/no recorded environment value[\s\S]*component winner/i);
      }
    }
  });

  it('publishes the exact reviewed R4 contract and source-bound current manifest', async () => {
    const [reviewed, current, release, publication] = await Promise.all([
      readJson('src/r4-release-manifest.json'), readJson('src/current-publication-manifest.json'),
      readJson('dist/release.json'), readJson('dist/publication.json'),
    ]);
    expect(release).toEqual({ ...reviewed, sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/) });
    expect(publication).toEqual({ ...current, sourceCommit: release.sourceCommit });
    expect(release.scope).toEqual({
      publicationPairs: 277,
      sourceRoutes: 554,
      exerciseSetPublicationPairs: 74,
      solutionSetPublicationPairs: 74,
      learningUnits, runnableExamples, labs, visualExplainers,
      practiceBankEntries: 82,
      nsightReportAnalysisPracticeEntries: nsightReportAnalysisPracticeIds,
      libraryAlgorithmChoicePracticeEntries: libraryAlgorithmChoicePracticeIds,
      glossaryTerms: 196,
      sourceRecords: 92,
    });
    expect(publication.scope).toEqual(current.scope);
    for (const route of ['/practice/', '/en/practice/']) {
      const document = await readRoute(route);
      const table = document.querySelector('a[href="#pb-r4-001"]')?.closest('table');
      expect(table, `${route} qualifying subset`).toBeDefined();
      expect([...table!.querySelectorAll('tbody tr')].map((row) => row.querySelector('td a')?.textContent?.trim()))
        .toEqual(libraryAlgorithmChoicePracticeIds);
    }
  });

  it('covers every library unit with dated rendered sources and separate owner-license boundaries', async () => {
    const sources = [
      ['L01', 5, '2026-09-04'], ['L02', 21, '2026-09-04'],
      ['L03', 17, '2026-09-05'], ['L04', 17, '2026-09-05'], ['L05', 20, '2026-09-05'],
      ['L06', 9, '2026-09-06'], ['L07', 9, '2026-09-06'],
      ['L08', 6, '2026-09-07'], ['L09', 7, '2026-09-07'], ['L10', 10, '2026-09-07'], ['L11', 2, '2026-09-07'],
      ['L12', 9, '2026-09-08'], ['L13', 11, '2026-09-09'],
    ] as const;
    const licenseRecord = await readFile(path.join(projectRoot, 'CONTENT_LICENSES.md'), 'utf8');
    for (const boundary of ['Apache-2.0 WITH LLVM-exception', 'BSD-3-Clause', 'Boost', 'CUTLASS', '4.7.0', '1.27.0', '9.24.0', 'EULA']) {
      expect(licenseRecord).toContain(boundary);
    }
    for (const locale of ['zh-CN', 'en'] as const) {
      const sourcePage = await readRoute(locale === 'en' ? '/en/sources-and-versions/' : '/sources-and-versions/');
      const html = sourcePage.querySelector('.sl-markdown-content')!.innerHTML;
      for (const [id, count, date] of sources) {
        const document = await readRoute(PUBLISHED_DESTINATIONS[id].href[locale]);
        expect(metadata(document, 'source-count'), `${locale} ${id}`).toBe(String(count));
        expect(metadata(document, 'fact-check-date'), `${locale} ${id}`).toBe(date);
        expect(metadata(document, 'license')).toBe('CC-BY-4.0');
        expect(document.querySelector('.sl-markdown-content')?.textContent, id).toMatch(/licens|rights|许可|版权|条款/i);
        const coveringRecords = RESOURCE_INDEX_RECORDS.filter((record) => record.group === 'sources' && record.relatedUnits.includes(id));
        expect(coveringRecords.length, id).toBeGreaterThan(0);
        for (const record of coveringRecords) {
          expect(sourcePage.getElementById(record.planningId.toLowerCase()), record.planningId).not.toBeNull();
          expect(sourcePage.querySelector(`[data-resource-id="${record.planningId}"] a[href="${PUBLISHED_DESTINATIONS[id].href[locale]}"]`), record.planningId).not.toBeNull();
        }
      }
      for (const [ids, date] of [
        [['061', '062'], '2026-09-04'], [['063', '064'], '2026-09-05'], [['065', '066'], '2026-09-05'],
        [['067', '068'], '2026-09-06'], [['069', '070'], '2026-09-07'], [['071', '072'], '2026-09-07'],
        [['073', '074'], '2026-09-08'], [['075', '076'], '2026-09-09'],
      ] as const) {
        const sections: string[] = [];
        for (const suffix of ids) {
          const id = `SRC-CUDA-${suffix}`;
          const target = sourcePage.getElementById(id.toLowerCase());
          expect(target, id).not.toBeNull();
          const start = html.indexOf(target!.outerHTML);
          expect(start, id).toBeGreaterThanOrEqual(0);
          const end = html.indexOf('<span id="src-', start + target!.outerHTML.length);
          const section = html.slice(start, end < 0 ? undefined : end);
          expect(section, `${locale} ${id} owner source`).toMatch(/href="https:\/\/(?:docs\.nvidia\.com|github\.com\/NVIDIA|developer\.download\.nvidia\.com)/);
          sections.push(section);
          const record = RESOURCE_INDEX_RECORDS.find((record) => record.planningId === id);
          expect(record?.reviewedOn, id).toBe(date);
          expect(record?.sourceAccessDate, id).toBe(date);
          const card = sourcePage.querySelector(`[data-resource-id="${id}"]`);
          expect(card?.textContent, id).toContain(date);
        }
        expect(sections.join(' '), `${locale} SRC-CUDA-${ids.join('/')} rights`).toMatch(/licens|rights|terms|许可|版权|条款|EULA|BSD|Apache/i);
      }
    }
  });

  it('documents the completed static R4 review without pre-certifying dynamic acceptance', async () => {
    const [readme, deployment, maintenance, contentLicenses, dependencyReview, vitestConfig] = await Promise.all(
      ['README.md', 'DEPLOYMENT.md', 'MAINTENANCE_SOURCES.md', 'CONTENT_LICENSES.md', 'DEPENDENCY_REVIEW.md', 'vitest.config.ts']
        .map((file) => readFile(path.join(projectRoot, file), 'utf8')),
    );
    for (const document of [readme, deployment, maintenance, contentLicenses]) {
      expect(document).toContain('src/r4-release-manifest.json');
      expect(document).toMatch(/R4.*latest completed aggregate/i);
      expect(document).toMatch(/issue #41/i);
      expect(document).toMatch(/issue #32/i);
      expect(document).toMatch(/R5.*pending/i);
      expect(document).toMatch(/10 Nsight report-analysis|ten-entry (?:R3 )?Nsight report-analysis/i);
      expect(document).not.toMatch(/R4 aggregate review remains pending/i);
      for (const id of libraryAlgorithmChoicePracticeIds) expect(document).toContain(id);
    }
    expect(dependencyReview).toContain('2026-09-10');
    expect(dependencyReview).toMatch(/No dependency or lockfile was upgraded in the R4 aggregate review/);
    expect(maintenance).toMatch(/Nsight Systems 2026\.4\/2026\.4\.1/);
    expect(maintenance).toMatch(/Nsight Compute 2026\.2\.1/);
    expect(maintenance).toMatch(/administrator-approved non-admin performance-counter access/i);
    expect(maintenance).toMatch(/six expected-only profiler (?:report )?plans/i);
    expect(maintenance).toMatch(/retains no path-bearing JSON coverage report/i);
    expect(vitestConfig).toContain("reporter: ['text']");
    expect(vitestConfig).not.toContain('json-summary');
    for (const prefix of ['', 'en/']) {
      for (const file of ['index.mdx', 'about.md', 'start/using-the-learning-site.md', 'sources-and-versions.mdx']) {
        const document = await readFile(path.join(projectRoot, 'src/content/docs', prefix, file), 'utf8');
        expect(document, `${prefix}${file}`).toMatch(/issue #41/i);
        expect(document).toMatch(/R4/);
        expect(document).toMatch(/R5/);
        expect(document).not.toMatch(/R4 aggregate review remains pending|R4 聚合复核仍待完成/i);
      }
      const practice = await readFile(path.join(projectRoot, 'src/content/docs', prefix, 'practice.mdx'), 'utf8');
      expect(practice).toMatch(/85 (?:complete entries|个完整条目|道完整题目)/i);
      expect(practice).not.toMatch(/68 (?:complete|道完整)/i);
      for (const id of nsightReportAnalysisPracticeIds) expect(practice).toContain(id);
      for (const id of ['001', '002', '003', '004', '005', '006', '007', '008', '009', '010', '011', '012', '013', '014', '015', '016']) {
        expect(practice).toContain(`PB-R4-${id}`);
      }
    }
  });

  it('counts the actual rendered bilingual inventories, closes the public graph, and preserves evidence', async () => {
    const current = await readJson('src/current-publication-manifest.json');
    const files = (await readdir(path.join(projectRoot, 'dist'), { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => /(?:^|\/)index\.html$/.test(file));
    const routes = files.map((file) => `/${file.replace(/index\.html$/, '')}`);
    expect(routes).toHaveLength(current.scope.sourceRoutes);
    expect(new Set(routes).size).toBe(current.scope.sourceRoutes);
    expectExactMembers(routes, await discoverPublishedRoutes());
    const pages = new Map(await Promise.all(routes.map(async (route) => [route, await readRoute(route)] as const)));
    const pairs = new Map<string, string[]>();
    for (const [route, document] of pages) {
      const pairId = metadata(document, 'pair-id');
      expect(pairId, route).toBeTruthy();
      pairs.set(pairId!, [...(pairs.get(pairId!) ?? []), route]);
      const counterpart = document.querySelector('[data-locale-counterpart]')?.getAttribute('href');
      const paired = pages.get(counterpart ?? '');
      expect(paired, `${route} counterpart`).toBeDefined();
      expect(paired?.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(route);
      for (const field of ['pair-id', 'unit-id', 'resource-kind', 'structure', 'prerequisites', 'related-units',
        'fact-check-date', 'source-count', 'source-versions', 'evidence-compilation', 'evidence-runtime',
        'expected-observations', 'recorded-observations']) {
        expect(metadata(document, field), `${route} ${field}`).toBe(metadata(paired!, field));
      }
      expect(metadata(document, 'license'), route).toBe('CC-BY-4.0');
    }
    expect(pairs.size).toBe(current.scope.publicationPairs);
    for (const members of pairs.values()) expect(members).toHaveLength(2);

    for (const locale of ['zh-CN', 'en'] as const) {
      const localPages = [...pages].filter(([route]) => route.startsWith('/en/') === (locale === 'en'));
      const idsOfKind = (kind: string) => localPages.filter(([, doc]) => metadata(doc, 'resource-kind') === kind)
        .map(([, doc]) => metadata(doc, 'unit-id')!);
      expectExactMembers(idsOfKind('learning-unit'), current.scope.learningUnits);
      expectExactMembers(idsOfKind('runnable-example'), current.scope.runnableExamples);
      expectExactMembers(idsOfKind('lab'), labs);
      expect(idsOfKind('exercise-set')).toHaveLength(current.scope.exerciseSetPublicationPairs);
      expect(idsOfKind('solution-set')).toHaveLength(current.scope.solutionSetPublicationPairs);
      const units = new Map(localPages.filter(([, doc]) => metadata(doc, 'unit-id'))
        .map(([route, doc]) => [metadata(doc, 'unit-id')!, { route, document: doc }]));
      const graph = new Map<string, string[]>();
      for (const [id, { document }] of units) {
        const raw = metadata(document, 'prerequisites');
        const prerequisites = !raw || raw === 'none' ? [] : raw.split(',');
        graph.set(id, prerequisites);
        for (const prerequisite of prerequisites) expect(units.has(prerequisite), `${locale} ${id} -> ${prerequisite}`).toBe(true);
        if (PUBLISHED_DESTINATIONS[id]) expect(prerequisites, id).toEqual(PUBLISHED_DESTINATIONS[id].prerequisites);
      }
      const requiredEdges = {
        L01: ['A02', 'A03', 'A08', 'Q06'], L02: ['A01', 'A03', 'A09'],
        L03: ['A02', 'A03', 'M07', 'L01'], L04: ['F02', 'M03', 'M05', 'A02', 'A03', 'L03'],
        L05: ['M05', 'M13', 'M19'], L06: ['A08', 'Q01'], L07: ['L06', 'Q05'],
        L08: ['Q02', 'L06', 'F06'], L09: ['A08', 'L06', 'M17'],
        L10: ['A07', 'L01', 'Q05'], L11: ['A11', 'L10', 'L08'], L12: ['Q05', 'M07'], L13: ['A12', 'A13', 'L01'],
        EX17: ['L03'], EX18: ['L06'], EX19: ['L12'], EX20: ['L13'], LAB11: ['Q12', 'L03'], LAB12: ['Q13', 'L06'],
      };
      for (const [id, prerequisites] of Object.entries(requiredEdges)) expect(graph.get(id), id).toEqual(prerequisites);
      for (const id of current.scope.learningUnits.filter((id: string) => id !== 'O01')) {
        expect(graph.get(`${id}-EXERCISES`), id).toEqual([id]);
        expect(graph.get(`${id}-SOLUTIONS`), id).toEqual([`${id}-EXERCISES`]);
      }
      const visited = new Set<string>();
      const active = new Set<string>();
      function visit(id: string) {
        expect(active.has(id), `${locale} prerequisite cycle at ${id}`).toBe(false);
        if (visited.has(id)) return;
        active.add(id);
        for (const prerequisite of graph.get(id) ?? []) visit(prerequisite);
        active.delete(id);
        visited.add(id);
      }
      for (const id of graph.keys()) visit(id);

      const catalogIds: string[] = [];
      for (const [slug, group, count] of [
        ['labs', 'labs', 12], ['practice', 'practice', current.scope.practiceBankEntries], ['visuals', 'visuals', 19],
        ['glossary', 'glossary', current.scope.glossaryTerms], ['sources-and-versions', 'sources', current.scope.sourceRecords],
      ] as const) {
        const route = `${locale === 'en' ? '/en' : ''}/${slug}/`;
        const document = pages.get(route)!;
        const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-card]')];
        const ids = cards.map((card) => card.dataset.resourceId!);
        expect(ids, `${locale} ${group}`).toHaveLength(count);
        expect(new Set(ids).size).toBe(count);
        expectExactMembers(ids, RESOURCE_INDEX_RECORDS.filter((record) => record.group === group).map((record) => record.planningId));
        catalogIds.push(...ids);
        if (group === 'visuals') expectExactMembers(ids, visualExplainers);
        if (group === 'practice' || group === 'glossary' || group === 'sources') {
          const prefix = { practice: 'pb-', glossary: 'term-', sources: 'src-' }[group];
          expectExactMembers([...document.querySelectorAll(`span[id^="${prefix}"]`)].map((node) => node.id.toUpperCase()), ids);
        }
        for (const card of cards) {
          for (const anchor of card.querySelectorAll('a[href]')) {
            const target = new URL(anchor.getAttribute('href')!, `https://cuda-learning-site.hmzhangxiang.workers.dev${route}`);
            const targetPage = pages.get(target.pathname);
            expect(targetPage, `${route} -> ${target.pathname}`).toBeDefined();
            if (target.hash) expect(targetPage?.getElementById(decodeURIComponent(target.hash.slice(1))), target.href).not.toBeNull();
          }
        }
      }
      expect(catalogIds).toHaveLength(RESOURCE_INDEX_RECORDS.length);
      expect(new Set(catalogIds).size).toBe(RESOURCE_INDEX_RECORDS.length);
      for (const id of [...current.scope.runnableExamples, ...labs]) {
        const document = units.get(id)!.document;
        expect(metadata(document, 'evidence-compilation'), id).toBe(['EX02', 'EX10', 'LAB02'].includes(id) ? 'Compile-Checked' : 'none');
        expect(metadata(document, 'evidence-runtime'), id).toBe(id === 'EX10' ? 'Runtime-Not-Applicable' : 'Pending Hardware Verification');
        expect(metadata(document, 'recorded-observations'), id).toBe('none');
      }
      for (const id of [...r3EvidenceNeutralLearningUnits, ...r4EvidenceNeutralLearningUnits]) {
        for (const suffix of ['', '-EXERCISES', '-SOLUTIONS']) {
          const fields = ['evidence-compilation', 'evidence-runtime', 'recorded-observations'];
          if (id.startsWith('L')) fields.push('expected-observations');
          for (const field of fields) {
            expect(metadata(units.get(`${id}${suffix}`)!.document, field), `${id}${suffix} ${field}`).toBe('none');
          }
        }
      }
      for (const id of visualExplainers) {
        const { href } = PUBLISHED_DESTINATIONS[id];
        const target = new URL(href[locale], 'https://cuda-learning-site.hmzhangxiang.workers.dev');
        expect(pages.has(target.pathname), id).toBe(true);
        if (target.hash) expect(pages.get(target.pathname)?.getElementById(target.hash.slice(1)), id).not.toBeNull();
        else for (const field of ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations']) {
          expect(metadata(pages.get(target.pathname)!, field), `${id} ${field}`).toBe('none');
        }
      }
      const subjectsWith = (field: string, value: string) => [...units].filter(([id, { document }]) =>
        /^(?:EX|LAB)\d{2}$/.test(id) && metadata(document, field) === value).map(([id]) => id);
      expectExactMembers(subjectsWith('evidence-compilation', 'Compile-Checked'), current.evidence.compileChecked);
      expectExactMembers(subjectsWith('evidence-compilation', 'none'), current.evidence.noCompileCheckedClaim);
      expectExactMembers(subjectsWith('evidence-runtime', 'Pending Hardware Verification'), current.evidence.pendingHardwareVerification);
      expectExactMembers(subjectsWith('evidence-runtime', 'Runtime-Not-Applicable'), current.evidence.runtimeNotApplicable);
      expect([...units.keys()].filter((id) => /^P\d{2}$/.test(id)).sort()).toEqual(['P01', 'P02', 'P03']);
      expect(catalogIds.filter((id) => /^PB-R5-/.test(id)).sort()).toEqual(['PB-R5-001', 'PB-R5-002', 'PB-R5-003']);
      expect([...units.keys(), ...catalogIds].some((id) => /^T\d{2}|^PB-R[6-9]-|^LAB13$/.test(id))).toBe(false);
    }
    expect(routes.some((route) => /\/(?:frameworks?|triton)(?:\/|$)/i.test(route))).toBe(false);
    expect(Object.keys(PUBLISHED_DESTINATIONS).filter((id) => /^(?:O|F|M|A|Q|L|P)\d{2}$/.test(id)).sort()).toEqual([...current.scope.learningUnits].sort());
    expect(PUBLISHED_DESTINATIONS).not.toHaveProperty('LAB13');
  }, 30_000);
});
