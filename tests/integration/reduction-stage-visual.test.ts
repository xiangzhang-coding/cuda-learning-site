// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { deriveReductionStageFrames } from '../../src/visuals/reduction-stage-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://reduction-stages.invalid').pathname;
  const html = await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function attributeValues(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

const staticSelectionIds = [
  'adjacent-pairs:5',
  'adjacent-pairs:6',
  'adjacent-pairs:8',
  'stride-halving:5',
  'stride-halving:6',
  'stride-halving:8',
];

const finalSums = { 5: '14', 6: '23', 8: '31' } as const;

describe('VIS10 reduction-stage Visual Explainer', () => {
  it('keeps the bilingual source pair and deterministic enhancement boundaries aligned', async () => {
    const [zh, en, model, component] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/reduction-stages.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/reduction-stages.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/reduction-stage-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/ReductionStageExplorer.astro'), 'utf8'),
    ]);

    expect(zh).toContain('counterpart: /en/visuals/reduction-stages/');
    expect(en).toContain('counterpart: /visuals/reduction-stages/');
    expect(zh).toMatch(/非活动通道[（(]inactive lanes?[）)]/i);
    expect(en).toMatch(/inactive lanes?/i);
    for (const source of [zh, en]) {
      expect(source).toContain('pairId: vis10');
      expect(source).toContain('unitId: VIS10');
      expect(source).toContain('resourceKind: visual-explainer');
      expect(source).toContain("hardwareGate: 'None: deterministic browser model; no CUDA-capable system required'");
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source).toContain('adjacent-pairs');
      expect(source).toContain('stride-halving');
      expect(source).toMatch(/no autoplay|没有 autoplay/i);
    }

    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame/);
  });

  it.each([
    {
      route: '/visuals/reduction-stages/',
      counterpart: '/en/visuals/reduction-stages/',
      locale: 'zh-CN',
    },
    {
      route: '/en/visuals/reduction-stages/',
      counterpart: '/visuals/reduction-stages/',
      locale: 'en',
    },
  ])('renders the complete evidence-neutral VIS10 route at $route', async ({ route, counterpart, locale }) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('[data-visual-id="VIS10"]');
    expect(document.querySelector('main h1')?.textContent?.trim().length).toBeGreaterThan(0);
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS10 custom element.');

    expect(['adjacent-pairs', 'stride-halving']).toContain(visual.getAttribute('data-variant'));
    expect(['5', '6', '8']).toContain(visual.getAttribute('data-element-count'));
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(visual.querySelector('[data-conceptual-only]')).not.toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(attributeValues(visual, 'select[data-reduction-variant] option', 'value')).toEqual([
      'adjacent-pairs',
      'stride-halving',
    ]);
    expect(attributeValues(visual, 'select[data-reduction-element-count] option', 'value')).toEqual(['5', '6', '8']);
    expect(visual.querySelectorAll('button[data-reduction-action]')).toHaveLength(2);
    expect(visual.querySelector('[data-reduction-action="play"], input[type="range"]')).toBeNull();

    expect(visual.querySelector('[data-static-fallback]')).not.toBeNull();
    expect(visual.querySelectorAll('[data-static-selection]')).toHaveLength(6);
    expect(visual.querySelectorAll('[data-static-stage]')).toHaveLength(24);
    expect(visual.querySelectorAll('[data-static-lane]')).toHaveLength(192);
    expect(attributeValues(visual, '[data-static-selection]', 'data-static-selection')).toEqual(staticSelectionIds);

    let inactiveLaneCount = 0;
    for (const selection of visual.querySelectorAll('[data-static-selection]')) {
      const variant = selection.getAttribute('data-variant') as 'adjacent-pairs' | 'stride-halving';
      const elementCount = selection.getAttribute('data-element-count') as '5' | '6' | '8';
      const stages = selection.querySelectorAll('[data-static-stage]');
      const derived = deriveReductionStageFrames(variant, Number(elementCount));
      expect(derived.accepted).toBe(true);
      if (!derived.accepted) throw new Error('Expected a reviewed static reduction selection.');
      expect(stages).toHaveLength(4);
      expect(derived.frames).toHaveLength(4);
      expect(selection.getAttribute('data-final-sum')).toBe(finalSums[elementCount]);
      expect(attributeValues(selection, '[data-static-stage]', 'data-step-index')).toEqual(['0', '1', '2', '3']);

      for (const [stepIndex, stage] of [...stages].entries()) {
        const frame = derived.frames[stepIndex];
        expect(stage.querySelectorAll('[data-static-lane]')).toHaveLength(8);
        expect(attributeValues(stage, '[data-static-lane]', 'data-lane-index')).toEqual(
          frame?.lanes.map(({ lane }) => String(lane)),
        );
        expect(attributeValues(stage, '[data-static-lane]', 'data-lane-state')).toEqual(
          frame?.lanes.map(({ state }) => state),
        );
        expect(attributeValues(stage, '[data-static-lane]', 'data-lane-value')).toEqual(
          frame?.lanes.map(({ value }) => String(value)),
        );
      }

      const finalActive = stages[3]?.querySelectorAll('[data-static-lane][data-lane-state="active"]');
      expect(finalActive).toHaveLength(1);
      expect(finalActive?.[0]?.getAttribute('data-lane-value')).toBe(finalSums[elementCount]);
    }

    for (const lane of visual.querySelectorAll('[data-static-lane][data-lane-state="inactive"]')) {
      inactiveLaneCount += 1;
      expect(lane.getAttribute('data-lane-value')).toBe('0');
      expect(lane.textContent).toMatch(locale === 'en' ? /inactive lane/i : /非活动通道/);
      expect(lane.textContent).toMatch(locale === 'en' ? /neutral(?: value)?\D*0/i : /中性值\D*0/);
    }
    expect(inactiveLaneCount).toBe(114);

    expect(visual.textContent).not.toMatch(
      /\b\d+(?:\.\d+)?(?:\s*(?:ns|us|µs|ms)\b|\s+(?:milliseconds?|seconds?)\b)/i,
    );
    expect(visual.querySelector('[data-measured], [data-observed-reduction], [data-timing], [data-throughput]')).toBeNull();
    expect(metadata(document, 'cuda:pair-id')).toBe('vis10');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS10');
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:hardware-gate')).toBe('None: deterministic browser model; no CUDA-capable system required');
    for (const field of ['compilation', 'runtime', 'expected-observations', 'recorded-observations']) {
      expect(metadata(document, `cuda:evidence-${field}`) ?? metadata(document, `cuda:${field}`)).toBe('none');
    }
  });

  it('keeps locale-independent variants, stages, lane states, neutral values, and sums aligned', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/reduction-stages/'),
      readBuiltRoute('/en/visuals/reduction-stages/'),
    ]);
    const selectors = [
      ['[data-static-selection]', 'data-static-selection'],
      ['[data-static-selection]', 'data-variant'],
      ['[data-static-selection]', 'data-element-count'],
      ['[data-static-selection]', 'data-final-sum'],
      ['[data-static-stage]', 'data-step-index'],
      ['[data-static-lane]', 'data-lane-index'],
      ['[data-static-lane]', 'data-lane-state'],
      ['[data-static-lane]', 'data-lane-value'],
    ] as const;
    for (const [selector, attribute] of selectors) {
      expect(attributeValues(zh, selector, attribute)).toEqual(attributeValues(en, selector, attribute));
    }

    const zhLabels = [...zh.querySelectorAll('[data-static-variant-label]')]
      .map((element) => element.textContent?.trim());
    const enLabels = [...en.querySelectorAll('[data-static-variant-label]')]
      .map((element) => element.textContent?.trim());
    expect(zhLabels).toHaveLength(6);
    expect(enLabels).toHaveLength(6);
    expect(zhLabels.every(Boolean)).toBe(true);
    expect(enLabels.every(Boolean)).toBe(true);
    expect(zhLabels).not.toEqual(enLabels);
  });
});
