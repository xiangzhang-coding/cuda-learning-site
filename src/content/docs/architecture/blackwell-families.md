---
title: 'H05：Blackwell 家族与编译目标范围'
description: 调优之前，先区分文档中的能力家族、编译目标和实际功能准入。
pairId: h05
counterpart: /en/architecture/blackwell-families/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, families, targets, compiler, features, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H05
prerequisites: [H04, M17, L08]
relatedUnits: [H06, VIS15]
hardwareGate: none
estimatedMinutes: 40
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Compute Capabilities', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Documented Blackwell families', accessDate: '2026-10-04' }
  - { title: 'NVCC archived target tables', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html', version: '13.3', platform: 'Toolkit 13.3.1 archive', accessDate: '2026-10-04' }
  - { title: 'Blackwell Tuning Guide', url: 'https://docs.nvidia.com/cuda/blackwell-tuning-guide/index.html', version: '13.4', platform: 'Source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h05 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,families,targets,compiler,features,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H05 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H04,M17,L08' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/blackwell-families/" lang="en">Read the English counterpart</a>

## 学习目标

用 40 分钟为计算能力（Compute Capability，CC）10.3、11.0、12.1 的设备建立目标准入账本，解释为什么更新的产品不能自动执行旧的架构专属镜像。目标描述功能契约，不是性能分数。

## 先修知识

精确有序先修：**[H04, M17, L08]**。[H04](/architecture/hopper-clusters-tma/)提供拷贝完成与集群生命周期知识；[M17](/toolchain/compiler-architecture-targets/)解释虚拟与真实目标选择；[L08](/libraries/tensor-core-precision-contracts/)解释精度与 Tensor Core 参与条件。使用 [VIS15](/visuals/architecture-evolution/)比较这些契约。

## Blackwell 包含多个能力家族

已核对的 Programming Guide 13.4.2 区分 **10.0、10.3、10.7、11.0、12.0 和 12.1**。不要把它们压缩为 `major >= 10`。当前表格记载了 10.7，而选定的 Toolkit 13.3.1 编译器归档列出 100/103/110/120/121 目标。这一区别很重要：文档中的设备不自动成为 EX25 的构建目标。

回顾演进：Turing 让独立线程调度的后果更明确，Ampere 增加拷贝／屏障硬件，Hopper 增加集群协作和 TMA，Blackwell 在计算资源分化的同时增加家族范围特化。市场架构名称、精确 CC、指令集、显存容量与部署平台分别回答不同问题。

## 三种目标范围

| 契约 | 示例 | 准入规则 |
| --- | --- | --- |
| 普通虚拟目标 | `compute_100` | 基础功能；驱动合适时，PTX 可以在兼容的后续设备上 JIT 编译 |
| 架构专属 | `compute_100a` / `sm_100a` | 仅精确 CC 10.0；不向前或向后兼容其他 CC |
| 家族专属 | `compute_100f` / `sm_100f` | 仅文档声明的家族目标集合，不是所有 Blackwell 设备 |

家族关系有方向。当前指南规定：**100f → {10.0,10.3,10.7}；103f → {10.3,10.7}；107f → {10.7}；110f → {11.0}；120f → {12.0,12.1}；121f → {12.1}**。所以 103f 不服务 10.0，100f 不服务 11.0，121f 不服务 12.0。不要把单成员集合外推到尚未核对的后续产品。

`a` 功能集包含 `f`，`f` 包含普通功能集；功能越多，兼容范围可能越窄。普通 **cubin** 的兼容性不同于普通 **PTX** 的前向兼容性：不要期望 `sm_90` cubin 跨主 CC 执行。保留普通 PTX 回退和／或匹配的 cubin；驱动若不理解 PTX 版本，仍会拒绝。后缀不能把不兼容指令变为可移植指令。

## 单独记录编译器支持

[EX25](/examples/feature-gated-copy/)完整对照固定为**工具包通道（Toolkit Lane）cuda-13.3：Toolkit 13.3.1、NVCC 13.3.73、Ubuntu 24.04 x86-64、GCC 13.3.0、C++17**。特化目标为 `90`、`100f`、`103f`、`110f`、`120f`、`121f`。例如 100f 生成 `arch=compute_100f,code=[sm_100f,compute_100f]`；独立基线生成 `compute_75` → `sm_75,compute_75`，另加 `compute_100` → `sm_100`。以源码树中的 Makefile 为准。

11.8.0/NVCC 11.8.89 与 12.9.2/NVCC 12.9.86 通道仅选择 EX25 的 `portable` 构建。这是项目支持范围，不表示 12.9 不能编译任何 Blackwell 目标。编译器目标列表用于发现；实际带后缀的编译与产物检查决定是否通过。EX25 在构建配置复核之前明确拒绝 10.7 特化。兼容时执行单独构建的普通路径，不要静默把 100f 换成 100a 或升级工具包通道。

## 功能和资源门槛

当前能力表为 10.x、11.0、12.x 列出集群、分布式共享内存（Distributed Shared Memory，DSM）和张量内存加速器（Tensor Memory Accelerator，TMA）。具备功能不取消 H04 的生命周期、资源与完成条件。Tensor Core 格式也有差异：10.0 和 10.7 列有原生 FP64 输入，10.3、11.0、12.x 没有。支持 FP4/FP6 不等于可以替换 FP32 运算；必须先定义缩放、舍入、累加、输出精度与可接受误差。EX25 使用精确 int32 拷贝，不改变精度。

已核对的每块共享内存上限：10.0/10.3/11.0 为 **227 KiB**，12.x 为 **99 KiB**，10.7 为 **327 KiB**。超过 48 KiB 需动态分配和显式启用；10.7 的每 SM 328 KiB 配置还需文档规定的超额共享内存模式。查询实际设备和内核限制。Blackwell 调优指南中部分 12.0 每 SM 资源描述与当前能力表不同；本单元的每块账本采用能力表，也不从任一表格直接推断占用率。

EX25 特化加载只需 1024 B tile 和 8 B 事务屏障；带保护区的全局输入／输出总计最多 **524352 B**。不使用张量映射、集群、多播、TMA 存储、Tensor Core 指令或家族独有指令。为精确家族构建共同的批量拷贝协议，可以学习目标准入，但不能声称展示了 Blackwell 的全部功能。

## 对有界工作负载调优

先确认结果正确，再检查指令／资源产物，并在同一设备上比较。1024 B 的小传输可能无法摊销提交和等待开销。增加流水线阶段会消耗共享内存，可能降低占用率。容量、功能声明和构建成功均不能证明带宽、重叠或加速比。

记录实际 GPU/CC、时钟、功耗、MIG/MPS、可用显存、驱动、编译器、目标镜像、输入规模与计时边界。Nsight Compute 需要管理员批准的性能计数器权限，以及精确 GPU 上可用的指标；权限失败就缺少对应观察。单 GPU 拷贝不能说明 NVLink、多 GPU 扩展或矩阵乘法表现。

## 证据边界

本学习单元（Learning Unit）的四个证据数组为空。架构行为和性能仍**待硬件验证（Pending Hardware Verification）**。EX25 按目标独立记录编译；LAB19、LAB20 需要合格基准环境（Reference Environment）执行及完整环境清单（Environment Manifest）。原生 Linux 是唯一受支持环境（Supported Environment）；浏览器不执行 CUDA。

## 检索检查

1. 文档集合中，100f、103f、110f 哪些能够服务 CC 10.3？
2. 为什么 `compute_100a` PTX 不能作为 12.1 的前向兼容回退？
3. 为什么 VIS15 可以展示 10.7，而 EX25 拒绝其特化？
4. 227 KiB 上限是否保证所选内核可以按此容量启动？
5. 有 FP4 硬件时，还缺少什么数值决策？

## 练习与下一步

完成 [H05 练习（Exercise）](/architecture/blackwell-families/exercises/)，再阅读[独立解答](/architecture/blackwell-families/solutions/)和练习题库（Practice Bank）[PB-R7-005](/practice/#pb-r7-005)。[H06](/architecture/portable-specialization/)把这些集合变为分派与回退契约；[LAB20](/labs/blackwell-portable-comparison/)提供有界执行流程。

## 来源与许可

核对日期 **2026-10-04**。通过当前 Context7 发现并核对权利方页面：[能力 §5.1](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)、[Toolkit 13.3.1 NVCC §5.2/5.5](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html#gpu-feature-list)、[Blackwell 调优 §1.4](https://docs.nvidia.com/cuda/blackwell-tuning-guide/index.html)。[SRC-CUDA-107](/sources-and-versions/#src-cuda-107)记录版本边界。原创教学账本与文字采用 CC BY 4.0；NVIDIA 文档保留其专有声明，未复制或改编权利方表格、图片或示例。
