// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

import { loadCanonicalExample, loadCompileEvidence } from '../../scripts/lib/canonical-examples.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');
const exampleRoot = path.join(projectRoot, 'examples/ex01-environment-report');

describe('EX01 standalone project boundary', () => {
  it('keeps build, hardware, compatibility, observations, and Evidence Status independent', async () => {
    const example = await loadCanonicalExample(projectRoot, 'EX01');

    expect(example.build.stages).toEqual(['preprocess', 'compile', 'link']);
    expect(example.build.artifacts).toEqual([
      'build/environment_report.ii',
      'build/environment_report.o',
      'build/ex01-environment-report',
    ]);
    expect(example.compatibility.target).toEqual([]);
    expect(example.correctness).toMatchObject({
      contract: 'structural',
      reportSchemaVersion: 1,
      successExitCode: 0,
      invalidCliExitCode: 2,
      incompleteObservationExitCode: 3,
      zeroDeviceCount: 'observed-empty-inventory',
    });
    expect(example.evidence.compilation).toEqual([]);
    expect(example.evidence.runtime).toBe('Pending Hardware Verification');
    expect(example.evidence.expectedObservations).toHaveLength(2);
    expect(example.evidence.recordedObservations).toEqual([]);
    expect(example.sourceUrl).toContain('0fa5667c8b61588cd4ae6db07883e6a16ad16181');
    expect(example.downloadUrl).toBe(
      'https://github.com/xiangzhang-coding/cuda-learning-site/archive/0fa5667c8b61588cd4ae6db07883e6a16ad16181.zip',
    );
    await expect(loadCompileEvidence(projectRoot, 'EX01')).resolves.toEqual([]);
  });

  it('builds and runs only the pure host-side contract test locally', async () => {
    const { stdout } = await execFileAsync('make', ['host-test'], {
      cwd: exampleRoot,
    });

    expect(stdout).toContain('report-contract: pass');
    expect(stdout).not.toMatch(/\bnvcc\b/);
  }, 15_000);

  it('queries environment facts without launching work, allocating device memory, or scraping tools', async () => {
    const source = await readFile(path.join(exampleRoot, 'src/environment_report.cu'), 'utf8');
    const makefile = await readFile(path.join(exampleRoot, 'Makefile'), 'utf8');

    for (const call of [
      'cudaDriverGetVersion',
      'cudaRuntimeGetVersion',
      'cudaGetDeviceCount',
      'cudaGetDeviceProperties',
      'cudaDeviceGetPCIBusId',
      'cudaDeviceGetAttribute',
    ]) {
      expect(source).toContain(call);
    }
    expect(source).not.toMatch(/__global__|<<<|cudaMalloc|cudaMemcpy|cudaLaunchKernel|system\s*\(|popen\s*\(/);
    expect(source).not.toContain('nvidia-smi');
    expect(makefile).toContain('--compiler-bindir="$(HOST_CXX)"');
    expect(makefile).not.toMatch(/(?:sm|compute)_\d+/);
  });
});
