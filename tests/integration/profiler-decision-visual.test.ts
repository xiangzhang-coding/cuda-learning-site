// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { PROFILER_DECISION_SYMPTOMS } from '../../src/visuals/profiler-decision-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://profiler-decision.invalid').pathname;
  return parseHTML(await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8')).document;
}

function attributes(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

describe('VIS14 profiler decision Visual Explainer', () => {
  it('keeps source pairs, pure model, progressive enhancement, and media CSS aligned', async () => {
    const [zh, en, model, copy, component, css] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/nsight-systems-versus-nsight-compute.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/nsight-systems-versus-nsight-compute.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/profiler-decision-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/profiler-decision-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/ProfilerDecisionExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/profiler-decision-visual.css'), 'utf8'),
    ]);
    expect(zh).toContain('counterpart: /en/visuals/nsight-systems-versus-nsight-compute/');
    expect(en).toContain('counterpart: /visuals/nsight-systems-versus-nsight-compute/');
    for (const page of [zh, en]) {
      expect(page).toContain('pairId: vis14');
      expect(page).toContain('unitId: VIS14');
      expect(page).toMatch(/prerequisites:\n  - Q07\n  - Q08/);
      expect(page).toContain("factCheckDate: '2026-08-31'");
      expect(page).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
    }
    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(copy).not.toMatch(/Date\.now|Math\.random|localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame|cloneNode|<template/);
    expect(component).toMatch(/data-visual-controls hidden/);
    expect(component).toMatch(/data-live-workbench[\s\S]*?hidden/);
    expect(component).toMatch(/parts\.controls\.hidden = false;[\s\S]*?parts\.workbench\.hidden = false/);
    for (const media of ['@media (max-width: 390px)', '@media (prefers-reduced-motion: no-preference)', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)', '@media print']) {
      expect(css).toContain(media);
    }
  });

  it.each([
    ['/visuals/nsight-systems-versus-nsight-compute/', '/en/visuals/nsight-systems-versus-nsight-compute/', 'zh-CN'],
    ['/en/visuals/nsight-systems-versus-nsight-compute/', '/visuals/nsight-systems-versus-nsight-compute/', 'en'],
  ] as const)('renders a complete deterministic route at %s', async (route, counterpart, locale) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('[data-visual-id="VIS14"]');
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS14 custom element.');
    expect(visual.getAttribute('data-locale')).toBe(locale);
    expect(visual.getAttribute('data-symptom-id')).toBe('whole-workload-slow');
    expect(visual.getAttribute('data-recommended-tool')).toBe('nsight-systems');
    expect(visual.getAttribute('data-analysis-scope')).toBe('application-timeline');
    expect(visual.getAttribute('data-artifact-kind')).toBe('nsys-rep');
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(attributes(visual, '[data-profiler-symptom] option', 'value')).toEqual(PROFILER_DECISION_SYMPTOMS);
    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(visual.querySelectorAll('[data-static-decision-leaf]')).toHaveLength(6);
    expect(visual.querySelectorAll('[data-static-decision-leaf][data-recommended-tool="nsight-systems"]')).toHaveLength(4);
    expect(visual.querySelectorAll('[data-static-decision-leaf][data-recommended-tool="nsight-compute"]')).toHaveLength(2);
    expect(visual.querySelector('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-bottleneck]')).toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
  });

  it('keeps locale-independent decision data aligned', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/nsight-systems-versus-nsight-compute/'),
      readBuiltRoute('/en/visuals/nsight-systems-versus-nsight-compute/'),
    ]);
    for (const attribute of ['data-symptom-id', 'data-recommended-tool', 'data-analysis-scope', 'data-artifact-kind', 'data-decision-gate', 'data-next-gate']) {
      expect(attributes(zh, '[data-static-decision-leaf]', attribute)).toEqual(attributes(en, '[data-static-decision-leaf]', attribute));
    }
  });
});
