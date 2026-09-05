---
title: 'L03 Exercises: Select CUB Device Primitives'
description: Select a device primitive for one aggregate, exclusive offsets, and a cross-stream inclusive-prefix pipeline, then submit storage, overlap, completion, and numerical contracts.
pairId: l03-exercises
counterpart: /libraries/cub-device-primitives/exercises/
factCheckDate: '2026-09-05'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: L03-EXERCISES
prerequisites:
  - L03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l03-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cub-device-primitives/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L03 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cub-device-primitives/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [L03](/en/libraries/cub-device-primitives/) first. All three tasks produce static primitive-selection packets. They display, compile, and run no CUDA/C++, and all four evidence arrays remain empty.

## Instructions

For each task, select the narrowest of the three entry points taught in L03. State operation semantics before overlap, temporary storage, stream, completion, lifetime, version, and numerical acceptance. Do not infer a backend or performance from an API name. Finish your packet before opening the [separate reviewed solutions](/en/libraries/cub-device-primitives/solutions/).

## Exercise 1: Collapse a vector to one scalar

**Goal:** Select a device-wide primitive that produces only one total from `N` FP32 samples, and define when the host may read that scalar.

**Constraints:** Use the traditional two-phase interface on a named non-default stream. Input contains `N` items and output holds one value; input/output overlap is forbidden. State matching query/execution coordinates, scratch lifetime, floating-point acceptance, and the reduction determinism contract for every CUB coordinate in L03's five profile rows without writing an implementation.

**Expected evidence:** A one-page selection packet containing output cardinality, a query/allocate/execute ledger, stream dependency graph, overlap verdict, determinism scope, and an explicit evidence-boundary statement.

**Acceptance criteria:** The selected operation writes one aggregate; zero and all `N` items enter its semantics; query is not recorded as execution; input, output, and scratch live through stream completion. All five reduction profile rows retain their documented same-GPU run-to-run determinism and cross-compute-capability caveat, while serial-order equality remains separate; no timing or observed output appears.

<details><summary>Hint 1</summary>First decide whether the request is "one aggregate" or "one prefix per position"; do not start from a function name.</details>

<details><summary>Hint 2</summary>After fixing output shape, distinguish a stable repeated-run order from serial parenthesization and a cross-architecture bit pattern.</details>

## Exercise 2: Turn counts into exclusive offsets

**Goal:** Select a primitive that maps `N` nonnegative counts to `N` offsets, with zero in the first output and position `i` containing only counts before `i`.

**Constraints:** Declare a 32-bit or 64-bit count and offset type plus a no-overflow precondition. Choose exact in-place or disjoint out-of-place storage and reject every other partial overlap. Traditional query and execution use the same `NumItemsT`, current device, operation, and problem configuration.

**Expected evidence:** Symbolic semantics for the first three and final outputs, primitive-selection rationale, a range diagram, temporary-storage record, and an integer-overflow acceptance rule.

**Acceptance criteria:** Item `i` does not enter its own output; the result has exactly `N` items; only exact aliasing or fully disjoint ranges is accepted; any type, device, or problem-size change triggers a new query; a wider output type is not treated as automatic proof against overflow. Once a correct zero identity and no-overflow bound are established, integer prefix correctness remains exact and is not weakened by the floating-point determinism matrix.

<details><summary>Hint 1</summary>Write expected values for positions 0 and 1 before generalizing to an arbitrary position.</details>

<details><summary>Hint 2</summary>After settling semantics, inspect the alias shape and the count type that participates in the query's template instantiation.</details>

## Exercise 3: Produce inclusive prefixes for a cross-stream consumer

**Goal:** Select a primitive that creates prefixes including the current value, with the producer on `stream_prefix` and its consumer on `stream_consume`, then complete the dependency graph.

**Constraints:** Use the traditional API so CUB 1.15.1, 2.8.2, 3.3.4, and selected 3.4.2 share one call structure. Order query, scratch allocation, execution, event record and wait, host observation, and deallocation. Use a tolerance for FP32 rather than requiring serial bitwise equality, and distinguish CUB 1.15.1 scan's same-GPU run-to-run contract from the possible pseudo-associative run-to-run variation documented by 2.8.2, 3.3.4, and selected 3.4.2.

**Expected evidence:** A primitive-selection packet, two stream timelines, one explicit cross-stream edge, a resource-lifetime endpoint, an inclusive-prefix acceptance rule, and version rationale.

**Acceptance criteria:** Every output includes its current item; the consumer runs after an event dependency; host access and all relevant release occur after final completion; scratch is not reused concurrently. The determinism cells retain the reviewed guarantee for 1.15.1 and the reviewed variation boundary for 2.8.2, 3.3.4, and selected 3.4.2; the packet neither makes an environment overload a prerequisite for old bundles nor claims observed output, overlap, or speedup.

<details><summary>Hint 1</summary>Enqueue order within one stream orders only that producer's stream; it does not automatically order another stream.</details>

<details><summary>Hint 2</summary>Once the cross-stream edge is present, follow the graph to the final consumer of input, output, and scratch before placing each release.</details>

## Next

Inspect the [separate reviewed solutions](/en/libraries/cub-device-primitives/solutions/), then complete [PB-R4-003](/en/practice/#pb-r4-003). Executable work is linked only through the published [canonical EX17 route](/en/examples/cub-device-reduction-scan/).
