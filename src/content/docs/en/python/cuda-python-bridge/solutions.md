---
title: 'P01 Solutions: Ownership, Profile Identity, and Conditional Costs'
description: Work through a five-element reference, safe blocking and asynchronous ownership, exact profile repairs, and a hypothetical break-even calculation.
pairId: p01-solutions
counterpart: /python/cuda-python-bridge/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P01-SOLUTIONS
prerequisites: [P01-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'CUDA core installation and support boundary'
    url: 'https://nvidia.github.io/cuda-python/cuda-core/1.2.0/install.html'
    version: 'cuda-core 1.2.0'
    platform: 'Static Python bridge and dependency audit, not execution'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/python/cuda-python-bridge/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/python/cuda-python-bridge/solutions/" lang="zh-CN">阅读中文对应页</a>

## Reviewed solutions

Attempt [P01 Exercises](/en/python/cuda-python-bridge/exercises/) first; the sole direct prerequisite is `[P01-EXERCISES]`. These are original paper solutions. All four evidence arrays remain empty, and no command, compiler, or GPU result is recorded.

## Solution 1: Return owned values or an owned pending operation

The mathematical output is `[2,-1,0,8,-0.5]`. All supplied inputs and sums are exactly representable in float32. One block of 256 threads covers five useful indices and 251 inactive tail indices. Each array has 20 bytes; three device arrays total 60 device bytes and three pinned host arrays total 60 host bytes. Neither sum includes native runtime/compiler/context overhead.

Input initialization and the Python reference execute on the CPU. Compilation/linking, if performed, also execute on the host and produce code, not vector results. H2D/launch/D2H calls submit work; the CUDA kernel computes on the GPU. Importing a package does not change the location of the reference loop.

The necessary data chain is `initialize -> H2D -> kernel -> D2H -> checked completion -> CPU inspection`. Buffer owners must span their last queued uses; the output owner must additionally span the final view read. The stream and kernel/library owners survive execution. A ctypes view does not retain its Buffer, so returning it alone fails both ownership and readiness requirements.

In a blocking design, keep resources in the function, call `s.sync()` after D2H, compare every finite output, and copy accepted values into an independently owned Python result before closing the backing Buffer. Returning that independent result permits cleanup without a dangling view. Merely synchronizing and then returning a view whose Buffer is freed remains wrong.

An asynchronous design may return an application-level pending-operation object that owns the needed Buffers, stream, kernel/library references, and state. Its completion operation must check synchronization, report failure, and only then expose validated data. It also needs a defined abandonment/cleanup policy. This is an interface design, not an existing core class or evidence that safe cancellation is available. If completion fails, no result becomes valid; preserve the original diagnostic and report cleanup separately.

## Solution 2: Pin artifacts, then distinguish policy from observation

The repaired profile uses native Linux x86-64 Ubuntu 24.04, ordinary GIL CPython 3.14.7 with `cp314-cp314`, core 1.2.0, bindings 13.4.1, pathfinder 1.8.1, and NumPy 2.5.3. Native Toolkit 13.3.1 supplies NVRTC and nvJitLink 13.3.33; the driver target is 610.43.02. Runtime adds one compiler-supported CC 7.5+ GPU and the small-problem budget. These remain separate manifest fields, not one “CUDA version.”

Use exact base distributions and their reviewed wheel hashes, without extras that can select a different native Toolkit family/minor. NumPy remains required by core even without an EX21 NumPy import. A lock does not prove import success or loaded native identities, nor freeze the interpreter, driver, OS packages, or GPU. Record resolved native paths, versions and package identities separately; the same major-family support policy still has API-specific limits.

| Evidence obtained | What remains unproven |
| --- | --- |
| Source/policy and artifact hash review | Import, native compilation/linking, load, execution, correctness |
| Host-test pass | Native compiler/linker path and every GPU stage |
| Actual successful native compile/link with retained qualifying records | Load, symbol lookup, typed launch, checked completion, GPU correctness |
| Successful launch submission | Completion, correct data, safe reuse/release |

A future qualifying build may support the compilation axis; it does not make EX21 Runtime-Not-Applicable or Runtime-Verified. Runtime-Verified needs the declared Reference Environment execution and full acceptance records.

For the hypothetical model, `1800+80*R < 170*R` implies `R>20`, so the first positive integer is **21**. At R=20 both totals are 3400; at R=21 they are 3480 and 3570. If preparation repeats each request, bridge time is `1880*R`, greater than `170*R` for every positive R. All conclusions are conditional on supplied costs and equal workload/measurement boundaries, not actual Python or GPU performance.

## Valid alternatives

A blocking independent result is the simpler service contract and easier to audit; an owned pending operation can preserve concurrency opportunities but adds readiness, lifetime, abandonment, and error state. Neither design is automatically faster. A matched CPU implementation is a legitimate choice, particularly when setup cannot be amortized, but the hypothetical worksheet does not select a measured winner.

## Common errors

- Keeping the view but discarding its allocation owner leaves a possible dangling address.
- Waiting for completion fixes readiness, not ownership after a subsequent free.
- Treating the Toolkit installation label as the loaded NVRTC identity misses loader search paths and independently installed libraries.
- Omitting NumPy or using `--no-deps` violates the selected core's dependency contract.
- Calling R=20 a strict win or moving repeated setup outside the loop changes the model.
- Converting a host test or cost model into GPU evidence bypasses the execution criteria.

Return to [P01](/en/python/cuda-python-bridge/). Sources: [SRC-CUDA-077](/en/sources-and-versions/#src-cuda-077) and [SRC-CUDA-079](/en/sources-and-versions/#src-cuda-079), checked **2026-09-12**. [EX21](/en/examples/cuda-python-launch/) remains Pending Hardware Verification.
