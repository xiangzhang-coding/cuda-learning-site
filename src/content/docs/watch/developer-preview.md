---
title: 'W03：Developer Preview 与工具包通道边界'
description: 区分已归档预览版、当前下载与已准入证据目标。
pairId: w03
counterpart: /en/watch/developer-preview/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W03
prerequisites: [O03, M17]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Toolkit archive', url: 'https://developer.nvidia.com/cuda-toolkit-archive', version: '13.4.0 Developer Preview; 13.4.2', platform: 'Release discovery', accessDate: '2026-10-04' }
  - { title: 'CUDA release notes', url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html', version: '13.4.2', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w03 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W03 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'O03,M17' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/developer-preview/" lang="en">Read the English counterpart</a>

## 动机

工具包通道（Toolkit Lane）是可复现的证据目标，下载渠道则是获取软件的方式。混淆两者会悄悄改变学习单元背后的编译器、头文件、库与驱动假设。

## 稳定前置知识

[O03：环境清单（Environment Manifest）](/start/environment-manifest/)解释需要记录什么；[M17：编译器目标](/toolchain/compiler-architecture-targets/)解释为何目标受支持不等于设备部署受支持。

## 当前发布状态

截至 **2026-10-04** 的核对，维护方归档列出 **13.4.0 Developer Preview（2026 年 7 月）**，以及后续的 **13.4.1、13.4.2（2026 年 9 月）**。当前下载页提供 **13.4.2**，并非仍在发布 13.4.0 预览版。本条目保留预览边界，不虚构更新的预览版，也不把 13.4.2 重新标为预览。预览版可下载或后续正式版发布，都不会自动新增工具包通道。

## 软件与硬件门槛

当前发布说明区分了两种情况：已有 CUDA 13.x 应用可在 **驱动 >=580** 上使用小版本兼容；13.4 新功能或平台则要求 **R615 或更新驱动**。具体例子是 CUTLASS v4.8.0 明确说明 Rubin SM107 运行需要 R615，13.4 Developer Preview 的 R610 不够。仅写“CUDA 13”无法回答兼容性问题。单独探测前应匹配操作系统、CPU 架构、宿主编译器、精确 Toolkit 组件、GPU 目标、驱动和 API。本站唯一受支持环境（Supported Environment）是原生 Linux。

## 限制与许可

本站已准入通道仍是 **cuda-11.8（11.8.0）、cuda-12.9（12.9.2）、cuda-13.3（13.3.1）**。固定的编译策略只能经明确评审修改，不能跟随 `latest` 下载或包解析结果漂移。预览软件的 API、ABI 和组件都可能变化，归档标签本身不构成迁移契约。应核对精确发行物的 [CUDA EULA 与组件附件](https://docs.nvidia.com/cuda/eula/index.html)。本条目不再分发二进制、头文件或示例。[晋升](/watch/#晋升需要单独决策)需要稳定接口和本站证据；本次来源评审没有构建或运行证据。

## 回忆检查

来源页提到 13.4.2，而某实验（Lab）固定 13.3.1，应该替换实验的编译器吗？不应该。保留已声明通道，把新版本试验视为独立环境，分别提供环境清单、正确性标准和证据。

## 维护方来源

访问日期 **2026-10-04**：[发布归档](https://developer.nvidia.com/cuda-toolkit-archive)、[13.4.2 下载](https://developer.nvidia.com/cuda-downloads)、[发布说明](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html)、[CUTLASS v4.8.0 发布说明的驱动边界](https://github.com/NVIDIA/cutlass/releases/tag/v4.8.0)、[CUDA EULA](https://docs.nvidia.com/cuda/eula/index.html)。[观察区索引](/watch/)。
