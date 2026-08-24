// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const html = await readFile(path.join(projectRoot, 'dist', route.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

const visualPairs = [
  { id: 'VIS01', tag: 'cuda-kernel-journey', zh: '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
  { id: 'VIS02', tag: 'cuda-indexing-explorer', zh: '/visuals/indexing/', en: '/en/visuals/indexing/' },
] as const;

describe('built Visual Explainers', () => {
  it.each(visualPairs.flatMap((pair) => [{ ...pair, route: pair.zh }, { ...pair, route: pair.en }]))(
    'renders $id semantic output and a purpose-built fallback at $route',
    async ({ id, tag, route }) => {
      const document = await readRoute(route);
      const visual = document.querySelector(`${tag}[data-visual-id="${id}"]`);

      expect(visual).not.toBeNull();
      expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
      expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
      expect(visual?.querySelector('[data-conceptual-only]')?.textContent?.trim().length).toBeGreaterThan(40);
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Compile-Checked');
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Community-Observed');
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Runtime-Verified');
      expect(visual?.querySelectorAll('button, input, select').length).toBeGreaterThan(0);
      expect(visual?.querySelector('form')).toBeNull();
      expect(visual?.querySelector('img, iframe, object, embed')).toBeNull();
      expect(visual?.querySelectorAll('[id]').length).toBe(0);
    },
  );

  it('keeps VIS01 controls, stage order, and facts aligned across locales', async () => {
    const documents = await Promise.all([
      readRoute('/visuals/kernel-journey/'),
      readRoute('/en/visuals/kernel-journey/'),
    ]);
    const expectedStages = [
      'launch',
      'grid-ready',
      'block-scheduled',
      'warps-formed',
      'warp-issued',
      'memory-transactions',
      'block-complete',
      'synchronization-complete',
    ];

    for (const document of documents) {
      const visual = document.querySelector('cuda-kernel-journey');
      expect([...visual!.querySelectorAll('[data-action]')].map((control) => control.getAttribute('data-action'))).toEqual([
        'play',
        'pause',
        'step',
        'reset',
        'scrub',
      ]);
      expect([...visual!.querySelectorAll('[data-stage-id]')].map((stage) => stage.getAttribute('data-stage-id'))).toEqual(
        expectedStages,
      );
      const text = visual?.textContent ?? '';
      expect(text).toMatch(/32/);
      expect(text).toMatch(/4 × 32 B/);
      expect(text).toMatch(/arbitrary order|any order|任意顺序/);
      expect(text).toMatch(/conceptual|概念/);
    }
  });

  it('keeps VIS02 fields, equations, bounds, and static examples aligned across locales', async () => {
    const documents = await Promise.all([readRoute('/visuals/indexing/'), readRoute('/en/visuals/indexing/')]);
    const expectedFields = [
      'gridDim.x', 'gridDim.y', 'gridDim.z',
      'blockDim.x', 'blockDim.y', 'blockDim.z',
      'extent.x', 'extent.y', 'extent.z',
      'blockIdx.x', 'blockIdx.y', 'blockIdx.z',
      'threadIdx.x', 'threadIdx.y', 'threadIdx.z',
    ];
    const expectedEquations = ['global-x', 'global-y', 'global-z', 'local-thread', 'linear-block', 'data-linear'];

    for (const document of documents) {
      const visual = document.querySelector('cuda-indexing-explorer');
      expect([...visual!.querySelectorAll('[data-index-field]')].map((input) => input.getAttribute('data-index-field'))).toEqual(
        expectedFields,
      );
      expect([...visual!.querySelectorAll('[data-equation]')].map((equation) => equation.getAttribute('data-equation'))).toEqual(
        expectedEquations,
      );
      expect([...visual!.querySelectorAll('[data-static-example]')].map((example) => example.getAttribute('data-static-example'))).toEqual([
        '1d',
        '2d',
        '3d',
      ]);
      expect(visual?.querySelectorAll('[data-axis-bound]')).toHaveLength(3);
      expect(visual?.textContent).toContain('IN BOUNDS');
      expect(visual?.textContent).toContain('OUT OF BOUNDS');
    }
  });

  it('publishes empty CUDA evidence axes for both conceptual models', async () => {
    for (const route of visualPairs.flatMap(({ zh, en }) => [zh, en])) {
      const document = await readRoute(route);
      for (const name of [
        'cuda:evidence-compilation',
        'cuda:evidence-runtime',
        'cuda:expected-observations',
        'cuda:recorded-observations',
      ]) {
        expect(document.querySelector(`meta[name="${name}"]`)?.getAttribute('content'), `${route}: ${name}`).toBe('none');
      }
    }
  });
});
