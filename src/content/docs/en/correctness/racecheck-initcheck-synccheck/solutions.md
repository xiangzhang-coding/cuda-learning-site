---
title: 'Q04 Reviewed Solutions: Diagnose by sanitizer scope'
description: A detector-routing matrix, WAW/WAR/RAW repairs, and a bounded clean-report statement for the Q04 Exercises.
pairId: q04-solutions
counterpart: /correctness/racecheck-initcheck-synccheck/solutions/
factCheckDate: '2026-08-28'
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
unitId: Q04-SOLUTIONS
prerequisites:
  - Q04-EXERCISES
relatedUnits:
  - Q04
  - EX16
  - LAB07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/racecheck-initcheck-synccheck/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [Q04 Exercises](/en/correctness/racecheck-initcheck-synccheck/exercises/) as static routing and evidence contracts. No illustrative command ran, and an expected classification is not observed tool output.

## Solution 1: Route four scenarios to detectors

| scenario | access or defect | focused tool after memcheck | still not proven |
| --- | --- | --- | --- |
| A | unordered writes to a valid shared address | racecheck, expecting WAW | other paths and global races |
| B | uninitialized read from a valid global address | default initcheck | shared initialization unless another address space is selected |
| C | block divergence at conditional `__syncthreads()` | synccheck | higher-level protocol and unexecuted branches |
| D | cross-block conflicting writes to one valid global address | none of these detectors proves global race freedom | memory-model proof, algorithm repair, and evidence appropriate to that claim are still required |

Every row first runs memcheck in a fresh process. The focused run uses another fresh process and saves scenario ID, source revision, exact command, tool and component versions, input, launch geometry, raw report, and exit status. A through D must not be triggered in sequence inside one long-lived process.

## Solution 2: Classify WAW, WAR, and RAW

| trace | classification | required repair |
| --- | --- | --- |
| T1: write followed by a competing write | WAW | designate one writer or establish atomic ownership suitable for the algorithm; final value cannot depend on arrival order |
| T2: read followed by a competing write | WAR | allow reuse or overwrite only after the consumer read completes; all required participants reach the ordering point |
| T3: producer write followed by consumer read | RAW | establish write -> documented synchronization -> read with scope or mask covering producer and consumer |

When the participants are the whole block, a block barrier is suitable only if every thread reaches it unconditionally as required. If the protocol truly stays inside one warp, use a synchronized warp operation whose mask contract is valid. T2 and T3 require opposite ordering directions. T1 should not use a barrier to legitimize multiple writers that the algorithm never intended.

## Solution 3: Bound a clean-report claim

The original conclusion has at least six gaps: one branch executed; racecheck does not prove global races; default initcheck did not inspect shared memory; synccheck may miss a lane named by a mask that never arrives; no CPU reference or invariant ran; and tool, driver, and compiler versions were not bound.

A valid replacement is:

```text
Under the recorded tool lane, input, launch, and executed path,
memcheck, racecheck, default-global initcheck, and synccheck
reported no defect within their supported checked scopes.
This is not proof about other paths, global races, shared initialization,
complete synchronization, or numerical correctness.
```

The next-run matrix launches separate defect and corrected processes for the unexecuted branch, runs memcheck first, and, after confirming current tool support, checks the shared case separately with `--initcheck-address-space shared` or `all`. It adds a targeted test plus static participation proof for mask non-arrival and finishes with an independent Q01 CPU reference, tolerance, or invariant verdict. The CUDA 11.8 lane receives no inference from the current shared extension.

## Valid alternatives

- For WAW, an algorithm that requires a combining update may use a documented atomic protocol at sufficient scope instead of one writer.
- A documented register collective can replace a warp-local WAR or RAW shared-memory exchange when its mask and source-lane contracts are complete.
- A script may launch the tool runs, provided each child process, command, log, and exit status remains independently reviewable.
- A coverage statement may be narrower, such as naming one kernel generation or filtered launch, as long as it does not overclaim.

## Common errors

- Interpreting racecheck, initcheck, or synccheck before memcheck passes.
- Calling a clean racecheck run global-memory race-free.
- Claiming initcheck covered shared memory without `shared` or `all`.
- Projecting current shared support into CUDA 11.8.
- Repairing a hazard with divergent `__syncthreads()`.
- Ignoring synccheck's mask non-arrival limitation.
- Triggering multiple scenarios in one defect process.
- Treating zero reports as a CPU-reference correctness verdict.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
