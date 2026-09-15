---
title: 'T06 Solutions: Bound the Claim to the Execution'
description: Reviewed reasoning for tail diagnostics, report export and global ownership.
pairId: t06-solutions
counterpart: /triton/debugging/solutions/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-review, next]
resourceKind: solution-set
unitId: T06-SOLUTIONS
prerequisites: [T06-EXERCISES]
relatedUnits: [EX23]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton debugging guide', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/docs/programming-guide/chapter-3/debugging.rst', version: '3.7.1', platform: 'Interpreter and CUDA', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/debugging/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-review,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX23 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/debugging/solutions/" lang="zh-CN">阅读中文对应页</a>

## Read after attempting

Exact prerequisite **[T06-EXERCISES]**: [attempts](/en/triton/debugging/exercises/). These are reviewed deductions, not execution records. Checked 2026-09-15; [SRC-CUDA-090](/en/sources-and-versions/#src-cuda-090).

## Solution 1: distinguish allocation from ownership

Replace the broken branch's `offsets <= N` with `offsets < N` for both load and store. At N=17, offset 17 is physically allocated but not logically owned. The broken fixture writes 18 over −999; all first 17 values can still be correct. A comparison limited to the output slice misses the bug. The corrected fixture leaves the guard untouched. At N=32 with a single width-32 program, offset 32 never occurs, so that shape alone does not distinguish the predicates. N=33 with two programs does.

Expected clean/print cases pass the oracle; the original tail fails it. The GPU assert case enables debug and fails at launch or synchronization; end that process. An unsupported platform, failed import or tool startup error is a blocker, not the desired defect. The interpreter assert case is explicitly rejected: release-specific interpreter assertion settings are not a reliable substitute for the host oracle. Retain actual outcomes under the declared mode and versions, and keep GPU runtime Pending Hardware Verification until qualifying evidence exists.

## Solution 2: preserve two independent judgments

Use interpreter/independent numerical checks for the reduction identity; use GPU memcheck for illegal or misaligned accesses. After a clean memcheck, select racecheck for shared-memory hazards, initcheck for uninitialized global reads, and synccheck for supported synchronization misuse. A pointer-chasing interpreter rejection does not establish any of those GPU defects. A clean checker covers only supported instructions on executed paths.

Keep process exit and tool summary count separate. Unknown/multiple summaries remain null and require private review; a nonzero process exit cannot become success because the tool reports zero errors. `sanitizer_summary` constructs only a bounded schema and never copies free text. Its synthetic tests cover missing/ambiguous summaries, invalid tool/exit values and injected identifying text. The private original is necessary to identify the kernel, source location and detector cause. Record its hash and the derivative hash, transformation, reviewer and manifest separately; a derivative alone is not sufficient evidence.

## Practice Bank review

**PB-R5-019:** two programs updating the same global output with non-atomic load/add/store can lose an update. Sequential interpretation removes the interleaving, while racecheck's shared-memory scope does not certify that global operation. Prove unique output ownership or use an algorithm with appropriate atomic/ordering semantics, then test the compiled GPU path repeatedly with a numerical oracle and a qualifying manifest. Memcheck helps rule out access errors but does not prove the missing global ordering. No speed or runtime claim follows from interpreter success.

## Return to the unit

Return to [T06](/en/triton/debugging/) and keep diagnosis notes with the executed source rather than reusing a clean summary from another case.
