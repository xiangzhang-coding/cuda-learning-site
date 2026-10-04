// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

it('executes the independent EX25 oracle mutation and target rejection tests without CUDA', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex25-host-'));
  try {
    const output = execFileSync('make', ['host-test', `BUILD_DIR=${directory}`], {
      cwd: 'examples/ex25-feature-gated-copy', encoding: 'utf8', timeout: 30000,
    });
    expect(output).toContain('Host dispatch/oracle tests passed; no GPU execution');
    expect(() => execFileSync('make', ['-n', 'TARGET=107f'], {
      cwd: 'examples/ex25-feature-gated-copy', stdio: 'pipe',
    })).toThrow();
  } finally { await rm(directory, { recursive: true, force: true }); }
});
