---
title: 'G04 解答：先匹配，再测量'
description: 复核参与匹配与能区分 rank 的正确性参考。
pairId: g04-solutions
counterpart: /en/multi-gpu/nccl-communicators-collectives/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, contract, oracle, review]
resourceKind: solution-set
unitId: G04-SOLUTIONS
prerequisites: [G04-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL collective API', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/api/colls.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,contract,oracle,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-communicators-collectives/solutions/" lang="en">Read the English counterpart</a>

## 先修

先完成 [G04-EXERCISES](/multi-gpu/nccl-communicators-collectives/exercises/)。2026-09-19 依据 [SRC-CUDA-097](/sources-and-versions/#src-cuda-097) 复核。

## 解答一：匹配步骤表

使用独立可见设备 0、1，同一双成员通信器中的 rank 0、1，匹配的 `ncclAllReduce`、`ncclInt32`、`ncclSum` 与 count 257。各独立缓冲区需要 `257*4=1028` 字节。Root 参数属于 reduce／broadcast，不属于 all-reduce。单线程先对两个调用分组，再等待。本地 API 不能证明另一个 rank 的类型、计数、顺序和输出放置；这些应由程序不变量保证。

**有效替代：** 重排两个设备，但保持 rank 映射一一对应并记录。**常见错误：** 重复使用一个 GPU，把字节数当元素数，只有一个参与者调用 reduce，只检查 rank 0。

## 解答二：独立参考

Rank 项之和为 `3*R*(R+1)/2`，重复索引项贡献 `R*((i mod 17)-8)`。R=2/i=0 得到 `9-16=-7`；R=4/i=16 得到 `30+32=62`。双 rank 输入在 i=0 遗漏 rank 1 后只得到 -5，不是 -7；把 rank 1 完成后的输出替换成本地输入 -2，也会失败。主机测试中逐位置修改输出，证明比较覆盖。输入依赖 rank 才能区分贡献；检查全部数组可发现 rank 0 之外的陈旧接收缓冲区。

GPU 不足应在通信前阻塞。不匹配、异步失败、超时和清理失败均返回非零。输入向量存活到所有流工作完成，包括下载。这些算术推导和主机变异并非采集的 GPU 结果。

## 证据复核

可选执行需要 EX24 精确双 GPU 门槛、rank 日志和环境清单（Environment Manifest）。没有合格记录时，编译证据独立为空，运行保持待硬件验证（Pending Hardware Verification），已记录观察为空。不从解答推断算法选择或性能。
