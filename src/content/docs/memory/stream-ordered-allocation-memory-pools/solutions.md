---
title: 'M11 参考解答：排列分配生命周期与内存池策略'
description: M11 练习的 reviewed same-stream/cross-stream lifetime graphs 与 bounded memory-pool policy verdict。
pairId: m11-solutions
counterpart: /en/memory/stream-ordered-allocation-memory-pools/solutions/
factCheckDate: '2026-08-29'
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
unitId: M11-SOLUTIONS
prerequisites:
  - M11-EXERCISES
relatedUnits:
  - M11
  - M09
  - M14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m11-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M11,M09,M14' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/stream-ordered-allocation-memory-pools/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M11 练习（Exercise）](/memory/stream-ordered-allocation-memory-pools/exercises/)解答为 static dependency/policy records。它们不包含 support-query result、allocator address、memory statistic 或 timing measurement。

## 解答 1：限定一个 same-stream lifetime

Stream ledger 是：

```text
host:        cudaMallocAsync returns ptr
stream_work: malloc operation -> initialize(ptr) -> consume(ptr) -> free operation
logical use:                    [================]
```

API return 让 host code 得到 pointer value，却不代表 allocation-operation completion。Per-stream order 让两个 kernels 等到 allocation operation complete，并把 free 放在两个 kernels 后。Left boundary 前或 execution reaches right boundary 后的 access 都是 undefined behavior。该 graph 不说明 backing-resource decision 或 duration。

## 解答 2：Free 前 join 每个 last use

一种 valid repair 是在 allocation 后 record `ready`，让两个 use streams 都 wait 它，在各自 last use 后 record `done_a`/`done_b`，然后在 free 前等待两个 completion events：

```text
stream_allocate: malloc(ptr) -> record(ready)
stream_a:        wait(ready) -> use_a(ptr) -> record(done_a)
stream_b:        wait(ready) -> use_b(ptr) -> record(done_b)
stream_release:  wait(done_a) -> wait(done_b) -> free(ptr)
```

Allocation completion 到每个 first use 都有 path，每个 last use 到 free 也都有 path。`use_a` 与 `use_b` 彼此仍 unordered。`stream_release` 的两个 waits 形成 join；它们的 host issue order 不会删除任一 required dependency。

## 解答 3：复核 pool controls，不作过度声明

| Review subject | Supported conclusion | Rejected conclusion |
| --- | --- | --- |
| support gate | checked `cudaDevAttrMemoryPoolsSupported` nonzero result 允许该 path | installed headers 证明 device support |
| pool selection | explicit properties 可以支持 `cudaMemPoolCreate`/`cudaMallocFromPoolAsync` | explicit 天生比 default/current 快 |
| follow-event reuse | allocator 可以考虑 documented event edge 后的 memory | next allocation 必须使用相同 address |
| opportunistic reuse | allocator 可以考虑 already completed free | allocation pattern 在 runs 间固定 |
| internal dependencies | allocator 可以为 safe reuse 插入 ordering dependency | enable 后绝不会 serialize work |
| release threshold | pool 可以保留更多 reserved memory，之后尝试释放 excess | threshold 是 exact footprint 或 hard cap |
| performance | declared workload 与 measurements 可以支持 result | policy enablement 证明 speedup |

若 explicit pool 与 attribute values 的 ownership/policy rationale 已记录，repaired proposal 可以保留它们。Pointer equality、exact retained bytes 与 speedup 仍不得声明。

## 有效替代方案

- Serialization 可接受时，把两个 consumers 放进一个 stream；lifetime 需要的 cross-stream edges 更少。
- 若 downstream join 已明确依赖两个 consumers，可在该 join 后只使用一个 completion event。
- 没有 explicit-pool property requirement 时使用 default/current pool。
- 当 deterministic explicit ordering 比允许这些 reuse paths 更重要时，disable opportunistic 或 internal-dependency reuse。

## 常见错误

- 把 `cudaMallocAsync` return 当作 allocation completion。
- 没有 allocation-ready edge 就把 pointer 传给另一 stream。
- `cudaFreeAsync` 只 ordering 在多个 last uses 中的一个之后。
- 混淆 retained pool resources 与 still-live allocation。
- 把 reuse policy 当作 same-address guarantee。
- 把 release threshold 当作 exact footprint 或 performance result。

复核日期：**2026-08-29**。Compilation 与 runtime evidence axes 保持为空。
