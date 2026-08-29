---
title: 'M13 参考解答：审查异步复制流水线'
description: M13 三道练习的 two-stage ownership ledgers、full-participant pipeline repair 与 capability/evidence classifications。
pairId: m13-solutions
counterpart: /en/memory/asynchronous-copy-pipelines/solutions/
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
unitId: M13-SOLUTIONS
prerequisites:
  - M13-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m13-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M13-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M13-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/memory/asynchronous-copy-pipelines/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案用 static contracts 解答 [M13 练习（Exercise）](/memory/asynchronous-copy-pipelines/exercises/)。它们不编译 kernel、不检查 instruction、不执行 copy、不观察 overlap，也不报告 performance。

## 解答 1：从 synchronous proof 推导两个 stage lifecycles

每个 batch 的 synchronous proof 是 `load -> B1 -> use -> B2 -> next overwrite`。B1 防止 declared loads 全部完成前 use；B2 防止 declared reads 全部完成前 reuse。

| order | stage 0 | stage 1 | consumer action |
| ---: | --- | --- | --- |
| 1 | acquire、submit `A`、commit | available | none |
| 2 | committed `A` | acquire、submit `B`、commit | none |
| 3 | wait 使 `A` ready | committed `B` | 若需要则同步 peer use，consume `A`，再 release stage 0 |
| 4 | released/available | wait 使 `B` ready | 若需要则同步 peer use，consume `B`，再 release stage 1 |

Row 4 就是 drain：即使没有 future submission，`B` 仍需 wait、use 与 release。First completion edge 只替代 B1 的“data ready”角色；last-read-before-release edge 保留 B2 的“storage reusable”角色。该表表达 staging possibility，不表达 execution overlap。

## 解答 2：修复 participants、convergence 与 completion

```cpp
pipe.producer_acquire();
if (load_valid) {
  cuda::memcpy_async(dst + threadIdx.x, src + input_index, sizeof(T), pipe);
} else {
  dst[threadIdx.x] = neutral;
}
// All intended warp lanes reach a valid convergence point before commit.
pipe.producer_commit();

pipe.consumer_wait();
__syncthreads();  // Publish completed copies and neutral slots to peer readers.
if (output_valid) {
  consume(dst);
}
__syncthreads();  // Finish all declared reads before release/reuse.
pipe.consumer_release();
```

这份 teaching repair 在 shared unified-pipeline phase 内使用 per-thread copy contribution；collective range-copy overload 需要独立的 uniform range contract。Exact neutral/copy shape 取决于 algorithm；两者都不能虚构 invalid address 或 false byte count。关键修复是：bounds 控制 contribution，不控制 collective sequence membership。Wait 位于 use 前；peer-use synchronization 使用 block scope；release 位于所有 reads 后。真正必须 early exit 的 participant 在离开前调用 documented `pipeline.quit()`，不能直接从 later collective phases 消失。

原 skeleton 有四类独立缺陷：部分 participants 跳过 acquire/commit；commit 可能发生在 divergent control paths；`consume` 在 completion 前读取；release 在证明所有 reads 完成前就允许 stage reuse。

## 解答 3：分类 capability、code generation 与 overlap claims

| record | API availability | hardware-path eligibility | emitted instruction proved? | overlap proved? |
| --- | --- | --- | --- | --- |
| CC 7.5、aligned、trivially copyable | applicable CC 7.0+ API 可用 | 否；低于 CC 8.0 | 否 | 否 |
| CC 8.0、alignment unproved | 可用 | 未建立；implementation 可能 check 或 fallback | 否 | 否 |
| CC 8.0、aligned、non-trivially-copyable | 可用 | accelerated copy instruction path 不成立 | 否 | 否 |
| CC 8.0、只有 two-stage source | 可用 | 仅当其余 constraints 也成立时才可能 | 没有 build artifact | 没有 runtime observation |

正确的 `cuda::aligned_size_t<N>` argument 可以携带 alignment 与 size-multiple proof；false proof 是 undefined behavior。Pinned compile 加 artifact inspection 可以确定该 build emitted 什么，仍不能确定 temporal overlap。Overlap/performance claim 需要带 declared boundaries 的 correctness-checked runtime measurement。

## 有效替代方案

- Pipeline 不能简化或证明 contract 时保留 synchronous baseline。
- 每个 thread 只拥有并消费自身 copy 时使用 thread-scope pipeline，并单独保留后续 cross-thread synchronization。
- Participant model 明确、所有 role-specific collectives 完整时，使用 fixed producer/consumer roles 的 partitioned pipeline。
- 只有在证明 prologue、rotation、drain、storage capacity 与 stage-to-batch identity 后才增加到两个以上 stages。

## 常见错误

- 把 bounds-invalid threads 当作 shared collective 的 nonparticipants。
- 把 `consumer_release()` 当作 copy completion 或 reader wait。
- 假设一个 thread 的 wait 会向整个 block 发布所有 peers copied data。
- 在 divergent paths 上 commit，却忽略 warp entanglement 或 over-wait。
- 把 `cuda::aligned_size_t` 当作 request，而不是 proof obligation。
- 把 CC 8.0+、API spelling 或 two-stage source loop 等同于 emitted instruction、observed overlap 或 speedup。

复核日期：**2026-08-29**。Compilation 与 runtime evidence axes 保持为空。
