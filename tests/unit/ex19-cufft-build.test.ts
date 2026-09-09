// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../examples/ex19-cufft-batched-transform');
const profiles = [
  ['cuda-11-8-bundled-cufft-10-9-0-58', '10.9.0.58'],
  ['cuda-12-9-bundled-cufft-11-4-1-4', '11.4.1.4'],
  ['cuda-13-3-bundled-cufft-12-3-0-29', '12.3.0.29'],
];

it('builds the host contract and declares guarded C++17 SM75 builds with dynamic cuFFT inspection', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex19-build-'));
  try {
    const host = spawnSync('make', ['host-test', `BUILD_DIR=${directory}`], { cwd: root, encoding: 'utf8' });
    expect(host.status, host.stdout + host.stderr).toBe(0);
    expect(host.stdout).toContain('host-reference: pass');
    for (const [, version] of profiles) {
      const plan = spawnSync('make', ['--dry-run', 'preprocess', 'compile', 'link', 'inspect',
        `EXPECTED_CUFFT_VERSION=${version}`, `BUILD_DIR=${directory}`], { cwd: root, encoding: 'utf8' });
      expect(plan.status, plan.stdout + plan.stderr).toBe(0);
      for (const [index, field] of ['MAJOR', 'MINOR', 'PATCH', 'BUILD'].entries()) {
        expect(plan.stdout).toContain(`-DEX19_EXPECTED_CUFFT_${field}=${version.split('.')[index]}`);
      }
      expect(plan.stdout).toContain('--std=c++17');
      expect(plan.stdout).toContain('arch=compute_75,code=sm_75');
      expect(plan.stdout).toContain('-lcufft');
      expect(plan.stdout).toContain('readelf');
      expect(plan.stdout).toContain('NEEDED');
      expect(plan.stdout).toContain('ldd');
      expect(plan.stdout).not.toMatch(/cuobjdump|--ptx|--gpus/);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('rejects unknown profiles and dialects before tools or artifacts, and stops at a failed stage', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex19-runner-'));
  const script = path.join(root, 'scripts/compile-check.sh');
  try {
    for (const args of [[], ['c++17'], ['c++20', profiles[0][0]], ['c++17', 'unknown'],
      ['c++17', '$(touch unsafe)'], ['c++17', profiles[0][0], '', 'extra'], ['c++17', profiles[0][0], '']]) {
      const result = spawnSync('bash', [script, ...args], { cwd: directory, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(2);
      expect(result.stderr).toMatch(/Usage:|only c\+\+17|Unknown EX19|result directory/);
    }
    expect(await readdir(directory)).toEqual([]);
    for (const [profile, version] of profiles) {
      const logs = path.join(directory, `logs with spaces ${profile}`);
      const result = spawnSync('bash', [script, 'c++17', profile, logs], {
        cwd: directory, encoding: 'utf8', env: { ...process.env, NVCC: 'false' },
      });
      expect(result.status).not.toBe(0);
      expect(await readFile(path.join(logs, 'profile.txt'), 'utf8')).toContain(`expected_cufft=${version}`);
      const log = await readFile(path.join(logs, 'preprocess.log'), 'utf8');
      expect(log).toContain('-E src/cufft_batched_transform.cu');
      expect(log).toContain(`-DEX19_EXPECTED_CUFFT_BUILD=${version.split('.')[3]}`);
      expect(await readdir(logs)).not.toContain('compile.log');
      expect(await readdir(logs)).not.toContain('host-test.log');
    }
    for (const version of ['', '%', '10.9.0', '10.9.0.58.1', '10.9.x.58', '10.9.0.59']) {
      const result = spawnSync('make', ['preprocess', `EXPECTED_CUFFT_VERSION=${version}`, 'NVCC=false'],
        { cwd: root, encoding: 'utf8' });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('EXPECTED_CUFFT_VERSION');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('rejects every missing or mismatched header component at preprocessing, including build-only drift', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex19-version-gate-'));
  const fields = ['MAJOR', 'MINOR', 'PATCH', 'BUILD'];
  try {
    // Preprocessing alone tests the version boundary; these are not CUDA SDK
    // replacements and cannot compile or execute the CUDA program.
    await writeFile(path.join(directory, 'cuda_runtime.h'), '');
    for (const [, version] of profiles) {
      const parts = version.split('.');
      const expected = fields.map((field, i) => `-DEX19_EXPECTED_CUFFT_${field}=${parts[i]}`);
      const run = (definitions = expected) => spawnSync('c++', [
        '-std=c++17', '-E', '-x', 'c++', `-I${directory}`, '-Iinclude', ...definitions,
        'src/cufft_batched_transform.cu', '-o', path.join(directory, 'preprocessed.ii'),
      ], { cwd: root, encoding: 'utf8' });
      const macros = fields.map((field, i) => `#define CUFFT_VER_${field} ${parts[i]}`);
      await writeFile(path.join(directory, 'cufft.h'), macros.join('\n'));
      expect(run().status).toBe(0);
      expect(run([]).status).not.toBe(0);
      for (let i = 0; i < fields.length; ++i) {
        await writeFile(path.join(directory, 'cufft.h'), macros.filter((_, index) => i !== index).join('\n'));
        expect(run().stderr).toContain('requires all four cuFFT header version macros');
        const drift = [...macros];
        drift[i] = `#define CUFFT_VER_${fields[i]} ${Number(parts[i]) + 1}`;
        await writeFile(path.join(directory, 'cufft.h'), drift.join('\n'));
        const mismatch = run();
        expect(mismatch.status).not.toBe(0);
        expect(mismatch.stderr).toContain('headers do not match the selected component profile');
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20_000);

it('rebuilds changed component profiles and fails dynamic inspection on missing or unresolved cuFFT', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex19-profile-'));
  try {
    const compiler = path.join(directory, 'compiler.mjs');
    await writeFile(compiler, [
      "import { writeFileSync } from 'node:fs';",
      "writeFileSync(process.argv[process.argv.indexOf('-o') + 1], process.argv.slice(2).join('\\n'));",
    ].join('\n'));
    const make = (stage: string, version: string, extra: string[] = []) => spawnSync('make', [
      stage, `EXPECTED_CUFFT_VERSION=${version}`, `BUILD_DIR=${directory}/build`,
      `NVCC=${process.execPath} ${compiler}`, ...extra,
    ], { cwd: root, encoding: 'utf8' });
    for (const [, version] of profiles) {
      const build = make('link', version);
      expect(build.status, build.stdout + build.stderr).toBe(0);
      const object = await readFile(path.join(directory, 'build/cufft_batched_transform.o'), 'utf8');
      for (const [i, field] of ['MAJOR', 'MINOR', 'PATCH', 'BUILD'].entries()) {
        expect(object).toContain(`-DEX19_EXPECTED_CUFFT_${field}=${version.split('.')[i]}`);
      }
      const cached = make('link', version);
      expect(cached.status).toBe(0);
      expect(cached.stdout).not.toContain(compiler);
    }
    const inspection = path.join(directory, 'inspection.mjs');
    await writeFile(inspection, "console.log(process.argv[2]);\n");
    const version = profiles[2][1];
    const section = `READELF=${process.execPath} ${inspection} 'NEEDED [libcufft.so.12]'`;
    const linked = `LDD=${process.execPath} ${inspection} 'libcufft.so.12 => /usr/local/cuda/lib64/libcufft.so.12'`;
    expect(make('inspect', version, [section, linked]).status).toBe(0);
    expect(make('inspect', version, ['READELF=true', linked]).status).not.toBe(0);
    expect(make('inspect', version, [section, 'LDD=false']).status).not.toBe(0);
    expect(make('inspect', version, [section,
      `LDD=${process.execPath} ${inspection} 'libcufft.so.12 => not found'`]).status).not.toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20_000);
