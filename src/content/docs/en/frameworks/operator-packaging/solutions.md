---
title: 'P10 Reviewed Solutions'
description: Separate toolchain identity, wheel contents and clean import evidence.
pairId: p10-solutions
counterpart: /frameworks/operator-packaging/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: solution-set
unitId: P10-SOLUTIONS
prerequisites: [P10-EXERCISES]
relatedUnits: [P10, EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p10-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/operator-packaging/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P10-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P10-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'P10,EX22' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/operator-packaging/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt first

Complete [P10 Exercises](/en/frameworks/operator-packaging/exercises/). The [P10](/en/frameworks/operator-packaging/) matrix and [EX22](/en/examples/adjacent-energy/) build script govern this answer. Commands describe acceptance, not a fabricated successful transcript.

## Solution 1: Follow artifact identity through each stage

Create the selected CPython environment and run the repository's hash-locked application checker before installing the extension. Confirm torch 2.11.0+cu128, Toolkit 12.8.1/NVCC 12.8.93 and GCC 13.3.0. In a fresh EX22 copy, set the declared compiler and architecture variables and run the canonical check-wheel script. Keep its wheel build, installation, dependency check, isolated import and CPU integration results separately identified.

The wheel is the handoff artifact: hash it, install the same bytes with no dependency re-resolution into a second matching application environment, and use a fresh isolated process to import the public package. Record both Python package and native extension paths. **Valid alternative:** running the process from an unrelated directory with PYTHONPATH cleared can also test source independence, but -I supplies a simpler explicit boundary. **Common errors:** accepting an editable import, ignoring pip check, reusing stale dist files, or claiming byte-identical builds merely because imports agree.

## Solution 2: Stop before the wrong build

The application wheel reports CUDA family 12.8; local NVCC 13.3 is a major mismatch. EX22's setup must stop before compiling, regardless of the driver's advertised CUDA capability. Select the exact 12.8.1 Toolkit, GCC and architecture contract and rebuild cleanly. Do not bypass the check or copy an old binary into the new wheel.

The editable import is a separate false positive: it proves source resolution, not wheel completeness. In a disposable matching environment, install only the produced wheel, use isolated imports, and locate the installed _C. Temporarily remove that installed extension while retaining the source checkout elsewhere; a new isolated process must fail. Restore by reinstalling the original wheel, then repeat positive import and CPU checks. **Valid alternative:** construct a deliberately incomplete disposable wheel and require its import to fail. **Common errors:** removing a source file instead of the installed extension, reusing a process that has cached the native module, or accepting a JIT fallback. CUDA unavailability remains a runtime blocker; it does not erase a genuine host check or create a GPU pass.

## Continue

[PB-R5-010](/en/practice/#pb-r5-010) changes the release scenario. Review [SRC-CUDA-085](/en/sources-and-versions/#src-cuda-085), dated 2026-09-13. Preserve Environment Manifest observations independently from target configuration.
