---
title: 'M19 Reviewed Solutions: Build a Dialect Matrix and Audit the C++23 Probe'
description: The exact C++17/C++20 matrix, current-documentation and R1-history claim ledger, and supported-GCC-14 retained-record publication gate for the three M19 Exercises.
pairId: m19-solutions
counterpart: /toolchain/cpp-dialect-boundaries/solutions/
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
unitId: M19-SOLUTIONS
prerequisites:
  - M19-EXERCISES
relatedUnits:
  - M19
  - EX02
  - EX10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m19-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M19-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M19-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M19,EX02,EX10' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/cpp-dialect-boundaries/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the static matrix and probe audits in the [M19 Exercises](/en/toolchain/cpp-dialect-boundaries/exercises/). They do not execute EX10, produce a retained record, or update M19 Evidence Status. The current retained GCC 14.2 C++23 probe is a narrow pass; ordinary EX10 C++23 support remains undeclared.

## Solution 1: Reconstruct the teaching matrix from versioned sources

The correct declaration matrix is:

| Toolkit Lane | Ordinary EX10 builds | C++23 treatment | Source role |
| --- | --- | --- | --- |
| CUDA 11.8.0 | C++17 | not declared | the archived NVCC `--std` list ends at C++17 |
| CUDA 12.9.2 | C++17, C++20 | not declared | the archived Linux guide and NVCC page provide the C++20 coordinate |
| CUDA 13.3.1 | C++17, C++20 | separate `cxx23-probe`, retained narrow pass | current Programming/Linux guides provide eligibility; the retained exact record and current NVCC-list mismatch block a broad claim |

The ordinary rows are declared inputs to the EX10 artifact pipeline, not observed M19 build results. The C++23 probe belongs only to the 13.3.1 candidate and does not enter the ordinary matrix. The current guide cannot project a newer dialect into archived 11.8.0/12.9.2, and archive ceilings cannot describe the current compiler.

M19's empty frontmatter compilation array therefore remains correct: this static Learning Unit does not inherit EX10 status. EX10's five ordinary records separately establish the declared Lane/dialect combinations as Compile-Checked.

## Solution 2: Classify the documentation mismatch and R1 probe

The claim ledger is:

| Input | Can support | Cannot support |
| --- | --- | --- |
| Current Programming Guide v13.3 | CUDA C++23 language surface; GCC 14, Clang 18, and NVHPC 24.3 minima; MSVC unsupported | a successful build for an exact source/environment |
| Current Linux Installation Guide v13.3 | supported host-compiler ranges and the C++23 dialect declaration | EX10 acceptance by a particular host/compiler pair |
| Current NVCC `--std` reference | the published accepted-value list still ends at C++20, creating a documentation mismatch that must remain visible | inevitable failure of every C++23 attempt |
| Retained EX02 R1 record | an `unsupported` exact probe under CUDA 13.3.1 + NVCC 13.3.73 + GCC 13.3.0 | the supported-GCC-14 result, another compiler's result, or a broad Toolkit conclusion |

The intersection rule is that a candidate host compiler must be inside the Linux guide's supported major range and meet the Programming Guide's minimum for the selected dialect. GCC 13.3 misses the C++23 GCC 14 minimum. A GCC 14 candidate still requires the actual probe; table eligibility alone is insufficient.

The exact historical conclusion is: "Retained R1 evidence records the requested C++23 probe as unsupported for EX02 under CUDA Toolkit 13.3.1, NVCC 13.3.73, and GCC 13.3.0; it neither contradicts nor broadens the separate retained EX10 GCC 14.2 narrow pass." The R1 record stays immutable, and ordinary C++23 compilation evidence remains empty.

## Solution 3: Design the C++23 retained-record publication gate

The qualifying checklist, in order, is:

1. Pin the exact EX10 source commit and record the canonical `cxx23-probe` range/file identity.
2. Record the Native Linux runner/container, Toolkit 13.3.1, exact NVCC build, and exact supported GCC 14 version.
3. Retain the exact compile command, complete stdout/stderr, and exit status.
4. Establish that the `__cplusplus >= 202302L`, `if consteval`, and `static_assert` guards passed in the selected mode.
5. Retain `cxx23_probe.o` identity/hash and the selected inspection output.
6. State that neither host nor GPU executable ran, runtime is Runtime-Not-Applicable, and there is no correctness or performance observation.
7. Link the record back to EX10/M19 and confirm that the source pin and narrow publication claim agree.

The decision table is:

| Candidate packet | Decision | Publication wording |
| --- | --- | --- |
| source, Dockerfile, or workflow row only | reject | blocked/pending; no Compile-Checked |
| retained GCC 13.3 R1 `unsupported` record | preserve, never upgrade | exact historical unsupported only |
| GCC 14 command success without diagnostics, guards, artifact, or retained identity | reject | incomplete probe; no Compile-Checked |
| complete retained GCC 14 pass packet | publish retained narrow pass | exact EX10/Toolkit/NVCC/GCC/platform/phase claim only |

The current admissible two-sentence statement is: "At source commit `16256cbeded889cb1a45f2461585317ed3fe0296`, EX10 range `cxx23-probe` compiled and produced the retained object under CUDA Toolkit 13.3.1, NVCC 13.3.73, and GCC 14.2.0 on Ubuntu 24.04.4 LTS. Run 33266515216 establishes that narrow `C++23-Dialect-Probe` result; no host or GPU executable ran."

This statement is not ordinary EX10 C++23 support and covers no other compiler, platform, source, runtime, or performance. The Compile-Checked status of the five ordinary C++17/C++20 records remains separate from this probe claim.

## Valid alternatives

- The retained packet may use a reproducible container digest or an equivalent complete Environment Manifest, provided the exact GCC 14 and NVCC identities remain reviewable.
- Object inspection may retain tool output or a structured artifact ledger, but it must also retain the object hash and identity rather than only a summary.
- Future Clang 18 or NVHPC 24.3 probes may create their own narrow records, but they do not replace the GCC 14 EX10 probe required by this publication gate.
- Ordinary C++17/C++20 rows may obtain independent records. They do not upgrade the C++23 probe, and the C++23 probe does not upgrade the ordinary matrix.

## Common errors

- Treating a WG21 standards draft as CUDA compiler-support evidence.
- Publishing a broad pass because the Programming Guide and Linux guide list C++23.
- Publishing a broad impossibility because the current NVCC option list ends at C++20.
- Deleting or overwriting the GCC 13.3 unsupported R1 record instead of preserving its exact historical scope.
- Treating a workflow, Dockerfile, canonical source, site build, or command exit as a retained probe record.
- Failing to inspect the language guard, allowing an ignored option to masquerade as the requested dialect.
- Changing the probe question with an unsupported-host bypass.
- Reporting a compile-only artifact result as runtime, GPU-correctness, or performance evidence.

Reviewed: **2026-08-29**. The hardware gate is none, and M19 compilation and runtime evidence arrays remain empty.
