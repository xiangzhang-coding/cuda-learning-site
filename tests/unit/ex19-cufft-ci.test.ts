// SPDX-License-Identifier: Apache-2.0
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');

it('build-gates all three manifest profiles without GPU access and scans logs before uploading', async () => {
  const workflow = parseFrontmatter(`---\n${await readFile(
    path.join(root, '.github/workflows/cuda-compile.yml'), 'utf8')}\n---`).frontmatter;
  const project = JSON.parse(await readFile(path.join(root, 'examples/ex19-cufft-batched-transform/project.json'), 'utf8'));
  const job = workflow.jobs['ex19-build'];
  expect(job).toBeDefined();
  expect(job['runs-on']).toBe('ubuntu-24.04');
  expect(job.strategy['fail-fast']).toBe(false);
  expect(job.strategy.matrix.include).toEqual(project.compatibility.checks.map((check: {
    id: string; toolkitLane: string; dialect: string;
  }) => ({
    profile: check.id, dialect: check.dialect,
    image: project.compatibility.lanes.find((lane: { id: string }) => lane.id === check.toolkitLane).image,
  })));
  const builds = job.steps.filter((step: { run?: string }) => step.run?.includes('docker run'));
  expect(builds).toHaveLength(1);
  expect(builds[0].run).toContain('docker run --platform linux/amd64 --rm --network none');
  expect(builds[0].run).toContain('--user "$(id -u):$(id -g)"');
  expect(builds[0].run).toContain('--workdir /workspace/examples/ex19-cufft-batched-transform');
  expect(builds[0].run).toContain('bash scripts/compile-check.sh "${{ matrix.dialect }}" "${{ matrix.profile }}"');
  expect(builds[0].run).not.toMatch(/--gpus|--privileged|\.\/build\//);
  const artifactPath = 'artifacts/cuda-ex19/${{ matrix.profile }}';
  const scanIndex = job.steps.findIndex((step: { run?: string }) =>
    step.run === `node scripts/check-artifacts.mjs "${artifactPath}"`);
  const uploadIndex = job.steps.findIndex((step: { uses?: string }) => step.uses?.startsWith('actions/upload-artifact@'));
  expect(scanIndex).toBeGreaterThan(job.steps.indexOf(builds[0]));
  expect(uploadIndex).toBeGreaterThan(scanIndex);
  expect(job.steps[scanIndex].if).toBe('${{ !cancelled() }}');
  expect(job.steps[uploadIndex].if).toBe("${{ !cancelled() && steps.scan.outcome == 'success' }}");
  expect(job.steps[uploadIndex].with).toMatchObject({
    path: artifactPath, 'include-hidden-files': false, 'retention-days': 7, 'if-no-files-found': 'error',
  });
  const gate = workflow.jobs['cuda-compile-gate'];
  expect(gate.needs).toContain('ex19-build');
  expect(gate.if).toBe('${{ always() }}');
  const step = gate.steps[0];
  expect(step.env.EX19_BUILD_RESULT).toBe('${{ needs.ex19-build.result }}');
  for (const result of ['success', 'failure', 'cancelled', 'skipped']) {
    const run = spawnSync('bash', ['-c', step.run], {
      encoding: 'utf8', env: { ...process.env,
        ...Object.fromEntries(Object.keys(step.env).map((key) => [key, 'success'])), EX19_BUILD_RESULT: result },
    });
    expect(run.status, result).toBe(result === 'success' ? 0 : 1);
  }
});
