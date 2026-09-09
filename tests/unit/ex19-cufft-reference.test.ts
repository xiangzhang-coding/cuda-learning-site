// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../examples/ex19-cufft-batched-transform');

it('checks the CPU DFT against literal signed complex batches and rejects invalid comparisons', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex19-host-'));
  try {
    const binary = path.join(directory, 'host-test');
    const build = spawnSync('c++', ['-std=c++17', '-Wall', '-Wextra', '-Wpedantic',
      '-Iinclude', 'tests/host_reference_test.cpp', '-o', binary], { cwd: root, encoding: 'utf8' });
    expect(build.status, build.stdout + build.stderr).toBe(0);
    const run = spawnSync(binary, [], { encoding: 'utf8' });
    expect(run.status, run.stdout + run.stderr).toBe(0);
    expect(run.stdout).toContain('host-reference: pass');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
