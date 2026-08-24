---
title: 来源与版本记录
description: 当前公开路线与 EX02 使用的发布接口、CUDA 版本事实、内容来源和复核日期。
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

这份记录说明 CUDA 学习站（Learning Site）使用了哪些精确发布与主题接口，以及 O02/O03/EX02 的 CUDA 版本事实来自哪里。工具版本、浏览器表现、硬件能力、项目支持政策和实际观察始终分开记录。

## 记录范围

本页覆盖 Home、O01、O02、O03、配套练习与解答、EX02、练习题库（Practice Bank）、术语表（Glossary）、三套视觉主题和静态发布外壳。所有链接在 **2026-08-24** 重新打开复核；网站构建使用 Node.js 24.19.0 与 npm 11.17.0。

## 已核对的发布接口

| 接口 | 精确版本 | 核对内容 | Context7 | 上游资料 |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | 静态输出配置；经处理的 TypeScript 客户端脚本；首屏前 `is:inline` 脚本 | `/withastro/docs` | [npm 清单](https://registry.npmjs.org/astro/7.2.4)、[配置参考](https://docs.astro.build/en/reference/configuration-reference/)、[客户端脚本](https://docs.astro.build/en/guides/client-side-scripts/) |
| Starlight | 0.41.7 | 根语言、本地化标题、显式侧边栏、`Banner`/`ThemeProvider`/`ThemeSelect` 组件覆写、自定义 CSS 与级联层 | `/withastro/starlight` | [npm 清单](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7)、[组件覆写](https://starlight.astro.build/guides/overriding-components/)、[CSS 与样式](https://starlight.astro.build/guides/css-and-tailwind/)、[国际化](https://starlight.astro.build/guides/i18n/#use-a-root-locale) |
| Pagefind | 1.5.2 | 根据 `<html lang>` 生成语言分区索引，以及扩展版中文分词 | `/websites/pagefind_app` | [npm 清单](https://registry.npmjs.org/pagefind/1.5.2)、[多语言搜索](https://pagefind.app/docs/multilingual/) |
| Playwright 与 axe | 1.62.1；`@axe-core/playwright` 4.13.0 | Chromium/Firefox/WebKit 项目、Mobile Safari 设备模拟、媒体与强制色模拟、键盘、打印、截图和自动化无障碍检查边界 | `/microsoft/playwright`（精确索引截至 1.61.0） | [Playwright 清单](https://registry.npmjs.org/%40playwright%2Ftest/1.62.1)、[浏览器修订](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json)、[模拟](https://playwright.dev/docs/emulation)、[无障碍测试](https://playwright.dev/docs/accessibility-testing)、[axe 清单](https://registry.npmjs.org/%40axe-core%2Fplaywright/4.13.0) |
| 浏览器接口与 CSS 媒体 | Web Storage、Custom Elements、`prefers-reduced-motion`、`prefers-contrast`、`forced-colors`、print | 单一主题偏好、无脚本回退、减弱动态、增强对比、系统强制色与打印覆盖 | Playwright Context7 用于测试接口交叉核对；WHATWG/W3C 规范与 MDN 用于浏览器语义 | [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html)、[HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html)、[Media Queries 5](https://drafts.csswg.org/mediaqueries-5/)、[CSS Color Adjustment](https://drafts.csswg.org/css-color-adjust-1/)、[CSS Paged Media](https://www.w3.org/TR/css-page-3/)、[MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)、[MDN media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media) |

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
| 容器身份 | `11.8.0-devel-ubuntu22.04`、`12.9.2-devel-ubuntu24.04`、`13.3.1-devel-ubuntu24.04`；amd64/arm64 | 标签、manifest digest 和当前 amd64 child digest；它们是 EX02 Lane 输入，单独不能构成 Compile-Checked | [11.8.0 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04)、[12.9.2 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04)、[13.3.1 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04) |

CUDA 11 起 Toolkit 组件独立版本化，因此 Toolkit、NVCC、cuBLAS 等 component、paired driver 和 compatibility floor 都不能合并成一个“CUDA 版本”。`archive/12.9.2` 下的 Runtime API 页面自身标记为 v12.9.1；本站保留这个文档标签差异，并用精确 12.9.2 image 的编译检查验证 EX02 接口，不从中外推未执行的运行行为。CUDA 13.3.1 Linux 指南列出 C++23，而同版本 NVCC `--std` 参考仍只列到 C++20；该差异保留为精确环境中的独立 probe，不在 probe 通过前宣称结果。

原生 Linux 作为唯一 Supported Environment、两个 GPU Capability Tier 的门槛以及 Reference Environment 声明条件，是本站公开支持政策。NVIDIA 资料支撑底层版本和 compute-capability 事实，但不替本站作出支持承诺。

## 内容与素材来源

- Home、O01、O02、O03、EX02 页面、练习、解答、Practice Bank 条目、术语定义，以及三套 CSS 网格、轨迹纹理和主题选择标记均由项目原创，采用 **CC BY 4.0**（文字）或 **Apache-2.0**（代码、样式与工具）。
- 本次发布没有改编图表、复制示例代码、外部字体或第三方图片。
- 语言和搜索界面图标来自已安装的 Starlight 0.41.7 包，没有复制为项目素材；主题选择标记则是项目原创 CSS。Starlight 上游包声明 MIT 许可。
- 所有技术链接只用于核对发布接口；公开文字为摘要和改写，不镜像上游正文。

## 复核记录

**复核日期：2026-08-24。** Astro 7.2.4、Starlight 0.41.7、Pagefind 1.5.2、Playwright 1.62.1 与 axe-playwright 4.13.0 的精确依赖组合由 npm 11.17.0 解析。主题组件、Web Storage、媒体查询、设备模拟和自动化无障碍测试边界已按上表复核；自动化结果不构成 WCAG 一致性声明。CUDA 11.8.0、12.9.2、13.3.1 的 owner sources 与容器标签已复核，但本次没有执行 CUDA、没有编译 Lane、没有记录性能结果，也没有声明 Reference Environment。C++23 文档差异保留给后续精确 probe。
