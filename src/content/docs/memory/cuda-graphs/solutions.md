---
title: 'M14 参考解答：构造并审查重复 CUDA Graph work'
description: M14 练习的 equivalent ordinary/explicit/captured DAG plans、invalid-capture recovery，以及 replay、lifetime、completion 与 update repairs。
pairId: m14-solutions
counterpart: /en/memory/cuda-graphs/solutions/
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
unitId: M14-SOLUTIONS
prerequisites:
  - M14-EXERCISES
relatedUnits:
  - M14
  - M11
  - EX09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m14-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M14-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M14-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M14,M11,EX09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/cuda-graphs/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M14 练习（Exercise）](/memory/cuda-graphs/exercises/)作为 static graph/lifecycle review 解答。它们不替代 canonical EX09 source，不执行 capture、不 instantiate executable、不 launch graph，也不建立 performance evidence。

## 解答 1：对比 ordinary submission 与两种 graph construction

Node set 是 `{H2D, clear, compute, D2H}`。Adjacency list 是 `H2D: [compute]`、`clear: [compute]`、`compute: [D2H]`、`D2H: []`。Valid topological orders 可以让 `H2D`/`clear` 以任一顺序开头，随后是 `compute`、`D2H`。每条 edge 在任一 order 中都向前，因此没有 directed cycle。

**Ordinary plan：** 每次 iteration 都把 `H2D`/`clear` enqueue 到 separate named streams，用 explicit event edges 让 `compute` wait 两个 roots，在 `compute` 后 enqueue `D2H`，并在 host consume/reuse 前观察 covering completion。Host 每次都重复全部 operation submissions 与 completion boundary。

**Explicit plan：** 创建 graph，把 `H2D`/`clear` 加为 roots，把两者 handles 作为 dependencies 加入 `compute`，再把 `compute` 作为 dependency 加入 `D2H`。也可以在 node creation 后加入相同 edges，但 final node/edge set 必须一致。

**Capture plan：** 在 `origin` begin。Record captured fork event，让 `worker` wait 并加入同一 capture graph。在 `origin` capture `H2D`，在 `worker` capture `clear`。在 `worker` record captured completion event，让 `origin` 在 capture `compute` 前 wait；随后在 `origin` 上 capture `D2H` 并 end。该 event wait 让 `worker` 在 end 前 rejoin。

三种 plan 定义同一 partial order，并使用同一 output oracle；都不证明 `H2D`/`clear` concurrent execution 或 graph submission 更快。

## 解答 2：unwind invalidated stream capture

在 documented active-capture context 中，synchronous `cudaMemcpy()` 是 prohibited；query captured event 也 invalid，因为它代表 captured nodes，而不是 scheduled work。First invalid operation 会 invalidate capture graph；随后使用 associated capturing streams/captured events 都 invalid，只有 end capture 以 unwind 是例外。

`cudaStreamEndCapture()` 必须在 `origin` 调用，而不是 `worker`。Failed attempt 中它只用于离开 capture mode；调用返回 error/null graph，因此没有对象可 instantiate。Worker 未 rejoin 是另一项 capture failure，不是在 invalidation 后可补救的 omission。

Corrected attempt 在 `origin` 开始 fresh capture，使用 capture-supported asynchronous operations，capture 期间不做 status query/synchronization，只通过 captured-into-same-graph events 连接 `worker`，在 worker record completion event，让 `origin` wait，最后在 `origin` end。每个 immediate return 都在下一次 transition 前检查。

## 解答 3：修复 replay、lifetime、completion 与 update

Corrected lifecycle 是：define `graph` -> instantiate `graphExec` once -> launch 1 into `S` -> host read/reuse 前为 launch 1 建立 completion -> 若需要则只应用 compatible documented parameter update -> launch 2 -> 为 launch 2 建立 completion -> free external storage，并 destroy `graphExec` 与 remaining handles。

| resource | last use | required boundary before release |
| --- | --- | --- |
| input/output buffers | launch 2 中最后 read/write 它们的 node | covering launch 2 的 completion |
| completion event | launch 2 后的 host observation | successful wait/query policy，再 destroy event |
| stream `S` | final queued graph/completion operation | queued work completion，再 destroy stream |
| `graphExec` | launch 2 submission/execution | conservative teardown 前 explicit completion launch 2 |
| graph template | instantiation 或 later update source | 使用它的 host API completion |

保持 required topology 与其他 restrictions 的 documented node-parameter change 可以 update executable，作用于 subsequent launch。Adding node 改变 topology，所以要构造 new valid template 并 re-instantiate。Two launches 与 successful update 仍不提供 timing/speedup evidence。

## 有效替代方案

- Node handles 与 direct parameter control 能简化 ownership 时使用 explicit Graph API。
- Existing stream-based code capture-safe，且 library boundaries 暴露 capture restrictions 时使用 stream capture。
- 若两次 launches 之间不需要 host action/resource reuse，可在 final repeated launch 后只 record 一个 completion event。
- Compatibility 不确定或 returned update status 拒绝 change 时，rebuild/re-instantiate，而不是强行 update。

## 常见错误

- 把 independent nodes 的 source order 当作 graph edge。
- 把 capture APIs 当作 captured work 已立即 execution。
- 在 auxiliary stream end capture，或没有把它 rejoin 到 origin。
- Invalidation 后继续 append work，或 instantiate null graph。
- 假设 graph/executable handles 拥有每个 external allocation/callback lifetime。
- 没有 covering completion boundary 就读取 output、free storage 或 destroy execution state。
- 把 arbitrary topology mutation 当成 executable update，或把 replay 当成 performance result。

复核日期：**2026-08-29**。Compilation 与 runtime evidence axes 保持为空。
