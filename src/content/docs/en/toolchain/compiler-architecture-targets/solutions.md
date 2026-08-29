---
title: 'M17 Reviewed Solutions: Design and Audit Compiler-Target Artifact Plans'
description: All-Lane baseline commands, a qualified suffix and Lane matrix, and artifact and deployment compatibility claim repairs for the three M17 Exercises.
pairId: m17-solutions
counterpart: /toolchain/compiler-architecture-targets/solutions/
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
unitId: M17-SOLUTIONS
prerequisites:
  - M17-EXERCISES
relatedUnits:
  - M17
  - EX10
  - VIS09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m17-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M17-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M17-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M17,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/compiler-architecture-targets/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M17 Exercises](/en/toolchain/compiler-architecture-targets/exercises/) as static command, artifact, and compatibility reviews. They do not execute `nvcc`, replace EX10 inspection, select a runtime image, or establish compilation, runtime, or performance evidence.

## Solution 1: All-Lane baseline artifact plan

The three selected Lanes use the same source-level target fragment because the reviewed F06 rows independently accept the same baseline pair, not because success in one Lane propagates to another:

```bash
--generate-code=arch=compute_75,code=sm_75 \
--generate-code=arch=compute_75,code=compute_75
```

| Toolkit Lane coordinate | Virtual assumptions | Requested SASS/cubin entry | Requested PTX entry | Current evidence |
| --- | --- | --- | --- | --- |
| NVCC 11.8.0 | baseline `compute_75` | `sm_75` | `compute_75` | owner-row acceptance only |
| 12.9.2 archive / page label 12.9 | baseline `compute_75` | `sm_75` | `compute_75` | owner-row acceptance only |
| selected Toolkit 13.3.1 / page label 13.3 | baseline `compute_75` | `sm_75` | `compute_75` | owner-row acceptance only |

The first clause requests assembled real code; the second retains PTX from the same virtual compilation. The next step is to record the exact compiler and host compiler, full command, exit status, and log independently in each Lane, then inspect the resulting artifact. Those records do not exist here, so artifact entries, driver compatibility, runtime selection, execution, correctness, and performance remain unresolved.

## Solution 2: Qualified suffix and Lane matrix

The source requirement determines the suffix. The compiler row determines whether that spelling is accepted:

| Requirement | Virtual / real pair | SASS clause | Same-scope PTX clause | Selected 11.8.0 row | Selected 12.9.2 / 13.3.1 rows |
| --- | --- | --- | --- | --- | --- |
| Exact 9.0 | `compute_90a` / `sm_90a` | `arch=compute_90a,code=sm_90a` | `arch=compute_90a,code=compute_90a` | blocked | accepted |
| Family 10.0 | `compute_100f` / `sm_100f` | `arch=compute_100f,code=sm_100f` | `arch=compute_100f,code=compute_100f` | blocked | accepted |
| Exact 10.0 | `compute_100a` / `sm_100a` | `arch=compute_100a,code=sm_100a` | `arch=compute_100a,code=compute_100a` | blocked | accepted |
| Family 12.0 | `compute_120f` / `sm_120f` | `arch=compute_120f,code=sm_120f` | `arch=compute_120f,code=compute_120f` | blocked | accepted |
| Exact 12.0 | `compute_120a` / `sm_120a` | `arch=compute_120a,code=sm_120a` | `arch=compute_120a,code=compute_120a` | blocked | accepted |

The `a` clauses preserve exact-capability assumptions from source through real code and retained PTX. The `f` clauses preserve named-family assumptions through both outputs. The selected 11.8.0 row is blocked because it has no qualified pair, not because a GPU query found the “wrong” hardware. The 12.9.2 and 13.3.1 cells still need independent builds before any Compile-Checked claim.

Numeric ordering cannot change the conclusion. Exact 12.0 is not a numeric upgrade of exact 10.0 or family 10.0, and family 12.0 is not a wildcard for all later capabilities. The exercise authorizes no unlisted target or cross-suffix pair.

## Solution 3: Artifact and deployment compatibility packet

Reject all four original claims:

| Claim | Verdict | Corrected boundary |
| --- | --- | --- |
| Plan F covers every capability `>= 10.0` | false | `compute_100f` / `sm_100f` expresses only the named 10.0-family scope in the current owner table; numeric ordering does not enlarge a family |
| Plan A covers every capability `>= 12.0` | false | `compute_120a` / `sm_120a` is exact to 12.0, and its PTX retains exact-12.0 assumptions |
| PTX guarantees older-driver minor compatibility | false | Minor Version Compatibility requires target architecture/SASS and warns about runtime restrictions for PTX applications on older drivers |
| Target names prove runtime selection and execution | false | Names express only a requested plan; even inspected entries prove no image selection, JIT, load, launch, or correctness |

The corrected six-stage ledger is:

1. **Requested:** Plan F and Plan A each have same-suffix SASS/PTX clauses.
2. **Build:** Exact executable, host compiler, complete options, exit status, and logs are missing, so the result is unknown.
3. **Inspection:** Artifact identity and inspection output are missing, so entries cannot be called present.
4. **Scope:** F is restricted to the named family, A to the exact architecture, and PTX broadens neither scope.
5. **Deployment:** GPU capability, loaded driver, Runtime and libraries, OS, and package are missing. The minor path must handle the PTX caveat. A cross-major forward path also requires an eligible system, applicable package, loader, and feature checks.
6. **Runtime:** There is no image-selection, JIT, module-load, launch, completion, or correctness observation.

The permitted final statement is: “The 12.9.2 owner row accepts both selected target plans. If exact builds and inspections later succeed, they are expected to contain SASS/PTX entries for named-family 100f and exact-architecture 120a respectively. Deployment and runtime behavior remain indeterminate.”

## Valid alternatives

- When source needs no qualified feature, change the requirement and re-review an unsuffixed baseline plan. This is not merely deleting a suffix.
- When release policy needs no PTX, retain only selected SASS clauses, explicitly narrow the artifact strategy, and review deployment separately.
- When several deployment scopes are needed, create independent artifacts for each source variant and feature contract rather than assuming every qualified pass can safely enter one source build.
- When compatibility premises are incomplete, return indeterminate and request an Environment Manifest, build record, and artifact inspection instead of guessing a runtime path.

## Common errors

- Hiding virtual, real, and PTX outputs behind `-arch` shorthand.
- Treating `compute_75` as an installed GPU or `sm_75` as proof that an artifact exists.
- Letting a real target provide a narrower feature set than the virtual source assumptions.
- Treating `a` and `f` as numeric versions or assuming PTX removes suffix restrictions.
- Projecting 12.9.2/13.3.1 owner-row acceptance into 11.8.0 or an unlisted target.
- Collapsing minor, forward, and ordinary backward compatibility into one “driver compatible” claim.
- Claiming runtime selection, execution, correctness, or speed from planned or inspected entries.

Reviewed: **2026-08-29**. The hardware gate is none; compilation and runtime evidence axes and recorded observations remain empty.
