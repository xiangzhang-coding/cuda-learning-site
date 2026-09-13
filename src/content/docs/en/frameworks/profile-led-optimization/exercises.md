---
title: 'P11 Exercises: Diagnose and Change One Variable'
description: Audit a timing claim and implement a launch-geometry candidate with preserved operator contracts.
pairId: p11-exercises
counterpart: /frameworks/profile-led-optimization/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, diagnosis, implementation, review]
resourceKind: exercise-set
unitId: P11-EXERCISES
prerequisites: [P11]
relatedUnits: [EX22, LAB14]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p11-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/profile-led-optimization/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,diagnosis,implementation,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P11-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P11 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'EX22,LAB14' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/profile-led-optimization/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Complete [P11](/en/frameworks/profile-led-optimization/). Written audits need no GPU; execute your [EX22](/en/examples/adjacent-energy/) candidate only in [LAB14](/en/labs/profile-custom-operator/)'s declared environment. These constructed scenarios are not observed reports.

## Exercise 1: Reject an unfair comparison

**Goal:** Audit a claim that a candidate is twice as fast because its CPU submission range is half as long.

**Constraints:** The baseline includes first-use compilation and shape recording; the candidate has warmed up. No CUDA completion, device trace, source/wheel identity or manifest is supplied. Do not invent missing times.

**Expected evidence:** Submit a stage table of what is known, unknown and invalidly inferred. Design matching timing and separate profiling runs, naming warm-up, event completion, seven samples, allocation scope and alternating run order.

**Acceptance criteria:** Reject the speedup claim; preserve both attempts; require matched binary identities, correctness and unprofiled raw samples. Explain why CPU submission duration is not device completion time.

<details><summary>Hint 1: Locate the boundary</summary><p>Ask whether returning from the Python call means its queued GPU work has completed.</p></details>
<details><summary>Hint 2: Separate three costs</summary><p>First-use compilation, steady-state execution and profiler instrumentation must not be mixed across candidates.</p></details>

## Exercise 2: Implement the 128-thread candidate

**Goal:** Change only EX22 CUDA launch geometry, from 256 to 128 threads, and extend boundary verification.

**Constraints:** Keep schema, CPU/CUDA input rules, singleton behavior, offset views, current stream, launch checks, fake/meta, gradients and AOT packaging. No fast-math flag or dtype narrowing.

**Expected evidence:** Submit the diff, source/wheel hashes, derived block counts for n=128,129,130,258, and actual CPU/CUDA/integration/import results. Compare candidate and original EX22 over LAB14's full size/dtype matrix. Hardware absence is a blocker, not a pass.

**Acceptance criteria:** All outputs and weighted/numerical first/second gradients pass; both native paths build and installed imports work. Retain the original if no reproducible improvement or any regression violates your predeclared policy.

<details><summary>Hint 1: Count outputs first</summary><p>The launch covers n-1 outputs, not n input elements.</p></details>
<details><summary>Hint 2: Preserve ceiling division</summary><p>For positive count and block size b, blocks=(count+b-1)/b using integer division; handle zero count before launching.</p></details>

## Review

Open the [separate solutions](/en/frameworks/profile-led-optimization/solutions/) after attempting both tasks, then audit [PB-R5-011](/en/practice/#pb-r5-011). Exact sources and rights: [SRC-CUDA-086](/en/sources-and-versions/#src-cuda-086), reviewed 2026-09-13.
