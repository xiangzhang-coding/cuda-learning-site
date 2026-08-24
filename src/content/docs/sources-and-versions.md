---
title: 来源与版本记录
description: 当前 Orientation 路线使用的发布接口、CUDA 版本事实、内容来源和复核日期。
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

这份记录说明 CUDA 学习站（Learning Site）使用了哪些精确发布接口，以及 O02/O03 的 CUDA 版本事实来自哪里。工具版本、硬件能力、项目支持政策和实际观察始终分开记录。

## 记录范围

本页覆盖 Home、O01、O02、O03、配套练习与解答、练习题库（Practice Bank）、术语表（Glossary）和静态发布外壳。所有链接在 **2026-08-24** 重新打开复核；网站构建使用 Node.js 24.19.0 与 npm 11.17.0。

## 已核对的发布接口

| 接口 | 精确版本 | 核对内容 | Context7 | 上游资料 |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | `output: 'static'`、`site`、`outDir`、`trailingSlash`、`prerenderConflictBehavior`、集成配置 | `/withastro/docs` | [npm 清单](https://registry.npmjs.org/astro/7.2.4)、[配置参考](https://docs.astro.build/en/reference/configuration-reference/) |
| Starlight | 0.41.7 | 根语言、本地化标题、对应页切换、显式侧边栏、预渲染、Pagefind | `/withastro/starlight` | [npm 清单](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7)、[国际化](https://starlight.astro.build/guides/i18n/#use-a-root-locale)、[侧边栏](https://starlight.astro.build/guides/sidebar/)、[站内搜索](https://starlight.astro.build/guides/site-search/) |
| Pagefind | 1.5.2 | 根据 `<html lang>` 生成语言分区索引，以及扩展版中文分词 | `/websites/pagefind_app` | [npm 清单](https://registry.npmjs.org/pagefind/1.5.2)、[多语言搜索](https://pagefind.app/docs/multilingual/) |

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
| 容器身份 | `11.8.0-devel-ubuntu22.04`、`12.9.2-devel-ubuntu24.04`、`13.3.1-devel-ubuntu24.04`；amd64/arm64 | 标签存在及其 manifest digest；只作为未来 Lane 输入，不构成 Compile-Checked | [11.8.0 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04)、[12.9.2 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04)、[13.3.1 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04) |

CUDA 11 起 Toolkit 组件独立版本化，因此 Toolkit、NVCC、cuBLAS 等 component、paired driver 和 compatibility floor 都不能合并成一个“CUDA 版本”。CUDA 13.3.1 Linux 指南列出 C++23，而同版本 NVCC `--std` 参考仍只列到 C++20；该差异保留为精确环境中的独立 probe，不在内容中宣称通过。

原生 Linux 作为唯一 Supported Environment、两个 GPU Capability Tier 的门槛以及 Reference Environment 声明条件，是本站公开支持政策。NVIDIA 资料支撑底层版本和 compute-capability 事实，但不替本站作出支持承诺。

## 内容与素材来源

- Home、O01、O02、O03、练习、解答、Practice Bank 条目、术语定义和 CSS 硅片布线纹理由项目原创，采用 **CC BY 4.0**（文字）或 **Apache-2.0**（样式与工具代码）。
- 本次发布没有改编图表、复制示例代码、外部字体或第三方图片。
- 语言、主题、搜索等界面图标来自已安装的 Starlight 0.41.7 包，没有复制为项目素材；其上游包声明 MIT 许可。
- 所有技术链接只用于核对发布接口；公开文字为摘要和改写，不镜像上游正文。

## 复核记录

**复核日期：2026-08-24。** Astro 7.2.4、Starlight 0.41.7 与 Pagefind 1.5.2 的精确依赖组合由 npm 11.17.0 解析。CUDA 11.8.0、12.9.2、13.3.1 的 owner sources 与容器标签已复核，但本次没有执行 CUDA、没有编译 Lane、没有记录性能结果，也没有声明 Reference Environment。C++23 文档差异保留给后续精确 probe。
