---
title: 'W01：CUDA Tile C++'
description: 分清 tile 表达、编译器支持与课程准入。
pairId: w01
counterpart: /en/watch/cuda-tile-cpp/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W01
prerequisites: [M03, M17, M19]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVCC tile compilation', url: 'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html', version: '13.4', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'CUDA Tile C++ API', url: 'https://docs.nvidia.com/cuda/cuda-tile-cpp-api-reference/index.html', version: '13.4', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w01 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W01 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'M03,M17,M19' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/cuda-tile-cpp/" lang="en">Read the English counterpart</a>

## 动机

单指令多线程（SIMT）代码把工作分配给线程；tile 代码表达一组元素上的操作，由编译器映射块内并行。这可以减少手动调度工作，但边界、形状、数值契约和依赖仍由作者负责。Tile 是执行抽象，不是共享内存分块的别名。

## 稳定前置知识

[M03：共享内存分块](/memory/shared-memory-tiling/)、[M17：架构目标](/toolchain/compiler-architecture-targets/)和 [M19：C++ 方言](/toolchain/cpp-dialect-boundaries/)提供本条目比较所需的概念。稳定课程（Stable Curriculum）没有任何学习单元（Learning Unit）需要 W01。

## 当前接口状态

**新引入接口，继续留在观察区。** NVCC 从 CUDA 13.3 开始记录 Tile C++；本次核对的当前编译器文档为 13.4。`cuda_tile.h`、`__tile_global__`、`cuda::tiles` 标识这一前端，它能与 SIMT 代码共存于同一翻译单元。不能因为早期某个 Toolkit 是预览版，就把所有 Tile C++ 标成 Developer Preview；同样，正式文档收录也不等于本站作出了稳定教学或 ABI 承诺。

## 软件与硬件门槛

Tile 代码生成需要显式启用 `--enable-tile`，使用 **C++20 或更新方言**，且不支持默认的 Turing `sm_75` 目标。应在这一边界之上选择编译器明确支持的目标，并核对精确目标表，不能仅凭 CC 主版本推导全部指令支持。编译器根据输出选择生成 Tile IR 或设备镜像。NVRTC 的 tile 路径则获取 Tile IR 后交给驱动加载，不能当成相同的 cubin 路径。分别记录 Toolkit、NVCC/NVRTC、Tile IR 生产者与消费者、驱动、目标和宿主编译器。阅读不需要 GPU；未来任何运行都需要兼容的原生 Linux 设备与驱动。

## 限制与晋升边界

编译器负责映射，不负责证明算法正确或保证加速。比较性能前，先核对形状合法性、掩码边界与同步。本条目没有添加规范示例、实验（Lab）、工具包通道（Toolkit Lane）或证据标签。[晋升条件](/watch/#晋升需要单独决策)需要单独满足。CUDA Toolkit 的组件和头文件有各自的 [EULA](/watch/developer-preview/#限制与许可)；本站文字不再分发 `cuda_tile.h` 或维护方示例。

## 回忆检查

给原有的 C++17、`sm_75` 构建加上 `--enable-tile`，是否就证明支持 Tile？不能：方言和目标两个门槛都还不满足。即使成功构建，也不能证明输出正确或性能更好。

## 维护方来源

访问日期 **2026-10-04**：[NVCC 的 Tile Compilation in CUDA](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html)、[Tile C++ API 参考](https://docs.nvidia.com/cuda/cuda-tile-cpp-api-reference/index.html)，均为当前 13.4 文档；[NVRTC](https://docs.nvidia.com/cuda/nvrtc/index.html)用于核对不同的运行时编译路径。这些是文档观察，不是本站执行过的测试。[观察区索引](/watch/)。
