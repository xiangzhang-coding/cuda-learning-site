---
title: 'G03 Solutions: Keep Missing Paths Unknown'
description: Review topology interpretation, fixture provenance and bounded network predictions.
pairId: g03-solutions
counterpart: /multi-gpu/topology-paths/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank-review, retrieval]
resourceKind: solution-set
unitId: G03-SOLUTIONS
prerequisites: [G03-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVIDIA System Management Interface', url: 'https://docs.nvidia.com/deploy/nvidia-smi/index.html', version: 'rolling documentation reviewed 2026-09-19; installed CLI version required', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/topology-paths/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank-review,retrieval' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'rolling documentation reviewed 2026-09-19; installed CLI version required' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/topology-paths/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt first

Exact prerequisite **[G03-EXERCISES]**: [topology Exercises](/en/multi-gpu/topology-paths/exercises/). Original solutions reviewed 2026-09-19 against [SRC-CUDA-096](/en/sources-and-versions/#src-cuda-096). No captured machine topology or measured communication result is present.

## Solution 1: preserve the observation boundary

A valid worksheet records command, installed tool version, help/legend, date, permissions and exit status, linked privately to identities and the Environment Manifest. Reconcile the two inventories before interpreting pair labels. The PCI-only view can expose a PCIe path even when the other view names NVLink; they answer different questions. If either query fails, retain that failure and do not substitute a guessed label.

For an actually observed shared PCIe resource, propose fixed-size isolated versus concurrent transfers as a contention test, with equal completion definitions and recorded CPU/memory placement. Without a measured or independently documented payload capacity B, no numeric `S/B` estimate is justified. Even with B, the bound excludes overhead and contention and predicts neither exact time nor achieved bandwidth. A missing NIC leaves the GPU–NIC row unavailable, not fabricated. Lack of hardware produces a blank worksheet and Pending Hardware Verification, which is an honest submission rather than a failed paper Exercise.

## Solution 2: small schema, explicit provenance

The synthetic case retains only aliases, a PCI-only PIX edge, unknown directional peer values and unknown network route. Extra hostname, bandwidth and runtime-status keys are rejected, not redacted and passed through. Duplicate undirected edges, including reversed duplicates, are invalid; a PCI-only record cannot claim NVLink. The output is reconstructed so modifying it cannot mutate the input. Diagnostics are fixed text and never include a rejected value.

Real derivatives require a private review chain connecting original bytes, exact source/command/version, alias mapping, derivative bytes and reviewer. The public validator checks the approved schema and source-version shape, not the truth of that chain; it cannot prove a human review occurred. `reviewed-observation` indicates declared provenance only. Runtime evidence still undergoes the independent Environment Manifest and log review. Keeping a fictional graph marked synthetic prevents tests from masquerading as hardware observations. Common mistakes include publishing residual raw text and treating unknown peer capability as false.

## Practice Bank review

[PB-R6-003](/en/practice/#pb-r6-003) supplies only a synthetic local GPU–NIC proximity label. It cannot establish RDMA capability, remote endpoint, selected interface, transport, network route or bandwidth. A defensible report retains a placement hypothesis and lists those missing observations. A denied query stays unknown. No collective-library knowledge is needed to reject the unsupported inference, and no replacement route should be invented.

## Retrieval answers

Visibility can remap CUDA ordinals relative to the tool inventory. `-mp` excludes NVLink while `-m` can include it. NV# omits link generation, negotiated state, payload efficiency, contention and measured use. SYS describes an inter-NUMA host connection, not an off-host hop. A network path needs endpoint/interface/transport and route or fabric evidence. A synthetic fixture is fictional; a reviewed derivative declares origin; qualifying evidence additionally requires a complete manifest and logs reproduced under the stated evidence policy.
