---
title: 'M13 Exercises: Audit Asynchronous Copy Pipelines'
description: Preserve a synchronous baseline, repair a staged pipeline participant contract, and classify capability, alignment, completion, and evidence claims in three static tasks.
pairId: m13-exercises
counterpart: /memory/asynchronous-copy-pipelines/exercises/
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

<a class="locale-pair" data-locale-counterpart href="/memory/asynchronous-copy-pipelines/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M13: Asynchronous Copy and Staged Pipelines](/en/memory/asynchronous-copy-pipelines/) first. These Exercises use source review, state tables, and symbolic timelines only. They require no CUDA-capable system and create no compilation or runtime evidence.

## Instructions

For every answer, preserve a correct synchronous baseline before proposing a pipeline. Name the producer and consumer sets, stage ownership, source/destination lifetime, completion-before-use edge, completion-before-reuse edge, capability gate, and evidence boundary. Consult the [reviewed solutions](/en/memory/asynchronous-copy-pipelines/solutions/) only after writing the full contract.

## Exercise 1: Derive two stage lifecycles from the synchronous proof

**Goal:** Start with two batches `A` and `B` and two shared buffers `stage[0]` and `stage[1]`. Write the synchronous `load -> B1 -> use -> B2 -> reuse` ledger, then map it to a two-stage acquire/commit/wait/use/release ledger with `A` consumed before `B`.

**Constraints:** Keep batch identity separate from stage index. Include prologue and drain. Wait before the first read of each batch and release only after its last read. State any block synchronization required when threads consume values copied by peers. Do not claim overlap.

**Expected evidence:** A synchronous phase table, a pipeline state table for both buffers, and explicit edges for completion before use and all reads before reuse.

**Acceptance criteria:** `A` maps to stage 0 and `B` to stage 1 for the stated rotation; each stage progresses through available, committed, ready, and released; the final batch is drained; no stage is read early or reacquired while live.

<details><summary>Hint 1</summary>The first synchronous barrier corresponds to readiness for use; the second corresponds to readiness for reuse.</details>

<details><summary>Hint 2</summary>A two-stage prologue can commit more than one batch, but the consumer still takes the oldest committed stage first.</details>

## Exercise 2: Repair participants, convergence, and completion

**Goal:** Audit this broken block-scope unified-pipeline sketch:

```cpp
if (load_valid) {
  pipe.producer_acquire();
  cuda::memcpy_async(block, dst, src, bytes, pipe);
  pipe.producer_commit();
}
consume(dst);
pipe.consumer_release();
```

**Constraints:** Retain input bounds without allowing some block threads to skip required collectives. Add the applicable wait and peer-use synchronization. Make commit converged after any branch. Release only after all declared reads. State the documented action for a participant that must exit early.

**Expected evidence:** Repaired pseudocode, producer/consumer participant sets, a convergence point, and one sentence for each original hazard.

**Acceptance criteria:** Every unified-pipeline participant follows the same collective sequence; bounds select work rather than participation; a valid completion boundary precedes `consume`; peer data is synchronized at the declared scope; release follows the last use; early exit uses the documented pipeline contract.

<details><summary>Hint 1</summary>Move the predicate inside a collective phase rather than wrapping the phase itself.</details>

<details><summary>Hint 2</summary>A wait answers “is this copy complete?”; a separate group boundary may still answer “may I read values produced by peers?”</details>

## Exercise 3: Classify capability, code generation, and overlap claims

**Goal:** Classify four records: CC 7.5 with aligned trivially-copyable data; CC 8.0 with unproved pointer alignment; CC 8.0 with aligned but non-trivially-copyable elements; and CC 8.0 source with two stages but no build artifact or runtime observation.

**Constraints:** For each record, distinguish API legality, eligibility for the hardware-accelerated global-to-shared path, proof that a particular instruction was emitted, and proof of copy/compute overlap. Treat `cuda::aligned_size_t<N>` as a proof obligation whose false assertion is undefined behavior.

**Expected evidence:** A four-row decision table with separate API, hardware-path, artifact, runtime, and allowed-claim columns.

**Acceptance criteria:** CC 7.5 can use the applicable API but does not meet the CC 8.0 hardware-path gate; unproved alignment and non-trivially-copyable data cannot establish hardware-path eligibility; source alone proves neither emitted instruction nor overlap; every performance claim remains absent.

<details><summary>Hint 1</summary>“Available,” “eligible,” “emitted,” and “observed” are four different states.</details>

<details><summary>Hint 2</summary>Artifact inspection can address code generation, but only a runtime measurement can address overlap.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/asynchronous-copy-pipelines/solutions/) and then audit [Practice Bank PB-R2-005](/en/practice/#pb-r2-005). Recheck [TERM-108](/en/glossary/#term-108), [TERM-109](/en/glossary/#term-109), and [TERM-110](/en/glossary/#term-110) when naming the objects in your ledger.
