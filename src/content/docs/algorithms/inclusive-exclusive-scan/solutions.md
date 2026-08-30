---
title: 'A03 参考解答：Inclusive/Exclusive Scan 与 Multi-block Propagation'
description: A03 三道练习的 scan table、ping-pong stage trace 与 block-offset propagation 复核。
pairId: a03-solutions
counterpart: /en/algorithms/inclusive-exclusive-scan/solutions/
factCheckDate: '2026-08-30'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: A03-SOLUTIONS
prerequisites:
  - A03-EXERCISES
relatedUnits:
  - A03
  - EX12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A03,EX12' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/inclusive-exclusive-scan/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A03 练习（Exercises）](/algorithms/inclusive-exclusive-scan/exercises/)的独立参考页。表格验证 scan recurrence 与 stage contract，不构成 GPU runtime observation。

## 解答 1：从一个输入同时推导两种 scan

Addition 的单位元（identity）是 0：

| `i` | `x[i]` | inclusive | exclusive |
| ---: | ---: | ---: | ---: |
| 0 | 4 | 4 | 0 |
| 1 | 1 | 5 | 4 |
| 2 | 3 | 8 | 5 |
| 3 | 2 | 10 | 8 |
| 4 | 6 | 16 | 10 |

每一行都满足 `inclusive[i] = exclusive[i] + x[i]`。除第一行外，`exclusive[i] = exclusive[i-1] + x[i-1]`；第一个 exclusive value 直接由 identity 定义。

## 解答 2：构造 stage snapshot

使用 `A` 与 `B` 两个 shared buffers：

| stage | distance | read | write | snapshot after barrier |
| ---: | ---: | --- | --- | --- |
| 0 | 0 | input | A | `[2,5,1,4]` |
| 1 | 1 | A | B | `[2,7,6,5]` |
| 2 | 2 | B | A | `[2,7,8,12]` |

每个 lane 先完成当前 write，再由四个 participants 到达 barrier，然后交换 read/write roles。Ping-pong ownership 防止 stage 1 的新值污染另一个 lane 对 stage 0 的读取；barrier 让完整 snapshot 在下一 stage 前可见。

## 解答 3：完成 multi-block offset propagation

Local inclusive scans 分别是 `[3,4,6,10]`、`[5,7,8,11]`、`[6,13]`，所以 block sums 是 `[10,11,13]`。对 sums 做 exclusive scan 得到 offsets `[0,10,21]`。

```text
block 0: [3,4,6,10] + 0  -> [3,4,6,10]
block 1: [5,7,8,11] + 10 -> [15,17,18,21]
block 2: [6,13] + 21      -> [27,34]
```

拼接后得到 `[3,4,6,10,15,17,18,21,27,34]`。第三个 block 的 logical count 是 2，因此 sum 只包含 6 和 7。每个 kernel phase 完成后，下一个 phase 才读取它产生的 sums 或 offsets。

## 有效替代方案

- Exclusive output 可以由 inclusive result 右移并插入 identity，也可以由直接的 exclusive tree 产生，只要 recurrence 与顺序成立。
- Snapshot 可以使用两个 buffers，也可以使用另一种已证明不会发生 same-stage overwrite 的结构。
- Block-sums scan 可以递归使用同一算法，或在规模有明确上界时使用另一条正确路径。
- 非 addition 运算在传播阶段应用 `op(offset, local_prefix)`，并保持原始 operand order。

## 常见错误

- 把 inclusive 与 exclusive 只理解成数组平移，却没有声明 identity。
- 在一个 shared array 上边读边写，并误以为单个末尾 barrier 能恢复 prior-stage snapshot。
- 让 edge lane 跳过 stage barrier。
- 把 block sum 当成 block offset，或把当前 block 的 sum 包含进 exclusive offset。
- 用 physical last lane 读取 partial block total，而不检查 logical last element。
- 从 stage depth、kernel 数量或 production primitive 推断未观察的 speedup。

复核日期：**2026-08-30**。Compilation 与 runtime evidence axes 保持为空。
