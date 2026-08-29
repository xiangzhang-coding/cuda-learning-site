// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';
import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

test('all published routes load without browser errors', async ({ page }) => {
  test.setTimeout(270_000);
  const errors = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  const routes = await discoverPublishedRoutes();
  expect(routes).toHaveLength(262);
  expect(routes.filter((route) => !route.startsWith('/en/'))).toHaveLength(131);

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator('site-search input'), `${route} initializes static search`).toHaveCount(1);
    expect(errors, route).toEqual([]);
  }
});

test('locale controls keep the learner on the counterpart page', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  for (const { zh, en } of [
    { zh: '/start/using-the-learning-site/', en: '/en/start/using-the-learning-site/' },
    { zh: '/start/evidence-status/', en: '/en/start/evidence-status/' },
    { zh: '/start/environment-manifest/', en: '/en/start/environment-manifest/' },
    { zh: '/foundations/first-cuda-kernel/', en: '/en/foundations/first-cuda-kernel/' },
    { zh: '/foundations/execution-hierarchy/', en: '/en/foundations/execution-hierarchy/' },
    { zh: '/foundations/multidimensional-indexing/', en: '/en/foundations/multidimensional-indexing/' },
    { zh: '/foundations/host-device-lifecycle/', en: '/en/foundations/host-device-lifecycle/' },
    { zh: '/foundations/asynchronous-errors/', en: '/en/foundations/asynchronous-errors/' },
    { zh: '/foundations/asynchronous-errors/exercises/', en: '/en/foundations/asynchronous-errors/exercises/' },
    { zh: '/foundations/asynchronous-errors/solutions/', en: '/en/foundations/asynchronous-errors/solutions/' },
    { zh: '/foundations/compute-capability/', en: '/en/foundations/compute-capability/' },
    { zh: '/foundations/compute-capability/exercises/', en: '/en/foundations/compute-capability/exercises/' },
    { zh: '/foundations/compute-capability/solutions/', en: '/en/foundations/compute-capability/solutions/' },
    { zh: '/foundations/runtime-driver-api/', en: '/en/foundations/runtime-driver-api/' },
    { zh: '/foundations/runtime-driver-api/exercises/', en: '/en/foundations/runtime-driver-api/exercises/' },
    { zh: '/foundations/runtime-driver-api/solutions/', en: '/en/foundations/runtime-driver-api/solutions/' },
    { zh: '/foundations/launch-geometry/', en: '/en/foundations/launch-geometry/' },
    { zh: '/foundations/launch-geometry/exercises/', en: '/en/foundations/launch-geometry/exercises/' },
    { zh: '/foundations/launch-geometry/solutions/', en: '/en/foundations/launch-geometry/solutions/' },
    { zh: '/memory/address-spaces/', en: '/en/memory/address-spaces/' },
    { zh: '/memory/address-spaces/exercises/', en: '/en/memory/address-spaces/exercises/' },
    { zh: '/memory/address-spaces/solutions/', en: '/en/memory/address-spaces/solutions/' },
    { zh: '/memory/coalescing-transactions/', en: '/en/memory/coalescing-transactions/' },
    { zh: '/memory/shared-memory-tiling/', en: '/en/memory/shared-memory-tiling/' },
    { zh: '/memory/bank-conflicts-layouts/', en: '/en/memory/bank-conflicts-layouts/' },
    { zh: '/memory/synchronization-scopes/', en: '/en/memory/synchronization-scopes/' },
    { zh: '/memory/synchronization-scopes/exercises/', en: '/en/memory/synchronization-scopes/exercises/' },
    { zh: '/memory/synchronization-scopes/solutions/', en: '/en/memory/synchronization-scopes/solutions/' },
    { zh: '/memory/warp-divergence-reconvergence/', en: '/en/memory/warp-divergence-reconvergence/' },
    { zh: '/memory/warp-divergence-reconvergence/exercises/', en: '/en/memory/warp-divergence-reconvergence/exercises/' },
    { zh: '/memory/warp-divergence-reconvergence/solutions/', en: '/en/memory/warp-divergence-reconvergence/solutions/' },
    { zh: '/memory/stream-ordering/', en: '/en/memory/stream-ordering/' },
    { zh: '/memory/stream-ordering/exercises/', en: '/en/memory/stream-ordering/exercises/' },
    { zh: '/memory/stream-ordering/solutions/', en: '/en/memory/stream-ordering/solutions/' },
    { zh: '/memory/event-dependencies-timing/', en: '/en/memory/event-dependencies-timing/' },
    { zh: '/memory/event-dependencies-timing/exercises/', en: '/en/memory/event-dependencies-timing/exercises/' },
    { zh: '/memory/event-dependencies-timing/solutions/', en: '/en/memory/event-dependencies-timing/solutions/' },
    { zh: '/memory/pinned-memory-transfer-overlap/', en: '/en/memory/pinned-memory-transfer-overlap/' },
    { zh: '/memory/unified-memory-page-migration/', en: '/en/memory/unified-memory-page-migration/' },
    { zh: '/memory/stream-ordered-allocation-memory-pools/', en: '/en/memory/stream-ordered-allocation-memory-pools/' },
    { zh: '/memory/cooperative-groups/', en: '/en/memory/cooperative-groups/' },
    { zh: '/memory/asynchronous-copy-pipelines/', en: '/en/memory/asynchronous-copy-pipelines/' },
    { zh: '/memory/cuda-graphs/', en: '/en/memory/cuda-graphs/' },
    { zh: '/correctness/cpu-references-tolerances-invariants/', en: '/en/correctness/cpu-references-tolerances-invariants/' },
    { zh: '/correctness/cpu-references-tolerances-invariants/exercises/', en: '/en/correctness/cpu-references-tolerances-invariants/exercises/' },
    { zh: '/correctness/cpu-references-tolerances-invariants/solutions/', en: '/en/correctness/cpu-references-tolerances-invariants/solutions/' },
    { zh: '/correctness/memcheck-invalid-memory-access/', en: '/en/correctness/memcheck-invalid-memory-access/' },
    { zh: '/correctness/memcheck-invalid-memory-access/exercises/', en: '/en/correctness/memcheck-invalid-memory-access/exercises/' },
    { zh: '/correctness/memcheck-invalid-memory-access/solutions/', en: '/en/correctness/memcheck-invalid-memory-access/solutions/' },
    { zh: '/correctness/racecheck-initcheck-synccheck/', en: '/en/correctness/racecheck-initcheck-synccheck/' },
    { zh: '/correctness/racecheck-initcheck-synccheck/exercises/', en: '/en/correctness/racecheck-initcheck-synccheck/exercises/' },
    { zh: '/correctness/racecheck-initcheck-synccheck/solutions/', en: '/en/correctness/racecheck-initcheck-synccheck/solutions/' },
    { zh: '/correctness/timing-asynchronous-gpu-work/', en: '/en/correctness/timing-asynchronous-gpu-work/' },
    { zh: '/correctness/timing-asynchronous-gpu-work/exercises/', en: '/en/correctness/timing-asynchronous-gpu-work/exercises/' },
    { zh: '/correctness/timing-asynchronous-gpu-work/solutions/', en: '/en/correctness/timing-asynchronous-gpu-work/solutions/' },
    { zh: '/examples/vector-addition/', en: '/en/examples/vector-addition/' },
    { zh: '/examples/multidimensional-indexing/', en: '/en/examples/multidimensional-indexing/' },
    { zh: '/examples/error-handling-lifecycle/', en: '/en/examples/error-handling-lifecycle/' },
    { zh: '/examples/coalesced-strided-access/', en: '/en/examples/coalesced-strided-access/' },
    { zh: '/examples/shared-memory-tile-bank-padding/', en: '/en/examples/shared-memory-tile-bank-padding/' },
    { zh: '/examples/streams-events-overlap/', en: '/en/examples/streams-events-overlap/' },
    { zh: '/examples/unified-memory-migration/', en: '/en/examples/unified-memory-migration/' },
    { zh: '/examples/graph-capture/', en: '/en/examples/graph-capture/' },
    { zh: '/examples/sanitizer-defect-suite/', en: '/en/examples/sanitizer-defect-suite/' },
    { zh: '/labs/', en: '/en/labs/' },
    { zh: '/labs/vector-addition/', en: '/en/labs/vector-addition/' },
    { zh: '/labs/break-and-repair-indexing/', en: '/en/labs/break-and-repair-indexing/' },
    { zh: '/labs/observe-coalescing/', en: '/en/labs/observe-coalescing/' },
    { zh: '/labs/remove-shared-memory-bank-conflicts/', en: '/en/labs/remove-shared-memory-bank-conflicts/' },
    { zh: '/labs/diagnose-four-sanitizer-failures/', en: '/en/labs/diagnose-four-sanitizer-failures/' },
    { zh: '/visuals/', en: '/en/visuals/' },
    { zh: '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
    { zh: '/visuals/indexing/', en: '/en/visuals/indexing/' },
    { zh: '/visuals/warp-divergence/', en: '/en/visuals/warp-divergence/' },
    { zh: '/visuals/memory-transactions/', en: '/en/visuals/memory-transactions/' },
    { zh: '/visuals/shared-memory-banks/', en: '/en/visuals/shared-memory-banks/' },
    { zh: '/visuals/memory-hierarchy-lifetime/', en: '/en/visuals/memory-hierarchy-lifetime/' },
    { zh: '/visuals/stream-event-dependencies/', en: '/en/visuals/stream-event-dependencies/' },
    { zh: '/visuals/page-migration/', en: '/en/visuals/page-migration/' },
    { zh: '/practice/', en: '/en/practice/' },
    { zh: '/glossary/', en: '/en/glossary/' },
    { zh: '/sources-and-versions/', en: '/en/sources-and-versions/' },
  ]) {
    await page.goto(zh);
    await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', en);

    if (testInfo.project.name === 'mobile-safari') {
      await page.locator('[data-locale-counterpart]').click();
    } else {
      await page.getByRole('banner').locator('starlight-lang-select select').selectOption(en);
    }
    await expect(page).toHaveURL(new RegExp(`${en}$`));
    await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', zh);
  }
});

test('Chinese and English searches stay in their language index', async ({ page }) => {
  test.setTimeout(120_000);
  for (const scenario of [
    { route: '/', button: /搜索/, query: '双语发布对', localePrefix: '/', expectedHrefs: ['/start/using-the-learning-site/', '/practice/', '/glossary/'] },
    { route: '/', button: /搜索/, query: '环境清单', localePrefix: '/', expectedHrefs: ['/start/environment-manifest/', '/labs/record-cuda-environment/', '/practice/', '/glossary/'] },
    { route: '/', button: /搜索/, query: '内存事务', localePrefix: '/', expectedHrefs: ['/glossary/', '/visuals/kernel-journey/', '/memory/shared-memory-tiling/'] },
    { route: '/', button: /搜索/, query: '第一个 CUDA kernel', localePrefix: '/', expectedHrefs: ['/foundations/first-cuda-kernel/'] },
    { route: '/', button: /搜索/, query: '理解 CUDA 执行层次', localePrefix: '/', expectedHrefs: ['/foundations/execution-hierarchy/'] },
    { route: '/', button: /搜索/, query: '多维索引 边界 正确性合同', localePrefix: '/', expectedHrefs: ['/foundations/multidimensional-indexing/', '/examples/multidimensional-indexing/'] },
    { route: '/', button: /搜索/, query: '显式 host-device 资源生命周期', localePrefix: '/', expectedHrefs: ['/foundations/host-device-lifecycle/'] },
    { route: '/', button: /搜索/, query: 'CUDA 错误为何常常延后暴露', localePrefix: '/', expectedHrefs: ['/foundations/asynchronous-errors/', '/foundations/asynchronous-errors/exercises/', '/foundations/asynchronous-errors/solutions/'] },
    { route: '/', button: /搜索/, query: 'Launch geometry 是先于速度的正确性与资源决策', localePrefix: '/', expectedHrefs: ['/foundations/launch-geometry/', '/foundations/launch-geometry/exercises/', '/foundations/launch-geometry/solutions/'] },
    { route: '/', button: /搜索/, query: 'EX04 错误处理生命周期', localePrefix: '/', expectedHrefs: ['/examples/error-handling-lifecycle/'] },
    { route: '/', button: /搜索/, query: '地址空间 所有权 作用域 生命周期', localePrefix: '/', expectedHrefs: ['/memory/address-spaces/'] },
    { route: '/', button: /搜索/, query: 'bank conflict 布局变换', localePrefix: '/', expectedHrefs: ['/memory/bank-conflicts-layouts/'] },
    { route: '/', button: /搜索/, query: '同步作用域 内存可见性', localePrefix: '/', expectedHrefs: ['/memory/synchronization-scopes/'] },
    { route: '/', button: /搜索/, query: 'Warp divergence 逻辑汇合', localePrefix: '/', expectedHrefs: ['/visuals/warp-divergence/', '/memory/warp-divergence-reconvergence/'] },
    { route: '/', button: /搜索/, query: '可信的 CUDA 结果', localePrefix: '/', expectedHrefs: ['/correctness/cpu-references-tolerances-invariants/'] },
    { route: '/', button: /搜索/, query: 'Q04 racecheck initcheck synccheck 定位缺陷', localePrefix: '/', expectedHrefs: ['/correctness/racecheck-initcheck-synccheck/'] },
    { route: '/', button: /搜索/, query: 'LAB04 观察合并访问', localePrefix: '/', expectedHrefs: ['/labs/observe-coalescing/'] },
    { route: '/', button: /搜索/, query: 'LAB07 诊断四类 Sanitizer 故障', localePrefix: '/', expectedHrefs: ['/labs/diagnose-four-sanitizer-failures/'] },
    { route: '/', button: /搜索/, query: '运行并验证向量加法', localePrefix: '/', expectedHrefs: ['/labs/vector-addition/'] },
    { route: '/', button: /搜索/, query: '可复现命令记录', localePrefix: '/', expectedHrefs: ['/start/linux-command-line/', '/glossary/'] },
    { route: '/', button: /搜索/, query: '基准环境候选配置', localePrefix: '/', expectedHrefs: ['/start/reference-environment-candidate/', '/labs/record-cuda-environment/'] },
    { route: '/', button: /搜索/, query: 'TERM-034 容差', localePrefix: '/', expectedHrefs: ['/glossary/'] },
    { route: '/', button: /搜索/, query: 'M09 页锁定内存与传输重叠', localePrefix: '/', expectedHrefs: ['/memory/pinned-memory-transfer-overlap/'] },
    { route: '/', button: /搜索/, query: 'M11 流顺序分配与内存池', localePrefix: '/', expectedHrefs: ['/memory/stream-ordered-allocation-memory-pools/'] },
    { route: '/', button: /搜索/, query: 'M13 异步复制与分阶段流水线', localePrefix: '/', expectedHrefs: ['/memory/asynchronous-copy-pipelines/'] },
    { route: '/', button: /搜索/, query: 'EX08 统一内存迁移可运行示例', localePrefix: '/', expectedHrefs: ['/examples/unified-memory-migration/'] },
    { route: '/', button: /搜索/, query: 'VIS08 托管内存页面迁移', localePrefix: '/', expectedHrefs: ['/visuals/page-migration/'] },
    { route: '/en/', button: /Search/, query: 'Publication Pair', localePrefix: '/en/', expectedHrefs: ['/en/start/using-the-learning-site/', '/en/practice/', '/en/glossary/'] },
    { route: '/en/', button: /Search/, query: 'Recording Evidence Honestly', localePrefix: '/en/', expectedHrefs: ['/en/start/evidence-status/'] },
    { route: '/en/', button: /Search/, query: 'row-major data index', localePrefix: '/en/', expectedHrefs: ['/en/visuals/indexing/'] },
    { route: '/en/', button: /Search/, query: 'first CUDA kernel', localePrefix: '/en/', expectedHrefs: ['/en/foundations/first-cuda-kernel/'] },
    { route: '/en/', button: /Search/, query: 'Understanding the CUDA Execution Hierarchy', localePrefix: '/en/', expectedHrefs: ['/en/foundations/execution-hierarchy/'] },
    { route: '/en/', button: /Search/, query: 'multidimensional indexing bounds correctness contract', localePrefix: '/en/', expectedHrefs: ['/en/foundations/multidimensional-indexing/', '/en/examples/multidimensional-indexing/'] },
    { route: '/en/', button: /Search/, query: 'explicit host-device resource lifecycle', localePrefix: '/en/', expectedHrefs: ['/en/foundations/host-device-lifecycle/'] },
    { route: '/en/', button: /Search/, query: 'Compute Capability Is a Feature Contract', localePrefix: '/en/', expectedHrefs: ['/en/foundations/compute-capability/', '/en/foundations/compute-capability/exercises/', '/en/foundations/compute-capability/solutions/'] },
    { route: '/en/', button: /Search/, query: 'Distinguish CUDA Runtime API and Driver API Roles', localePrefix: '/en/', expectedHrefs: ['/en/foundations/runtime-driver-api/', '/en/foundations/runtime-driver-api/exercises/', '/en/foundations/runtime-driver-api/solutions/'] },
    { route: '/en/', button: /Search/, query: 'Break and Repair Indexing', localePrefix: '/en/', expectedHrefs: ['/en/labs/break-and-repair-indexing/'] },
    { route: '/en/', button: /Search/, query: 'Coalescing as transaction shaping', localePrefix: '/en/', expectedHrefs: ['/en/memory/coalescing-transactions/'] },
    { route: '/en/', button: /Search/, query: 'Shared-memory tiling', localePrefix: '/en/', expectedHrefs: ['/en/memory/shared-memory-tiling/'] },
    { route: '/en/', button: /Search/, query: 'Streams replace a global-order mental model', localePrefix: '/en/', expectedHrefs: ['/en/memory/stream-ordering/'] },
    { route: '/en/', button: /Search/, query: 'Stream and Event Dependency Traces', localePrefix: '/en/', expectedHrefs: ['/en/visuals/stream-event-dependencies/'] },
    { route: '/en/', button: /Search/, query: 'Q03 Memcheck and invalid memory access', localePrefix: '/en/', expectedHrefs: ['/en/correctness/memcheck-invalid-memory-access/'] },
    { route: '/en/', button: /Search/, query: 'Q05 Time asynchronous GPU work honestly', localePrefix: '/en/', expectedHrefs: ['/en/correctness/timing-asynchronous-gpu-work/'] },
    { route: '/en/', button: /Search/, query: 'EX16 Compute Sanitizer Defect Suite Runnable Example', localePrefix: '/en/', expectedHrefs: ['/en/examples/sanitizer-defect-suite/'] },
    { route: '/en/', button: /Search/, query: 'LAB05 Remove Shared-Memory Bank Conflicts', localePrefix: '/en/', expectedHrefs: ['/en/labs/remove-shared-memory-bank-conflicts/'] },
    { route: '/en/', button: /Search/, query: 'Run and Verify Vector Addition', localePrefix: '/en/', expectedHrefs: ['/en/labs/vector-addition/'] },
    { route: '/en/', button: /Search/, query: 'arithmetic intensity occupancy', localePrefix: '/en/', expectedHrefs: ['/en/start/architecture-refresher/', '/en/start/architecture-refresher/exercises/', '/en/start/architecture-refresher/solutions/'] },
    { route: '/en/', button: /Search/, query: 'Environment Report Runnable Example', localePrefix: '/en/', expectedHrefs: ['/en/examples/environment-report/'] },
    { route: '/en/', button: /Search/, query: 'SRC-WEB-003 Pagefind 1.5.2', localePrefix: '/en/', expectedHrefs: ['/en/sources-and-versions/'] },
    { route: '/en/', button: /Search/, query: 'M10 Unified Memory and Page Migration', localePrefix: '/en/', expectedHrefs: ['/en/memory/unified-memory-page-migration/'] },
    { route: '/en/', button: /Search/, query: 'M12 Cooperative Groups and Composable Synchronization', localePrefix: '/en/', expectedHrefs: ['/en/memory/cooperative-groups/'] },
    { route: '/en/', button: /Search/, query: 'M14 CUDA Graphs and Repeated Launch Structure', localePrefix: '/en/', expectedHrefs: ['/en/memory/cuda-graphs/'] },
    { route: '/en/', button: /Search/, query: 'EX07 Streams Events Overlap Runnable Example', localePrefix: '/en/', expectedHrefs: ['/en/examples/streams-events-overlap/'] },
    { route: '/en/', button: /Search/, query: 'EX09 CUDA Graph Capture Runnable Example', localePrefix: '/en/', expectedHrefs: ['/en/examples/graph-capture/'] },
  ]) {
    await expectRankedSearchResult(page, scenario);
  }
});

test('keyboard focus is visible from the first tab stop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  await page.goto('/en/start/using-the-learning-site/');
  await page.keyboard.press(testInfo.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');

  const skipLink = page.locator('.sl-skip-link');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  expect(
    await skipLink.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth)),
  ).toBeGreaterThan(0);
});

test('navigation remains usable without horizontal overflow', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  for (const route of [
    '/',
    '/en/',
    '/start/using-the-learning-site/',
    '/en/start/using-the-learning-site/',
    '/start/evidence-status/',
    '/en/start/evidence-status/',
    '/start/environment-manifest/',
    '/en/start/environment-manifest/',
    '/foundations/first-cuda-kernel/',
    '/en/foundations/first-cuda-kernel/',
    '/foundations/first-cuda-kernel/exercises/',
    '/en/foundations/first-cuda-kernel/exercises/',
    '/foundations/first-cuda-kernel/solutions/',
    '/en/foundations/first-cuda-kernel/solutions/',
    '/foundations/execution-hierarchy/',
    '/en/foundations/execution-hierarchy/',
    '/foundations/execution-hierarchy/exercises/',
    '/en/foundations/execution-hierarchy/exercises/',
    '/foundations/execution-hierarchy/solutions/',
    '/en/foundations/execution-hierarchy/solutions/',
    '/foundations/multidimensional-indexing/',
    '/en/foundations/multidimensional-indexing/',
    '/foundations/multidimensional-indexing/exercises/',
    '/en/foundations/multidimensional-indexing/exercises/',
    '/foundations/multidimensional-indexing/solutions/',
    '/en/foundations/multidimensional-indexing/solutions/',
    '/foundations/host-device-lifecycle/',
    '/en/foundations/host-device-lifecycle/',
    '/foundations/host-device-lifecycle/exercises/',
    '/en/foundations/host-device-lifecycle/exercises/',
    '/foundations/host-device-lifecycle/solutions/',
    '/en/foundations/host-device-lifecycle/solutions/',
    '/foundations/asynchronous-errors/',
    '/en/foundations/asynchronous-errors/',
    '/foundations/compute-capability/',
    '/en/foundations/compute-capability/',
    '/foundations/runtime-driver-api/',
    '/en/foundations/runtime-driver-api/',
    '/foundations/launch-geometry/',
    '/en/foundations/launch-geometry/',
    '/memory/address-spaces/',
    '/en/memory/address-spaces/',
    '/memory/coalescing-transactions/',
    '/en/memory/coalescing-transactions/',
    '/memory/shared-memory-tiling/',
    '/en/memory/shared-memory-tiling/',
    '/memory/bank-conflicts-layouts/',
    '/en/memory/bank-conflicts-layouts/',
    '/memory/synchronization-scopes/',
    '/en/memory/synchronization-scopes/',
    '/memory/synchronization-scopes/exercises/',
    '/en/memory/synchronization-scopes/exercises/',
    '/memory/synchronization-scopes/solutions/',
    '/en/memory/synchronization-scopes/solutions/',
    '/memory/warp-divergence-reconvergence/',
    '/en/memory/warp-divergence-reconvergence/',
    '/memory/warp-divergence-reconvergence/exercises/',
    '/en/memory/warp-divergence-reconvergence/exercises/',
    '/memory/warp-divergence-reconvergence/solutions/',
    '/en/memory/warp-divergence-reconvergence/solutions/',
    '/memory/stream-ordering/',
    '/en/memory/stream-ordering/',
    '/memory/stream-ordering/exercises/',
    '/en/memory/stream-ordering/exercises/',
    '/memory/stream-ordering/solutions/',
    '/en/memory/stream-ordering/solutions/',
    '/memory/event-dependencies-timing/',
    '/en/memory/event-dependencies-timing/',
    '/memory/event-dependencies-timing/exercises/',
    '/en/memory/event-dependencies-timing/exercises/',
    '/memory/event-dependencies-timing/solutions/',
    '/en/memory/event-dependencies-timing/solutions/',
    '/memory/pinned-memory-transfer-overlap/',
    '/en/memory/pinned-memory-transfer-overlap/',
    '/memory/unified-memory-page-migration/',
    '/en/memory/unified-memory-page-migration/',
    '/memory/stream-ordered-allocation-memory-pools/',
    '/en/memory/stream-ordered-allocation-memory-pools/',
    '/memory/cooperative-groups/',
    '/en/memory/cooperative-groups/',
    '/memory/asynchronous-copy-pipelines/',
    '/en/memory/asynchronous-copy-pipelines/',
    '/memory/cuda-graphs/',
    '/en/memory/cuda-graphs/',
    '/correctness/cpu-references-tolerances-invariants/',
    '/en/correctness/cpu-references-tolerances-invariants/',
    '/correctness/cpu-references-tolerances-invariants/exercises/',
    '/en/correctness/cpu-references-tolerances-invariants/exercises/',
    '/correctness/cpu-references-tolerances-invariants/solutions/',
    '/en/correctness/cpu-references-tolerances-invariants/solutions/',
    '/correctness/memcheck-invalid-memory-access/',
    '/en/correctness/memcheck-invalid-memory-access/',
    '/correctness/memcheck-invalid-memory-access/exercises/',
    '/en/correctness/memcheck-invalid-memory-access/exercises/',
    '/correctness/memcheck-invalid-memory-access/solutions/',
    '/en/correctness/memcheck-invalid-memory-access/solutions/',
    '/correctness/racecheck-initcheck-synccheck/',
    '/en/correctness/racecheck-initcheck-synccheck/',
    '/correctness/racecheck-initcheck-synccheck/exercises/',
    '/en/correctness/racecheck-initcheck-synccheck/exercises/',
    '/correctness/racecheck-initcheck-synccheck/solutions/',
    '/en/correctness/racecheck-initcheck-synccheck/solutions/',
    '/correctness/timing-asynchronous-gpu-work/',
    '/en/correctness/timing-asynchronous-gpu-work/',
    '/correctness/timing-asynchronous-gpu-work/exercises/',
    '/en/correctness/timing-asynchronous-gpu-work/exercises/',
    '/correctness/timing-asynchronous-gpu-work/solutions/',
    '/en/correctness/timing-asynchronous-gpu-work/solutions/',
    '/examples/vector-addition/',
    '/en/examples/vector-addition/',
    '/examples/multidimensional-indexing/',
    '/en/examples/multidimensional-indexing/',
    '/examples/error-handling-lifecycle/',
    '/en/examples/error-handling-lifecycle/',
    '/examples/coalesced-strided-access/',
    '/en/examples/coalesced-strided-access/',
    '/examples/shared-memory-tile-bank-padding/',
    '/en/examples/shared-memory-tile-bank-padding/',
    '/examples/streams-events-overlap/',
    '/en/examples/streams-events-overlap/',
    '/examples/unified-memory-migration/',
    '/en/examples/unified-memory-migration/',
    '/examples/graph-capture/',
    '/en/examples/graph-capture/',
    '/examples/sanitizer-defect-suite/',
    '/en/examples/sanitizer-defect-suite/',
    '/labs/',
    '/en/labs/',
    '/labs/vector-addition/',
    '/en/labs/vector-addition/',
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
    '/labs/observe-coalescing/',
    '/en/labs/observe-coalescing/',
    '/labs/remove-shared-memory-bank-conflicts/',
    '/en/labs/remove-shared-memory-bank-conflicts/',
    '/labs/diagnose-four-sanitizer-failures/',
    '/en/labs/diagnose-four-sanitizer-failures/',
    '/visuals/',
    '/en/visuals/',
    '/visuals/kernel-journey/',
    '/en/visuals/kernel-journey/',
    '/visuals/indexing/',
    '/en/visuals/indexing/',
    '/visuals/warp-divergence/',
    '/en/visuals/warp-divergence/',
    '/visuals/memory-transactions/',
    '/en/visuals/memory-transactions/',
    '/visuals/shared-memory-banks/',
    '/en/visuals/shared-memory-banks/',
    '/visuals/memory-hierarchy-lifetime/',
    '/en/visuals/memory-hierarchy-lifetime/',
    '/visuals/stream-event-dependencies/',
    '/en/visuals/stream-event-dependencies/',
    '/visuals/page-migration/',
    '/en/visuals/page-migration/',
    '/practice/',
    '/en/practice/',
    '/glossary/',
    '/en/glossary/',
    '/sources-and-versions/',
    '/en/sources-and-versions/',
  ]) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.goto('/en/start/environment-manifest/');

  if (testInfo.project.name === 'mobile-safari') {
    await page.getByRole('button', { name: 'Menu' }).click();
  }

  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Glossary', exact: true }),
  ).toBeVisible();
});

test('print keeps content dark on a white page', async ({ page }) => {
  for (const theme of THEME_IDS) {
    await page.goto('/en/');
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, theme] as const,
    );
    await page.reload();
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.locale-pair')).toBeHidden();
    await expect(page.locator('learning-theme-select').first()).toBeHidden();
    expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).toBe(
      'rgb(255, 255, 255)',
    );
    expect(
      await page.locator('.signal-hero > p').last().evaluate((paragraph) => getComputedStyle(paragraph).color),
    ).toBe('rgb(34, 34, 34)');
    expect(await page.locator('.signal-kicker').evaluate((label) => getComputedStyle(label).color)).toBe(
      'rgb(7, 81, 89)',
    );
    expect(
      await page.locator('.signal-action').evaluate((action) => getComputedStyle(action).backgroundColor),
    ).toBe('rgb(7, 81, 89)');
    expect(await page.locator('.route-card span').first().evaluate((label) => getComputedStyle(label).color)).toBe(
      'rgb(122, 47, 28)',
    );
    await page.emulateMedia({ media: 'screen' });
  }

  for (const route of ['/foundations/first-cuda-kernel/', '/en/foundations/first-cuda-kernel/', '/foundations/first-cuda-kernel/exercises/', '/en/foundations/first-cuda-kernel/exercises/', '/foundations/first-cuda-kernel/solutions/', '/en/foundations/first-cuda-kernel/solutions/', '/foundations/execution-hierarchy/', '/en/foundations/execution-hierarchy/', '/foundations/multidimensional-indexing/', '/en/foundations/multidimensional-indexing/', '/foundations/host-device-lifecycle/', '/en/foundations/host-device-lifecycle/', '/examples/multidimensional-indexing/', '/en/examples/multidimensional-indexing/', '/labs/vector-addition/', '/en/labs/vector-addition/']) {
    await page.goto(route);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('main')).toBeVisible();
    if (!route.includes('/exercises/') && !route.includes('/solutions/') && !route.includes('/execution-hierarchy/')) {
      await expect(page.locator('.canonical-code').first()).toBeVisible();
    }
    await expect(page.locator('.locale-pair')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    await page.emulateMedia({ media: 'screen' });
  }
});
