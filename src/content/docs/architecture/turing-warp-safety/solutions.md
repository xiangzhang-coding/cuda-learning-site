---
title: 'H01 解答：发布、复用与分派'
description: 两轮交换的顺序证明及显式兼容回退。
pairId: h01-solutions
counterpart: /en/architecture/turing-warp-safety/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, warp, gating, evidence]
resourceKind: solution-set
unitId: H01-SOLUTIONS
prerequisites: [H01-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Turing independent thread scheduling', url: 'https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#independent-thread-scheduling', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,warp,gating,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/turing-warp-safety/solutions/" lang="en">Read the English counterpart</a>

## 先修

精确先修：[H01-EXERCISES](/architecture/turing-warp-safety/exercises/)。先完成尝试，再比较本原创解答。核对日期 **2026-09-22**，见 [SRC-CUDA-103](/sources-and-versions/#src-cuda-103)。

## 修复两条顺序边

没有发布屏障时，通道 0 可以在通道 1 写入前读取槽位 1。只有发布屏障时，两者先写第 0 轮并跨过屏障；随后通道 1 读槽位 0，再把槽位 1 改写为第 1 轮的 101，此时通道 0 还没读取预期的 1。这是允许出现的反例，不是观察到的 GPU 轨迹。

```text
require blockDim = (32, 1, 1), gridDim = (1, 1, 1)
require all 32 lanes participate in both rounds
mask = 0xffffffff
for round in [0, 1]:
    shared[lane] = input[32 * round + lane]
    __syncwarp(mask)                 // publication
    output[lane] = shared[lane XOR 1]
    __syncwarp(mask)                 // readers finish before reuse
```

第一个屏障让每个参与者写入先于对应伙伴读取；第二个让全部读取先于任何下一轮写入。全部参与者使用相同掩码，没有提前退出。最后一轮的复用屏障虽然保守，仍然有效。

| 通道 | 最终伙伴 | 最终期望值 |
| --- | --- | --- |
| 0 | 1 | 101 |
| 1 | 0 | 100 |
| 30 | 31 | 131 |
| 31 | 30 | 130 |

31 个逻辑元素时，保留 32 个物理线程与共享槽位，**每轮**向槽位 31 写零，保留两个完整线程束（Warp）屏障。只有输出 0–30 有效；按此补零约定，通道 30 返回零。对输入／输出访问加谓词，而不是对屏障加谓词。分配但未使用的输入／输出槽位不会被访问。若从成员集合删除通道 31，继续请求通道 31 的源数据仍然无效。活跃掩码无法制造其数据。

## 拒绝并替换方案

分别拒绝：唯一的 `sm_80` cubin 无法在 CC 7.5 执行；那里没有硬件 `cp.async`；即便显式启用，80 KiB 仍超过 Turing 单块 64 KiB 共享内存上限。产品字符串不能解决任何一项。

选择普通拷贝交换、32 位整数、全局 384 B、共享 128 B、`compute_75` / `sm_75` 和两个显式线程束屏障。拟议环境为原生 Ubuntu 24.04 x86-64、Toolkit 13.3.1、NVCC 13.3.73、GCC 13.3.0、C++17、驱动 610.43.02，以及一块 CC 7.5 GPU；有界问题适合 8 GB 内存预算。分派前查询真实设备／资源属性并检查产物。

编译期功能保护防止不兼容源代码分支进入目标编译阶段；主机 CC 查询在已构建路径之间选择；产物检查确认镜像与生成指令。任意单项都不能证明运行时选择并正确完成了预期路径，也不能在任意执行失败后悄悄回退。

## 仍需补充的证据

外部行为仍待硬件验证（Pending Hardware Verification）。纸面证明不增加编译、运行或性能观察。未来实现需要源码身份、完整环境清单（Environment Manifest）、保留的构建／目标记录、带错误检查的启动与完成、覆盖两轮和尾部的 CPU 比较，以及合格基准环境（Reference Environment）中的 racecheck/synccheck 报告。原创讲解和伪代码采用 CC BY 4.0；NVIDIA 来源保留各自声明。
