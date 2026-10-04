---
title: 'W06：CUTLASS Python DSL'
description: 跟踪显式布局编程、变化中的编译接口与独立专有条款。
pairId: w06
counterpart: /en/watch/cutlass-python-dsls/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations,check, sources]
resourceKind: emerging-feature-watch
unitId: W06
prerequisites: [L09, T04, T05]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUTLASS release', url: 'https://github.com/NVIDIA/cutlass/releases/tag/v4.8.0', version: '4.8.0', platform: 'Python DSL; source review', accessDate: '2026-10-04' }
  - { title: 'CUTLASS DSL quickstart', url: 'https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/quick_start.rst', version: '4.8.0', platform: 'Native Linux', accessDate: '2026-10-04' }
  - { title: 'CUTLASS DSL software license', url: 'https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/license.rst', version: '4.8.0; agreement 2025-05-08', platform: 'Package and materials', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w06 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W06 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'L09,T04,T05' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/cutlass-python-dsls/" lang="en">Read the English counterpart</a>

## 动机

CuTe 领域专用语言（Domain-Specific Language，DSL）让 Python 作者保留显式布局、张量、copy/MMA atom 和流水线，而不必书写 C++ 模板元程序。Python 语法不会消除线程与数据层级。比较它与 cuTile、Triton 前，应先比较程序员控制哪些部分。

## 稳定前置知识

[L09：CUTLASS C++ 结构](/libraries/cutlass-cpp-gemm-structure/)、[T04：分块 GEMM](/triton/blocked-matrix-multiplication/)和 [T05：自动调优](/triton/autotuning/)提供布局、数值与测量契约。完成它们不需要安装 CUTLASS Python。

## 当前接口状态

评审坐标：**CUTLASS v4.8.0**，包名 **nvidia-cutlass-dsl**。已发布的 CuTe DSL、实验性的 primitives/task scheduling 与预览编译路径必须分别标记。v4.8.0 说明将通过 `CUTE_DSL_USE_EXTENSION_COMPILER=1` 选择的 `cute_ext` 编译流水线标为 **preview**，不能把其未来默认启用计划改写成承诺。旧的 Python 接口负责实例化 C++ 内核，从 4.0 起弃用；它与原生 Python DSL 内核编写不是同一个 API。发布标签不表示每个子模块都已稳定。

## 软件与硬件门槛

带版本的 4.8 quickstart 列出 **Python 3.10–3.14t**、Linux x86_64/aarch64、Windows x86_64；本站仅支持原生 Linux。它区分 **CUDA 12.9** 和 **13.4**，12.9 要求驱动 **575.51.03+**，13.4 遵循对应 Toolkit 的驱动要求。新的 Rubin SM107 运行需要 **R615**，预览版 R610 不够。架构覆盖取决于操作：Ampere/Ada 的 warp MMA、Hopper 的 warpgroup/TMA、Blackwell 的 tcgen05/TMEM 不是可互换目标。

wheel 包含内核生成工具链，`[cu13]` 选择不同依赖路径；维护方另提供 `--pre` 包渠道。示例和 setup 脚本必须匹配精确的源码提交与 wheel。不要把当前文档中未锁版本的安装命令用于稳定课程（Stable Curriculum）环境。

## 限制与独立许可

显式布局、流水线生命周期、dtype/累加器选择及目标特定指令仍需要正确性检查。JIT/AOT 产物、调用约定与缓存必须匹配选定编译器和消费者；成功导入 wheel 或概念类似 CuTe C++，都不能证明 ABI 兼容或速度。DSL 也不自动提供完整的 C++ GEMM/Conv profiler 与库接口。

**Python DSL 具有单独的专有条款。** v4.8.0 的 `python/LICENSE.txt` 为 BSD-3-Clause，但 `cutlass_compiler/LICENSE.txt` 明确把 `python/CuTeDSL` 文件指向 NVIDIA EULA。该版本的 DSL 协议（2025-05-08）限制使用和再分发，在条件下允许指定示例的衍生作品，并区分其他许可组件。不能把仓库 BSD 标签套给整个 `nvidia-cutlass-dsl` 包，也不能把维护方示例改标为 Apache-2.0/CC BY 4.0。本页仅有原创解释与链接。[晋升](/watch/#晋升需要单独决策)仍需单独决策，证据数组为空。

## 回忆检查

CUTLASS 别处的 BSD 文件，是否就授权把 DSL 示例复制到本站规范项目？不是。必须先核对精确文件、包、版本与适用条款。通过的 C++ GEMM 测试是否验证了 Python DSL 内核？也不是：编译路径与验证对象都不同。

## 维护方来源

访问日期 **2026-10-04**：[v4.8.0 发布说明](https://github.com/NVIDIA/cutlass/releases/tag/v4.8.0)、[带版本 quickstart](https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/quick_start.rst)、[当前概览](https://docs.nvidia.com/cutlass/latest/media/docs/pythonDSL/overview.html)、[Python 目录许可](https://github.com/NVIDIA/cutlass/blob/v4.8.0/python/LICENSE.txt)、[编译器许可例外](https://github.com/NVIDIA/cutlass/blob/v4.8.0/cutlass_compiler/LICENSE.txt)、[精确 DSL 协议](https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/license.rst)。发布说明中的测试声明来自上游，不是本站结果。[观察区索引](/watch/)。
