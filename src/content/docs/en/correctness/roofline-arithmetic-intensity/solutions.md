---
title: 'Q10 Reviewed Solutions: Build, Place, and Audit a Roofline Point'
description: Reviewed work/traffic contract, synthetic Roofline point, above-roof provenance audit, valid alternatives, and common errors.
pairId: q10-solutions
counterpart: /correctness/roofline-arithmetic-intensity/solutions/
factCheckDate: '2026-09-01'
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
unitId: Q10-SOLUTIONS
prerequisites:
  - Q10-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q10-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/roofline-arithmetic-intensity/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/roofline-arithmetic-intensity/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are static reviewed answers for the [Q10 Exercises](/en/correctness/roofline-arithmetic-intensity/exercises/). Every number belongs only to the supplied synthetic model and is not a GPU observation.

## Solution 1: Work and traffic contract

`I_DRAM = 9.0e9 FLOP / 4.5e9 byte = 2.0 FLOP/byte`. The ledger also records the FP32 workload, FMA=2 FLOP convention, exact kernel or range, input, iterations, and DRAM read+write boundary. Compulsory estimate, implementation estimate, and tool-observed traffic occupy separate columns and never overwrite one another.

If the boundary changes to L2, redeclare bytes crossing the L2 path, read/write direction, cache and transaction semantics, aggregation, tool definition, and the same workload coordinate. Work count may remain, but `T_L2` and `I_L2` must be recalculated.

**Review:** Passes. Units close, and DRAM and L2 denominators are not mixed.

## Solution 2: Roof and workload point

`I_ridge = 15.0e12 / 2.5e12 = 6.0 FLOP/byte`. The path roof is `2.0 * 2.5e12 = 5.0e12 FLOP/s`; the overall roof is `min(15.0, 5.0) = 5.0 TFLOP/s`. Achieved rate is `9.0e9 / 2.25e-3 = 4.0e12 FLOP/s = 4.0 TFLOP/s`.

The point is `(2.0 FLOP/byte, 4.0 TFLOP/s)`, below its `5.0 TFLOP/s` roof. Because `2.0 < 6.0`, it lies in the modeled path-ceiling region. This is not an observed path bottleneck and does not promise that the `1.0 TFLOP/s` gap is recoverable.

**Review:** Passes. Work, traffic, ceilings, and time use one synthetic provenance, and region language remains modeled.

## Solution 3: Above-roof and mixed-provenance audit

Interpretation of the original point is rejected immediately. Its x and y come from different runs, its DRAM denominator is a compulsory estimate, and the two ceilings have different provenance, one undocumented. Above-roof is an inconsistent-input signal rather than exceptional hardware evidence.

The theoretical rebuild uses one exact-device specification, operation convention, and theoretical path definition. The calibrated rebuild uses matched compute and bandwidth calibrations from one declared environment, clock state, and microbenchmark method. The tool-reported rebuild uses one exact `.ncu-rep`, GPU, tool, kernel occurrence, and documented model fields. Each recomputes the same workload point without mixing families.

**Review:** Passes. The audit repairs coordinates before interpretation, moves no roof, and names no region a bottleneck.

## Valid alternatives

- Work may count integer operations or use another FLOP convention when the compute ceiling uses the same convention.
- The byte boundary may be DRAM, L2, or a host-device path; each boundary gets its own traffic and intensity.
- Theoretical, calibrated, and tool-reported roofs may appear side by side with separate provenance and uncertainty labels.
- An above-roof audit may begin with units or workload identity, but it must eventually cover every coordinate.

## Common errors

- Mixing FMA operation count, instruction count, and FLOP count.
- Saying only “bytes moved” without memory path and read/write scope.
- Presenting logical compulsory bytes as profiler-observed traffic.
- Treating milliseconds as seconds or mixing decimal and binary prefixes.
- Combining x, y, and roof from different kernels, runs, or devices.
- Mixing specification compute, measured bandwidth, and tool-reported model ceilings.
- Calling a modeled region an observed bottleneck or optimization winner.
- Raising a ceiling to accommodate an above-roof point.

Reviewed: **2026-09-01**. All four evidence arrays remain empty.
