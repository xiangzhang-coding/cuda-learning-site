---
title: 'M14 练习：构造并审查重复 CUDA Graph work'
description: 用三道静态任务通过两种 construction mechanisms 建立同一 DAG、unwind invalid capture，并修复 executable-graph lifetime、completion、replay 与 update contracts。
pairId: m14-exercises
counterpart: /en/memory/cuda-graphs/exercises/
factCheckDate: '2026-08-29'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: M14-EXERCISES
prerequisites:
  - M14
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
    attrs: { name: 'cuda:pair-id', content: m14-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M14-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M14 }
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

<a class="locale-pair" data-locale-counterpart href="/en/memory/cuda-graphs/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M14：CUDA 图与重复启动结构](/memory/cuda-graphs/)。这些练习只创建 DAG、API-call plan 与 lifetime ledger；不构造或 launch CUDA graph，也不增加 Evidence Status。

## 作答方法

写出每个 node、edge、graph/capture handle、external resource、immediate API check 与 completion boundary。Explicit construction 与 capture 分开，graph definition 与 executable launch 也分开。完成三类 boundary audit 后再查看[参考解答](/memory/cuda-graphs/solutions/)。

## 练习 1：用两种方式构造同一 DAG

**目标：** 对四项 operations 建模：`H2D`、`clear`、`compute`、`D2H`。`compute` 同时需要 `H2D`/`clear`；`D2H` 需要 `compute`。写 node/edge set 并证明 acyclicity，再分别描述产生该 DAG 的 explicit Graph API construction 与 two-stream capture construction。

**约束：** `H2D`/`clear` 保持 unordered。Explicit plan 中标出 node handles 与 dependency additions；capture plan 中标出 origin stream、用于 fork/join 的 captured events 和 final rejoin。不得执行 work 或声明 concurrency。

**预期证据：** Four-node adjacency list、一个 topological order，以及两个 separately labeled、final dependencies 相同的 construction plans。

**验收条件：** Required edges 只有 `H2D -> compute`、`clear -> compute` 与 `compute -> D2H`；没有 path 从某 node 回到自身；capture 在所有 auxiliary streams rejoin 后由 origin end；construction equivalence 不作为 execution evidence。

<details><summary>提示 1</summary>两个 root nodes unordered，所以有效 topological order 不止一种。</details>

<details><summary>提示 2</summary>用一个 captured event fork work，再用另一个 captured event 把 auxiliary stream rejoin 到 origin。</details>

## 练习 2：unwind invalidated stream capture

**目标：** 审查一份 capture：它在 `origin` begin，通过 captured event fork `worker`，调用 synchronous `cudaMemcpy()`，query captured event，从不 rejoin `worker`，最后尝试 `cudaStreamEndCapture(worker, &graph)`。

**约束：** 分类每项 invalid operation；说明 first invalidation 后的 state、eventual end-capture call 的唯一 valid purpose，以及 returned graph 为何不能 instantiate；再描述一份使用 supported asynchronous work 与 complete rejoin 的 fresh corrected capture。

**预期证据：** Ordered fault ledger、invalidation/recovery state machine，以及 corrected origin/fork/rejoin/end sequence。

**验收条件：** Query/synchronization 与 synchronous copy 按 documented capture boundary 被拒绝；capture 只在 `origin` end；invalidation 以 error/null graph unwind；corrected attempt 开始 new capture、rejoin `worker` 并检查每个 API result。

<details><summary>提示 1</summary>Invalidation 后不要试图从同一 capture graph salvage nodes。</details>

<details><summary>提示 2</summary>Failure 后 end capture 的作用是退出 capture mode，不是把 invalid graph 变成 usable template。</details>

## 练习 3：修复 replay、lifetime、completion 与 update

**目标：** 审查一个向 stream `S` launch 两次的 executable graph。Host 在每次 launch 后立即读取 output/free buffers，在观察 completion 前 destroy `graphExec`，并试图通过向 existing executable 添加 new node 来 update second launch。

**约束：** 生成覆盖 graph template、executable、stream、input/output storage 与 completion event 的 resource ledger；区分 compatible parameter update 与 topology change；保留两次 launches；不得提出 launch-overhead/speed claim。

**预期证据：** Corrected lifecycle timeline、resource last-use table、completion checks 与 update decision tree。

**验收条件：** Definition 位于一次 successful instantiation 前；每次 launch 都作为 asynchronous stream work；host read、free 与 executable destruction 只在 covering completion 后；compatible documented parameter changes 可 update subsequent launches；adding node 需要 new graph/re-instantiation。

<details><summary>提示 1</summary>Reusable executable 拥有 structure，不拥有它引用的每个 pointer lifetime。</details>

<details><summary>提示 2</summary>选择 update API 前先问 requested change 是否保持 topology。</details>

## 下一步

完成后查看独立的[参考解答](/memory/cuda-graphs/solutions/)，再审查[练习题库（Practice Bank）PB-R2-006](/practice/#pb-r2-006)。使用 [TERM-111](/glossary/#term-111) 至 [TERM-114](/glossary/#term-114)区分 graph template、node、capture 与 executable。
