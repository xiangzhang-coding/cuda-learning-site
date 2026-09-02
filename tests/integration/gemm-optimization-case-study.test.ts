// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const slug = 'gemm-optimization-case-study';
const reviewDate = '2026-09-03';
const sourceCommit = 'd03ff3b27294f77b5f5a0a3b594bebf20a89cf70';
const runnerPath = 'public/assets/exercise-solutions/q13-gemm-candidates.cu';
const runnerSha256 = '00a809be2e2224022f4dce544fd84cba7144a97918a2c0b2a17768054514ecc7';
const fixturePath = 'public/assets/profiler-report-fixtures/q13-nsight-compute.expected.json';
const stageIds = [
  'canonical-16x16x16',
  'k-tile-16x16x8',
  'rectangular-32x8x8',
  'coarsened-32x16x8',
] as const;
const structure = [
  'outcome',
  'prerequisites',
  'canonical-baseline',
  'hypothesis-ledger',
  'measurement-contract',
  'stage-k-tile',
  'stage-output-tile',
  'stage-thread-coarsening',
  'resource-occupancy',
  'traffic-roofline',
  'precision-compiler-architecture',
  'profiler-method',
  'visual-boundary',
  'production-library-boundary',
  'evidence-boundary',
  'retrieval',
  'practice',
  'sources',
] as const;

function frontmatter(source: string) {
  return /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
}

function body(source: string) {
  return /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(source)?.[1] ?? '';
}

function yamlList(metadata: string, field: string, indentation = 0) {
  const fieldIndent = ' '.repeat(indentation);
  const itemIndent = ' '.repeat(indentation + 2);
  const match = new RegExp(`^${fieldIndent}${field}:\\n((?:${itemIndent}- .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function retrievalQuestions(content: string) {
  const section = /## (?:离开前检查|Retrieval check)\n\n([\s\S]*?)(?=\n## )/.exec(content)?.[1] ?? '';
  return section.match(/^\d+\. /gm) ?? [];
}

async function readPage(locale: '' | 'en/', child?: 'exercises' | 'solutions') {
  const suffix = child ? `/${child}.md` : '.mdx';
  return readFile(path.join(docsRoot, `${locale}correctness/${slug}${suffix}`), 'utf8');
}

describe('Q13 controlled GEMM optimization case study', () => {
  it('publishes an aligned evidence-neutral Learning Unit from EX15 and VIS12', async () => {
    const [zh, en] = await Promise.all([readPage(''), readPage('en/')]);
    const pages = [
      [zh, `/en/correctness/${slug}/`, 'en', '', "import CanonicalCode from '../../../components/CanonicalCode.astro';"],
      [en, `/correctness/${slug}/`, 'zh-CN', '/en', "import CanonicalCode from '../../../../components/CanonicalCode.astro';"],
    ] as const;

    for (const [source, counterpart, language, localePrefix, canonicalImport] of pages) {
      const metadata = frontmatter(source);
      const content = body(source);

      expect(metadata).toContain('pairId: q13');
      expect(metadata).toContain('unitId: Q13');
      expect(metadata).toContain('resourceKind: learning-unit');
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'structure')).toEqual(structure);
      expect(yamlList(metadata, 'prerequisites')).toEqual(['A08', 'Q06', 'Q08', 'Q10']);
      expect(yamlList(metadata, 'relatedUnits')).toEqual(['EX15', 'VIS12']);
      expect(yamlList(metadata, 'exampleIds')).toEqual(['EX15']);
      expect(metadata).toContain('canonicalExample: EX15');
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['cpu-reference', 'tiled-gemm']);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-runtime', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:recorded-observations', content: none }");
      expect(metadata.match(/accessDate: '2026-09-03'/g)).toHaveLength(10);
      expect(metadata).toContain("attrs: { name: 'cuda:source-count', content: '10' }");

      expect(content).toContain(canonicalImport);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect([...content.matchAll(/<CanonicalCode exampleId="EX15" range="([^"]+)" \/>/g)].map((match) => match[1]))
        .toEqual(['cpu-reference', 'tiled-gemm']);
      expect(content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
      expect(content).toContain(`https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex15-tiled-gemm`);
      expect(content).toContain(`https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`);
      expect(content).toContain('absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)');
      expect(content).toMatch(/M x K x N|M、K、N/);
      expect(content).toMatch(/FP32[\s\S]{0,180}(?:double CPU|double accumulation|double CPU accumulation)/i);
      for (const stageId of stageIds) expect(content).toContain(stageId);
      for (const coordinate of [/workload/i, /warm-up/i, /cudaDeviceSynchronize/, /median/i]) {
        expect(content).toMatch(coordinate);
      }
      expect(content).toContain('ncu --query-metrics');
      expect(content).toMatch(/permission[\s\S]{0,260}(?:stop|block|停止|阻断)/i);
      expect(content).toMatch(/Environment Manifest|环境清单/);
      expect(content).toMatch(/correctness result|正确性结果/i);
      expect(content).toMatch(/bounded interpretation|有界解释/i);
      expect(content).toMatch(/occupancy/i);
      expect(content).toMatch(/speed score|不是 speed score|not a target to maximize/i);
      expect(content).toMatch(/VIS12[\s\S]{0,500}(?:no|不)[\s\S]{0,160}(?:evidence|证据)/i);
      expect(content).toMatch(/LAB12[\s\S]{0,220}L06|L06[\s\S]{0,220}LAB12/i);
      expect(content).toMatch(/not a production replacement|不是 production replacement/i);
      expect(content).not.toMatch(/cublas(?:Sgemm|GemmEx|LtMatmul)\s*\(/i);
      expect(content).not.toMatch(/\/labs\/(?:gemm|optimize-gemm|lab12)/i);
      expect(content).toContain(`${localePrefix}/correctness/${slug}/exercises/`);
      expect(content).toContain(`${localePrefix}/correctness/${slug}/solutions/`);
      expect(content).toContain('PB-R3-011');
      expect(content).toContain('PB-R3-012');
      expect(retrievalQuestions(content)).toHaveLength(5);
      expect(content).toContain('/websites/nvidia_cuda');
      expect(content).toMatch(/memorized tile|背下来的 tile|背诵/i);
      expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|GB\/s|TB\/s|GFLOP\/s|TFLOP\/s)\b/i);
    }

    expect(yamlList(frontmatter(zh), 'structure')).toEqual(yamlList(frontmatter(en), 'structure'));
    expect(yamlList(frontmatter(zh), 'prerequisites')).toEqual(yamlList(frontmatter(en), 'prerequisites'));
  });

  it('publishes three answer-free Exercises and three separate reviewed solutions', async () => {
    const [zhExercises, enExercises, zhSolutions, enSolutions] = await Promise.all([
      readPage('', 'exercises'),
      readPage('en/', 'exercises'),
      readPage('', 'solutions'),
      readPage('en/', 'solutions'),
    ]);

    for (const [source, counterpart, language] of [
      [zhExercises, `/en/correctness/${slug}/exercises/`, 'en'],
      [enExercises, `/correctness/${slug}/exercises/`, 'zh-CN'],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);
      expect(metadata).toContain('pairId: q13-exercises');
      expect(metadata).toContain('unitId: Q13-EXERCISES');
      expect(metadata).toContain('resourceKind: exercise-set');
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q13']);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect(content.match(/^## (?:练习|Exercise) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      for (const label of [
        /\*\*(?:目标：|Goal:)\*\*/g,
        /\*\*(?:约束：|Constraints:)\*\*/g,
        /\*\*(?:预期证据：|Expected evidence:)\*\*/g,
        /\*\*(?:验收标准：|Acceptance criteria:)\*\*/g,
      ]) expect(content.match(label)).toHaveLength(3);
      expect(content).toContain('q13-gemm-candidates.cu');
      expect(content).toContain('build/q13-gemm-candidates --all-stages --m M --k K --n N --verify tolerance');
      expect(content).toMatch(/memorized tile|背诵|背下来/i);
      expect(content).not.toMatch(/^## (?:解答|Solution)/m);
      expect(content).not.toMatch(/\*\*(?:答案：|Answer:)\*\*/);
    }

    for (const [source, counterpart, language] of [
      [zhSolutions, `/en/correctness/${slug}/solutions/`, 'en'],
      [enSolutions, `/correctness/${slug}/solutions/`, 'zh-CN'],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);
      expect(metadata).toContain('pairId: q13-solutions');
      expect(metadata).toContain('unitId: Q13-SOLUTIONS');
      expect(metadata).toContain('resourceKind: solution-set');
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q13-EXERCISES']);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect(content.match(/^## (?:解答|Solution) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/\*\*(?:复核：|Review:)\*\*/g)).toHaveLength(3);
      expect(content).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
      expect(content).toMatch(/^## (?:常见错误|Common errors)$/m);
      expect(content).toContain(runnerPath);
      expect(content).toContain(runnerSha256);
      expect(content).toMatch(/not a new Runnable Example|不是新的可运行示例/i);
      expect(content).toMatch(/no Evidence Status|不授予[^。]*Evidence Status/i);
    }
  });

  it('ships one exact-hash reviewed runner that reuses the EX15 oracle without measurement code', async () => {
    const [runner, zhSolution, enSolution, fixtureSource] = await Promise.all([
      readFile(path.join(projectRoot, runnerPath)),
      readPage('', 'solutions'),
      readPage('en/', 'solutions'),
      readFile(path.join(projectRoot, fixturePath), 'utf8'),
    ]);
    const source = runner.toString('utf8');
    const sha256 = createHash('sha256').update(runner).digest('hex');

    expect(sha256).toBe(runnerSha256);
    expect(source).toMatch(/^\/\/ SPDX-License-Identifier: Apache-2\.0/);
    expect(source.match(/#include "tiled_gemm_reference\.hpp"/g)).toHaveLength(1);
    expect(source).toContain('ex15::matrix_counts(');
    expect(source).toContain('ex15::kFixtures');
    expect(source).toContain('ex15::make_fixture(');
    expect(source).toContain('ex15::gemm_reference(');
    expect(source).toContain('ex15::verify_tolerance(');
    expect(source).not.toMatch(/namespace\s+ex15\s*\{/);
    for (const stageId of stageIds) expect(source).toContain(`"${stageId}"`);
    for (const kernel of [
      'canonical_16x16x16_kernel',
      'k_tile_16x16x8_kernel',
      'rectangular_32x8x8_kernel',
      'coarsened_32x16x8_kernel',
    ]) expect(source).toContain(`void ${kernel}(`);
    for (const instantiation of [
      'tiled_gemm_candidate_body<16U, 16U, 16U, 1U>',
      'tiled_gemm_candidate_body<16U, 16U, 8U, 1U>',
      'tiled_gemm_candidate_body<32U, 8U, 8U, 1U>',
      'tiled_gemm_candidate_body<32U, 16U, 8U, 2U>',
    ]) expect(source).toContain(instantiation);
    expect(source.match(/__syncthreads\(\)/g)).toHaveLength(2);
    expect(source).toContain('cudaDeviceSynchronize()');
    expect(source).toMatch(/device_c\.get\(\),\s*\n\s*initial_c\.data\(\)/);
    expect(source).not.toMatch(/cudaEvent|chrono|ncu|cuBLAS|Tensor Core|\b(?:timing|metric|speedup|bandwidth|throughput)\b/i);
    for (const publication of [zhSolution, enSolution, fixtureSource]) expect(publication).toContain(sha256);
  });

  it('publishes a sanitized expected-only Q13 fixture with complete per-stage coordinates', async () => {
    const [fixtureSource, licenseSource] = await Promise.all([
      readFile(path.join(projectRoot, fixturePath), 'utf8'),
      readFile(path.join(projectRoot, `${fixturePath}.license.json`), 'utf8'),
    ]);
    const fixture = JSON.parse(fixtureSource);
    const license = JSON.parse(licenseSource);

    expect(fixture).toMatchObject({
      'SPDX-License-Identifier': 'CC-BY-4.0',
      schemaVersion: 1,
      fixtureId: 'Q13-NCU-EXPECTED',
      unitId: 'Q13',
      exampleId: 'EX15',
      sourceCommit,
      provenance: 'original',
      fixtureType: 'expected-only-profiler-report-plan',
      captureStatus: 'pending-hardware-verification',
      recordedObservations: [],
      sanitization: { status: 'passed', reviewDate },
    });
    expect(fixture.workload.matrixShape).toMatchObject({ m: 1024, k: 1024, n: 1024 });
    expect(fixture.workload.dataTypes).toMatchObject({
      a: 'float32',
      b: 'float32',
      cInput: 'float32',
      cOutput: 'float32',
      deviceAccumulation: 'float32',
      cpuReferenceAccumulation: 'float64',
    });
    expect(fixture.workload.stages.map(({ id }: { id: string }) => id)).toEqual(stageIds);
    for (const stage of fixture.workload.stages) {
      for (const field of [
        'tileShape',
        'hypothesis',
        'matrixShape',
        'dataTypes',
        'computeCapability',
        'workload',
        'warmUp',
        'synchronization',
        'statistics',
        'profilerMethod',
        'permissions',
        'environmentManifest',
        'correctnessResult',
        'boundedInterpretation',
      ]) expect(stage[field], `${stage.id}.${field}`).toBeTruthy();
      expect(stage.correctnessResult).toMatch(/expected.*unrecorded/i);
      expect(stage.environmentManifest).toBe('required; use the shared unfilled template below');
      expect(stage.profilerMethod).toMatch(/unique .*_kernel function/i);
    }
    for (const stage of fixture.workload.stages.slice(1)) {
      expect(stage.hypothesis).toMatch(/(?:lower|higher|fall|increase|reduce|half|twice)[\s\S]*(?:reject|unanswered|no answer)/i);
    }
    expect(Object.values(fixture.environmentManifest).every((value) => value === 'unfilled')).toBe(true);
    expect(fixture.method.warmUp).toMatchObject({ count: 3, excludedFromStatistics: true });
    expect(fixture.method.acquisition).toMatchObject({ retainedAttempts: 10, statistic: 'median' });
    expect(fixture.method.runner.sha256).toBe(runnerSha256);
    expect(fixture.captureCommand).toContain('--kernel-name-base function');
    expect(fixture.method.profiler.kernelIdentity).toMatch(/unique named stage-kernel filter/i);
    expect(fixture.workload.stages[1].changedVariables).toMatch(/cooperative-load ownership.*active load instructions.*address groups/i);
    expect(fixture.correctnessGate.comparisonRule).toBe('absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)');
    expect(fixture.correctnessGate.inputConstruction).toMatch(/ex15::kFixtures.*ex15::make_fixture/i);
    expect(fixture.correctnessGate.initialOutput).toMatch(/restore.*C.*nonzero-beta/i);
    expect(fixture.expectedObservations.length).toBeGreaterThanOrEqual(8);
    expect(fixture.claimBoundary).toMatch(/no recorded/i);
    expect(fixture.claimBoundary).toMatch(/no recorded[\s\S]*(?:cuBLAS|Tensor Core)/i);
    expect(JSON.stringify(fixture)).not.toMatch(/"(?:timing|metricValue|speedup|winner)"\s*:/i);
    expect(license).toEqual({
      license: 'CC-BY-4.0',
      provenance: 'original',
      attribution: 'CUDA Learning Site, Xiang Zhang, 2026',
    });
  });
});
