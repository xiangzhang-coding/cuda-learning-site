---
title: 'M14 Reviewed Solutions: Construct and Audit Repeated CUDA Graph Work'
description: Equivalent ordinary, explicit, and captured DAG plans, invalid-capture recovery, and replay, lifetime, completion, and update repairs for the M14 Exercises.
pairId: m14-solutions
counterpart: /memory/cuda-graphs/solutions/
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
unitId: M14-SOLUTIONS
prerequisites:
  - M14-EXERCISES
relatedUnits:
  - M14
  - M11
  - EX09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m14-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M14-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M14-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M14,M11,EX09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/cuda-graphs/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M14 Exercises](/en/memory/cuda-graphs/exercises/) as static graph and lifecycle reviews. They do not replace the canonical EX09 source, execute capture, instantiate an executable, launch a graph, or establish performance.

## Solution 1: Compare ordinary submission and two graph constructions

The node set is `{H2D, clear, compute, D2H}`. The adjacency list is `H2D: [compute]`, `clear: [compute]`, `compute: [D2H]`, and `D2H: []`. Valid topological orders begin with `H2D, clear` in either order, followed by `compute`, then `D2H`. Every edge moves forward in either order, so there is no directed cycle.

**Ordinary plan:** On every iteration, enqueue `H2D` and `clear` into separate named streams, use explicit event edges to make `compute` wait for both roots, enqueue `D2H` after `compute`, and observe the covering completion before host consumption or reuse. The host repeats every operation submission and completion boundary.

**Explicit plan:** Create the graph, add `H2D` and `clear` as roots, add `compute` with both root handles as dependencies, then add `D2H` with `compute` as its dependency. The same edges could be added after node creation, but the final node/edge set must match.

**Capture plan:** Begin on `origin`. Record a captured fork event and have `worker` wait so it joins the same capture graph. Capture `H2D` on `origin` and `clear` on `worker`. Record a captured completion event on `worker`; make `origin` wait on it before capturing `compute`. Capture `D2H` after `compute` on `origin`, then end capture on `origin`. That event wait rejoins `worker` before the end call.

All three plans define the same partial order and use the same output oracle. None proves that `H2D` and `clear` execute concurrently or that graph submission is faster.

## Solution 2: Unwind an invalidated stream capture

The synchronous `cudaMemcpy()` is prohibited in the documented active-capture context, and querying a captured event is invalid because it represents captured nodes rather than scheduled work. The first invalid operation invalidates the capture graph; later use of associated capturing streams and captured events is invalid except for ending capture to unwind it.

`cudaStreamEndCapture()` must be called on `origin`, not `worker`. In the failed attempt its purpose is to leave capture mode; it returns an error and a null graph, so there is nothing to instantiate. The missing worker rejoin is an additional capture failure, not a recoverable omission after invalidation.

A corrected attempt starts a fresh capture on `origin`, uses capture-supported asynchronous operations, avoids status query/synchronization during capture, connects `worker` only through events captured into the same graph, records a worker completion event, waits for it on `origin`, and finally ends on `origin`. Every immediate return is checked before the next transition.

## Solution 3: Repair replay, lifetime, completion, and update

The corrected lifecycle is: define `graph` -> instantiate `graphExec` once -> launch 1 into `S` -> establish completion for launch 1 before any dependent host read or reuse -> apply only a compatible documented parameter update if needed -> launch 2 -> establish completion for launch 2 -> free external storage and destroy `graphExec` and remaining handles.

| resource | last use | required boundary before release |
| --- | --- | --- |
| input/output buffers | last node in launch 2 that reads/writes them | completion covering launch 2 |
| completion event | host observation after launch 2 | successful wait/query policy, then event destruction |
| stream `S` | final queued graph/completion operation | completion of queued work, then stream destruction |
| `graphExec` | launch 2 submission and execution | explicit completion of launch 2 before conservative teardown |
| graph template | instantiation or later update source | completion of the host API using it |

A documented node-parameter change that preserves the required topology and other restrictions may update the executable for a subsequent launch. Adding a node changes topology, so construct a new valid template and re-instantiate. Two launches and a successful update still supply no timing or speedup evidence.

## Valid alternatives

- Use the explicit Graph API when node handles and direct parameter control simplify ownership.
- Use stream capture when existing stream-based code is capture-safe and its library boundaries expose capture restrictions.
- Record one completion event after the final repeated launch when no host action or resource reuse is required between launches.
- Rebuild and re-instantiate instead of updating whenever compatibility is uncertain or the returned update status rejects the change.

## Common errors

- Treating source order between independent nodes as a graph edge.
- Calling capture APIs as though captured work were executing immediately.
- Ending capture on an auxiliary stream or failing to rejoin it to the origin.
- Continuing to append work after capture invalidation or instantiating a null graph.
- Assuming graph or executable handles own every external allocation and callback lifetime.
- Reading output, freeing storage, or destroying execution state without a covering completion boundary.
- Treating arbitrary topology mutation as an executable update or treating replay as a performance result.

Reviewed: **2026-08-29**. Compilation and runtime evidence axes remain empty.
