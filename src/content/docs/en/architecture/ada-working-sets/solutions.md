---
title: 'H03 Solutions: Capacity, Reuse Distance and Measurement'
description: Worked budgets and a scoped protocol for Ada cache hypotheses.
pairId: h03-solutions
counterpart: /architecture/ada-working-sets/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, budget, measurement, evidence]
resourceKind: solution-set
unitId: H03-SOLUTIONS
prerequisites: [H03-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ada cache contracts', url: 'https://docs.nvidia.com/cuda/ada-tuning-guide/index.html#memory-system', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,budget,measurement,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/ada-working-sets/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Exact prerequisite: [H03-EXERCISES](/en/architecture/ada-working-sets/exercises/). Original solutions, reviewed **2026-09-22**, [SRC-CUDA-105](/en/sources-and-versions/#src-cuda-105).

## Solution 1: three budgets, no fabricated hits

| W | Allocation 2W | Requested traffic/launch | Payload + 256 MiB reserve |
| --- | --- | --- | --- |
| 4 MiB | 8 MiB | 8 MiB | 264 MiB |
| 32 MiB | 64 MiB | 64 MiB | 320 MiB |
| 128 MiB | 256 MiB | 256 MiB | 512 MiB |

All satisfy the hypothetical free-memory budget, with the last exactly at the declared boundary. Real allocations still need checked success; reduce sizes if actual free memory changes. A 4 or 32 MiB input alone is smaller than 64 MiB L2. This is necessary capacity reasoning, not sufficient residency evidence. The 128 MiB input cannot all reside there simultaneously. Output writes, replacement policy, other kernels/display work and spills alter the competition. Requested 2W bytes need not reach DRAM on every repetition.

The 32 MiB window is within its 64 MiB limit but exceeds the 16 MiB set-aside. Ratio 1 requests persisting treatment for the whole window and can cause eviction within the set-aside. Ratio 0.5 requests that property for approximately half the accesses, roughly a 16 MiB footprint in the simplified example; it guarantees neither specific resident lines nor 50% hits. After checked workload completion, disable the window and coordinate a persisting-status reset with the context's other clients. Do not mistake disabling the window for resetting old lines.

MIG disables this set-aside; MPS requires server-start configuration. If unsupported or not authorized, use default caching. No new cluster/TMA gate arises. Preserve int32 output bit-for-bit with CPU comparison, including boundary lengths. A smaller input or a tiled redesign is another valid proposal if it states the changed workload and independently revalidates semantics. It cannot be smuggled into the same-size benchmark.

## Solution 2: measure comparable executions

The proposal mixes devices, warmed versus flushed data, instrumented versus unprofiled execution, display load and potentially clocks, software and launch counts. None of the claimed performance result is established by the supplied packet.

First use one CC 8.9 GPU and `compute_89` / `sm_89`; keep the source, sizes, repetition count, int32 semantics and validation unchanged. Warm code loading separately. Specify a first-pass cache-history protocol without claiming guaranteed cold cache from an undocumented trick. For repeated passes, explicitly warm the same input and then time the same count of copies using same-stream events and checked end-event completion. Collect multiple trials and report the distribution rather than the fastest sample. Include complete batches; separate initialization, H2D/D2H and CPU validation from kernel timing, and report an end-to-end interval separately.

Collect counters in a separate pass with a recorded replay and cache-control policy that matches the hypothesis. Default kernel-replay cache flushing is not evidence of steady-state reuse. If counter permission fails, retain the error and leave traffic/hit claims unknown. An event-time observation, if later obtained, cannot fill that gap. Record exact GPU/CC, L2/free VRAM, driver, Toolkit/compiler/target, OS, tool version/metrics, policy/window, display/concurrent work and power/clock/thermal coordinates.

The current conclusion is only that the proposed comparison is confounded. A future correct same-device result can support a workload-specific policy choice. A cross-device result still combines bandwidth, SM resources, clocks and software with cache capacity. It cannot prove a universal product-generation speedup.

## Evidence and licensing

Architecture execution and performance remain **Pending Hardware Verification**. No build, device result or profiler report is supplied. A qualifying Reference Environment and Environment Manifest must accompany future correctness and measurement evidence. Original CC BY 4.0 solutions; owner references retain their notices.
