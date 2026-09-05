// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const runnerPath = 'public/assets/exercise-solutions/lab11-reduction-comparison.cu';
const runnerUrl = '/assets/exercise-solutions/lab11-reduction-comparison.cu';
const runnerSha256 = '755a4c4653399299fba80ca12e5fd40d35f992ff18f36d8bece5602c52b16e0c';
const buildScriptPath = 'scripts/check-lab11-runner-build.sh';
const referencePath = 'examples/ex11-multi-stage-reduction/include/multi_stage_reduction_reference.hpp';
const canonicalSourcePath = 'examples/ex11-multi-stage-reduction/src/multi_stage_reduction.cu';

const profileIds = [
  'cuda-11-8-bundled-cub-1-15-1',
  'cuda-12-9-bundled-cub-2-8-2',
  'cuda-13-3-bundled-cub-3-3-4',
  'cuda-12-9-selected-cccl-3-4-2',
  'cuda-13-3-selected-cccl-3-4-2',
] as const;

async function readProjectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

function maskCppNoise(source: string) {
  return source.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
    (match) => match.replace(/[^\n]/g, ' '),
  );
}

function functionBody(source: string, declarationPattern: RegExp, label: string) {
  const masked = maskCppNoise(source);
  const declaration = declarationPattern.exec(masked);
  expect(declaration, `${label} declaration`).not.toBeNull();
  const bodyStart = masked.indexOf('{', declaration!.index);
  expect(bodyStart, `${label} body`).toBeGreaterThanOrEqual(0);

  let depth = 0;
  for (let index = bodyStart; index < masked.length; index += 1) {
    if (masked[index] === '{') depth += 1;
    if (masked[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(bodyStart, index + 1);
  }
  throw new Error(`Unmatched body for ${label}`);
}

function compactCpp(source: string) {
  return source.replace(/\s+/g, ' ').trim();
}

describe('LAB11 reviewed comparison runner', () => {
  it('is the exact-hash Apache-2.0 asset and reuses the EX11 host contract', async () => {
    const source = await readProjectFile(runnerPath);

    expect(createHash('sha256').update(source).digest('hex')).toBe(runnerSha256);
    expect(source).toMatch(/^\/\/ SPDX-License-Identifier: Apache-2\.0/);
    expect(source.match(/#include "multi_stage_reduction_reference\.hpp"/g)).toHaveLength(1);
    expect(source).toContain('ex11::initialize_input(input.data(), input.size())');
    expect(source).toContain('ex11::cpu_reference_sum(input.data(), input.size())');
    expect(source).toContain('ex11::compare_reduction_sum(reference, result.value)');
    expect(source).not.toMatch(/namespace\s+ex11\s*\{/);
    expect(source).not.toMatch(/\bbool\s+initialize_input\s*\(/);
    expect(source).not.toMatch(/\bdouble\s+cpu_reference_sum\s*\(/);
    expect(source).not.toMatch(/\bSumComparison\s+compare_reduction_sum\s*\(/);
  });

  it('keeps the exact EX11 stage tree and adds only explicit stream plumbing', async () => {
    const [source, canonicalSource] = await Promise.all([
      readProjectFile(runnerPath),
      readProjectFile(canonicalSourcePath),
    ]);
    const runnerKernel = functionBody(source, /\b__global__\s+void\s+reduce_stage\s*\(/, 'runner reduce_stage');
    const canonicalKernel = functionBody(
      canonicalSource,
      /\b__global__\s+void\s+reduce_stage\s*\(/,
      'canonical reduce_stage',
    );
    const custom = functionBody(
      source,
      /\bconst\s+float\s*\*\s*execute_custom_reduction\s*\(/,
      'execute_custom_reduction',
    );
    const setup = functionBody(
      source,
      /\bCandidateResult\s+run_custom_candidate\s*\(/,
      'run_custom_candidate',
    );

    expect(compactCpp(runnerKernel)).toBe(compactCpp(canonicalKernel));
    expect(source).toContain('ex11::stage_output_count(ex11::kElementCount) == 9U');
    expect(custom).toContain('while (stage_size > 1U)');
    expect(custom).toContain('ex11::stage_output_count(stage_size)');
    expect(custom).toMatch(/reduce_stage<<<[\s\S]*stream>>>\(stage_input, stage_output, stage_size\)/);
    expect(custom).toContain('CUDA_CHECK(cudaGetLastError())');
    expect(custom).toContain('stage_output == device_partial_a');
    expect(setup).toContain('partial_capacity != 9U');
    expect(setup.match(/\.allocate\(partial_bytes\)/g)).toHaveLength(2);
    expect(setup).toContain('partial_a.as<float>()');
    expect(setup).toContain('partial_b.as<float>()');
    expect(setup).toMatch(/execute_custom_reduction\([\s\S]*CUDA_CHECK\(cudaStreamSynchronize\(stream\)\)[\s\S]*finish_timing/);
    expect(runnerKernel).not.toMatch(/atomic|warp|shuffle/i);
  });

  it('uses the legacy CUB query and execution calls behind an exact profile gate', async () => {
    const source = await readProjectFile(runnerPath);
    const query = functionBody(source, /\bvoid\s+query_cub_storage\s*\(/, 'query_cub_storage');
    const execute = functionBody(source, /\bvoid\s+execute_cub_reduction\s*\(/, 'execute_cub_reduction');

    expect(source).toContain('#include <cub/device/device_reduce.cuh>');
    expect(source).toContain('#include <cub/version.cuh>');
    expect(source).not.toContain('device_scan');
    expect(source).toContain('#ifndef LAB11_EXPECTED_CUB_VERSION');
    expect(source).toMatch(/CUB_VERSION\s*==\s*LAB11_EXPECTED_CUB_VERSION/);
    expect(source.match(/cub::DeviceReduce::Sum\(/g)).toHaveLength(2);
    expect(query).toContain('*temporary_storage_bytes = 0U');
    expect(query).toMatch(/cub::DeviceReduce::Sum\(\s*nullptr,/);
    expect(query).toMatch(/item_count,\s*stream\)/);
    expect(execute).toMatch(/temporary_storage,\s*temporary_storage_bytes,/);
    expect(execute).toMatch(/item_count,\s*stream\)/);
    expect(execute).toContain('CUDA_CHECK(cudaGetLastError())');
    const runCub = functionBody(source, /\bCandidateResult\s+run_cub_candidate\s*\(/, 'run_cub_candidate');
    expect(runCub).toMatch(/execute_cub_reduction\([\s\S]*CUDA_CHECK\(cudaStreamSynchronize\(stream\)\)[\s\S]*finish_timing/);
  });

  it('accepts only one candidate and the frozen workload, timing, and verification CLI', async () => {
    const source = await readProjectFile(runnerPath);
    const parse = functionBody(source, /\bbool\s+parse_cli\s*\(/, 'parse_cli');
    const selection = functionBody(
      source,
      /\bCandidateResult\s+run_selected_candidate\s*\(/,
      'run_selected_candidate',
    );
    const main = functionBody(source, /\bint\s+main\s*\(/, 'main');

    expect(parse).toContain('argc != 9');
    for (const token of [
      '"--candidate"',
      '"custom"',
      '"cub"',
      '"--timing"',
      '"none"',
      '"steady-state"',
      '"setup-inclusive"',
      '"--elements"',
      '"4099"',
      '"--verify"',
      '"tolerance"',
    ]) expect(parse, token).toContain(token);
    expect(source).not.toContain('candidate-order');
    expect(selection.match(/run_custom_candidate\(/g)).toHaveLength(1);
    expect(selection.match(/run_cub_candidate\(/g)).toHaveLength(1);
    expect(selection).toMatch(/if \(config\.candidate == Candidate::kCustom\)[\s\S]*return run_custom_candidate[\s\S]*return run_cub_candidate/);
    expect(main.match(/run_selected_candidate\(/g)).toHaveLength(2);
    expect(main).toContain('cudaStreamCreateWithFlags(&stream, cudaStreamNonBlocking)');
    expect(main).toContain('if (config.timing != TimingMode::kNone)');
    expect(main).toContain('Config warmup_config = config;');
    expect(main).toContain('warmup_config.timing = TimingMode::kNone;');
    expect(main).toContain('run_selected_candidate(\n              warmup_config,\n              device_input.as<float>(),\n              stream)');
    expect(main).toContain('ex11::compare_reduction_sum(reference, warmup_result.value)');
    expect(main).toContain('process-local warm-up failed: actual=');
    expect(main).toContain('run_selected_candidate(config, device_input.as<float>(), stream)');
    expect(main.indexOf('run_selected_candidate(\n              warmup_config'))
      .toBeLessThan(main.indexOf('run_selected_candidate(config'));
    expect(source).not.toContain('cudaDeviceSynchronize');
  });

  it('uses one monotonic host clock with bounded timing output and checked CUDA calls', async () => {
    const source = await readProjectFile(runnerPath);
    const custom = functionBody(source, /\bCandidateResult\s+run_custom_candidate\s*\(/, 'custom timing');
    const cub = functionBody(source, /\bCandidateResult\s+run_cub_candidate\s*\(/, 'CUB timing');
    const finish = functionBody(source, /\bstd::optional<std::int64_t>\s+finish_timing\s*\(/, 'finish_timing');
    const main = functionBody(source, /\bint\s+main\s*\(/, 'main output');

    expect(source).toContain('using MonotonicClock = std::chrono::steady_clock;');
    expect(source).toContain('static_assert(MonotonicClock::is_steady');
    expect(source).not.toMatch(/cudaEvent|high_resolution_clock|system_clock/);
    for (const candidate of [custom, cub]) {
      const setupStart = candidate.indexOf('TimingMode::kSetupInclusive');
      const setup = candidate.indexOf('.allocate(', setupStart);
      const steadyStart = candidate.indexOf('TimingMode::kSteadyState', setup);
      const invocation = Math.max(
        candidate.indexOf('execute_custom_reduction(', steadyStart),
        candidate.indexOf('execute_cub_reduction(', steadyStart),
      );
      const finishTiming = candidate.indexOf('finish_timing(config.timing, start)', invocation);
      const readback = candidate.indexOf('cudaMemcpyAsync(', finishTiming);
      expect(setupStart).toBeGreaterThan(-1);
      expect(setup).toBeGreaterThan(setupStart);
      expect(steadyStart).toBeGreaterThan(setup);
      expect(invocation).toBeGreaterThan(steadyStart);
      expect(finishTiming).toBeGreaterThan(invocation);
      expect(readback).toBeGreaterThan(finishTiming);
    }
    expect(finish).toMatch(/TimingMode::kNone\) return std::nullopt;[\s\S]*MonotonicClock::now\(\)/);
    expect(main).toContain('result.elapsed_nanoseconds.has_value()');
    expect(main).toContain('process_local_warmup=excluded-pass');
    expect(main).toContain('"elapsed_nanoseconds="');
    for (const field of [
      'result_float_bits_hex=',
      'cpu_reference=',
      'absolute_error=',
      'allowed_error=',
      'pass=',
    ]) expect(main, field).toContain(field);
    expect(source).toContain('CUDA_CHECK(cudaSetDevice(0))');
    expect(source).toContain('CUDA_CHECK(cudaStreamDestroy(stream))');
    expect(source).toContain('CUDA_CHECK(cudaFree(pointer_))');
  });

  it('preprocesses, compiles, links, and inspects all five profiles without execution', async () => {
    const script = await readProjectFile(buildScriptPath);
    const declaredProfiles = [...script.matchAll(/^  (cuda-\S+?)(?:\|cuda-\S+)?\)$/gm)]
      .flatMap((match) => match[0].slice(2, -1).split('|'));

    expect(script).toMatch(/^#!\/usr\/bin\/env bash\n# SPDX-License-Identifier: Apache-2\.0\nset -euo pipefail/);
    expect(script).toContain('if [[ $# -lt 1 || $# -gt 2 ]]');
    expect(declaredProfiles).toEqual(profileIds);
    expect(script).toContain('CCCL_ROOT is required by selected CCCL profiles');
    expect(script).toContain('"$CCCL_ROOT/cub"');
    expect(script).toContain('"$CCCL_ROOT/thrust"');
    expect(script).toContain('"$CCCL_ROOT/libcudacxx/include"');
    expect(script).toContain('"-DLAB11_EXPECTED_CUB_VERSION=$expected_cub_version"');
    expect(script).toContain(runnerPath);
    expect(script).toContain(referencePath);
    expect(script).toContain('--std=c++17');
    expect(script).toContain('--generate-code=arch=compute_75,code=sm_75');
    expect(script).toContain('--generate-code=arch=compute_75,code=compute_75');
    expect(script).toContain('--preprocess "$runner_source"');
    expect(script).toContain('--compile "$runner_source"');
    expect(script).toContain('nvcc --std=c++17 "$object" --output-file "$binary"');
    expect(script).toContain('cuobjdump --list-elf "$binary"');
    expect(script).toContain('cuobjdump --dump-ptx "$binary"');
    expect(script).toContain('binary-executed=false');
    expect(script).toContain('lab11-runner-inputs.sha256');
    expect(script).toContain('lab11-runner-commands.log');
    expect(script).toContain('lab11-runner-logs.sha256');
    expect(script).toContain('lab11-runner-inspection.sha256');
    expect(script).toMatch(/trap\s+'rm -rf -- "\$temporary_dir"'\s+EXIT/);
    expect(script).not.toMatch(/^\s*(?:"\$binary"|\$binary)(?:\s|$)/m);
    expect(script).not.toMatch(/cp[^\n]*\$binary/);
  });

  it('binds both LAB11 pages and the expected-only fixture to the reviewed source', async () => {
    const [zh, en, fixtureSource] = await Promise.all([
      readProjectFile('src/content/docs/labs/compare-custom-reduction-with-cub.mdx'),
      readProjectFile('src/content/docs/en/labs/compare-custom-reduction-with-cub.mdx'),
      readProjectFile('public/assets/profiler-report-fixtures/lab11-nsight-compute.expected.json'),
    ]);
    const fixture = JSON.parse(fixtureSource);

    for (const page of [zh, en]) {
      expect(page).toContain(`[${path.basename(runnerPath)}](${runnerUrl})`);
      expect(page).toContain(`\`${runnerPath}\``);
      expect(page).toContain(runnerSha256);
      expect(page).toContain('bash scripts/check-lab11-runner-build.sh <profile-id> [result-dir]');
      expect(page).toContain('--candidate custom --timing none --elements 4099 --verify tolerance');
      expect(page).toContain('--candidate cub --timing none --elements 4099 --verify tolerance');
      expect(page).toContain('--timing steady-state');
      expect(page).toContain('--timing setup-inclusive');
      expect(page).toContain('max(16,468, 16,400 + T)');
    }
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
    expect(fixture.method.solutionAsset).toEqual({
      publicPath: runnerUrl,
      repositoryPath: runnerPath,
      sha256: runnerSha256,
      license: 'Apache-2.0',
      provenance: 'original',
      upstreamAdaptation: 'none',
    });
    expect(fixture.correctnessGate.requiredPerCandidateRecords).toContain('pass');
    expect(fixture.correctnessGate.requiredPerCandidateRecords).not.toContain('tolerance_pass');
    expect(fixture.workload).toMatchObject({
      customFixedBytesPerProcess: 16468,
      cubFixedBytesBeforeTemporaryStoragePerProcess: 16400,
    });
    expect(fixture.recordedObservations).toEqual([]);
    expect(Object.values(fixture.method.recordedResults).every(
      (records) => Array.isArray(records) && records.length === 0,
    )).toBe(true);
  });
});
