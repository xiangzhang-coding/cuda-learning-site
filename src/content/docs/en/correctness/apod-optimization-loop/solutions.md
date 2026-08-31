---
title: 'Q06 Reviewed Solutions: Design one falsifiable APOD pass'
description: Baseline qualification, a controlled hypothesis and evidence contract, and a deployment regression gate review for the Q06 Exercises.
pairId: q06-solutions
counterpart: /correctness/apod-optimization-loop/solutions/
factCheckDate: '2026-08-31'
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
unitId: Q06-SOLUTIONS
prerequisites:
  - Q06-EXERCISES
relatedUnits:
  - Q06
  - Q07
  - Q08
  - LAB08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q06,Q07,Q08,LAB08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/apod-optimization-loop/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [Q06 Exercises](/en/correctness/apod-optimization-loop/exercises/) as symbolic review artifacts. They execute no CUDA, observe no baseline or candidate, generate no profiler report, and establish no performance evidence. Every observation slot remains empty.

## Solution 1: Qualify the Assess baseline

The original proposal has two breaks: the small sample has no representativeness rationale, and “the slowest function” has no correctness-qualified baseline, metric scope, or traceable artifact. A qualifying packet can use this schema:

| field | requirement before observation |
| --- | --- |
| workload | target use case, input, shape, request mix, representativeness rationale, and exclusions |
| correctness | method, criteria, completion and error checks, actual-verdict slot, and log pointer |
| metric | user-facing name, included work, start and stop endpoints, and completion boundary |
| measurement | warm-up, raw repetitions, run-order policy, predeclared statistic and spread, and outlier rule |
| environment | source and build, hardware and software, state, permissions, and custody manifest |
| hotspot | profile scope, artifact path or hash, selection rule, and unanswered mechanism question |

The review rule is that while the actual verdict, raw baseline artifact, or complete manifest has not been filled by a real run, the packet remains a **baseline plan** and cannot enter Parallelize. A toy workload can qualify only with a valid argument that it represents the target case; convenience is not such an argument. The profile pointer locates a candidate but does not prove a causal mechanism.

## Solution 2: Write one falsifiable controlled change

One qualifying symbolic hypothesis is: if only the repeated host/device transfers around a stable intermediate are removed while semantics and comparison coordinates remain fixed, then the declared end-to-end metric should move lower because included data movement decreases; correctness failure, persistence of the transfer artifact, or failure of the predeclared comparison rule falsifies the hypothesis or leaves it inconclusive.

The corresponding ledger records:

| field | symbolic entry |
| --- | --- |
| independent variable | named transfer-elimination change |
| necessary supporting edits | ownership and lifetime edits required only by that change |
| held constant | realistic workload, input, metric and endpoints, build policy, sampling, and manifest coordinates |
| required evidence | correctness logs, source diff, commands, before/after raw samples, and relevant profile artifact |
| falsifier | wrong result, unchanged mechanism, unmet decision rule, or incomparable protocol |
| disposition | empty until observation |

The candidate passes correctness again before comparison with the same baseline under the Q05 contract. Fix the keep, revert, or inconclusive rule before viewing a result. A simultaneous algorithm or timer-endpoint change belongs in another pass; otherwise, attribution to the transfer change is impossible.

## Solution 3: Build the Deploy and regression gate

The decision matrix can state:

| condition | disposition |
| --- | --- |
| correctness or error check fails | reject; do not interpret performance |
| workload, metric, protocol, or manifest is incomparable | inconclusive; repair the contract or establish a new baseline |
| performance decision rule does not pass | revert or rework; do not enter rollout |
| representative regression, interface, or resource check fails | rework; do not deploy |
| observability, fallback, or rollback ownership is missing | operational gate failed |
| every gate has an actual record | gate-passed; allow reversible rollout and link the evidence |

The release checklist also retains the candidate commit and package, baseline and candidate artifact pointers, approved criteria, rollout scope, monitor signals, fallback trigger, and rollback owner. Send an application-level symptom to Q07, a specific selected-kernel question to Q08, and the complete Systems-to-Compute trail to LAB08. A post-deployment workload, correctness, or metric-signal change re-enters Assess rather than inheriting an old conclusion.

## Valid alternatives

- Parallelize may use a semantics-matching existing library, compiler expression, or local CUDA refactor; each preserves the same evidence contract.
- A hypothesis may address data movement, launch structure, an algorithm, or a kernel mechanism, but one pass isolates only one independent variable.
- Either blocked or interleaved Q05 run order is valid when declared before observation and held consistent before and after.
- Deploy may use different rollout mechanisms, but each needs observability, fallback, rollback ownership, and actual gate records.
- A legitimate deployment-workload change may establish a new baseline rather than forcing incomparable evidence together.

## Common errors

- Calling an unexecuted template a recorded baseline.
- Treating a toy-input profile as an unspecified production workload.
- Treating a hotspot ranking as a causal explanation.
- Writing “the GPU will be faster” without a mechanism, falsifier, or metric.
- Changing the algorithm, layout, flags, and endpoints in one pass.
- Comparing time before the candidate passes correctness again.
- Computing a ratio from different included work, statistics, or manifests.
- Describing inconclusive evidence as an improvement.
- Treating an isolated best sample as the Deploy gate.
- Omitting a rollback owner or post-deployment regression trigger.
- Filling an observation slot with a prediction or fabricated value.

Reviewed: **2026-08-31**. Compilation, runtime, expected-observation, and recorded-observation evidence axes remain empty.
