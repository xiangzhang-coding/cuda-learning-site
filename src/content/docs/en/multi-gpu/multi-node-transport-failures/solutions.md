---
title: 'G09 Solutions: Preserve Unknowns and Restart Evidence'
description: Worked transport and failure ledgers with explicit evidence limits.
pairId: g09-solutions
counterpart: /multi-gpu/multi-node-transport-failures/solutions/
factCheckDate: '2026-09-21'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, transport, diagnosis, transfer]
resourceKind: solution-set
unitId: G09-SOLUTIONS
prerequisites: [G09-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL network and failure contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-21' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g09-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-21' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,transport,diagnosis,transfer' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G09-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/multi-node-transport-failures/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and scope

Exact prerequisite **[G09-EXERCISES]**: finish the [two static ledgers](/en/multi-gpu/multi-node-transport-failures/exercises/) first. [G09](/en/multi-gpu/multi-node-transport-failures/) and [SRC-CUDA-102](/en/sources-and-versions/#src-cuda-102), reviewed 2026-09-21, supply the contracts. These are deductions from synthetic fixtures, not observed operations. Multi-node behavior remains **Pending Hardware Verification**.

## Solution 1: a candidate is not a selected transport

Within F1's premises, propose `NCCL_SOCKET_IFNAME='=data0'`, `NCCL_SOCKET_FAMILY=AF_INET` and `NCCL_NET=Socket` for a separately admitted comparison. Prefix `data` includes the declared unrouted `data1`; UP on `mgmt0` says nothing about its peer route. An HCA filter addresses verbs devices, not IP interfaces. None of these proposed values provides actual endpoint reachability or a launcher.

For RDMA, request both nodes' HCA/port and link-layer identity, active state, firmware/provider versions, authorized rail/switch map, GPU–NIC attachment, memory-registration limits and GPU-memory path capability. Pin the actual launcher and prove rank placement, environment propagation, library visibility, permissions and all-node termination. Do not copy an MPI command before those facts exist. Bootstrap and network-selection logs from every rank, plus application phase records, distinguish requested from selected transport. Every element on every rank must pass after completion, with successful cleanup and job status; a selected network alone is insufficient.

In a public bundle, retain stable node/rank aliases, selected-network category and version facts. Remove credentials, substitute identities consistently in paths, filenames and contents, and keep the original-to-alias mapping private. Preserve an explicit list of redacted field categories and missing logs. F1 has no actual results; its passing analysis grants no runtime status.

## Solution 2: diagnose the producer before tuning an unknown network

F2 supplies a node-b local chain: init → producer CUDA error → process exit, with a missing collective-submission record. Node-a submits then reaches a deadline. Investigate the producer's immediate error and earlier CUDA operations, launcher stderr/exit cause and operation ledger first. A CUDA error may surface earlier asynchronous work; it does not identify a particular broken GPU. Missing logging is not proof no collective was submitted. Uncorrelated clocks do not establish a total cross-node event order. Transport choice is unknown, so an IB-timeout change is not justified by this fixture.

Socket default sleeps total `100*(1+2+...+34) = 59,500 ms`; actual attempts and phases add time. Verbs acknowledgement uses `4.096 µs * 2^20 ≈ 4.295 s`, with its own retry policy. Application deadlines bound progress monitoring; a supervisor's whole-job deadline covers even stuck initialization/cleanup and remote ranks. No one of these proves the root cause or output validity.

For a fresh attempt, stop submissions, preserve original evidence, coordinate failure out of band and request safe abort on surviving ranks. Nonblocking communicator handling must honor in-progress states and forbid concurrent NCCL calls during abort; retain a whole-job termination fallback. Obtain every node's termination receipt, operator-approved remediation and changed-variable ledger. Allocate a fresh job, communicator/ID and known input; never reuse rank 0's uncertain receive buffer. Admit the full G09 Environment Manifest, then validate every rank and cleanup. If any receipt or check is absent, record an incomplete/failed attempt, not recovery.

For G09's proposed R=2, N=257 oracle, the sum is `9+2*((i mod 17)-8)`. The following are arithmetic checks, not GPU results; every one of the 257 positions still needs validation in a future run.

| i | Rank 0 input | Rank 1 input | Expected sum on both ranks |
| --- | --- | --- | --- |
| 0 | -5 | -2 | -7 |
| 16 | 11 | 14 | 25 |
| 256 | -4 | -1 | -5 |

Publish only reviewed, consistently aliased rank/phase records with versions, attempts and explicit missing evidence. Check hostnames/addresses/UUIDs, paths and filenames, job/communicator identities, tokens and environment dumps in text and attachments. Redaction must not merge two nodes into one alias or remove the failure while retaining a later timeout.

## Transfer the reasoning

In [PB-R6-012](/en/practice/#pb-r6-012), bootstrap connectivity and data transport are different claims. In [PB-R6-013](/en/practice/#pb-r6-013), local launcher death and all-node termination are different claims. Returning to [G09](/en/multi-gpu/multi-node-transport-failures/), keep expected behavior, synthetic premises and recorded observations separate. No scaling, topology, transport, hang diagnosis or recovery result was measured.
