// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  GEMM_HIERARCHY_LEVELS,
  deriveGemmHierarchyView,
  type GemmHierarchyLevel,
  type GemmHierarchyMatrixShape,
  type GemmHierarchyTileShape,
} from '../../src/visuals/gemm-hierarchy-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://gemm-hierarchy.invalid').pathname;
  return parseHTML(await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function attributes(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

describe('VIS12 GEMM hierarchy Visual Explainer', () => {
  it('keeps source pairs, pure model, progressive enhancement, and media CSS aligned', async () => {
    const [zh, en, model, copy, component, css] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/gemm-tiling-hierarchy.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/gemm-tiling-hierarchy.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/gemm-hierarchy-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/gemm-hierarchy-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/GemmHierarchyExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/gemm-hierarchy-visual.css'), 'utf8'),
    ]);

    expect(zh).toContain('counterpart: /en/visuals/gemm-tiling-hierarchy/');
    expect(en).toContain('counterpart: /visuals/gemm-tiling-hierarchy/');
    for (const page of [zh, en]) {
      expect(page).toContain('pairId: vis12');
      expect(page).toContain('unitId: VIS12');
      expect(page).toMatch(/prerequisites:\n  - A08/);
      expect(page).toMatch(/relatedUnits:\n  - EX15/);
      expect(page).toContain("factCheckDate: '2026-08-31'");
      expect(page).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(page).toMatch(/no autoplay|没有 autoplay/i);
      expect(page).toMatch(/20 panels|20 panels|20 个.*panels/i);
    }
    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(copy).not.toMatch(/Date\.now|Math\.random|localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame|cloneNode|<template/);
    expect(component).toMatch(/data-visual-controls hidden/);
    expect(component).toMatch(/data-live-workbench[\s\S]*?hidden/);
    expect(component).toMatch(/parts\.controls\.hidden = false;[\s\S]*?parts\.workbench\.hidden = false/);
    for (const media of [
      '@media (max-width: 390px)',
      '@media (prefers-reduced-motion: no-preference)',
      '@media (prefers-reduced-motion: reduce)',
      '@media (forced-colors: active)',
      '@media print',
    ]) expect(css).toContain(media);
  });

  it.each([
    { route: '/visuals/gemm-tiling-hierarchy/', counterpart: '/en/visuals/gemm-tiling-hierarchy/', locale: 'zh-CN' },
    { route: '/en/visuals/gemm-tiling-hierarchy/', counterpart: '/visuals/gemm-tiling-hierarchy/', locale: 'en' },
  ])('renders a complete deterministic route at $route', async ({ route, counterpart, locale }) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('[data-visual-id="VIS12"]');
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS12 custom element.');

    expect(visual.getAttribute('data-locale')).toBe(locale);
    expect(visual.getAttribute('data-matrix-shape')).toBe('128x128x32');
    expect(visual.getAttribute('data-tile-shape')).toBe('64x64x16');
    expect(visual.getAttribute('data-hierarchy-level')).toBe('matrix');
    expect(visual.getAttribute('data-output-tile-count')).toBe('4');
    expect(visual.getAttribute('data-k-slice-count')).toBe('2');
    expect(visual.getAttribute('data-threadblock-count')).toBe('4');
    expect(visual.getAttribute('data-warps-per-threadblock')).toBe('4');
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(attributes(visual, '[data-gemm-matrix-shape] option', 'value')).toEqual(['128x128x32', '256x128x64']);
    expect(attributes(visual, '[data-gemm-tile-shape] option', 'value')).toEqual(['64x64x16', '128x64x16']);
    expect(attributes(visual, '[data-gemm-hierarchy-level] option', 'value')).toEqual(GEMM_HIERARCHY_LEVELS);

    const fallback = visual.querySelector('[data-static-fallback]');
    expect(fallback).not.toBeNull();
    if (!fallback) throw new Error('Expected VIS12 static fallback.');
    expect(fallback.querySelectorAll('[data-static-selection]')).toHaveLength(4);
    expect(fallback.querySelectorAll('[data-static-hierarchy-panel]')).toHaveLength(20);
    expect(fallback.querySelector('[data-live-hierarchy-panel]')).toBeNull();

    for (const selection of fallback.querySelectorAll('[data-static-selection]')) {
      const matrixShape = selection.getAttribute('data-matrix-shape') as GemmHierarchyMatrixShape;
      const tileShape = selection.getAttribute('data-tile-shape') as GemmHierarchyTileShape;
      const result = deriveGemmHierarchyView({ matrixShape, tileShape, level: 'matrix' });
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('Expected reviewed static selection.');
      expect(selection.getAttribute('data-output-tile-count')).toBe(String(result.view.threadblockCount));
      expect(selection.getAttribute('data-k-slice-count')).toBe(String(result.view.kSliceCount));
      const panels = [...selection.querySelectorAll('[data-static-hierarchy-panel]')];
      expect(panels.map((panel) => panel.getAttribute('data-hierarchy-level'))).toEqual(GEMM_HIERARCHY_LEVELS);
      for (const [index, panel] of panels.entries()) {
        const expected = result.view.panels[index];
        expect(panel.getAttribute('data-shape-m')).toBe(String(expected?.shape.m));
        expect(panel.getAttribute('data-shape-n')).toBe(String(expected?.shape.n));
        expect(panel.getAttribute('data-shape-k')).toBe(String(expected?.shape.k));
        expect(panel.textContent?.trim().length).toBeGreaterThan(80);
      }
    }

    const instructionText = fallback.querySelector('[data-hierarchy-level="instruction"]')?.textContent ?? '';
    expect(instructionText).toMatch(locale === 'en' ? /unknown/i : /unknown/i);
    expect(visual.querySelector('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-emitted-instruction]')).toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
    expect(metadata(document, 'cuda:pair-id')).toBe('vis12');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS12');
    expect(metadata(document, 'cuda:prerequisites')).toBe('A08');
    expect(metadata(document, 'cuda:related-units')).toBe('EX15');
    for (const name of [
      'cuda:evidence-compilation',
      'cuda:evidence-runtime',
      'cuda:expected-observations',
      'cuda:recorded-observations',
    ]) expect(metadata(document, name)).toBe('none');
  });

  it('keeps all locale-independent hierarchy data aligned', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/gemm-tiling-hierarchy/'),
      readBuiltRoute('/en/visuals/gemm-tiling-hierarchy/'),
    ]);
    for (const [selector, attribute] of [
      ['[data-static-selection]', 'data-static-selection'],
      ['[data-static-selection]', 'data-matrix-shape'],
      ['[data-static-selection]', 'data-tile-shape'],
      ['[data-static-selection]', 'data-output-tile-count'],
      ['[data-static-selection]', 'data-k-slice-count'],
      ['[data-static-hierarchy-panel]', 'data-hierarchy-level'],
      ['[data-static-hierarchy-panel]', 'data-shape-m'],
      ['[data-static-hierarchy-panel]', 'data-shape-n'],
      ['[data-static-hierarchy-panel]', 'data-shape-k'],
    ] as const) {
      expect(attributes(zh, selector, attribute)).toEqual(attributes(en, selector, attribute));
    }
    expect(attributes(zh, '[data-static-hierarchy-panel]', 'data-hierarchy-level'))
      .toEqual(Array.from({ length: 4 }, () => GEMM_HIERARCHY_LEVELS).flat() as GemmHierarchyLevel[]);
  });
});
