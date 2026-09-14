---
title: 'T02 独立参考解答'
description: 核对安全掩码修复、哨兵检测漏写的方法以及证据限制。
pairId: t02-solutions
counterpart: /en/triton/masked-vector-addition/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, practice-bank, sources]
resourceKind: solution-set
unitId: T02-SOLUTIONS
prerequisites: [T02-EXERCISES]
relatedUnits: [T02]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton masked memory semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper solution', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/masked-vector-addition/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,practice-bank,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: T02 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/masked-vector-addition/solutions/" lang="en">Read the English counterpart</a>

## 尝试后核对

精确前置为 `[T02-EXERCISES]`：先完成[练习](/triton/masked-vector-addition/exercises/)。这些逻辑参考答案不授予编译或运行证据。

## 解答 1：在操作处保护内存

三个程序实例（program instance）覆盖 384 个位置。实例 2 构造 256–383：只有 256–258 有效，259–383 被屏蔽，共 125 个无效位置。第一个无掩码读取和无掩码写入都违反内存契约。两个输入读取都需要 `mask=i<N` 与 `other=0.0`，写入独立需要 `mask=i<N`。带掩码写入不能修复不安全读取。

`where` 会求值两个值参数。等到它选择零时，无掩码读取已经被表达为内存操作。使用 [T02](/triton/masked-vector-addition/) 中的规范修正模式，保持输入指针、掩码和值的块形状兼容。输出保护区用于检测问题，不是额外逻辑输出。

## 解答 2：让未写入值无法通过验收

把有效输出和尾部保护区初始化为 NaN，使用长度 256 和 257。对最后一个和为零的情况，选择能精确表示且互为相反数的末尾输入，例如 0.5 与 −0.5。同步后复制到 CPU，拒绝有效输出中的非有限值，再把所有值与独立 CPU 参考比较。变异会让最后一个有效输出留为 NaN，即使预期为零，也必须失败。

单独检查尾部保护区，发现 `N` 之外的写入。保护区不变不能证明每个有效输出都写过，也不能证明每次读取都在界内。CPU 模拟可以测试参考规则与计划索引，只有合格 GPU 执行才能测试编译内核。不能把模拟成功转为运行已验证（Runtime-Verified）。

## 练习题库核对

<a id="pb-r5-014-solution"></a>
对 [PB-R5-014](/practice/#pb-r5-014)，只检查 `N=1003` 的前 128 个值，完全碰不到最后一个实例。输出保护区不变本身无法发现有效位置漏写；EX02 编译报告涉及另一个对象。应要求全输出有限性比较、精确 EX23 源码与环境身份、同步、实际运行日志和证据审查。没有合格执行时，EX23 保持待硬件验证（Pending Hardware Verification）；不得编造性能对比。

## 来源与返回

返回 [T02](/triton/masked-vector-addition/)。[SRC-CUDA-087](/sources-and-versions/#src-cuda-087) 核查了掩码与求值语义，日期为 2026-09-14。原创解答采用 CC BY 4.0。
