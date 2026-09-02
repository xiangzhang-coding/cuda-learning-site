// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const fixtureRoot = path.join(projectRoot, 'public/assets/profiler-report-fixtures');
const slug = 'optimize-canonical-transpose';
const reviewDate = '2026-09-02';
const sourceCommit = '981939cc705faf721ac06d1b70f2c5c4a8111e92';
const runnerAssetUrl = '/assets/exercise-solutions/q11-lab10-transpose-candidates.cu';
const runnerRepositoryPath = 'public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu';
const runnerSha256 = '920a4ca6f44586a3882e31756fca3e28feb655282327721e3fb3a308bac3f251';
const reducerAssetUrl = '/assets/exercise-solutions/lab10-report-reducer.mjs';
const reducerRepositoryPath = 'public/assets/exercise-solutions/lab10-report-reducer.mjs';
const reducerSha256 = '7754a9b63369ea00d994c5f43627796a87f57607e869e10e5a5cd238c51056cb';
const nodeVersion = '24.19.0';
const nodeVersionOutput = `v${nodeVersion}`;
const treeUrl = `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${sourceCommit}/examples/ex14-tiled-transpose`;
const archiveUrl = `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${sourceCommit}.zip`;
const attemptIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'] as const;
const stageIds = [
  'baseline-direct',
  'coalescing-direction',
  'shared-memory-tiling',
  'padded-bank-layout',
] as const;

const manifestFields = [
  'gpuIdentity',
  'computeCapability',
  'gpuCountUsed',
  'driver',
  'toolkitLane',
  'cudaToolkit',
  'cuptiVersion',
  'profilerVersion',
  'nvcc',
  'hostCompiler',
  'operatingSystem',
  'sourceRepository',
  'binarySha256',
  'buildContract',
  'workload',
  'permissions',
  'deviceAccessState',
  'concurrentLoad',
  'clockPowerThermal',
  'exactCommands',
  'correctnessMethod',
  'correctnessCriteria',
  'measurementMethod',
  'rawLogs',
  'rawReports',
  'exitStatuses',
  'custody',
  'criteriaResult',
] as const;

const fixtureTopLevelFields = [
  'SPDX-License-Identifier',
  'schemaVersion',
  'fixtureId',
  'labId',
  'exampleId',
  'sourceCommit',
  'provenance',
  'fixtureType',
  'captureStatus',
  'tool',
  'captureCommand',
  'workload',
  'correctnessGate',
  'environmentManifest',
  'method',
  'sanitization',
  'expectedObservations',
  'recordedObservations',
  'claimBoundary',
] as const;

function frontmatter(source: string) {
  return /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
}

function yamlList(metadata: string, field: string) {
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function evidenceList(metadata: string, field: string) {
  const match = new RegExp(`^  ${field}:\\n((?:    - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

async function readPair() {
  return Promise.all([
    readFile(path.join(docsRoot, `labs/${slug}.mdx`), 'utf8'),
    readFile(path.join(docsRoot, `en/labs/${slug}.mdx`), 'utf8'),
  ]);
}

async function readSourcePair() {
  return Promise.all([
    readFile(path.join(docsRoot, 'sources-and-versions.mdx'), 'utf8'),
    readFile(path.join(docsRoot, 'en/sources-and-versions.mdx'), 'utf8'),
  ]);
}

async function readJson(name: string) {
  return JSON.parse(await readFile(path.join(fixtureRoot, name), 'utf8'));
}

async function projectFileSha256(relativePath: string) {
  return createHash('sha256').update(await readFile(path.join(projectRoot, relativePath))).digest('hex');
}

describe('LAB10 canonical transpose optimization contract', () => {
  it('locks the original reviewed runner and reducer assets by exact bytes', async () => {
    await expect(Promise.all([
      projectFileSha256(runnerRepositoryPath),
      projectFileSha256(reducerRepositoryPath),
    ])).resolves.toEqual([runnerSha256, reducerSha256]);
  });

  it('publishes an aligned bilingual Lab with the frozen curriculum and canonical-source graph', async () => {
    const [zh, en] = await readPair();
    const zhMetadata = frontmatter(zh);
    const enMetadata = frontmatter(en);

    expect(zhMetadata).toContain('pairId: lab10');
    expect(enMetadata).toContain('pairId: lab10');
    expect(zhMetadata).toContain(`counterpart: /en/labs/${slug}/`);
    expect(enMetadata).toContain(`counterpart: /labs/${slug}/`);
    expect(zh).toContain(`href="/en/labs/${slug}/"`);
    expect(en).toContain(`href="/labs/${slug}/"`);

    for (const source of [zh, en]) {
      const metadata = frontmatter(source);
      expect(metadata).toContain('unitId: LAB10');
      expect(metadata).toContain('resourceKind: lab');
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q11']);
      expect(yamlList(metadata, 'relatedUnits')).toEqual(['A05', 'Q06', 'Q08', 'Q10', 'EX14', 'VIS11']);
      expect(yamlList(metadata, 'exampleIds')).toEqual(['EX14']);
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['cpu-reference', 'tiled-transpose']);
      expect(yamlList(metadata, 'toolkitLanes')).toEqual(['cuda-11.8', 'cuda-12.9', 'cuda-13.3']);
      expect(metadata).toContain('canonicalExample: EX14');
      expect(metadata).toContain("minimumComputeCapability: '7.5'");
      expect(metadata).toContain('maximumProblemMemoryBytes: 134221952');
      expect(metadata).toContain('gpuCount: 1');
      expect(metadata).toMatch(new RegExp(`hardwareGate:.*Node\\.js ${nodeVersion}.*${nodeVersionOutput}`));
      expect(yamlList(metadata, 'permissions').join(' ')).toContain(`Node.js ${nodeVersion}`);
      expect(yamlList(metadata, 'permissions').join(' ')).toMatch(/LAB10 reducer/i);
      expect(metadata).toMatch(/compilation: \[\][\s\S]*runtime:\n    - Pending Hardware Verification/);
      expect(evidenceList(metadata, 'expectedObservations')).toHaveLength(9);
      expect(metadata).toContain('recordedObservations: []');
      expect(metadata).toContain("attrs: { name: 'cuda:source-count', content: '10' }");
      expect(source).toContain(treeUrl);
      expect(source).toContain(archiveUrl);
      expect(source).toMatch(/Q11 (?:Exercise 2|练习 2)[\s\S]{0,180}learner-owned runner provenance/i);
      expect([...source.matchAll(/<CanonicalCode exampleId="EX14" range="([^"]+)" \/>/g)]
        .map((match) => match[1])).toEqual(['cpu-reference', 'tiled-transpose']);
      expect(source).toContain('/assets/profiler-report-fixtures/lab10-nsight-compute.expected.json');
      expect(source).toContain(runnerAssetUrl);
      expect(source).toContain(runnerRepositoryPath);
      expect(source).toContain(runnerSha256);
      expect(source).toContain(reducerAssetUrl);
      expect(source).toContain(reducerRepositoryPath);
      expect(source).toContain(reducerSha256);
    }

    expect(zh).toContain("import CanonicalCode from '../../../components/CanonicalCode.astro';");
    expect(en).toContain("import CanonicalCode from '../../../../components/CanonicalCode.astro';");
    expect(yamlList(zhMetadata, 'structure')).toEqual(yamlList(enMetadata, 'structure'));
  });

  it('freezes distinct correctness and profiling bounds plus one-variable stage hypotheses', async () => {
    const pair = await readPair();
    const frozenCoordinates = [
      'rows: 4096',
      'columns: 4096',
      'element_count: 16777216',
      'bytes_per_matrix: 67108864',
      'global_matrix_bytes: 134217728',
      'maximum_shared_bytes_per_block: 4224',
      'declared_problem_bound_bytes: 134221952',
      'canonical_correctness_fixture_bound_bytes: 20608',
      '4096 x 4096 x 4 = 67,108,864',
      '2 x 67,108,864 = 134,217,728',
      '32 x 33 x 4 = 4,224',
      '134,217,728 + 4,224 = 134,221,952',
    ];
    const stageIds = [
      'baseline-direct',
      'coalescing-direction',
      'shared-memory-tiling',
      'padded-bank-layout',
    ];

    for (const source of pair) {
      for (const coordinate of frozenCoordinates) expect(source).toContain(coordinate);
      for (const stageId of stageIds) expect(source).toContain(`stage_id: ${stageId}`);
      expect(source).toMatch(/20,608[\s\S]{0,220}(?:distinct|separate|不同|分开)/i);
      expect(source).toMatch(/5x7[\s\S]{0,120}33x35[\s\S]{0,120}64x32[\s\S]{0,160}4096x4096/i);
      expect(source).toMatch(/four separate (?:runner )?invocations|四次独立 (?:runner )?invocation/i);
      expect(source).toMatch(/warm-up[\s\S]{0,180}profiled process[\s\S]{0,180}(?:only|只使用).*4096x4096/i);
      expect(source).toMatch(/exact(?: float)? comparison|逐元素精确/i);
      expect(source).toMatch(/independent (?:CPU|oracle)|独立 CPU/i);
      expect(source).toMatch(/one variable at a time|一次只改变一个变量/i);
      expect(source).toMatch(/coalescing[\s\S]{0,260}hypothesis/i);
      expect(source).toMatch(/tiling[\s\S]{0,260}hypothesis/i);
      expect(source).toMatch(/bank-layout[\s\S]{0,260}hypothesis/i);
      expect(source).toMatch(/held constants|保持不变的常量/i);
      expect(source).toContain('cudaDeviceSynchronize');
      for (const invariant of [
        'stable device output allocation',
        'quiet-NaN sentinel',
        'checked host-to-device copy',
        'checked device-to-host copy',
        'no sentinel remains',
      ]) expect(source).toContain(invariant);
      expect(source).toMatch(/finite,? non-NaN deterministic input(?: and|\/)? oracle|finite、non-NaN deterministic input\/oracle/i);
      expect(source).toMatch(/outside selected kernel metrics|selected kernel metrics 之外/i);
      expect(source).toContain('source_sha256:');
      expect(source).toContain('binary_sha256:');
      expect(source).toMatch(/no timing, metric, speedup, bottleneck, or winner|不预填 timing、metric、speedup、bottleneck 或 winner/i);
    }
  });

  it('requires complete gates, ten-attempt custody, statistics, blockers, and evidence boundaries', async () => {
    const pair = await readPair();
    const ownerSources = [
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-toolkit-release-notes/index.html',
      'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#matrix-transpose-example-using-shared-memory',
      'https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html',
      'https://docs.nvidia.com/nsight-compute/2022.3/NsightComputeCli/index.html',
      'https://docs.nvidia.com/nsight-compute/2025.2/NsightComputeCli/index.html',
      'https://docs.nvidia.com/nsight-compute/NsightComputeCli/index.html',
      'https://docs.nvidia.com/nsight-compute/ReleaseNotes/index.html#updates-in-2026-2-1',
      'https://docs.nvidia.com/cupti/main/main.html',
    ];
    const laneCoordinates = [
      '11.8.0', '12.9.1', '12.9.2', '13.3', '13.3.1',
      '2022.3.0', '2022.3.0.22', '2025.2.1', '2025.2.1.3', '2026.2.1.5',
      '11.8.87', '12.9.79', '13.3.75',
    ];

    for (const source of pair) {
      const metadata = frontmatter(source);
      const sourceEntries = metadata.split(/^  - title:/m).slice(1);
      expect(sourceEntries).toHaveLength(ownerSources.length);
      for (const entry of sourceEntries) expect(entry).toContain(`accessDate: '${reviewDate}'`);
      for (const coordinate of ownerSources) expect(source).toContain(coordinate);
      for (const coordinate of laneCoordinates) expect(source).toContain(coordinate);
      expect(source).toContain('/websites/nvidia_cuda_cuda-programming-guide');
      expect(source).toContain('/websites/nvidia_nsight-compute_nsightcompute');
      expect(source).toMatch(/discovery and cross-check only|仅用于 discovery 与 cross-check/i);
      expect(source).toMatch(/owner (?:documentation|sources)[\s\S]{0,120}(?:authoritative|govern)|owner documents[\s\S]{0,120}(?:权威|负责)/i);

      const profilerGate = /## (?:通过 exact-GPU profiler 与 permission gates|Pass exact-GPU profiler and permission gates)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const acquisition = /## (?:采集恰好十次新的 profiler attempts|Acquire exactly ten fresh profiler attempts)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const labContract = /## (?:实验合同|Lab contract)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const prerequisites = /## (?:先修检查|Prerequisite check)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const canonicalProject = /## (?:获取 canonical project|Obtain the canonical project)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const buildCustody = /## (?:构建并哈希 sources 与 binaries|Build and hash sources and binaries)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const correctness = /## (?:通过精确的 unprofiled correctness baseline|Pass the exact unprofiled correctness baseline)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const warmUp = /## (?:执行一次被排除的 direct-process warm-up|Run one excluded direct-process warm-up)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const manifest = /## (?:创建完整的未填写 Environment Manifest|Create the complete unfilled Environment Manifest)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const reduction = /## (?:只归约 qualifying full batch|Reduce only a qualifying full batch)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const criteriaBlockers = /## (?:验收条件与 blockers|Acceptance criteria and blockers)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const cleanup = /## (?:清理与消毒且不破坏证据|Clean up and sanitize without destroying evidence)\n\n([\s\S]*?)(?=\n## )/.exec(source)?.[1] ?? '';
      const recordedCalls = [...source.matchAll(/```bash\n([\s\S]*?)```/g)]
        .flatMap((match) => match[1].replace(/\\\n\s*/g, ' ').split('\n'))
        .map((line) => line.trim())
        .filter((line) => line.startsWith('run_recorded '));

      expect(recordedCalls).toHaveLength(32);
      for (const call of recordedCalls) expect(call).toMatch(/\|\| exit 1$/);

      expect(labContract).toContain(`Node.js \`${nodeVersion}\``);
      expect(labContract).toContain(`\`node --version\``);
      expect(labContract).toContain(`\`${nodeVersionOutput}\``);
      expect(prerequisites).toMatch(/(?:resolve and record|解析并记录)[\s\S]{0,80}`node` path/i);
      expect(prerequisites).toMatch(new RegExp(
        '`node --version` (?:must output exactly|必须精确输出) `'
        + nodeVersionOutput.replaceAll('.', '\\.') + '`',
      ));
      expect(source).toMatch(/selected (?:NVIDIA )?CUDA image[\s\S]{0,220}(?:does not imply|guarantees no|不代表|不保证)[\s\S]{0,160}Node\.js/i);
      expect(source).toMatch(/(?:Node\.js and the reducer|Node\.js 与 reducer|Node\.js 或 reducer)[\s\S]{0,220}(?:grants no CUDA|不授予 CUDA)/i);

      expect(buildCustody).toContain('run_recorded() {');
      expect(buildCustody).toContain('mkdir -p "${run_dir}"/{build,gates,correctness,warm-up,batches,reduction,custody} || exit 1');
      expect(buildCustody).toContain('test ! -e "$record_path" || return 1');
      expect(buildCustody).toContain('printf \'%q \' "$@" >"$command_path" || return 1');
      expect(buildCustody).toContain('printf \'%s\\n\' "$actual_status" >"$status_path" || return 1');
      expect(buildCustody).toContain('sha256sum "$stdout_path" "$stderr_path" "$status_path" "$command_path" \\');
      expect(buildCustody).toContain('>"$records_hash_path" || return 1');
      expect(buildCustody).toContain('return "$actual_status"');
      expect(canonicalProject).toContain(`source_commit='${sourceCommit}'`);
      expect(canonicalProject).toContain('git diff --exit-code "$source_commit" -- "${canonical_files[@]}"');
      expect(canonicalProject).toContain("p.sourceCommit!==process.argv[1]");
      expect(canonicalProject).toContain('examples/ex14-tiled-transpose/project.json');
      const canonicalFileBlock = /canonical_files=\(([\s\S]*?)\n\)/.exec(canonicalProject)?.[1] ?? '';
      expect(canonicalFileBlock).not.toContain('project.json');
      for (const relativePath of [
        'Makefile',
        'README.md',
        'evidence/README.md',
        'include/tiled_transpose_reference.hpp',
        'scripts/compile-check.sh',
        'src/tiled_transpose.cu',
        'tests/host_reference_test.cpp',
      ]) expect(canonicalProject).toContain(`examples/ex14-tiled-transpose/${relativePath}`);
      expect(canonicalProject).not.toContain(`git checkout ${sourceCommit}`);
      expect(canonicalProject).toMatch(/repository root/i);
      for (const phase of ['preprocess', 'compile', 'link', 'inspect', 'host-test']) {
        expect(buildCustody).toContain(
          `run_recorded build/make-${phase}.stdout.log \\\n  make -C examples/ex14-tiled-transpose ${phase} DIALECT=c++17 BUILD_DIR=../../build || exit 1`,
        );
      }
      expect(buildCustody).toMatch(/run_recorded build\/canonical-source\.sha256 sha256sum[\s\S]{0,320}examples\/ex14-tiled-transpose\/Makefile \|\| exit 1/);
      expect(buildCustody).toContain(
        'run_recorded build/canonical-binary.sha256 sha256sum build/ex14-tiled-transpose || exit 1',
      );
      expect(buildCustody).toMatch(/run_recorded build\/reviewed-runner-source-verify\.stdout\.log[\s\S]{0,360}sha256sum --check --strict[\s\S]{0,240}q11-lab10-transpose-candidates\.cu \|\| exit 1/);
      expect(buildCustody).toContain(runnerSha256);
      expect(buildCustody).toContain(runnerRepositoryPath);
      expect(buildCustody).toMatch(
        /run_recorded build\/reviewed-runner-compile\.stdout\.log[\s\S]{0,500}nvcc[\s\S]{0,120}--std=c\+\+17[\s\S]{0,120}--generate-code=arch=compute_75,code=sm_75[\s\S]{0,120}--generate-code=arch=compute_75,code=compute_75[\s\S]{0,160}--include-path examples\/ex14-tiled-transpose\/include[\s\S]{0,180}q11-lab10-transpose-candidates\.cu[\s\S]{0,140}--output-file build\/lab10-transpose-candidates \|\| exit 1/,
      );
      expect(buildCustody).toMatch(/run_recorded build\/candidate-binary\.sha256 sha256sum[\s\S]{0,120}lab10-transpose-candidates \|\| exit 1/);
      expect(buildCustody).not.toContain('lab10-work/lab10_transpose_candidates.cu');
      expect(buildCustody).toMatch(/learner alternative[\s\S]{0,300}(?:CLI|interface)[\s\S]{0,300}adjacent-stage diff[\s\S]{0,300}hash/i);

      expect(correctness).toMatch(/run_recorded correctness\/ex14\.stdout\.log[\s\S]{0,100}\.\/build\/ex14-tiled-transpose \|\| exit 1/);
      for (const [record, rows, columns] of [
        ['5x7', 5, 7],
        ['33x35', 33, 35],
        ['64x32', 64, 32],
        ['4096x4096', 4096, 4096],
      ] as const) {
        expect(correctness).toMatch(new RegExp(
          `run_recorded correctness/candidates-${record}\\.stdout\\.log[\\s\\S]{0,180}`
          + `--rows ${rows} --columns ${columns} --verify exact \\|\\| exit 1`,
        ));
      }
      expect(manifest).toContain('output_allocation_and_sentinel_invariant:');
      expect(manifest).toContain('analysis_runtime:');
      expect(manifest).toContain('node_path: unfilled');
      expect(manifest).toContain('node_version_output: unfilled');
      expect(manifest).toContain(`required_version: ${nodeVersion}`);
      expect(manifest).toContain(`required_version_output: ${nodeVersionOutput}`);
      expect(manifest).toContain('exact_version_match_status_and_records_sha256: unfilled');
      expect(manifest).toContain('node_and_reducer_execution_result: unfilled');
      expect(manifest).toContain('node_version_and_exact_match_gate: unfilled');
      expect(manifest).toContain(`analysis_runtime: Node.js ${nodeVersion}`);
      expect(manifest).toContain(`required_node_version_output: ${nodeVersionOutput}`);
      expect(manifest).toContain('node_version_and_exact_match_records_sha256: unfilled');
      expect(manifest).toContain('source_binary_node_gate_reducer_report_csv_log_manifest_reduction_ledger_summary_hash_chain: unfilled');
      expect(manifest).toContain('analysis_runtime_gate: unfilled');
      expect(manifest).toContain('process_scope: every correctness, warm-up, and profiled process');
      expect(manifest).toContain('per_stage_prelaunch_sentinel_fill_copy_statuses: unfilled');
      expect(manifest).toContain('complete_output_device_to_host_copy_statuses: unfilled');
      expect(manifest).toContain('output_shape_exact_oracle_and_no_sentinel_results: unfilled');
      expect(manifest).toContain(`reviewed_solution_repository_path: ${runnerRepositoryPath}`);
      expect(manifest).toContain(`reviewed_solution_sha256: ${runnerSha256}`);
      expect(manifest).toContain(`reducer_repository_path: ${reducerRepositoryPath}`);
      expect(manifest).toContain(`reducer_sha256: ${reducerSha256}`);
      expect(manifest).toContain('reduction_integrity_gate: unfilled');
      for (const processSection of [correctness, warmUp, acquisition]) {
        expect(processSection).toContain('quiet-NaN sentinel');
        expect(processSection).toMatch(/stable (?:device )?(?:output )?allocation(?: and|\/)?address|stable allocation\/address/i);
        expect(processSection).toMatch(/complete (?:device-to-host )?(?:output )?(?:copy|readback)|complete-output (?:copy|readback)/i);
        expect(processSection).toMatch(/no-sentinel-remains|no sentinel remains/i);
      }

      expect(profilerGate).toContain('ncu --version');
      expect(profilerGate).toContain('ncu --help');
      expect(profilerGate).toContain('run_recorded gates/ncu-version.initial.stdout.log ncu --version || exit 1');
      expect(profilerGate).toContain('run_recorded gates/ncu-help.bare.stdout.log ncu --help || exit 1');
      expect(profilerGate).toMatch(/exact-version NVIDIA owner CLI manual|匹配的 exact-version NVIDIA owner CLI manual/i);
      expect(profilerGate).toMatch(
        /actual bare help[\s\S]{0,180}(?:exact owner manual|matching manual|该 exact owner manual)[\s\S]{0,120}config-file interface/i,
      );
      expect(profilerGate).toMatch(/`--import`[\s\S]{0,80}`--page raw`[\s\S]{0,80}`--csv`/i);
      expect(profilerGate).toMatch(/both actual help and the matching manual expose config-file control|actual help 与匹配 manual 都存在 config-file control/i);
      expect(profilerGate).toContain('config_args=(--config-file off)');
      expect(profilerGate).toMatch(/reviewed older CLI has no config-file interface|经过复核的旧 CLI 没有 config-file interface/i);
      expect(profilerGate).toContain('config_args=()');
      expect(profilerGate.match(/ncu "\$\{config_args\[@\]\}"/g)).toHaveLength(4);
      expect(profilerGate).toMatch(/run_recorded gates\/config-branch\.stdout\.log[\s\S]{0,180}\|\| exit 1/);
      for (const gate of ['ncu-version.controlled', 'ncu-help.controlled', 'ncu-list-sections', 'ncu-query-metrics']) {
        expect(profilerGate).toMatch(new RegExp(
          `run_recorded gates/${gate.replace('.', '\\.')}\\.stdout\\.log[\\s\\S]{0,180}\\|\\| exit 1`,
        ));
      }
      expect(acquisition.match(/ncu "\$\{config_args\[@\]\}"/g)).toHaveLength(2);
      expect(acquisition).not.toContain('ncu --config-file off');
      expect(acquisition).toContain('test ! -e "$batch_dir" || exit 1');
      expect(acquisition).toContain('mkdir "$batch_dir" || exit 1');
      expect(acquisition).toContain('test ! -e "$attempt_dir" || exit 1');
      expect(acquisition).toContain('mkdir "$attempt_dir" || exit 1');
      expect(source).toContain('test ! -e "$run_dir" || exit 1');
      expect(warmUp).toMatch(/run_recorded warm-up\/direct\.stdout\.log[\s\S]{0,180}--rows 4096 --columns 4096 --verify exact \|\| exit 1/);
      expect(cleanup).toContain(
        'run_recorded custody/make-clean.stdout.log \\\n  make -C examples/ex14-tiled-transpose clean BUILD_DIR=../../build || exit 1',
      );
      expect(acquisition).toContain('test ! -e "${report_base}.ncu-rep" || exit 1');
      expect(acquisition).not.toContain('mkdir -p');
      expect(acquisition).toMatch(/(?:abort[\s\S]{0,120}overwrit|覆盖[\s\S]{0,120}abort)/i);
      expect(acquisition).toContain('run_recorded "batches/${batch_id}/${attempt}/profile.stdout.log"');
      expect(acquisition).toContain('run_recorded "batches/${batch_id}/${attempt}/report.sha256"');
      expect(acquisition).toContain('run_recorded "batches/${batch_id}/${attempt}/report-raw.csv"');
      expect(acquisition).toMatch(/run_recorded "batches\/\$\{batch_id\}\/\$\{attempt\}\/profile\.stdout\.log"[\s\S]{0,600}--verify exact \|\| exit 1/);
      expect(acquisition).toMatch(/run_recorded "batches\/\$\{batch_id\}\/\$\{attempt\}\/report\.sha256"[\s\S]{0,140}sha256sum "\$\{report_base\}\.ncu-rep" \|\| exit 1/);
      expect(acquisition).toContain('--import "${report_base}.ncu-rep" --page raw --csv || exit 1');
      expect(acquisition.indexOf('/report.sha256"')).toBeLessThan(acquisition.indexOf('/report-raw.csv"'));
      expect(buildCustody).toContain('*.csv) record_base="${record_base%.csv}" ;;');
      expect(buildCustody).toContain('local status_path="${record_base}.status"');
      expect(buildCustody).toContain('local records_hash_path="${record_base}.records.sha256"');
      expect(source).not.toMatch(/(?:>|2>)"\$\{(?:run_dir|attempt_dir)\}\//);
      expect(source).toContain('ERR_NVGPUCTRPERM');
      expect(source).toMatch(/administrator-approved non-admin|管理员批准的 non-admin/i);
      expect(source).toMatch(/no `sudo`|禁止 `sudo`|不得使用 `sudo`/i);
      expect(source).toMatch(/selected kernel[\s\S]{0,180}filter|selected kernel 与 filter/i);
      expect(source).toMatch(/one minimal queried section|一个最小 queried section/i);
      expect(source).toMatch(/minimal queried metric list|最小 queried metric list/i);

      expect(source).toMatch(/one excluded direct-process warm-up|一次被排除的 direct-process warm-up/i);
      expect(source).toContain('excluded_from_retained_samples: true');
      expect(source).toContain('for attempt in 01 02 03 04 05 06 07 08 09 10');
      expect(source).toMatch(/fresh `ncu` invocation|新的 `ncu` invocation/i);
      expect(source).toMatch(/acquisition order|采集顺序/i);
      expect(source).toMatch(/median (?:plus|and) min\/max|median 与 min\/max/i);
      expect(source).toMatch(/no sample deletion|不得删除任何 sample/i);
      expect(source).toMatch(/invalid(?:ates)? the full batch|整个 batch 无效/i);
      expect(source).toMatch(/restart(?:s)? all ten|重新开始完整十次|重启完整十次/i);

      expect(source).toContain('.ncu-rep');
      expect(source).toMatch(/\.ncu-rep`? (?:is primary|是 primary artifact)/i);
      expect(source).toMatch(/`--export`[\s\S]{0,180}(?:never assume|绝不能假设)[\s\S]{0,180}(?:metric values|metric values)/i);
      expect(source).toMatch(/metric names[\s\S]{0,80}units[\s\S]{0,80}(?:raw )?values[\s\S]{0,120}(?:stage identities|stage identities)[\s\S]{0,100}(?:imported report|imported report)/i);
      expect(source).toMatch(/ten report-hash-bound per-stage\/per-metric rows|十行 report-hash-bound per-stage\/per-metric rows/i);
      expect(source).toMatch(/report import or CSV failure|report import\/CSV failure/i);
      expect(source).toMatch(/stdout[\s\S]{0,80}stderr[\s\S]{0,80}(?:status|exit status)[\s\S]{0,100}SHA-256/i);
      expect(source).toMatch(/replay[\s\S]{0,180}save(?: and|\/)restore/i);
      expect(source).toMatch(/perturbation boundary/i);
      expect(source).toMatch(/Environment Manifest|环境清单/i);
      expect(source).toMatch(/saniti[sz]|消毒/i);
      expect(source).toMatch(/acceptance criteria and blockers|验收条件与 blockers/i);
      expect(source).toMatch(/Community-Observed[\s\S]{0,220}not Runtime-Verified|Community-Observed[\s\S]{0,220}不是 Runtime-Verified/i);
      expect(source).toMatch(/VIS11[\s\S]{0,220}browser arithmetic[\s\S]{0,180}(?:no evidence|不是证据)/i);
      expect(source).toMatch(/Expected observations, not recorded results|预期观察，不是已记录结果/i);
      expect(reduction).toContain(reducerAssetUrl);
      expect(reduction).toContain(reducerRepositoryPath);
      expect(reduction).toContain(reducerSha256);
      const ledgerTemplateSource = /```json\n([\s\S]*?)```/.exec(reduction)?.[1] ?? '';
      const ledgerTemplate = JSON.parse(ledgerTemplateSource);
      expect(Object.keys(ledgerTemplate)).toEqual([
        'schemaVersion',
        'attempts',
        'stages',
        'metrics',
        'csvColumnsByVersion',
      ]);
      expect(ledgerTemplate.schemaVersion).toBe(1);
      expect(ledgerTemplate.attempts.map((attempt: { id: string }) => attempt.id)).toEqual(attemptIds);
      for (const attempt of ledgerTemplate.attempts) {
        expect(Object.keys(attempt)).toEqual([
          'id',
          'reportPath',
          'reportSha256',
          'rawCsvPath',
          'rawCsvSha256',
        ]);
      }
      expect(Object.keys(ledgerTemplate.stages)).toEqual(stageIds);
      for (const kernelIdentity of Object.values(ledgerTemplate.stages)) {
        expect(kernelIdentity).toMatch(/exact reported kernel identity/);
      }
      expect(ledgerTemplate.metrics).toEqual([
        { name: '<copy exact queried metric name>', unit: '<copy exact report unit>' },
      ]);
      expect(Object.keys(ledgerTemplate.csvColumnsByVersion)).toEqual(['<exact installed ncu version>']);
      expect(Object.keys(ledgerTemplate.csvColumnsByVersion['<exact installed ncu version>'])).toEqual([
        'kernel', 'metric', 'unit', 'value',
      ]);
      expect(reduction).toMatch(/unique (?:source )?paths[\s\S]{0,260}byte-identical[\s\S]{0,180}(?:hash values|hashes)/i);
      expect(reduction).toMatch(/(?:exactly one|恰好一)[\s\S]{0,120}(?:mapped header|header)/i);
      expect(reduction).toMatch(/preamble/i);
      expect(reduction).toMatch(/outside the four-stage mapping|四阶段 mapping 之外/i);
      expect(reduction).toMatch(/actual report(?: and |\/)CSV[\s\S]{0,180}(?:SHA-256|hash)/i);
      expect(reduction).toMatch(/exactly one finite numeric scalar|恰好一项 finite numeric scalar/i);
      expect(reduction).toMatch(/blank[\s\S]{0,180}`n\/a`[\s\S]{0,240}duplicate[\s\S]{0,120}missing/i);
      expect(reduction).toMatch(/unit mismatch|wrong-unit/i);
      expect(reduction).toMatch(/empty (?:metric )?unit|empty string|empty unit/i);
      expect(reduction).toContain('count=10');
      expect(reduction).toContain('lab10-report-csv-hash-chain-v1');
      expect(reduction).toMatch(/metric definition[\s\S]{0,180}scope[\s\S]{0,300}(?:infers none|不推断)/i);
      expect(reduction).toMatch(/(?:compares no|never compares) unlike units|不把不同 unit 相互比较/i);
      expect(reduction).toContain('node public/assets/exercise-solutions/lab10-report-reducer.mjs <ledger> <summary>');
      expect(reduction).toContain(`Node.js \`${nodeVersion}\``);
      expect(reduction).toContain(`\`${nodeVersionOutput}\``);
      expect(reduction).toContain('node_path="$(command -v node)" || exit 1');
      expect(reduction).toContain('test -n "$node_path" || exit 1');
      expect(reduction).toContain(
        'run_recorded reduction/node-version.stdout.log \\\n  node --version || exit 1',
      );
      expect(reduction).toMatch(/run_recorded reduction\/node-version-exact\.stdout\.log[\s\S]{0,420}verify-node-version "\$node_path" v24\.19\.0[\s\S]{0,180}node-version\.stdout\.log" \|\| exit 1/);
      expect(reduction.indexOf('run_recorded reduction/node-version.stdout.log')).toBeLessThan(
        reduction.indexOf('run_recorded reduction/node-version-exact.stdout.log'),
      );
      expect(reduction.indexOf('run_recorded reduction/node-version-exact.stdout.log')).toBeLessThan(
        reduction.indexOf('run_recorded reduction/reducer-source-verify.stdout.log'),
      );
      expect(reduction.indexOf('run_recorded reduction/reducer-source-verify.stdout.log')).toBeLessThan(
        reduction.indexOf('run_recorded reduction/reducer.stdout.log'),
      );
      expect(reduction).toMatch(/(?:missing `node`|缺失 `node`)[\s\S]{0,180}`v24\.19\.0`[\s\S]{0,180}(?:blocks reduction|阻断 reduction)/i);
      expect(reduction).toMatch(/(?:Node\.js or the reducer|Node\.js 或 reducer)[\s\S]{0,160}(?:grants no CUDA|不授予 CUDA)/i);
      expect(reduction).toMatch(/run_recorded reduction\/reducer-source-verify\.stdout\.log[\s\S]{0,360}sha256sum --check --strict[\s\S]{0,220}lab10-report-reducer\.mjs \|\| exit 1/);
      expect(reduction).toMatch(/run_recorded reduction\/reducer\.stdout\.log[\s\S]{0,260}node public\/assets\/exercise-solutions\/lab10-report-reducer\.mjs[\s\S]{0,240}ledger\.json[\s\S]{0,180}summary\.csv" \|\| exit 1/);
      expect(reduction).toMatch(/run_recorded reduction\/ledger-summary\.sha256[\s\S]{0,180}sha256sum[\s\S]{0,180}ledger\.json[\s\S]{0,180}summary\.csv" \|\| exit 1/);
      expect(cleanup).toMatch(/runner[\s\S]{0,120}reducer[\s\S]{0,600}reduction ledger[\s\S]{0,180}summary[\s\S]{0,180}hash chain/i);
      expect(cleanup).toMatch(/Node\.js path[\s\S]{0,180}version[\s\S]{0,120}exact-match[\s\S]{0,180}(?:status|hash)/i);
      expect(criteriaBlockers).toMatch(new RegExp(
        '(?:recorded `node --version` output|recorded `node --version` 输出)'
        + '[\\s\\S]{0,80}`' + nodeVersionOutput.replaceAll('.', '\\.')
        + '`[\\s\\S]{0,180}exact-match gate',
        'i',
      ));
      expect(criteriaBlockers).toMatch(/Node\.js (?:executable or path|executable 或 path)[\s\S]{0,180}v24\.19\.0[\s\S]{0,220}(?:analysis-runtime drift|analysis-runtime drift)/i);
      expect(source).not.toMatch(/\b(?:sm|smsp|l1tex|lts|dram)__[a-z0-9_.]+/i);
      expect(source).not.toMatch(/\b\d+(?:\.\d+)?x\s+speedup\b|speedup\s*(?:is|=|:|为)\s*\d/i);
    }
  });

  it('keeps SRC-CUDA-054 at one record while anchoring every selected CLI version', async () => {
    const archive2022 = 'https://docs.nvidia.com/nsight-compute/2022.3/NsightComputeCli/index.html';
    const archive2025 = 'https://docs.nvidia.com/nsight-compute/2025.2/NsightComputeCli/index.html';
    const current = 'https://docs.nvidia.com/nsight-compute/NsightComputeCli/index.html';

    for (const source of await readSourcePair()) {
      const record = source.split('\n').find((line) => line.includes('id="src-cuda-054"')) ?? '';
      for (const url of [archive2022, archive2025, current]) expect(record).toContain(url);
      expect(source).toMatch(/72 个 source record|72 source records/);
      expect(source.match(/id="src-cuda-054"/g)).toHaveLength(1);
    }
  });

  it('publishes a sanitized expected-only LAB10 fixture without environment or measured results', async () => {
    const [fixture, license] = await Promise.all([
      readJson('lab10-nsight-compute.expected.json'),
      readJson('lab10-nsight-compute.expected.json.license.json'),
    ]);

    expect(Object.keys(fixture).sort()).toEqual([...fixtureTopLevelFields].sort());
    expect(fixture).toMatchObject({
      'SPDX-License-Identifier': 'CC-BY-4.0',
      schemaVersion: 1,
      fixtureId: 'LAB10-NCU-EXPECTED',
      labId: 'LAB10',
      exampleId: 'EX14',
      sourceCommit,
      provenance: 'original',
      fixtureType: 'expected-only-profiler-report-plan',
      captureStatus: 'pending-hardware-verification',
      tool: {
        name: 'Nsight Compute',
        cli: 'ncu',
        reportExtension: '.ncu-rep',
        selectedVersions: ['2022.3.0.22', '2025.2.1.3', '2026.2.1.5'],
      },
      workload: {
        baseline: 'baseline-direct',
        candidate: 'one declared successor stage at a time',
        rows: 4096,
        columns: 4096,
        elementType: 'float',
        elementCount: 16777216,
        globalMatrixBytes: 134217728,
        maximumSharedBytesPerBlock: 4224,
        maximumProblemMemoryBytes: 134221952,
        canonicalCorrectnessFixtureMaximumProblemMemoryBytes: 20608,
      },
      sanitization: { status: 'passed', reviewDate },
      recordedObservations: [],
    });
    expect(fixture.workload.stages.map((stage: { id: string }) => stage.id)).toEqual([
      'baseline-direct',
      'coalescing-direction',
      'shared-memory-tiling',
      'padded-bank-layout',
    ]);
    for (const stage of fixture.workload.stages) {
      expect(stage).toHaveProperty('changedVariable');
      expect(stage).toHaveProperty('hypothesis');
    }
    expect(fixture.correctnessGate).toMatchObject({
      fixtures: ['5x7', '33x35', '64x32', '4096x4096'],
      inputAndOracleValues: 'finite, non-NaN, and deterministic',
      outputAllocation: 'one stable device output allocation and address per process, reused across all four stages',
      perStageProcedure: expect.stringMatching(/checked host-to-device[\s\S]*quiet-NaN[\s\S]*checked cudaDeviceSynchronize[\s\S]*checked complete device-to-host[\s\S]*no sentinel remaining/i),
    });
    expect(Object.keys(fixture.environmentManifest).sort()).toEqual([...manifestFields].sort());
    expect(Object.values(fixture.environmentManifest)).toEqual(Array(manifestFields.length).fill('unfilled'));
    expect(fixture.method).toMatchObject({
      completionBoundary: 'explicit cudaDeviceSynchronize after every selected stage launch',
      analysisRuntime: {
        name: 'Node.js',
        requiredVersion: nodeVersion,
        requiredVersionOutput: nodeVersionOutput,
        gate: expect.stringMatching(/run_recorded[\s\S]*node --version[\s\S]*separate exact-match[\s\S]*blocks reduction/i),
        availabilityAndEvidenceBoundary: expect.stringMatching(/CUDA images do not imply Node\.js availability[\s\S]*grants no CUDA[\s\S]*Evidence Status/i),
      },
      warmUp: {
        count: 1,
        processMode: 'direct unprofiled process',
        excludedFromStatistics: true,
      },
      acquisition: {
        freshProfilerAttempts: 10,
        acquisitionOrder: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'],
        statistic: 'median',
        spread: 'minimum and maximum',
        sampleDeletion: 'prohibited',
        invalidBatch: 'retain the invalid batch and restart all ten attempts under a new batch ID',
      },
    });
    expect(fixture.method).toHaveProperty('heldConstants');
    expect(fixture.method.heldConstants.join(' ')).toMatch(/stable device output allocation[\s\S]*quiet-NaN sentinel[\s\S]*outside selected kernel metrics/i);
    expect(fixture.method.heldConstants.join(' ')).toContain(`exact Node.js ${nodeVersion}`);
    expect(fixture.method.stageIndependence).toMatch(/correctness, warm-up, and profiled process[\s\S]*complete readback[\s\S]*no-sentinel-remains/i);
    expect(fixture.method.solutionAssets).toEqual({
      reviewedRunner: {
        publicPath: runnerAssetUrl,
        repositoryPath: runnerRepositoryPath,
        sha256: runnerSha256,
        license: 'Apache-2.0',
        boundary: expect.stringMatching(/compile-link and static-inspection[\s\S]*no execution[\s\S]*Evidence Status/i),
      },
      reportReducer: {
        publicPath: reducerAssetUrl,
        repositoryPath: reducerRepositoryPath,
        sha256: reducerSha256,
        license: 'Apache-2.0',
        boundary: expect.stringMatching(/static report reduction[\s\S]*no profiler capture[\s\S]*Evidence Status/i),
      },
    });
    expect(fixture.method).toHaveProperty('kernelSelection');
    expect(fixture.method).toHaveProperty('collection');
    expect(fixture.method).toHaveProperty('replayAndCustody');
    expect(fixture.method.configControl.gate).toContain('--import, --page raw, and --csv');
    expect(fixture.method.collection).toMatchObject({
      primaryArtifact: 'one hashed .ncu-rep per attempt',
      derivativeImport: expect.stringContaining('--import REPORT --page raw --csv'),
      statisticsInput: expect.stringContaining('only ten parent-report-hash-bound imported rows per stage'),
      values: 'not collected in this expected-only fixture',
    });
    expect(fixture.method.replayAndCustody.join(' ')).toMatch(
      /primary \.ncu-rep[\s\S]*derivative raw CSV[\s\S]*report-to-CSV hash mapping/i,
    );
    expect(fixture.method.replayAndCustody.join(' ')).toContain(`${runnerRepositoryPath} and SHA-256 ${runnerSha256}`);
    expect(fixture.method.replayAndCustody.join(' ')).toContain(`${reducerRepositoryPath} and SHA-256 ${reducerSha256}`);
    expect(fixture.method.replayAndCustody.join(' ')).toMatch(/Node\.js path[\s\S]*v24\.19\.0[\s\S]*stdout[\s\S]*status[\s\S]*record-hash custody/i);
    expect(fixture.method.reduction).toMatchObject({
      runtimeGate: expect.stringMatching(/Node\.js 24\.19\.0 exactly[\s\S]*node --version[\s\S]*v24\.19\.0[\s\S]*separate recorded exact-match[\s\S]*before reducer source-hash verification or CLI execution/i),
      command: 'node public/assets/exercise-solutions/lab10-report-reducer.mjs <ledger> <summary>',
      ledgerSchema: expect.stringMatching(/exactly attempts 01 through 10[\s\S]*reportPath[\s\S]*reportSha256[\s\S]*rawCsvPath[\s\S]*rawCsvSha256[\s\S]*stage-to-reported-kernel[\s\S]*metric name and unit[\s\S]*kernel, metric, unit, and value CSV headers/i),
      validation: expect.stringMatching(/unique source paths[\s\S]*byte-identical[\s\S]*actual report and CSV SHA-256[\s\S]*exactly one finite scalar[\s\S]*blank[\s\S]*duplicate[\s\S]*missing/i),
      output: expect.stringMatching(/count=10[\s\S]*median\/minimum\/maximum[\s\S]*hash chain[\s\S]*no values/i),
      semanticBoundary: expect.stringMatching(/definitions[\s\S]*scopes[\s\S]*infers no semantics[\s\S]*compares no unlike units/i),
    });
    expect(fixture.expectedObservations).toHaveLength(9);
    expect(fixture.expectedObservations.join(' ')).toMatch(
      /--import[\s\S]*--page raw[\s\S]*--csv[\s\S]*parent-report-hash-bound imported rows/i,
    );
    expect(fixture.expectedObservations.join(' ')).toMatch(
      /stable output allocation and address[\s\S]*quiet-NaN sentinel[\s\S]*complete readback[\s\S]*no-sentinel-remains/i,
    );
    expect(fixture.expectedObservations.join(' ')).toMatch(/exact-hash reducer[\s\S]*count=10[\s\S]*hash chain/i);
    expect(fixture.expectedObservations.join(' ')).toMatch(/node --version output v24\.19\.0[\s\S]*separate recorded exact Node\.js 24\.19\.0 match/i);
    expect(fixture.claimBoundary).toMatch(/no recorded/i);
    expect(fixture.claimBoundary).toMatch(/no recorded[\s\S]*Node\.js observation/i);
    expect(fixture.claimBoundary).toMatch(/Node\.js or reducer execution[\s\S]*no CUDA evidence/i);
    expect(fixture.claimBoundary).toMatch(/two static Apache-2\.0 solution assets[\s\S]*no CUDA evidence[\s\S]*Runnable Example[\s\S]*Evidence Status/i);
    const serialized = JSON.stringify(fixture);
    expect(serialized).not.toMatch(/\b(?:sm|smsp|l1tex|lts|dram)__[a-z0-9_.]+/i);
    expect(serialized).not.toMatch(/\b\d+(?:\.\d+)?x speedup\b|"(?:timing|metricValue|speedup|winner)"\s*:/i);
    expect(license).toEqual({
      license: 'CC-BY-4.0',
      provenance: 'original',
      attribution: 'CUDA Learning Site, Xiang Zhang, 2026',
    });
  });
});
