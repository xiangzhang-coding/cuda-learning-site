---
title: 'P08 Reviewed Solutions'
description: Worked edge arithmetic and separate repairs for indexing and current-stream submission.
pairId: p08-solutions
counterpart: /frameworks/first-custom-operator/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: solution-set
unitId: P08-SOLUTIONS
prerequisites: [P08-EXERCISES]
relatedUnits: [P08, EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p08-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/first-custom-operator/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P08-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'P08,EX22' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/first-custom-operator/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt before review

Complete [P08 Exercises](/en/frameworks/first-custom-operator/exercises/) first. These are worked deductions and implementation criteria, not native execution logs. Return to [P08](/en/frameworks/first-custom-operator/) for the contract.

## Solution 1: Count the output domain

The differences of `[0,0.5,-0.5,1]` are `[0.5,-1,1.5]`; output is `[0.25,1,2.25]`. For 256-thread blocks:

| n | Outputs | Blocks | Inactive threads |
| --- | --- | --- | --- |
| 1 | 0 | 0 | 0 |
| 257 | 256 | 1 | 0 |
| 258 | 257 | 2 | 255 |

Validate before pointer access, allocate n-1, return immediately for zero outputs, and guard each CUDA output index before reading the pair. An offset contiguous view already adjusts its data pointer; adding its storage offset again is wrong. Match [EX22](/en/examples/adjacent-energy/)'s canonical CPU and CUDA ranges. **Valid alternative:** a bounded grid-stride loop can preserve this contract if each output still has one writer. **Common errors:** accepting arbitrary strides without indexing them, using n for the output extent, or checking only the first element.

## Solution 2: Repair two independent boundaries

For n=258 the bad final active thread has i=257 and reads x[258], one past the input. Allocate 257 outputs and use i<257; two blocks still launch, so the remaining threads must perform no reads. For n=1, produce an empty result without a launch.

The stream defect survives that repair. Choose the input device with a scoped guard and obtain its current stream, then submit the kernel there. Put a producer, this operation and a dependent consumer on the same non-default stream; complete that stream before comparing the consumer to an independent reference. Keep input/output owners alive through use. **Valid alternative:** an explicit dependency graph between distinct streams could order the work, but is unnecessary for this current-stream operator. **Common errors:** adding a final device synchronize to a preexisting race, equating a successful launch query with completed work, and treating a CPU-only test as a CUDA ordering test.

## Continue

Try [PB-R5-008](/en/practice/#pb-r5-008) and review [SRC-CUDA-084](/en/sources-and-versions/#src-cuda-084), checked 2026-09-13. Actual GPU results require the Environment Manifest and separate hardware acceptance.
