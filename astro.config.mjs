// SPDX-License-Identifier: Apache-2.0
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';

function focusableMarkdownTables() {
  return (tree) => {
    const nodes = [tree];
    while (nodes.length > 0) {
      const node = nodes.pop();
      if (node?.type === 'element' && node.tagName === 'table') {
        node.properties = { ...node.properties, tabIndex: 0 };
      }
      if (Array.isArray(node?.children)) nodes.push(...node.children);
    }
  };
}

export default defineConfig({
  site: 'https://cuda-learning-site.hmzhangxiang.workers.dev',
  output: 'static',
  outDir: './dist',
  trailingSlash: 'always',
  prerenderConflictBehavior: 'error',
  markdown: {
    processor: unified({ rehypePlugins: [focusableMarkdownTables] }),
  },
  integrations: [
    starlight({
      title: {
        'zh-CN': 'CUDA 学习站',
        en: 'CUDA Learning Site',
      },
      defaultLocale: 'root',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
        en: { label: 'English', lang: 'en' },
      },
      prerender: true,
      pagefind: true,
      expressiveCode: {
        defaultProps: { wrap: true },
      },
      disable404Route: true,
      customCss: ['./src/styles/site.css'],
      components: {
        PageTitle: './src/components/SearchablePageTitle.astro',
        Banner: './src/components/ThemeFallbackBanner.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      sidebar: [
        {
          label: '从这里开始',
          translations: { en: 'Start Here' },
          items: [
            { slug: 'start/using-the-learning-site' },
            { slug: 'start/evidence-status' },
            { slug: 'start/environment-manifest' },
            { slug: 'start/cpp17-for-cuda' },
            { slug: 'start/linux-command-line' },
            { slug: 'start/architecture-refresher' },
            { slug: 'start/programmable-gpus' },
            { slug: 'start/reference-environment-candidate' },
          ],
        },
        {
          label: '基础课程',
          translations: { en: 'Foundations' },
          items: [
            { slug: 'foundations/first-cuda-kernel' },
            { slug: 'foundations/execution-hierarchy' },
            { slug: 'foundations/multidimensional-indexing' },
            { slug: 'foundations/host-device-lifecycle' },
            { slug: 'foundations/asynchronous-errors' },
            { slug: 'foundations/compute-capability' },
            { slug: 'foundations/runtime-driver-api' },
            { slug: 'foundations/launch-geometry' },
          ],
        },
        {
          label: '内存模型',
          translations: { en: 'Memory Models' },
          items: [
            { slug: 'memory/address-spaces' },
            { slug: 'memory/coalescing-transactions' },
            { slug: 'memory/shared-memory-tiling' },
            { slug: 'memory/bank-conflicts-layouts' },
            { slug: 'memory/synchronization-scopes' },
            { slug: 'memory/warp-divergence-reconvergence' },
            { slug: 'memory/stream-ordering' },
            { slug: 'memory/event-dependencies-timing' },
            { slug: 'memory/pinned-memory-transfer-overlap' },
            { slug: 'memory/unified-memory-page-migration' },
            { slug: 'memory/stream-ordered-allocation-memory-pools' },
            { slug: 'memory/cooperative-groups' },
            { slug: 'memory/asynchronous-copy-pipelines' },
            { slug: 'memory/cuda-graphs' },
          ],
        },
        {
          label: '工具链',
          translations: { en: 'Toolchain' },
          items: [
            { slug: 'toolchain/nvcc-compilation-flow' },
            { slug: 'toolchain/ptx-cubin-fatbinary' },
            { slug: 'toolchain/compiler-architecture-targets' },
            { slug: 'toolchain/separate-compilation-device-linking' },
            { slug: 'toolchain/cpp-dialect-boundaries' },
          ],
        },
        {
          label: '并行算法',
          translations: { en: 'Algorithms' },
          items: [
            { slug: 'algorithms/elementwise-map' },
            { slug: 'algorithms/multi-stage-reduction' },
            { slug: 'algorithms/inclusive-exclusive-scan' },
            { slug: 'algorithms/privatized-histogram' },
            { slug: 'algorithms/matrix-transpose-layout' },
            { slug: 'algorithms/stencil-neighborhood-reuse' },
            { slug: 'algorithms/convolution-reuse-layout' },
            { slug: 'algorithms/tiled-gemm-correctness' },
            { slug: 'algorithms/sorting-selection-compaction' },
            { slug: 'algorithms/numerically-stable-softmax' },
            { slug: 'algorithms/attention-as-an-io-problem' },
            { slug: 'algorithms/sparse-formats-spmv' },
            { slug: 'algorithms/sparse-matrix-multiplication-preprocessing' },
            { slug: 'algorithms/algorithm-choice-arithmetic-intensity' },
          ],
        },
        {
          label: '正确性与质量',
          translations: { en: 'Correctness and Quality' },
          items: [
            { slug: 'correctness/cpu-references-tolerances-invariants' },
            { slug: 'correctness/floating-point-order-reproducibility' },
            { slug: 'correctness/memcheck-invalid-memory-access' },
            { slug: 'correctness/racecheck-initcheck-synccheck' },
            { slug: 'correctness/timing-asynchronous-gpu-work' },
            { slug: 'correctness/apod-optimization-loop' },
            { slug: 'correctness/timeline-first-nsight-systems' },
            { slug: 'correctness/kernel-first-nsight-compute' },
            { slug: 'correctness/occupancy-stalls-throughput' },
            { slug: 'correctness/roofline-arithmetic-intensity' },
            { slug: 'correctness/transpose-optimization-case-study' },
            { slug: 'correctness/reduction-optimization-case-study' },
            { slug: 'correctness/gemm-optimization-case-study' },
          ],
        },
        {
          label: '可复用库',
          translations: { en: 'Reusable Libraries' },
          items: [
            { slug: 'libraries/library-primitive-dsl-custom-kernel' },
            { slug: 'libraries/thrust-algorithm-vocabulary' },
            { slug: 'libraries/cub-device-primitives' },
            { slug: 'libraries/cub-warp-block-primitives' },
            { slug: 'libraries/libcu-plus-plus-synchronization' },
          ],
        },
        {
          label: '可运行示例',
          translations: { en: 'Runnable Examples' },
          items: [
            { slug: 'examples/environment-report' },
            { slug: 'examples/vector-addition' },
            { slug: 'examples/multidimensional-indexing' },
            { slug: 'examples/error-handling-lifecycle' },
            { slug: 'examples/coalesced-strided-access' },
            { slug: 'examples/shared-memory-tile-bank-padding' },
            { slug: 'examples/streams-events-overlap' },
            { slug: 'examples/unified-memory-migration' },
            { slug: 'examples/graph-capture' },
            { slug: 'examples/ptx-fatbinary-inspection' },
            { slug: 'examples/multi-stage-reduction' },
            { slug: 'examples/inclusive-exclusive-scan' },
            { slug: 'examples/privatized-histogram' },
            { slug: 'examples/tiled-transpose' },
            { slug: 'examples/tiled-gemm' },
            { slug: 'examples/sanitizer-defect-suite' },
            { slug: 'examples/cub-device-reduction-scan' },
          ],
        },
        {
          label: '实验',
          translations: { en: 'Labs' },
          items: [
            { slug: 'labs' },
            { slug: 'labs/record-cuda-environment' },
            { slug: 'labs/vector-addition' },
            { slug: 'labs/break-and-repair-indexing' },
            { slug: 'labs/observe-coalescing' },
            { slug: 'labs/remove-shared-memory-bank-conflicts' },
            { slug: 'labs/build-overlapped-pipeline' },
            { slug: 'labs/diagnose-four-sanitizer-failures' },
            { slug: 'labs/profile-full-application-before-kernel' },
            { slug: 'labs/build-original-roofline' },
            { slug: 'labs/optimize-canonical-transpose' },
            { slug: 'labs/compare-custom-reduction-with-cub' },
          ],
        },
        {
          label: '可视化讲解',
          translations: { en: 'Visual Explainers' },
          items: [
            { slug: 'visuals' },
            { slug: 'visuals/kernel-journey' },
            { slug: 'visuals/indexing' },
            { slug: 'visuals/warp-divergence' },
            { slug: 'visuals/memory-transactions' },
            { slug: 'visuals/shared-memory-banks' },
            { slug: 'visuals/memory-hierarchy-lifetime' },
            { slug: 'visuals/stream-event-dependencies' },
            { slug: 'visuals/page-migration' },
            { slug: 'visuals/artifact-pipeline' },
            { slug: 'visuals/reduction-stages' },
            { slug: 'visuals/tiled-transpose' },
            { slug: 'visuals/gemm-tiling-hierarchy' },
            { slug: 'visuals/roofline' },
            { slug: 'visuals/nsight-systems-versus-nsight-compute' },
            { slug: 'visuals/attention-memory-traffic' },
          ],
        },
        { slug: 'practice' },
        { slug: 'glossary' },
        { slug: 'sources-and-versions' },
        { slug: 'about' },
      ],
    }),
  ],
});
