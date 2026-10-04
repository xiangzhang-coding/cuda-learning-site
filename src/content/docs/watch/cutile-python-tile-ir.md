---
title: 'W02：cuTile Python 与 CUDA Tile IR'
description: 分别跟踪前端、编译器与导出内核契约。
pairId: w02
counterpart: /en/watch/cutile-python-tile-ir/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W02
prerequisites: [P03, T01, T04]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'cuTile release notes', url: 'https://docs.nvidia.com/cuda/cutile-python/generated/release_notes.html', version: '1.6.0', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'cuTile quickstart', url: 'https://docs.nvidia.com/cuda/cutile-python/quickstart.html', version: '1.6.0', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'Tile IR specification', url: 'https://docs.nvidia.com/cuda/tile-ir/', version: '13.4', platform: 'Compiler interface', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w02 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W02 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P03,T01,T04' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/cutile-python-tile-ir/" lang="en">Read the English counterpart</a>

## 动机

Python tile 前端、中间表示（Intermediate Representation，IR）和机器码编译器对应不同契约。cuTile 表达元素组；CUDA Tile IR 将 tile 语义传给编译器。仅有 Python 包版本，无法确定生成内核的应用二进制接口（ABI）或硬件支持。

## 稳定前置知识

[P03：运行时编译](/python/runtime-compilation-linking/)、[T01：块值](/triton/programs-and-block-values/)和 [T04：分块 GEMM](/triton/blocked-matrix-multiplication/)提供比较所需的概念。完成这些学习单元（Learning Unit）不需要 W02，也不需要安装 cuTile。

## 当前接口状态

本次核对的已发布包为 **cuda-tile 1.6.0**，发布日期 2026-09-09，导入命名空间是 `cuda.tile`，不能一概标为预览。仓库另将 `cuda.tile_preview` / `cuda-tile-preview` 标为持续开发、处于稳定命名空间之外的 API。1.6.0 加入了不检查边界的访问和依赖启动等 CTK 13.4 功能；1.5.0 为静态形状或元组参数引入调用约定 v2，1.3.0 改变了常量参数参与内核 ABI 的方式。导出和调用内核时必须保留调用约定。

## 软件与硬件门槛

当前 quickstart 列出 Python **3.10–3.14 及 3.14t**、驱动 **r580+** 和 CC **8.x、9.x、10.x、11.x、12.x**。这只是前端支持范围，不表示每个设备支持每个操作。`nvidia-cuda-tileiras`、`nvidia-cuda-nvcc`、`nvidia-nvvm` 编译器包必须具有相同的 major.minor 版本。系统 Toolkit 路径从 13.1 起可用，但 Ampere/Ada 支持来自 13.2，Hopper 来自 13.3；CTK 13.4 操作需要相应编译器及支持新功能的驱动。仓库 README 仍描述 tileiras 13.2 并排除 Hopper，1.4.0 发布说明则明确加入 Hopper，不能混用这两个时间点。本站支持边界仍是原生 Linux。

## 限制与晋升边界

Tile IR 不是 PTX，前端装饰器也不是运行正确性测试。1.6.0 说明指出，不指定 GPU 目标的可移植字节码导出需要 13.3 或更新的字节码版本。关闭边界检查是在断言全部访问合法，并不能修复不整齐的 tile。支持的 Python 是文档定义的子集，不是任意宿主 Python。cuTile 源码采用 Apache-2.0，编译器组件保留单独的 CUDA 条款。这里不复制代码或维护方示例。本次来源评审没有满足[晋升条件](/watch/#晋升需要单独决策)，证据数组全部为空。

## 回忆检查

新 Python wheel 能让 13.2 编译器支持 Hopper，或让旧调用者理解调用约定 v2 吗？不能。必须分别记录、核对各层，不能为可选试验升级稳定课程（Stable Curriculum）的工具包通道（Toolkit Lane）。

## 维护方来源

访问日期 **2026-10-04**：[1.6.0 及历史发布说明](https://docs.nvidia.com/cuda/cutile-python/generated/release_notes.html)、[quickstart](https://docs.nvidia.com/cuda/cutile-python/quickstart.html)、[Tile IR 规范](https://docs.nvidia.com/cuda/tile-ir/)，以及[仓库 README 中的预览命名空间、测试说明和许可声明](https://github.com/NVIDIA/cutile-python/blob/main/README.md)。维护方测试说明反映上游覆盖，不是本站执行证据。[观察区索引](/watch/)。
