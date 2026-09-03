// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  ATTENTION_IO_STAGES,
  deriveAttentionIoView,
  type AttentionIoSequenceShape,
  type AttentionIoTileShape,
} from '../../src/visuals/attention-io-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://attention-io.invalid').pathname;
  return parseHTML(await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function attributes(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

describe('VIS18 attention IO Visual Explainer', () => {
  it('keeps source pairs, pure model, progressive enhancement, static diagram, and media CSS aligned', async () => {
    const [zh, en, model, copy, component, css] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/attention-memory-traffic.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/attention-memory-traffic.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/attention-io-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/attention-io-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/AttentionIoExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/attention-io-visual.css'), 'utf8'),
    ]);

    expect(zh).toContain('counterpart: /en/visuals/attention-memory-traffic/');
    expect(en).toContain('counterpart: /visuals/attention-memory-traffic/');
    for (const page of [zh, en]) {
      expect(page).toContain('pairId: vis18');
      expect(page).toContain('unitId: VIS18');
      expect(page).toMatch(/prerequisites:\n  - A11/);
      expect(page).toMatch(/relatedUnits:\n  - A10/);
      expect(page).toContain("factCheckDate: '2026-09-03'");
      expect(page).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(page).toMatch(/static analysis|静态分析/i);
      expect(page).toMatch(/no autoplay|没有 autoplay/i);
      expect(page).toMatch(/purpose-built|专门设计/i);
    }
    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(copy).not.toMatch(/Date\.now|Math\.random|localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame|cloneNode|<template/);
    expect(component).toMatch(/data-visual-controls hidden/);
    expect(component).toMatch(/data-live-workbench[\s\S]*?hidden/);
    expect(component).toMatch(/parts\.controls\.hidden = false;[\s\S]*?parts\.workbench\.hidden = false/);
    expect(component).toContain('<svg');
    expect(component).toContain('data-static-diagram');
    for (const media of [
      '@media (max-width: 390px)',
      '@media (prefers-reduced-motion: no-preference)',
      '@media (prefers-reduced-motion: reduce)',
      '@media (forced-colors: active)',
      '@media print',
    ]) expect(css).toContain(media);
  });

  it.each([
    { route: '/visuals/attention-memory-traffic/', counterpart: '/en/visuals/attention-memory-traffic/', locale: 'zh-CN' },
    { route: '/en/visuals/attention-memory-traffic/', counterpart: '/visuals/attention-memory-traffic/', locale: 'en' },
  ])('renders a complete deterministic route at $route', async ({ route, counterpart, locale }) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('[data-visual-id="VIS18"]');
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS18 custom element.');

    expect(visual.getAttribute('data-locale')).toBe(locale);
    expect(visual.getAttribute('data-sequence-shape')).toBe('8x4');
    expect(visual.getAttribute('data-tile-shape')).toBe('4x4');
    expect(visual.getAttribute('data-attention-stage')).toBe('score');
    expect(visual.getAttribute('data-query-tile-count')).toBe('2');
    expect(visual.getAttribute('data-key-tile-count')).toBe('2');
    expect(visual.getAttribute('data-score-tile-count')).toBe('4');
    expect(visual.getAttribute('data-materialized-bytes')).toBe('2048');
    expect(visual.getAttribute('data-tiled-bytes')).toBe('768');
    expect(visual.getAttribute('data-analysis-difference-bytes')).toBe('1280');
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(attributes(visual, '[data-attention-sequence-shape] option', 'value')).toEqual(['8x4', '16x8']);
    expect(attributes(visual, '[data-attention-tile-shape] option', 'value')).toEqual(['4x4', '8x8']);
    expect(attributes(visual, '[data-attention-stage-select] option', 'value')).toEqual(ATTENTION_IO_STAGES);

    const fallback = visual.querySelector('[data-static-fallback]');
    expect(fallback).not.toBeNull();
    if (!fallback) throw new Error('Expected VIS18 static fallback.');
    const diagram = fallback.querySelector('svg[data-static-diagram]');
    expect(diagram?.getAttribute('viewBox')).toBe('0 0 760 360');
    expect(diagram?.getAttribute('aria-label')).toBeTruthy();
    expect(diagram?.querySelectorAll('[data-diagram-stage]')).toHaveLength(3);
    expect(diagram?.querySelectorAll('title')).toHaveLength(1);
    expect(diagram?.querySelectorAll('desc')).toHaveLength(1);
    expect(fallback.querySelectorAll('[data-static-ledger]')).toHaveLength(4);

    for (const row of fallback.querySelectorAll('[data-static-ledger]')) {
      const sequenceShape = row.getAttribute('data-sequence-shape') as AttentionIoSequenceShape;
      const tileShape = row.getAttribute('data-tile-shape') as AttentionIoTileShape;
      const result = deriveAttentionIoView({ sequenceShape, tileShape, stage: 'score' });
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('Expected reviewed static ledger.');
      expect(row.getAttribute('data-query-tile-count')).toBe(String(result.view.queryTileCount));
      expect(row.getAttribute('data-key-tile-count')).toBe(String(result.view.keyTileCount));
      expect(row.getAttribute('data-score-tile-count')).toBe(String(result.view.scoreTileCount));
      expect(row.getAttribute('data-materialized-bytes')).toBe(String(result.view.materialized.bytes));
      expect(row.getAttribute('data-tiled-bytes')).toBe(String(result.view.tiled.bytes));
      expect(row.getAttribute('data-analysis-difference-bytes')).toBe(String(result.view.analysisDifference.bytes));
    }

    expect(visual.querySelector('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-backend]')).toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
    expect(metadata(document, 'cuda:pair-id')).toBe('vis18');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS18');
    expect(metadata(document, 'cuda:prerequisites')).toBe('A11');
    expect(metadata(document, 'cuda:related-units')).toBe('A10');
    for (const name of [
      'cuda:evidence-compilation',
      'cuda:evidence-runtime',
      'cuda:expected-observations',
      'cuda:recorded-observations',
    ]) expect(metadata(document, name)).toBe('none');
  });

  it('keeps locale-independent diagram and ledger data aligned', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/attention-memory-traffic/'),
      readBuiltRoute('/en/visuals/attention-memory-traffic/'),
    ]);
    for (const [selector, attribute] of [
      ['[data-diagram-stage]', 'data-diagram-stage'],
      ['[data-static-ledger]', 'data-sequence-shape'],
      ['[data-static-ledger]', 'data-tile-shape'],
      ['[data-static-ledger]', 'data-query-tile-count'],
      ['[data-static-ledger]', 'data-key-tile-count'],
      ['[data-static-ledger]', 'data-score-tile-count'],
      ['[data-static-ledger]', 'data-materialized-bytes'],
      ['[data-static-ledger]', 'data-tiled-bytes'],
      ['[data-static-ledger]', 'data-analysis-difference-bytes'],
    ] as const) expect(attributes(zh, selector, attribute)).toEqual(attributes(en, selector, attribute));
  });
});
