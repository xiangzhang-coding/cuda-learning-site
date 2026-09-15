---
title: T08 Capstone Exercises
description: Implement attention from a frozen contract and submit numerical, IO, framework and profiling evidence.
pairId: t08-exercises
counterpart: /triton/attention-capstone/exercises/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, goal, constraints, stages, acceptance, hints, evidence, solution]
resourceKind: exercise-set
unitId: T08-EXERCISES
prerequisites: [T08]
relatedUnits: [VIS18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton attention source and tests', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/tutorials/06-fused-attention.py', version: '3.7.1', platform: 'Reference-only architecture-gated owner tutorial', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t08-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/attention-capstone/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,goal,constraints,stages,acceptance,hints,evidence,solution' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T08 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: VIS18 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/attention-capstone/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Exact prerequisite **[T08]**: [fused attention capstone](/en/triton/attention-capstone/). Checked 2026-09-15; [SRC-CUDA-092](/en/sources-and-versions/#src-cuda-092). Written work needs no GPU; external runs inherit every T08 software/hardware gate.

## Goal

Create your own `attention_forward` and eager `attention` adapter in a learner copy of `scripts/attention-capstone/`. Keep the independent oracle and acceptance collector intact. Replace only the solution kernel module with your implementation; retain its function names/signatures so `check.py` evaluates your work. Do not open the separate solution first. Submit a derivation, working source, correctness results, an IO ledger and a bounded framework/profiling report.

## Constraints

Keep T08's contiguous FP16 `(B,H,N,D)`, B/H 1..2, N 1..128, D 16/32/64, finite magnitude ≤4, fixed scale, zero dropout, causal/noncausal forward contract. Reject gradients and unsupported inputs. Use BM=16, BN=32, four warps and two stages for the initial submission; no global S/P allocation, global synchronization, autotuning, TMA or production API expansion. Use FP32 state and FP16 probability/value dot operands. Reading has no hardware gate; device acceptance requires native Linux and the declared single-GPU environment.

## Staged tasks

1. **Contract:** write allowed/rejected input tables and the elementwise tolerance before writing the kernel. Explain why each causal row has a nonzero partition mass.
2. **Recurrence:** derive m/l/a merge and prove real-arithmetic equivalence. Work one row across two tiles whose second maximum is larger. Contrast rounding with real-arithmetic equivalence.
3. **Tiles:** draw Q/K/P/V shapes and pointer offsets, prove unique output ownership, then implement the masked loop and adapter. Explain query-tail and key-tail handling separately.
4. **Correctness:** run host tests, pinned CPU framework checks and explicit SM80 compilation. On eligible hardware, run every mixed/uniform/extreme fixture in both mask modes, unchanged-input and tail-guard checks; investigate failures before proceeding.
5. **Framework:** compare independent and forced MATH/FLASH outputs with fixed scale/dropout. Record unsupported-backend diagnostics and gradient rejection. Do not treat matching GPU outputs as an independent oracle.
6. **Profiling:** reproduce the 28672 B versus 6144 B synthetic ledger, explain the VIS18 width difference, then state one fixed-shape hypothesis. Separate allocation-inclusive forward timing from filtered counter collection and report all rounds, including regressions.
7. **Evidence review:** attach the complete Environment Manifest, raw logs and per-case decisions. If hardware or permissions are missing, submit the completed host/compile work and an explicitly pending runtime section, not a fabricated result.

## Acceptance checklist

- All seven stages are addressed, with the exact contract and error handling visible in source and report.
- No full N×N S/P storage; the implementation rescales both running terms and masks scores before normalization.
- Host tests and CPU FP64 SDPA checks pass; all 30 compile specializations emit five artifact stages. Those results are not GPU execution.
- Runtime acceptance requires all 30 shape/fixture/mask cases, finite outputs at `atol=0.02,rtol=0.01`, unchanged inputs and guards, successful MATH output comparison, and FLASH comparison or preserved unavailable-or-failed diagnostics. Any numerical mismatch blocks acceptance.
- Before timing, all correctness cases pass. Three alternating rounds retain all samples; post-timing outputs pass again. Performance is allowed to be slower or inconclusive.
- A complete manifest and qualifying Reference Environment records are required to claim Runtime-Verified. Without them, keep **Pending Hardware Verification**; report host/compile completion separately from runtime completion.
- Prose/source attribution and publication facts are maintained; no copied tutorial results or undeclared gradient/library support.

## Layered hints

<details><summary>Hint 1 — state invariant</summary>

After a prefix of keys, l is the sum of exponentials relative to m, and a is the same unnormalized weighted sum of V. The next maximum changes the scale of every previous contribution.

</details>

<details><summary>Hint 2 — masking and shapes</summary>

The score tile has BM rows and BN columns. A key-tail mask is broadcast across rows; causal validity adds key index ≤ query index. Zero K still gives a finite score unless you replace that score with negative infinity.

</details>

<details><summary>Hint 3 — bytes and framework</summary>

Count Q/O once and K/V once per query tile. Use two bytes for these tensors and four for hypothetical full S/P. In forced SDPA calls, keep dropout zero and scale identical; inspect the one-element backend list.

</details>

<details><summary>Hint 4 — interpreting a result</summary>

A changed elapsed time does not identify memory traffic as its cause. A missing counter permission is a missing observation. A CPU pass, generated cubin or attractive byte ratio cannot fill that gap.

</details>

## Required submission evidence

Include a source diff/commit and hashes, derivation, invalid-input table, fixture coverage, per-element error policy, test commands/exits, compile artifact hashes, raw runtime/benchmark reports, warnings/failures, original IO arithmetic, profiler filters/metrics/permissions and the full T08 manifest. Keep raw machine paths and sensitive traces outside deployment; publish only reviewed sanitized derivatives with custody. Label measured, derived, proposed and missing information separately.

## Separate solution

After submitting an attempt, open the [reviewed solution and common errors](/en/triton/attention-capstone/solutions/). A mathematically equivalent recurrence or stricter validation can be valid; a changed dtype, mask semantics or measurement boundary requires its own reviewed contract.
