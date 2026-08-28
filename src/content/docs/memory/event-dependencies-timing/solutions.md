---
title: 'M08 参考解答：跟踪事件依赖与计时'
description: M08 练习的 selective wait graph、re-record generation table 与 dependency/timing event design。
pairId: m08-solutions
counterpart: /en/memory/event-dependencies-timing/solutions/
factCheckDate: '2026-08-28'
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
unitId: M08-SOLUTIONS
prerequisites:
  - M08-EXERCISES
relatedUnits:
  - M08
  - VIS07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m08-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M08,VIS07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/event-dependencies-timing/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案用 symbolic states/timestamps 解答 [M08 练习（Exercise）](/memory/event-dependencies-timing/exercises/)，不报告 measured device behavior。

## 解答 1：跟踪 selective event dependency

Producer chain 是 `P1 -> record(E1) -> P2`；consumer chain 是 `wait(E1) -> C1 -> C2`。`E1` 捕获 producer prefix 到 record point。Stream wait 添加 `P1 -> C1`，per-stream order 又把 relation 延伸到 `C2`。没有另一条 edge 时，`P2` 与 `C1/C2` 保持 unordered。Host enqueue wait 后继续；这是 device dependency，不是 host wait。

## 解答 2：为一个 re-recorded event handle 标版本

| API call | selected state | meaning |
| --- | --- | --- |
| first record | `E1` | 捕获 producer work 到 `P1` |
| `W1` | `E1` | later consumer work 等待 first capture |
| second record | `E2` | 用到 `P2` 的 work overwrite handle state |
| `Q2` | `E2` | non-blocking 检查 second-capture completion |
| `W2` | `E2` | later consumer work 等待 second capture |
| `S2` | `E2` | host 等待 second-capture completion |

Second record 改变 future API selections，不改变 `W1`。Second record 后提交的 work 位于 `E2` 外，除非另一 record 再次替换它。

## 解答 3：分开 dependency flags 与 timing endpoints

用 `cudaEventDisableTiming` 创建 dependency event `ready`，供 documented record、wait、query 或 synchronize operations 使用。另建 timing-enabled `start`/`stop`，在 intended stream order 中包围 declared region，等待 `stop`，再使用：

```text
elapsed_ms = timestamp(stop) - timestamp(start)
```

把 `ready` 作为任一 elapsed endpoint 会违反 timing-disabled contract，并得到 documented invalid-resource-handle error。Symbolic subtraction 规定 interval，却不提供 measured result。

## 有效替代方案

- Host 确实需要 captured result 时可以 host synchronize，但应认识到它比 device-work stream wait 更宽。
- 若 generation ownership 难以复核，可使用 distinct event handles 而不是 re-record。
- 若 included-work contract 明确，可用 separate timing endpoints 包围更大或更小 region。

## 常见错误

- Host-side record call 返回时就假设 record completion。
- 让 wait 捕获 event record point 后提交的 producer work。
- Re-record handle 后 retarget earlier wait。
- 把 `cudaEventQuery` 当成 blocking wait。
- 把 `cudaEventDisableTiming` event 传给 `cudaEventElapsedTime`。
- 从 symbolic timestamps 发布虚构 duration 或 concurrency conclusion。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
