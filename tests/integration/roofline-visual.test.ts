// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  ROOFLINE_DEFAULT_INPUTS,
  ROOFLINE_INPUT_KEYS,
  createRooflineState,
  deriveRooflineView,
} from '../../src/visuals/roofline-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://roofline.invalid').pathname;
  return parseHTML(await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8')).document;
}

function attributes(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

function lineCoordinates(root: ParentNode, selector: string) {
  const line = root.querySelector(selector);
  if (!line) throw new Error(`Expected line ${selector}.`);
  return ['x1', 'y1', 'x2', 'y2'].map((attribute) => line.getAttribute(attribute));
}

describe('VIS13 Roofline Visual Explainer', () => {
  it('keeps source pairs, model purity, progressive enhancement, and media CSS aligned', async () => {
    const [zh, en, model, copy, component, css] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/roofline.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/roofline.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/roofline-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/roofline-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/RooflineExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/roofline-visual.css'), 'utf8'),
    ]);

    expect(zh).toContain('counterpart: /en/visuals/roofline/');
    expect(en).toContain('counterpart: /visuals/roofline/');
    for (const page of [zh, en]) {
      expect(page).toContain('pairId: vis13');
      expect(page).toContain('unitId: VIS13');
      expect(page).toMatch(/prerequisites:\n  - Q10\nrelatedUnits:\n  - Q09\n  - A14\n  - LAB09/);
      expect(page).toContain("factCheckDate: '2026-09-01'");
      expect(page).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(page).toContain('https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#bandwidth');
      expect(page).toContain('https://docs.nvidia.com/nsight-compute/NsightCompute/index.html#rooflines');
      expect(page).toContain('https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html#roofline-charts');
      expect(page).toContain('https://doi.org/10.1145/1498765.1498785');
      expect(page).toContain('/websites/nvidia_cuda');
      expect(page).toContain('/websites/nvidia_nsight-compute_nsightcompute');
      expect(page).toMatch(/original model only|只支持 performance model/i);
    }
    expect(zh).toContain('屋脊点（ridge point）');
    expect(copy).toContain('屋脊点（ridge point）');

    for (const source of [model, copy]) expect(source).toMatch(/^\/\/ SPDX-License-Identifier: Apache-2\.0/);
    expect(component).toMatch(/^---\n\/\/ SPDX-License-Identifier: Apache-2\.0/);
    expect(css).toMatch(/^\/\* SPDX-License-Identifier: Apache-2\.0 \*\//);
    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\.|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
    expect(copy).not.toMatch(/Date\.now|Math\.random|localStorage|sessionStorage|indexedDB/);
    expect(component).not.toMatch(/<form\b|localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame|<canvas\b|\bd3\b|chart\.js/i);
    expect(component).not.toMatch(/\sid\s*=/i);
    expect(component).toMatch(/data-visual-controls data-pagefind-ignore hidden/);
    expect(component).toMatch(/data-live-workbench[\s\S]*?hidden/);
    expect(component).toMatch(/const initialView = this\.render\(parts, false\);[\s\S]*?parts\.controls\.hidden = false;[\s\S]*?parts\.workbench\.hidden = false;[\s\S]*?this\.dataset\.ready = 'true'/);
    expect(component).toContain("for (const attribute of ['x1', 'y1', 'x2', 'y2']) line?.removeAttribute(attribute);");
    expect(component).toContain("this.querySelector('[data-live-ridge-marker]')?.removeAttribute('points');");
    for (const marker of ['data-measured', 'data-observed', 'data-bottleneck', 'data-profiler-report', 'data-runtime-evidence']) {
      expect(component).not.toContain(marker);
    }
    for (const media of [
      '@media (max-width: 390px)',
      '@media (prefers-reduced-motion: no-preference)',
      '@media (prefers-reduced-motion: reduce)',
      '@media (prefers-contrast: more)',
      '@media (forced-colors: active)',
      '@media print',
    ]) expect(css).toContain(media);
  });

  it.each([
    ['/visuals/roofline/', '/en/visuals/roofline/', 'zh-CN'],
    ['/en/visuals/roofline/', '/visuals/roofline/', 'en'],
  ] as const)('renders the complete deterministic fallback at %s', async (route, counterpart, locale) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('[data-visual-id="VIS13"]');
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS13 custom element.');

    expect(visual.getAttribute('data-locale')).toBe(locale);
    expect(visual.getAttribute('data-state')).toBe('valid');
    expect(visual.getAttribute('data-declared-compute-ceiling')).toBe('12000');
    expect(visual.getAttribute('data-declared-bandwidth-ceiling')).toBe('800');
    expect(visual.getAttribute('data-arithmetic-intensity')).toBe('8');
    expect(visual.getAttribute('data-achieved-rate')).toBe('5600');
    expect(visual.getAttribute('data-ridge-intensity')).toBe('15');
    expect(visual.getAttribute('data-workload-roof')).toBe('6400');
    expect(visual.getAttribute('data-model-region')).toBe('bandwidth-side');
    expect(visual.getAttribute('data-point-relation')).toBe('below-roof');
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();

    const inputs = [...visual.querySelectorAll<HTMLInputElement>('input[data-roofline-input]')];
    expect(inputs).toHaveLength(4);
    expect(inputs.map((input) => input.getAttribute('data-roofline-input'))).toEqual(ROOFLINE_INPUT_KEYS);
    expect(inputs.map((input) => input.getAttribute('value'))).toEqual(ROOFLINE_INPUT_KEYS.map((key) => ROOFLINE_DEFAULT_INPUTS[key]));
    expect(inputs.every((input) => input.type === 'number' && input.getAttribute('step') === 'any')).toBe(true);
    expect(inputs.every((input) => input.getAttribute('aria-invalid') === 'false')).toBe(true);
    expect(visual.querySelectorAll('button[type="button"]')).toHaveLength(2);
    expect(visual.querySelector('form')).toBeNull();
    expect(visual.querySelector('[id]')).toBeNull();

    const svg = visual.querySelector('[data-static-svg]');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 720 420');
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')?.length).toBeGreaterThan(50);
    expect(svg?.querySelectorAll('.roofline-direct-labels text').length).toBeGreaterThanOrEqual(8);
    expect(svg?.querySelector('[data-static-roof-bandwidth]')).not.toBeNull();
    expect(svg?.querySelector('[data-static-roof-compute]')).not.toBeNull();
    expect(svg?.querySelector('[data-static-ridge-marker]')).not.toBeNull();
    expect(svg?.querySelector('[data-static-workload-point]')).not.toBeNull();

    const table = visual.querySelector('[data-static-table]');
    expect(table).not.toBeNull();
    expect(table?.querySelector('caption')?.textContent.trim().length).toBeGreaterThanOrEqual(10);
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(8);
    expect(attributes(table!, '[data-static-kind="declared-input"]', 'data-static-value')).toEqual(['12000', '800', '8', '5600']);
    expect(attributes(table!, '[data-static-kind="derived-model-value"]', 'data-static-value')).toEqual(['15', '6400', 'bandwidth-side', 'below-roof']);
    expect(visual.querySelector('[data-measured], [data-observed], [data-bottleneck], [data-profiler-report], [data-runtime-evidence], [data-evidence]')).toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/LAB09/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Evidence Status/);

    const text = svg?.textContent ?? '';
    if (locale === 'en') {
      expect(text).toContain('Bandwidth-side model region');
      expect(text).toContain('Compute-side model region');
      expect(text).toContain('Declared workload point');
    } else {
      expect(text).toContain('带宽侧模型区域');
      expect(text).toContain('计算侧模型区域');
      expect(text).toContain('声明 workload 点');
    }
  });

  it('keeps built SVG geometry and numeric attributes locale-neutral and model-derived', async () => {
    const expected = deriveRooflineView(createRooflineState());
    expect(expected.accepted).toBe(true);
    if (!expected.accepted) throw new Error('Expected the default model view.');
    const geometry = expected.view.geometry;
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/roofline/'),
      readBuiltRoute('/en/visuals/roofline/'),
    ]);

    const expectedBandwidth = [
      geometry.roof.bandwidthSegment.start.x,
      geometry.roof.bandwidthSegment.start.y,
      geometry.roof.bandwidthSegment.end.x,
      geometry.roof.bandwidthSegment.end.y,
    ].map(String);
    const expectedCompute = [
      geometry.roof.computeSegment.start.x,
      geometry.roof.computeSegment.start.y,
      geometry.roof.computeSegment.end.x,
      geometry.roof.computeSegment.end.y,
    ].map(String);
    const expectedPoint = [geometry.workloadPoint.x, geometry.workloadPoint.y, geometry.workloadPoint.radius].map(String);
    const expectedMarker = geometry.roof.ridgeMarker.map(({ x, y }) => `${x},${y}`).join(' ');

    for (const document of [zh, en]) {
      const svg = document.querySelector('[data-visual-id="VIS13"] [data-static-svg]');
      expect(svg).not.toBeNull();
      if (!svg) throw new Error('Expected a static Roofline SVG.');
      expect(lineCoordinates(svg, '[data-static-roof-bandwidth]')).toEqual(expectedBandwidth);
      expect(lineCoordinates(svg, '[data-static-roof-compute]')).toEqual(expectedCompute);
      const point = svg.querySelector('[data-static-workload-point]');
      expect(['cx', 'cy', 'r'].map((attribute) => point?.getAttribute(attribute))).toEqual(expectedPoint);
      expect(svg.querySelector('[data-static-ridge-marker]')?.getAttribute('points')).toBe(expectedMarker);
      expect(attributes(svg, '.roofline-grid line', 'x1').every((value) => value !== null && Number.isFinite(Number(value)))).toBe(true);
      expect(attributes(svg, '.roofline-grid line', 'y1').every((value) => value !== null && Number.isFinite(Number(value)))).toBe(true);
    }

    for (const selector of [
      '[data-static-svg]',
      '[data-static-roof-bandwidth]',
      '[data-static-roof-compute]',
      '[data-static-ridge-marker]',
      '[data-static-workload-point]',
    ]) {
      for (const attribute of ['viewBox', 'x1', 'y1', 'x2', 'y2', 'points', 'cx', 'cy', 'r', 'data-ridge-intensity', 'data-workload-roof']) {
        expect(attributes(zh, selector, attribute)).toEqual(attributes(en, selector, attribute));
      }
    }
  });
});
