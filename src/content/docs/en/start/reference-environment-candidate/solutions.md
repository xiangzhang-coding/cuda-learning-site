---
title: 'O08 Reviewed Solutions: Qualify a Reference Environment Candidate'
description: Reviewed triage and compatibility solutions with reasoning, valid alternatives, and common errors.
pairId: o08-solutions
counterpart: /start/reference-environment-candidate/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O08-SOLUTIONS
prerequisites:
  - O08-EXERCISES
relatedUnits:
  - O08
  - EX01
  - LAB01
exampleIds:
  - EX01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o08-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O08,EX01,LAB01' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX01 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/reference-environment-candidate/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O08 Exercises](/en/start/reference-environment-candidate/exercises/). They review reasoning and required records. They do not turn either hypothetical packet into an observation. No Reference Environment is currently declared.

## Solution 1: Triage an incomplete candidate

The intake note supports only a gap analysis:

| Supplied text | What remains unknown | Review decision |
| --- | --- | --- |
| `Host: native Linux` | Distribution, release, architecture, kernel, container boundary, permissions, and maintainer control | It names the Supported Environment family but not a complete host coordinate |
| `GPU: 16 GB` | GPU identity, UUID, direct compute capability, count, actual available memory, features, and selected device | No GPU Capability Tier can be selected |
| `CUDA: 13.3` | KMD, driver-supported CUDA API, Toolkit patch and path, Runtime, NVCC, libraries, tools, and host compiler | Compatibility is `indeterminate` |
| `EX01: complete` | Exact EX01 revision, command, raw output, date, and field-level review | It grants no declaration or Evidence Status |
| `Build: PASS` | Subject, Lane, command, target, logs, exit status, and criteria | It cannot establish Compile-Checked and says nothing about runtime |

A qualifying collection plan has these steps:

1. Preserve the intake note as unverified input. Query `name,compute_cap` directly, identify the GPU by UUID, and record visible and used count, memory, features, and permissions.
2. Record KMD independently from CUDA UMD or `cudaDriverGetVersion()`. Record the exact Toolkit `X.Y.Z`, active path, `nvcc --version`, Runtime, relevant component versions, host compiler, and package records.
3. Complete workload, source revision, input, shape, memory requirement, exact commands, selected C++ dialect, targets, environment variables, correctness method and predeclared criteria, date, observer, logs, and artifact custody.
4. Select a tier only after capability, memory, count, features, and permissions are known. Re-run compatibility triage only after driver, Toolkit, component, target, and any package facts are known.
5. Establish maintainer control and prepare a separate baseline protocol with empty result fields. Execute nothing merely to fill the worksheet.

The current decision is: incomplete candidate, tier `indeterminate`, compatibility `indeterminate`, baseline unexecuted, no declaration, and no CUDA Evidence Status. This follows because each decision gate consumes coordinates that the five-line note does not contain. EX01 output, a build, `nvidia-smi`, a compatibility result, or a community report would still be insufficient without the complete gate set.

## Solution 2: Review a compatibility assessment and declaration attempt

The assessment uses the wrong major-family floor. `525.60.13` is the selected CUDA 12.9.2 Lane floor. CUDA 13.3.1 uses `R580`, numerically `>= 580`, for its minor-version path. Minor-version compatibility applies within one CUDA major family, so a 12.x floor cannot be reused as a 13.x floor.

The supplied KMD and Toolkit therefore do not establish ordinary minor compatibility. A cross-major forward-package path can be assessed only after the record proves that the system is in NVIDIA's eligible set, identifies the matching `cuda-compat-<major>-<minor>` package, shows that its user-mode libraries are selected correctly, and addresses feature exceptions. None of those facts is supplied, so the honest explorer outcome is `indeterminate`, not `documented-path`.

Even if a completed packet later receives `documented-path`, the result only identifies a documented route. Runtime validation against predeclared criteria is still required, and the explorer grants no Compile-Checked, Community-Observed, Runtime-Verified, or Reference Environment declaration.

The community `PASS` supplies no stated manifest, logs, criteria, date, or maintainer reproduction in this prompt. Do not invent them. The packet also lacks an applicable tier, maintainer control, and a separately designated successful baseline. The corrected decision is: **no Reference Environment is declared; keep the candidate blocked and the runtime claim unawarded.** Complete those records, change or document the compatibility route, predeclare baseline criteria, and only then perform controlled runtime validation.

## Valid alternatives

- A Markdown table, structured JSON record, or gate-by-gate review form is valid if unknown values remain explicit and the five declaration gates stay separate.
- Compute capability may be queried through `nvidia-smi`, `cudaDeviceGetAttribute()`, `cuDeviceGetAttribute()`, or NVML. The method must be direct, device-bound, dated, and retained with its raw result.
- Replacing an uncertain forward-package route with a sufficiently new documented driver stack can be a simpler candidate design. It still requires component review and runtime validation and grants no evidence by itself.
- The baseline subject may differ from another maintainer's choice, provided it is separate from EX01 reporting, names exact inputs and commands, and has correctness criteria declared before execution.

## Common errors

- Treating the `nvidia-smi` CUDA banner as the installed Toolkit or treating `nvcc --version` as the KMD.
- Selecting a GPU Capability Tier from memory capacity or product name without a direct compute-capability query.
- Borrowing the CUDA 12.x floor for Toolkit 13.3.1 or assuming a forward package is universal.
- Reading `documented-path` as “validated,” or reading `not-documented` as permission to run first and explain later.
- Using EX01 output, a successful build, zero exit status, or community `PASS` in place of maintainer control and a predeclared baseline.
- Writing baseline correctness criteria after seeing output or inventing missing logs, versions, package state, and observations.

Reviewed: **2026-08-26**. These solutions contain no machine observation, runtime result, performance number, or Reference Environment declaration, and they grant no CUDA Evidence Status.
