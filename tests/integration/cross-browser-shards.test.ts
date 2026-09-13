// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
const execute = promisify(execFile);
type Suite = { suites?: Suite[]; specs?: { id: string; tests: { projectName: string }[] }[] };

async function collectedTests(shard?: string): Promise<string[]> {
  const { stdout } = await execute(process.execPath, [
    path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', '--list', '--reporter=json',
    '--project=firefox', '--project=webkit', '--project=mobile-safari',
    '--grep-invert', '@accessibility|@visual', '--workers=1',
    ...(shard ? [`--shard=${shard}`] : []),
  ], { cwd: root, env: { ...process.env, CI: 'true' }, maxBuffer: 16 * 1024 * 1024 });
  const result: string[] = [];
  function visit(suite: Suite) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests) result.push(`${spec.id}:${test.projectName}`);
    for (const child of suite.suites ?? []) visit(child);
  }
  visit(JSON.parse(stdout));
  return result.sort();
}

it('partitions every cross-browser test exactly once across three bounded CI jobs', async () => {
  const workflow = await readFile(path.join(root, '.github/workflows/web-quality.yml'), 'utf8');
  const job = workflow.split('\n  e2e-cross-browser:')[1].split('\n  accessibility-automated:')[0];
  expect(job).toContain('shard: [1, 2, 3]');
  expect(job).toContain('--shard=${{ matrix.shard }}/3');
  expect(job).toContain('timeout-minutes: 35');
  const [whole, ...shards] = await Promise.all([undefined, '1/3', '2/3', '3/3'].map(collectedTests));
  expect(whole.length).toBeGreaterThan(0);
  expect(new Set(whole).size).toBe(whole.length);
  for (const shard of shards) expect(shard.length).toBeGreaterThan(0);
  const union = shards.flat().sort();
  expect(union).toEqual(whole);
  expect(new Set(union).size).toBe(union.length);
}, 30_000);
