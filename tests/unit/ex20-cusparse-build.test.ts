// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../../examples/ex20-cusparse-spmv');
const profiles = [
  ['cuda-11-8-bundled-cusparse-11-7-5-86', '11.7.5.86'],
  ['cuda-12-9-bundled-cusparse-12-5-10-65', '12.5.10.65'],
  ['cuda-13-3-bundled-cusparse-12-8-2-51', '12.8.2.51'],
];

it('builds the host oracle and declares C++17 SM75 builds with dynamic cuSPARSE inspection', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex20-build-'));
  try {
    const host = spawnSync('make', ['host-test', `BUILD_DIR=${directory}`], { cwd: root, encoding: 'utf8' });
    expect(host.status, host.stdout + host.stderr).toBe(0);
    expect(host.stdout).toContain('host-reference: pass');
    for (const [, version] of profiles) {
      const plan = spawnSync('make', ['--dry-run', 'preprocess', 'compile', 'link', 'inspect',
        `EXPECTED_CUSPARSE_VERSION=${version}`, `BUILD_DIR=${directory}`], { cwd: root, encoding: 'utf8' });
      expect(plan.status, plan.stdout + plan.stderr).toBe(0);
      for (const [index, field] of ['MAJOR', 'MINOR', 'PATCH', 'BUILD'].entries()) {
        expect(plan.stdout).toContain(`-DEX20_EXPECTED_CUSPARSE_${field}=${version.split('.')[index]}`);
      }
      expect(plan.stdout).toContain('--std=c++17');
      expect(plan.stdout).toContain('arch=compute_75,code=sm_75');
      expect(plan.stdout).toContain('-lcusparse');
      expect(plan.stdout).toContain('readelf');
      expect(plan.stdout).toContain('NEEDED');
      expect(plan.stdout).toContain('ldd');
      expect(plan.stdout).not.toMatch(/cuobjdump|--ptx|--gpus/);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('rejects incompatible profiles, component versions, and dialects before tools, and retains fatal logs', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex20-runner-'));
  const script = path.join(root, 'scripts/compile-check.sh');
  try {
    for (const args of [[], ['c++17'], ['c++20', profiles[0][0]], ['c++17', 'unknown'],
      ['c++17', 'cuda-11-8-bundled-cusparse-12-8-2-51'], ['c++17', '$(touch unsafe)'],
      ['c++17', profiles[0][0], '', 'extra'], ['c++17', profiles[0][0], '']]) {
      const result = spawnSync('bash', [script, ...args], { cwd: directory, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(2);
      expect(result.stderr).toMatch(/Usage:|only c\+\+17|Unknown EX20|result directory/);
    }
    expect(await readdir(directory)).toEqual([]);
    for (const [profile, version] of profiles) {
      const logs = path.join(directory, `logs with spaces ${profile}`);
      const result = spawnSync('bash', [script, 'c++17', profile, logs], {
        cwd: directory, encoding: 'utf8', env: { ...process.env, NVCC: 'false' },
      });
      expect(result.status).not.toBe(0);
      expect(await readFile(path.join(logs, 'profile.txt'), 'utf8')).toContain(`expected_cusparse=${version}`);
      const log = await readFile(path.join(logs, 'preprocess.log'), 'utf8');
      expect(log).toContain('-E src/cusparse_spmv.cu');
      expect(log).toContain(`-DEX20_EXPECTED_CUSPARSE_BUILD=${version.split('.')[3]}`);
      expect(await readdir(logs)).not.toContain('compile.log');
      expect(await readdir(logs)).not.toContain('host-test.log');
    }
    for (const version of ['', '%', '11.7.5', '11.7.5.86.1', '11.7.x.86', '11.7.5.87', '11.7.5.86 12.8.2.51']) {
      const result = spawnSync('make', ['preprocess', `EXPECTED_CUSPARSE_VERSION=${version}`, 'NVCC=false'],
        { cwd: root, encoding: 'utf8' });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('EXPECTED_CUSPARSE_VERSION');
    }
    expect(spawnSync('make', ['host-test', 'DIALECT=c++20'], { cwd: root, encoding: 'utf8' }).status).not.toBe(0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('rejects every missing or mismatched header component, including build-only drift and aggregate-version errors', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex20-header-'));
  const fields = ['MAJOR', 'MINOR', 'PATCH', 'BUILD'];
  try {
    // These preprocessor-only fixtures cannot compile or execute a CUDA program.
    await writeFile(path.join(directory, 'cuda_runtime.h'), '');
    for (const [, version] of profiles) {
      const parts = version.split('.');
      const expected = fields.map((field, i) => `-DEX20_EXPECTED_CUSPARSE_${field}=${parts[i]}`);
      const raw = Number(parts[0]) * 1000 + Number(parts[1]) * 100 + Number(parts[2]);
      const macros = [...fields.map((field, i) => `#define CUSPARSE_VER_${field} ${parts[i]}`),
        `#define CUSPARSE_VERSION ${raw}`];
      const run = (definitions = expected) => spawnSync('c++', [
        '-std=c++17', '-E', '-x', 'c++', `-I${directory}`, '-Iinclude', ...definitions,
        'src/cusparse_spmv.cu', '-o', path.join(directory, 'preprocessed.ii'),
      ], { cwd: root, encoding: 'utf8' });
      await writeFile(path.join(directory, 'cusparse.h'), macros.join('\n'));
      expect(run().status).toBe(0);
      for (let i = 0; i < expected.length; ++i) {
        expect(run(expected.filter((_, index) => i !== index)).stderr).toContain('explicit four-part');
      }
      for (let i = 0; i < fields.length; ++i) {
        await writeFile(path.join(directory, 'cusparse.h'), macros.filter((_, index) => i !== index).join('\n'));
        const missing = run();
        expect(missing.status).not.toBe(0);
        expect(missing.stderr).toContain('requires all four cuSPARSE header version macros');
        const drift = [...macros];
        drift[i] = `#define CUSPARSE_VER_${fields[i]} ${Number(parts[i]) + 1}`;
        await writeFile(path.join(directory, 'cusparse.h'), drift.join('\n'));
        const mismatch = run();
        expect(mismatch.status).not.toBe(0);
        expect(mismatch.stderr).toContain('headers do not match the selected component profile');
      }
      for (const aggregate of ['', `#define CUSPARSE_VERSION ${raw + 1}`]) {
        await writeFile(path.join(directory, 'cusparse.h'), [...macros.slice(0, 4), aggregate].join('\n'));
        expect(run().stderr).toContain('requires CUSPARSE_VERSION = major*1000 + minor*100 + patch');
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20_000);

it('stops at injected tool failures, removes stale later-stage success, and never executes the linked program', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex20-stages-'));
  const stages = ['clean', 'preprocess', 'compile', 'link', 'inspect', 'host-test'];
  try {
    const isolatedRoot = path.join(directory, 'example');
    await cp(root, isolatedRoot, {
      recursive: true,
      filter: (source) => !path.relative(root, source).split(path.sep).includes('build'),
    });
    const script = path.join(isolatedRoot, 'scripts/compile-check.sh');
    const compiler = path.join(directory, 'compiler.mjs');
    await writeFile(compiler, [
      "import { writeFileSync } from 'node:fs';",
      "const stage = process.argv.includes('-E') ? 'preprocess' : process.argv.includes('--compile') ? 'compile' : 'link';",
      "if (process.env.FAIL_STAGE === stage) { console.error(`injected-${stage}-fatal`); process.exit(23); }",
      "const output = process.argv[process.argv.indexOf('-o') + 1];",
      "writeFileSync(output, stage === 'link' ? '#!/bin/sh\\nprintf unexpected > \"$GPU_SENTINEL\"\\nexit 79\\n' : process.argv.slice(2).join('\\n'), { mode: 0o755 });",
    ].join('\n'));
    const inspection = path.join(directory, 'inspection.mjs');
    await writeFile(inspection, "if (process.env.FAIL_STAGE === 'inspect') { console.error('injected-inspect-fatal'); process.exit(24); }\nconsole.log(process.argv[2]);\n");
    const logs = path.join(directory, 'logs with spaces');
    const env = { ...process.env, NVCC: `${process.execPath} ${compiler}`,
      READELF: `${process.execPath} ${inspection} 'NEEDED [libcusparse.so.12]'`,
      LDD: `${process.execPath} ${inspection} 'libcusparse.so.12 => /usr/local/cuda/lib64/libcusparse.so.12'`,
      GPU_SENTINEL: path.join(directory, 'gpu-was-executed'), FAIL_STAGE: '' };
    const run = (extra: Record<string, string> = {}) => spawnSync('bash', [script, 'c++17', profiles[2][0], logs], {
      cwd: directory, encoding: 'utf8', env: { ...env, ...extra },
    });
    const success = run();
    expect(success.status, success.stdout + success.stderr).toBe(0);
    expect(await readFile(path.join(logs, 'host-test.log'), 'utf8')).toContain('host-reference: pass');
    expect(await readFile(path.join(logs, 'dynamic-linkage.txt'), 'utf8')).toContain('libcusparse.so.12 => /');
    expect(await readFile(path.join(logs, 'profile.txt'), 'utf8')).toContain('runtime=not-executed');
    for (const stage of stages.slice(1)) {
      for (const stale of [...stages.map((name) => `${name}.log`), 'dynamic-section.txt', 'dynamic-linkage.txt']) {
        await writeFile(path.join(logs, stale), 'stale-success');
      }
      const result = run(stage === 'host-test' ? { CXX: 'false' } : { FAIL_STAGE: stage });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(`${stage} failed`);
      const fatal = await readFile(path.join(logs, `${stage}.log`), 'utf8');
      expect(fatal).toContain(stage === 'host-test' ? 'Error' : `injected-${stage}-fatal`);
      const files = await readdir(logs);
      for (const later of stages.slice(stages.indexOf(stage) + 1)) expect(files).not.toContain(`${later}.log`);
      expect(files).not.toContain('dynamic-section.txt');
      expect(files).not.toContain('dynamic-linkage.txt');
    }
    await expect(readFile(env.GPU_SENTINEL)).rejects.toMatchObject({ code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 30_000);

it('refuses a results directory that the clean stage would erase', () => {
  const result = spawnSync('bash', ['scripts/compile-check.sh', 'c++17', profiles[0][0], 'build/results'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, NVCC: 'false' },
  });
  expect(result.status).toBe(2);
  expect(result.stderr).toContain('result directory must be outside');
  expect(result.stdout).not.toContain('clean: pass');
});

it('rebuilds changed component profiles and rejects missing or unresolved dynamic cuSPARSE dependencies', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex20-profile-'));
  try {
    const compiler = path.join(directory, 'compiler.mjs');
    await writeFile(compiler, [
      "import { writeFileSync } from 'node:fs';",
      "writeFileSync(process.argv[process.argv.indexOf('-o') + 1], process.argv.slice(2).join('\\n'));",
    ].join('\n'));
    const make = (stage: string, version: string, extra: string[] = []) => spawnSync('make', [
      stage, `EXPECTED_CUSPARSE_VERSION=${version}`, `BUILD_DIR=${directory}/build`,
      `NVCC=${process.execPath} ${compiler}`, ...extra,
    ], { cwd: root, encoding: 'utf8' });
    for (const [, version] of profiles) {
      const build = make('link', version);
      expect(build.status, build.stdout + build.stderr).toBe(0);
      const object = await readFile(path.join(directory, 'build/cusparse_spmv.o'), 'utf8');
      for (const [index, field] of ['MAJOR', 'MINOR', 'PATCH', 'BUILD'].entries()) {
        expect(object).toContain(`-DEX20_EXPECTED_CUSPARSE_${field}=${version.split('.')[index]}`);
      }
      const cached = make('link', version);
      expect(cached.status).toBe(0);
      expect(cached.stdout).not.toContain(compiler);
    }
    const inspection = path.join(directory, 'inspection.mjs');
    await writeFile(inspection, "console.log(process.argv[2].split('|').join('\\n'));\n");
    const version = profiles[2][1];
    const section = `READELF=${process.execPath} ${inspection} 'NEEDED [libcusparse.so.12]'`;
    const linked = `LDD=${process.execPath} ${inspection} 'libcusparse.so.12 => /usr/local/cuda/lib64/libcusparse.so.12'`;
    expect(make('inspect', version, [section, linked]).status).toBe(0);
    expect(make('inspect', version, ['READELF=true', linked]).status).not.toBe(0);
    expect(make('inspect', version, ['READELF=false', linked]).status).not.toBe(0);
    expect(make('inspect', version, [section, 'LDD=true']).status).not.toBe(0);
    expect(make('inspect', version, [section, 'LDD=false']).status).not.toBe(0);
    expect(make('inspect', version, [section,
      `LDD=${process.execPath} ${inspection} 'libcusparse.so.12 => not found'`]).status).not.toBe(0);
    const unresolved = make('inspect', version, [section, `${linked.slice(0, -1)}|libdependency.so.1 => not found'`]);
    expect(unresolved.status).not.toBe(0);
    expect(await readFile(path.join(directory, 'build/dynamic-linkage.txt'), 'utf8')).toContain('libdependency.so.1 => not found');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20_000);

it('does not reuse partial compiler outputs after a failed public make command', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'ex20-partial-'));
  try {
    const compiler = path.join(directory, 'compiler.mjs');
    await writeFile(compiler, [
      "import { writeFileSync } from 'node:fs';",
      "const stage = process.argv.includes('-E') ? 'preprocess' : process.argv.includes('--compile') ? 'compile' : 'link';",
      "const failed = process.env.FAIL_STAGE === stage;",
      "writeFileSync(process.argv[process.argv.indexOf('-o') + 1], failed ? 'partial-output' : 'complete-output');",
      "if (failed) process.exit(23);",
    ].join('\n'));
    for (const [stage, artifact] of [['preprocess', 'cusparse_spmv.ii'], ['compile', 'cusparse_spmv.o'], ['link', 'ex20-cusparse-spmv']]) {
      const buildRoot = path.join(directory, stage);
      const run = (failure: string) => spawnSync('make', [stage, `BUILD_DIR=${buildRoot}`,
        `EXPECTED_CUSPARSE_VERSION=${profiles[0][1]}`, `NVCC=${process.execPath} ${compiler}`], {
        cwd: root, encoding: 'utf8', env: { ...process.env, FAIL_STAGE: failure },
      });
      expect(run(stage).status).not.toBe(0);
      const retry = run('');
      expect(retry.status, retry.stdout + retry.stderr).toBe(0);
      expect(await readFile(path.join(buildRoot, artifact), 'utf8')).toBe('complete-output');
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
