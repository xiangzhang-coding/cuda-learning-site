// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const pathname = new URL(route, 'https://synchronization-visuals.invalid').pathname;
  const html = await readFile(path.join(projectRoot, 'dist', pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

describe('VIS03 and VIS07 synchronization Visual Explainers', () => {
  it.each([
    { route: '/visuals/warp-divergence/', counterpart: '/en/visuals/warp-divergence/' },
    { route: '/en/visuals/warp-divergence/', counterpart: '/visuals/warp-divergence/' },
  ])('renders the complete VIS03 static contract at $route', async ({ route, counterpart }) => {
    const document = await readRoute(route);
    const visual = document.querySelector('cuda-warp-divergence[data-visual-id="VIS03"]');

    expect(visual).not.toBeNull();
    expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-interactive-workbench][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
    expect(visual?.querySelectorAll('[data-static-case="lower-half"] tbody tr')).toHaveLength(32);
    expect(visual?.querySelectorAll('[data-static-case="uniform-true"] tbody tr')).toHaveLength(32);
    expect(visual?.querySelector('[data-static-case="uniform-true"]')?.textContent).toMatch(/skipped|跳过/i);
    expect(visual?.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(visual?.querySelector('canvas, img, iframe, object, embed, form')).toBeNull();
    expect(visual?.textContent).toMatch(/not hardware scheduling|不是硬件调度顺序/i);
    expect(visual?.textContent).toMatch(/not memory synchronization|不是内存同步/i);
    expect(visual?.textContent).toMatch(/CC 7\.0\+/);
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);

    expect(metadata(document, 'cuda:pair-id')).toBe('vis03');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS03');
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:fact-check-date')).toBe('2026-08-28');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:prerequisites')).toBe('none');
    expect(metadata(document, 'cuda:related-units')).toBe('M06');
    expect(metadata(document, 'cuda:hardware-gate')).toBe(
      'None: deterministic browser model; no CUDA-capable system required',
    );
    expect(metadata(document, 'cuda:source-count')).toBe('3');
    for (const field of ['compilation', 'runtime', 'expected-observations', 'recorded-observations']) {
      expect(metadata(document, `cuda:evidence-${field}`) ?? metadata(document, `cuda:${field}`)).toBe('none');
    }
  });

  it.each([
    { route: '/visuals/stream-event-dependencies/', counterpart: '/en/visuals/stream-event-dependencies/' },
    { route: '/en/visuals/stream-event-dependencies/', counterpart: '/visuals/stream-event-dependencies/' },
  ])('renders the complete VIS07 static contract at $route', async ({ route, counterpart }) => {
    const document = await readRoute(route);
    const visual = document.querySelector('cuda-stream-event-dependencies[data-visual-id="VIS07"]');

    expect(visual).not.toBeNull();
    expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-interactive-workbench][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
    expect(visual?.querySelectorAll('[data-static-stream]')).toHaveLength(3);
    expect(visual?.querySelectorAll('[data-static-operation]')).toHaveLength(5);
    expect(visual?.querySelectorAll('[data-static-same-stream-edge]')).toHaveLength(2);
    expect(visual?.querySelectorAll('[data-static-event-edge]')).toHaveLength(1);
    expect(visual?.querySelectorAll('[data-static-trace-frame]')).toHaveLength(6);
    expect(visual?.querySelector('[data-event-formula]')?.textContent?.trim()).toBe(
      'elapsed = timestamp(stop) - timestamp(start)',
    );
    expect(visual?.querySelector('[data-timing-caveats]')?.textContent).toMatch(/disabled.*unrecorded.*incomplete|禁用.*未记录.*未完成/is);
    expect(visual?.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(visual?.querySelector('canvas, img, iframe, object, embed, form')).toBeNull();
    expect(visual?.textContent).toMatch(/unordered.*not.*concurrent|未排序.*不.*并发/is);
    expect(visual?.textContent).toMatch(/browser pacing.*not CUDA time|浏览器 pacing.*不是 CUDA 时间/i);
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);

    expect(visual?.querySelector('select[data-stream-count]')).not.toBeNull();
    expect(visual?.querySelector('select[data-operation-stream]')).not.toBeNull();
    expect(visual?.querySelector('select[data-operation-kind]')).not.toBeNull();
    expect(visual?.querySelector('button[data-add-operation]')).not.toBeNull();
    expect(visual?.querySelector('select[data-event-record]')).not.toBeNull();
    expect(visual?.querySelector('select[data-event-wait]')).not.toBeNull();
    expect(visual?.querySelector('button[data-add-event]')).not.toBeNull();
    expect(visual?.querySelectorAll('button[data-trace-action]')).toHaveLength(4);
    expect(visual?.querySelector('input[type="range"][data-trace-scrub]')).not.toBeNull();

    expect(metadata(document, 'cuda:pair-id')).toBe('vis07');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS07');
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:fact-check-date')).toBe('2026-08-28');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:prerequisites')).toBe('none');
    expect(metadata(document, 'cuda:related-units')).toBe('M07,M08');
    expect(metadata(document, 'cuda:hardware-gate')).toBe(
      'None: deterministic browser model; no CUDA-capable system required',
    );
    expect(metadata(document, 'cuda:source-count')).toBe('5');
    for (const field of ['compilation', 'runtime', 'expected-observations', 'recorded-observations']) {
      expect(metadata(document, `cuda:evidence-${field}`) ?? metadata(document, `cuda:${field}`)).toBe('none');
    }
  });

  it('keeps bilingual structures, exact source archives, first-use terms, and adaptive CSS aligned', async () => {
    const contracts = [
      {
        slug: 'warp-divergence',
        component: 'WarpDivergenceExplorer.astro',
        sourceVersions: '13.3,11.8.0,12.9.1',
        structure: ['purpose', 'predicate-masks', 'path-trace', 'independent-thread-scheduling', 'static-fallback', 'evidence-boundary', 'sources'],
        urls: [
          'https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html',
          'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#simt-architecture',
          'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#simt-architecture',
        ],
        chineseTerms: [
          '线程束分支发散（warp divergence）',
          '谓词（predicate）',
          '参与掩码（participating mask）',
          '逻辑汇合（logical join）',
          '独立线程调度（Independent Thread Scheduling）',
        ],
      },
      {
        slug: 'stream-event-dependencies',
        component: 'StreamEventDependencyExplorer.astro',
        sourceVersions: '13.3,13.3.1,11.8.0,12.9.1',
        structure: ['purpose', 'stream-order', 'event-dependencies', 'deterministic-trace', 'event-timing', 'static-fallback', 'evidence-boundary', 'sources'],
        urls: [
          'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html',
          'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__STREAM.html',
          'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__EVENT.html',
          'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#asynchronous-concurrent-execution',
          'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#asynchronous-concurrent-execution',
        ],
        chineseTerms: [
          'CUDA 流（CUDA stream）',
          '事件依赖（event dependency）',
          '非默认流（non-default stream）',
          '同流顺序（same-stream order）',
          '就绪集（ready set）',
          '拓扑序（topological order）',
        ],
      },
    ] as const;

    for (const contract of contracts) {
      for (const localePrefix of ['', 'en/']) {
        const source = await readFile(
          path.join(projectRoot, 'src/content/docs', localePrefix, 'visuals', `${contract.slug}.mdx`),
          'utf8',
        );
        expect(source).toContain(`content: '${contract.sourceVersions}'`);
        expect(source.match(/accessDate: '2026-08-28'/g)).toHaveLength(contract.urls.length);
        for (const url of contract.urls) expect(source).toContain(url);
        for (const section of contract.structure) expect(source).toContain(`  - ${section}`);
        expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
        expect(source).toMatch(/No NVIDIA diagram, figure, or example is copied|没有复制 NVIDIA diagram、figure 或 example/);
      }

      const chinese = await readFile(
        path.join(projectRoot, 'src/content/docs/visuals', `${contract.slug}.mdx`),
        'utf8',
      );
      for (const term of contract.chineseTerms) expect(chinese, term).toContain(term);

      const component = await readFile(path.join(projectRoot, 'src/components', contract.component), 'utf8');
      expect(component).toContain('controls.hidden = false');
      expect(component).toContain('workbench.hidden = false');
      expect(component).toContain('data-static-fallback');
      expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB/);
    }

    const styles = await readFile(path.join(projectRoot, 'src/styles/synchronization-visuals.css'), 'utf8');
    expect(styles).toMatch(/@media \(max-width:/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(styles).toMatch(/@media \(forced-colors: active\)/);
    expect(styles).toMatch(/@media print/);
    expect(styles).toMatch(/\.sync-control-stack,[\s\S]*\.sync-workbench[\s\S]*display: none !important/);
  });
});
