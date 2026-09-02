// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const runnerPath = 'public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu';
const buildScriptPath = 'scripts/check-lab10-runner-build.sh';

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

describe('Q11 LAB10 transpose candidate runner source', () => {
  it('uses the canonical EX14 oracle and accepts only the frozen bounded CLI', async () => {
    const source = await readProjectFile(runnerPath);

    expect(source).toMatch(/^\/\/ SPDX-License-Identifier: Apache-2\.0/);
    expect(source.match(/#include "tiled_transpose_reference\.hpp"/g)).toHaveLength(1);
    expect(source).toContain('ex14::transpose_reference(');
    expect(source).toContain('ex14::verify_exact(');
    expect(source).not.toMatch(/\bbool\s+transpose_reference\s*\(/);
    expect(source).not.toMatch(/namespace\s+ex14\s*\{/);

    expect(source).toContain('argc != 8');
    for (const coordinate of [
      'std::string_view(argv[1]) != "--all-stages"',
      'std::string_view(argv[2]) != "--rows"',
      'std::string_view(argv[4]) != "--columns"',
      'std::string_view(argv[6]) != "--verify"',
      'std::string_view(argv[7]) != "exact"',
    ]) {
      expect(source).toContain(coordinate);
    }
    expect(source).toContain('std::from_chars(');
    expect(source).toMatch(/value\s*==\s*0U/);
    expect(source).toContain('ex14::checked_element_count(');
    expect(source).toMatch(/kMaximumElementCount\s*=\s*\(std::size_t\{1U?\}\s*<<\s*24U?\)/);
    expect(source).toMatch(/element_count\s*>\s*kMaximumElementCount/);
    expect(source).toContain('input[index] = static_cast<float>(index + 1U);');
  });

  it('implements the four fixed stages on one 32x32 grid with four slots per thread', async () => {
    const source = await readProjectFile(runnerPath);
    const stageTable = /constexpr\s+std::array<StageSpec,\s*4>\s+kStages\s*\{\{([\s\S]*?)\}\};/.exec(source)?.[1] ?? '';
    const stageIds = [...stageTable.matchAll(/"([a-z-]+)"/g)].map((match) => match[1]);

    expect(stageIds).toEqual([
      'baseline-direct',
      'coalescing-direction',
      'shared-memory-tiling',
      'padded-bank-layout',
    ]);
    expect(source).toMatch(/kTileExtent\s*=\s*32U/);
    expect(source).toMatch(/kThreadsPerBlock\s*=\s*256U/);
    expect(source).toMatch(/kCooperativeSlots\s*=\s*4U/);
    expect(source).toContain('const dim3 block(kThreadsPerBlock, 1U, 1U);');
    expect(source).toMatch(/const dim3 grid\([\s\S]*columns[\s\S]*rows[\s\S]*\);/);
    expect(source.match(/<<<grid, block>>>/g)).toHaveLength(4);

    const baseline = functionBody(source, /\b__global__\s+void\s+baseline_direct\s*\(/, 'baseline_direct');
    const direction = functionBody(source, /\b__global__\s+void\s+coalescing_direction\s*\(/, 'coalescing_direction');
    const unpadded = functionBody(source, /\b__global__\s+void\s+shared_memory_tiling\s*\(/, 'shared_memory_tiling');
    const padded = functionBody(source, /\b__global__\s+void\s+padded_bank_layout\s*\(/, 'padded_bank_layout');

    for (const [name, kernel, slotLoops] of [
      ['baseline_direct', baseline, 1],
      ['coalescing_direction', direction, 1],
      ['shared_memory_tiling', unpadded, 2],
      ['padded_bank_layout', padded, 2],
    ] as const) {
      expect(kernel.match(/slot\s*<\s*kCooperativeSlots/g), name).toHaveLength(slotLoops);
      expect(kernel, name).toContain('threadIdx.x + slot * kThreadsPerBlock');
      expect(kernel, name).not.toMatch(/threadIdx\.y|blockDim\.y/);
    }

    expect(baseline).toMatch(/output\[output_row \* rows \+ output_column\]\s*=\s*input\[output_column \* columns \+ output_row\]/);
    expect(direction).toMatch(/output\[input_column \* rows \+ input_row\]\s*=\s*input\[input_row \* columns \+ input_column\]/);
    expect(unpadded).toMatch(/__shared__\s+float\s+tile\[32\]\[32\]/);
    expect(padded).toMatch(/__shared__\s+float\s+tile\[32\]\[33\]/);
    for (const [name, kernel] of [['shared_memory_tiling', unpadded], ['padded_bank_layout', padded]] as const) {
      expect(kernel.match(/__syncthreads\s*\(\s*\)/g), name).toHaveLength(1);
      expect(kernel, name).toMatch(/output\[output_row \* rows \+ output_column\]\s*=\s*tile\[output_local_column\]\[output_local_row\]/);
    }
  });

  it('reinitializes and fully verifies the stable output for every stage without performance output', async () => {
    const source = await readProjectFile(runnerPath);
    const runBody = functionBody(source, /\bbool\s+run_all_stages\s*\(/, 'run_all_stages');
    const stageLoopOffset = runBody.indexOf('for (const StageSpec& stage : kStages)');
    const sentinelOffset = runBody.indexOf('cudaMemcpyHostToDevice', stageLoopOffset);
    const launchOffset = runBody.indexOf('launch_stage(', stageLoopOffset);
    const errorOffset = runBody.indexOf('cudaGetLastError()', stageLoopOffset);
    const syncOffset = runBody.indexOf('cudaDeviceSynchronize()', stageLoopOffset);
    const readbackOffset = runBody.indexOf('cudaMemcpyDeviceToHost', stageLoopOffset);
    const sentinelCheckOffset = runBody.indexOf('std::isnan', stageLoopOffset);
    const verificationOffset = runBody.indexOf('ex14::verify_exact(', stageLoopOffset);

    expect(source).toContain('std::numeric_limits<float>::quiet_NaN()');
    expect(source).toContain('DeviceAllocation device_input;');
    expect(source).toContain('DeviceAllocation device_output;');
    expect(source).toContain('device_input.allocate(bytes)');
    expect(source).toContain('device_output.allocate(bytes)');
    expect(runBody.match(/cudaMemcpyHostToDevice/g)).toHaveLength(2);
    expect(runBody.match(/cudaMemcpyDeviceToHost/g)).toHaveLength(1);
    expect(stageLoopOffset).toBeGreaterThanOrEqual(0);
    expect(sentinelOffset).toBeGreaterThan(stageLoopOffset);
    expect(launchOffset).toBeGreaterThan(sentinelOffset);
    expect(errorOffset).toBeGreaterThan(launchOffset);
    expect(syncOffset).toBeGreaterThan(errorOffset);
    expect(readbackOffset).toBeGreaterThan(syncOffset);
    expect(sentinelCheckOffset).toBeGreaterThan(readbackOffset);
    expect(verificationOffset).toBeGreaterThan(sentinelCheckOffset);
    expect(runBody).toMatch(/sentinel_output\.data\(\),\s*bytes,\s*cudaMemcpyHostToDevice/);
    expect(runBody).toMatch(/actual\.data\(\),\s*device_output\.get\(\),\s*bytes,\s*cudaMemcpyDeviceToHost/);
    expect(runBody).toMatch(/verification\.valid\s*&&\s*verification\.matches/);
    expect(source).toContain('cudaFree(pointer_)');

    expect(source).toContain('"stage=" << stage.id');
    expect(source).toContain('" shape=" << config.rows << \'x\' << config.columns');
    expect(source).toContain('" correctness=" << (stage_pass ? "PASS" : "FAIL")');
    expect(source).toContain('"result=" << (all_pass ? "PASS" : "FAIL")');
    expect(source).not.toMatch(/std::cerr|cudaEvent|chrono|\b(?:timing|metric|speedup|bandwidth|throughput)\b/i);
  });

  it('compile-links and inspects the runner without retaining or executing a binary', async () => {
    const [script, licensePolicy] = await Promise.all([
      readProjectFile(buildScriptPath),
      readProjectFile('scripts/check-file-licenses.mjs'),
    ]);

    expect(script).toMatch(/^#!\/usr\/bin\/env bash\n# SPDX-License-Identifier: Apache-2\.0\nset -euo pipefail/);
    expect(script).toContain('if [[ $# -ne 1 ]]');
    expect(script).toContain(runnerPath);
    expect(script).toContain('examples/ex14-tiled-transpose/include/tiled_transpose_reference.hpp');
    expect(script).toContain('--std=c++17');
    expect(script).toContain('--generate-code=arch=compute_75,code=sm_75');
    expect(script).toContain('--generate-code=arch=compute_75,code=compute_75');
    expect(script).toContain('--include-path "$reference_dir"');
    expect(script).toContain('cuobjdump --list-elf "$binary"');
    expect(script).toContain('cuobjdump --dump-ptx "$binary"');
    expect(script).toContain('sha256sum');
    expect(script).toContain('lab10-runner-inputs.sha256');
    expect(script).toContain('lab10-runner-logs.sha256');
    expect(script).toContain('lab10-runner-inspection.sha256');
    expect(script).toContain('mktemp -d');
    expect(script).toMatch(/trap\s+'rm -rf -- "\$temporary_dir"'\s+EXIT/);
    expect(script).not.toMatch(/^\s*(?:"\$binary"|\$binary)(?:\s|$)/m);
    expect(script).not.toMatch(/cp[^\n]*\$binary/);
    expect(new Set([...script.matchAll(/\$result_dir\/([^"\n]+)/g)].map((match) => match[1]))).toEqual(
      new Set([
        'lab10-runner-inputs.sha256',
        'lab10-runner-compile.stdout.log',
        'lab10-runner-compile.stderr.log',
        'lab10-runner-compile.status',
        'lab10-runner-cubin.inspection.txt',
        'lab10-runner-cubin.stderr.log',
        'lab10-runner-cubin.status',
        'lab10-runner-ptx.inspection.txt',
        'lab10-runner-ptx.stderr.log',
        'lab10-runner-ptx.status',
        'lab10-runner-target-inspection.status',
        'lab10-runner-logs.sha256',
        'lab10-runner-inspection.sha256',
      ]),
    );
    expect(licensePolicy).toContain("relativePath.startsWith('public/assets/exercise-solutions/')");
    expect(licensePolicy).toContain('c|cc|cpp|cu|cuh|h|hpp|mjs');
  });
});
