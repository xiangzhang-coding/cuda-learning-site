// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import {
  API_BOUNDARY_MODEL_CONTRACT,
  API_BOUNDARY_STAGES,
} from '../../src/visuals/api-boundary-model';
import {
  BLOCK_SHAPE_CAPABILITIES,
  BLOCK_SHAPE_KERNEL_RESOURCE_CHECKS,
  BLOCK_SHAPE_STATIC_CASES,
  assessBlockShape,
} from '../../src/visuals/block-shape-model';
import {
  CAPABILITY_RECORDS,
  CAPABILITY_SOURCE_FACT_IDS,
  resolveCapabilityContract,
} from '../../src/visuals/capability-filter-model';
import {
  ERROR_TIMELINE_SCENARIOS,
  ERROR_TIMELINE_STAGES,
} from '../../src/visuals/error-timeline-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const relativePath = `${route.slice(1)}index.html`;
  return parseHTML(await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

const components = [
  {
    unitId: 'F05',
    visualId: 'VIS19',
    slug: 'asynchronous-errors',
    tag: 'cuda-error-timeline',
    file: 'ErrorTimeline.astro',
    controls: '[data-timeline-controls]',
    staticCount: 2,
    staticSelector: '[data-static-fallback] [data-scenario]',
  },
  {
    unitId: 'F06',
    visualId: 'VIS20',
    slug: 'compute-capability',
    tag: 'cuda-capability-filter',
    file: 'CapabilityFilter.astro',
    controls: '[data-capability-controls]',
    staticCount: 5,
    staticSelector: '[data-static-fallback] tbody tr',
  },
  {
    unitId: 'F07',
    visualId: 'VIS21',
    slug: 'runtime-driver-api',
    tag: 'cuda-api-boundary',
    file: 'ApiBoundary.astro',
    controls: '[data-api-boundary-controls]',
    staticCount: 6,
    staticSelector: '[data-static-fallback] tbody tr',
  },
  {
    unitId: 'F08',
    visualId: 'VIS22',
    slug: 'launch-geometry',
    tag: 'cuda-block-shape-explorer',
    file: 'BlockShapeExplorer.astro',
    controls: '[data-block-shape-controls]',
    staticCount: 3,
    staticSelector: '[data-static-fallback] article',
  },
] as const;

describe('foundation embedded interactive models', () => {
  it('keeps deterministic model outputs bounded and evidence-neutral', () => {
    expect(ERROR_TIMELINE_STAGES.map(({ id }) => id)).toEqual([
      'launch-submission',
      'immediate-check',
      'device-execution',
      'synchronization',
      'host-visible-result',
    ]);
    expect(ERROR_TIMELINE_SCENARIOS.map(({ id, events }) => ({
      id,
      dispositions: events.map(({ disposition }) => disposition),
    }))).toEqual([
      {
        id: 'launch-configuration',
        dispositions: ['rejected', 'error-observed', 'not-reached', 'not-first-observation', 'launch-failed'],
      },
      {
        id: 'deferred-execution',
        dispositions: ['accepted', 'no-new-error-observed', 'failure-occurs', 'boundary-observes-error', 'execution-failed'],
      },
    ]);

    expect(CAPABILITY_SOURCE_FACT_IDS).toEqual(['SRC-CUDA-016']);
    expect(CAPABILITY_RECORDS.map(({ id }) => id)).toEqual(['7.5', '8.0', '9.0', '10.0', '12.0']);
    expect(resolveCapabilityContract('12.0')).toMatchObject({
      state: 'known',
      capability: '12.0',
      evidenceStatusEffect: 'none',
      inferenceBoundaries: {
        productModel: 'not-inferred',
        environmentCompatibility: 'not-assessed',
        performance: 'not-assessed',
      },
    });
    expect(resolveCapabilityContract('11.0')).toMatchObject({
      state: 'unknown',
      capability: null,
      featureAvailability: [],
      compilerTargets: [],
      evidenceStatusEffect: 'none',
    });

    expect(API_BOUNDARY_MODEL_CONTRACT).toEqual({
      sourceFactIds: ['SRC-CUDA-015'],
      executesCuda: false,
      evidenceStatusEffect: 'none',
      apiMapping: 'not-one-to-one',
      scope: 'selected-lifecycle-roles',
    });
    expect(API_BOUNDARY_STAGES).toHaveLength(6);
    expect(API_BOUNDARY_STAGES.every(({ sharedLayer }) => sharedLayer === 'cuda-driver-stack')).toBe(true);

    expect(BLOCK_SHAPE_STATIC_CASES.map(({ id }) => id)).toEqual([
      'exact',
      'fringe',
      'aggregate-invalid',
    ]);
    const capability = BLOCK_SHAPE_CAPABILITIES[0];
    const exact = assessBlockShape(BLOCK_SHAPE_STATIC_CASES[0].input, capability);
    const invalid = assessBlockShape(BLOCK_SHAPE_STATIC_CASES[2].input, capability);
    expect(exact).toMatchObject({
      valid: true,
      performanceVerdict: 'not-assessed',
      evidenceStatusEffect: 'none',
      remainingFeasibilityChecks: BLOCK_SHAPE_KERNEL_RESOURCE_CHECKS,
    });
    expect(invalid).toMatchObject({
      valid: false,
      geometry: null,
      issues: ['threads-per-block-exceeds-capability'],
      performanceVerdict: 'not-assessed',
      evidenceStatusEffect: 'none',
    });
  });

  it('renders one component with permanent static content and hidden enhancement controls per locale', async () => {
    for (const component of components) {
      for (const localePrefix of ['', 'en/']) {
        const route = `/${localePrefix}foundations/${component.slug}/`;
        const document = await readRoute(route);
        const root = document.querySelector(component.tag);

        expect(root, route).not.toBeNull();
        expect(document.querySelectorAll(component.tag), route).toHaveLength(1);
        expect(root?.querySelector('[data-static-fallback]'), route).not.toBeNull();
        expect(root?.querySelector(component.controls)?.hasAttribute('hidden'), route).toBe(true);
        expect(root?.querySelectorAll(component.staticSelector), route).toHaveLength(component.staticCount);
        expect(root?.textContent, route).toMatch(/no.*Evidence Status|无.*Evidence Status|不.*Evidence Status/i);
        expect(document.querySelectorAll('[data-visual-id]'), route).toHaveLength(1);
        expect(root?.getAttribute('data-visual-id'), route).toBe(component.visualId);
        expect(document.getElementById(component.visualId.toLowerCase()), route).not.toBeNull();
        expect(metadata(document, 'cuda:unit-id'), route).toBe(component.unitId);
        expect(metadata(document, 'cuda:resource-kind'), route).toBe('learning-unit');
        expect(metadata(document, 'cuda:evidence-compilation'), route).toBe('none');
        expect(metadata(document, 'cuda:evidence-runtime'), route).toBe('none');
        expect(metadata(document, 'cuda:recorded-observations'), route).toBe('none');
      }
    }
  });

  it('keeps native controls labelled and implements the API-boundary keyboard tab pattern', async () => {
    const errorTimeline = await readRoute('/en/foundations/asynchronous-errors/');
    expect(errorTimeline.querySelector('cuda-error-timeline select[data-action="select-scenario"]')).not.toBeNull();
    expect(errorTimeline.querySelector('cuda-error-timeline input[type="range"][aria-valuetext]')).not.toBeNull();
    expect(errorTimeline.querySelectorAll('cuda-error-timeline button[type="button"]')).toHaveLength(4);
    expect(errorTimeline.querySelector('cuda-error-timeline [role="status"][aria-live="polite"]')).not.toBeNull();

    const capability = await readRoute('/en/foundations/compute-capability/');
    expect(capability.querySelector('cuda-capability-filter label[for]')).not.toBeNull();
    expect(capability.querySelector('cuda-capability-filter input[aria-describedby][aria-invalid]')).not.toBeNull();
    expect(capability.querySelector('cuda-capability-filter button[type="button"]')).not.toBeNull();
    expect(capability.querySelector('cuda-capability-filter [role="status"][aria-live="polite"]')).not.toBeNull();

    const api = await readRoute('/en/foundations/runtime-driver-api/');
    const tabs = [...api.querySelectorAll('cuda-api-boundary [role="tab"]')];
    expect(tabs).toHaveLength(6);
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    expect(tabs.filter((tab) => tab.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(tabs.filter((tab) => tab.getAttribute('tabindex') === '-1')).toHaveLength(5);
    expect(api.querySelector('cuda-api-boundary [role="tabpanel"][aria-labelledby][tabindex="0"]')).not.toBeNull();

    const blockShape = await readRoute('/en/foundations/launch-geometry/');
    expect(blockShape.querySelectorAll('cuda-block-shape-explorer input[type="number"][aria-invalid]')).toHaveLength(4);
    expect(blockShape.querySelector('cuda-block-shape-explorer select[data-capability]')).not.toBeNull();
    expect(blockShape.querySelector('cuda-block-shape-explorer button[type="button"]')).not.toBeNull();
    expect(blockShape.querySelector('cuda-block-shape-explorer [role="status"][aria-live="polite"]')).not.toBeNull();

    const apiSource = await readFile(path.join(projectRoot, 'src/components/ApiBoundary.astro'), 'utf8');
    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End']) {
      expect(apiSource).toContain(`${key}:`);
    }
    expect(apiSource).toContain('event.preventDefault()');
    expect(apiSource).toMatch(/tabIndex = selected \? 0 : -1/);
    expect(apiSource).toMatch(/\?\.focus\(\)/);
  });

  it('ships explicit mobile, reduced-motion, forced-color, and print fallbacks for every component', async () => {
    for (const { file, visualId } of components) {
      const source = await readFile(path.join(projectRoot, 'src/components', file), 'utf8');

      expect(source, `${file} model import`).toMatch(/from ['"]\.\.\/visuals\/[a-z-]+-model['"]/);
      expect(source, `${file} mobile`).toMatch(/@media \(max-width:/);
      expect(source, `${file} reduced motion`).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
      expect(source, `${file} forced colors`).toMatch(/@media \(forced-colors: active\)/);
      expect(source, `${file} print`).toMatch(/@media print/);
      expect(source, `${file} hidden controls`).toMatch(/controls\.hidden = false/);
      expect(source, `${file} static fallback`).toContain('data-static-fallback');
      expect(source, `${file} formal embedded VIS assignment`).toContain(`data-visual-id="${visualId}"`);
    }
  });
});
