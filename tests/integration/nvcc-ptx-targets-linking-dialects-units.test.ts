// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const reviewDate = '2026-08-29';

type Locale = 'zh' | 'en';

type PublicationContract = {
  id: string;
  pairId: string;
  relativePath: string;
  titles: Readonly<Record<Locale, string>>;
  structure: readonly string[];
  prerequisites: readonly string[];
  relatedUnits: readonly string[];
  resourceKind: 'learning-unit' | 'runnable-example' | 'visual-explainer';
  hardwareGate: string;
  sourceVersions: string;
  sourceUrls: readonly string[];
  factTokens: readonly string[];
  exampleIds?: readonly string[];
  canonicalExample?: string;
  canonicalRanges?: readonly string[];
  compilationEvidence?: 'none' | 'Compile-Checked';
  runtimeEvidence?: 'none' | 'Runtime-Not-Applicable';
  expectedObservations?: string;
};

type UnitContract = PublicationContract & {
  practiceId: `PB-R2-0${string}`;
};

const unitContracts = [
  {
    id: 'M15',
    pairId: 'm15',
    relativePath: 'toolchain/nvcc-compilation-flow.mdx',
    titles: { zh: 'M15：NVCC 主机/设备编译流程', en: 'M15: NVCC Host/Device Compilation Flow' },
    structure: [
      'outcome',
      'prerequisites',
      'phase-contract',
      'supported-phases',
      'source-split',
      'device-path',
      'host-path',
      'linking',
      'whole-program',
      'artifact-ledger',
      'canonical-example',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    prerequisites: ['F04', 'O04'],
    relatedUnits: ['M16', 'M18', 'EX10', 'VIS09'],
    resourceKind: 'learning-unit',
    hardwareGate: 'none',
    sourceVersions: '13.3,12.9.2,11.8.0',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#nvcc-phases',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#the-cuda-compilation-trajectory',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#nvcc-phases',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#supported-phases',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#the-cuda-compilation-trajectory',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#nvcc-phases',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#supported-phases',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#cuda-compilation-trajectory',
    ],
    factTokens: [
      '--preprocess',
      '--cuda',
      '--ptx',
      '--cubin',
      '--fatbin',
      '--compile',
      '--run',
      '.cu.cpp.ii',
      '--dryrun',
      'whole-program',
    ],
    exampleIds: ['EX10'],
    canonicalExample: 'EX10',
    canonicalRanges: ['artifact-kernel', 'artifact-pipeline'],
    practiceId: 'PB-R2-007',
  },
  {
    id: 'M16',
    pairId: 'm16',
    relativePath: 'toolchain/ptx-cubin-fatbinary.mdx',
    titles: { zh: 'M16：PTX、cubin、SASS 与 fatbinary', en: 'M16: PTX, Cubins, SASS, and Fatbinaries' },
    structure: [
      'outcome',
      'prerequisites',
      'artifact-vocabulary',
      'ptx-versioning',
      'standalone-embedded',
      'selection',
      'inspection',
      'canonical-example',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    prerequisites: ['M15', 'F06'],
    relatedUnits: ['M17', 'M18', 'EX10', 'VIS09'],
    resourceKind: 'learning-unit',
    hardwareGate: 'none',
    sourceVersions: '7.8,8.8,9.3,11.8.0,12.9,12.9.2,13.3,13.3.1',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#application-compatibility',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#fatbinaries',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#application-compatibility',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#fatbinaries',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#application-compatibility',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#fatbinaries',
      'https://docs.nvidia.com/cuda/cuda-binary-utilities/index.html',
    ],
    factTokens: [
      'PTX ISA 7.8',
      'PTX ISA 8.8',
      'PTX ISA 9.3',
      '.version',
      '.target',
      'cuobjdump --list-elf',
      'cuobjdump --list-ptx',
      'cuobjdump --dump-sass',
      'nvdisasm',
    ],
    exampleIds: ['EX10'],
    canonicalExample: 'EX10',
    canonicalRanges: ['artifact-kernel', 'artifact-pipeline'],
    practiceId: 'PB-R2-008',
  },
  {
    id: 'M17',
    pairId: 'm17',
    relativePath: 'toolchain/compiler-architecture-targets.mdx',
    titles: { zh: 'M17：选择编译器架构目标', en: 'M17: Choosing Compiler Architecture Targets' },
    structure: [
      'outcome',
      'prerequisites',
      'plan-ledger',
      'generate-code',
      'sass-ptx',
      'assumption-matching',
      'feature-scopes',
      'lane-matrix',
      'selected-plans',
      'deployment',
      'related-resources',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    prerequisites: ['M16', 'F06'],
    relatedUnits: ['EX10', 'VIS09'],
    resourceKind: 'learning-unit',
    hardwareGate: 'none',
    sourceVersions: '13.3,13.3.1,12.9.2,11.8.0',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html#feature-set-compiler-targets',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/deploy/cuda-compatibility/why-cuda-compatibility.html',
      'https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html',
      'https://docs.nvidia.com/deploy/cuda-compatibility/forward-compatibility.html',
    ],
    factTokens: [
      '--generate-code',
      'compute_75',
      'sm_75',
      'compute_90a',
      'sm_90a',
      'compute_100f',
      'sm_100f',
      'compute_120a',
      'sm_120a',
      'Minor Version Compatibility',
      'Forward Compatibility',
    ],
    exampleIds: ['EX10'],
    practiceId: 'PB-R2-009',
  },
  {
    id: 'M18',
    pairId: 'm18',
    relativePath: 'toolchain/separate-compilation-device-linking.mdx',
    titles: { zh: 'M18：分离编译与设备链接', en: 'M18: Separate Compilation and Device Linking' },
    structure: [
      'outcome',
      'prerequisites',
      'whole-program-default',
      'external-device-references',
      'relocatable-device-code',
      'device-link',
      'host-link',
      'target-compatibility',
      'libraries',
      'object-compatibility',
      'cuda-arch',
      'canonical-example',
      'artifact-ledger',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    prerequisites: ['M15', 'M16'],
    relatedUnits: ['EX10', 'M17'],
    resourceKind: 'learning-unit',
    hardwareGate: 'none',
    sourceVersions: '13.3,12.9.2,11.8.0',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#using-separate-compilation-in-cuda',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#using-separate-compilation-in-cuda',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#using-separate-compilation-in-cuda',
    ],
    factTokens: [
      '-dc',
      '--relocatable-device-code=true --compile',
      '--device-link',
      '--no-device-link',
      'a_dlink.o',
      'device_link.o',
      '__CUDA_ARCH__',
    ],
    exampleIds: ['EX10'],
    canonicalExample: 'EX10',
    canonicalRanges: ['device-link-contract', 'artifact-pipeline'],
    practiceId: 'PB-R2-010',
  },
  {
    id: 'M19',
    pairId: 'm19',
    relativePath: 'toolchain/cpp-dialect-boundaries.mdx',
    titles: { zh: 'M19：CUDA C++17、C++20 与 C++23 方言边界', en: 'M19: CUDA C++17, C++20, and C++23 Dialect Boundaries' },
    structure: [
      'outcome',
      'prerequisites',
      'dialect-coordinate',
      'standard-provenance',
      'teaching-matrix',
      'host-compiler-gate',
      'documentation-boundary',
      'ordinary-and-probe',
      'historical-probe',
      'publication-gate',
      'canonical-example',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    prerequisites: ['O04', 'M15'],
    relatedUnits: ['EX02', 'EX10'],
    resourceKind: 'learning-unit',
    hardwareGate: 'none',
    sourceVersions: '13.3,13.3.1,12.9.2,11.8.0,N4659,N4861,N4950,N4951',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-support.html',
      'https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#host-compiler-support-policy',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-installation-guide-linux/index.html#host-compiler-support-policy',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#options-for-altering-compiler-linker-behavior-std',
      'https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2017/n4659.pdf',
      'https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2020/n4861.pdf',
      'https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4950.pdf',
      'https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/n4951.html',
    ],
    factTokens: [
      'N4659',
      'N4861',
      'N4950',
      'N4951',
      'NVCC 13.3.73',
      'GCC 13.3.0',
      'GCC 14',
      'GCC 14.2.0',
      '33271481405',
      '__cplusplus >= 202302L',
      'if consteval',
      'cxx23-probe',
    ],
    exampleIds: ['EX02', 'EX10'],
    canonicalExample: 'EX10',
    canonicalRanges: ['cxx23-probe'],
    practiceId: 'PB-R2-011',
  },
] as const satisfies readonly UnitContract[];

const publicationContracts: readonly PublicationContract[] = [
  ...unitContracts,
  {
    id: 'EX10',
    pairId: 'ex10',
    relativePath: 'examples/ptx-fatbinary-inspection.mdx',
    titles: {
      zh: 'EX10：PTX 与 Fatbinary 检查可运行示例',
      en: 'EX10: PTX and Fatbinary Inspection Runnable Example',
    },
    structure: ['purpose', 'canonical-project', 'artifacts', 'pipeline', 'compatibility', 'evidence', 'boundaries', 'sources'],
    prerequisites: ['M15', 'M16'],
    relatedUnits: ['M17', 'M18', 'M19', 'VIS09'],
    resourceKind: 'runnable-example',
    hardwareGate: 'Build and inspection: x86-64 CPU runner with Docker; runtime: not applicable; no host or GPU executable execution',
    sourceVersions: 'CUDA 11.8.0,CUDA 12.9.2,CUDA 13.3.1,PTX ISA 7.8/8.8/9.3,GCC 14,GNU Binutils 2.38/2.42',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/parallel-thread-execution/index.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-binary-utilities/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-binary-utilities/index.html',
      'https://docs.nvidia.com/cuda/cuda-binary-utilities/index.html',
      'https://sourceware.org/binutils/docs-2.38/binutils/nm.html',
      'https://sourceware.org/binutils/docs-2.42/binutils/nm.html',
      'https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#host-compiler-support-policy',
      'https://packages.ubuntu.com/noble-updates/g++-14',
      'https://gitlab.com/nvidia/container-images/cuda/-/commit/44b139413eb3dfcb3fc30d0868479deedce72255',
      'https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04',
      'https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04',
      'https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04',
    ],
    factTokens: [
      'artifact_kernel.ii',
      'artifact_kernel.ptx',
      'artifact_kernel.cubin',
      'artifact_kernel.fatbin',
      'device_link.o',
      '--no-device-link',
      '--network none',
      'Runtime-Not-Applicable',
    ],
    exampleIds: ['EX10'],
    canonicalExample: 'EX10',
    canonicalRanges: ['artifact-kernel', 'device-link-contract', 'artifact-pipeline', 'cxx23-probe'],
    compilationEvidence: 'Compile-Checked',
    runtimeEvidence: 'Runtime-Not-Applicable',
    expectedObservations: '2 artifact expectations',
  },
  {
    id: 'VIS09',
    pairId: 'vis09',
    relativePath: 'visuals/artifact-pipeline.mdx',
    titles: { zh: 'NVCC 构建产物流水线', en: 'NVCC Artifact Pipeline' },
    structure: ['purpose', 'controls', 'artifact-flow', 'target-plans', 'static-fallback', 'evidence-boundary', 'sources'],
    prerequisites: ['M15', 'M16', 'M17'],
    relatedUnits: ['EX10'],
    resourceKind: 'visual-explainer',
    hardwareGate: 'None: deterministic browser model; no CUDA-capable system required',
    sourceVersions: '11.8.0,12.9.2,13.3.1,13.3',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-compiler-driver-nvcc/index.html#cuda-compilation-trajectory',
      'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#the-cuda-compilation-trajectory',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#the-cuda-compilation-trajectory',
      'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#using-separate-compilation-in-cuda',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html#feature-set-compiler-targets',
    ],
    factTokens: [
      '11.8.0',
      '12.9.2',
      '13.3.1',
      'compute_75',
      'sm_75',
      'compute_90a',
      'sm_90a',
      'compute_100f',
      'caller.cu',
      'device_math.cu',
      'caller.o::relocatable-device-code',
      'device_math.o::relocatable-device-code',
      'device_link.o::linked-executable-device-code',
      'caller.o + device_math.o + device_link.o',
      'sm_100f',
      'runtime image selection',
      'unknown',
    ],
  },
];

const exerciseStructure = ['prerequisites', 'instructions', 'exercise-1', 'exercise-2', 'exercise-3', 'next'];
const solutionStructure = ['review', 'solution-1', 'solution-2', 'solution-3', 'valid-alternatives', 'common-errors'];

async function readSource(relativePath: string, english = false) {
  return readFile(path.join(docsRoot, english ? 'en' : '', relativePath), 'utf8');
}

async function readRoute(route: string) {
  const pathname = new URL(route, 'https://issue-20.invalid').pathname;
  const html = await readFile(path.join(projectRoot, 'dist', pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function routeFor(relativePath: string, english = false) {
  return `/${english ? 'en/' : ''}${relativePath.replace(/\.(?:md|mdx)$/, '/')}`;
}

function frontmatter(source: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function body(source: string) {
  const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function yamlScalar(metadataSource: string, field: string) {
  const match = new RegExp(`^${field}: (?:'([^']*)'|"([^"]*)"|(.+))$`, 'm').exec(metadataSource);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function yamlList(metadataSource: string, field: string) {
  if (new RegExp(`^${field}: \[\]$`, 'm').test(metadataSource)) return [];
  const match = new RegExp(`^${field}:\n((?:  - .+\n?)+)`, 'm').exec(metadataSource);
  return match?.[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function sourceCoordinates(source: string) {
  return [...frontmatter(source).matchAll(
    /^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm,
  )].map(([, url, version, platform, accessDate]) => ({ url, version, platform, accessDate }));
}

function canonicalImports(source: string) {
  return [...source.matchAll(/<CanonicalCode exampleId="EX10" range="([^"]+)" \/>/g)].map((match) => match[1]);
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function mainText(document: Document) {
  return document.querySelector('main')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function expectText(text: string, tokens: readonly string[]) {
  const normalized = text.toLowerCase();
  for (const token of tokens) expect(normalized, token).toContain(token.toLowerCase());
}

function retrievalQuestions(source: string) {
  const section = /^## (?:离开前检查|Retrieval check)\n([\s\S]*?)(?=^## |\Z)/m.exec(source)?.[1] ?? '';
  return [...section.matchAll(/^\d+\. .+$/gm)].map((match) => match[0]);
}

describe('M15-M19, EX10, and VIS09 bilingual publication contracts', () => {
  for (const contract of publicationContracts) {
    it(`publishes ${contract.id} with exact metadata, facts, sources, and canonical imports`, async () => {
      const [chinese, english] = await Promise.all([
        readSource(contract.relativePath),
        readSource(contract.relativePath, true),
      ]);
      const sources = { zh: chinese, en: english } as const;
      const chineseCoordinates = sourceCoordinates(chinese);
      const englishCoordinates = sourceCoordinates(english);

      expect(chineseCoordinates, `${contract.id} source count`).toHaveLength(contract.sourceUrls.length);
      expect(chineseCoordinates, `${contract.id} source parity`).toEqual(englishCoordinates);
      expect(chineseCoordinates.map(({ url }) => url), contract.id).toEqual(contract.sourceUrls);
      expect(chineseCoordinates.map(({ accessDate }) => accessDate), contract.id).toEqual(
        contract.sourceUrls.map(() => reviewDate),
      );

      for (const [locale, source] of Object.entries(sources) as [Locale, string][]) {
        const englishLocale = locale === 'en';
        const metadataSource = frontmatter(source);
        const counterpart = routeFor(contract.relativePath, !englishLocale);
        const route = routeFor(contract.relativePath, englishLocale);

        expect(yamlScalar(metadataSource, 'title')).toBe(contract.titles[locale]);
        expect(yamlScalar(metadataSource, 'pairId')).toBe(contract.pairId);
        expect(yamlScalar(metadataSource, 'counterpart')).toBe(counterpart);
        expect(yamlScalar(metadataSource, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(metadataSource, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(metadataSource, 'provenance')).toBe('original');
        expect(yamlScalar(metadataSource, 'resourceKind')).toBe(contract.resourceKind);
        expect(yamlScalar(metadataSource, 'unitId')).toBe(contract.id);
        expect(yamlScalar(metadataSource, 'hardwareGate')).toBe(contract.hardwareGate);
        expect(yamlList(metadataSource, 'structure')).toEqual(contract.structure);
        expect(yamlList(metadataSource, 'prerequisites')).toEqual(contract.prerequisites);
        expect(yamlList(metadataSource, 'relatedUnits')).toEqual(contract.relatedUnits);
        expect(yamlList(metadataSource, 'exampleIds')).toEqual(contract.exampleIds ?? []);
        expect(yamlScalar(metadataSource, 'canonicalExample')).toBe(contract.canonicalExample);
        expect(yamlList(metadataSource, 'canonicalRanges')).toEqual(contract.canonicalRanges ?? []);
        expect(canonicalImports(source)).toEqual(contract.canonicalRanges ?? []);
        expect(body(source)).toContain(`<a class="locale-pair" data-locale-counterpart href="${counterpart}"`);
        expectText(source, contract.factTokens);

        if (contract.runtimeEvidence === 'Runtime-Not-Applicable') {
          expect(metadataSource).toMatch(
            contract.compilationEvidence === 'Compile-Checked'
              ? /evidence:\n  compilation:\n    - Compile-Checked\n  runtime:\n    - Runtime-Not-Applicable/
              : /evidence:\n  compilation: \[\]\n  runtime:\n    - Runtime-Not-Applicable/,
          );
        } else {
          expect(metadataSource).toMatch(
            /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
          );
        }

        const document = await readRoute(route);
        expect(document.documentElement.lang).toBe(englishLocale ? 'en' : 'zh-CN');
        expect(document.querySelector('main h1')?.textContent?.trim()).toBe(contract.titles[locale]);
        expect(document.querySelector(`[data-locale-counterpart][href="${counterpart}"]`)).not.toBeNull();
        expect(metadata(document, 'cuda:pair-id')).toBe(contract.pairId);
        expect(metadata(document, 'cuda:fact-check-date')).toBe(reviewDate);
        expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
        expect(metadata(document, 'cuda:structure')).toBe(contract.structure.join(','));
        expect(metadata(document, 'cuda:resource-kind')).toBe(contract.resourceKind);
        expect(metadata(document, 'cuda:unit-id')).toBe(contract.id);
        expect(metadata(document, 'cuda:prerequisites')).toBe(contract.prerequisites.join(',') || 'none');
        expect(metadata(document, 'cuda:related-units')).toBe(contract.relatedUnits.join(',') || 'none');
        expect(metadata(document, 'cuda:hardware-gate')).toBe(contract.hardwareGate);
        expect(metadata(document, 'cuda:evidence-compilation')).toBe(contract.compilationEvidence ?? 'none');
        expect(metadata(document, 'cuda:evidence-runtime')).toBe(contract.runtimeEvidence ?? 'none');
        expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
        expect(metadata(document, 'cuda:source-count')).toBe(String(contract.sourceUrls.length));
        expect(metadata(document, 'cuda:source-versions')).toBe(contract.sourceVersions);
        if (contract.exampleIds) expect(metadata(document, 'cuda:example-ids')).toBe(contract.exampleIds.join(','));
        if (contract.canonicalExample) expect(metadata(document, 'cuda:canonical-example')).toBe(contract.canonicalExample);
        if (contract.canonicalRanges) expect(metadata(document, 'cuda:canonical-ranges')).toBe(contract.canonicalRanges.join(','));
        if (contract.expectedObservations) {
          expect(metadata(document, 'cuda:expected-observations')).toBe(contract.expectedObservations);
        }
        expectText(mainText(document), contract.factTokens);
        for (const url of contract.sourceUrls) {
          expect(document.querySelector(`main a[href="${url}"]`), `${route}: ${url}`).not.toBeNull();
        }
      }
    });
  }

  it('publishes exactly five retrieval questions in every M15-M19 locale', async () => {
    for (const contract of unitContracts) {
      for (const english of [false, true]) {
        const questions = retrievalQuestions(await readSource(contract.relativePath, english));
        expect(questions, `${english ? 'en/' : ''}${contract.id}`).toHaveLength(5);
        expect(questions.map((question) => Number.parseInt(question, 10))).toEqual([1, 2, 3, 4, 5]);
      }
    }
  });
});

describe('issue #20 semantic boundaries', () => {
  it('keeps documented NVCC phases stable and displayed internal steps non-contractual', async () => {
    for (const english of [false, true]) {
      const source = await readSource('toolchain/nvcc-compilation-flow.mdx', english);
      expectText(source, [
        'compilation phase',
        'internal',
        '--dryrun',
        '--preprocess',
        '--cuda',
        '--ptx',
        '--cubin',
        '--fatbin',
        '--compile',
        '--run',
      ]);
      expect(source).toMatch(/stable interface|稳定接口/i);
      expect(source).toMatch(/debugging|调试/i);
      expect(source).toMatch(/must not be copied into a build script|不能.*(?:复制|拷贝).*build script/i);
    }
  });

  it('separates PTX, cubin, SASS, and fatbinary and keeps fallback conditional', async () => {
    for (const english of [false, true]) {
      const source = await readSource('toolchain/ptx-cubin-fatbinary.mdx', english);
      for (const artifact of ['PTX', 'cubin', 'SASS', 'fatbinary']) {
        expect(source).toMatch(new RegExp(`^\\| ${artifact} \\|`, 'm'));
      }
      expectText(source, [
        'versioned virtual ISA text',
        'architecture-specific binary',
        'machine instructions',
        'container',
        '7.8 -> 8.8 -> 9.3',
        'binary load image',
        'PTX fallback',
        'JIT candidate',
        'no-candidate',
      ]);
      expect(source).toMatch(/inventory alone proves neither|inventory 本身不证明/i);
    }
  });

  it('pins same-scope SASS and PTX plans plus baseline, exact-a, and family-f limits', async () => {
    for (const english of [false, true]) {
      const source = await readSource('toolchain/compiler-architecture-targets.mdx', english);
      for (const target of ['75', '90a', '100f', '100a', '120f', '120a']) {
        expect(source).toContain(`arch=compute_${target},code=sm_${target}`);
        expect(source).toContain(`arch=compute_${target},code=compute_${target}`);
      }
      expectText(source, [
        'baseline, unsuffixed',
        'architecture-specific feature set',
        'family-specific feature set',
        'same-scope PTX',
      ]);
      expect(source).toMatch(/numeric ordering|数字大小|数字.*大小/i);
      const qualifiedBoundary = source.match(/^.*`compute_120a`.*`compute_100a`.*`compute_100f`.*$/m)?.[0] ?? '';
      expect(qualifiedBoundary).toMatch(/does not cover|不会.*覆盖/i);
      expect(qualifiedBoundary).toContain('120 > 100');
    }
  });

  it('preserves RDC, device-link, and host-link boundaries and library scopes', async () => {
    for (const english of [false, true]) {
      const source = await readSource('toolchain/separate-compilation-device-linking.mdx', english);
      expect(source).toContain('`-dc` = `--relocatable-device-code=true --compile`');
      expectText(source, [
        'whole-program',
        'caller.o',
        'device_math.o',
        'device_link.o',
        '--device-link',
        '--no-device-link',
        'host link',
        '__CUDA_ARCH__',
      ]);
      expect(source).toMatch(/\.a.*\.so|\.a.*共享库|\.a.*动态库/is);
      expect(source).toMatch(/device-link object.*not the final executable|device-link object.*不是.*final executable/is);
      expect(source).toContain('| original objects + `device_link.o` |');
    }
  });

  it('pins the C++17/C++20 matrix and limits C++23 to one retained GCC 14 probe', async () => {
    for (const english of [false, true]) {
      const source = await readSource('toolchain/cpp-dialect-boundaries.mdx', english);
      expect(source).toMatch(/^\| CUDA 11\.8\.0 \| C\+\+17 \|/m);
      expect(source).toMatch(/^\| CUDA 12\.9\.2 \| C\+\+17(?:,|、)\s*C\+\+20 \|/m);
      expect(source).toMatch(/^\| CUDA 13\.3\.1 \| C\+\+17(?:,|、)\s*C\+\+20 \|/m);
      expectText(source, [
        'cxx23-probe',
        'retained narrow pass',
        'GCC 14',
        'Toolkit 13.3.1',
        '__cplusplus >= 202302L',
        'if consteval',
        'Runtime-Not-Applicable',
      ]);
      expect(source).toMatch(/separate `cxx23-probe`|独立 `cxx23-probe`/i);
      expect(source).toMatch(/unsupported-host bypass|unsupported-host.*绕过|不受支持.*绕过/i);
      expect(source).toMatch(/not ordinary EX10 C\+\+23 Compile-Checked|不是 ordinary EX10 C\+\+23 Compile-Checked/i);
    }

    for (const english of [false, true]) {
      const source = await readSource('examples/ptx-fatbinary-inspection.mdx', english);
      expect(source).toMatch(/No path uses `--allow-unsupported-compiler`|任何路径都不使用 `--allow-unsupported-compiler`/);
    }
  });

  it('keeps artifact, compilation, runtime, correctness, and performance evidence independent', async () => {
    const boundaries = [
      {
        path: 'toolchain/nvcc-compilation-flow.mdx',
        pattern: /compilation artifact (?:is neither|不是).*runtime evidence.*(?:nor|也不是).*performance evidence/is,
      },
      {
        path: 'toolchain/ptx-cubin-fatbinary.mdx',
        pattern: /image inventory (?:proves no|尤其不证明|不证明).*driver selection.*JIT.*execution.*correctness.*performance/is,
      },
      {
        path: 'toolchain/compiler-architecture-targets.mdx',
        pattern: /Successful Lane build|成功的 Lane build/i,
      },
      {
        path: 'toolchain/separate-compilation-device-linking.mdx',
        pattern: /(?:cannot establish|不能建立|无法建立|不能证明).*kernel launch.*runtime correctness.*occupancy.*latency.*throughput.*speedup/is,
      },
      {
        path: 'toolchain/cpp-dialect-boundaries.mdx',
        pattern: /Documentation eligibility(?:,|、).*workflow presence(?:,|、).*successful site build.*actual probe result.*(?:four different facts|四个不同事实)/is,
      },
    ] as const;

    for (const boundary of boundaries) {
      for (const english of [false, true]) {
        expect(await readSource(boundary.path, english), `${english ? 'en/' : ''}${boundary.path}`).toMatch(
          boundary.pattern,
        );
      }
    }

    for (const english of [false, true]) {
      const ex10 = await readSource('examples/ptx-fatbinary-inspection.mdx', english);
      expect(ex10).toContain('Runtime-Not-Applicable');
      expect(ex10).toMatch(/no latency, throughput, speedup, occupancy|不记录 latency、throughput、speedup、occupancy/i);
    }
  });
});

describe('M15-M19 exercise and Practice Bank contracts', () => {
  for (const unit of unitContracts) {
    it(`publishes exactly three ${unit.id} exercises with two hints and separate solutions`, async () => {
      const childRelatedUnits = [unit.id, ...unit.relatedUnits];
      const slug = unit.relativePath.replace(/\.mdx$/, '');

      for (const english of [false, true]) {
        const localePrefix = english ? 'en/' : '';
        const [exercise, solution] = await Promise.all([
          readSource(`${slug}/exercises.md`, english),
          readSource(`${slug}/solutions.md`, english),
        ]);
        const exerciseFrontmatter = frontmatter(exercise);
        const solutionFrontmatter = frontmatter(solution);
        const exerciseCounterpart = `/${english ? '' : 'en/'}${slug}/exercises/`;
        const solutionCounterpart = `/${english ? '' : 'en/'}${slug}/solutions/`;
        const exerciseRoute = `/${localePrefix}${slug}/exercises/`;
        const solutionRoute = `/${localePrefix}${slug}/solutions/`;

        expect(yamlScalar(exerciseFrontmatter, 'pairId')).toBe(`${unit.pairId}-exercises`);
        expect(yamlScalar(exerciseFrontmatter, 'counterpart')).toBe(exerciseCounterpart);
        expect(yamlScalar(exerciseFrontmatter, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(exerciseFrontmatter, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(exerciseFrontmatter, 'provenance')).toBe('original');
        expect(yamlScalar(exerciseFrontmatter, 'resourceKind')).toBe('exercise-set');
        expect(yamlScalar(exerciseFrontmatter, 'unitId')).toBe(`${unit.id}-EXERCISES`);
        expect(yamlList(exerciseFrontmatter, 'structure')).toEqual(exerciseStructure);
        expect(yamlList(exerciseFrontmatter, 'prerequisites')).toEqual([unit.id]);
        expect(yamlList(exerciseFrontmatter, 'relatedUnits')).toEqual(childRelatedUnits);

        expect(yamlScalar(solutionFrontmatter, 'pairId')).toBe(`${unit.pairId}-solutions`);
        expect(yamlScalar(solutionFrontmatter, 'counterpart')).toBe(solutionCounterpart);
        expect(yamlScalar(solutionFrontmatter, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(solutionFrontmatter, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(solutionFrontmatter, 'provenance')).toBe('original');
        expect(yamlScalar(solutionFrontmatter, 'resourceKind')).toBe('solution-set');
        expect(yamlScalar(solutionFrontmatter, 'unitId')).toBe(`${unit.id}-SOLUTIONS`);
        expect(yamlList(solutionFrontmatter, 'structure')).toEqual(solutionStructure);
        expect(yamlList(solutionFrontmatter, 'prerequisites')).toEqual([`${unit.id}-EXERCISES`]);
        expect(yamlList(solutionFrontmatter, 'relatedUnits')).toEqual(childRelatedUnits);

        for (const childFrontmatter of [exerciseFrontmatter, solutionFrontmatter]) {
          expect(childFrontmatter).toMatch(
            /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
          );
        }

        const tasks = [...exercise.matchAll(/^## (?:练习|Exercise) [1-3][^\n]*\n([\s\S]*?)(?=^## |\Z)/gm)];
        expect(tasks, `${localePrefix}${unit.id} exercises`).toHaveLength(3);
        for (const [, task] of tasks) {
          expect(task).toMatch(/\*\*(?:目标：|Goal:)\*\*/);
          expect(task).toMatch(/\*\*(?:约束：|Constraints:)\*\*/);
          expect(task).toMatch(/\*\*(?:预期证据：|Expected evidence:)\*\*/);
          expect(task).toMatch(/\*\*(?:验收条件：|Acceptance criteria:)\*\*/);
          expect(task.match(/<summary>(?:提示|Hint) 1<\/summary>/g)).toHaveLength(1);
          expect(task.match(/<summary>(?:提示|Hint) 2<\/summary>/g)).toHaveLength(1);
          expect(task).not.toMatch(/(?:参考解答|Reviewed solution|^解答|^Solution)/m);
        }
        expect(solution.match(/^## (?:解答|Solution) [1-3]/gm)).toHaveLength(3);
        expect(solution).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
        expect(solution).toMatch(/^## (?:常见错误|Common errors)$/m);
        expect(exercise).toContain(`/${localePrefix}${slug}/solutions/`);
        expect(exercise).toContain(unit.practiceId);

        const [exerciseDocument, solutionDocument] = await Promise.all([
          readRoute(exerciseRoute),
          readRoute(solutionRoute),
        ]);
        expect(metadata(exerciseDocument, 'cuda:unit-id')).toBe(`${unit.id}-EXERCISES`);
        expect(metadata(exerciseDocument, 'cuda:prerequisites')).toBe(unit.id);
        expect(metadata(solutionDocument, 'cuda:unit-id')).toBe(`${unit.id}-SOLUTIONS`);
        expect(metadata(solutionDocument, 'cuda:prerequisites')).toBe(`${unit.id}-EXERCISES`);
      }
    });
  }

  it('publishes PB-R2-007 through PB-R2-011 in order with exact direct prerequisites', async () => {
    const practiceContracts = unitContracts.map(({ id, practiceId, relativePath }) => ({
      id: practiceId,
      prerequisite: id,
      prerequisitePath: relativePath.replace(/\.mdx$/, '/'),
    }));

    for (const english of [false, true]) {
      const localePrefix = english ? 'en/' : '';
      const source = await readSource('practice.mdx', english);
      const entries = [...source.matchAll(
        /^## (PB-R2-0(?:07|08|09|10|11))[^\n]*\n([\s\S]*?)(?=^## PB-|^## (?:复核记录|Review record)|\Z)/gm,
      )].map(([, id, content]) => ({ id, content }));
      expect(entries.map(({ id }) => id)).toEqual(practiceContracts.map(({ id }) => id));

      for (const contract of practiceContracts) {
        const entry = entries.find(({ id }) => id === contract.id);
        expect(entry, `${localePrefix}${contract.id}`).not.toBeUndefined();
        const text = entry?.content ?? '';
        const prerequisiteRoute = `/${localePrefix}${contract.prerequisitePath}`;

        expect(text).toContain(contract.prerequisite);
        expect(text).toMatch(/Direct prerequisite|直接先修条件/);
        expect(text).toMatch(/Hardware gate|硬件门槛/);
        expect(text).toMatch(/Constraints|约束/);
        expect(text).toMatch(/Expected evidence|预期证据/);
        expect(text).toMatch(/Acceptance criteria|验收条件/);
        expect(text).toMatch(/Hint 1|提示 1/);
        expect(text).toMatch(/Hint 2|提示 2/);
        expect(text).toMatch(/Reviewed solution|参考解答/);
        expect(text).toMatch(/Source basis|来源依据/);
        expect(text).toMatch(/Source date|来源日期/);
        expect(text).toContain(reviewDate);
        expect(text).toContain(`](${prerequisiteRoute})`);
      }
    }
  });
});

describe('VIS09 static evidence-neutral contract', () => {
  it.each(['/visuals/artifact-pipeline/', '/en/visuals/artifact-pipeline/'])(
    'publishes the complete static flow without CUDA evidence at $route',
    async (route) => {
      const document = await readRoute(route);
      const visual = document.querySelector('cuda-artifact-pipeline[data-visual-id="VIS09"]');

      expect(visual).not.toBeNull();
      expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
      expect(visual?.querySelectorAll('[data-static-selection]')).toHaveLength(14);
      expect(visual?.querySelectorAll('[data-static-stage]')).toHaveLength(98);
      expect(visual?.querySelectorAll('[data-static-mode="whole-program"]')).toHaveLength(7);
      expect(visual?.querySelectorAll('[data-static-mode="separate-compilation-rdc"]')).toHaveLength(7);
      expect(visual?.querySelectorAll('[data-static-mode="whole-program"] [data-stage-id="optional-device-link"][data-stage-state="skipped"]')).toHaveLength(7);
      expect(visual?.querySelectorAll('[data-static-mode="separate-compilation-rdc"] [data-stage-id="optional-device-link"][data-stage-state="complete"]')).toHaveLength(7);
      expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
      expect(visual?.querySelector('[data-live-workbench][hidden]')).not.toBeNull();
      expect(visual?.getAttribute('data-runtime-image-selection')).toBe('unknown');
      expect(visual?.querySelector('[data-measured], [data-observed-artifact], [data-runtime-selected-image]')).toBeNull();
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Compile-Checked');
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Community-Observed');
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Runtime-Verified');
      for (const name of [
        'cuda:evidence-compilation',
        'cuda:evidence-runtime',
        'cuda:expected-observations',
        'cuda:recorded-observations',
      ]) {
        expect(metadata(document, name), `${route}: ${name}`).toBe('none');
      }
    },
  );
});
