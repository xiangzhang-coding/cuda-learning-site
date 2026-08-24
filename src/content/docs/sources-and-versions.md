---
title: 来源与版本记录
description: 当前公开路线、F01、LAB02、EX02、VIS01 与 VIS02 使用的发布接口、CUDA 版本事实、内容来源和复核日期。
pairId: sources-and-versions
counterpart: /en/sources-and-versions/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - scope
  - verified-interfaces
  - content-sources
  - review-record
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: sources-and-versions
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'scope,verified-interfaces,content-sources,review-record'
---

<a class="locale-pair" data-locale-counterpart href="/en/sources-and-versions/" lang="en">Read the English counterpart</a>

这份记录说明 CUDA 学习站（Learning Site）使用了哪些精确发布、主题与可视化接口，以及 O02/O03/F01/LAB02/EX02/VIS01/VIS02 的 CUDA 版本事实来自哪里。工具版本、浏览器表现、硬件能力、项目支持政策和实际观察始终分开记录。

## 记录范围

本页覆盖 Home、O01、O02、O03、F01、配套练习与解答、EX02、LAB02、VIS01、VIS02、练习题库（Practice Bank）、术语表（Glossary）、三套视觉主题和静态发布外壳。所有链接在 **2026-08-24** 重新打开复核；网站构建使用 Node.js 24.19.0 与 npm 11.17.0。

## 已核对的发布接口

| 接口 | 精确版本 | 核对内容 | Context7 | 上游资料 |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | 静态输出配置；MDX 中的 Astro component；经处理、打包和去重的 TypeScript client script；light-DOM custom element；首屏前 `is:inline` 脚本 | `/withastro/docs` | [npm 清单](https://registry.npmjs.org/astro/7.2.4)、[配置参考](https://docs.astro.build/en/reference/configuration-reference/)、[客户端脚本与 custom elements](https://docs.astro.build/en/guides/client-side-scripts/)、[MDX components](https://docs.astro.build/en/guides/integrations-guide/mdx/) |
| Starlight | 0.41.7 | 根语言、本地化标题、Visual Explainer 显式侧边栏、MDX component、自定义 CSS、`Banner`/`ThemeProvider`/`ThemeSelect` 组件覆写与级联层 | `/withastro/starlight` | [npm 清单](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7)、[侧边栏与本地化 slug](https://starlight.astro.build/guides/sidebar/)、[在 MDX 中使用 component](https://starlight.astro.build/components/using-components/)、[组件覆写](https://starlight.astro.build/guides/overriding-components/)、[CSS 与样式](https://starlight.astro.build/guides/css-and-tailwind/)、[国际化](https://starlight.astro.build/guides/i18n/#use-a-root-locale) |
| Pagefind | 1.5.2 | 根据 `<html lang>` 生成语言分区索引、扩展版中文分词，以及部署所需的静态 JS/Wasm/index 资源 | `/websites/pagefind_app` | [npm 清单](https://registry.npmjs.org/pagefind/1.5.2)、[多语言搜索](https://pagefind.app/docs/multilingual/)、[静态索引](https://pagefind.app/docs/running-pagefind/) |
| Cloudflare 静态发布 | Wrangler 4.125.0；compatibility date 2026-08-24 | 固定 Wrangler 从干净 `main` 发布，Workers Builds 的 production/preview 行为已核对但 R0 未启用其账户自动化；Static Assets 配置没有 Worker script 或 binding；version upload 生成公开预览 URL（Preview URL）；`workers.dev` 生产路由、404、版本与 rollback 边界 | Cloudflare owner documentation | [Wrangler release](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.125.0)、[Astro 静态发布](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/)、[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[Static Assets](https://developers.cloudflare.com/workers/static-assets/)、[Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)、[`workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)、[rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) |
| Playwright 与 axe | 1.62.1；`@axe-core/playwright` 4.13.0 | Chromium/Firefox/WebKit 项目、Mobile Safari 设备模拟、JavaScript-disabled context、reduced motion/contrast/forced colors、键盘、原生 range/number input、打印、截图和自动化无障碍检查边界 | `/microsoft/playwright`（精确索引截至 1.61.0） | [Playwright 清单](https://registry.npmjs.org/%40playwright%2Ftest/1.62.1)、[浏览器修订](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json)、[模拟](https://playwright.dev/docs/emulation)、[Browser context](https://playwright.dev/docs/api/class-browser#browser-new-context)、[无障碍测试](https://playwright.dev/docs/accessibility-testing)、[axe 清单](https://registry.npmjs.org/%40axe-core%2Fplaywright/4.13.0) |
| 浏览器接口与 CSS 媒体 | Web Storage、Custom Elements lifecycle、原生 button/select/range/number、`role=status`、`prefers-reduced-motion`、`prefers-contrast`、`forced-colors`、print | 单一主题偏好、逐实例确定性状态、计时器清理、原生键盘语义、状态消息、无脚本回退、减弱动态、增强对比、系统强制色与打印覆盖 | Playwright Context7 用于测试接口交叉核对；WHATWG/W3C 规范负责浏览器与无障碍语义 | [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)、[HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html)、[HTML input](https://html.spec.whatwg.org/multipage/input.html)、[WAI ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22)、[WAI C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)、[Media Queries 5](https://drafts.csswg.org/mediaqueries-5/)、[CSS Color Adjustment](https://drafts.csswg.org/css-color-adjust-1/)、[CSS Paged Media](https://www.w3.org/TR/css-page-3/) |
| Docker Engine 与 Buildx | GitHub runner 提供；每条 CUDA 编译记录保存实际版本 | 按 digest pull、image inspect、multi-platform manifest inspect；不从 Toolkit label 推断 | owner CLI reference | [`docker image pull`](https://docs.docker.com/reference/cli/docker/image/pull/)、[`docker image inspect`](https://docs.docker.com/reference/cli/docker/image/inspect/)、[`docker buildx imagetools inspect`](https://docs.docker.com/reference/cli/docker/buildx/imagetools/inspect/) |

精确 npm 清单负责版本、引擎、依赖和许可信息；当前上游文档负责配置语义。Context7 用于发现和交叉核对接口，不覆盖目标版本清单。

### 已核对的 CUDA 版本事实

Context7 的 `/websites/nvidia_cuda` 当前索引用于发现和交叉核对；精确版本发布说明、安装指南和 registry metadata 优先。下面每一行的访问日期都是 **2026-08-24**。

| 坐标 | 精确版本与平台 | 核对内容 | 上游资料 |
| --- | --- | --- | --- |
| CUDA 11.8 Lane 来源 | Toolkit 11.8.0；Ubuntu 22.04 x86-64 | NVIDIA archive 身份；NVCC 11.8.89；paired Linux driver 520.61.05；11.x minor-compatibility floor 450.80.02；本站选择 C++17 | [Toolkit archive](https://developer.nvidia.com/cuda-toolkit-archive)、[11.8.0 release notes](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html)、[11.8.0 Linux guide](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-installation-guide-linux/index.html)、[compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html) |
| CUDA 12.9 Lane 来源 | Toolkit 12.9.2；Ubuntu 24.04 x86-64 | Update 2 身份；NVCC 12.9.86；paired Linux driver 575.57.08；12.x floor 525.60.13；C++17/C++20 | [12.9.2 release notes](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html)、[12.9.2 Linux guide](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-installation-guide-linux/index.html#supported-c-dialects)、[12.9.2 NVCC](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std) |
| CUDA 13.3 Lane 来源 | Toolkit 13.3.1；Ubuntu 24.04 x86-64 | 最新正式版本身份；NVCC 13.3.73；paired Linux driver 610.43.02；13.x floor R580/`>=580`；C++17/C++20 与单独 C++23 probe | [Toolkit archive](https://developer.nvidia.com/cuda-toolkit-archive)、[13.3 release notes](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html)、[13.3 Linux guide](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#supported-c-dialects)、[13.3 NVCC `--std`](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std) |
| 编译与运行阶段 | NVCC 13.3.1；Linux/Windows | `--compile`、PTX/CUBIN 生成和 `--run` 是不同阶段；构建不会证明 GPU 执行 | [NVCC supported phases](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases) |
| compute capability | CUDA Programming Guide 13.3.1；CUDA-capable GPUs | 功能与技术限制按 compute capability 组织；GPU 型号映射单独查询 | [Compute capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)、[CUDA GPUs](https://developer.nvidia.com/cuda-gpus) |
| VIS01 execution model | CUDA Programming Guide v13.3；2026-05-27 更新 | block 可按任意顺序并行或串行执行；一个 block 在一个 SM；32-thread warp；x-fastest 局部 ID；Independent Thread Scheduling 边界；限定的四个 32 B transaction；异步 launch 与同步观察边界 | [Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html)、[Writing SIMT Kernels](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html)、[Asynchronous Execution](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html)、[Advanced Kernel Programming](https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html) |
| VIS02 indexing model | CUDA Programming Guide v13.3；2026-05-27 更新 | 1D/2D/3D grid 与 block；`gridDim`/`blockDim`/`blockIdx`/`threadIdx`；x-fastest thread linearization；逻辑 extent 与 row-major flattening 由本站显式声明 | [Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html)、[Writing SIMT Kernels](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html) |
| F01 first-kernel model | CUDA Programming Guide v13.3；CUDA Runtime API 13.3.1 | `__global__`、execution configuration、一维 global index、bounds check、异步 launch、launch error、completion synchronization，以及 host/device 责任边界 | [Introduction to CUDA C++](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/intro-to-cuda-cpp.html)、[Asynchronous Execution](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html)、[Runtime API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html) |
| LAB02 runtime contract | Runtime API 11.8.0、12.9.2/页面标签 12.9.1、13.3.1；Linux x86-64 | `cudaMalloc`、H2D/D2H copy、`cudaGetLastError`、`cudaDeviceSynchronize`、`cudaFree` 与三条 C++17 Lane；没有记录 GPU runtime | [11.8 API](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/index.html)、[12.9.2 archive API](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-runtime-api/index.html)、[13.3 API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html) |
| 容器身份 | `11.8.0-devel-ubuntu22.04`、`12.9.2-devel-ubuntu24.04`、`13.3.1-devel-ubuntu24.04`；amd64/arm64 | 标签、manifest digest 和当前 amd64 child digest；它们是 EX02 Lane 输入，单独不能构成 Compile-Checked | [11.8.0 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04)、[12.9.2 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04)、[13.3.1 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04) |

CUDA 11 起 Toolkit 组件独立版本化，因此 Toolkit、NVCC、cuBLAS 等 component、paired driver 和 compatibility floor 都不能合并成一个“CUDA 版本”。`archive/12.9.2` 下的 Runtime API 页面自身标记为 v12.9.1；本站保留这个文档标签差异，并用精确 12.9.2 image 的编译检查验证 EX02 接口，不从中外推未执行的运行行为。CUDA 13.3.1 Linux 指南列出 C++23，而同版本 NVCC `--std` 参考仍只列到 C++20；精确 image probe 记录 GCC 13.3/NVCC 13.3.73 并观察到该配置不支持 `-std=c++23`，因此结果是 `unsupported`，不是 EX02 的 C++23 Compile-Checked。

原生 Linux 作为唯一 Supported Environment、两个 GPU Capability Tier 的门槛以及 Reference Environment 声明条件，是本站公开支持政策。NVIDIA 资料支撑底层版本和 compute-capability 事实，但不替本站作出支持承诺。

## 内容与素材来源

- Home、O01、O02、O03、F01、LAB02、EX02、VIS01、VIS02 页面、练习、解答、五个 Practice Bank 条目、术语定义，以及三套 CSS 网格、轨迹纹理、主题选择标记和 Visual Explainer composition 均由项目原创，采用 **CC BY 4.0**（文字与教学构图）或 **Apache-2.0**（代码、模型、样式与工具）。
- 本次发布没有改编图表、复制示例代码、外部字体或第三方图片；VIS01/VIS02 未镜像或描摹 owner diagram/table。
- 语言和搜索界面图标来自已安装的 Starlight 0.41.7 包，没有复制为项目素材；主题选择标记则是项目原创 CSS。Starlight 上游包声明 MIT 许可。
- 所有技术链接只用于核对发布接口；公开文字为摘要和改写，不镜像上游正文。

## 复核记录

**复核日期：2026-08-24。** Astro 7.2.4、Starlight 0.41.7、Pagefind 1.5.2、Wrangler 4.125.0、Playwright 1.62.1 与 axe-playwright 4.13.0 的精确依赖组合由 npm 11.17.0 解析。F01/LAB02 的 canonical imports、Lab metadata、正确性合同、主题、Visual Explainer、原生控件、媒体查询、自动化无障碍边界以及 Workers Builds/Static Assets/Preview URL/`workers.dev` 接口已按上表复核；自动化结果不构成 WCAG 一致性声明。[run 32720214527](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/32720214527) 在 x86-64 `ubuntu-24.04` runner 上通过五个 EX02 检查，并记录 Docker 28.0.4、Buildx 0.36.1、实际 image/OS/compiler 和构建产物；独立 C++23 probe 记录为 `unsupported`。没有执行 CUDA binary、没有记录性能结果，也没有声明 Reference Environment，所以 EX02/LAB02 runtime 仍为 Pending Hardware Verification；VIS01/VIS02 的浏览器状态则没有 CUDA Evidence Status。
