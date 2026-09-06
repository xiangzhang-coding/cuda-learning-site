// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../examples/ex18-cublas-gemm');

it('builds and runs the standalone CPU contract and declares a linked cuBLAS build for each C++17 lane', async () => {
  const project = JSON.parse(await readFile(path.join(root, 'project.json'), 'utf8'));
  expect(project.compatibility.checks.map((check: { toolkitLane: string; dialect: string; kind: string; componentVersion: string }) =>
    [check.toolkitLane, check.dialect, check.kind, check.componentVersion])).toEqual([
    ['cuda-11.8', 'c++17', 'ex18', '11.11.3.6'],
    ['cuda-12.9', 'c++17', 'ex18', '12.9.2.10'],
    ['cuda-13.3', 'c++17', 'ex18', '13.6.0.2'],
  ]);
  const build = await mkdtemp(path.join(os.tmpdir(), 'ex18-build-'));
  try {
    const host = spawnSync('make', ['host-test', 'DIALECT=c++17', `BUILD_DIR=${build}`], { cwd: root, encoding: 'utf8' });
    expect(host.status, host.stdout + host.stderr).toBe(0);
    expect(host.stdout).toContain('host-reference: pass');
    for (const version of ['11.11.3.6', '12.9.2.10', '13.6.0.2']) {
      const plan = spawnSync('make', ['--dry-run', 'preprocess', 'compile', 'link', 'inspect',
        'DIALECT=c++17', `EXPECTED_CUBLAS_VERSION=${version}`, `BUILD_DIR=${build}`], { cwd: root, encoding: 'utf8' });
      expect(plan.status, plan.stdout + plan.stderr).toBe(0);
      for (const [index, field] of ['MAJOR', 'MINOR', 'PATCH', 'BUILD'].entries()) {
        expect(plan.stdout).toContain(`-DEX18_EXPECTED_CUBLAS_${field}=${version.split('.')[index]}`);
      }
      expect(plan.stdout).toContain('-lcublas');
      expect(plan.stdout).toContain('readelf');
      expect(plan.stdout).toContain('ldd');
    }
  } finally {
    await rm(build, { recursive: true, force: true });
  }
}, 20_000);

it('rejects unsupported dialects, missing component versions, and unknown profiles before CUDA tools run', () => {
  for (const args of [[], ['c++20', 'cuda-11-8-bundled-cublas-11-11-3-6'], ['c++17', 'unknown']]) {
    const result = spawnSync('bash', ['scripts/compile-check.sh', ...args], { cwd: root, encoding: 'utf8' });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/Usage:|only.*c\+\+17|Unknown EX18/);
  }
  const result = spawnSync('make', ['preprocess', 'EXPECTED_CUBLAS_VERSION=', 'NVCC=false'], { cwd: root, encoding: 'utf8' });
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain('EXPECTED_CUBLAS_VERSION must have four decimal components');
});
