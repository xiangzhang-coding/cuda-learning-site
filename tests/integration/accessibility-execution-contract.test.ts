// SPDX-License-Identifier: Apache-2.0
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';

type ListedSuite = { specs?: { title: string }[]; suites?: ListedSuite[] };

function titles(suites: ListedSuite[]): string[] {
  return suites.flatMap(suite => [
    ...(suite.specs ?? []).map(spec => spec.title),
    ...titles(suite.suites ?? []),
  ]);
}

it('registers each representative page and visual state as an isolated retry/trace boundary', () => {
  const report = JSON.parse(execFileSync(process.execPath, [
    'node_modules/@playwright/test/cli.js', 'test', 'tests/e2e/accessibility.spec.ts',
    '--project=chromium', '--grep=representative', '--list', '--reporter=json',
  ], { encoding: 'utf8' }));
  const registered = titles(report.suites);
  expect(report.errors).toEqual([]);
  // Preserve the pre-fix 40 pages and three interactive states in all three themes.
  expect(registered).toHaveLength(129);
  expect(new Set(registered).size).toBe(129);
  for (const theme of ['silicon-light', 'profiler-dark', 'blueprint']) {
    expect(registered.filter(title => title.startsWith(`@accessibility representative page ${theme}: `))).toHaveLength(40);
    for (const route of ['/', '/en/', '/en/practice/', '/en/visuals/attention-memory-traffic/']) {
      expect(registered).toContain(`@accessibility representative page ${theme}: ${route}`);
    }
    for (const state of ['VIS01 memory state', 'VIS02 out-of-bounds state', 'VIS08 alternating migration state']) {
      expect(registered).toContain(`@accessibility representative visual ${theme}: ${state}`);
    }
  }
});
