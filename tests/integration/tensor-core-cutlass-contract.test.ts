// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const root = path.resolve(import.meta.dirname, '../..');
const commit = 'dcf215af68a2d08d305076c152a06f201728cd53';
const owner = `https://github.com/NVIDIA/cutlass/blob/${commit}/`;
const units = [
  { id: 'L08', slug: 'libraries/tensor-core-precision-contracts', prerequisites: ['Q02', 'L06', 'F06'], practice: 'PB-R4-009' },
  { id: 'L09', slug: 'libraries/cutlass-cpp-gemm-structure', prerequisites: ['A08', 'L06', 'M17'], practice: 'PB-R4-010' },
];

async function readRoute(route: string) {
  return parseHTML(await readFile(path.join(root, 'dist', route, 'index.html'), 'utf8')).document;
}

function codeValues(element: ParentNode) {
  return [...element.querySelectorAll('code')].map((node) => node.textContent);
}

describe('issue #37 Tensor Core precision and CUTLASS C++ contracts', () => {
  it.each(units)('$id preserves exact prerequisites, paired sources, and evidence-neutral practice', async (unit) => {
    expect(PUBLISHED_DESTINATIONS[unit.id].prerequisites).toEqual(unit.prerequisites);
    const pages = await Promise.all(['', 'en/'].map(async (locale) => parseFrontmatter(await readFile(
      path.join(root, 'src/content/docs', locale, `${unit.slug}.mdx`), 'utf8',
    ))));
    for (const field of ['structure', 'prerequisites', 'relatedUnits', 'sources', 'factCheckDate', 'evidence']) {
      expect(pages[0].frontmatter[field], `${unit.id}: ${field}`).toEqual(pages[1].frontmatter[field]);
    }
    expect(pages[0].frontmatter.evidence).toEqual({
      compilation: [], runtime: [], expectedObservations: [], recordedObservations: [],
    });
    const practice = RESOURCE_INDEX_RECORDS.find((record) => record.planningId === unit.practice);
    expect(practice?.prerequisites).toEqual([unit.id]);
    for (const locale of ['', 'en/']) {
      const document = await readRoute(`${locale}${unit.slug}`);
      expect(document.querySelector('main [data-canonical-example], main pre')).toBeNull();
      expect(document.querySelector(`main a[href="/${locale}practice/#${unit.practice.toLowerCase()}"]`)).not.toBeNull();
      expect(document.querySelector(`main a[href="/${locale}visuals/gemm-tiling-hierarchy/"]`)).not.toBeNull();
      expect(document.querySelector('main')?.textContent).toContain('1x1x1');
      for (const suffix of ['exercises', 'solutions']) {
        const set = await readRoute(`${locale}${unit.slug}/${suffix}`);
        expect(set.querySelector('meta[name="cuda:prerequisites"]')?.getAttribute('content'))
          .toBe(suffix === 'exercises' ? unit.id : `${unit.id}-EXERCISES`);
        for (const axis of ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations']) {
          expect(set.querySelector(`meta[name="cuda:${axis}"]`)?.getAttribute('content')).toBe('none');
        }
        expect(set.querySelector(`main a[href="/${locale}${unit.slug}/${suffix === 'exercises' ? 'solutions' : 'exercises'}/"]`))
          .not.toBeNull();
        const hints = [...set.querySelectorAll('main details')];
        expect(hints).toHaveLength(suffix === 'exercises' ? 6 : 0);
        for (const hint of hints) {
          expect(hint.hasAttribute('open')).toBe(false);
          expect([...hint.childNodes].filter((node) => node.nodeName !== 'SUMMARY')
            .map((node) => node.textContent).join('').trim().length).toBeGreaterThan(20);
        }
      }
    }
  });

  it('publishes the exact WMMA numerical paths instead of one undifferentiated Tensor Core gate', async () => {
    // Independent values from the reviewed C++ WMMA/PTX tables, not from catalog metadata.
    const expected = [
      ['FP16', ['__half'], ['float', '__half'], ['16x16x16', '32x8x16', '8x32x16'], ['sm_70']],
      ['BF16', ['__nv_bfloat16'], ['float'], ['16x16x16', '32x8x16', '8x32x16'], ['sm_80']],
      ['TF32', ['nvcuda::wmma::precision::tf32'], ['float'], ['16x16x8'], ['sm_80']],
      ['FP64', ['double'], ['double'], ['8x8x4'], ['sm_80']],
      ['INT8', ['signed char', 'unsigned char'], ['int'], ['16x16x16', '32x8x16', '8x32x16'], ['sm_72']],
    ];
    for (const locale of ['', 'en/']) {
      const document = await readRoute(`${locale}${units[0].slug}`);
      const table = [...document.querySelectorAll('main table')]
        .find((node) => node.querySelector('thead')?.textContent?.includes('API/PTX'));
      expect(table).toBeDefined();
      const rows = [...table!.querySelectorAll('tbody tr')].map((row) => {
        const cells = [...row.querySelectorAll('td')];
        return [cells[0].textContent, ...cells.slice(1).map(codeValues)];
      });
      expect(rows).toEqual(expected);
      const paragraphs = [...document.querySelectorAll('main p')].map((node) => node.textContent ?? '');
      const native = [...document.querySelectorAll('main tbody tr')]
        .find((row) => row.querySelector('strong')?.textContent?.includes('8.0'));
      expect(native?.querySelector('strong')?.textContent?.match(/\d+\.\d+/g)).toEqual(['8.0', '9.0', '10.0']);
      expect(paragraphs.some((text) => text.includes('8.6') && text.includes('10.3') && text.includes('12.x'))).toBe(true);
      expect(paragraphs.some((text) => text.includes('__float_to_tf32') && text.includes('float'))).toBe(true);
      expect(paragraphs.some((text) => text.includes('store_matrix_sync') && text.includes('__half*'))).toBe(true);
      expect(paragraphs.some((text) => text.includes('R_original') && text.includes('R_stored'))).toBe(true);
      expect(paragraphs.some((text) => text.includes('ldm') && text.includes('256') && text.includes('32'))).toBe(true);
      expect(paragraphs.some((text) => text.includes('2^-12') && text.includes('2^-10'))).toBe(true);
    }
  });

  it('states write completion before publication and read completion before storage reuse in Chinese solutions', async () => {
    for (const { slug } of units) {
      const document = await readRoute(`${slug}/solutions`);
      const text = document.querySelector('main')?.textContent ?? '';
      expect(text).toContain('写入完成并发布后再读取');
      expect(text).toContain('全部消费者读取完成后再复用存储');
      expect(text).not.toContain('写前发布');
      const english = await readRoute(`en/${slug}`);
      const link = english.querySelector('[data-locale-counterpart]');
      expect(link?.getAttribute('lang')).toBe('zh-CN');
      expect(link?.textContent).toBe('阅读中文对应页');
    }
  });

  it('keeps paired numerical and hierarchy tables technically identical through rendering', async () => {
    for (const { slug } of units) {
      for (const suffix of ['', '/exercises', '/solutions']) {
        const documents = await Promise.all(['', 'en/'].map((locale) => readRoute(`${locale}${slug}${suffix}`)));
        const tables = documents.map((document) => [...document.querySelectorAll('main table')]
          .map((table) => [...table.querySelectorAll('tr')].map(codeValues)));
        expect(tables[0], `${slug}${suffix}: paired table code`).toEqual(tables[1]);
        const links = documents.map((document) => [...new Set([...document.querySelectorAll('main a[href]')]
          .map((link) => link.getAttribute('href')!).filter((href) => href.startsWith('https://')))].sort());
        expect(links[0], `${slug}${suffix}: exact owner links`).toEqual(links[1]);
      }
    }
  });

  it('maps hierarchy, layout, pipeline and API generations to specific reviewed C++ sources', async () => {
    for (const locale of ['', 'en/']) {
      const document = await readRoute(`${locale}${units[1].slug}`);
      const hrefs = [...document.querySelectorAll('main a[href]')].map((link) => link.getAttribute('href')!);
      for (const file of [
        'gemm/device/gemm.h', 'gemm/kernel/gemm.h', 'gemm/threadblock/mma_pipelined.h',
        'gemm/warp/mma_tensor_op.h', 'arch/mma_sm75.h', 'layout/matrix.h',
        'epilogue/thread/linear_combination.h', 'gemm/device/gemm_universal_adapter.h',
      ]) {
        expect(hrefs.some((href) => href.startsWith(`${owner}include/cutlass/${file}#L`)), file).toBe(true);
      }
      const text = document.querySelector('main')?.textContent ?? '';
      for (const coordinate of [
        'mma.sync.aligned.m16n8k8.row.col.f32.f16.f16.f32', '16x8x8', '16x16x16', '1x1x1',
        'can_implement', 'GemmUniversalAdapter', 'Collective', 'Tiled MMA/Copy', 'Atom',
        '150', '90', '40', '22x26', '14393', '4096', '8192',
      ]) expect(text, coordinate).toContain(coordinate);
      for (const prerequisite of ['algorithms/tiled-gemm-correctness', 'libraries/cublas-gemm', 'toolchain/compiler-architecture-targets']) {
        expect(hrefs).toContain(`/${locale}${prerequisite}/`);
      }
      for (const issue of ['3179', '3516', '2152']) {
        expect(hrefs).toContain(`https://github.com/NVIDIA/cutlass/issues/${issue}`);
      }
      for (const href of hrefs.filter((href) => href.startsWith('https://github.com/NVIDIA/cutlass/blob/'))) {
        expect(href.startsWith(owner), href).toBe(true);
      }
    }
  });

  it('retains a nineteen-file per-file license ledger and excludes separately licensed DSL adoption', async () => {
    for (const locale of ['', 'en/']) {
      const document = await readRoute(`${locale}sources-and-versions`);
      const table = [...document.querySelectorAll('main table')].find((node) =>
        node.querySelector(`a[href="${owner}include/cutlass/gemm/kernel/gemm_universal.hpp"]`));
      const rows = [...table!.querySelectorAll('tbody tr')];
      expect(rows).toHaveLength(19);
      for (const row of rows) {
        const href = row.querySelector('a')?.getAttribute('href') ?? '';
        expect(href.startsWith(owner)).toBe(true);
        const copyright = row.querySelector('td:last-child')?.textContent;
        expect(copyright).toBe(href.endsWith('/gemm_universal.hpp') ? '2023 - 2026' : '2017 - 2026');
      }
      expect(document.querySelector(`main a[href="${owner}LICENSE.txt"]`)).not.toBeNull();
      expect(document.querySelector(`main a[href="${owner}media/docs/pythonDSL/license.rst"]`)).not.toBeNull();
    }
    const manifest = JSON.parse(await readFile(path.join(root, 'src/current-publication-manifest.json'), 'utf8'));
    expect(manifest.compatibility.componentBoundaries.cutlassCpp).toMatchObject({
      version: '4.7.0', commit, selection: 'independent-reference-only', pythonDslIncluded: false,
      compileCheckedToolkitLanes: [], proposedBuildTarget: {
        toolkit: '13.3.1', nvcc: '13.3.73', hostCompiler: 'GCC 13.3.0', dialect: 'c++17', architecture: 'sm_75', status: 'not-built',
      },
    });
    expect(manifest.evidence.r4EvidenceNeutralLearningUnits).toEqual(expect.arrayContaining(['L08', 'L09']));
    expect(manifest.evidence.runtimeVerified).toEqual([]);
    expect(manifest.evidence.performanceObservations).toEqual([]);
    for (const file of ['CONTENT_LICENSES.md', 'THIRD_PARTY_NOTICES.md']) {
      const text = await readFile(path.join(root, file), 'utf8');
      expect(text).toContain(commit);
      expect(text).toContain('BSD-3-Clause');
      expect(text).toContain('Python DSL');
    }
  });
});
