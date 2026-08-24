// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { loadCanonicalExample } from '../../scripts/lib/canonical-examples.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(projectRoot, 'examples/ex02-vector-addition');

describe('EX02 standalone project boundary', () => {
  it('declares the build stages, artifacts, correctness boundary, and compatibility matrix', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX02');

    expect(example.build.stages).toEqual(['preprocess', 'compile', 'link', 'inspect']);
    expect(example.build.artifacts).toEqual([
      'build/vector_add.ii',
      'build/vector_add.o',
      'build/ex02-vector-addition',
    ]);
    expect(example.correctness).toMatchObject({
      cpuReference: 'include/vector_add_reference.hpp',
      absoluteTolerance: 1e-5,
      relativeTolerance: 1e-5,
      maximumElements: 134217728,
    });
    expect(example.compatibility.target).toEqual(['sm_75', 'compute_75']);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.recordedObservations).toEqual([]);
  });

  it('builds and runs only the host-side reference acceptance test locally', async () => {
    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
      env: { ...process.env, BUILD_DIR: '.quality/host-test' },
    });

    expect(stdout).toContain('host-reference: pass');
  });

  it('checks every CUDA call, launch, synchronization, and cleanup boundary', async () => {
    const source = await readFile(path.join(exampleRoot, 'src/vector_add.cu'), 'utf8');

    for (const call of [
      'cudaMalloc',
      'cudaMemcpy',
      'cudaGetLastError',
      'cudaDeviceSynchronize',
      'cudaFree',
    ]) {
      expect(source).toContain(`CUDA_CHECK(${call}`);
    }
    expect(source).not.toContain('cudaEvent');
    expect(source).not.toMatch(/GB\/s|speedup|milliseconds/);
  });
});
