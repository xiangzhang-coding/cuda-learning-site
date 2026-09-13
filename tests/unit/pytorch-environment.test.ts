// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { expect, it } from 'vitest';
import { scanFiles } from '../../scripts/lib/quality-policy.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const checker = path.join(root, 'scripts/pytorch-environment/check.py');
const python = process.env.PYTORCH_HOST_PYTHON ?? 'python3';

it('validates the complete pinned application lock without site packages or a GPU', () => {
  const run = spawnSync(python, ['-I', '-S', checker, '--check-lock'], { encoding: 'utf8' });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(run.stderr).toBe('');
  expect(JSON.parse(run.stdout)).toMatchObject({
    result: 'pass', scope: 'lock-contract', distributions: 29,
    toolkitExtras: ['cublas', 'cudart', 'cufft', 'cufile', 'cupti', 'curand',
      'cusolver', 'cusparse', 'nvjitlink', 'nvrtc', 'nvtx'],
    python: '3.12.14', torch: '2.11.0+cu128',
    torchCommit: '70d99e998b4955e0049d13a98d77ae1b14db1f45',
    gpuExecuted: false, traceCollected: false,
  });
});

// Only the real selected interpreter and wheel closure may exercise this seam.
// The required CI job invokes the host gate directly, without this opt-in switch.
const profilePython = process.env.PYTORCH_PROFILE_PYTHON;
it.runIf(Boolean(profilePython))('checks the real Linux build, independent CPU oracle and public schedule without CUDA', () => {
  const run = spawnSync(profilePython!, ['-I', checker], {
    encoding: 'utf8', timeout: 120_000,
    env: { ...process.env, PYTORCH_ALLOC_CONF: 'backend:native', CUDA_VISIBLE_DEVICES: '' },
  });
  expect(run.status, run.stdout + run.stderr).toBe(0);
  expect(run.stderr).toBe('');
  expect(JSON.parse(run.stdout)).toMatchObject({
    result: 'pass', scope: 'linux-cpu-environment', stage: 'complete', distributions: 29,
    pipCheck: 'pass', gpuExecuted: false, traceCollected: false, allocatorRuntimeChecked: false,
    cpuQuantization: { originalSum: 1.00048828125, quantizedSum: 1,
      maximumAbsoluteInputError: 0.00048828125 },
    runnerCoordinates: { system: 'Linux', machine: 'x86_64', pythonVersion: '3.12.14' },
    scheduleActions: ['NONE', 'WARMUP', 'RECORD', 'RECORD', 'RECORD_AND_SAVE',
      'NONE', 'WARMUP', 'RECORD', 'RECORD', 'RECORD_AND_SAVE', 'NONE'],
  });
});

it.runIf(Boolean(profilePython))('rejects build-commit, dependency and allocator drift in the real Linux environment', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'pytorch-host-rejection-'));
  try {
    const source = path.join(root, 'scripts/pytorch-environment');
    await cp(path.join(source, 'check.py'), path.join(directory, 'check.py'));
    const originalProfile = await readFile(path.join(source, 'profile.json'), 'utf8');
    const originalLock = await readFile(path.join(source, 'requirements.lock'), 'utf8');
    for (const stage of ['torch-build', 'installed-distributions', 'host-configuration']) {
      const profile = JSON.parse(originalProfile);
      let lock = originalLock;
      if (stage === 'torch-build') profile.torch.sourceCommit = '0'.repeat(40);
      if (stage === 'installed-distributions') {
        profile.distributions.fsspec = '2026.2.1';
        lock = lock.replace('fsspec-2026.2.0-', 'fsspec-2026.2.1-');
        profile.lockSha256 = createHash('sha256').update(lock).digest('hex');
      }
      await writeFile(path.join(directory, 'profile.json'), JSON.stringify(profile));
      await writeFile(path.join(directory, 'requirements.lock'), lock);
      const run = spawnSync(profilePython!, ['-I', path.join(directory, 'check.py')], {
        encoding: 'utf8', timeout: 120_000,
        env: { ...process.env, CUDA_VISIBLE_DEVICES: '',
          PYTORCH_ALLOC_CONF: stage === 'host-configuration' ? 'backend:cudaMallocAsync' : 'backend:native' },
      });
      expect(run.status, run.stdout + run.stderr).toBe(1);
      expect(run.stderr).toBe('');
      expect(JSON.parse(run.stdout)).toMatchObject({ result: 'fail', stage, gpuExecuted: false });
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 150_000);

it('pins the reviewed source and every exact artifact byte selection independently of the validator', async () => {
  const directory = path.join(root, 'scripts/pytorch-environment');
  const profile = JSON.parse(await readFile(path.join(directory, 'profile.json'), 'utf8'));
  expect(profile.python).toMatchObject({ implementation: 'CPython', version: '3.12.14',
    sourceCommit: '2abcf904b8dac8c999d2b3aac76681abb333798a',
    sourceSha256: '5c8462af5790baf43a321a1559dbe0db06d1be4300fb85fb53c40060668e548a' });
  expect(profile.torch).toMatchObject({ version: '2.11.0+cu128', cudaBuild: '12.8', debug: false,
    sourceCommit: '70d99e998b4955e0049d13a98d77ae1b14db1f45' });
  expect(createHash('sha256').update(await readFile(path.join(directory, 'requirements.lock'))).digest('hex'))
    .toBe('1536b687b0592836a7bb5c9d154ddce6a870a3cd7e7382333bb61ac96a66edd1');
});

it.each(['missing extra', 'changed artifact digest', 'unhashed dependency'])(
  'rejects %s through the lock-check CLI', async (fault) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'pytorch-contract-'));
    try {
      for (const name of ['check.py', 'profile.json', 'requirements.lock']) {
        await cp(path.join(root, 'scripts/pytorch-environment', name), path.join(directory, name));
      }
      const lockPath = path.join(directory, 'requirements.lock');
      const lock = await readFile(lockPath, 'utf8');
      const changed = fault === 'missing extra' ? lock.replace('cublas,cudart,', 'cublas,') :
        fault === 'changed artifact digest' ? lock.replace('d252cf975fb18c94', '0000000000000000') :
          `${lock}\nnumpy==2.0.0\n`;
      await writeFile(lockPath, changed);
      const run = spawnSync(python, ['-I', '-S', path.join(directory, 'check.py'), '--check-lock'], {
        encoding: 'utf8',
      });
      expect(run.status, run.stdout + run.stderr).toBe(1);
      expect(run.stderr).toBe('');
      expect(JSON.parse(run.stdout)).toMatchObject({ result: 'fail', stage: 'lock-contract' });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
);

it('fails closed without the selected host environment and prints only a bounded summary', () => {
  const run = spawnSync(python, ['-I', '-S', checker], { encoding: 'utf8' });
  expect(run.status, run.stdout + run.stderr).toBe(1);
  expect(run.stderr).toBe('');
  expect(JSON.parse(run.stdout)).toMatchObject({
    result: 'fail', scope: 'linux-cpu-environment', gpuExecuted: false, traceCollected: false,
  });
  expect(JSON.parse(run.stdout).stage).toMatch(/^host-/);
  expect(run.stdout.length).toBeLessThan(16384);
});

it('keeps the owned tooling, tests and workflow inside the public source and license boundaries', async () => {
  const names = ['scripts/pytorch-environment/profile.json', 'scripts/pytorch-environment/requirements.lock',
    'scripts/pytorch-environment/check.py', 'scripts/pytorch-environment/README.md',
    'tests/unit/pytorch-environment.test.ts', '.github/workflows/web-quality.yml'];
  const files = names.map((name) => path.join(root, name));
  expect(await scanFiles(root, files)).toEqual({ filesScanned: 6, violations: [] });
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    if (file.endsWith('.json')) expect(JSON.parse(content)['SPDX-License-Identifier']).toBe('Apache-2.0');
    else expect(content).toContain('SPDX-License-Identifier: Apache-2.0');
  }
});

it('requires the Linux CPU environment job and rejects every non-success aggregate result', async () => {
  const workflow = parseFrontmatter(`---\n${await readFile(
    path.join(root, '.github/workflows/web-quality.yml'), 'utf8')}\n---`).frontmatter;
  const job = workflow.jobs['pytorch-environment'];
  expect(job).toBeDefined();
  expect(job['runs-on']).toBe('ubuntu-24.04');
  expect(job.if).toBeUndefined();
  expect(job['continue-on-error']).toBeUndefined();
  expect(job.steps.every((step: { 'continue-on-error'?: boolean }) => !step['continue-on-error'])).toBe(true);
  expect(job.steps.some((step: { uses?: string }) => step.uses?.startsWith('actions/upload-artifact@'))).toBe(false);
  const setup = job.steps.find((step: { uses?: string }) => step.uses?.startsWith('actions/setup-python@'));
  expect(setup.uses).toMatch(/^actions\/setup-python@[0-9a-f]{40}$/);
  expect(setup.with).toMatchObject({ 'python-version': '3.12.14', architecture: 'x64' });
  expect(setup.with.cache).toBeUndefined();
  const installIndex = job.steps.findIndex((step: { id?: string }) => step.id === 'host');
  expect(installIndex).toBeGreaterThan(-1);
  const policies = job.steps.slice(0, installIndex).flatMap((step: { run?: string }) => step.run ?? '').join('\n');
  expect(policies).toContain('npm run quality:source');
  expect(policies).toContain('npm run quality:licenses');
  expect(job.steps[installIndex].run).toContain('scripts/pytorch-environment/check.py --install');
  const retention = job.steps[installIndex + 1];
  expect(retention.if).toBe("${{ !cancelled() && steps.host.outcome != 'skipped' }}");
  expect(job.env).toMatchObject({ PYTORCH_ALLOC_CONF: 'backend:native', CUDA_VISIBLE_DEVICES: '' });
  const gate = workflow.jobs['web-quality'];
  expect(gate.needs).toContain('pytorch-environment');
  expect(gate.if).toBe('${{ always() }}');
  const step = gate.steps[0];
  expect(step.env.PYTORCH_ENVIRONMENT_RESULT).toBe('${{ needs.pytorch-environment.result }}');
  for (const result of ['success', 'failure', 'cancelled', 'skipped', '']) {
    const run = spawnSync('bash', ['-c', step.run], {
      encoding: 'utf8', env: { ...process.env,
        ...Object.fromEntries(Object.keys(step.env).map((key) => [key, 'success'])),
        PYTORCH_ENVIRONMENT_RESULT: result },
    });
    expect(run.status, result).toBe(result === 'success' ? 0 : 1);
  }
});

it('executes the CI log-retention boundary and rejects private, malformed and oversized summaries', async () => {
  const workflow = parseFrontmatter(`---\n${await readFile(
    path.join(root, '.github/workflows/web-quality.yml'), 'utf8')}\n---`).frontmatter;
  const retention = workflow.jobs['pytorch-environment'].steps.at(-1);
  const directory = await mkdtemp(path.join(tmpdir(), 'pytorch-summary-'));
  try {
    const summary = { result: 'pass', scope: 'linux-cpu-environment', gpuExecuted: false, traceCollected: false };
    const privatePath = ['/Users', 'person', 'unpublished'].join('/');
    for (const [body, accepted] of [
      [JSON.stringify(summary), true],
      [JSON.stringify({ ...summary, result: 'fail' }), false],
      [JSON.stringify({ ...summary, diagnostic: privatePath }), false],
      ['not json', false], [' '.repeat(16385), false],
    ] as const) {
      const file = path.join(directory, 'summary.json');
      await writeFile(file, body);
      const run = spawnSync('bash', ['-e', '-c', retention.run], { cwd: root, encoding: 'utf8',
        env: { ...process.env, PYTORCH_SUMMARY: file } });
      expect(run.status, run.stdout + run.stderr).toBe(accepted ? 0 : 1);
      expect(run.stdout + run.stderr).not.toContain(privatePath);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
