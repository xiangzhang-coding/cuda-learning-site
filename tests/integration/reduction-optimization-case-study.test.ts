// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const slug = 'reduction-optimization-case-study';
const reviewDate = '2026-09-02';
const sourceCommit = '81d43aa7568514e37ef190da59c845b8072b7011';
const runnerPath = 'public/assets/exercise-solutions/q12-reduction-candidates.cu';
const fixturePath = 'public/assets/profiler-report-fixtures/q12-nsight-compute.expected.json';
const stageIds = [
  'canonical-shared-tree',
  'warp-tail-control',
  'reassociated-warp-order',
  'four-load-staging',
] as const;
const structure = [
  'outcome',
  'prerequisites',
  'canonical-baseline',
  'hypothesis-ledger',
  'measurement-contract',
  'stage-divergence-synchronization',
  'stage-numerical-order',
  'stage-memory-traffic',
  'profiler-method',
  'visual-boundary',
  'production-primitive-boundary',
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

describe('Q12 controlled reduction optimization case study', () => {
  it('publishes an aligned evidence-neutral Learning Unit from EX11 and VIS10', async () => {
    const [zh, en] = await Promise.all([readPage(''), readPage('en/')]);
    const pages = [
      [zh, `/en/correctness/${slug}/`, 'en', '', "import CanonicalCode from '../../../components/CanonicalCode.astro';"],
      [en, `/correctness/${slug}/`, 'zh-CN', '/en', "import CanonicalCode from '../../../../components/CanonicalCode.astro';"],
    ] as const;

    for (const [source, counterpart, language, localePrefix, canonicalImport] of pages) {
      const metadata = frontmatter(source);
      const content = body(source);

      expect(metadata).toContain('pairId: q12');
      expect(metadata).toContain('unitId: Q12');
      expect(metadata).toContain('resourceKind: learning-unit');
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'structure')).toEqual(structure);
      expect(yamlList(metadata, 'prerequisites')).toEqual(['A02', 'Q02', 'Q06', 'Q08']);
      expect(yamlList(metadata, 'relatedUnits')).toEqual(['EX11', 'VIS10']);
      expect(yamlList(metadata, 'exampleIds')).toEqual(['EX11']);
      expect(metadata).toContain('canonicalExample: EX11');
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['cpu-reference', 'multi-stage-reduction']);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-runtime', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:recorded-observations', content: none }");

      expect(content).toContain(canonicalImport);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect([...content.matchAll(/<CanonicalCode exampleId="EX11" range="([^"]+)" \/>/g)].map((match) => match[1]))
        .toEqual(['cpu-reference', 'multi-stage-reduction']);
      expect(content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
      expect(content).toContain(`https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex11-multi-stage-reduction`);
      expect(content).toContain(`https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`);
      expect(content).toContain('absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)');
      expect(content).toMatch(/4099\s*(?:->|→)\s*9\s*(?:->|→)\s*1/);
      expect(content).toMatch(/divergence|发散/i);
      expect(content).toMatch(/synchronization|同步/i);
      expect(content).toMatch(/numerical order|数值顺序/i);
      expect(content).toMatch(/memory traffic|内存流量/i);
      for (const stageId of stageIds) expect(content).toContain(stageId);
      expect(content).toMatch(/workload[\s\S]{0,600}warm-up[\s\S]{0,600}(?:synchronization|同步)[\s\S]{0,600}(?:median|中位数)/i);
      expect(content).toContain('ncu --query-metrics');
      expect(content).toMatch(/permission[\s\S]{0,240}(?:stop|block|停止|阻断)/i);
      expect(content).toMatch(/Environment Manifest|环境清单/);
      expect(content).toMatch(/correctness result|正确性结果/i);
      expect(content).toMatch(/bounded interpretation|有界解释/i);
      expect(content).toMatch(/VIS10[\s\S]{0,300}(?:no|不)[\s\S]{0,120}(?:evidence|证据)/i);
      expect(content).toMatch(/LAB11[\s\S]{0,220}L03[\s\S]{0,220}(?:not published|不发布|未发布)/i);
      expect(content).not.toContain('cub::DeviceReduce');
      expect(content).not.toMatch(/\/labs\/(?:reduction|optimize-reduction|lab11)/i);
      expect(content).toContain(`${localePrefix}/correctness/${slug}/exercises/`);
      expect(content).toContain(`${localePrefix}/correctness/${slug}/solutions/`);
      expect(content).toContain('PB-R3-009');
      expect(content).toContain('PB-R3-010');
      expect(retrievalQuestions(content).length).toBeGreaterThanOrEqual(3);
      expect(retrievalQuestions(content).length).toBeLessThanOrEqual(5);
      expect(content).toContain('/websites/nvidia_cuda_cuda-programming-guide');
      expect(content).toContain('/websites/nvidia_nsight-compute_nsightcompute');
      expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|GB\/s|TB\/s|GFLOP\/s|TFLOP\/s)\b/i);
      expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:x|×|%)\s*(?:speedup|faster|提升|加速)/i);
      expect(content).not.toMatch(/(?:is|remains) universally best|(?:是|仍是)通用最优|总是最快/i);
    }

    expect(yamlList(frontmatter(zh), 'structure')).toEqual(yamlList(frontmatter(en), 'structure'));
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
      expect(metadata).toContain('pairId: q12-exercises');
      expect(metadata).toContain('unitId: Q12-EXERCISES');
      expect(metadata).toContain('resourceKind: exercise-set');
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q12']);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect(content.match(/^## (?:练习|Exercise) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      for (const label of [
        /\*\*(?:目标：|Goal:)\*\*/g,
        /\*\*(?:约束：|Constraints:)\*\*/g,
        /\*\*(?:预期证据：|Expected evidence:)\*\*/g,
        /\*\*(?:验收标准：|Acceptance criteria:)\*\*/g,
      ]) expect(content.match(label)).toHaveLength(3);
      expect(content).toContain('q12_reduction_candidates.cu');
      expect(content).toContain('build/q12-reduction-candidates --all-stages --elements ELEMENTS --verify tolerance');
      expect(content).not.toMatch(/^## (?:解答|Solution)/m);
      expect(content).not.toMatch(/\*\*(?:答案：|Answer:)\*\*/);
    }

    for (const [source, counterpart, language] of [
      [zhSolutions, `/en/correctness/${slug}/solutions/`, 'en'],
      [enSolutions, `/correctness/${slug}/solutions/`, 'zh-CN'],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);
      expect(metadata).toContain('pairId: q12-solutions');
      expect(metadata).toContain('unitId: Q12-SOLUTIONS');
      expect(metadata).toContain('resourceKind: solution-set');
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q12-EXERCISES']);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect(content.match(/^## (?:解答|Solution) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/\*\*(?:复核：|Review:)\*\*/g)).toHaveLength(3);
      expect(content).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
      expect(content).toMatch(/^## (?:常见错误|Common errors)$/m);
      expect(content).toContain(runnerPath);
      expect(content).toMatch(/[0-9a-f]{64}/);
      expect(content).toMatch(/not a new Runnable Example|不是新的(?:可运行示例（Runnable Example）| Runnable Example)/i);
      expect(content).toMatch(/no Evidence Status|不授予[^。]*Evidence Status/i);
    }
  });

  it('ships one exact-hash reviewed runner that reuses the EX11 oracle without timing', async () => {
    const [runner, zhSolution, enSolution] = await Promise.all([
      readFile(path.join(projectRoot, runnerPath)),
      readPage('', 'solutions'),
      readPage('en/', 'solutions'),
    ]);
    const source = runner.toString('utf8');
    const sha256 = createHash('sha256').update(runner).digest('hex');

    expect(source).toMatch(/^\/\/ SPDX-License-Identifier: Apache-2\.0/);
    expect(source.match(/#include "multi_stage_reduction_reference\.hpp"/g)).toHaveLength(1);
    expect(source).toContain('ex11::initialize_input(');
    expect(source).toContain('ex11::cpu_reference_sum(');
    expect(source).toContain('ex11::compare_reduction_sum(');
    expect(source).not.toMatch(/namespace\s+ex11\s*\{/);
    for (const stageId of stageIds) expect(source).toContain(`"${stageId}"`);
    expect(source).toContain('__syncthreads()');
    expect(source).toContain('__syncwarp(');
    expect(source).toContain('__shfl_down_sync(');
    expect(source).toContain('__shfl_xor_sync(');
    expect(source.match(/if \(\(thread & \(active_span - 1U\)\) == 0U\) value \+= partner;/g)).toHaveLength(2);
    expect(source).toMatch(/kFourLoadsPerThread\s*=\s*4U/);
    expect(source).toContain('cudaDeviceSynchronize()');
    expect(source).not.toMatch(/cudaEvent|chrono|\b(?:timing|metric|speedup|bandwidth|throughput)\b/i);
    for (const solution of [zhSolution, enSolution]) {
      expect(solution).toContain(sha256);
      expect(solution).toContain('/assets/exercise-solutions/q12-reduction-candidates.cu');
    }
  });

  it('publishes a sanitized expected-only Q12 profiler fixture with a complete per-stage method', async () => {
    const [fixtureSource, licenseSource] = await Promise.all([
      readFile(path.join(projectRoot, fixturePath), 'utf8'),
      readFile(path.join(projectRoot, `${fixturePath}.license.json`), 'utf8'),
    ]);
    const fixture = JSON.parse(fixtureSource);
    const license = JSON.parse(licenseSource);

    expect(fixture).toMatchObject({
      'SPDX-License-Identifier': 'CC-BY-4.0',
      schemaVersion: 1,
      fixtureId: 'Q12-NCU-EXPECTED',
      unitId: 'Q12',
      exampleId: 'EX11',
      sourceCommit,
      provenance: 'original',
      fixtureType: 'expected-only-profiler-report-plan',
      captureStatus: 'pending-hardware-verification',
      recordedObservations: [],
      sanitization: { status: 'passed', reviewDate },
    });
    expect(fixture.workload.elementCount).toBe(16777219);
    expect(fixture.workload.stages.map(({ id }: { id: string }) => id)).toEqual(stageIds);
    for (const stage of fixture.workload.stages) {
      expect(Object.keys(stage)).toEqual([
        'id',
        'changedVariables',
        'hypothesis',
        'workload',
        'warmUp',
        'synchronization',
        'statistics',
        'profilerMethod',
        'permissions',
        'environmentManifest',
        'correctnessResult',
        'boundedInterpretation',
      ]);
      expect(stage.correctnessResult).toMatch(/expected.*unrecorded/i);
      expect(stage.environmentManifest).toBe('required; use the shared unfilled template below');
    }
    for (const stage of fixture.workload.stages.slice(1)) {
      expect(stage.hypothesis).toMatch(/(?:lower|higher|differ)[\s\S]*(?:reject|no answer)/i);
    }
    expect(Object.values(fixture.environmentManifest).every((value) => value === 'unfilled')).toBe(true);
    expect(fixture.method.warmUp).toMatchObject({ count: 3, excludedFromStatistics: true });
    expect(fixture.method.acquisition).toMatchObject({ retainedAttempts: 10, statistic: 'median' });
    expect(fixture.method).toHaveProperty('profiler');
    expect(fixture.method).toHaveProperty('permissions');
    expect(fixture.correctnessGate.comparisonRule).toBe('absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)');
    expect(fixture.expectedObservations.length).toBeGreaterThanOrEqual(4);
    expect(fixture.claimBoundary).toMatch(/no recorded/i);
    expect(JSON.stringify(fixture)).not.toMatch(/"(?:timing|metricValue|speedup|winner)"\s*:/i);
    expect(license).toEqual({
      license: 'CC-BY-4.0',
      provenance: 'original',
      attribution: 'CUDA Learning Site, Xiang Zhang, 2026',
    });
  });
});
