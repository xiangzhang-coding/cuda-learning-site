// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const slug = 'transpose-optimization-case-study';
const reviewDate = '2026-09-02';
const runnerAssetUrl = '/assets/exercise-solutions/q11-lab10-transpose-candidates.cu';
const runnerRepositoryPath = 'public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu';
const runnerSha256 = '920a4ca6f44586a3882e31756fca3e28feb655282327721e3fb3a308bac3f251';
const runnerBuildCommand = [
  'nvcc',
  '--std=c++17',
  '--generate-code=arch=compute_75,code=sm_75',
  '--generate-code=arch=compute_75,code=compute_75',
  '--include-path examples/ex14-tiled-transpose/include',
  runnerRepositoryPath,
  '--output-file build/lab10-transpose-candidates',
].join(' ');
const prerequisites = ['A05', 'Q06', 'Q08', 'Q10'];
const relatedUnits = ['EX14', 'VIS11', 'LAB10'];
const canonicalRanges = ['cpu-reference', 'tiled-transpose'];
const structure = [
  'outcome',
  'prerequisites',
  'canonical-baseline',
  'hypothesis-ledger',
  'comparability-contract',
  'workload-measurement-contract',
  'stage-coalescing',
  'stage-tiling',
  'stage-bank-layout',
  'metric-query-replay-permission',
  'traffic-roofline',
  'visual-boundary',
  'evidence-boundary',
  'retrieval',
  'practice',
  'sources',
] as const;
const sourceUrls = [
  'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#matrix-transpose-example-using-shared-memory',
  'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#shared-memory-access-patterns',
  'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#assess-parallelize-optimize-deploy',
  'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#bandwidth',
  'https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html',
  'https://docs.nvidia.com/nsight-compute/NsightComputeCli/index.html',
] as const;
const treeUrl = 'https://github.com/xiangzhang-coding/cuda-learning-site/tree/981939cc705faf721ac06d1b70f2c5c4a8111e92/examples/ex14-tiled-transpose';
const archiveUrl = 'https://github.com/xiangzhang-coding/cuda-learning-site/archive/981939cc705faf721ac06d1b70f2c5c4a8111e92.zip';

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

function sourceCoordinates(metadata: string) {
  return [...metadata.matchAll(/^\s+- title: '([^']+)'\n\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm)]
    .map(([, title, url, version, platform, accessDate]) => ({ title, url, version, platform, accessDate }));
}

function retrievalQuestions(content: string) {
  const section = /## (?:离开前检查|Retrieval check)\n\n([\s\S]*?)(?=\n## )/.exec(content)?.[1] ?? '';
  return section.match(/^\d+\. /gm) ?? [];
}

function occurrences(content: string, value: string) {
  return content.split(value).length - 1;
}

function normalizeShellCommand(source: string) {
  return source.replace(/\\\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

async function readPage(locale: '' | 'en/', child?: 'exercises' | 'solutions') {
  const suffix = child ? `/${child}.md` : '.mdx';
  return readFile(path.join(docsRoot, `${locale}correctness/${slug}${suffix}`), 'utf8');
}

describe('Q11 controlled transpose optimization case study', () => {
  it('publishes an aligned evidence-neutral Learning Unit Publication Pair', async () => {
    const [zh, en] = await Promise.all([readPage(''), readPage('en/')]);
    const pages = [
      {
        source: zh,
        counterpart: `/en/correctness/${slug}/`,
        counterpartLanguage: 'en',
        localePrefix: '',
        canonicalImport: "import CanonicalCode from '../../../components/CanonicalCode.astro';",
      },
      {
        source: en,
        counterpart: `/correctness/${slug}/`,
        counterpartLanguage: 'zh-CN',
        localePrefix: '/en',
        canonicalImport: "import CanonicalCode from '../../../../components/CanonicalCode.astro';",
      },
    ] as const;

    for (const { source, counterpart, counterpartLanguage, localePrefix, canonicalImport } of pages) {
      const metadata = frontmatter(source);
      const content = body(source);
      const expectedObservations = yamlList(metadata, 'expectedObservations', 2);
      const coordinates = sourceCoordinates(metadata);

      expect(metadata).toContain('pairId: q11');
      expect(metadata).toContain('unitId: Q11');
      expect(metadata).toContain('resourceKind: learning-unit');
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'structure')).toEqual(structure);
      expect(yamlList(metadata, 'prerequisites')).toEqual(prerequisites);
      expect(yamlList(metadata, 'relatedUnits')).toEqual(relatedUnits);
      expect(yamlList(metadata, 'exampleIds')).toEqual(['EX14']);
      expect(metadata).toContain('canonicalExample: EX14');
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(canonicalRanges);
      expect(metadata).toContain('hardwareGate: none');
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(expectedObservations).toEqual([]);
      expect(metadata).toContain("attrs: { name: 'cuda:pair-id', content: q11 }");
      expect(metadata).toContain(`attrs: { name: 'cuda:counterpart', content: '${counterpart}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:fact-check-date', content: '${reviewDate}' }`);
      expect(metadata).toContain("attrs: { name: 'cuda:license', content: CC-BY-4.0 }");
      expect(metadata).toContain("attrs: { name: 'cuda:provenance', content: original }");
      expect(metadata).toContain(`attrs: { name: 'cuda:structure', content: '${structure.join(',')}' }`);
      expect(metadata).toContain("attrs: { name: 'cuda:resource-kind', content: learning-unit }");
      expect(metadata).toContain("attrs: { name: 'cuda:unit-id', content: Q11 }");
      expect(metadata).toContain(`attrs: { name: 'cuda:prerequisites', content: '${prerequisites.join(',')}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:related-units', content: '${relatedUnits.join(',')}' }`);
      expect(metadata).toContain("attrs: { name: 'cuda:example-ids', content: EX14 }");
      expect(metadata).toContain("attrs: { name: 'cuda:canonical-example', content: EX14 }");
      expect(metadata).toContain(`attrs: { name: 'cuda:canonical-ranges', content: '${canonicalRanges.join(',')}' }`);
      expect(metadata).toContain("attrs: { name: 'cuda:hardware-gate', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-compilation', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-runtime', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:expected-observations', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:recorded-observations', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:source-count', content: '6' }");
      expect(metadata).toContain("attrs: { name: 'cuda:source-versions', content: '13.3,2026.2.1' }");

      expect(content).toContain(canonicalImport);
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${counterpartLanguage}">`);
      expect([...content.matchAll(/<CanonicalCode exampleId="EX14" range="([^"]+)" \/>/g)].map((match) => match[1])).toEqual(canonicalRanges);
      expect(content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
      expect(occurrences(content, treeUrl)).toBe(1);
      expect(occurrences(content, archiveUrl)).toBe(1);
      expect(content).toContain('output[col * rows + row] = input[row * columns + col]');
      for (const fixture of ['5x7', '33x35', '64x32', '4096x4096']) expect(content).toContain(fixture);
      for (const invariant of [
        'stable device output allocation',
        'quiet-NaN sentinel',
        'checked host-to-device copy',
        'checked device-to-host copy',
        'no sentinel remains',
      ]) expect(content).toContain(invariant);
      expect(content).toMatch(/finite,? non-NaN deterministic input(?: and |\/)oracle|finite、non-NaN deterministic input\/oracle/i);
      expect(content).toMatch(/correctness, warm-up, and profiled process|correctness、warm-up 与 profiled process/i);
      expect(content).toMatch(/same allocation and address|同一 allocation\/address/i);
      expect(content).toMatch(/outside the selected kernel metrics|selected kernel metrics 之外/i);

      const orderedSections = [
        /## (?:先建立 EX14 精确正确性基线|Establish the EX14 exact-correctness baseline first)/,
        /## (?:Hypothesis ledger|假设台账)/i,
        /## (?:Stage 1|阶段 1).*(?:coalescing)/i,
        /## (?:Stage 2|阶段 2).*(?:tiling)/i,
        /## (?:Stage 3|阶段 3).*(?:bank layout|bank-layout|padding)/i,
      ].map((pattern) => content.search(pattern));
      expect(orderedSections.every((position) => position >= 0)).toBe(true);
      expect(orderedSections).toEqual([...orderedSections].sort((a, b) => a - b));

      expect(content).toMatch(/baseline.{0,120}candidate|基线.{0,120}候选/is);
      expect(content).toMatch(/one primary variable at a time|一次只改变一个 primary variable/i);
      expect(content).toMatch(/workload.{0,500}(?:shape|形状).{0,500}(?:warm-up).{0,500}(?:synchronization|同步).{0,500}(?:raw samples|原始样本).{0,500}(?:statistic|统计量)/is);
      expect(content).toContain('ncu --query-metrics');
      expect(content).toMatch(/exact GPU|精确 GPU/i);
      expect(content).toMatch(/permission.{0,180}(?:stop|停止)|权限.{0,180}(?:stop|停止)/is);
      expect(content).toMatch(/replay.{0,300}(?:different execution|re-execut|不同执行|重新执行)/is);
      expect(content).toContain('I_DRAM = W / T_DRAM');
      expect(content).toContain('P_roof(I) = min(P_compute, I * B_path)');
      expect(content).toMatch(/Q10.{0,800}(?:traffic|流量).{0,800}(?:Roofline)/is);
      expect(content).toMatch(/VIS11.{0,500}(?:arithmetic only|仅.*算术|地址算术).{0,500}(?:no|不).{0,120}(?:evidence|证据)/is);
      expect(content).toMatch(/Q11[\s\S]{0,320}(?:grants no Evidence Status|不授予 Evidence Status)/i);
      expect(content).toMatch(/EX14[\s\S]{0,240}LAB10[\s\S]{0,240}Pending Hardware Verification/i);
      expect(content).toContain(`${localePrefix}/correctness/${slug}/exercises/`);
      expect(content).toContain(`${localePrefix}/correctness/${slug}/solutions/`);
      expect(content).toContain(`${localePrefix}/labs/optimize-canonical-transpose/`);
      expect(content).toContain('PB-R3-007');
      expect(content).toContain('PB-R3-008');
      expect(retrievalQuestions(content)).toHaveLength(5);

      expect(coordinates.map(({ url }) => url)).toEqual(sourceUrls);
      expect(coordinates.every(({ accessDate }) => accessDate === reviewDate)).toBe(true);
      expect(coordinates.some(({ version }) => version === 'CUDA Programming Guide v13.3')).toBe(true);
      expect(coordinates.some(({ version }) => version === 'CUDA C++ Best Practices Guide v13.3')).toBe(true);
      expect(coordinates.filter(({ version }) => version === 'NVIDIA Nsight Compute 2026.2.1')).toHaveLength(2);
      for (const { url } of coordinates) expect(content).toContain(`](${url})`);
      expect(content).toContain('/websites/nvidia_cuda_cuda-programming-guide');
      expect(content).toContain('/websites/nvidia_nsight-compute_nsightcompute');
      expect(content).toMatch(/no NVIDIA (?:owner )?code, table, or figure|未复制 NVIDIA (?:owner )?code、table 或 figure/i);

      expect(content).not.toMatch(/\b(?:A100|H100|B100|GB200|RTX\s*\d+)\b/);
      expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|GB\/s|TB\/s|GFLOP\/s|TFLOP\/s)\b/i);
      expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:x|×|%)\s*(?:speedup|faster|提升|加速)/i);
      expect(content).not.toMatch(/(?:fixed|universal|always|guaranteed) best tile size|固定最佳 tile size|通用最佳 tile size/i);
      expect(content).not.toMatch(/!\[[^\]]*\]\([^)]*\)/);
    }

    expect(yamlList(frontmatter(zh), 'structure')).toEqual(yamlList(frontmatter(en), 'structure'));
    expect(yamlList(frontmatter(zh), 'expectedObservations', 2)).toHaveLength(yamlList(frontmatter(en), 'expectedObservations', 2).length);
    expect(sourceCoordinates(frontmatter(zh))).toEqual(sourceCoordinates(frontmatter(en)));
  });

  it('publishes exactly three answer-free transfer tasks with two layered hints each', async () => {
    const [zh, en] = await Promise.all([readPage('', 'exercises'), readPage('en/', 'exercises')]);

    for (const [source, counterpart, language] of [
      [zh, `/en/correctness/${slug}/exercises/`, 'en'],
      [en, `/correctness/${slug}/exercises/`, 'zh-CN'],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);

      expect(metadata).toContain('pairId: q11-exercises');
      expect(metadata).toContain('unitId: Q11-EXERCISES');
      expect(metadata).toContain('resourceKind: exercise-set');
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'structure')).toEqual(['prerequisites', 'instructions', 'exercise-1', 'exercise-2', 'exercise-3', 'next']);
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q11']);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(metadata).toContain("attrs: { name: 'cuda:pair-id', content: q11-exercises }");
      expect(metadata).toContain(`attrs: { name: 'cuda:counterpart', content: '${counterpart}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:fact-check-date', content: '${reviewDate}' }`);
      expect(metadata).toContain("attrs: { name: 'cuda:license', content: CC-BY-4.0 }");
      expect(metadata).toContain("attrs: { name: 'cuda:provenance', content: original }");
      expect(metadata).toContain("attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }");
      expect(metadata).toContain("attrs: { name: 'cuda:resource-kind', content: exercise-set }");
      expect(metadata).toContain("attrs: { name: 'cuda:unit-id', content: Q11-EXERCISES }");
      expect(metadata).toContain("attrs: { name: 'cuda:prerequisites', content: Q11 }");
      expect(metadata).toContain("attrs: { name: 'cuda:hardware-gate', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-compilation', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-runtime', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:expected-observations', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:recorded-observations', content: none }");
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect(content).toMatch(/transfer tasks|迁移任务/i);
      expect(content.match(/^## (?:练习|Exercise) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      for (const label of [
        /\*\*(?:目标：|Goal:)\*\*/g,
        /\*\*(?:约束：|Constraints:)\*\*/g,
        /\*\*(?:预期证据：|Expected evidence:)\*\*/g,
        /\*\*(?:验收标准：|Acceptance criteria:)\*\*/g,
      ]) expect(content.match(label)).toHaveLength(3);
      expect(content).toMatch(/invalid.{0,180}EX14.{0,180}baseline.{0,180}hypothesis ledger|无效.{0,180}EX14.{0,180}baseline.{0,180}hypothesis ledger/is);
      expect(content).toMatch(/coalescing.{0,300}tiling.{0,300}(?:one primary variable|一个 primary variable)/is);
      expect(content).toContain('lab10_transpose_candidates.cu');
      expect(content).toContain('build/lab10-transpose-candidates --all-stages --rows ROWS --columns COLUMNS --verify exact');
      expect(content).toMatch(/learner-owned source[\s\S]{0,500}adjacent-stage diffs[\s\S]{0,500}C\+\+17 build[\s\S]{0,500}SHA-256/i);
      expect(content).toMatch(/source\/build\/hash packet[\s\S]{0,180}LAB10/i);
      const exercise2 = /## (?:练习|Exercise) 2[:：][\s\S]*?(?=\n## (?:练习|Exercise) 3[:：])/.exec(content)?.[0] ?? '';
      const goal = /\*\*(?:目标：|Goal:)\*\* ([^\n]+)/.exec(exercise2)?.[1] ?? '';
      const constraints = /\*\*(?:约束：|Constraints:)\*\* ([^\n]+)/.exec(exercise2)?.[1] ?? '';
      const expected = /\*\*(?:预期证据：|Expected evidence:)\*\* ([^\n]+)/.exec(exercise2)?.[1] ?? '';
      const acceptance = /\*\*(?:验收标准：|Acceptance criteria:)\*\* ([^\n]+)/.exec(exercise2)?.[1] ?? '';
      expect(goal).toContain('stable device output allocation');
      for (const invariant of [
        'quiet-NaN sentinel',
        'checked host-to-device copy',
        'checked device-to-host copy',
        'no sentinel remains',
      ]) expect(constraints).toContain(invariant);
      expect(constraints).toMatch(/correctness, warm-up, and profiled process|correctness、warm-up 与 profiled process/i);
      expect(expected).toMatch(/stable allocation(?: and |\/)address|stable allocation\/address/i);
      expect(expected).toMatch(/sentinel fill\/copy statuses/i);
      expect(acceptance).toMatch(/allocates output once|只分配一次 output/i);
      expect(acceptance).toMatch(/no sentinel remain(?:s|ing)/i);
      expect(content).toMatch(/bank(?:-| )layout.{0,300}profil(?:e|er).{0,300}competing explanations|bank layout.{0,300}profil(?:e|er).{0,300}竞争解释/is);
      expect(content).not.toMatch(/^## (?:解答|Solution)/m);
      expect(content).not.toMatch(/\*\*(?:答案：|Answer:)\*\*/);
      expect(content).not.toMatch(/\b(?:A100|H100|B100|GB200|RTX\s*\d+)\b/);
    }

    expect(yamlList(frontmatter(zh), 'structure')).toEqual(yamlList(frontmatter(en), 'structure'));
  });

  it('publishes exactly three reviewed solutions with alternatives and common errors', async () => {
    const [zh, en] = await Promise.all([readPage('', 'solutions'), readPage('en/', 'solutions')]);

    for (const [source, counterpart, language] of [
      [zh, `/en/correctness/${slug}/solutions/`, 'en'],
      [en, `/correctness/${slug}/solutions/`, 'zh-CN'],
    ] as const) {
      const metadata = frontmatter(source);
      const content = body(source);

      expect(metadata).toContain('pairId: q11-solutions');
      expect(metadata).toContain('unitId: Q11-SOLUTIONS');
      expect(metadata).toContain('resourceKind: solution-set');
      expect(metadata).toContain(`counterpart: ${counterpart}`);
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'structure')).toEqual(['review', 'solution-1', 'solution-2', 'solution-3', 'valid-alternatives', 'common-errors']);
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q11-EXERCISES']);
      expect(metadata).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(metadata).toContain("attrs: { name: 'cuda:pair-id', content: q11-solutions }");
      expect(metadata).toContain(`attrs: { name: 'cuda:counterpart', content: '${counterpart}' }`);
      expect(metadata).toContain(`attrs: { name: 'cuda:fact-check-date', content: '${reviewDate}' }`);
      expect(metadata).toContain("attrs: { name: 'cuda:license', content: CC-BY-4.0 }");
      expect(metadata).toContain("attrs: { name: 'cuda:provenance', content: original }");
      expect(metadata).toContain("attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }");
      expect(metadata).toContain("attrs: { name: 'cuda:resource-kind', content: solution-set }");
      expect(metadata).toContain("attrs: { name: 'cuda:unit-id', content: Q11-SOLUTIONS }");
      expect(metadata).toContain("attrs: { name: 'cuda:prerequisites', content: Q11-EXERCISES }");
      expect(metadata).toContain("attrs: { name: 'cuda:hardware-gate', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-compilation', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:evidence-runtime', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:expected-observations', content: none }");
      expect(metadata).toContain("attrs: { name: 'cuda:recorded-observations', content: none }");
      expect(content).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${language}">`);
      expect(content.match(/^## (?:解答|Solution) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/\*\*(?:复核：|Review:)\*\*/g)).toHaveLength(3);
      expect(content).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
      expect(content).toMatch(/^## (?:常见错误|Common errors)$/m);
      expect(content).toMatch(/复核日期：\*\*2026-09-02\*\*|Reviewed: \*\*2026-09-02\*\*/);
      expect(content).toMatch(/reject|rejected|拒绝/i);
      expect(content).toMatch(/one primary variable at a time|一次只改变一个 primary variable/i);
      expect(content).toMatch(/competing explanation|竞争解释/i);
      const solution2 = /## (?:解答|Solution) 2[:：][\s\S]*?(?=\n## (?:解答|Solution) 3[:：])/.exec(content)?.[0] ?? '';
      for (const invariant of [
        'stable device output allocation',
        'quiet-NaN sentinel',
        'checked host-to-device copy',
        'checked device-to-host copy',
        'no sentinel remains',
      ]) expect(solution2).toContain(invariant);
      expect(solution2).toMatch(/sequential stage(?: to)? false-pass|sequential stage false-pass 的路径/i);
      expect(content).not.toMatch(/\b(?:A100|H100|B100|GB200|RTX\s*\d+)\b/);
      expect(content).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|GB\/s|TB\/s|GFLOP\/s|TFLOP\/s)\b/i);
    }

    expect(yamlList(frontmatter(zh), 'structure')).toEqual(yamlList(frontmatter(en), 'structure'));
  });

  it('publishes one exact-hash reviewed runner only after the learner attempt', async () => {
    const [runner, zhMain, enMain, zhExercise, enExercise, zhSolution, enSolution] = await Promise.all([
      readFile(path.join(projectRoot, runnerRepositoryPath)),
      readPage(''),
      readPage('en/'),
      readPage('', 'exercises'),
      readPage('en/', 'exercises'),
      readPage('', 'solutions'),
      readPage('en/', 'solutions'),
    ]);

    expect(createHash('sha256').update(runner).digest('hex')).toBe(runnerSha256);

    for (const source of [zhMain, enMain, zhExercise, enExercise]) {
      expect(source).toContain(`/correctness/${slug}/solutions/`);
      expect(source).toMatch(/(?:先完成|完成自己的|after|before)[\s\S]{0,240}(?:Solution 2|解答|reviewed solution)/i);
    }

    for (const source of [zhSolution, enSolution]) {
      const solution2 = /## (?:解答|Solution) 2[:：][\s\S]*?(?=\n## (?:解答|Solution) 3[:：])/.exec(source)?.[0] ?? '';
      const buildBlock = /```bash\n([\s\S]*?)```/.exec(solution2)?.[1] ?? '';

      expect(solution2).toContain(runnerAssetUrl);
      expect(solution2).toContain(runnerRepositoryPath);
      expect(solution2).toContain(runnerSha256);
      expect(normalizeShellCommand(buildBlock)).toBe(runnerBuildCommand);
      for (const lane of ['cuda-11.8', 'cuda-12.9', 'cuda-13.3']) expect(solution2).toContain(lane);
      expect(solution2).toMatch(/one reviewed solution|一份 reviewed solution/i);
      expect(solution2).toMatch(/not a second canonical EX14|不是第二份 canonical EX14/i);
      expect(solution2).toMatch(/not a new Runnable Example|不是新的 Runnable Example/i);
      expect(solution2).toMatch(/never executes|(?:绝)?不执行/i);
      expect(solution2).toMatch(/no Evidence Status|不授予[^。]*Evidence Status/i);
      expect(solution2).toMatch(/(?:learner(?:-authored)? alternative|替代实现)[\s\S]{0,240}(?:interface|CLI)[\s\S]{0,240}(?:adjacent-stage diff|adjacent comparisons)[\s\S]{0,240}hash/i);
    }
  });
});
