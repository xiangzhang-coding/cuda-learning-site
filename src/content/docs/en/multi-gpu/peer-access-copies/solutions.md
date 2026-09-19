---
title: 'G02 Solutions: Preserve the Last Read'
description: Derive a correct peer dependency chain and staged-buffer lifetime.
pairId: g02-solutions
counterpart: /multi-gpu/peer-access-copies/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank-review, retrieval]
resourceKind: solution-set
unitId: G02-SOLUTIONS
prerequisites: [G02-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA peer access API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__PEER.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/peer-access-copies/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank-review,retrieval' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/peer-access-copies/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt first

Exact prerequisite **[G02-EXERCISES]**: [peer Exercises](/en/multi-gpu/peer-access-copies/exercises/). Original reasoning reviewed 2026-09-19 against [SRC-CUDA-095](/en/sources-and-versions/#src-cuda-095). No observed GPU output is included.

## Solution 1: separate the four contracts

B reading A needs B→A access. Query success plus value one permits an enablement attempt; the query does not enable anything. G02's conservative copy policy checks/enables both directions. Zero takes the staged path, while an unexpected API error stops the run. Already-enabled state is recorded without claiming ownership. Only permissions this run enabled are disabled at cleanup.

Select A, submit producer and record readyA in sA. Then select B, submit sB's wait on that already-submitted record, the peer copy and consumer, and record doneB. Synchronizing doneB closes the dependent chain. Source release occurs after its last copy read; destination release after its last consumer. A stronger host wait before the copy is a valid, less concurrent alternative. Neither approach proves overlap. Do not subtract cross-device events; use local intervals or a host end-to-end clock with explicit completion. A capability bit names legal access, not atomic support, physical route or throughput.

## Solution 2: review both paths

For each length and direction, generate the CPU oracle independently. Both paths must return `(i mod 251)+1` at every index, including the tail for 257. The maximum N uses 4,194,304 bytes per device. The direct path has readyA→wait→copy→consumer order. The staged path uses portable pinned storage, producer→download in sA, host synchronization, upload→consumer in sB and final synchronization before reuse. These are acceptance derivations, not recorded outputs.

Record the selected path for every case; forced staging does not depend on peer capability. Retain original failures and never replace an error with a success record from a different branch. Unknown IOMMU/ACS conditions block direct PCIe testing; independent local transfers may still be assessed. The manifest includes exact versions, two actual CC values, memory, ownership, topology source, permissions and private-to-public evidence provenance. Missing qualifying evidence leaves both runtime activities Pending Hardware Verification. Common mistakes include comparing only a checksum, freeing staging after submission, and treating one compatible direction as two.

## Practice Bank review

[PB-R6-002](/en/practice/#pb-r6-002) remains wrong even after both permissions are enabled: producer completion does not prove the remote read is complete. Retain A's allocation until a completion event after the copy is synchronized, or conservatively until doneB. Then select the owning device and release it. If B directly dereferences A instead of copying, the last reader is the consumer itself, so copy completion is insufficient. This distinction is why the ownership ledger lists actual last users.

## Retrieval answers

The query direction is accessor→allocation owner. Failure leaves capability unknown; successful zero establishes unavailability. Enablement grants access, the copy moves bytes, and event/stream dependencies order the consumer. A never-recorded event cannot represent future work. Cross-device event waits are allowed but elapsed time requires same-device events. Staging reuse waits for the upload's completion, not just its submission.
