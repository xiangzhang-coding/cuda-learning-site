// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { parseFrontmatter } from '@astrojs/markdown-remark';
import { expect, it } from 'vitest';

import { readCanonicalRange } from '../../scripts/lib/canonical-examples.mjs';
import { contentViolations } from '../../scripts/lib/quality-policy.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const script = path.join(root, 'scripts/compile-lab12-gemm.sh');

it('rejects missing or malformed four-part cuBLAS versions before producing build artifacts', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lab12-compile-'));
  try {
    for (const args of [[], ['11.11.3.6', 'logs', 'extra'], ...[
      '', '11.11.3', '11.11.3.6.1', '11.11.x.6', '11.11.3.-6',
    ].map((version) => [version, 'logs'])]) {
      const result = spawnSync('bash', [script, ...args], { cwd: directory, encoding: 'utf8' });
      expect(result.status, result.stderr).toBe(2);
      expect(result.stderr).toMatch(/Usage:|four decimal components/);
    }
    expect(await readdir(directory)).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it.each(['11.11.3.6', '12.9.2.10', '13.6.0.2'])(
  'builds the canonical GEMM range with all four %s version guards and propagates a compiler failure',
  async (version) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'lab12-compile-'));
    try {
      const result = spawnSync('bash', [script, version, 'logs'], {
        cwd: directory, encoding: 'utf8', env: { ...process.env, NVCC: 'false' },
      });
      expect(result.status).toBe(1);
      const canonical = await readCanonicalRange(root, 'EX18', 'gemm-call');
      const generated = await readFile(path.join(directory, 'logs/lab12-ex18-gemm-call.inc'), 'utf8');
      expect(generated.trimEnd()).toBe(canonical.code);
      const log = await readFile(path.join(directory, 'logs/lab12-preprocess.log'), 'utf8');
      for (const [index, field] of ['MAJOR', 'MINOR', 'PATCH', 'BUILD'].entries()) {
        expect(log).toContain(`-DEX18_EXPECTED_CUBLAS_${field}=${version.split('.')[index]}`);
      }
      expect(log).toContain('--std=c++17');
      expect(log).toContain('public/assets/exercise-solutions/lab12-gemm-comparison.cu');
      expect(contentViolations(log)).toEqual([]);
      expect(await readdir(path.join(directory, 'logs'))).not.toContain('lab12-link.log');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

it('rejects missing, duplicate, reversed, or empty canonical markers before compiling a runner', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'lab12-compile-'));
  try {
    await mkdir(path.join(directory, 'scripts'));
    await copyFile(script, path.join(directory, 'scripts/compile-lab12-gemm.sh'));
    await mkdir(path.join(directory, 'examples/ex18-cublas-gemm/src'), { recursive: true });
    const start = '// [ex18-gemm-call-start]';
    const end = '// [ex18-gemm-call-end]';
    for (const source of [
      `${start}\ncall();`, `${end}\ncall();`, `${end}\ncall();\n${start}`,
      `${start}\n${start}\ncall();\n${end}`, `${start}\ncall();\n${end}\n${end}`,
      `${start}\n${end}`, `${start}\n  \n${end}`,
    ]) {
      await writeFile(path.join(directory, 'examples/ex18-cublas-gemm/src/cublas_gemm.cu'), source);
      const result = spawnSync('bash', ['scripts/compile-lab12-gemm.sh', '11.11.3.6', 'logs'], {
        cwd: directory, encoding: 'utf8', env: { ...process.env, NVCC: 'false' },
      });
      expect(result.status, result.stderr).toBe(2);
      expect(result.stderr).toContain('exactly one nonempty ordered marker pair');
      expect(await readdir(path.join(directory, 'logs'))).toEqual([]);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('build-gates EX18 and LAB12 in exactly the manifest lanes and rejects any unsuccessful EX18 matrix', async () => {
  const workflow = parseFrontmatter(`---\n${await readFile(
    path.join(root, '.github/workflows/cuda-compile.yml'), 'utf8',
  )}\n---`).frontmatter;
  const project = JSON.parse(await readFile(path.join(root, 'examples/ex18-cublas-gemm/project.json'), 'utf8'));
  const job = workflow.jobs['ex18-build'];
  expect(job).toBeDefined();
  expect(job['runs-on']).toBe('ubuntu-24.04');
  expect(job.strategy['fail-fast']).toBe(false);
  expect(job.strategy.matrix.include).toEqual(project.compatibility.checks.map((check: {
    id: string; toolkitLane: string; dialect: string; expectedCublasVersion: string;
  }) => ({
    profile: check.id,
    dialect: check.dialect,
    expected_cublas_version: check.expectedCublasVersion,
    image: project.compatibility.lanes.find((lane: { id: string }) => lane.id === check.toolkitLane).image,
  })));
  const buildSteps = job.steps.filter((step: { run?: string }) => step.run?.includes('docker run'));
  expect(buildSteps).toHaveLength(2);
  for (const step of buildSteps) {
    expect(step.if).toBeUndefined();
    expect(step.run).toContain('docker run --platform linux/amd64 --rm --network none');
    expect(step.run).toContain('--volume "$GITHUB_WORKSPACE:/workspace"');
    expect(step.run).not.toContain('--gpus');
  }
  expect(buildSteps[0].run).toContain('bash scripts/compile-check.sh "${{ matrix.dialect }}" "${{ matrix.profile }}"');
  expect(buildSteps[1].run).toContain('bash scripts/compile-lab12-gemm.sh "${{ matrix.expected_cublas_version }}"');
  const artifactPath = 'artifacts/cuda-ex18/${{ matrix.profile }}';
  const scanIndex = job.steps.findIndex((step: { run?: string }) =>
    step.run === `node scripts/check-artifacts.mjs "${artifactPath}"`);
  const uploadIndex = job.steps.findIndex((step: { uses?: string }) => step.uses?.startsWith('actions/upload-artifact@'));
  expect(scanIndex).toBeGreaterThan(job.steps.indexOf(buildSteps[1]));
  expect(uploadIndex).toBeGreaterThan(scanIndex);
  expect(job.steps[uploadIndex].with).toMatchObject({
    path: artifactPath, 'retention-days': 7, 'include-hidden-files': false,
  });

  const gate = workflow.jobs['cuda-compile-gate'];
  expect(gate.if).toBe('${{ always() }}');
  expect(gate.needs).toContain('ex18-build');
  const gateStep = gate.steps[0];
  expect(gateStep.env.EX18_BUILD_RESULT).toBe('${{ needs.ex18-build.result }}');
  for (const result of ['success', 'failure', 'cancelled', 'skipped']) {
    const run = spawnSync('bash', ['-c', gateStep.run], {
      encoding: 'utf8',
      env: {
        ...process.env,
        ...Object.fromEntries(Object.keys(gateStep.env).map((key) => [key, 'success'])),
        EX18_BUILD_RESULT: result,
      },
    });
    expect(run.status, result).toBe(result === 'success' ? 0 : 1);
  }
});
