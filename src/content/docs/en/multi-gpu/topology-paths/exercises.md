---
title: 'G03 Exercises: Bound a Topology Claim'
description: Collect a versioned topology worksheet and reject identifying or misleading fixtures.
pairId: g03-exercises
counterpart: /multi-gpu/topology-paths/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: G03-EXERCISES
prerequisites: [G03]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVIDIA System Management Interface', url: 'https://docs.nvidia.com/deploy/nvidia-smi/index.html', version: 'rolling documentation reviewed 2026-09-19; installed CLI version required', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/topology-paths/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G03 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'rolling documentation reviewed 2026-09-19; installed CLI version required' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/topology-paths/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[G03]**: [topology paths](/en/multi-gpu/topology-paths/). Reviewed 2026-09-19; [SRC-CUDA-096](/en/sources-and-versions/#src-cuda-096). Paper tasks need no hardware. Real collection requires G03's native Linux/two-GPU profile, exact per-device CC and memory, driver/Toolkit/CLI versions, process model, peer compatibility known or unknown, topology source, permissions and full Environment Manifest. Real observations remain Pending Hardware Verification without qualifying evidence.

## Exercise 1: make an acquisition and prediction worksheet

**Goal:** collect authorized `topo -m` and `topo -mp` records, then explain one GPU–GPU and, if available, one GPU–NIC relationship. If hardware is absent, submit a blank worksheet and an explicit blocker instead.

**Constraints:** preserve private command/help/version/exit-status evidence and reconcile CUDA versus tool ordinals by private stable identities. Read the exact legend. Include observation, hypothesis, missing evidence and falsification test columns. Do not fill absent NICs, NVLinks or remote routes from a product name. Do not run network or collective workloads.

**Acceptance:** distinguish PCI-only from NVLink-inclusive views, treat permissions/unsupported flags as unknown, and leave numeric bandwidth blank unless independently evidenced. Explain why `S/B` is at most an idealized lower-bound model for known B. Record host placement, shared-link and traffic-size assumptions for any proposed comparison. No measured time is required or invented.

<details><summary>Hint 1: identify before comparing</summary>A remapped CUDA ordinal and a tool ordinal may name different devices. Resolve identity before deciding two views disagree.</details>
<details><summary>Hint 2: a local edge stops locally</summary>GPU–NIC closeness does not identify a remote endpoint, transport or network route.</details>

## Exercise 2: review a synthetic fixture

**Goal:** validate a fictional graph with aliases GPU-A, GPU-B and NIC-A. The GPU pair has relationship PIX in the PCI-only view; peer capability is unknown in both directions and network route is unknown. A proposed change adds a free-form hostname and claims a measured bandwidth from PIX.

**Constraints:** use the host-only `scripts/lib/topology-fixture-policy.mjs` contract. Keep provenance `synthetic`, command identity `topo-mp`, source version `synthetic`, and all non-evidenced fields unknown. Do not insert real machine identifiers into tests. Test extra keys, malformed labels, duplicate/reversed edges and attempts to add performance or runtime-status fields.

**Acceptance:** valid alias data round-trips into a fresh object; identifying extras and unsupported claims are rejected with fixed diagnostics that do not echo input. Unknown never becomes false or a fallback route. A reviewed-observation label is not available for a synthetic graph. Explain the additional private source/derivative hash, alias-map and human review record required for a real derivative.

<details><summary>Hint 1: build an allowlist</summary>Removing known secret patterns from arbitrary text is weaker than refusing arbitrary text entirely.</details>
<details><summary>Hint 2: provenance is not verification</summary>A small valid schema can still describe a fictional machine. Runtime status belongs to a separate evidence review.</details>

## Review separately

After attempting both tasks, read the [solutions](/en/multi-gpu/topology-paths/solutions/) and audit [PB-R6-003](/en/practice/#pb-r6-003).
