---
title: 'W05：CCCL 实验命名空间与 Python'
description: 按命名空间和包读取稳定性承诺。
pairId: w05
counterpart: /en/watch/cccl-experimental-python/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W05
prerequisites: [L03, L05, P01]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CCCL experimental stability', url: 'https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/cudax/index.rst', version: '3.4.3', platform: 'C++ API and ABI', accessDate: '2026-10-04' }
  - { title: 'CCCL Python package metadata', url: 'https://github.com/NVIDIA/cccl/blob/v3.4.3/python/cuda_cccl/pyproject.toml', version: '3.4.3', platform: 'Python package', accessDate: '2026-10-04' }
  - { title: 'cuda.compute beta API', url: 'https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/python/compute_api.rst', version: '3.4.3', platform: 'Python API', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w05 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W05 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'L03,L05,P01' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/cccl-experimental-python/" lang="en">Read the English counterpart</a>

## 动机

CUDA 核心计算库（CUDA Core Compute Libraries，CCCL）集合了可复用算法与 CUDA C++ 基础组件，但一个仓库名不代表统一的稳定性承诺。稳定的 CUB 原语不能把自己的契约借给相邻的实验任务图或 Python 绑定。

## 稳定前置知识

[L03：CUB 设备原语](/libraries/cub-device-primitives/)、[L05：libcu++ 同步](/libraries/libcu-plus-plus-synchronization/)和 [P01：CUDA Python 桥接](/python/cuda-python-bridge/)区分算法所有权、完成条件与语言绑定。

## 当前接口状态

本次核对源码标签 **CCCL v3.4.3**。`cuda::experimental`（cudax）明确**不保证 API 或 ABI 稳定性**；该版本文档说明它通过 GitHub 分发，而非随 Toolkit 提供。另外，**cuda.compute 处于 public beta**，API 可能无预告变化。`cuda.coop._experimental` 提供块级、线程束级协作原语，命名本身就表达了实验性质。`cuda-cccl` 包元数据分类为 Beta。这些接口不能与稳定课程（Stable Curriculum）选定的 Thrust、CUB、libcu++ 接口混为一谈。

## 软件与硬件门槛

Python README 列出的上游要求是 Python **3.10+**、Toolkit **12.x 或 13.x**、CC **6.0+**；本站基础门槛仍是 CC 7.5+。`cu12`/`cu13` extras 可安装 Toolkit 组件，`sysctk12`/`sysctk13` 则要求用户提供兼容的系统组件。v3.4.3 的绑定约束分别为 **>=12.9.1,<13.0.0** 和 **>=13.0.0,<14.0.0**。依赖 Numba 的 extras 还限制 numba-cuda，并排除特定版本。应在独立的原生 Linux 环境中锁定解析后的依赖集合、编译器/LTO 接口与目标；包名或宽泛的 extra 不是可复现配置。C++ 实验头文件需要单独核对该版本的编译器和方言要求，不能借用 Python 的要求。

## 限制与许可

设备级算法与块级原语有不同的参与者和临时存储责任。实验执行器不会自动延长所捕获指针对应的内存生命周期。每次依赖改变后，都应重新核对 API 形式、所有权、流完成条件与编译产物。本次核对的 Python `pyproject.toml` 文件头声明 **Apache-2.0 WITH LLVM-exception**；改编前仍需检查每个文件和仓库许可。本条目只链接、不再分发上游代码。[晋升](/watch/#晋升需要单独决策)仍须单独决策，本页没有构建、运行或性能证据。

## 回忆检查

“CCCL v3.4.3”是否表示 `cuda::experimental` 二进制接口稳定，或者 `cuda.compute` 已退出 beta？不是。必须读取具体命名空间的契约和带版本的包元数据。

## 维护方来源

访问日期 **2026-10-04**，标签 **v3.4.3**：[cudax 稳定性](https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/cudax/index.rst)、[Python README](https://github.com/NVIDIA/cccl/blob/v3.4.3/python/cuda_cccl/README.md)、[包与文件元数据](https://github.com/NVIDIA/cccl/blob/v3.4.3/python/cuda_cccl/pyproject.toml)、[beta API 警告](https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/python/compute_api.rst)、[发布修复](https://github.com/NVIDIA/cccl/releases/tag/v3.4.3)、[维护方测试目录](https://github.com/NVIDIA/cccl/tree/v3.4.3/python/cuda_cccl/tests)。存在测试不等于本站运行过测试。[观察区索引](/watch/)。
