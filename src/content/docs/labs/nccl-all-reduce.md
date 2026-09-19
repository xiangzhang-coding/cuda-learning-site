---
title: 'LAB17：运行并解释 NCCL 全归约'
description: 保留逐 rank 正确性与解释结果所需的环境，不虚构硬件证据。
pairId: lab17
counterpart: /en/labs/nccl-all-reduce/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [goal, prerequisites, environment, build, run, correctness, explanation, expected, recorded, sources]
resourceKind: lab
unitId: LAB17
prerequisites: [G04, G05]
relatedUnits: [EX24]
exampleIds: [EX24]
hardwareGate: '原生 Linux；至少两个独立完整 GPU，各 CC 7.5+、总内存 >=8 GB、空闲 >=256 MiB'
estimatedMinutes: 90
difficulty: advanced
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '7.5'
maximumProblemMemoryBytes: 8388608
gpuCount: 2
permissions: ['读取授权的拓扑和设备清单', '构建 EX24 并访问选定 GPU', '写入私有环境、构建和 rank 日志']
evidence:
  compilation: []
  runtime: [Pending Hardware Verification]
  expectedObservations: ['Every rank should have zero mismatches for all three counts after stream completion and successful cleanup.']
  recordedObservations: []
sources:
  - { title: 'NCCL selected source', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab17 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,prerequisites,environment,build,run,correctness,explanation,expected,recorded,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB17 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G04,G05' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX24 } }
  - { tag: meta, attrs: { name: 'cuda:example-ids', content: EX24 } }
  - { tag: meta, attrs: { name: 'cuda:estimated-minutes', content: '90' } }
  - { tag: meta, attrs: { name: 'cuda:difficulty', content: advanced } }
  - { tag: meta, attrs: { name: 'cuda:toolkit-lanes', content: cuda-13.3 } }
  - { tag: meta, attrs: { name: 'cuda:minimum-compute-capability', content: '7.5' } }
  - { tag: meta, attrs: { name: 'cuda:maximum-problem-memory-bytes', content: '8388608' } }
  - { tag: meta, attrs: { name: 'cuda:gpu-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/labs/nccl-all-reduce/" lang="en">Read the English counterpart</a>

## 目标与交付物

在外部环境运行原创 [EX24](/examples/nccl-all-reduce/)，保留每个 rank 的正确性结果，解释流依赖链。提交源码／构建身份、完整环境工作表、附退出状态的私有原始日志、rank／设备表、工作负载表及依赖说明。预计 90 分钟。网站不执行 CUDA。

## 精确先修

**[G04, G05]**：[通信器与集合通信](/multi-gpu/nccl-communicators-collectives/)和[流依赖](/multi-gpu/nccl-stream-dependencies/)。EX24 是规范可执行项目，不是另一个先修学习单元。先完成两个单元的练习。

## 阶段一：确立环境

使用原生 Ubuntu 24.04 x86-64、C++17、Toolkit 13.3.1、NCCL 包 `2.31.2-1+cuda13.3`、驱动 ≥610.43.02。选择两个独立完整 GPU，各 CC≥7.5、总内存 ≥8 GB、空闲 ≥256 MiB；记录精确值，不只记录产品名。调用者最大分配为每 GPU 8 MiB，库／上下文另需资源，主机输入／输出另占每 rank 8 MiB。可选 R=3–8 需 R 个合格 GPU。MIG、虚拟机、多节点不在本配置范围。

把规范项目的空白 `environment-manifest.json` 复制到私有工作区，填写[环境清单（Environment Manifest）](/start/environment-manifest/)：

| 字段 | 必需记录 |
| --- | --- |
| 源码／构建 | 不可变源码提交、构建契约哈希、编译器、命令与状态 |
| 设备 | 数量、逐设备 CC／总内存／空闲内存，rank→可见序号→私有物理身份 |
| 平台 | OS／架构、精确驱动／Toolkit／NCCL 包、CUDA API 代码、加载库路径／哈希 |
| 拓扑 | 授权的 `nvidia-smi --version`、`-L`、`topo -m`、`topo -mp`，本地帮助／图例、权限和错误 |
| P2P 平台 | 操作员对 IOMMU／ACS 与 peer 路径适用性的评估；未知即阻塞 |
| 执行 | 一个进程、一个提交线程、每 rank 一个非阻塞 CUDA 流；默认阻塞 NCCL 通信器 |
| 配置 | CUDA 可见性、NCCL 环境变量／配置文件／插件；基线不自定义调优覆盖 |
| 负载／结果 | R、所有 count、类型、归约、输入公式、逐 rank 不匹配数量、完成／清理和退出状态 |

按 [G03](/multi-gpu/topology-paths/) 在私有记录中核对身份。平台适用性未知或不兼容时，不运行直接 PCIe peer 通信；请操作员评估，不自行改变 IOMMU／ACS 策略。没有硬件或权限被拒绝时停止，提交阻塞原因，观察字段保持未填。不能用单 GPU 上两个 rank 替代双 GPU。

## 阶段二：构建相同源码

取得 EX24 不可变源码／下载，验证包哈希并遵循构建命令。保留 `make host-test preprocess inspect` 各阶段日志、`g++ --version`、包身份与链接检查。Docker 构建不使用 GPU；CPU 参考和链接不确立运行证据。主机参考在任何 GPU 测试前检查有符号手算值与故意损坏。

## 阶段三：带有限失败处理运行

在合格原生主机的 EX24 目录中：

```sh
timeout --signal=TERM --kill-after=5s 180s env NCCL_DEBUG=INFO ./build/ex24-nccl-all-reduce 2 > rank-run.log 2>&1
status=$?
```

立即连同命令和私有原始日志保留 `status`。日志包含交错的库诊断与带 `rank=` 的程序行；按 rank 和 count 索引这些行，但不替换原始文件。超时（通常为 124）、信号、GPU 不足、包不匹配、CUDA／NCCL 失败或非零不匹配均为失败／阻塞。保留首个失败并停止，不能把部分输出解释为集合通信成功。外部 watchdog 覆盖内部 60 秒完成轮询无法中断的主机调用。

## 阶段四：验证所有 rank

对计数 1、257、1048576，每个 rank 都须有一条结果，类型为 `ncclInt32`，归约为 `ncclSum`，不匹配为零。独立复算 CPU 参考 `3*R*(R+1)/2+R*((i mod 17)-8)`，解释依赖 rank 的输入。要求最终成功清理行**和零退出状态**同时成立。即使其他行通过，缺少 rank／count 行也不满足完整性。把手算预期 -7（R=2/i=0）与实际日志分开。没有带宽或延迟验收阈值。

## 阶段五：解释依赖

每个 rank 画一条执行线：上传 → all-reduce → 下载 → 完成轮询 → CPU 比较 → 分组 finalize → 释放。在主机线上标注 group start／end。说明单提交线程为什么需要分组、group end 成功为什么只是入队、为什么所有缓冲区须存活到各 rank 完成。加上 G05 的纸面双流 ready／done 事件变体，不声称实测重叠。[VIS16](/visuals/collective-paths/) 是逻辑路由模型，不是本次执行选中的算法。

## 预期观察

流完成并成功清理后，每个 rank 在全部三种计数下都应无不匹配。头文件与加载版本代码应匹配；另行记录的软件包和哈希确立更细身份。解释所有必需依赖。这些是验收标准，不是实测结果。

## 已记录结果与证据

**没有已记录的合格双 GPU 执行。** Rank 日志、拓扑观察、算法选择、计时、带宽、集合通信输出均未记录。编译证据独立为空；EX24／LAB17 保持待硬件验证（Pending Hardware Verification）。公开工作表的已记录数组为空。未来维护者运行验证需要声明的基准环境（Reference Environment）及经过复核的原始记录；社区报告不能自动取代它。分享脱敏派生记录前审查日志中的机器身份，私下保留原始记录到派生记录的映射。

## 来源与权利

复核日期 **2026-09-19**：[SRC-CUDA-097](/sources-and-versions/#src-cuda-097)、[SRC-CUDA-098](/sources-and-versions/#src-cuda-098)。协议与工作表原创，没有导入 NCCL 示例或虚构运行。
