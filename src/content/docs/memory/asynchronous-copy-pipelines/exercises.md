---
title: 'M13 练习：审查异步复制流水线'
description: 用三道静态任务保留 synchronous baseline、修复 staged pipeline participant contract，并分类 capability、alignment、completion 与 evidence claims。
pairId: m13-exercises
counterpart: /en/memory/asynchronous-copy-pipelines/exercises/
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
unitId: M13-EXERCISES
prerequisites:
  - M13
relatedUnits:
  - M13
  - M12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m13-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M13-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M13 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M13,M12' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/asynchronous-copy-pipelines/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M13：异步复制与分阶段流水线](/memory/asynchronous-copy-pipelines/)。这些练习只使用 source review、state table 与 symbolic timeline；不需要 CUDA-capable system，也不产生 compilation/runtime evidence。

## 作答方法

每道题都先保留 correct synchronous baseline，再提出 pipeline。写明 producer/consumer sets、stage ownership、source/destination lifetime、completion-before-use edge、completion-before-reuse edge、capability gate 与 evidence boundary。完成完整合同后再查看[参考解答](/memory/asynchronous-copy-pipelines/solutions/)。

## 练习 1：从 synchronous proof 推导两个 stage lifecycles

**目标：** 给定 batches `A`/`B` 和 shared buffers `stage[0]`/`stage[1]`，先写 synchronous `load -> B1 -> use -> B2 -> reuse` ledger，再把它映射成 two-stage acquire/commit/wait/use/release ledger，并让 `A` 先于 `B` 被消费。

**约束：** Batch identity 与 stage index 分开记录；包含 prologue 与 drain；每个 batch 第一次读取前 wait，最后一次读取后才 release；若 threads 读取 peers 复制的值，写出需要的 block synchronization；不得声明 overlap。

**预期证据：** Synchronous phase table、两个 buffers 的 pipeline state table，以及 completion before use 和 all reads before reuse 的 explicit edges。

**验收条件：** 在所声明 rotation 中，`A` 映射到 stage 0，`B` 映射到 stage 1；每个 stage 都经过 available、committed、ready、released；final batch 被 drain；没有 stage 被提前读取或在 live 时 reacquire。

<details><summary>提示 1</summary>First synchronous barrier 对应 readiness for use；second barrier 对应 readiness for reuse。</details>

<details><summary>提示 2</summary>Two-stage prologue 可以 commit 多个 batch，但 consumer 仍先取得 oldest committed stage。</details>

## 练习 2：修复 participants、convergence 与 completion

**目标：** 审查这份错误的 block-scope unified-pipeline skeleton：

```cpp
if (load_valid) {
  pipe.producer_acquire();
  cuda::memcpy_async(block, dst, src, bytes, pipe);
  pipe.producer_commit();
}
consume(dst);
pipe.consumer_release();
```

**约束：** 保留 input bounds，同时不能让部分 block threads 跳过 required collectives；加入 applicable wait 与 peer-use synchronization；在 branch 后让 commit converged；所有 declared reads 完成后才 release；写明 participant 必须 early exit 时的 documented action。

**预期证据：** Repaired pseudocode、producer/consumer participant sets、一个 convergence point，以及每个 original hazard 的独立说明。

**验收条件：** 每个 unified-pipeline participant 遵循同一 collective sequence；bounds 选择 work 而不是 participation；valid completion boundary 在 `consume` 前；peer data 在 declared scope 同步；release 位于 last use 后；early exit 使用 documented pipeline contract。

<details><summary>提示 1</summary>把 predicate 移入 collective phase，不要让它包住整个 phase。</details>

<details><summary>提示 2</summary>Wait 回答“本 copy 是否完成”；separate group boundary 可能仍需回答“我能否读取 peers 产生的值”。</details>

## 练习 3：分类 capability、code generation 与 overlap claims

**目标：** 分类四份记录：CC 7.5 且 data aligned/trivially-copyable；CC 8.0 但 pointer alignment 未证明；CC 8.0 且 aligned、但 element non-trivially-copyable；CC 8.0 two-stage source、但没有 build artifact/runtime observation。

**约束：** 对每份记录分别判断 API legality、hardware-accelerated global-to-shared path eligibility、特定 instruction 是否已证明 emitted，以及 copy/compute overlap 是否已证明。把 `cuda::aligned_size_t<N>` 当作 proof obligation；false assertion 是 undefined behavior。

**预期证据：** 一个 four-row decision table，分别列出 API、hardware-path、artifact、runtime 与 allowed-claim columns。

**验收条件：** CC 7.5 可使用 applicable API，但不满足 CC 8.0 hardware-path gate；unproved alignment 和 non-trivially-copyable data 都不能建立 hardware-path eligibility；source 本身既不证明 emitted instruction，也不证明 overlap；所有 performance claim 保持 absent。

<details><summary>提示 1</summary>“Available”“eligible”“emitted”“observed”是四种不同状态。</details>

<details><summary>提示 2</summary>Artifact inspection 可以回答 code generation；只有 runtime measurement 能回答 overlap。</details>

## 下一步

完成后查看独立的[参考解答](/memory/asynchronous-copy-pipelines/solutions/)，再审查[练习题库（Practice Bank）PB-R2-005](/practice/#pb-r2-005)。命名 ledger objects 时重新核对 [TERM-108](/glossary/#term-108)、[TERM-109](/glossary/#term-109)和 [TERM-110](/glossary/#term-110)。
