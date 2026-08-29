---
title: 'M09 参考解答：设计正确的重叠流水线'
description: M09 三道练习的 page-lock ownership ledger、safe two-slot chunk graph 与 capability-to-observation decision table。
pairId: m09-solutions
counterpart: /en/memory/pinned-memory-transfer-overlap/solutions/
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
unitId: M09-SOLUTIONS
prerequisites:
  - M09-EXERCISES
relatedUnits:
  - M09
  - M10
  - Q05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m09-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M09,M10,Q05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/pinned-memory-transfer-overlap/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案把 [M09 练习（Exercise）](/memory/pinned-memory-transfer-overlap/exercises/)解成 static contracts；它们不执行 EX07、不报告 timeline，也不建立 transfer-overlap evidence。

## 解答 1：审查 page-locked buffer plan

| host range | byte owner | page-lock owner | completion 与 release |
| --- | --- | --- | --- |
| `cudaMallocHost` range | CUDA Runtime allocation | CUDA Runtime | 等待 last asynchronous user，再调用一次 `cudaFreeHost` |
| `cudaHostAlloc` range | CUDA Runtime allocation | CUDA Runtime | 等待 last asynchronous user，再调用一次 `cudaFreeHost` |
| registered `malloc` range | original host allocator | CUDA registration | 等待 last asynchronous user，调用 `cudaHostUnregister`，再由 original allocator 释放 |
| pageable `std::vector` range | C++ object | none | 保持 C++ object lifetime；不把这条 copy path 当作 overlap evidence |

修复后的 sequence 在 enqueue 前 allocation/registration 有界 working set，记录每个 range 的 last copy，建立 completion，之后才 unpin/free。Registration 改变 range 的 CUDA-use contract，但不会把 byte ownership 转给 CUDA。

## 解答 2：推导可复用的 three-chunk pipeline

一份有效的 two-slot ledger 是：

```text
stream_0 / slot_0: H2D(0) -> kernel(0) -> D2H(0) -> record(done_0)
stream_1 / slot_1: H2D(1) -> kernel(1) -> D2H(1) -> record(done_1)
host reuse slot_0: synchronize(done_0) -> verify(0) -> fill(2)
stream_0 / slot_0: H2D(2) -> kernel(2) -> D2H(2) -> record(done_2)
```

Host 对 `done_0` 的 synchronization 保护 host verification 与 slot 0 overwrite；仅有 device-side stream wait 不能 ordering 这些 host accesses。Host 等待 chunk 0 时，chunk 1 可以继续。只要各自 predecessors 满足，`kernel(0)` 与 `H2D(1)` 等 pair 仍保持 unordered，因此只能称 eligible，不能称 observed overlap。

每个 chunk 保留自己的 H2D-kernel-D2H chain。Final host boundary 在验证剩余 output 或释放 shared resource 前等待 `done_1` 与 `done_2`。

## 解答 3：设计 capability-to-observation review

| gate | required record | allowed conclusion |
| --- | --- | --- |
| correctness | 相同 logical work、CPU/output oracle、成功 error checks、safe lifetimes | serialized 与 pipelined results 独立于 overlap pass/fail |
| eligibility/capability | pinned-range proof、dependency graph、exact device query/value、transfer direction | run configuration eligible、unsupported 或 under-specified |
| observation | Q05-compliant timing context，以及命名 copy/kernel intervals 的 raw device timeline | exact run 中观察到 overlap，或仍保持 unobserved |

Correctness failure 后立即停止。若 correctness pass 但 capability gate 不通过，保留 baseline result，不声明 overlap。若两项都通过但没有 timeline，则报告 “eligible but unobserved”。API name、stream count、event timestamp 与 nonzero capability value 都不能替代 interval evidence。

## 有效替代方案

- Existing allocation 的 alignment、size、ownership 与 platform support 已复核时，可用 `cudaHostRegister`，不必替换成 CUDA-owned allocation。
- 可用 non-blocking event polling 代替 blocking event wait 来保护 host slot reuse，前提是 completion 前 host 不访问该 slot。
- Ownership ledger 能随之扩展且后续 measurement 证明额外资源有价值时，可使用两个以上的 bounded slots。
- Overlap capability 或 evidence 缺失时，可保留 single serialized stream 作为 production fallback。

## 常见错误

- 对 CUDA 只做 registration 的 memory 调用 `cudaFreeHost`。
- Asynchronous copy 仍可能使用 host range 时就 unregister/free。
- 在 steady-state enqueue window 内分配 page-locked buffers。
- 把 `cudaMemcpyAsync`、multiple streams 或 `asyncEngineCount` 当作 observed overlap proof。
- Device wait 后直接 reuse ring slot，忘记 host 也需要 completion observation。
- 把 side-by-side boxes 或 symbolic event time 报告为 copy-engine timeline。

复核日期：**2026-08-29**。Compilation、runtime、expected-observation 与 recorded-observation axes 保持为空。
