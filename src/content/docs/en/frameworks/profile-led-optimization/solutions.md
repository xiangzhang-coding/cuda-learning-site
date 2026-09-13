---
title: 'P11 Reviewed Solutions'
description: Explain the timing boundary and derive a contract-preserving candidate without claiming a speedup.
pairId: p11-solutions
counterpart: /frameworks/profile-led-optimization/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [review, diagnosis, implementation, transfer]
resourceKind: solution-set
unitId: P11-SOLUTIONS
prerequisites: [P11-EXERCISES]
relatedUnits: [P11]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p11-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/profile-led-optimization/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,diagnosis,implementation,transfer' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P11-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P11-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: P11 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/profile-led-optimization/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review your attempt

Attempt [both Exercises](/en/frameworks/profile-led-optimization/exercises/) first. These are reasoned solutions, not runtime output.

## Solution 1: Timing boundaries

The claimed twofold improvement is unsupported. Known: scopes and warm-up differ. Unknown: device completion time, actual binaries, environment and correctness. Invalid inference: a shorter host submission range means less GPU work. Warm both implementations 20 times, join prior work, take seven unprofiled 100-call event samples, synchronize the end event, and retain all samples. Collect diagnostic traces separately with the same schedule. Compare identical allocation-inclusive forward scopes, alternate process order over three rounds, and record source/wheel/loaded-extension identities. Missing GPU events remain a tracing blocker.

## Solution 2: Geometry without semantic drift

Change the launch pair to `(count+127)/128,128`. For n=128,129,130,258 the output counts are `[127,128,129,257]` and blocks `[1,1,2,3]`. Retain the zero-count early return and per-thread bounds check. Add those boundaries to both numerical and nonuniform-gradient tests; preserve offset-contiguous and invalid-input cases. Re-run gradcheck, gradgradcheck, opcheck, meta/fake, dynamic compiled forward/backward and non-default stream tests, plus both-path builds and isolated wheel imports. The ceiling formula proves coverage, not performance. If measurements do not establish a policy-acceptable improvement, keep the original 256-thread wheel.

## Transfer the reasoning

[PB-R5-011](/en/practice/#pb-r5-011) asks whether forward tuning can improve a backward-dominated application. [P11](/en/frameworks/profile-led-optimization/) and [SRC-CUDA-086](/en/sources-and-versions/#src-cuda-086) retain the 2026-09-13 source boundary. No solution upgrades hardware evidence.
