// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import {
  loadCanonicalExample,
  loadCompileEvidence,
  readCanonicalRange,
  validateCanonicalExample,
} from '../../scripts/lib/canonical-examples.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(projectRoot, 'examples/ex15-tiled-gemm');
const rangeNames = ['cpu-reference', 'tiled-gemm'] as const;

async function listProjectFiles() {
  const entries = await readdir(exampleRoot, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(exampleRoot, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
    .filter((relativePath) => !relativePath.startsWith('build/'))
    .sort();
}

describe('EX15 standalone tiled-GEMM boundary', () => {
  it('declares the exact original portable C++17 project and canonical ranges', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX15');
    expect(await validateCanonicalExample(projectRoot, 'EX15')).toEqual([]);
    expect(example).toMatchObject({
      'SPDX-License-Identifier': 'Apache-2.0',
      schemaVersion: 1,
      id: 'EX15',
      title: 'Tiled GEMM',
      root: 'examples/ex15-tiled-gemm',
      license: 'Apache-2.0',
      provenance: 'original',
    });
    expect(example.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(example.sourceCommit).not.toBe('0'.repeat(40));
    expect(await listProjectFiles()).toEqual([
      'Makefile',
      'README.md',
      'evidence/README.md',
      'include/tiled_gemm_reference.hpp',
      'project.json',
      'scripts/compile-check.sh',
      'src/tiled_gemm.cu',
      'tests/host_reference_test.cpp',
    ]);
    expect(Object.keys(example.ranges)).toEqual(rangeNames);
    for (const name of rangeNames) {
      await expect(readCanonicalRange(projectRoot, 'EX15', name)).resolves.toMatchObject({ range: name });
    }
  });

  it('pins the portable tile, partial fixtures, tolerance, lanes, fallback, and evidence contracts', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX15');
    expect(example.correctness).toMatchObject({
      cpuReference: 'include/tiled_gemm_reference.hpp',
      tile: [16, 16, 16],
      blockDimensions: [16, 16],
      threadsPerBlock: 256,
      sharedBytesPerBlock: 2048,
      tolerance: { absolute: 0.0001, relative: 0.00002, nonFinitePolicy: 'reject' },
      mapping: 'C[row * N + col] = alpha * sum(A[row * K + p] * B[p * N + col]) + beta * C[row * N + col]',
    });
    expect(example.correctness.fixtures).toEqual([
      expect.objectContaining({ id: '2x3x2-hand', m: 2, k: 3, n: 2 }),
      expect.objectContaining({ id: '33x31x35-partial', m: 33, k: 31, n: 35, beta: 0.25 }),
      expect.objectContaining({ id: '32x32x32-aligned', m: 32, k: 32, n: 32 }),
    ]);
    expect(example.compatibility).toMatchObject({
      supportedEnvironment: 'Native Linux',
      capabilityTier: 'Baseline GPU Capability Tier',
      minimumComputeCapability: '7.5',
      maximumProblemMemoryBytes: 15100,
      target: ['sm_75', 'compute_75'],
      architectureVariants: [],
      portableFallback: 'The single FP32 shared-memory implementation is the baseline and fallback in every declared lane.',
    });
    expect(example.compatibility.lanes).toHaveLength(3);
    expect(example.compatibility.lanes.every((lane: { dialects: string[] }) =>
      lane.dialects.length === 1 && lane.dialects[0] === 'c++17')).toBe(true);
    expect(example.evidence).toMatchObject({
      compilation: [],
      runtime: 'Pending Hardware Verification',
      recordedObservations: [],
    });
    expect(example.evidence.expectedObservations).toHaveLength(3);
    await expect(loadCompileEvidence(projectRoot, 'EX15')).resolves.toEqual([]);
  });

  it('uses guarded zero-filled tiles, two uniform barriers, and no architecture-specialized branch', async () => {
    const source = await readFile(path.join(exampleRoot, 'src/tiled_gemm.cu'), 'utf8');
    const range = await readCanonicalRange(projectRoot, 'EX15', 'tiled-gemm');
    expect(range.code).toMatch(/__shared__\s+float\s+tile_a\s*\[\s*16\s*]\s*\[\s*16\s*]/);
    expect(range.code).toMatch(/__shared__\s+float\s+tile_b\s*\[\s*16\s*]\s*\[\s*16\s*]/);
    expect(range.code).toMatch(/row\s*<\s*m\s*&&\s*a_column\s*<\s*k/);
    expect(range.code).toMatch(/b_row\s*<\s*k\s*&&\s*column\s*<\s*n/);
    expect(range.code).toMatch(/\?\s*a\[.*?]\s*:\s*0\.0F/s);
    expect(range.code).toMatch(/\?\s*b\[.*?]\s*:\s*0\.0F/s);
    expect(range.code.match(/__syncthreads\s*\(\s*\)/g)).toHaveLength(2);
    expect(range.code).not.toMatch(/\breturn\b/);
    expect(source).not.toMatch(/__CUDA_ARCH__|<mma\.h>|wmma::|cp\.async|cuda::pipeline|__half|tf32/i);
    expect(source).not.toMatch(/cudaEvent|chrono|clock_gettime|throughput|bandwidth|speedup/i);
  });

  it('runs the CUDA-free host reference and exercises finite abs-plus-rel tolerance failures', async () => {
    const [header, hostTest, script] = await Promise.all([
      readFile(path.join(exampleRoot, 'include/tiled_gemm_reference.hpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'tests/host_reference_test.cpp'), 'utf8'),
      readFile(path.join(exampleRoot, 'scripts/compile-check.sh'), 'utf8'),
    ]);
    expect(`${header}\n${hostTest}`).not.toMatch(
      /#include\s*[<"]cuda|__host__|__device__|__global__|__shared__|<<<|>>>|cuda(?:Error|Stream|Event)_t/,
    );
    expect(header).toContain('atol + rtol * std::abs(reference)');
    for (const contract of [
      'hand-computed GEMM result',
      'near-zero absolute tolerance',
      'magnitude-scaled relative tolerance',
      'out-of-tolerance value',
      'NaN is rejected',
      'infinity is rejected',
      'negative tolerances are rejected',
      'first mismatch reports row and column',
    ]) expect(hostTest).toContain(contract);

    const buildRoot = await mkdtemp(path.join(tmpdir(), 'ex15-host-'));
    try {
      const { stdout } = await execFileAsync('make', [
        'host-test', 'DIALECT=c++17', `BUILD_DIR=${buildRoot}`,
      ], { cwd: exampleRoot });
      expect(stdout).toContain('host-reference: pass');
    } finally {
      await rm(buildRoot, { recursive: true, force: true });
    }
    expect(script).toContain('Usage: compile-check.sh <dialect> <ex15> <result-dir>');
    expect(script).not.toMatch(/(?:^|\n)\s*(?:\.\/)?build\/ex15-tiled-gemm(?:\s|$)/m);
  }, 20_000);
});
