// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const artifactPath = 'artifacts/cuda-ex21/ex21-cpython-3-14-7-cuda-13-3-1-sm75';

it('requires the EX21 Python build and a successful privacy scan, rejecting every non-success aggregate result', async () => {
  const workflow = parseFrontmatter(`---\n${await readFile(
    path.join(root, '.github/workflows/cuda-compile.yml'), 'utf8')}\n---`).frontmatter;
  const job = workflow.jobs['ex21-python-build'];
  expect(job).toBeDefined();
  expect(job['runs-on']).toBe('ubuntu-24.04');
  expect(job['continue-on-error']).toBeUndefined();
  expect(job.steps.every((step: { 'continue-on-error'?: boolean }) => !step['continue-on-error'])).toBe(true);
  const buildIndex = job.steps.findIndex((step: { run?: string }) =>
    step.run === 'node scripts/run-ex21-python-check.mjs');
  expect(buildIndex).toBeGreaterThan(-1);
  const scanIndex = job.steps.findIndex((step: { run?: string }) =>
    step.run === `node scripts/check-artifacts.mjs "${artifactPath}"`);
  const uploadIndex = job.steps.findIndex((step: { uses?: string }) =>
    step.uses?.startsWith('actions/upload-artifact@'));
  expect(scanIndex).toBeGreaterThan(buildIndex);
  expect(uploadIndex).toBeGreaterThan(scanIndex);
  expect(job.steps[scanIndex].id).toBe('scan');
  expect(job.steps[scanIndex].if).toBe('${{ !cancelled() }}');
  expect(job.steps[uploadIndex].if).toBe("${{ !cancelled() && steps.scan.outcome == 'success' }}");
  expect(job.steps[uploadIndex].with).toMatchObject({
    path: artifactPath, 'include-hidden-files': false, 'if-no-files-found': 'error', 'retention-days': 7,
  });
  const gate = workflow.jobs['cuda-compile-gate'];
  expect(gate.needs).toContain('ex21-python-build');
  expect(gate.if).toBe('${{ always() }}');
  const step = gate.steps[0];
  expect(step.env.EX21_PYTHON_BUILD_RESULT).toBe('${{ needs.ex21-python-build.result }}');
  for (const result of ['success', 'failure', 'cancelled', 'skipped', '']) {
    const run = spawnSync('bash', ['-c', step.run], {
      encoding: 'utf8', env: { ...process.env,
        ...Object.fromEntries(Object.keys(step.env).map((key) => [key, 'success'])),
        EX21_PYTHON_BUILD_RESULT: result },
    });
    expect(run.status, result).toBe(result === 'success' ? 0 : 1);
  }
});

it('pins authentic acquisition and exercises the public CLI without GPU provisioning or evidence promotion', async () => {
  const runner = await readFile(path.join(root, 'scripts/run-ex21-python-check.mjs'), 'utf8');
  const plan = spawnSync(process.execPath, ['scripts/run-ex21-python-check.mjs', '--print-container-script'], {
    cwd: root, encoding: 'utf8',
  });
  expect(plan.status, plan.stderr).toBe(0);
  expect(runner).toContain('nvidia/cuda:13.3.1-devel-ubuntu24.04@sha256:4ff859525f99de5782aa73607ce24219b07dddd48d12b97c1c301d7e1cfb0a87');
  expect(runner).toContain('https://www.python.org/ftp/python/3.14.7/Python-3.14.7.tar.xz');
  expect(runner).toContain('3b48dac8fb59f62eaa67ac83c1eb12bda1b7a08406dd286e252c11a66be27f81');
  expect(plan.stdout).toContain('cuda-compat-13-3_610.43.02-1ubuntu1_amd64.deb');
  expect(plan.stdout).toContain('4d3b3bfe6e6a53b2153383b2f74f139339c7e5ffbf657d6af7c3967b8b670386');
  expect(runner).toContain('sha256sum --check --strict');
  expect(runner.indexOf('sha256sum --check --strict')).toBeLessThan(runner.indexOf('dpkg-deb --extract compat.deb'));
  expect(runner).toContain('make altinstall');
  expect(runner).toContain('--runtime=runc');
  expect(runner).toContain('NVIDIA_VISIBLE_DEVICES=void');
  expect(runner).toContain('CUDA_VISIBLE_DEVICES=');
  expect(runner).toContain('readonly');
  expect(runner).toContain('bash scripts/setup.sh');
  expect(runner).toContain('host-test');
  expect(runner).toContain('check-environment');
  expect(runner).toContain('NVRTCError');
  expect(runner).toContain('EX21_EXPECTED_NVRTC_FAILURE');
  expect(runner).toContain('fresh output directory');
  expect(runner).toContain('Pending Hardware Verification');
  expect(runner).not.toMatch(/--gpus|--privileged|--device[= ]|--insecure|--disable-gil|dpkg -i|modprobe|Compile-Checked|Runtime-Verified/);
  const help = spawnSync(process.execPath, ['scripts/run-ex21-python-check.mjs', '--help'], {
    cwd: root, encoding: 'utf8',
  });
  expect(help.status, help.stdout + help.stderr).toBe(0);
  expect(help.stdout).toContain('GPU-free');
});

it('uses the authoritative Debian profile and real package-state/ownership rejection checks before CUDA imports', async () => {
  const plan = spawnSync(process.execPath, ['scripts/run-ex21-python-check.mjs', '--print-container-script'], {
    cwd: root, encoding: 'utf8',
  });
  expect(plan.status, plan.stderr).toBe(0);
  expect(plan.stdout.includes('version.json')).toBe(false);
  for (const text of ['native-profile.json', 'native-packages', 'compiler-missing', 'compiler-unpacked',
    'unowned-library', '/usr/bin/dpkg', '--remove', '--unpack', '--install',
    'cuda-compiler-13-3_13.3.1-1_amd64.deb',
    'c0f50a88d45da764f0f831ed979394ed835fe805a85896d36de61241887c2c24',
    'LD_LIBRARY_PATH=/usr/local/cuda-13.3/compat:/usr/local/cuda-13.3/lib64',
    'CUDA_CACHE_DISABLE=1',
    '/proc/self/maps after NVRTC compilation']) {
    expect(plan.stdout.includes(text), text).toBe(true);
  }
  expect(plan.stdout.indexOf("cli('native-packages'")).toBeLessThan(plan.stdout.indexOf("cli('environment'"));
  const project = JSON.parse(await readFile(path.join(root, 'examples/ex21-cuda-python-launch/project.json'), 'utf8'));
  expect(project.build.contractFiles).toContain('native-profile.json');
  expect(project.build.commands.checkNativePackages).toBe('.venv/bin/python ex21.py check-environment --phase native-packages');
  const runner = await readFile(path.join(root, 'scripts/run-ex21-python-check.mjs'), 'utf8');
  expect(runner.includes('runnerInputs')).toBe(true);
  expect(runner.includes('nativeProfileSha256')).toBe(true);
});

it('retains only allowlisted UTF-8 reports after scanning, handling native log terminators without accepting binaries', async () => {
  const runner = await readFile(path.join(root, 'scripts/run-ex21-python-check.mjs'), 'utf8');
  const declaration = runner.match(/const allowedReports = \[([\s\S]*?)\];/);
  expect(declaration).not.toBeNull();
  const names = [...declaration![1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  expect(names).toContain('checks.json');
  expect(names).toContain('invalid.log');
  expect(names).toContain('stale.json');
  expect(names.every((name) => /^[a-z-]+\.(?:json|log|txt)$/.test(name))).toBe(true);
  expect(runner).toContain("new TextDecoder('utf-8', { fatal: true })");
  expect(runner).toContain('metadata.isSymbolicLink()');
  expect(runner).toContain("if (name.endsWith('.log')) text = text.replaceAll('\\0', '\\\\0')");
  expect(runner).toContain("text.includes('\\0')");
  expect(runner).toContain("Buffer.byteLength(text, 'utf8') > 50 * 1024 * 1024");
  const scan = runner.indexOf('scanArtifactBuffer(Buffer.from(text), name)');
  expect(scan).toBeGreaterThan(-1);
  expect(scan).toBeLessThan(runner.indexOf('await mkdir(output)'));
  expect(runner).toContain('retention: ${name}: privacy rule ${violation.rule}');
  expect(runner).toContain('retention: ${name}: invalid UTF-8');
  expect(runner).toContain('retention: ${name}: read failed');
  expect(runner).toContain('message.length <= 512');
  expect(runner).toContain('allowedReports.includes(named[1])');
  expect(runner).toContain("scanArtifactBuffer(Buffer.from(message), 'runner-error.log').length === 0");
  expect(runner).not.toMatch(/console\.error\(error(?:\)|\.stack)/);
  expect(runner).not.toMatch(/cp\([^\n]*output|copyFile\([^\n]*output/);
});

it('offers a non-executing container plan whose shell and embedded Python parse without CUDA', () => {
  const plan = spawnSync(process.execPath, ['scripts/run-ex21-python-check.mjs', '--print-container-script'], {
    cwd: root, encoding: 'utf8',
  });
  expect(plan.status, plan.stderr).toBe(0);
  const shell = spawnSync('bash', ['-n'], { input: plan.stdout, encoding: 'utf8' });
  expect(shell.status, shell.stderr).toBe(0);
  const embedded = plan.stdout.match(/^\.venv\/bin\/python -I - <<'PY'\n([\s\S]*?)^PY$/m);
  expect(embedded).not.toBeNull();
  const python = spawnSync(process.env.EX21_HOST_PYTHON ?? 'python3',
    ['-I', '-S', '-c', 'import ast, sys; ast.parse(sys.stdin.read())'], {
      input: embedded![1], encoding: 'utf8',
    });
  expect(python.status, python.stderr).toBe(0);
  expect(plan.stdout).not.toMatch(/\$\{(?:pythonUrl|pythonSha256|driverUrl|driverSha256|nativeProfile|JSON\.)/);
});
