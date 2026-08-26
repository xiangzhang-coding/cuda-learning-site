---
title: 'F06 Reviewed Solutions: Build and Audit a Compute-Capability Feature Contract'
description: Separate reviewed solutions, valid alternatives, and common errors for the three F06 Exercises.
pairId: f06-solutions
counterpart: /foundations/compute-capability/solutions/
factCheckDate: '2026-08-26'
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
unitId: F06-SOLUTIONS
prerequisites:
  - F06-EXERCISES
relatedUnits:
  - F06
  - F08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F06,F08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/compute-capability/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F06 Exercises](/en/foundations/compute-capability/exercises/). Compare the source of every premise and each fail-closed boundary before comparing final target names.

## Solution 1: Build three feature-and-limit contracts

The feature-availability table is:

| Compute capability | Hardware `memcpy_async` | Thread Block Cluster | Architecture-specific set | Family-specific set |
| --- | --- | --- | --- | --- |
| 7.5 | No | No | No | No |
| 9.0 | Yes | Yes | Yes | No |
| 12.0 | Yes | Yes | Yes | Yes |

The separate numeric-limit table is:

| Compute capability | Warp size | Maximum threads per block | Maximum shared memory per SM | Maximum shared memory per block |
| --- | ---: | ---: | ---: | ---: |
| 7.5 | 32 | 1024 | 64 KiB | 64 KiB |
| 9.0 | 32 | 1024 | 228 KiB | 227 KiB |
| 12.0 | 32 | 1024 | 100 KiB | 99 KiB |

The capability key chooses these rows but does not identify a product. A maximum says nothing about recommended configuration or relative performance. These lookups execute no compiler or GPU and add no evidence status.

## Solution 2: Repair four compiler-target plans

| Plan | Compiler lists both names? | Scope review | Verdict | Smallest qualifying repair |
| --- | --- | --- | --- | --- |
| A: NVCC 11.8.0, `compute_100` / `sm_100` | No | Not reached | Blocked by compiler acceptance | If 10.0 is required, explicitly select and record a supporting lane such as the reviewed 12.9.2 or 13.3.1 coordinate; NVCC 11.8.0 has no substitute 10.0 target |
| B: NVCC 12.9, `compute_90a` / `sm_100` | Yes | `a` is exact to 9.0, so `sm_100` cannot implement that contract | Blocked by suffix scope | For the 9.0 architecture-specific set, use `compute_90a` / `sm_90a`; otherwise redesign around an explicitly sufficient baseline set |
| C: NVCC 13.3, `compute_100f` / `sm_120` | Yes | `100f` is restricted to the 10.x owner-declared family, not 12.x | Blocked by family scope | For the 12.0 family set, use `compute_120f` / `sm_120f`; for baseline 12.0, use `compute_120` / `sm_120` |
| D: NVCC 13.3, `compute_120` / `sm_120` | Yes | The real 12.0 target implements the baseline 12.0 virtual assumptions | Valid plan | No target-name repair; continue the independent environment and artifact checks |

“Valid plan” means only that this selected owner documentation accepts the names and their feature-set relationship. It does not mean the command compiled, the artifact contains the intended code, the driver can load it, or the GPU executed it.

## Solution 3: Fail closed, then reopen only supported decisions

| Stage | Observed fact | Allowed conclusion | Blocked conclusion / next fact | Evidence effect |
| --- | --- | --- | --- | --- |
| Initial packet | Model Z, 24 GB, and a banner field `CUDA Version: 13.3` | Preserve those raw inventory statements only | Compute capability is unknown; query it directly. Installed Toolkit, NVCC, driver release, host compiler, OS, and artifact remain unknown | None |
| Direct hardware query | Selected device reports compute capability 10.0 | Apply the F06 10.0 feature row and limits: selected features available; both qualified sets exist; warp 32; 1024 threads/block; 228/227 KiB shared-memory maxima | Product cannot be inferred from 10.0. Feature presence does not show source use or target support | None |
| Compiler observation | Installed compiler is NVCC 11.8.0 | Apply the NVCC 11.8.0 accepted-target list | `compute_100`, `compute_100f`, and `compute_100a` are not accepted by this compiler coordinate. Explicitly select and record a supporting lane before proposing one | None |
| Remaining environment | Driver release, host compiler, OS boundary, artifact, run, correctness, and measurement are absent | Mark each field unresolved | No environment-compatibility, runtime, correctness, or performance verdict | None |

The target-plan sentence is: **the directly queried 10.0 hardware contract exists, but the requested `compute_100a` plan is blocked by installed NVCC 11.8.0 until a supporting compiler lane is explicitly selected and observed.**

The environment-status sentence is: **indeterminate; hardware and compiler facts do not fill the missing Toolkit, driver, host compiler, OS, artifact, correctness, execution, or measurement coordinates.**

## Valid alternatives

- Obtain compute capability through a direct Runtime, Driver API, NVML, or documented `nvidia-smi` query, provided the selected device identity and method are recorded.
- Use a baseline target instead of an `a` or `f` target when the source requires only baseline features. State the reduced feature assumptions rather than presenting the change as an automatic fallback.
- Represent the result as separate hardware, compiler, and environment tables or as one ledger with visibly separated columns. Unknown fields must remain explicit in either form.
- For Plan C, `compute_120` / `sm_120` and `compute_120f` / `sm_120f` are both valid target-name repairs for different source requirements; the requirements decide which one applies.

## Common errors

- Inferring compute capability from a product name, memory capacity, architecture nickname, or `CUDA Version` banner field.
- Treating a feature row as proof that the source uses the feature or that the selected compiler can express it.
- Treating maximum shared memory or a later capability number as a performance ranking.
- Pairing an architecture-specific `a` target with a different capability because its number is larger.
- Carrying a family-specific `f` target into a different family or assuming all equal-major capabilities are family-compatible without checking the owner table.
- Checking target compatibility before confirming that the exact NVCC release accepts the target names.
- Reporting a table lookup or valid plan as Compile-Checked, Runtime-Verified, environment compatibility, or measured performance.

Reviewed: **2026-08-26**. These solutions execute no CUDA, produce no compiler artifact, and change no Evidence Status.
