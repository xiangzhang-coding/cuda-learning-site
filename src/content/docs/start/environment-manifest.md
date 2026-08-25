---
title: 'O03：读懂环境清单'
description: 分开记录硬件、软件、工作负载和测量坐标，判断一条 CUDA 证据能说明什么。
pairId: o03
counterpart: /en/start/environment-manifest/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - outcome
  - prerequisites
  - manifest
  - relationships
  - support
  - tiers
  - lanes
  - reference-boundary
  - retrieval
  - practice
  - sources
resourceKind: learning-unit
unitId: O03
prerequisites:
  - O01
relatedUnits:
  - O02
  - EX01
  - O08
  - LAB01
  - F01
  - LAB02
exampleIds:
  - O03-MANIFEST-TEMPLATE
  - O03-INCOMPLETE-A
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
sources:
  - title: NVIDIA CUDA Toolkit Archive
    url: 'https://developer.nvidia.com/cuda-toolkit-archive'
    version: '11.8.0, 12.9.2, and 13.3.1 release identities'
    platform: 'All published platforms'
    accessDate: '2026-08-26'
  - title: CUDA Toolkit 11.8.0 Release Notes
    url: 'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html'
    version: '11.8.0'
    platform: 'Linux x86_64'
    accessDate: '2026-08-26'
  - title: CUDA Toolkit 12.9 Update 2 Release Notes
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html'
    version: '12.9.2'
    platform: 'Linux x86_64'
    accessDate: '2026-08-26'
  - title: CUDA Toolkit 13.3 Update 1 Release Notes
    url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html'
    version: '13.3.1'
    platform: 'Linux x86_64'
    accessDate: '2026-08-26'
  - title: CUDA Installation Guide for Linux 12.9
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-installation-guide-linux/index.html#supported-c-dialects'
    version: '12.9.2'
    platform: 'Ubuntu 24.04 x86_64'
    accessDate: '2026-08-26'
  - title: CUDA Installation Guide for Linux 13.3
    url: 'https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#supported-c-dialects'
    version: '13.3.1'
    platform: 'Ubuntu 24.04 x86_64'
    accessDate: '2026-08-26'
  - title: CUDA Minor Version Compatibility
    url: 'https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html'
    version: 'Current on 2026-08-26'
    platform: 'Linux x86_64'
    accessDate: '2026-08-26'
  - title: CUDA Programming Guide - Compute Capabilities
    url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html'
    version: '13.3.1'
    platform: 'CUDA-capable GPUs'
    accessDate: '2026-08-26'
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o03 }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,manifest,relationships,support,tiers,lanes,reference-boundary,retrieval,practice,sources' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: learning-unit }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O02,EX01,O08,LAB01,F01,LAB02' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: 'O03-MANIFEST-TEMPLATE,O03-INCOMPLETE-A' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:source-count', content: '8' }
  - tag: meta
    attrs: { name: 'cuda:source-versions', content: '11.8.0,12.9.2,13.3.1' }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/environment-manifest/" lang="en">Read the English counterpart</a>

环境清单（Environment Manifest）不是一句“CUDA 13.3”或一张 `nvidia-smi` 截图。它把解释一次构建、运行或测量所需的硬件、软件、工作负载和方法坐标分别记录下来，使别人知道结论覆盖哪里、不能外推到哪里。

## 学完本单元，你应该能

- 判断一份 manifest 是否完整，并指出缺少的坐标。
- 分开 GPU、计算能力（compute capability）、驱动、Toolkit、组件、编译器和操作系统。
- 使用本站的受支持环境（Supported Environment）、基准环境（Reference Environment）、工具包通道（Toolkit Lane）和 GPU 能力层级（GPU Capability Tier），而不混淆它们。
- 为正确性和性能记录选择不同的附加字段。

## 先修关系

先完成 [O01：如何使用学习站](/start/using-the-learning-site/)。O03 和 O02 都直接依赖 O01；当你要给 manifest 附上证据标签时，再结合 [O02](/start/evidence-status/)使用。

## 完整 Environment Manifest

O03-MANIFEST-TEMPLATE 是一个字段模板，不是某台机器的记录。尖括号表示必须用真实值替换；空字段不能靠推测补齐。

| 坐标 | 要记录什么 | 为什么单独记录 |
| --- | --- | --- |
| GPU identity | `<型号、设备标识或 UUID>` | 产品名不能替代实际设备身份 |
| compute capability | `<major.minor 与查询方法>` | 计算能力描述功能与限制，不是 Toolkit 版本 |
| GPU count | `<可见且实际使用的 GPU 数量>` | 单卡和多卡的可复现条件不同 |
| driver version | `<已安装驱动精确版本>` | 驱动独立于 Toolkit，也影响运行兼容性 |
| CUDA Toolkit version | `<精确 X.Y.Z>` | Toolkit 是工具集合，不等于驱动或组件版本 |
| component versions | `<与任务相关的 NVCC、cuBLAS、Nsight 等>` | CUDA 11 起组件独立版本化 |
| compiler information | `<NVCC 版本；host compiler 名称与版本>` | NVCC 会调用 host compiler；两者都影响构建 |
| operating system | `<发行版、版本、架构、必要内核信息>` | “Linux”本身不够精确 |
| workload and shape | `<程序、提交、数据类型、维度、迭代>` | 结果只对被测工作负载成立 |
| memory requirement | `<主机/设备内存需求或上限>` | 能力层级必须能容纳问题规模 |
| permissions | `<驱动、性能计数器、容器或多 GPU 权限>` | 缺权限可能改变可执行步骤和测量 |
| exact command | `<未经省略的构建或运行命令>` | 参数、target 和环境变量都是证据的一部分 |
| correctness method | `<参考实现、容差、哈希或不变量>` | 输出存在不等于输出正确 |
| correctness criteria | `<明确的通过/失败条件>` | 标准必须在观察前写清 |
| observation date | `<YYYY-MM-DD>` | 驱动、工具和环境会变化 |

编译记录还要增加所选 **C++ dialect** 和编译 **target**。性能记录还要增加 baseline 与 hypothesis、clocks 或 power policy、warm-up、synchronization、timer/profiler 精确版本、statistics 与 sample method、result 和 interpretation boundaries。

O03-INCOMPLETE-A 只有“RTX 4090、CUDA 13.3.1、跑了矩阵乘”。它缺少 compute capability、GPU count、driver、component、compiler、OS、shape、memory、permissions、exact command、correctness 和 observation date，因此不能支持可解释的正确性或性能结论。

## 容易混淆但不同的关系

- **GPU 型号不是 compute capability。** 型号帮助识别设备，计算能力决定一组架构功能和限制。
- **compute capability 不是 Toolkit 版本。** 一个硬件能力值可以被多个 Toolkit 使用，但具体 target 和组件支持仍要核对。
- **driver 和 CUDA Toolkit 相互独立。** NVIDIA 的 paired driver 与 minor-compatibility floor 也不是同一个数。
- **Toolkit 和 component versions 相互独立。** 例如一个 Toolkit 可以携带不同编号的 NVCC、cuBLAS 和分析器。
- **工具包通道（Toolkit Lane）是编译证据目标。** 它不是课程副本，也不是基准环境。
- **受支持环境（Supported Environment）是支持责任范围；基准环境（Reference Environment）是该范围内一套已声明、由维护者控制的具体配置。**
- **硬件能力和已观察运行行为不是同一事实。** 满足能力门槛只说明可以进入某条路线，不说明某个程序已经通过。

## 唯一受支持环境

**原生 Linux 是唯一的受支持环境。** 这意味着本站为原生 Linux 承担安装说明、故障边界和验证声明责任。Windows、WSL、托管 notebook 和其他系统可以作为边界清楚的非支持比较出现，但不会因此得到 setup、troubleshooting、Lab 或 validation 承诺。

“NVIDIA 文档支持某个平台”和“本站把它列为 Supported Environment”也不是同一件事。前者是上游产品事实，后者是本站选择承担的课程责任。

## 两个 GPU 能力层级

**基础 GPU 能力层级（Baseline GPU Capability Tier）** 要求 compute capability **7.5 或更新**；稳定课程（Stable Curriculum）基础部分使用能放进 **8 GB** 的问题规模。这里的 8 GB 是规模上限合同，不是“8 GB GPU tier”。

**现代单 GPU 能力层级（Modern Single-GPU Capability Tier）** 要求 compute capability **8.0 或更新**并且至少 **8 GB**，覆盖完整单 GPU 路线。多 GPU 和架构专用活动另行声明额外要求。

层级由 compute capability、memory、GPU count、features 和 permissions 共同定义，不用产品名或“某代 GPU”代替。更大显存也不会创建另一套课程。

## 三条 Toolkit Lane

EX02 已在 [CUDA Compile Evidence run 32720214527](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/32720214527) 中完成三条 Lane 的 preprocess、compile、link 和 inspect：11.8.0 的 C++17、12.9.2/13.3.1 的 C++17 与 C++20 均为 Compile-Checked。这个状态只属于 EX02 的精确源码、方言、target 和已记录环境，不升级其他对象，也不构成 GPU 运行证据。

| Toolkit Lane | 选择的 OS | 课程编译方言 | 上游版本坐标（不是本机观察） |
| --- | --- | --- | --- |
| CUDA 11.8.0 | Ubuntu 22.04 x86-64 | C++17 | NVCC 11.8.89；paired Linux driver 520.61.05；11.x minor-compatibility floor 450.80.02 |
| CUDA 12.9.2 | Ubuntu 24.04 x86-64 | C++17、C++20 | NVCC 12.9.86；paired Linux driver 575.57.08；12.x floor 525.60.13 |
| CUDA 13.3.1 | Ubuntu 24.04 x86-64 | C++17、C++20；C++23 单独 probe | NVCC 13.3.73；paired Linux driver 610.43.02；13.x floor 为 R580/`>=580` |

CUDA 13.3.1 的 Linux 安装指南把 C++23 列为受支持方言，但同版本 NVCC `--std` 选项参考仍只列到 C++20。精确 image 中的独立 probe 记录了 GCC 13.3 和 NVCC 13.3.73，并观察到 `-std=c++23` 不受当前 host compiler 配置支持；结果为 `unsupported`，不是 EX02 的 C++23 Compile-Checked。容器标签本身仍只证明 registry metadata。

## Reference Environment 声明边界

**目前没有声明任何基准环境。** 要声明一套配置，必须同时具备维护者控制、合适 GPU 与兼容驱动、一次成功的受控 baseline run、完整 Environment Manifest，以及明确的 GPU Capability Tier。

Ubuntu 24.04 x86-64 加 CUDA 13.3.1 目前只是候选软件坐标；它没有 GPU、完整 manifest 和受控 baseline run，因此不是 Reference Environment，也不能产生 Runtime-Verified。

## 离开前检查

1. 为什么 GPU 型号、compute capability 和 Toolkit 版本要分开？
2. paired driver 与 minor-compatibility floor 有什么不同？
3. Toolkit Lane、Supported Environment 和 Reference Environment 分别是什么？
4. 一个性能 manifest 比正确性 manifest 多哪些字段？
5. 为什么满足 GPU Capability Tier 不等于已经观察到运行结果？

## 继续练习

- 完成 [O03 练习（Exercise）](/start/environment-manifest/exercises/)，再查看独立的[参考解答](/start/environment-manifest/solutions/)。
- 在[练习题库（Practice Bank）](/practice/)完成 PB-R0-002，修复一份不完整 manifest 和错误支持边界。
- 打开 [EX01 环境报告可运行示例（Runnable Example）](/examples/environment-report/)，理解它能采集哪些结构化观察，以及它不能替代哪些 manifest 字段。
- 完成 O02、O03 和 O05 后进入 [O08](/start/reference-environment-candidate/)；同时具备 O03 和 O08 后，再用 [LAB01](/labs/record-cuda-environment/)采集并解释候选配置。
- kernel 路线仍可继续到 [F01](/foundations/first-cuda-kernel/)，并在进入 [LAB02](/labs/vector-addition/)前把本页字段准备成真实记录模板。

## 来源与复核

Toolkit、组件、paired driver、Linux 资格和方言来自 NVIDIA 的精确版本发布说明与安装指南；驱动 floor 来自 CUDA Compatibility，compute capability 来自 CUDA Programming Guide。所有链接、版本和平台坐标记录在[来源与版本记录](/sources-and-versions/)，并于 **2026-08-26** 重新打开。

**事实核查日期：2026-08-26。** 本页的 manifest 只是模板和假设反例，没有记录真实机器、运行输出或性能结果。
