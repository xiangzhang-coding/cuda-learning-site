---
title: 'M13 Reviewed Solutions: Audit Asynchronous Copy Pipelines'
description: Two-stage ownership ledgers, a full-participant pipeline repair, and capability versus evidence classifications for the three M13 Exercises.
pairId: m13-solutions
counterpart: /memory/asynchronous-copy-pipelines/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/memory/asynchronous-copy-pipelines/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [M13 Exercises](/en/memory/asynchronous-copy-pipelines/exercises/) with static contracts. They do not compile a kernel, inspect an instruction, execute a copy, observe overlap, or report performance.

## Solution 1: Derive two stage lifecycles from the synchronous proof

The synchronous proof for each batch is `load -> B1 -> use -> B2 -> next overwrite`. B1 prevents use before all declared loads complete; B2 prevents reuse before all declared reads complete.

| order | stage 0 | stage 1 | consumer action |
| ---: | --- | --- | --- |
| 1 | acquire, submit `A`, commit | available | none |
| 2 | committed `A` | acquire, submit `B`, commit | none |
| 3 | wait makes `A` ready | committed `B` | synchronize peer use if required, consume `A`, then release stage 0 |
| 4 | released/available | wait makes `B` ready | synchronize peer use if required, consume `B`, then release stage 1 |

The drain is row 4: no future submission is needed, but `B` still requires wait, use, and release. The first completion edge replaces only B1's “data ready” role. The last-read-before-release edge retains B2's “storage reusable” role. The table expresses possible staging but no execution overlap.

## Solution 2: Repair participants, convergence, and completion

```cpp wrap
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

This teaching repair uses a per-thread copy contribution inside a shared unified-pipeline phase; a collective range-copy overload needs its own uniform range contract. The exact neutral and copy shape depend on the algorithm, and neither may invent an invalid address or false byte count. The critical repair is that bounds control the contribution, not membership in the collective sequence. Wait precedes use, peer-use synchronization has block scope, and release follows all reads. A participant that truly exits early invokes documented `pipeline.quit()` before leaving rather than disappearing from later collective phases.

The original sketch had four independent defects: some participants skipped acquire/commit, commit could occur on divergent control paths, `consume` read before completion, and release made the stage reusable before proving all reads complete.

## Solution 3: Classify capability, code generation, and overlap claims

| record | API availability | hardware-path eligibility | emitted instruction proved? | overlap proved? |
| --- | --- | --- | --- | --- |
| CC 7.5, aligned, trivially copyable | yes for the applicable CC 7.0+ API | no; below CC 8.0 | no | no |
| CC 8.0, alignment unproved | yes | not established; implementation may check or fall back | no | no |
| CC 8.0, aligned, non-trivially-copyable | yes | no for the accelerated copy instruction path | no | no |
| CC 8.0, two-stage source only | yes | possible only if all remaining constraints hold | no build artifact | no runtime observation |

A correct `cuda::aligned_size_t<N>` argument can carry an alignment and size-multiple proof; a false proof is undefined behavior. A pinned compile plus artifact inspection can establish what was emitted for that build. It still cannot establish temporal overlap. A correctness-checked runtime measurement with declared boundaries is needed for an overlap or performance claim.

## Valid alternatives

- Keep the synchronous baseline when a pipeline does not simplify or justify the contract.
- Use a thread-scope pipeline when every thread owns and consumes only its own copy, while retaining any later cross-thread synchronization separately.
- Use a partitioned pipeline with fixed producer and consumer roles when that participant model is explicit and every role-specific collective remains complete.
- Use more than two stages only after proving prologue, rotation, drain, storage capacity, and stage-to-batch identity.

## Common errors

- Treating bounds-invalid threads as nonparticipants in a shared collective.
- Calling `consumer_release()` as if it completed the copy or waited for readers.
- Assuming one thread's wait publishes every peer's copied data to the whole block.
- Committing from divergent paths and ignoring warp entanglement or over-wait.
- Treating `cuda::aligned_size_t` as a request rather than a proof obligation.
- Equating CC 8.0+, API spelling, or a two-stage source loop with an emitted instruction, observed overlap, or speedup.

Reviewed: **2026-08-29**. Compilation and runtime evidence axes remain empty.
