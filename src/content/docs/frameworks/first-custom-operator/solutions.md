---
title: 'P08 独立参考解答'
description: 逐步推导相邻边算术，分别修复索引和当前流提交。
pairId: p08-solutions
counterpart: /en/frameworks/first-custom-operator/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: solution-set
unitId: P08-SOLUTIONS
prerequisites: [P08-EXERCISES]
relatedUnits: [P08, EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p08-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/first-custom-operator/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P08-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'P08,EX22' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/first-custom-operator/solutions/" lang="en">Read the English counterpart</a>

## 先尝试，再审查

先完成 [P08 练习（Exercise）](/frameworks/first-custom-operator/exercises/)。以下是推导和实现标准，不是原生执行日志。合同参见 [P08](/frameworks/first-custom-operator/)。

## 解答 1：计算输出域

`[0,0.5,-0.5,1]` 的差分为 `[0.5,-1,1.5]`，输出为 `[0.25,1,2.25]`。使用 256 线程块时：

| n | 输出数 | 块数 | 不活动线程数 |
| --- | --- | --- | --- |
| 1 | 0 | 0 | 0 |
| 257 | 256 | 1 | 0 |
| 258 | 257 | 2 | 255 |

指针访问前验证，分配 n-1 个元素，输出数为零时立即返回；每个 CUDA 输出索引通过检查后才读取输入对。偏移连续视图的数据指针已经调整，再加一次存储偏移会出错。实现对照 [EX22](/examples/adjacent-energy/) 的规范 CPU/CUDA 范围。**有效替代方案：** 有界 grid-stride 循环也可保持合同，前提是每个输出仍只有一个写者。**常见错误：** 接受任意步长却不按步长索引、用 n 当输出大小、只检查第一个元素。

## 解答 2：修复两个独立边界

n=258 时错误实现的最后活动线程 i=257 会读取 x[258]，越过输入末尾。应分配 257 个输出并检查 i<257；仍启动两个块，剩余线程不得读取。n=1 时直接产生空结果，不启动。

修复后流缺陷仍存在。用作用域 guard 选择输入设备，取得其当前流，再在该流提交核函数。把生产者、此操作和依赖消费者放在同一非默认流上；该流完成后才能对照独立参考检查消费者。输入输出所有者要活到使用结束。**有效替代方案：** 多流之间显式依赖图也可建立顺序，但对当前流算子没有必要。**常见错误：** 试图在既有竞争后加设备同步补救、把启动查询成功当作完成、把 CPU-only 测试当作 CUDA 顺序测试。

## 继续学习

尝试 [PB-R5-008](/practice/#pb-r5-008)，阅读 2026-09-13 核对的 [SRC-CUDA-084](/sources-and-versions/#src-cuda-084)。实际 GPU 结果需要环境清单（Environment Manifest）与独立硬件验收。
