// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  deriveTransposeTileView,
  type TransposeTileLayout,
  type TransposeTilePadding,
  type TransposeTileSize,
  type TransposeTileState,
} from '../../src/visuals/transpose-tile-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://tiled-transpose.invalid').pathname;
  const html = await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function attributeValues(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

function requireView(state: TransposeTileState) {
  const result = deriveTransposeTileView(state);
  expect(result.accepted).toBe(true);
  if (!result.accepted) throw new Error('Expected a reviewed transpose-tile state.');
  return result.view;
}

const staticSelectionIds = ['4:0', '4:1', '8:0', '8:1'];

describe('VIS11 tiled-transpose Visual Explainer', () => {
  it('keeps the source pair, deterministic model, enhancement boundary, and dedicated media CSS aligned', async () => {
    const [zh, en, model, copy, component, css] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/tiled-transpose.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/tiled-transpose.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/transpose-tile-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/transpose-tile-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/TransposeTileExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/transpose-tile-visual.css'), 'utf8'),
    ]);

    expect(zh).toContain('counterpart: /en/visuals/tiled-transpose/');
    expect(en).toContain('counterpart: /visuals/tiled-transpose/');
    expect(zh).toMatch(/逻辑映射|logical layout/i);
    expect(en).toMatch(/logical mapping/i);
    for (const source of [zh, en]) {
      expect(source).toContain('pairId: vis11');
      expect(source).toContain('unitId: VIS11');
      expect(source).toMatch(/prerequisites:\n  - A05/);
      expect(source).toMatch(/relatedUnits:\n  - EX14/);
      expect(source).toContain('resourceKind: visual-explainer');
      expect(source).toContain("factCheckDate: '2026-08-30'");
      expect(source).toContain("hardwareGate: 'None: deterministic browser model; no CUDA-capable system required'");
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source).toContain('13.3,12.9.1,11.8.0');
      expect(source).toContain('writing-cuda-kernels.html#coalesced-global-memory-access');
      expect(source).toContain('writing-cuda-kernels.html#shared-memory-access-patterns');
      expect(source).toContain('writing-cuda-kernels.html#matrix-transpose-example-using-shared-memory');
      expect(source).toContain('archive/12.9.1/cuda-c-programming-guide');
      expect(source).toContain('archive/11.8.0/cuda-c-programming-guide');
      expect(source).toMatch(/no autoplay|没有 autoplay/i);
      expect(source).toMatch(/no (?:NVIDIA )?code|没有复制 NVIDIA code/i);
      expect(source).toMatch(/no execution or speed evidence|不是 CUDA execution、correctness 或 speed evidence/i);
    }

    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(copy).not.toMatch(/Date\.now|Math\.random|localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame|cloneNode|<template/);
    expect(component).toMatch(/data-visual-controls hidden/);
    expect(component).toMatch(/data-live-workbench[\s\S]*?hidden/);
    expect(component).toMatch(/if \(!initialView\) return;[\s\S]*?parts\.controls\.hidden = false;[\s\S]*?parts\.workbench\.hidden = false/);
    expect(css).toContain('@media (max-width: 390px)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('@media (forced-colors: active)');
    expect(css).toContain('@media print');
    expect(css).toMatch(/@media print[\s\S]*?\.transpose-tile-controls,[\s\S]*?\.transpose-live-workbench[\s\S]*?display: none !important/);
  });

  it.each([
    {
      route: '/visuals/tiled-transpose/',
      counterpart: '/en/visuals/tiled-transpose/',
      locale: 'zh-CN',
    },
    {
      route: '/en/visuals/tiled-transpose/',
      counterpart: '/visuals/tiled-transpose/',
      locale: 'en',
    },
  ])('renders the complete evidence-neutral VIS11 route at $route', async ({ route, counterpart, locale }) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('[data-visual-id="VIS11"]');
    expect(document.querySelector('main h1')?.textContent?.trim().length).toBeGreaterThan(0);
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS11 custom element.');

    expect(visual.getAttribute('data-locale')).toBe(locale);
    expect(visual.getAttribute('data-tile-size')).toBe('4');
    expect(visual.getAttribute('data-layout')).toBe('input-row-major');
    expect(visual.getAttribute('data-padding')).toBe('0');
    expect(visual.getAttribute('data-shared-row-stride')).toBe('4');
    expect(visual.getAttribute('data-logical-cell-count')).toBe('16');
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(visual.querySelector('[data-conceptual-only]')).not.toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(
      locale === 'en' ? /no execution or speed evidence/i : /不提供执行或速度证据/,
    );

    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(attributeValues(visual, 'select[data-transpose-tile-size] option', 'value')).toEqual(['4', '8']);
    expect(attributeValues(visual, 'select[data-transpose-layout] option', 'value')).toEqual([
      'input-row-major',
      'output-row-major',
    ]);
    expect(attributeValues(visual, 'select[data-transpose-padding] option', 'value')).toEqual(['0', '1']);
    expect(visual.querySelectorAll('button[data-transpose-action="reset"]')).toHaveLength(1);
    expect(visual.querySelector('[data-transpose-action="play"], input[type="range"]')).toBeNull();

    const fallback = visual.querySelector('[data-static-fallback]');
    expect(fallback).not.toBeNull();
    if (!fallback) throw new Error('Expected the VIS11 static fallback.');
    expect(fallback.querySelector('[data-live-logical-cell], [data-live-physical-slot]')).toBeNull();
    expect(visual.querySelector('[data-live-workbench] [data-static-input-cell]')).toBeNull();
    expect(fallback.querySelectorAll('[data-static-selection]')).toHaveLength(4);
    expect(fallback.querySelectorAll('[data-static-input-cell]')).toHaveLength(160);
    expect(fallback.querySelectorAll('[data-static-output-cell]')).toHaveLength(160);
    expect(fallback.querySelectorAll('[data-static-physical-layout]')).toHaveLength(8);
    expect(fallback.querySelectorAll('[data-static-physical-row]')).toHaveLength(48);
    expect(fallback.querySelectorAll('[data-static-physical-slot]')).toHaveLength(344);
    expect(fallback.querySelectorAll('[data-static-physical-slot][data-slot-kind="padding"]')).toHaveLength(24);
    expect(attributeValues(fallback, '[data-static-selection]', 'data-static-selection')).toEqual(staticSelectionIds);

    for (const selection of fallback.querySelectorAll('[data-static-selection]')) {
      const tileSize = Number(selection.getAttribute('data-tile-size')) as TransposeTileSize;
      const padding = Number(selection.getAttribute('data-padding')) as TransposeTilePadding;
      const inputView = requireView({ tileSize, layout: 'input-row-major', padding });
      expect(selection.getAttribute('data-shared-row-stride')).toBe(String(tileSize + padding));
      expect(attributeValues(selection, '[data-static-input-cell]', 'data-input-index')).toEqual(
        inputView.inputRowMajor.map(({ inputIndex }) => String(inputIndex)),
      );
      expect(attributeValues(selection, '[data-static-input-cell]', 'data-output-index')).toEqual(
        inputView.inputRowMajor.map(({ outputIndex }) => String(outputIndex)),
      );
      expect(attributeValues(selection, '[data-static-output-cell]', 'data-output-index')).toEqual(
        inputView.outputRowMajor.map(({ outputIndex }) => String(outputIndex)),
      );
      expect(attributeValues(selection, '[data-static-output-cell]', 'data-input-index')).toEqual(
        inputView.outputRowMajor.map(({ inputIndex }) => String(inputIndex)),
      );

      for (const physical of selection.querySelectorAll('[data-static-physical-layout]')) {
        const layout = physical.getAttribute('data-layout') as TransposeTileLayout;
        const view = requireView({ tileSize, layout, padding });
        const expectedSlots = view.physicalRows.flatMap(({ slots }) => slots);
        expect(physical.getAttribute('data-shared-row-stride')).toBe(String(view.sharedRowStride));
        expect(physical.querySelectorAll('[data-static-physical-row]')).toHaveLength(tileSize);
        expect(attributeValues(physical, '[data-static-physical-slot]', 'data-slot-kind')).toEqual(
          expectedSlots.map(({ kind }) => kind),
        );
        expect(attributeValues(physical, '[data-static-physical-slot]', 'data-physical-row')).toEqual(
          expectedSlots.map(({ row }) => String(row)),
        );
        expect(attributeValues(physical, '[data-static-physical-slot]', 'data-physical-col')).toEqual(
          expectedSlots.map(({ col }) => String(col)),
        );
        expect(attributeValues(physical, '[data-static-physical-slot]', 'data-physical-slot-index')).toEqual(
          expectedSlots.map(({ slotIndex }) => String(slotIndex)),
        );
        expect(attributeValues(physical, '[data-static-physical-slot][data-slot-kind="data"]', 'data-input-row')).toEqual(
          expectedSlots.flatMap((slot) => slot.kind === 'data' ? [String(slot.cell.inputRow)] : []),
        );
        expect(attributeValues(physical, '[data-static-physical-slot][data-slot-kind="data"]', 'data-output-col')).toEqual(
          expectedSlots.flatMap((slot) => slot.kind === 'data' ? [String(slot.cell.outputCol)] : []),
        );
      }

      if (padding === 0) {
        expect(selection.querySelector('[data-slot-kind="padding"]')).toBeNull();
        expect(selection.textContent).toMatch(locale === 'en' ? /padding slots: none/i : /padding 槽：无/i);
      }
    }

    for (const cell of fallback.querySelectorAll('[data-static-input-cell]')) {
      const input = `(${cell.getAttribute('data-input-row')},${cell.getAttribute('data-input-col')})`;
      const output = `(${cell.getAttribute('data-output-row')},${cell.getAttribute('data-output-col')})`;
      expect(cell.textContent).toContain(input);
      expect(cell.textContent).toContain(output);
    }
    for (const cell of fallback.querySelectorAll('[data-static-output-cell]')) {
      const input = `(${cell.getAttribute('data-input-row')},${cell.getAttribute('data-input-col')})`;
      const output = `(${cell.getAttribute('data-output-row')},${cell.getAttribute('data-output-col')})`;
      expect(cell.textContent).toContain(input);
      expect(cell.textContent).toContain(output);
    }
    for (const slot of fallback.querySelectorAll('[data-static-physical-slot][data-slot-kind="padding"]')) {
      expect(slot.textContent).toMatch(/padding/i);
      expect(slot.textContent).toMatch(locale === 'en' ? /no logical value/i : /无逻辑值/);
      expect(slot.textContent).toContain(String(slot.getAttribute('data-physical-slot-index')));
      expect(slot.textContent).toContain(String(slot.getAttribute('data-physical-row')));
      expect(slot.textContent).toContain(String(slot.getAttribute('data-physical-col')));
      expect(slot.hasAttribute('data-input-row')).toBe(false);
      expect(slot.hasAttribute('data-output-row')).toBe(false);
    }

    expect(visual.textContent).not.toMatch(
      /\b\d+(?:\.\d+)?(?:\s*(?:ns|us|µs|ms)\b|\s+(?:milliseconds?|seconds?)\b)/i,
    );
    expect(visual.querySelector('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-observed-bank-conflict]')).toBeNull();
    expect(metadata(document, 'cuda:pair-id')).toBe('vis11');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS11');
    expect(metadata(document, 'cuda:prerequisites')).toBe('A05');
    expect(metadata(document, 'cuda:related-units')).toBe('EX14');
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:hardware-gate')).toBe('None: deterministic browser model; no CUDA-capable system required');
    for (const field of ['compilation', 'runtime', 'expected-observations', 'recorded-observations']) {
      expect(metadata(document, `cuda:evidence-${field}`) ?? metadata(document, `cuda:${field}`)).toBe('none');
    }
  });

  it('keeps every locale-independent static coordinate, index, layout, stride, and slot aligned', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/tiled-transpose/'),
      readBuiltRoute('/en/visuals/tiled-transpose/'),
    ]);
    const selectors = [
      ['[data-static-selection]', 'data-static-selection'],
      ['[data-static-selection]', 'data-tile-size'],
      ['[data-static-selection]', 'data-padding'],
      ['[data-static-selection]', 'data-shared-row-stride'],
      ['[data-static-input-cell]', 'data-input-row'],
      ['[data-static-input-cell]', 'data-input-col'],
      ['[data-static-input-cell]', 'data-output-row'],
      ['[data-static-input-cell]', 'data-output-col'],
      ['[data-static-input-cell]', 'data-input-index'],
      ['[data-static-input-cell]', 'data-output-index'],
      ['[data-static-output-cell]', 'data-input-index'],
      ['[data-static-output-cell]', 'data-output-index'],
      ['[data-static-physical-layout]', 'data-layout'],
      ['[data-static-physical-layout]', 'data-shared-row-stride'],
      ['[data-static-physical-row]', 'data-physical-row'],
      ['[data-static-physical-slot]', 'data-slot-kind'],
      ['[data-static-physical-slot]', 'data-physical-row'],
      ['[data-static-physical-slot]', 'data-physical-col'],
      ['[data-static-physical-slot]', 'data-physical-slot-index'],
      ['[data-static-physical-slot]', 'data-input-row'],
      ['[data-static-physical-slot]', 'data-input-col'],
      ['[data-static-physical-slot]', 'data-output-row'],
      ['[data-static-physical-slot]', 'data-output-col'],
    ] as const;
    for (const [selector, attribute] of selectors) {
      expect(attributeValues(zh, selector, attribute)).toEqual(attributeValues(en, selector, attribute));
    }

    const zhText = [...zh.querySelectorAll('[data-static-physical-slot][data-slot-kind="padding"]')]
      .map((element) => element.textContent?.trim());
    const enText = [...en.querySelectorAll('[data-static-physical-slot][data-slot-kind="padding"]')]
      .map((element) => element.textContent?.trim());
    expect(zhText).toHaveLength(24);
    expect(enText).toHaveLength(24);
    expect(zhText.every(Boolean)).toBe(true);
    expect(enText.every(Boolean)).toBe(true);
    expect(zhText).not.toEqual(enText);
  });
});
