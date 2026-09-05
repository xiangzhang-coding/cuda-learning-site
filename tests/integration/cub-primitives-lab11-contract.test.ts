// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  PROFILER_FIXTURE_MANIFEST_FIELDS,
  validateProfilerReportFixture,
} from '../../scripts/lib/profiler-report-fixture-policy.mjs';
import { loadCanonicalExample } from '../../scripts/lib/canonical-examples.mjs';
import { scanFiles } from '../../scripts/lib/quality-policy.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const exampleRoot = path.join(projectRoot, 'examples/ex17-cub-device-reduction-scan');
const fixturePath = 'public/assets/profiler-report-fixtures/lab11-nsight-compute.expected.json';
const runnerPath = 'public/assets/exercise-solutions/lab11-reduction-comparison.cu';
const runnerSha256 = '755a4c4653399299fba80ca12e5fd40d35f992ff18f36d8bece5602c52b16e0c';
const reviewDate = '2026-09-05';
const sourceCommit = 'f018a694ec4f57a40e1374352e320ddd9c9511e0';
const publicationBundleCommit = 'd52211040927f647ca3440529d4728c5edefd01e';
const selectedCcclCommit = 'd36012203ef73ac7f966e848dd88482273e91e02';

const profileIds = [
  'cuda-11-8-bundled-cub-1-15-1',
  'cuda-12-9-bundled-cub-2-8-2',
  'cuda-13-3-bundled-cub-3-3-4',
  'cuda-12-9-selected-cccl-3-4-2',
  'cuda-13-3-selected-cccl-3-4-2',
] as const;

const publications = [
  {
    path: 'libraries/cub-device-primitives',
    extension: 'mdx',
    pairId: 'l03',
    unitId: 'L03',
    resourceKind: 'learning-unit',
    prerequisites: ['A02', 'A03', 'M07', 'L01'],
    expectedObservations: 0,
  },
  {
    path: 'libraries/cub-device-primitives/exercises',
    extension: 'md',
    pairId: 'l03-exercises',
    unitId: 'L03-EXERCISES',
    resourceKind: 'exercise-set',
    prerequisites: ['L03'],
    expectedObservations: 0,
  },
  {
    path: 'libraries/cub-device-primitives/solutions',
    extension: 'md',
    pairId: 'l03-solutions',
    unitId: 'L03-SOLUTIONS',
    resourceKind: 'solution-set',
    prerequisites: ['L03-EXERCISES'],
    expectedObservations: 0,
  },
  {
    path: 'libraries/cub-warp-block-primitives',
    extension: 'mdx',
    pairId: 'l04',
    unitId: 'L04',
    resourceKind: 'learning-unit',
    prerequisites: ['F02', 'M03', 'M05', 'A02', 'A03', 'L03'],
    expectedObservations: 0,
  },
  {
    path: 'libraries/cub-warp-block-primitives/exercises',
    extension: 'md',
    pairId: 'l04-exercises',
    unitId: 'L04-EXERCISES',
    resourceKind: 'exercise-set',
    prerequisites: ['L04'],
    expectedObservations: 0,
  },
  {
    path: 'libraries/cub-warp-block-primitives/solutions',
    extension: 'md',
    pairId: 'l04-solutions',
    unitId: 'L04-SOLUTIONS',
    resourceKind: 'solution-set',
    prerequisites: ['L04-EXERCISES'],
    expectedObservations: 0,
  },
  {
    path: 'examples/cub-device-reduction-scan',
    extension: 'mdx',
    pairId: 'ex17',
    unitId: 'EX17',
    resourceKind: 'runnable-example',
    prerequisites: ['L03'],
    expectedObservations: 3,
  },
  {
    path: 'labs/compare-custom-reduction-with-cub',
    extension: 'mdx',
    pairId: 'lab11',
    unitId: 'LAB11',
    resourceKind: 'lab',
    prerequisites: ['Q12', 'L03'],
    expectedObservations: 10,
  },
] as const;

const ex17Files = [
  'Makefile',
  'README.md',
  'evidence/README.md',
  'include/cub_device_reduction_scan_reference.hpp',
  'project.json',
  'scripts/compile-check.sh',
  'src/cub_device_reduction_scan.cu',
  'tests/host_reference_test.cpp',
] as const;

const lab11ManifestFields = [
  'observationUtcObserverRunBatchProfile',
  'gpuIdentityOrdinalPrivateIdentifiers',
  'computeCapabilityQueryAndResult',
  'visibleSelectedAndUsedGpuCounts',
  'driverVersionQueryStatusLogSha256',
  'toolkitLaneExactToolkitAndRuntime',
  'nvccPathVersionAndOrderedFlags',
  'hostCompilerPathVersionAndCxx17',
  'nativeLinuxOsArchitectureKernelContainerImage',
  'cubMacroIntegerDecodedVersionProbeStatusLogSha256',
  'ccclMacroIntegerDecodedVersionOrLegacyAbsence',
  'bundledOrSelectedAcquisitionCoordinateAndSha256',
  'orderedIncludeSearchResolvedHeaderPathsAndSha256',
  'nsightComputePathVersionHelpSectionsExactGpuQuery',
  'cuptiVersionLoadedPathSha256AndCompatibility',
  'nonAdminDeviceCounterAndReportWritePermissions',
  'noSudoElevationDriverPolicyChangeOrBypassAudit',
  'ex11AndEx17SourceCommitsUrlsPathsDiffsAndSha256',
  'reviewedRunnerOrAlternativeProvenanceDiffCallBoundariesAndSourceSha256',
  'exactOrderedBuildCommandsStatusesLogsAndHashes',
  'profileRunnerBinaryPathSha256AndSelectedCandidateArgv',
  'generatorInputCountBytesAndInputSha256',
  'temporaryStorageQueryArgumentsDeviceBytesAllocationAndFree',
  'oneExcludedWarmUpPairAndPerTimedProcessWarmUpOrderCorrectnessAndHashes',
  'attemptIds01Through10AlternatingOrderAndTimestamps',
  'oneCandidateIdentityAndOneExplicitNonblockingStreamPerProcessWithCheckedCompletion',
  'timingClockResolutionBoundariesUnitsAndRawValues',
  'logicalCallsToActualContextStreamKernelLaunchMappings',
  'trafficFieldNamesDefinitionsUnitsScopesAndAggregation',
  'replayPassSaveRestoreCacheClockSerializationPerturbation',
  'concurrentCpuGpuLoadMigMpsComputeMode',
  'clockPersistencePowerThermalThrottleBeforeAndAfter',
  'correctnessCriteriaAndPerCandidateResults',
  'measurementCriteriaAndWholeBatchDecision',
  'exactArgvCwdEnvironmentTimeStatusStdoutStderrCustody',
  'primaryReportsImportsHashesAndPrivateOriginalChain',
  'correctnessTimingMappingTrafficMaintenanceSummaryHashes',
  'criterionResultsEvidenceLinksAndStatusCandidate',
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
  const match = new RegExp(`^${fieldIndent}${field}:\\n((?:${itemIndent}- [^\\n]+\\n?)+)`, 'm')
    .exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function markdownSection(source: string, title: RegExp) {
  const content = body(source);
  const headings = [...content.matchAll(/^## (.+)$/gm)];
  const index = headings.findIndex((heading) => title.test(heading[1]));
  if (index < 0) return '';
  const start = (headings[index].index ?? 0) + headings[index][0].length;
  const end = headings[index + 1]?.index ?? content.length;
  return content.slice(start, end);
}

function canonicalRanges(source: string) {
  return [...source.matchAll(/<CanonicalCode exampleId="EX17" range="([^"]+)" \/>/g)]
    .map((match) => match[1]);
}

function sliceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  return startIndex >= 0 && endIndex > startIndex ? source.slice(startIndex, endIndex) : '';
}

async function readPublication(publication: (typeof publications)[number]) {
  return Promise.all(['', 'en/'].map((locale) => readFile(
    path.join(docsRoot, `${locale}${publication.path}.${publication.extension}`),
    'utf8',
  )));
}

describe('issue #34 CUB primitives, EX17, and LAB11 publication contract', () => {
  it('publishes all eight aligned bilingual source pairs with exact dependency edges', async () => {
    expect(publications).toHaveLength(8);
    expect(new Set(publications.map(({ pairId }) => pairId))).toHaveLength(8);

    for (const publication of publications) {
      const [zh, en] = await readPublication(publication);
      const pair = [
        { source: zh, counterpart: `/en/${publication.path}/`, lang: 'en' },
        { source: en, counterpart: `/${publication.path}/`, lang: 'zh-CN' },
      ];

      for (const { source, counterpart, lang } of pair) {
        const metadata = frontmatter(source);
        expect(metadata, publication.unitId).toContain(`pairId: ${publication.pairId}`);
        expect(metadata, publication.unitId).toContain(`counterpart: ${counterpart}`);
        expect(metadata, publication.unitId).toContain(`factCheckDate: '${reviewDate}'`);
        expect(metadata, publication.unitId).toContain('license: CC-BY-4.0');
        expect(metadata, publication.unitId).toContain('provenance: original');
        expect(metadata, publication.unitId).toContain(`resourceKind: ${publication.resourceKind}`);
        expect(metadata, publication.unitId).toContain(`unitId: ${publication.unitId}`);
        expect(yamlList(metadata, 'prerequisites'), publication.unitId)
          .toEqual(publication.prerequisites);
        expect(metadata, publication.unitId).toContain('compilation: []');
        expect(metadata, publication.unitId).toContain('recordedObservations: []');
        expect(source, publication.unitId).toContain(
          `<a class="locale-pair" data-locale-counterpart href="${counterpart}" lang="${lang}">`,
        );

        if (publication.expectedObservations === 0) {
          expect(metadata, publication.unitId).toMatch(
            /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
          );
        } else {
          expect(yamlList(metadata, 'runtime', 2), publication.unitId)
            .toEqual(['Pending Hardware Verification']);
          expect(yamlList(metadata, 'expectedObservations', 2), publication.unitId)
            .toHaveLength(publication.expectedObservations);
        }
      }

      expect(yamlList(frontmatter(zh), 'structure'), `${publication.unitId} structure`)
        .toEqual(yamlList(frontmatter(en), 'structure'));
      expect(yamlList(frontmatter(zh), 'prerequisites'), `${publication.unitId} prerequisites`)
        .toEqual(yamlList(frontmatter(en), 'prerequisites'));
    }
  });

  it('locks L03 device APIs, storage, overlap, stream, determinism, and release boundaries', async () => {
    const pages = await readPublication(publications[0]);

    for (const source of pages) {
      const content = body(source);
      for (const token of [
        'cub::DeviceReduce',
        'DeviceReduce::Sum',
        'cub::DeviceScan',
        'DeviceScan::InclusiveSum',
        'DeviceScan::ExclusiveSum',
        '<cub/device/device_reduce.cuh>',
        '<cub/device/device_scan.cuh>',
        'd_temp_storage',
        'temp_storage_bytes',
        'cudaStream_t',
        'cudaError_t',
        'TERM-183',
        'PB-R4-003',
      ]) expect(content, token).toContain(token);

      expect(content).toMatch(/d_temp_storage == nullptr[\s\S]{0,220}(?:no kernel|不启动 kernel)/i);
      expect(content).toMatch(/(?:same current device|同一当前 device)[\s\S]{0,180}(?:same API|相同 API)[\s\S]{0,180}(?:template|参数类型)/i);
      expect(content).toMatch(/\[d_in, d_in \+ N\)[\s\S]{0,100}(?:must not overlap|不得.*重叠)/i);
      expect(content).toMatch(/^(?=.*d_in == d_out)(?=.*exact in-place).*$/im);
      expect(content).toMatch(/(?:otherwise|除此之外)[\s\S]{0,140}(?:must not.*overlap|不得.*重叠)/i);
      expect(content).toMatch(/cudaStream_t[\s\S]{0,120}(?:default is stream `0`|默认 stream 为 `0`)/i);
      expect(content).toMatch(/(?:one stream|同一 stream)[^\n]*(?:reuse|复用)[^\n]*(?:without host synchronization|无需.*host synchronization)/i);
      expect(content).toMatch(/(?:different streams|不同 streams)[\s\S]{0,180}(?:event dependency|stream completion)/i);
      expect(content).toMatch(/DeviceReduce::Sum[\s\S]{0,260}same-GPU run-to-run determinism/i);
      expect(content).toMatch(/CUB 1\.15\.1[\s\S]{0,100}DeviceScan::InclusiveSum[\s\S]{0,180}same-GPU run-to-run determinism/i);
      expect(content).toMatch(/CUB 2\.8\.2[\s\S]{0,100}3\.3\.4[\s\S]{0,100}(?:selected )?3\.4\.2[\s\S]{0,180}(?:vary from run to run|不同运行之间变化)/i);
      expect(content).toMatch(/(?:serial left fold|serial fold)[\s\S]{0,180}(?:different compute capability|不同 compute capability)/i);
      expect(content).toMatch(/EX17[\s\S]{0,180}(?:exact full-array `uint32_t` scan acceptance|完整 `uint32_t` scan arrays 精确匹配)/i);

      const matrix = markdownSection(source, /version matrix/i);
      const rows = matrix.match(/^\| CUDA .+$/gm) ?? [];
      expect(rows).toHaveLength(5);
      expect(rows[0]).toMatch(/11\.8\.0.*1\.15\.1.*101501/);
      expect(rows[1]).toMatch(/12\.9\.2.*2\.8\.2.*200802/);
      expect(rows[2]).toMatch(/13\.3\.1.*3\.3\.4.*300304/);
      expect(rows.filter((row) => row.includes('3.4.2'))).toHaveLength(2);
      expect(rows.filter((row) => row.includes('300402'))).toHaveLength(2);
      expect(rows.find((row) => row.includes('11.8.0'))).not.toContain('3.4.2');
      expect(matrix).toContain(selectedCcclCommit);
      expect(matrix).not.toMatch(/not reviewed|unreviewed|未复核/i);

      const cells = rows.map((row) => row.split('|').slice(1, -1).map((cell) => cell.trim()));
      expect(cells.every((row) => row.length === 6)).toBe(true);
      for (const row of cells) {
        expect(row[3]).toMatch(/Documented same-GPU run-to-run determinism/i);
        expect(row[3]).toMatch(/cross-compute-capability caveat/i);
      }
      expect(cells[0][4]).toMatch(/Documented same-GPU run-to-run determinism/i);
      expect(cells[0][4]).toMatch(/cross-compute-capability caveat/i);
      for (const row of cells.slice(1)) {
        expect(row[4]).toMatch(/Documented possible run-to-run variation for pseudo-associative operations/i);
        expect(row[4]).not.toMatch(/same-GPU run-to-run determinism/i);
      }

      const environment = markdownSection(source, /environment[- ]overload/i);
      expect(environment).toMatch(/3\.4\.0[\s\S]{0,180}environment[- ]overload/i);
      expect(environment).toMatch(/(?:not deprecated|没有 deprecated)/i);
      expect(environment).toContain('CUDA Toolkit 13.4');
      expect(environment).toMatch(/stream[\s\S]{0,100}memory resource[\s\S]{0,120}execution requirements/i);

      const issue = markdownSection(source, /known-issue/i);
      expect(issue).toContain('#5966');
      expect(issue).toContain('DeviceReduce::Min');
      expect(issue).toMatch(/size_t[\s\S]{0,80}int[\s\S]{0,180}temporary-storage/i);
      expect(issue).toMatch(/(?:(?:neither|not).*Sum\/Scan.*correctness defect|不证明.*Sum\/Scan.*correctness defect)/i);
      expect(new Set([...source.matchAll(/NVIDIA\/cccl\/issues\/(\d+)/g)].map((match) => match[1])))
        .toEqual(new Set(['5966']));

      expect(markdownSection(source, /Retrieval check|检索检查/).match(/^\d+\. /gm))
        .toHaveLength(5);
      expect(content).toMatch(/BSD-3[\s\S]{0,160}BSD-3-Clause/);
      expect(content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
    }
  });

  it('locks L04 group scope, partial validity, storage synchronization, variants, and VIS10 reuse', async () => {
    const pages = await readPublication(publications[3]);
    const variants = [
      'BLOCK_REDUCE_RAKING_COMMUTATIVE_ONLY',
      'BLOCK_REDUCE_RAKING',
      'BLOCK_REDUCE_WARP_REDUCTIONS',
      'BLOCK_REDUCE_WARP_REDUCTIONS_NONDETERMINISTIC',
      'BLOCK_SCAN_RAKING',
      'BLOCK_SCAN_RAKING_MEMOIZE',
      'BLOCK_SCAN_WARP_SCANS',
    ];

    for (const source of pages) {
      const content = body(source);
      for (const token of [
        'cub::WarpReduce',
        'cub::WarpScan',
        'cub::BlockReduce',
        'cub::BlockScan',
        '<cub/warp/warp_reduce.cuh>',
        '<cub/warp/warp_scan.cuh>',
        '<cub/block/block_reduce.cuh>',
        '<cub/block/block_scan.cuh>',
        'LogicalWarpThreads',
        'TempStorage',
        'valid_items',
        'num_valid',
        '__syncwarp(mask)',
        '__syncthreads()',
        'TERM-183',
        'TERM-184',
        'PB-R4-004',
      ]) expect(content, token).toContain(token);
      for (const variant of variants) expect(content, variant).toContain(variant);

      expect(content).toMatch(/LogicalWarpThreads[\s\S]{0,420}(?:consecutive|连续)/i);
      expect(content).toMatch(/(?:not an arbitrary|不是.*任意).*lanes/is);
      expect(content).toMatch(/(?:power of two|2 的幂)[\s\S]{0,260}(?:only the first logical warp|只有第一个 logical warp)/i);
      expect(content).toContain('threadIdx.x + BlockDimX * (threadIdx.y + BlockDimY * threadIdx.z)');
      expect(content).toMatch(/(?:launch dimensions|Runtime launch)[\s\S]{0,120}(?:matching|match|匹配).*template/is);
      expect(content).toMatch(/embedded barriers[\s\S]{0,240}(?:do not replace|不能替代)[^\n]*(?:caller|调用者)/i);
      expect(content).toMatch(/valid_items[^\n]*(?:Every thread|all threads|所有 threads)[^\n]*(?:agree|达成一致)/i);
      expect(content).toMatch(/invalid outputs (?:remain|保持) unmodified/i);
      expect(content).toMatch(/(?:zero|零个) valid inputs[\s\S]{0,100}(?:undefined|未定义)/i);
      expect(content).toMatch(/BlockScan[\s\S]{0,220}no corresponding dynamic valid-count|BlockScan[\s\S]{0,220}没有对应的 dynamic valid-count/i);
      expect(content).toMatch(/NONDETERMINISTIC[\s\S]{0,260}(?:order is not guaranteed|不保证相同 reduction order)/i);

      expect(content).toContain('/visuals/reduction-stages/');
      expect(content).toMatch(/VIS10[\s\S]{0,420}(?:creates no duplicate visual|不创建第二个 visual)/i);
      expect(content).not.toMatch(/^import\s|<[A-Z][A-Za-z0-9]*(?:Visual|Explorer)\b/m);
      expect(content).toMatch(/BSD-3[\s\S]{0,180}BSD-3-Clause[\s\S]{0,180}Apache-2\.0 WITH LLVM-exception/);
      expect(content).toMatch(/CC-BY-4\.0[\s\S]{0,100}provenance: original/);
      expect(markdownSection(source, /Retrieval check|检索检查/).match(/^\d+\. /gm))
        .toHaveLength(5);
      expect(content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
    }
  });

  it.each([
    { unit: 'L03', exercisePublication: publications[1], solutionPublication: publications[2] },
    { unit: 'L04', exercisePublication: publications[4], solutionPublication: publications[5] },
  ])('publishes exactly three $unit Exercises with two hints and three separate solutions', async ({
    exercisePublication,
    solutionPublication,
  }) => {
    const [exercisePages, solutionPages] = await Promise.all([
      readPublication(exercisePublication),
      readPublication(solutionPublication),
    ]);

    for (const source of exercisePages) {
      const content = body(source);
      expect(content.match(/^## (?:练习(?:（Exercise）)? ?\d|Exercise \d)[:：]/gm)).toHaveLength(3);
      expect(content.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      for (const number of [1, 2, 3]) {
        expect(markdownSection(source, new RegExp(`^(?:Exercise ${number}|练习(?:（Exercise）)? ?${number})[:：]`))
          .match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(2);
      }
      for (const label of [
        /\*\*(?:目标：|Goal:)\*\*/g,
        /\*\*(?:约束：|Constraints:)\*\*/g,
        /\*\*(?:预期证据：|Expected evidence:)\*\*/g,
        /\*\*(?:验收条件：|Acceptance criteria:)\*\*/g,
      ]) expect(content.match(label)).toHaveLength(3);
      expect(content).toMatch(/separate reviewed solutions|独立复核解答/i);
      expect(content).not.toMatch(/^## (?:解答|Solution) \d/m);
      expect(content).not.toContain('```');
    }

    for (const source of solutionPages) {
      const content = body(source);
      expect(content.match(/^## (?:解答|Solution) \d[:：]/gm)).toHaveLength(3);
      expect(content.match(/\*\*(?:复核结论：|Reviewed solution:)\*\*/g)).toHaveLength(3);
      expect(content).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
      expect(content).toMatch(/^## (?:常见错误|Common errors)$/m);
      expect(content).not.toContain('<details>');
      expect(content).not.toContain('```');
    }
  });

  it('uses present publication tense for all L03/L04 main, exercise, and solution pages', async () => {
    const pages = (await Promise.all(publications.slice(0, 6).map(readPublication))).flat();
    const staleIssue34Wording = /(?:planned|计划中的)[^\n]*(?:PB-R4-00[34]|TERM-18[34]|EX17|LAB11)|(?:EX17[^\n]{0,180}(?:will (?:publish|own)|将(?:发布|承载))|LAB11[^\n]{0,180}(?:will compare|将(?:比较|对比)))/i;

    for (const source of pages) expect(body(source)).not.toMatch(staleIssue34Wording);
  });

  it('publishes the paired Practice Bank, Glossary, and source records', async () => {
    const [zhPractice, enPractice, zhGlossary, enGlossary, zhSources, enSources, maintenance] = await Promise.all([
      readFile(path.join(docsRoot, 'practice.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/practice.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'glossary.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/glossary.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'MAINTENANCE_SOURCES.md'), 'utf8'),
    ]);

    for (const source of [zhPractice, enPractice]) {
      expect(source.match(/id="pb-r4-003"/g)).toHaveLength(1);
      expect(source.match(/id="pb-r4-004"/g)).toHaveLength(1);
      const deviceEntry = sliceBetween(source, 'id="pb-r4-003"', 'id="pb-r4-004"');
      const groupEntry = sliceBetween(
        source,
        'id="pb-r4-004"',
        source.includes('## Review record') ? '## Review record' : '## 复核记录',
      );
      for (const token of ['PB-R4-003', 'L03', 'DeviceReduce::Sum', 'TERM-183', 'SRC-CUDA-063']) {
        expect(deviceEntry, token).toContain(token);
      }
      expect(deviceEntry).not.toMatch(/not reviewed|unreviewed|未复核/i);
      expect(deviceEntry).toMatch(/DeviceReduce::Sum[\s\S]{0,220}same-GPU run-to-run determinism/i);
      expect(deviceEntry).toMatch(/CUB 1\.15\.1 `DeviceScan`[\s\S]{0,180}(?:same scoped guarantee|(?:相同|同一) scoped guarantee)/i);
      expect(deviceEntry).toMatch(/CUB 2\.8\.2[\s\S]{0,100}3\.3\.4[\s\S]{0,100}(?:selected )?3\.4\.2[\s\S]{0,180}pseudo-associative run-to-run variation/i);
      expect(deviceEntry).toMatch(/(?:exact integer-prefix acceptance|`uint32_t` scan rows (?:still require|仍要求) exact prefixes)/i);
      for (const token of ['PB-R4-004', 'L04', 'TempStorage', 'TERM-183', 'TERM-184', 'SRC-CUDA-064', 'VIS10']) {
        expect(groupEntry, token).toContain(token);
      }
    }

    for (const source of [zhGlossary, enGlossary]) {
      expect(source.match(/id="term-183"/g)).toHaveLength(1);
      expect(source.match(/id="term-184"/g)).toHaveLength(1);
      const temporaryStorage = sliceBetween(source, 'id="term-183"', 'id="term-184"');
      const logicalWarp = sliceBetween(
        source,
        'id="term-184"',
        source.includes('## Maintenance rule') ? '## Maintenance rule' : '## 维护规则',
      );
      for (const token of ['temporary storage', 'TempStorage', 'L03', 'L04', 'EX17', 'LAB11']) {
        expect(temporaryStorage, token).toContain(token);
      }
      expect(logicalWarp).toMatch(/logical warp[\s\S]{0,240}(?:consecutive|连续)/i);
      expect(logicalWarp).toContain('LogicalWarpThreads');
      expect(logicalWarp).toContain('L04');
    }

    for (const source of [zhSources, enSources]) {
      expect(source.match(/id="src-cuda-063"/g)).toHaveLength(1);
      expect(source.match(/id="src-cuda-064"/g)).toHaveLength(1);
      const deviceRecord = source.split('\n').find((line) => line.includes('id="src-cuda-063"')) ?? '';
      const groupRecord = source.split('\n').find((line) => line.includes('id="src-cuda-064"')) ?? '';
      for (const token of [
        'L03',
        'EX17',
        'LAB11',
        'DeviceReduce::Sum',
        'CUB_VERSION',
        'device_reduce.cuh',
        'device_scan.cuh',
        'version.cuh',
        'SHA-256-addressed redistribution archives',
      ]) {
        expect(deviceRecord, token).toContain(token);
      }
      expect(deviceRecord).toMatch(/Context7[\s\S]{0,80}(?:did not verify|没有验证)/i);
      for (const token of ['L04', 'TempStorage', '__syncwarp(mask)', '__syncthreads()', 'VIS10']) {
        expect(groupRecord, token).toContain(token);
      }

      const authorityNote = sliceBetween(
        source,
        '**`SRC-CUDA-063` bundled-header authority',
        source.includes('VIS19 and VIS21') ? 'VIS19 and VIS21' : 'VIS19 与 VIS21',
      );
      for (const token of [
        'cub/device/device_reduce.cuh',
        'cub/device/device_scan.cuh',
        'cub/version.cuh',
        '99d77d9e4c75d5e4663e473577f1871e65bca4ea0b9023f544a3556f0c1776c7',
        '8b1a5095669e94f2f9afd7715533314d418179e9452be61e2fde4c82a3e542aa',
        '26957cede74f9341174ecaf0372f3f886e7c46ceccb98d6dc775fe2b68d19268',
      ]) expect(authorityNote, token).toContain(token);
      expect(authorityNote).toMatch(/CUB 1\.15\.1 `DeviceScan`[\s\S]{0,180}(?:same scoped guarantee|相同 scoped guarantee)/i);
      expect(authorityNote).toMatch(/2\.8\.2[\s\S]{0,100}3\.3\.4[\s\S]{0,180}pseudo-associative run-to-run variation/i);
      expect(authorityNote).toMatch(/Context7[\s\S]{0,100}(?:did not inspect or verify|没有检查或验证)/i);
    }

    for (const token of [
      'cub/device/device_reduce.cuh',
      'cub/device/device_scan.cuh',
      'cub/version.cuh',
      'SHA-256-addressed redistribution archives are authoritative',
    ]) expect(maintenance, token).toContain(token);
    expect(maintenance).toMatch(/Context7 did not inspect or verify the archives/i);
    expect(maintenance).toMatch(/CUB 1\.15\.1 `DeviceScan`[\s\S]{0,180}same scoped guarantee/i);
    expect(maintenance).toMatch(/bundled 2\.8\.2 and 3\.3\.4[\s\S]{0,180}pseudo-associative run-to-run variation/i);
  });

  it('binds EX17 pages to original canonical source, headers, CPU references, and five profiles', async () => {
    const [pages, projectSource, cudaSource, project] = await Promise.all([
      readPublication(publications[6]),
      readFile(path.join(exampleRoot, 'project.json'), 'utf8'),
      readFile(path.join(exampleRoot, 'src/cub_device_reduction_scan.cu'), 'utf8'),
      loadCanonicalExample(projectRoot, 'EX17'),
    ]);
    const standaloneProject = JSON.parse(projectSource);

    expect(project).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      id: 'EX17',
      sourceCommit,
      license: 'Apache-2.0',
      provenance: 'original',
      correctness: {
        elementCount: 4099,
        reduction: {
          inputType: 'float',
          referenceType: 'double',
          absoluteTolerance: 0.0001,
          relativeTolerance: 0.00002,
        },
        scan: {
          inputType: 'uint32_t',
          comparison: 'exact',
          deterministicTotal: 16390,
        },
      },
    });
    expect(project.evidenceBundleCommit).toBe(publicationBundleCommit);
    expect(project.downloadUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${publicationBundleCommit}.zip`,
    );
    expect(standaloneProject).not.toHaveProperty('sourceCommit');
    expect(standaloneProject).not.toHaveProperty('sourceUrl');
    expect(standaloneProject).not.toHaveProperty('downloadUrl');
    expect(Object.keys(project.ranges)).toEqual(['cpu-reference', 'device-reduce', 'device-scan']);
    expect(project.compatibility.checks.map(({ id }: { id: string }) => id)).toEqual(profileIds);
    expect(project.evidence).toMatchObject({
      compilation: [],
      runtime: 'Pending Hardware Verification',
      recordedObservations: [],
    });
    expect(cudaSource.match(/^#include <cub\/[^>]+>$/gm)).toEqual([
      '#include <cub/device/device_reduce.cuh>',
      '#include <cub/device/device_scan.cuh>',
      '#include <cub/version.cuh>',
    ]);

    for (const source of pages) {
      const metadata = frontmatter(source);
      const content = body(source);
      expect(metadata).toContain('canonicalExample: EX17');
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['cpu-reference', 'device-reduce', 'device-scan']);
      expect(canonicalRanges(source)).toEqual(['cpu-reference', 'device-reduce', 'device-scan']);
      expect(content).toContain(`tree/${sourceCommit}/examples/ex17-cub-device-reduction-scan`);
      expect(content).toContain(`archive/${publicationBundleCommit}.zip`);
      expect(content).toMatch(/4,099[\s\S]{0,220}(?:double CPU reference|double oracle|double CPU|`double`)/i);
      expect(content).toMatch(/uint32[\s\S]{0,280}(?:independent|独立)[\s\S]{0,160}(?:inclusive|exclusive)/i);
      for (const id of profileIds) expect(content, id).toContain(id);
      expect(markdownSection(source, /five profiles|五个 profiles/).match(/^\| `cuda-.+$/gm))
        .toHaveLength(5);
      expect(content).not.toMatch(/```(?:cuda|cpp|c\+\+)/i);
    }
  });

  it('keeps LAB11 complete but unfilled across correctness, timing, traffic, and maintenance', async () => {
    const [pages, fixtureSource, licenseSource] = await Promise.all([
      readPublication(publications[7]),
      readFile(path.join(projectRoot, fixturePath), 'utf8'),
      readFile(path.join(projectRoot, `${fixturePath}.license.json`), 'utf8'),
    ]);
    const fixture = JSON.parse(fixtureSource);

    for (const source of pages) {
      const metadata = frontmatter(source);
      const content = body(source);
      expect(metadata).toContain('canonicalExample: EX17');
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['cpu-reference', 'device-reduce']);
      expect(canonicalRanges(source)).toEqual(['cpu-reference', 'device-reduce']);
      expect(markdownSection(source, /five component profiles|五个 component profiles/)
        .match(/^\| `cuda-.+$/gm)).toHaveLength(5);
      for (const id of profileIds) expect(content, id).toContain(id);

      for (const token of [
        '4,099',
        '4099 -> 9 -> 1',
        '256 threads',
        'absolute_error',
        'allowed_error',
        'cross_candidate_bits_equal',
        'steady-state-invocation',
        'setup-inclusive',
        'process_local_warmup=excluded-pass',
        '16,472 bytes',
        'Owned source',
        'Incident / debug burden',
        'Pending Hardware Verification',
        'recordedObservations',
        'VIS10',
        'lab11-reduction-comparison.cu',
        runnerSha256,
        '--candidate custom --timing none --elements 4099 --verify tolerance',
        '--candidate cub --timing none --elements 4099 --verify tolerance',
      ]) expect(content, token).toContain(token);
      expect(content).toContain('int((i * 37 + 11) % 101) - 50');
      expect(content).toContain('float((i * 13 + 3) % 17) * 0.001F');
      expect(content).toMatch(/Capacity (?:is not|不是) bytes read(?: or |\/)written/i);
      expect(content).toMatch(/Expected observations, not recorded results|预期观察，不是 recorded results/i);

      const manifest = markdownSection(source, /complete unfilled Environment Manifest|完整的未填写 Environment Manifest/i);
      const manifestRows = manifest.split('\n').filter((line) => line.startsWith('|')).slice(2);
      expect(manifestRows).toHaveLength(35);
      expect(manifestRows.every((row) => row.endsWith('| `unfilled` |'))).toBe(true);

      const results = markdownSection(source, /Expected observations, not recorded results|预期观察，不是 recorded results/i);
      expect(results.match(/^\| ---/gm)).toHaveLength(4);
      expect(results.match(/^\| each of five \|/gm)).toHaveLength(7);
      expect(content).toMatch(/VIS10[\s\S]{0,360}(?:evidence-neutral|证据中立)/i);
    }

    expect(fixture).toMatchObject({
      'SPDX-License-Identifier': 'CC-BY-4.0',
      schemaVersion: 2,
      fixtureId: 'LAB11-NCU-EXPECTED',
      labId: 'LAB11',
      exampleId: 'EX17',
      sourceCommit,
      provenance: 'original',
      fixtureType: 'expected-only-profiler-report-plan',
      captureStatus: 'pending-hardware-verification',
      recordedObservations: [],
      sanitization: { status: 'passed', reviewDate },
    });
    expect(validateProfilerReportFixture(fixture, fixtureSource)).toEqual({ valid: true, errors: [] });
    expect(fixture.method.componentProfiles.map(({ id }: { id: string }) => id)).toEqual(profileIds);
    expect(fixture.captureCommands).toEqual({
      custom: expect.stringContaining(
        './build/lab11-reduction-comparison --candidate custom --timing none --elements 4099 --verify tolerance',
      ),
      cub: expect.stringContaining(
        './build/lab11-reduction-comparison --candidate cub --timing none --elements 4099 --verify tolerance',
      ),
    });
    expect(fixture.captureCommands.custom).toContain('<unique-profile-pair-custom-report-base>');
    expect(fixture.captureCommands.cub).toContain('<unique-profile-pair-cub-report-base>');
    expect(fixture.captureCommands.custom).not.toBe(fixture.captureCommands.cub);
    expect(fixture.method.solutionAsset).toEqual({
      publicPath: '/assets/exercise-solutions/lab11-reduction-comparison.cu',
      repositoryPath: runnerPath,
      sha256: runnerSha256,
      license: 'Apache-2.0',
      provenance: 'original',
      upstreamAdaptation: 'none',
    });
    expect(fixture.method.runnerCli.processBoundary).toMatch(/one invocation selects one candidate identity/i);
    expect(fixture.method.runnerCli.timedOutput).toContain('process_local_warmup=excluded-pass');
    expect(fixture.method.componentProfiles.map(({ expectedCUBVersionMacro }: { expectedCUBVersionMacro: number }) =>
      expectedCUBVersionMacro)).toEqual([101501, 200802, 300304, 300402, 300402]);
    expect(fixture.workload).toMatchObject({
      elementType: 'float',
      elementCount: 4099,
      inputBytes: 16396,
      customStageSizes: [4099, 9, 1],
      customFixedBytesPerProcess: 16468,
      cubFixedBytesBeforeTemporaryStoragePerProcess: 16400,
      cubTemporaryStorageBytes: 'unfilled from same-device two-phase query',
    });
    expect(fixture.correctnessGate).toMatchObject({
      cpuReference: 'serial index-order left fold after exact conversion of each input float to double',
      absoluteTolerance: 0.0001,
      relativeTolerance: 0.00002,
      comparisonRule: 'absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)',
      currentResult: 'expected; unrecorded',
    });
    expect(Object.keys(fixture.environmentManifest)).toEqual(PROFILER_FIXTURE_MANIFEST_FIELDS);
    expect(Object.values(fixture.environmentManifest)).toEqual(
      Array(PROFILER_FIXTURE_MANIFEST_FIELDS.length).fill('unfilled'),
    );
    expect(Object.keys(fixture.method.evidenceRecordPlan)).toEqual(lab11ManifestFields);
    expect(Object.values(fixture.method.evidenceRecordPlan)).toEqual(
      Array(lab11ManifestFields.length).fill('unfilled'),
    );
    expect(fixture.method.timing.actualValues).toEqual([]);
    expect(fixture.method.timing).toHaveProperty('steadyState');
    expect(fixture.method.timing).toHaveProperty('setupInclusive');
    expect(fixture.method.timing).toHaveProperty('processLocalWarmUp');
    expect(fixture.method.acquisition.processLocalWarmUpsPerTimedInvocation).toBe(1);
    expect(fixture.method.traffic).toMatchObject({
      ex11SourceDerivedLogicalGlobalBytes: 16472,
      observedCandidateTraffic: expect.stringMatching(/^unfilled/),
    });
    expect(fixture.method.maintenanceRubric).toHaveLength(5);
    expect(fixture.expectedObservations).toHaveLength(10);
    expect(Object.values(fixture.method.recordedResults).every(
      (records) => Array.isArray(records) && records.length === 0,
    )).toBe(true);
    expect(fixture.method.recordedResults.actualMetricNames).toEqual([]);
    expect(fixture.method.recordedResults.actualMetricValues).toEqual([]);
    expect(JSON.parse(licenseSource)).toEqual({
      license: 'CC-BY-4.0',
      provenance: 'original',
      attribution: 'CUDA Learning Site, Xiang Zhang, 2026',
    });
  });

  it('leaks no private material and publishes no invented performance result', async () => {
    const publicationPaths = publications.flatMap((publication) => ['', 'en/'].map((locale) =>
      path.join(docsRoot, `${locale}${publication.path}.${publication.extension}`)));
    const indexPaths = ['', 'en/'].flatMap((locale) => [
      path.join(docsRoot, `${locale}practice.mdx`),
      path.join(docsRoot, `${locale}glossary.mdx`),
      path.join(docsRoot, `${locale}sources-and-versions.mdx`),
    ]);
    const scopedFiles = [
      ...publicationPaths,
      ...indexPaths,
      ...ex17Files.map((relativePath) => path.join(exampleRoot, relativePath)),
      path.join(projectRoot, fixturePath),
      path.join(projectRoot, `${fixturePath}.license.json`),
      path.join(projectRoot, runnerPath),
    ];
    const sources = await Promise.all(publicationPaths.map((file) => readFile(file, 'utf8')));
    const fixtureSource = await readFile(path.join(projectRoot, fixturePath), 'utf8');
    const inventedPerformance = /\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?|GB\/s|GiB\/s|elements\/s)\b|\b\d+(?:\.\d+)?\s*[x×]\s*(?:speedup|faster|加速)|(?:speedup|winner)\s*(?:is|=|:|为)\s*\d/i;

    expect((await scanFiles(projectRoot, scopedFiles)).violations).toEqual([]);
    expect([...sources, fixtureSource].join('\n')).not.toMatch(inventedPerformance);
    expect(fixtureSource).not.toMatch(/"performanceObservations"\s*:|"Runtime-Verified"\s*:/i);
  });
});
