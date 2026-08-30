---
title: 'A01 复核解答：Map Ownership 与数据移动'
description: A01 三道练习的 owner table、符号化 movement ledger、grid-stride proof、有效替代方案与常见错误。
pairId: a01-solutions
counterpart: /en/algorithms/elementwise-map/solutions/
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
unitId: A01-SOLUTIONS
prerequisites:
  - A01-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a01-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/elementwise-map/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A01-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/elementwise-map/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A01 练习（Exercise）](/algorithms/elementwise-map/exercises/)的独立复核解答。表格和证明只审查逐元素映射（elementwise map）的静态合同；它们不是 CUDA execution trace，也不提供 compilation、runtime 或 performance Evidence Status。

## 解答 1：为 rounded-up grid 建 owner table

| block | local thread | global index | `i < 10` | action |
| ---: | ---: | ---: | --- | --- |
| 0 | 0 | 0 | true | write `output[0]` |
| 0 | 1 | 1 | true | write `output[1]` |
| 0 | 2 | 2 | true | write `output[2]` |
| 0 | 3 | 3 | true | write `output[3]` |
| 1 | 0 | 4 | true | write `output[4]` |
| 1 | 1 | 5 | true | write `output[5]` |
| 1 | 2 | 6 | true | write `output[6]` |
| 1 | 3 | 7 | true | write `output[7]` |
| 2 | 0 | 8 | true | write `output[8]` |
| 2 | 1 | 9 | true | write `output[9]` |
| 2 | 2 | 10 | false | skip load/store |
| 2 | 3 | 11 | false | skip load/store |

对合法 index `i`，write set 是单元素集合 `{output[i]}`。一维映射 `4 * blockIdx.x + threadIdx.x` 在给定 ranges 内唯一；因此十个合法集合覆盖全部 output 且两两不相交。Indices 10 和 11 仍对应 launched threads，但 guard 让其 write set 为空。

## 解答 2：把 arithmetic 与 memory movement 分账

| 场景 A phase | symbolic amount | 含义 |
| --- | --- | --- |
| H2D `left` | `n * sizeof(float)` bytes | host input 到 device allocation |
| H2D `right` | `n * sizeof(float)` bytes | 第二个 host input 到 device allocation |
| kernel loads | `2 * n` float values requested | 每个合法 element 读两个 inputs |
| kernel stores | `n` float values requested | 每个合法 element 写一个 output |
| D2H `output` | `n * sizeof(float)` bytes | host 取得结果 |

| 场景 B phase | symbolic amount | 含义 |
| --- | --- | --- |
| H2D | none for this invocation | inputs 已常驻 device |
| kernel loads | `2 * n` float values requested | map contract 未变 |
| kernel stores | `n` float values requested | output 留在 device |
| D2H | none at this boundary | 下游 device kernel 消费结果 |

两种场景的 element arithmetic 都是每个合法 `i` 一次 addition。Bytes 描述 explicit copies；value requests 描述 kernel semantics。实际 memory transactions、cache behavior 与 performance 必须运行并测量，不能从这两张表直接得到。

## 解答 3：证明 grid-stride map 的 ownership

```text
t = blockIdx.x * blockDim.x + threadIdx.x
i = t
while i < 17:
  value = input[i]
  output[i] = 2 * value + 1
  i = i + 6
```

Index sequences 是：

| thread | indices |
| ---: | --- |
| 0 | `0, 6, 12` |
| 1 | `1, 7, 13` |
| 2 | `2, 8, 14` |
| 3 | `3, 9, 15` |
| 4 | `4, 10, 16` |
| 5 | `5, 11` |

每个 `i` 可唯一写成 `i = 6q + r`，其中 `r` 在 `0..5`；thread `r` 因而是唯一 owner。所有 sequences 的并集覆盖 `0..16`。

完全 in-place 时，一个 iteration 先把 `input[i]` 读入 thread-local `value`，再覆盖同一位置。没有其他 thread 读 `i`，所以 proof 不依赖执行顺序。Partial overlap 或跨 index transform 不满足这份证明，必须另立 alias contract。未来 GPU run 仍需检查 launch error、completion 和 output oracle；本证明不观察这些事实。

## 有效替代方案

- Exercise 1 可按 global index 排表，也可按 block 分成三张表，只要 12 个 threads 全部出现。
- Movement ledger 可以改用 symbolic elements 和 bytes 两列，但不能把 requested values 当成 transaction count。
- Exercise 3 可用集合 `{t + 6k | k >= 0, t + 6k < 17}` 代替枚举后再用 remainder proof。
- Pointwise in-place map 可先存到 register 再写回，也可使用独立 output；两者都要声明 alias policy。

## 常见错误

- 把 indices 10 和 11 从 launch table 删除，而不是记录为 bounds-invalid threads。
- 只证明 coverage，未证明两个 threads 不会写同一个 output。
- 把 H2D/D2H copies 与 kernel global loads/stores 合并成一个模糊的“内存成本”。
- 从 symbolic bytes 推断实际 transactions、bandwidth 或 speedup。
- 在 grid-stride loop 中使用 `blockDim.x` 而不是全部 launched-thread count 作为 stride。
- 认为任何 overlap 都可原地执行，遗漏跨 index read-after-write hazard。

复核日期：**2026-08-30**。四个 evidence arrays 与对应 head metadata 均保持为空。
