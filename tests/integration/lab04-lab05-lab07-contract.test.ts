// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const reviewDate = '2026-08-28';
const toolkitLanes = ['cuda-11.8', 'cuda-12.9', 'cuda-13.3'] as const;

type LocalePrefix = '' | 'en/';

type LabContract = {
  id: 'LAB04' | 'LAB05' | 'LAB07';
  pairId: 'lab04' | 'lab05' | 'lab07';
  slug: string;
  prerequisites: readonly string[];
  example: 'EX05' | 'EX06' | 'EX16';
  ranges: readonly string[];
  toolPatterns: readonly RegExp[];
  correctnessPatterns: readonly RegExp[];
  expectationTerms: readonly string[];
  rawRecordPattern: RegExp;
  componentVersionPattern: RegExp;
};

const ex16Ranges = [
  'memcheck-defect',
  'memcheck-corrected',
  'racecheck-defect',
  'racecheck-corrected',
  'initcheck-defect',
  'initcheck-corrected',
  'synccheck-defect',
  'synccheck-corrected',
] as const;

const labs: readonly LabContract[] = [
  {
    id: 'LAB04',
    pairId: 'lab04',
    slug: 'observe-coalescing',
    prerequisites: ['M02', 'Q05'],
    example: 'EX05',
    ranges: ['access-kernel', 'scenario-loop'],
    toolPatterns: [
      /Nsight Compute/i,
      /(?:^|[^a-z])ncu(?:[^a-z]|$)/i,
      /performance counter.{0,120}permission|permission.{0,120}performance counter/is,
    ],
    correctnessPatterns: [
      /CPU reference/i,
      /contiguous/i,
      /misaligned/i,
      /strided/i,
      /exact comparison|compare.{0,80}exact|精确比较/is,
    ],
    expectationTerms: ['contiguous', 'misaligned', 'strided'],
    rawRecordPattern: /raw_measurements|raw profiler measurements?|原始.{0,20}(?:profiler )?测量/is,
    componentVersionPattern: /nsight_compute_version|Nsight Compute.{0,80}version|Nsight Compute.{0,80}版本/is,
  },
  {
    id: 'LAB05',
    pairId: 'lab05',
    slug: 'remove-shared-memory-bank-conflicts',
    prerequisites: ['M04', 'Q05'],
    example: 'EX06',
    ranges: ['shared-layouts', 'tiled-kernels'],
    toolPatterns: [
      /Nsight Compute/i,
      /(?:^|[^a-z])ncu(?:[^a-z]|$)/i,
      /performance counter.{0,120}permission|permission.{0,120}performance counter/is,
    ],
    correctnessPatterns: [
      /CPU reference/i,
      /unpadded/i,
      /padded/i,
      /same (?:logical )?(?:outputs?|results?)|相同.{0,20}(?:输出|结果)/is,
      /bank conflicts?|存储体冲突/i,
    ],
    expectationTerms: ['unpadded', 'padded'],
    rawRecordPattern: /raw_measurements|raw profiler measurements?|原始.{0,20}(?:profiler )?测量/is,
    componentVersionPattern: /nsight_compute_version|Nsight Compute.{0,80}version|Nsight Compute.{0,80}版本/is,
  },
  {
    id: 'LAB07',
    pairId: 'lab07',
    slug: 'diagnose-four-sanitizer-failures',
    prerequisites: ['Q03', 'Q04'],
    example: 'EX16',
    ranges: ex16Ranges,
    toolPatterns: [
      /Compute Sanitizer/i,
      /compute-sanitizer/i,
      /memcheck[\s\S]*racecheck[\s\S]*initcheck[\s\S]*synccheck/i,
      /memcheck.{0,300}(?:first|before|先运行|优先)/is,
    ],
    correctnessPatterns: [
      /defect.{0,240}corrected|缺陷.{0,240}修复/is,
      /CPU reference|host reference|CPU 参考|host 参考/i,
      /one scenario per process|每个进程.{0,20}一个 scenario/is,
    ],
    expectationTerms: ['memcheck', 'racecheck', 'initcheck', 'synccheck'],
    rawRecordPattern: /raw_(?:sanitizer|tool)_(?:logs|reports)|raw (?:sanitizer|tool) (?:logs|reports)|原始.{0,20}(?:sanitizer|工具).{0,20}(?:日志|报告)/is,
    componentVersionPattern: /compute_sanitizer_version|Compute Sanitizer.{0,80}version|Compute Sanitizer.{0,80}版本/is,
  },
] as const;

async function readLab(localePrefix: LocalePrefix, slug: string) {
  return readFile(path.join(docsRoot, `${localePrefix}labs/${slug}.mdx`), 'utf8');
}

function frontmatter(source: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function body(source: string) {
  const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(source);
  expect(match).not.toBeNull();
  return (match?.[1] ?? '').trimStart();
}

function yamlScalar(metadata: string, field: string) {
  const match = new RegExp(`^${field}: (?:'([^']*)'|"([^"]*)"|(.+))$`, 'm').exec(metadata);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function yamlList(metadata: string, field: string) {
  if (new RegExp(`^${field}: \\[\\]$`, 'm').test(metadata)) return [];
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function evidenceList(metadata: string, field: string) {
  if (new RegExp(`^  ${field}: \\[\\]$`, 'm').test(metadata)) return [];
  const match = new RegExp(`^  ${field}:\\n((?:    - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function projectedMetadata(metadata: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `attrs: \\{ name: '${escaped}', content: (?:'([^']*)'|([^ }]+)) \\}`,
  ).exec(metadata);
  return match?.[1] ?? match?.[2];
}

function sourceCoordinates(metadata: string) {
  return [
    ...metadata.matchAll(
      /^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm,
    ),
  ].map(([, url, version, platform, accessDate]) => ({
    url,
    version,
    platform,
    accessDate,
  }));
}

function assertCompleteManifest(source: string, componentVersionPattern: RegExp) {
  const fieldPatterns = [
    /observation_date/i,
    /gpu_identity/i,
    /compute_capability/i,
    /gpu_count/i,
    /driver/i,
    /toolkit_lane/i,
    /nvcc/i,
    /host_compiler/i,
    /operating_system/i,
    /workload|scenarios?/i,
    /memory/i,
    /permissions/i,
    /exact_commands/i,
    /correctness_(?:method|oracle)/i,
    /correctness_criteria|criteria_result/i,
    /measurement_(?:method|details)/i,
  ];

  expect(source).toMatch(/Environment Manifest|环境清单/i);
  for (const pattern of fieldPatterns) expect(source, pattern.source).toMatch(pattern);
  expect(source).toMatch(componentVersionPattern);
}

function assertCompletePerformanceManifest(source: string) {
  const fieldPatterns = [
    /cuda_runtime/i,
    /source_repository/i,
    /binary_sha256/i,
    /build_contract/i,
    /operating_system: <fill [^\n]*kernel>/i,
    /topology/i,
    /memory: <fill device and host/i,
    /input_generation/i,
    /device_access_state/i,
    /concurrent_load/i,
    /clock_power_thermal/i,
    /statistics/i,
    /custody/i,
  ];

  for (const pattern of fieldPatterns) expect(source, pattern.source).toMatch(pattern);
  expect(source).toMatch(/median/i);
  expect(source).toMatch(/min\/max spread/i);
  expect(source).toMatch(/(?:fixed 10-attempt batch|固定 10-attempt batch)/i);
  expect(source).toMatch(/all 10 attempts qualify|10 次尝试全部合格/i);
  expect(source).toMatch(/every.{0,40}attempt|每次.{0,30}尝试/i);
  expect(source).toMatch(/restart all 10 attempts|重做全部 10 次/i);
  expect(source).toMatch(/batch_id=.*date -u/is);
  expect(source).toMatch(/batch_dir=.*batch-\$\{batch_id\}/is);
  expect(source).toMatch(/Never reuse a `batch_id`|不得复用 `batch_id`/i);
  expect(source).toMatch(/no-silent-outlier|不构成 invalid/i);
}

function assertCorrectnessBeforeInterpretation(source: string) {
  const headings = [...body(source).matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  const correctness = headings.findIndex((heading) =>
    /verify correctness|correctness verification|验证正确性|正确性验收/i.test(heading),
  );
  const interpretation = headings.findIndex((heading) =>
    /interpret|interpretation|解释|解读/i.test(heading),
  );

  expect(correctness, 'correctness heading').toBeGreaterThanOrEqual(0);
  expect(interpretation, 'interpretation heading').toBeGreaterThan(correctness);
  expect(source).toMatch(
    /correctness.{0,240}(?:before|precondition).{0,240}(?:interpret|profil)|(?:解释|解读).{0,120}之前.{0,120}正确性/is,
  );
}

describe('LAB04, LAB05, and LAB07 bilingual Lab contracts', () => {
  for (const lab of labs) {
    it(`publishes ${lab.id} with exact prerequisites, canonical imports, gates, and evidence axes`, async () => {
      for (const localePrefix of ['', 'en/'] as const) {
        const english = localePrefix === 'en/';
        const counterpart = english ? `/labs/${lab.slug}/` : `/en/labs/${lab.slug}/`;
        const source = await readLab(localePrefix, lab.slug);
        const metadata = frontmatter(source);
        const sourceBody = body(source);
        const hardwareGate = yamlScalar(metadata, 'hardwareGate') ?? '';
        const expectedObservations = evidenceList(metadata, 'expectedObservations');
        const maximumProblemMemoryBytes = Number(
          yamlScalar(metadata, 'maximumProblemMemoryBytes'),
        );

        expect(yamlScalar(metadata, 'title')).toBeTruthy();
        expect(yamlScalar(metadata, 'pairId')).toBe(lab.pairId);
        expect(yamlScalar(metadata, 'counterpart')).toBe(counterpart);
        expect(yamlScalar(metadata, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(metadata, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(metadata, 'provenance')).toBe('original');
        expect(yamlScalar(metadata, 'resourceKind')).toBe('lab');
        expect(yamlScalar(metadata, 'unitId')).toBe(lab.id);
        expect(yamlList(metadata, 'prerequisites')).toEqual(lab.prerequisites);
        expect(yamlList(metadata, 'exampleIds')).toEqual([lab.example]);
        expect(yamlScalar(metadata, 'canonicalExample')).toBe(lab.example);
        expect(yamlList(metadata, 'canonicalRanges')).toEqual(lab.ranges);
        expect(yamlList(metadata, 'toolkitLanes')).toEqual(toolkitLanes);
        expect(yamlScalar(metadata, 'minimumComputeCapability')).toBe('7.5');
        expect(yamlScalar(metadata, 'gpuCount')).toBe('1');
        expect(maximumProblemMemoryBytes).toBeGreaterThan(0);
        expect(maximumProblemMemoryBytes).toBeLessThan(8 * 1024 ** 3);
        expect(yamlList(metadata, 'permissions').length).toBeGreaterThan(0);
        expect(hardwareGate).toMatch(/Native Linux only/i);
        expect(hardwareGate).toMatch(/(?:one|1) CUDA GPU/i);
        expect(hardwareGate).toMatch(/compute capability 7\.5 (?:or newer|\+)/i);

        expect(evidenceList(metadata, 'compilation')).toEqual([]);
        expect(evidenceList(metadata, 'runtime')).toEqual(['Pending Hardware Verification']);
        expect(expectedObservations.length).toBeGreaterThan(0);
        expect(evidenceList(metadata, 'recordedObservations')).toEqual([]);
        const expectedText = expectedObservations.join('\n').toLowerCase();
        for (const term of lab.expectationTerms) expect(expectedText).toContain(term);

        const expectedHead = {
          'cuda:pair-id': lab.pairId,
          'cuda:fact-check-date': reviewDate,
          'cuda:license': 'CC-BY-4.0',
          'cuda:resource-kind': 'lab',
          'cuda:unit-id': lab.id,
          'cuda:prerequisites': lab.prerequisites.join(','),
          'cuda:example-ids': lab.example,
          'cuda:canonical-example': lab.example,
          'cuda:canonical-ranges': lab.ranges.join(','),
          'cuda:hardware-gate': hardwareGate,
          'cuda:toolkit-lanes': toolkitLanes.join(','),
          'cuda:minimum-compute-capability': '7.5',
          'cuda:maximum-problem-memory-bytes': String(maximumProblemMemoryBytes),
          'cuda:gpu-count': '1',
          'cuda:evidence-compilation': 'none',
          'cuda:evidence-runtime': 'Pending Hardware Verification',
          'cuda:expected-observations': `${expectedObservations.length} declared expectations`,
          'cuda:recorded-observations': 'none',
        } as const;
        for (const [name, value] of Object.entries(expectedHead)) {
          expect(projectedMetadata(metadata, name), `${localePrefix}${lab.id} ${name}`).toBe(value);
        }

        expect(sourceBody).toMatch(
          new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${counterpart}"`),
        );
        expect(source).toMatch(/import CanonicalCode from ['"].*CanonicalCode\.astro['"]/);
        expect(
          [...source.matchAll(new RegExp(`<CanonicalCode exampleId="${lab.example}" range="([^"]+)" \\/>`, 'g'))]
            .map((match) => match[1]),
        ).toEqual(lab.ranges);

        for (const version of ['11.8.0', '12.9.2', '13.3.1']) expect(source).toContain(version);
        for (const pattern of [...lab.toolPatterns, ...lab.correctnessPatterns]) {
          expect(source, `${localePrefix}${lab.id} ${pattern.source}`).toMatch(pattern);
        }
        expect(source).toMatch(/tool gate|profiler gate|工具门槛|分析器门槛/i);
        assertCorrectnessBeforeInterpretation(source);
        assertCompleteManifest(source, lab.componentVersionPattern);
        if (lab.id !== 'LAB07') assertCompletePerformanceManifest(source);
        expect(source).toMatch(/raw_logs|raw stdout\/stderr|原始.{0,20}(?:stdout|stderr|日志)/is);
        expect(source).toMatch(/exit_statuses|exit statuses|退出状态/i);
        expect(source).toMatch(lab.rawRecordPattern);
        expect(source).toMatch(/Expected observations, not recorded results|预期观察.{0,20}记录结果/i);
        expect(source).toMatch(
          /no (?:prefilled|invented|recorded).{0,100}(?:numeric GPU result|runtime output|profiler result|sanitizer output)|没有.{0,100}(?:预填|虚构|记录).{0,100}(?:GPU 数值|运行输出|profiler|sanitizer)/is,
        );
        expect(source).not.toMatch(
          /(?:we|this lab|the site) (?:measured|observed|recorded).{0,100}\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|GB\/s|GiB\/s)\b|(?:我们|本实验|本站)(?:测得|观察到|记录了).{0,100}\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|GB\/s|GiB\/s)/i,
        );

        const coordinates = sourceCoordinates(metadata);
        expect(coordinates.length).toBeGreaterThan(0);
        expect(projectedMetadata(metadata, 'cuda:source-count')).toBe(String(coordinates.length));
        for (const coordinate of coordinates) {
          expect(new URL(coordinate.url).hostname, coordinate.url).toBe('docs.nvidia.com');
          expect(coordinate.version).not.toBe('');
          expect(coordinate.platform).not.toBe('');
          expect(coordinate.accessDate).toBe(reviewDate);
          expect(source).toContain(`](${coordinate.url})`);
        }
      }
    });
  }

  it('keeps Lab source coordinates aligned across each Publication Pair', async () => {
    for (const lab of labs) {
      const [chinese, english] = await Promise.all([
        readLab('', lab.slug),
        readLab('en/', lab.slug),
      ]);
      expect(sourceCoordinates(frontmatter(chinese)), lab.id).toEqual(
        sourceCoordinates(frontmatter(english)),
      );
    }
  });
});
