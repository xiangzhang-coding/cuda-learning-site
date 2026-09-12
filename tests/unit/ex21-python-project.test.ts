// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../examples/ex21-cuda-python-launch');
const python = process.env.EX21_HOST_PYTHON ?? 'python3';

it('runs the EX21 CPU reference and literal checks without site packages or a GPU', () => {
  const run = spawnSync(python, ['-I', '-S', path.join(root, 'ex21.py'), 'host-test'], {
    encoding: 'utf8',
  });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(JSON.parse(run.stdout)).toMatchObject({
    command: 'host-test',
    result: 'pass',
    gpuExecuted: false,
    literalChecks: 12,
    sizes: [1, 255, 256, 257, 1003],
  });
});

it('host-test rejects wrong extents and every nonfinite or mismatching output, including the tail', () => {
  const run = spawnSync(python, ['-I', '-S', path.join(root, 'ex21.py'), 'host-test'], {
    encoding: 'utf8',
  });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(JSON.parse(run.stdout)).toMatchObject({
    rejectedOutputCases: 15,
    rejectedInputCases: 4,
    rejectedSizeCases: 4,
  });
});

it('host-test rejects real cleanup diagnostics, preserves the primary error and restores both stderr sinks', () => {
  const run = spawnSync(python, ['-I', '-S', path.join(root, 'ex21.py'), 'host-test'], {
    encoding: 'utf8',
  });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(JSON.parse(run.stdout).cleanupChecks).toEqual({
    quiet: true,
    pythonStderr: true,
    nativeStderr: true,
    warning: true,
    exception: true,
    combined: true,
    primaryExceptionPreserved: true,
    boundedDiagnostics: true,
    referenceRelease: true,
    stderrRestored: true,
  });
  for (const marker of ['expected Python stderr', 'expected fd2 stderr', 'expected cleanup warning',
    'expected cleanup exception', 'expected release stderr', 'cleanup diagnostics truncated',
    'self-test Python stderr restored', 'self-test fd2 restored']) {
    expect(run.stderr).toContain(marker);
  }
});

it.each([
  ['run', '--size', '0', 'size must be'],
  ['run', '--size', '-1', 'size must be'],
  ['run', '--size', '1000001', 'size must be'],
  ['run', '--size', '1.5', 'size must be'],
  ['build', '--arch', '74', 'arch must be'],
  ['build', '--arch', '75a', 'arch must be'],
  ['build', '--arch', 'sm_75', 'arch must be'],
])('rejects %s %s %s before importing CUDA', (command, flag, value, message) => {
  const run = spawnSync(python, ['-I', '-S', path.join(root, 'ex21.py'), command, flag, value], {
    encoding: 'utf8',
  });
  expect(run.status, run.stdout + run.stderr).toBe(2);
  expect(run.stderr).toContain(message);
  expect(run.stderr).not.toContain('Traceback');
});

it.each([
  ['check-environment'],
  ['check-environment', '--phase', 'native-packages'],
  ['build', '--arch', '75'],
  ['run', '--size', '1003'],
])('fails closed at the profile gate for %s without the selected Python packages', (...args) => {
  const run = spawnSync(python, ['-I', '-S', path.join(root, 'ex21.py'), ...args], {
    encoding: 'utf8',
  });
  expect(run.status, run.stdout + run.stderr).toBe(1);
  expect(JSON.parse(run.stdout)).toMatchObject({
    command: args[0], result: 'fail', stage: 'environment-profile', gpuExecuted: false,
  });
  expect(run.stderr).toMatch(/unsupported EX21 profile/);
});

it('exposes setup help and rejects unknown setup arguments before creating an environment', () => {
  const help = spawnSync('bash', [path.join(root, 'scripts/setup.sh'), '--help'], { encoding: 'utf8' });
  expect(help.status, help.stdout + help.stderr).toBe(0);
  expect(help.stdout).toContain('python3.14');
  expect(help.stdout).toContain('hash-locked');
  const bad = spawnSync('bash', [path.join(root, 'scripts/setup.sh'), '--unknown'], { encoding: 'utf8' });
  expect(bad.status, bad.stdout + bad.stderr).toBe(2);
  expect(bad.stderr).toContain('usage:');
});

// Opt in only with the real selected Linux interpreter, hashed wheels and native libraries.
// No CUDA mocks, driver stubs, emulation or GPU resources are supplied by these tests.
const profilePython = process.env.EX21_PROFILE_PYTHON;
it.runIf(Boolean(profilePython))('inspects real installed NVIDIA Debian packages and file ownership without CUDA imports', () => {
  const check = spawnSync(profilePython!, [path.join(root, 'ex21.py'), 'check-environment',
    '--phase', 'native-packages'], { encoding: 'utf8', timeout: 30_000 });
  expect(check.status, check.stdout + check.stderr).toBe(0);
  const report = JSON.parse(check.stdout);
  expect(report).toMatchObject({ result: 'pass', gpuExecuted: false, driverInitialized: false });
  expect(report.environment.checkedPhase).toBe('native-packages');
  expect(report.environment.toolkit).toMatchObject({
    installationMode: 'nvidia-deb', version: '13.3.1',
    packages: {
      'cuda-compiler-13-3': { status: 'install ok installed', version: '13.3.1-1', architecture: 'amd64' },
      'cuda-command-line-tools-13-3': { status: 'install ok installed', version: '13.3.1-1' },
      'cuda-nvrtc-13-3': { status: 'install ok installed', version: '13.3.33-1' },
      'libnvjitlink-13-3': { status: 'install ok installed', version: '13.3.33-1' },
      'cuda-cuobjdump-13-3': { status: 'install ok installed', version: '13.3.73-1' },
      'cuda-compat-13-3': { status: 'install ok installed', version: '610.43.02-1ubuntu1' },
    },
  });
  expect(report.environment.nativeFiles.nvrtcBuiltins).toMatchObject({
    package: 'cuda-nvrtc-13-3', packageVersion: '13.3.33-1',
    path: '/usr/local/cuda-13.3/targets/x86_64-linux/lib/libnvrtc-builtins.so.13.3.33',
  });
  expect(report.environment.nativeFiles.nvrtcBuiltins.sha256).toMatch(/^[a-f0-9]{64}$/);
  expect(report.environment.nativeLibraries).toBeUndefined();
});

it.runIf(Boolean(profilePython))('builds and inspects PTX and cubin through the GPU-free CLI', async () => {
  const output = await mkdtemp(path.join(tmpdir(), 'ex21-build-'));
  try {
    const build = spawnSync(profilePython!, [path.join(root, 'ex21.py'), 'build', '--arch', '75',
      '--output-dir', output], { encoding: 'utf8', timeout: 120_000 });
    expect(build.status, build.stdout + build.stderr).toBe(0);
    expect(JSON.parse(build.stdout)).toMatchObject({
      command: 'build', result: 'pass', gpuExecuted: false, driverInitialized: false,
      arch: '75', backend: 'nvJitLink', cachePolicy: 'disabled',
    });
    expect(await readFile(path.join(output, 'ex21.ptx'), 'utf8')).toMatch(/\.entry\s+ex21_vector_add/);
    const cubin = await readFile(path.join(output, 'ex21.cubin'));
    expect([...cubin.subarray(0, 4)]).toEqual([127, 69, 76, 70]);
    expect(await readFile(path.join(output, 'sass.txt'), 'utf8')).toContain('ex21_vector_add');
    const report = JSON.parse(await readFile(path.join(output, 'report.json'), 'utf8'));
    expect(report.result).toBe('pass');
    expect(report.environment.nativeLibraries.nvrtcBuiltins).toMatchObject({
      package: 'cuda-nvrtc-13-3', packageVersion: '13.3.33-1',
      observedVia: '/proc/self/maps after NVRTC compilation',
      path: '/usr/local/cuda-13.3/targets/x86_64-linux/lib/libnvrtc-builtins.so.13.3.33',
    });
    expect(report.environment.nativeLibraries.nvrtcBuiltins.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(report.environment.nativeLibraries.nvrtcBuiltins.mappingIdentity)
      .toEqual(report.environment.nativeLibraries.nvrtcBuiltins.fileIdentity);
    expect(report.artifacts.map((item: { path: string }) => item.path)).toEqual(['ex21.ptx', 'ex21.cubin']);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
}, 150_000);

it.runIf(Boolean(profilePython))('retains a real NVRTC failure and refuses stale build outputs', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex21-compile-error-'));
  try {
    const project = path.join(directory, 'project');
    await cp(root, project, { recursive: true, filter: (source) => !/\/(?:\.venv|build|__pycache__)(?:\/|$)/.test(source) });
    await writeFile(path.join(project, 'kernel.cu'), 'this is deliberately invalid CUDA C++\n');
    const build = spawnSync(profilePython!, [path.join(project, 'ex21.py'), 'build', '--arch', '75',
      '--output-dir', path.join(directory, 'outputs')], { encoding: 'utf8', timeout: 120_000 });
    expect(build.status, build.stdout + build.stderr).toBe(1);
    expect(JSON.parse(build.stdout)).toMatchObject({ result: 'fail', stage: 'compile-ptx', gpuExecuted: false });
    expect(build.stderr).toMatch(/error|NVRTC/i);
    const retry = spawnSync(profilePython!, [path.join(project, 'ex21.py'), 'build', '--arch', '75',
      '--output-dir', path.join(directory, 'outputs')], { encoding: 'utf8', timeout: 120_000 });
    expect(retry.status, retry.stdout + retry.stderr).toBe(1);
    expect(retry.stderr).toContain('fresh output directory');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 150_000);
