// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://artifact-pipeline.invalid').pathname;
  const html = await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function attributeValues(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

const reviewedSelections = [
  '11.8.0:baseline-75:whole-program',
  '11.8.0:baseline-75:separate-compilation-rdc',
  '12.9.2:baseline-75:whole-program',
  '12.9.2:baseline-75:separate-compilation-rdc',
  '12.9.2:exact-90a:whole-program',
  '12.9.2:exact-90a:separate-compilation-rdc',
  '12.9.2:family-100f:whole-program',
  '12.9.2:family-100f:separate-compilation-rdc',
  '13.3.1:baseline-75:whole-program',
  '13.3.1:baseline-75:separate-compilation-rdc',
  '13.3.1:exact-90a:whole-program',
  '13.3.1:exact-90a:separate-compilation-rdc',
  '13.3.1:family-100f:whole-program',
  '13.3.1:family-100f:separate-compilation-rdc',
];

const stageIds = [
  'source-split',
  'device-ptx',
  'device-cubin',
  'fatbinary',
  'host-object',
  'optional-device-link',
  'final-link',
];

const wholeProgramStageIdentities = [
  'whole-source-split',
  'whole-ptx-image',
  'whole-cubin-image',
  'whole-fatbinary',
  'whole-host-object',
  'whole-device-link-skipped',
  'whole-final-host-link',
];

const rdcStageIdentities = [
  'rdc-source-pair',
  'rdc-cross-tu-device-edge',
  'rdc-caller-object',
  'rdc-device-math-object',
  'rdc-original-object-set',
  'rdc-device-link-object',
  'rdc-final-host-link',
];

describe('VIS09 artifact-pipeline Visual Explainer', () => {
  it('keeps the bilingual source pair, typed copy, pure model, and adaptive light-DOM source aligned', async () => {
    const [zh, en, model, typedCopy, component, styles] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/artifact-pipeline.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/artifact-pipeline.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/artifact-pipeline-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/artifact-pipeline-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/ArtifactPipelineExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/compilation-visuals.css'), 'utf8'),
    ]);

    expect(zh).toContain("title: 'NVCC 构建产物流水线'");
    expect(en).toContain("title: 'NVCC Artifact Pipeline'");
    expect(zh).toContain('counterpart: /en/visuals/artifact-pipeline/');
    expect(en).toContain('counterpart: /visuals/artifact-pipeline/');
    for (const source of [zh, en]) {
      expect(source).toContain('pairId: vis09');
      expect(source).toContain('unitId: VIS09');
      expect(source).toContain('resourceKind: visual-explainer');
      expect(source).toMatch(/prerequisites:\n  - M15\n  - M16\n  - M17\nrelatedUnits:\n  - EX10/);
      expect(source).toContain("factCheckDate: '2026-08-29'");
      expect(source).toContain("hardwareGate: 'None: deterministic browser model; no CUDA-capable system required'");
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source.match(/accessDate: '2026-08-29'/g)).toHaveLength(5);
      expect(source).toContain("content: '11.8.0,12.9.2,13.3.1,13.3'");
      expect(source).toContain('https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#cuda-compilation-trajectory');
      expect(source).toContain('https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#the-cuda-compilation-trajectory');
      expect(source).toContain('https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#the-cuda-compilation-trajectory');
      expect(source).toContain('https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#using-separate-compilation-in-cuda');
      expect(source).toContain('https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html#feature-set-compiler-targets');
      expect(source).toMatch(/runtime image selection/i);
      expect(source).toMatch(/no autoplay|没有 autoplay/);
      expect(source).toMatch(/device-link object/i);
      expect(source).toMatch(/whole-program/);
      expect(source).toMatch(/separate compilation \/ RDC/i);
      expect(source).toMatch(/suffix.*(does not select RDC|不表示 RDC|不决定 branch|chooses either branch)/i);
    }

    expect(model).toContain("runtimeImageSelection: 'unknown'");
    expect(model).toContain("compilationEvidence: 'none'");
    expect(model).toContain("runtimeEvidence: 'none'");
    expect(model).toContain("performanceEvidence: 'none'");
    expect(model).toContain("targetModeRelationship: 'independent-explicit-selections'");
    for (const sourceFactId of ['SRC-CUDA-016', 'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034']) {
      expect(model).toContain(sourceFactId);
    }
    expect(model).toContain('action: unknown');
    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(typedCopy).toContain('Readonly<Record<ArtifactPipelineLocale, ArtifactPipelineCopy>>');
    expect(typedCopy).toContain("'whole-program'");
    expect(typedCopy).toContain("'separate-compilation-rdc'");
    expect(model).toContain("source: 'caller.cu'");
    expect(model).toContain("source: 'device_math.cu'");
    expect(model).toContain("relocatableDeviceCode: 'caller.o::relocatable-device-code'");
    expect(model).toContain("relocatableDeviceCode: 'device_math.o::relocatable-device-code'");
    expect(model).toContain("linkedExecutableDeviceCode: 'device_link.o::linked-executable-device-code'");
    expect(typedCopy).toMatch(/skipped|已跳过/);
    for (const target of ['baseline-75', 'exact-90a', 'family-100f']) expect(typedCopy).toContain(target);
    for (const stage of stageIds) expect(typedCopy).toContain(stage);

    expect(component).toContain('<cuda-artifact-pipeline');
    expect(component).toContain('data-visual-id="VIS09"');
    expect(component).toContain('data-static-fallback');
    expect(component).toContain('data-live-workbench');
    expect(component).toContain('data-artifact-mode');
    expect(component).toContain('data-pipeline-mode');
    expect(component.match(/data-pagefind-ignore/g)).toHaveLength(1);
    expect(component).toContain('controls.hidden = false');
    expect(component).toContain('workbench.hidden = false');
    expect(component).not.toMatch(/<[^>]*\sid\s*=/);
    expect(component).not.toMatch(/<svg\b|<img\b/i);
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout|requestAnimationFrame/);

    expect(styles).toMatch(/@media \(max-width:/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(styles).toMatch(/@media \(forced-colors: active\)/);
    expect(styles).toMatch(/@media print/);
    expect(styles).toContain("[data-stage-state='skipped']");
    expect(styles).not.toMatch(/@keyframes|animation-name/);
  });

  it.each([
    {
      route: '/visuals/artifact-pipeline/',
      counterpart: '/en/visuals/artifact-pipeline/',
      title: 'NVCC 构建产物流水线',
    },
    {
      route: '/en/visuals/artifact-pipeline/',
      counterpart: '/visuals/artifact-pipeline/',
      title: 'NVCC Artifact Pipeline',
    },
  ])('renders the complete evidence-neutral VIS09 route at $route', async ({ route, counterpart, title }) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('cuda-artifact-pipeline[data-visual-id="VIS09"]');
    expect(document.querySelector('main h1')?.textContent?.trim()).toBe(title);
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    if (!visual) throw new Error('Expected VIS09 custom element.');

    expect(visual.getAttribute('data-model-id')).toBe('reviewed-nvcc-artifact-flow');
    expect(visual.getAttribute('data-pipeline-mode')).toBe('whole-program');
    expect(visual.getAttribute('data-runtime-image-selection')).toBe('unknown');
    expect(visual.getAttribute('data-evidence-status-effect')).toBe('none');
    expect(visual.querySelector('[data-conceptual-only]')).not.toBeNull();
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
    expect(visual.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual.querySelector('[data-live-workbench][data-pagefind-ignore][hidden]')).not.toBeNull();
    expect(visual.querySelectorAll('[data-pagefind-ignore]')).toHaveLength(1);
    expect(visual.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(visual.querySelector('select[data-artifact-lane]')?.querySelectorAll('option')).toHaveLength(3);
    expect(visual.querySelector('select[data-artifact-target-plan]')?.querySelectorAll('option')).toHaveLength(1);
    expect(visual.querySelector('select[data-artifact-mode]')?.querySelectorAll('option')).toHaveLength(2);
    expect(visual.querySelectorAll('button[data-artifact-action]')).toHaveLength(2);
    expect(visual.querySelector('[data-artifact-action="play"], input[type="range"]')).toBeNull();

    expect(visual.hasAttribute('id')).toBe(false);
    expect(visual.querySelector('[id]')).toBeNull();
    expect(visual.querySelector('svg, img')).toBeNull();
    expect(visual.querySelector('[data-static-fallback]')).not.toBeNull();
    expect(visual.querySelectorAll('[data-static-selection]')).toHaveLength(14);
    expect(visual.querySelectorAll('[data-static-stage]')).toHaveLength(98);
    expect(attributeValues(visual, '[data-static-selection]', 'data-static-selection')).toEqual(reviewedSelections);
    for (const card of visual.querySelectorAll('[data-static-selection]')) {
      expect(card.querySelectorAll('[data-static-stage]')).toHaveLength(7);
      expect(card.getAttribute('data-runtime-image-selection')).toBe('unknown');
      expect(attributeValues(card, '[data-static-stage]', 'data-stage-id')).toEqual(stageIds);
    }
    expect(visual.querySelectorAll('[data-static-target-plan="baseline-75"]')).toHaveLength(6);
    expect(visual.querySelectorAll('[data-static-target-plan="exact-90a"]')).toHaveLength(4);
    expect(visual.querySelectorAll('[data-static-target-plan="family-100f"]')).toHaveLength(4);
    const wholeProgramCards = visual.querySelectorAll('[data-static-mode="whole-program"]');
    const rdcCards = visual.querySelectorAll('[data-static-mode="separate-compilation-rdc"]');
    expect(wholeProgramCards).toHaveLength(7);
    expect(rdcCards).toHaveLength(7);
    for (const card of wholeProgramCards) {
      const deviceLink = card.querySelector('[data-stage-id="optional-device-link"]');
      expect(deviceLink?.getAttribute('data-stage-state')).toBe('skipped');
      expect(deviceLink?.textContent).toMatch(/skipped|已跳过/);
      expect(deviceLink?.textContent).toMatch(/no device-link object|不产生 device-link object/);
      expect(attributeValues(card, '[data-static-stage]', 'data-stage-identity')).toEqual(wholeProgramStageIdentities);
      expect(card.querySelector('[data-static-manifest-sources]')?.textContent).toBe('kernel.cu');
      expect(card.querySelector('[data-static-manifest-objects]')?.textContent).toContain('kernel.o [fatbinary-with-finalized-device-images]');
      expect(card.querySelector('[data-static-manifest-device-link]')?.textContent).toContain('skipped-whole-program');
      expect(card.querySelector('[data-static-manifest-final-inputs]')?.textContent).toBe('kernel.o');
    }
    for (const card of rdcCards) {
      const deviceLink = card.querySelector('[data-stage-id="optional-device-link"]');
      expect(deviceLink?.getAttribute('data-stage-state')).toBe('complete');
      expect(deviceLink?.textContent).toContain('device_link.o');
      expect(deviceLink?.textContent).toContain('device_link.o::linked-executable-device-code');
      expect(attributeValues(card, '[data-static-stage]', 'data-stage-identity')).toEqual(rdcStageIdentities);
      expect(card.querySelector('[data-static-manifest-sources]')?.textContent).toBe('caller.cu + device_math.cu');
      expect(card.querySelector('[data-static-manifest-objects]')?.textContent).toContain('caller.o [caller.o::relocatable-device-code]');
      expect(card.querySelector('[data-static-manifest-objects]')?.textContent).toContain('device_math.o [device_math.o::relocatable-device-code]');
      expect(card.querySelector('[data-static-manifest-device-link]')?.textContent).toBe('device_link.o [device_link.o::linked-executable-device-code]');
      expect(card.querySelector('[data-static-manifest-final-inputs]')?.textContent).toBe('caller.o + device_math.o + device_link.o');
      expect(card.textContent).not.toMatch(/PTX image candidate|cubin \/ SASS image/);
    }
    expect(visual.textContent).toMatch(/compute_75/);
    expect(visual.textContent).toMatch(/compute_90a/);
    expect(visual.textContent).toMatch(/compute_100f/);
    expect(visual.textContent).toMatch(/fatbinary/i);
    expect(visual.textContent).toMatch(/host object/i);
    expect(visual.textContent).toMatch(/device_link\.o/);
    expect(visual.textContent).toMatch(/linked executable \/ shared library/);
    expect(visual.querySelector('[data-measured], [data-observed-artifact], [data-runtime-selected-image]')).toBeNull();

    expect(metadata(document, 'cuda:pair-id')).toBe('vis09');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS09');
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:fact-check-date')).toBe('2026-08-29');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:prerequisites')).toBe('M15,M16,M17');
    expect(metadata(document, 'cuda:related-units')).toBe('EX10');
    expect(metadata(document, 'cuda:hardware-gate')).toBe('None: deterministic browser model; no CUDA-capable system required');
    expect(metadata(document, 'cuda:source-count')).toBe('5');
    expect(metadata(document, 'cuda:source-versions')).toBe('11.8.0,12.9.2,13.3.1,13.3');
    for (const field of ['compilation', 'runtime', 'expected-observations', 'recorded-observations']) {
      expect(metadata(document, `cuda:evidence-${field}`) ?? metadata(document, `cuda:${field}`)).toBe('none');
    }
  });

  it('keeps locale-independent lane, plan, stage, and runtime contracts in the same order', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/artifact-pipeline/'),
      readBuiltRoute('/en/visuals/artifact-pipeline/'),
    ]);
    const selectors = [
      ['[data-static-selection]', 'data-static-selection'],
      ['[data-static-selection]', 'data-static-lane'],
      ['[data-static-selection]', 'data-static-target-plan'],
      ['[data-static-selection]', 'data-static-mode'],
      ['[data-static-stage]', 'data-static-stage'],
      ['[data-static-stage]', 'data-stage-id'],
      ['[data-static-stage]', 'data-stage-identity'],
      ['[data-static-stage]', 'data-stage-mode'],
      ['[data-static-stage]', 'data-branch'],
      ['[data-static-stage]', 'data-optional'],
      ['[data-static-stage]', 'data-stage-state'],
      ['[data-static-selection]', 'data-runtime-image-selection'],
    ] as const;
    for (const [selector, attribute] of selectors) {
      expect(attributeValues(zh, selector, attribute)).toEqual(attributeValues(en, selector, attribute));
    }
  });
});
