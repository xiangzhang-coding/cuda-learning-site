// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const relativePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  const html = await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8');
  return parseHTML(html).document;
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ') ?? '';
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

describe('O02 Evidence Status contract', () => {
  it.each([
    { route: '/start/evidence-status/', independent: '编译证据和运行证据相互独立' },
    { route: '/en/start/evidence-status/', independent: 'Compilation evidence and runtime evidence are independent' },
  ])('publishes exact statuses and legal combinations in $route', async ({ route, independent }) => {
    const document = await readRoute(route);
    const text = mainText(document);

    for (const status of ['Compile-Checked', 'Community-Observed', 'Runtime-Verified', 'Pending Hardware Verification', 'Runtime-Not-Applicable']) {
      expect(text).toContain(status);
    }
    for (const combination of [
      'Compile-Checked + Pending Hardware Verification',
      'Compile-Checked + Runtime-Verified',
      'Compile-Checked + Runtime-Not-Applicable',
      'Community-Observed + Pending Hardware Verification',
    ]) {
      expect(text).toContain(combination);
    }
    expect(text).toContain(independent);
    expect(text).toMatch(/expected, not observed|预期，不是已记录观察/);
    expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
    expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
    expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
  });

  it('binds every localized example to the same Evidence Status classification', async () => {
    const scenarios = [
      {
        route: '/start/evidence-status/',
        facts: {
          'O02-CASE-A': /构建成功.*没有运行/,
          'O02-CASE-B': /构建成功.*Reference Environment.*标准均满足/,
          'O02-CASE-C': /构建和检查均成功/,
          'O02-CASE-D': /社区提交完整 manifest.*维护者尚未复现/,
          'O02-CASE-E': /编译任务被阻塞/,
          'O02-CASE-F': /浏览器模型和网页质量测试全部通过/,
        },
      },
      {
        route: '/en/start/evidence-status/',
        facts: {
          'O02-CASE-A': /Lane built.*no run occurred/,
          'O02-CASE-B': /Build passed.*Reference Environment.*met every criterion/,
          'O02-CASE-C': /both build and inspection succeed/,
          'O02-CASE-D': /contributor supplied a complete manifest.*not reproduced/,
          'O02-CASE-E': /registry outage blocked the compile job/,
          'O02-CASE-F': /Browser interaction and every web-quality test passed/,
        },
      },
    ] as const;
    const classifications = {
      'O02-CASE-A': 'Compile-Checked + Pending Hardware Verification',
      'O02-CASE-B': 'Compile-Checked + Runtime-Verified',
      'O02-CASE-C': 'Compile-Checked + Runtime-Not-Applicable',
      'O02-CASE-D': 'Community-Observed + Pending Hardware Verification',
      'O02-CASE-E': 'Pending Hardware Verification',
      'O02-CASE-F': 'CUDA Evidence Status',
    } as const;

    for (const { route, facts } of scenarios) {
      const document = await readRoute(route);
      const rows = new Map(
        [...document.querySelectorAll('table tbody tr')].map((row) => {
          const cells = [...row.querySelectorAll('td')].map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() ?? '');
          return [cells[0], { fact: cells[1], classification: cells[2] }];
        }),
      );

      for (const [caseId, factPattern] of Object.entries(facts)) {
        const row = rows.get(caseId);
        expect(row?.fact, `${route} ${caseId}`).toMatch(factPattern);
        expect(row?.classification, `${route} ${caseId}`).toContain(classifications[caseId as keyof typeof classifications]);
        if (caseId === 'O02-CASE-F') expect(row?.classification, `${route} ${caseId}`).toMatch(/^(?:无|No) CUDA Evidence Status$/);
      }
    }
  });
});

describe('O03 Environment Manifest contract', () => {
  it.each([
    { route: '/start/environment-manifest/', supported: '原生 Linux 是唯一的受支持环境', undeclared: '目前没有声明任何基准环境' },
    { route: '/en/start/environment-manifest/', supported: 'Native Linux is the only Supported Environment', undeclared: 'No Reference Environment is currently declared' },
  ])('separates complete environment coordinates in $route', async ({ route, supported, undeclared }) => {
    const text = mainText(await readRoute(route));

    expect(text).toContain('O03-MANIFEST-TEMPLATE');
    expect(text).toContain('O03-INCOMPLETE-A');

    for (const coordinate of [
      'GPU',
      'compute capability',
      'GPU count',
      'driver',
      'CUDA Toolkit',
      'component',
      'NVCC',
      'host compiler',
      'operating system',
      'workload',
      'memory',
      'permissions',
      'exact command',
      'correctness',
      'observation date',
    ]) {
      expect(text.toLowerCase()).toContain(coordinate.toLowerCase());
    }
    for (const lane of ['11.8.0', '12.9.2', '13.3.1']) expect(text).toContain(lane);
    expect(text).toContain('C++23');
    expect(text).toContain('Baseline GPU Capability Tier');
    expect(text).toContain('7.5');
    expect(text).toContain('Modern Single-GPU Capability Tier');
    expect(text).toContain('8.0');
    expect(text).toContain('8 GB');
    expect(text).toContain(supported);
    expect(text).toContain(undeclared);
  });

  it.each([
    {
      route: '/start/environment-manifest/',
      templateBoundary: /字段模板，不是某台机器的记录/,
      incompleteConclusion: /只有.*缺少.*不能支持可解释的正确性或性能结论/,
    },
    {
      route: '/en/start/environment-manifest/',
      templateBoundary: /field template, not a machine record/,
      incompleteConclusion: /says only.*omits.*cannot support an interpretable correctness or performance conclusion/,
    },
  ])('binds localized O03 example IDs to aligned facts in $route', async ({ route, templateBoundary, incompleteConclusion }) => {
    const text = mainText(await readRoute(route));
    const templateStart = text.indexOf('O03-MANIFEST-TEMPLATE');
    const incompleteStart = text.indexOf('O03-INCOMPLETE-A');
    const template = text.slice(templateStart, incompleteStart);
    const incomplete = text.slice(incompleteStart);

    expect(templateStart).toBeGreaterThanOrEqual(0);
    expect(incompleteStart).toBeGreaterThan(templateStart);
    expect(template).toMatch(templateBoundary);
    for (const field of ['GPU identity', 'compute capability', 'GPU count', 'driver version', 'CUDA Toolkit version', 'component versions', 'compiler information', 'operating system', 'workload and shape', 'memory requirement', 'permissions', 'exact command', 'correctness method', 'correctness criteria', 'observation date']) {
      expect(template).toContain(field);
    }
    expect(incomplete).toMatch(incompleteConclusion);
  });
});

describe('Exercises and Practice Bank contract', () => {
  it.each([
    '/start/evidence-status/exercises/',
    '/en/start/evidence-status/exercises/',
    '/start/environment-manifest/exercises/',
    '/en/start/environment-manifest/exercises/',
    '/foundations/first-cuda-kernel/exercises/',
    '/en/foundations/first-cuda-kernel/exercises/',
    '/foundations/execution-hierarchy/exercises/',
    '/en/foundations/execution-hierarchy/exercises/',
    '/foundations/multidimensional-indexing/exercises/',
    '/en/foundations/multidimensional-indexing/exercises/',
    '/foundations/host-device-lifecycle/exercises/',
    '/en/foundations/host-device-lifecycle/exercises/',
    '/foundations/asynchronous-errors/exercises/',
    '/en/foundations/asynchronous-errors/exercises/',
    '/foundations/compute-capability/exercises/',
    '/en/foundations/compute-capability/exercises/',
    '/foundations/runtime-driver-api/exercises/',
    '/en/foundations/runtime-driver-api/exercises/',
    '/foundations/launch-geometry/exercises/',
    '/en/foundations/launch-geometry/exercises/',
    '/memory/address-spaces/exercises/',
    '/en/memory/address-spaces/exercises/',
    '/memory/coalescing-transactions/exercises/',
    '/en/memory/coalescing-transactions/exercises/',
    '/memory/shared-memory-tiling/exercises/',
    '/en/memory/shared-memory-tiling/exercises/',
    '/memory/bank-conflicts-layouts/exercises/',
    '/en/memory/bank-conflicts-layouts/exercises/',
    '/memory/synchronization-scopes/exercises/',
    '/en/memory/synchronization-scopes/exercises/',
    '/memory/warp-divergence-reconvergence/exercises/',
    '/en/memory/warp-divergence-reconvergence/exercises/',
    '/memory/stream-ordering/exercises/',
    '/en/memory/stream-ordering/exercises/',
    '/memory/event-dependencies-timing/exercises/',
    '/en/memory/event-dependencies-timing/exercises/',
    '/memory/pinned-memory-transfer-overlap/exercises/',
    '/en/memory/pinned-memory-transfer-overlap/exercises/',
    '/memory/unified-memory-page-migration/exercises/',
    '/en/memory/unified-memory-page-migration/exercises/',
    '/memory/stream-ordered-allocation-memory-pools/exercises/',
    '/en/memory/stream-ordered-allocation-memory-pools/exercises/',
    '/memory/cooperative-groups/exercises/',
    '/en/memory/cooperative-groups/exercises/',
    '/memory/asynchronous-copy-pipelines/exercises/',
    '/en/memory/asynchronous-copy-pipelines/exercises/',
    '/memory/cuda-graphs/exercises/',
    '/en/memory/cuda-graphs/exercises/',
    '/toolchain/nvcc-compilation-flow/exercises/',
    '/en/toolchain/nvcc-compilation-flow/exercises/',
    '/toolchain/ptx-cubin-fatbinary/exercises/',
    '/en/toolchain/ptx-cubin-fatbinary/exercises/',
    '/toolchain/compiler-architecture-targets/exercises/',
    '/en/toolchain/compiler-architecture-targets/exercises/',
    '/toolchain/separate-compilation-device-linking/exercises/',
    '/en/toolchain/separate-compilation-device-linking/exercises/',
    '/toolchain/cpp-dialect-boundaries/exercises/',
    '/en/toolchain/cpp-dialect-boundaries/exercises/',
    '/correctness/apod-optimization-loop/exercises/',
    '/en/correctness/apod-optimization-loop/exercises/',
    '/correctness/timeline-first-nsight-systems/exercises/',
    '/en/correctness/timeline-first-nsight-systems/exercises/',
    '/correctness/kernel-first-nsight-compute/exercises/',
    '/en/correctness/kernel-first-nsight-compute/exercises/',
    '/correctness/transpose-optimization-case-study/exercises/',
    '/en/correctness/transpose-optimization-case-study/exercises/',
    '/start/cpp17-for-cuda/exercises/',
    '/en/start/cpp17-for-cuda/exercises/',
    '/start/linux-command-line/exercises/',
    '/en/start/linux-command-line/exercises/',
    '/start/architecture-refresher/exercises/',
    '/en/start/architecture-refresher/exercises/',
    '/start/programmable-gpus/exercises/',
    '/en/start/programmable-gpus/exercises/',
    '/start/reference-environment-candidate/exercises/',
    '/en/start/reference-environment-candidate/exercises/',
  ])('provides goals, constraints, acceptance criteria, and layered hints in $route', async (route) => {
    const text = mainText(await readRoute(route));
    expect(text).toMatch(/Goal|目标/);
    expect(text).toMatch(/Constraints|约束/);
    expect(text).toMatch(/Expected evidence|预期证据/);
    expect(text).toMatch(/Acceptance criteria|验收(?:条件|标准)/);
    expect(text).toMatch(/Hint 1|提示 1/);
    expect(text).toMatch(/Hint 2|提示 2/);
    expect(text).not.toMatch(/解答 1|Solution 1/);
  });

  it.each([
    '/start/evidence-status/solutions/',
    '/en/start/evidence-status/solutions/',
    '/start/environment-manifest/solutions/',
    '/en/start/environment-manifest/solutions/',
    '/foundations/first-cuda-kernel/solutions/',
    '/en/foundations/first-cuda-kernel/solutions/',
    '/foundations/execution-hierarchy/solutions/',
    '/en/foundations/execution-hierarchy/solutions/',
    '/foundations/multidimensional-indexing/solutions/',
    '/en/foundations/multidimensional-indexing/solutions/',
    '/foundations/host-device-lifecycle/solutions/',
    '/en/foundations/host-device-lifecycle/solutions/',
    '/foundations/asynchronous-errors/solutions/',
    '/en/foundations/asynchronous-errors/solutions/',
    '/foundations/compute-capability/solutions/',
    '/en/foundations/compute-capability/solutions/',
    '/foundations/runtime-driver-api/solutions/',
    '/en/foundations/runtime-driver-api/solutions/',
    '/foundations/launch-geometry/solutions/',
    '/en/foundations/launch-geometry/solutions/',
    '/memory/address-spaces/solutions/',
    '/en/memory/address-spaces/solutions/',
    '/memory/coalescing-transactions/solutions/',
    '/en/memory/coalescing-transactions/solutions/',
    '/memory/shared-memory-tiling/solutions/',
    '/en/memory/shared-memory-tiling/solutions/',
    '/memory/bank-conflicts-layouts/solutions/',
    '/en/memory/bank-conflicts-layouts/solutions/',
    '/memory/synchronization-scopes/solutions/',
    '/en/memory/synchronization-scopes/solutions/',
    '/memory/warp-divergence-reconvergence/solutions/',
    '/en/memory/warp-divergence-reconvergence/solutions/',
    '/memory/stream-ordering/solutions/',
    '/en/memory/stream-ordering/solutions/',
    '/memory/event-dependencies-timing/solutions/',
    '/en/memory/event-dependencies-timing/solutions/',
    '/memory/pinned-memory-transfer-overlap/solutions/',
    '/en/memory/pinned-memory-transfer-overlap/solutions/',
    '/memory/unified-memory-page-migration/solutions/',
    '/en/memory/unified-memory-page-migration/solutions/',
    '/memory/stream-ordered-allocation-memory-pools/solutions/',
    '/en/memory/stream-ordered-allocation-memory-pools/solutions/',
    '/memory/cooperative-groups/solutions/',
    '/en/memory/cooperative-groups/solutions/',
    '/memory/asynchronous-copy-pipelines/solutions/',
    '/en/memory/asynchronous-copy-pipelines/solutions/',
    '/memory/cuda-graphs/solutions/',
    '/en/memory/cuda-graphs/solutions/',
    '/toolchain/nvcc-compilation-flow/solutions/',
    '/en/toolchain/nvcc-compilation-flow/solutions/',
    '/toolchain/ptx-cubin-fatbinary/solutions/',
    '/en/toolchain/ptx-cubin-fatbinary/solutions/',
    '/toolchain/compiler-architecture-targets/solutions/',
    '/en/toolchain/compiler-architecture-targets/solutions/',
    '/toolchain/separate-compilation-device-linking/solutions/',
    '/en/toolchain/separate-compilation-device-linking/solutions/',
    '/toolchain/cpp-dialect-boundaries/solutions/',
    '/en/toolchain/cpp-dialect-boundaries/solutions/',
    '/correctness/apod-optimization-loop/solutions/',
    '/en/correctness/apod-optimization-loop/solutions/',
    '/correctness/timeline-first-nsight-systems/solutions/',
    '/en/correctness/timeline-first-nsight-systems/solutions/',
    '/correctness/kernel-first-nsight-compute/solutions/',
    '/en/correctness/kernel-first-nsight-compute/solutions/',
    '/correctness/transpose-optimization-case-study/solutions/',
    '/en/correctness/transpose-optimization-case-study/solutions/',
    '/start/cpp17-for-cuda/solutions/',
    '/en/start/cpp17-for-cuda/solutions/',
    '/start/linux-command-line/solutions/',
    '/en/start/linux-command-line/solutions/',
    '/start/architecture-refresher/solutions/',
    '/en/start/architecture-refresher/solutions/',
    '/start/programmable-gpus/solutions/',
    '/en/start/programmable-gpus/solutions/',
    '/start/reference-environment-candidate/solutions/',
    '/en/start/reference-environment-candidate/solutions/',
  ])('keeps reviewed solutions on a separate route in $route', async (route) => {
    const text = mainText(await readRoute(route));
    expect(text).toMatch(/参考解答|Reviewed solutions?/i);
    expect(text).toMatch(/Common errors|常见错误/);
  });

  it.each([
    'memory/pinned-memory-transfer-overlap',
    'memory/unified-memory-page-migration',
    'memory/stream-ordered-allocation-memory-pools',
    'memory/cooperative-groups',
    'memory/asynchronous-copy-pipelines',
    'memory/cuda-graphs',
    'toolchain/nvcc-compilation-flow',
    'toolchain/ptx-cubin-fatbinary',
    'toolchain/compiler-architecture-targets',
    'toolchain/separate-compilation-device-linking',
    'toolchain/cpp-dialect-boundaries',
    'correctness/transpose-optimization-case-study',
  ].flatMap((unitPath) => [
    { unitPath, localePrefix: '' },
    { unitPath, localePrefix: 'en/' },
  ]))('publishes exactly three layered tasks and three separate solutions for $unitPath in $localePrefix', async ({ unitPath, localePrefix }) => {
    const baseRoute = `/${localePrefix}${unitPath}/`;
    const exercises = await readRoute(`${baseRoute}exercises/`);
    const solutions = await readRoute(`${baseRoute}solutions/`);
    const taskHeadings = [...exercises.querySelectorAll('main h2')]
      .map((heading) => heading.textContent?.trim() ?? '')
      .filter((heading) => /^(?:Exercise|练习) [1-3](?::|：)/.test(heading));
    const solutionHeadings = [...solutions.querySelectorAll('main h2')]
      .map((heading) => heading.textContent?.trim() ?? '')
      .filter((heading) => /^(?:Solution|解答) [1-3](?::|：)/.test(heading));
    const hintSummaries = [...exercises.querySelectorAll('main details summary')]
      .map((summary) => summary.textContent?.replace(/（.*?）/g, '').trim() ?? '');

    expect(taskHeadings).toHaveLength(3);
    expect(solutionHeadings).toHaveLength(3);
    expect(hintSummaries.filter((summary) => /^(?:Hint|提示) 1$/.test(summary))).toHaveLength(3);
    expect(hintSummaries.filter((summary) => /^(?:Hint|提示) 2$/.test(summary))).toHaveLength(3);
    expect(mainText(exercises)).not.toMatch(/(?:Solution|解答) 1(?::|：)/);
    expect(exercises.querySelector(`a[href="${baseRoute}solutions/"]`)).not.toBeNull();
  });

  it.each(['/practice/', '/en/practice/'])('publishes sixty complete Practice Bank entries in $route', async (route) => {
    const source = await readFile(
      path.join(projectRoot, 'src/content/docs', route.startsWith('/en/') ? 'en/practice.mdx' : 'practice.mdx'),
      'utf8',
    );
    const text = source.replace(/\s+/g, ' ');
    const builtHtml = await readFile(
      path.join(projectRoot, 'dist', route.slice(1), 'index.html'),
      'utf8',
    );
    const entryIds = [
      'PB-R0-001', 'PB-R0-002', 'PB-R0-003', 'PB-R0-004', 'PB-R0-005',
      'PB-R1-001', 'PB-R1-002', 'PB-R1-003', 'PB-R1-004', 'PB-R1-005',
      'PB-R1-006', 'PB-R1-007', 'PB-R1-008',
      'PB-R1-009', 'PB-R1-010', 'PB-R1-011', 'PB-R1-012',
      'PB-R1-013', 'PB-R1-014', 'PB-R1-015', 'PB-R1-016',
      'PB-R1-017', 'PB-R1-018', 'PB-R1-019', 'PB-R1-020',
      'PB-R1-021', 'PB-R1-022', 'PB-R1-023', 'PB-R1-024',
      'PB-R2-001', 'PB-R2-002', 'PB-R2-003', 'PB-R2-004', 'PB-R2-005', 'PB-R2-006',
      'PB-R2-007', 'PB-R2-008', 'PB-R2-009', 'PB-R2-010', 'PB-R2-011',
      'PB-R2-012', 'PB-R2-013', 'PB-R2-014', 'PB-R2-015', 'PB-R2-016',
      'PB-R2-017', 'PB-R2-018', 'PB-R2-019', 'PB-R2-020', 'PB-R2-021',
      'PB-R3-001', 'PB-R3-002', 'PB-R3-003', 'PB-R3-004', 'PB-R3-005', 'PB-R3-006',
      'PB-R3-007', 'PB-R3-008', 'PB-R3-009', 'PB-R3-010',
    ];
    const entrySections = [...source.matchAll(
      /^## (PB-R\d+-\d{3})[^\n]*\n([\s\S]*?)(?=^## PB-|^## (?:复核记录|Review record)|\Z)/gm,
    )].map(([, id, content]) => ({ id, content }));
    const focusedPrerequisitePaths: Readonly<Record<string, string>> = {
      'PB-R1-009': 'foundations/asynchronous-errors',
      'PB-R1-010': 'foundations/compute-capability',
      'PB-R1-011': 'foundations/runtime-driver-api',
      'PB-R1-012': 'foundations/launch-geometry',
      'PB-R1-013': 'memory/address-spaces',
      'PB-R1-014': 'memory/coalescing-transactions',
      'PB-R1-015': 'memory/shared-memory-tiling',
      'PB-R1-016': 'memory/bank-conflicts-layouts',
      'PB-R1-017': 'memory/synchronization-scopes',
      'PB-R1-018': 'memory/warp-divergence-reconvergence',
      'PB-R1-019': 'memory/stream-ordering',
      'PB-R1-020': 'memory/event-dependencies-timing',
      'PB-R1-021': 'correctness/cpu-references-tolerances-invariants',
      'PB-R1-022': 'correctness/memcheck-invalid-memory-access',
      'PB-R1-023': 'correctness/racecheck-initcheck-synccheck',
      'PB-R1-024': 'correctness/timing-asynchronous-gpu-work',
      'PB-R2-001': 'memory/pinned-memory-transfer-overlap',
      'PB-R2-002': 'memory/unified-memory-page-migration',
      'PB-R2-003': 'memory/stream-ordered-allocation-memory-pools',
      'PB-R2-004': 'memory/cooperative-groups',
      'PB-R2-005': 'memory/asynchronous-copy-pipelines',
      'PB-R2-006': 'memory/cuda-graphs',
      'PB-R2-007': 'toolchain/nvcc-compilation-flow',
      'PB-R2-008': 'toolchain/ptx-cubin-fatbinary',
      'PB-R2-009': 'toolchain/compiler-architecture-targets',
      'PB-R2-010': 'toolchain/separate-compilation-device-linking',
      'PB-R2-011': 'toolchain/cpp-dialect-boundaries',
      'PB-R2-012': 'algorithms/elementwise-map',
      'PB-R2-013': 'algorithms/multi-stage-reduction',
      'PB-R2-014': 'algorithms/inclusive-exclusive-scan',
      'PB-R2-015': 'algorithms/privatized-histogram',
      'PB-R2-016': 'correctness/floating-point-order-reproducibility',
      'PB-R2-017': 'algorithms/matrix-transpose-layout',
      'PB-R2-018': 'algorithms/stencil-neighborhood-reuse',
      'PB-R2-019': 'algorithms/convolution-reuse-layout',
      'PB-R2-020': 'algorithms/tiled-gemm-correctness',
      'PB-R2-021': 'algorithms/sorting-selection-compaction',
      'PB-R3-001': 'correctness/apod-optimization-loop',
      'PB-R3-002': 'correctness/timeline-first-nsight-systems',
      'PB-R3-003': 'correctness/kernel-first-nsight-compute',
      'PB-R3-004': 'correctness/occupancy-stalls-throughput',
      'PB-R3-005': 'correctness/roofline-arithmetic-intensity',
      'PB-R3-006': 'algorithms/algorithm-choice-arithmetic-intensity',
      'PB-R3-007': 'correctness/transpose-optimization-case-study',
      'PB-R3-008': 'correctness/transpose-optimization-case-study',
      'PB-R3-009': 'correctness/reduction-optimization-case-study',
      'PB-R3-010': 'correctness/reduction-optimization-case-study',
    };
    const focusedRelatedPaths: Readonly<Record<string, readonly string[]>> = {
      'PB-R3-001': [
        'correctness/timing-asynchronous-gpu-work',
        'correctness/apod-optimization-loop',
      ],
      'PB-R3-002': [
        'memory/stream-ordering',
        'memory/pinned-memory-transfer-overlap',
        'correctness/timing-asynchronous-gpu-work',
        'correctness/timeline-first-nsight-systems',
        'labs/build-overlapped-pipeline',
        'visuals/nsight-systems-versus-nsight-compute',
      ],
      'PB-R3-003': [
        'memory/coalescing-transactions',
        'memory/shared-memory-tiling',
        'correctness/timeline-first-nsight-systems',
        'correctness/kernel-first-nsight-compute',
        'labs/profile-full-application-before-kernel',
        'visuals/nsight-systems-versus-nsight-compute',
      ],
      'PB-R3-004': [
        'correctness/kernel-first-nsight-compute',
        'foundations/launch-geometry',
        'correctness/occupancy-stalls-throughput',
        'labs/build-original-roofline',
        'visuals/roofline',
      ],
      'PB-R3-005': [
        'correctness/timing-asynchronous-gpu-work',
        'algorithms/algorithm-choice-arithmetic-intensity',
        'correctness/occupancy-stalls-throughput',
        'correctness/roofline-arithmetic-intensity',
        'labs/build-original-roofline',
        'visuals/roofline',
      ],
      'PB-R3-006': [
        'algorithms/elementwise-map',
        'algorithms/multi-stage-reduction',
        'algorithms/matrix-transpose-layout',
        'algorithms/tiled-gemm-correctness',
        'algorithms/algorithm-choice-arithmetic-intensity',
        'correctness/roofline-arithmetic-intensity',
        'examples/vector-addition',
        'examples/multi-stage-reduction',
        'examples/tiled-transpose',
        'examples/tiled-gemm',
        'visuals/roofline',
      ],
      'PB-R3-007': [
        'algorithms/matrix-transpose-layout',
        'correctness/apod-optimization-loop',
        'correctness/kernel-first-nsight-compute',
        'correctness/roofline-arithmetic-intensity',
        'examples/tiled-transpose',
        'visuals/tiled-transpose',
        'labs/optimize-canonical-transpose',
      ],
      'PB-R3-008': [
        'algorithms/matrix-transpose-layout',
        'correctness/apod-optimization-loop',
        'correctness/kernel-first-nsight-compute',
        'correctness/roofline-arithmetic-intensity',
        'examples/tiled-transpose',
        'visuals/tiled-transpose',
        'labs/optimize-canonical-transpose',
      ],
      'PB-R3-009': [
        'algorithms/multi-stage-reduction',
        'correctness/floating-point-order-reproducibility',
        'correctness/apod-optimization-loop',
        'correctness/kernel-first-nsight-compute',
        'correctness/reduction-optimization-case-study',
        'examples/multi-stage-reduction',
        'visuals/reduction-stages',
      ],
      'PB-R3-010': [
        'algorithms/multi-stage-reduction',
        'correctness/floating-point-order-reproducibility',
        'correctness/apod-optimization-loop',
        'correctness/kernel-first-nsight-compute',
        'correctness/reduction-optimization-case-study',
        'examples/multi-stage-reduction',
        'visuals/reduction-stages',
      ],
    };

    expect(entrySections.map(({ id }) => id)).toEqual(entryIds);
    for (const [index, entryId] of entryIds.entries()) {
      const section = entrySections[index];
      expect(section.id, route).toBe(entryId);
      const sectionText = section.content.replace(/\s+/g, ' ');
      const sectionLinks = [...section.content.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
      const relatedLine = /^- \*\*(?:相关学习单元与资源：|Related Learning Units and resources:)\*\* ([^\n]+)/m.exec(section.content)?.[1] ?? '';
      const relatedLinks = [...relatedLine.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);

      expect(sectionText, `${route} ${entryId}`).toMatch(/prerequisite|先修/i);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Hardware gate|硬件门槛/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Constraints|约束/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Expected evidence|预期证据/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Acceptance criteria|验收条件/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Hint 1|提示 1/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Hint 2|提示 2/);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Solution|解答/i);
      expect(sectionText, `${route} ${entryId}`).toMatch(/Source basis|来源依据/);
      const prerequisitePath = focusedPrerequisitePaths[entryId];
      const prerequisiteRoutePattern = prerequisitePath?.startsWith('memory/')
        ? /\/(?:en\/)?memory\//
        : prerequisitePath?.startsWith('algorithms/')
          ? /\/(?:en\/)?algorithms\//
        : prerequisitePath?.startsWith('correctness/')
          ? /\/(?:en\/)?correctness\//
          : prerequisitePath?.startsWith('toolchain/')
            ? /\/(?:en\/)?toolchain\//
        : /\/(?:en\/)?(?:start|foundations)\//;
      expect(sectionLinks.some((link) => prerequisiteRoutePattern.test(link))).toBe(true);
      if (prerequisitePath) {
        expect(
          sectionLinks.some((link) => link.includes(`/${prerequisitePath}/`)),
          `${route} ${entryId} prerequisite`,
        ).toBe(true);
      }
      const relatedPaths = focusedRelatedPaths[entryId];
      if (relatedPaths) {
        expect(relatedLinks, `${route} ${entryId} related links`).toHaveLength(relatedPaths.length);
        for (const relatedPath of relatedPaths) {
          expect(
            relatedLinks.some((link) => link.includes(`/${relatedPath}/`)),
            `${route} ${entryId} relation ${relatedPath}`,
          ).toBe(true);
        }
      }
      if (/^PB-R1-02[1-4]$|^PB-R2-0(?:0[1-9]|1\d|2[01])$|^PB-R3-00[1-8]$/.test(entryId)) {
        expect(sectionText, `${route} ${entryId}`).toMatch(/Reviewed solution|参考解答/i);
        expect(sectionText, `${route} ${entryId}`).toMatch(/Source date|来源日期/);
        const sourceDate = /^PB-R3-00[7-8]$/.test(entryId)
          ? '2026-09-02'
          : /^PB-R3-00[4-6]$/.test(entryId)
          ? '2026-09-01'
          : entryId.startsWith('PB-R3')
          ? '2026-08-31'
          : /^PB-R2-02[01]$/.test(entryId)
          ? '2026-08-31'
          : /^PB-R2-01[2-9]$/.test(entryId)
          ? '2026-08-30'
          : entryId.startsWith('PB-R2')
            ? '2026-08-29'
            : '2026-08-28';
        expect(sectionText, `${route} ${entryId}`).toContain(sourceDate);
      }
    }

    expect(builtHtml).toMatch(/EX01/);
    expect(builtHtml).toMatch(/LAB01/);
    expect(text).toMatch(/O02/);
    expect(text).toMatch(/O03/);
    expect(text).toMatch(/F01/);
    for (const unitId of ['F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08']) expect(text).toContain(unitId);
    for (const unitId of ['O04', 'O05', 'O06', 'O07', 'O08']) expect(text).toContain(unitId);
    for (const unitId of ['M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M11', 'M12', 'M13', 'M14', 'M15', 'M16', 'M17', 'M18', 'M19']) expect(text).toContain(unitId);
    for (const unitId of ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A14']) expect(text).toContain(unitId);
    for (const unitId of ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q09', 'Q10', 'Q11']) expect(text).toContain(unitId);
    expect(text).toMatch(/Hardware gate|硬件门槛/);
    expect(text).toMatch(/Source basis|来源依据/);
    expect(text).toMatch(/Last reviewed|最后复核/);
    expect(builtHtml).toContain('evidence-status');
    expect(builtHtml).toContain('environment-manifest');
    expect(builtHtml).toContain('first-cuda-kernel');
    for (const slug of [
      'execution-hierarchy',
      'multidimensional-indexing',
      'host-device-lifecycle',
      'asynchronous-errors',
      'compute-capability',
      'runtime-driver-api',
      'launch-geometry',
    ]) {
      expect(builtHtml, slug).toContain(slug);
    }
    for (const slug of ['cpp17-for-cuda', 'linux-command-line', 'architecture-refresher', 'programmable-gpus', 'reference-environment-candidate']) {
      expect(builtHtml, slug).toContain(slug);
    }
    for (const slug of ['address-spaces', 'coalescing-transactions', 'shared-memory-tiling', 'bank-conflicts-layouts', 'synchronization-scopes', 'warp-divergence-reconvergence', 'stream-ordering', 'event-dependencies-timing', 'pinned-memory-transfer-overlap', 'unified-memory-page-migration', 'stream-ordered-allocation-memory-pools', 'cooperative-groups', 'asynchronous-copy-pipelines', 'cuda-graphs']) {
      expect(builtHtml, slug).toContain(slug);
    }
    for (const slug of ['nvcc-compilation-flow', 'ptx-cubin-fatbinary', 'compiler-architecture-targets', 'separate-compilation-device-linking', 'cpp-dialect-boundaries']) {
      expect(builtHtml, slug).toContain(slug);
    }
    for (const slug of ['apod-optimization-loop', 'timeline-first-nsight-systems', 'kernel-first-nsight-compute', 'transpose-optimization-case-study']) {
      expect(builtHtml, slug).toContain(slug);
    }
  });
});
