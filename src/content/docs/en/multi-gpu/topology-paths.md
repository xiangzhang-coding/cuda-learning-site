---
title: 'G03: Read Topology Before Predicting Communication'
description: Connect observed PCIe, NVLink and NIC relations to bounded hypotheses without inventing routes or bandwidth.
pairId: g03
counterpart: /multi-gpu/topology-paths/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, acquisition, interpretation, prediction, sanitization, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G03
prerequisites: [G01, O03]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 55
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVIDIA System Management Interface', url: 'https://docs.nvidia.com/deploy/nvidia-smi/index.html', version: 'rolling documentation reviewed 2026-09-19; installed CLI version required', platform: 'native Linux', accessDate: '2026-09-19' }
  - { title: 'CUDA multi-GPU systems', url: 'https://docs.nvidia.com/cuda/archive/13.2.0/cuda-programming-guide/03-advanced/multi-gpu-systems.html', version: '13.2.0', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g03 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/topology-paths/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,acquisition,interpretation,prediction,sanitization,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G03 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G01,O03' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'rolling documentation reviewed 2026-09-19; installed CLI version required,13.2.0' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/topology-paths/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Collect topology on an authorized real Linux host, reconcile device identities, read the tool's own legend, and separate a connectivity hypothesis from a measured communication path. Allow 55 minutes plus external observation. Paper analysis needs no GPU; real observations remain Pending Hardware Verification here.

## Exact prerequisites

**[G01, O03]**: [devices and ownership](/en/multi-gpu/devices-contexts-ownership/) and [reading an Environment Manifest](/en/start/environment-manifest/). This unit does not require G02 or a collective library. CUDA peer-query results, if collected separately, are additional evidence rather than a prerequisite for reading a topology matrix.

## Why a device list is not a topology

Adding GPUs increases the possible communication edges, not necessarily the capacity of every edge. PCIe hierarchies share switches and host bridges; NUMA placement affects host staging; NVLink supplies a different interconnect where present. Network interface cards (NICs) add local attachment points for communication beyond the host. Counting GPUs or recognizing product names does not identify these paths. Topology tools expose relationships; measurements still have to establish what a workload used.

## Acquire a real observation before drawing the graph

Use the complete [G01 environment and manifest contract](/en/multi-gpu/devices-contexts-ownership/#external-environment-and-evidence-contract): native Ubuntu 24.04 x86-64 Linux, Toolkit 13.3.1, selected driver ≥610.43.02, at least two full visible GPUs, exact per-GPU CC≥7.5, ≥8 GB total and ≥256 MiB free; record exact installed versions even though these read-only commands do not allocate the exercise payload. Use one collector process; record the observed workload's process model separately. No network traffic is launched by this activity.

Run these read-only commands on that host and retain command, exit status, stderr, acquisition date, exact `nvidia-smi --version` and the help/legend privately. The owner manual is rolling documentation reviewed 2026-09-19, **not** an assertion that every driver implements every flag.

```sh
nvidia-smi --version
nvidia-smi topo -h
nvidia-smi -L
nvidia-smi topo -m
nvidia-smi topo -mp
nvidia-smi topo -p2p r
nvidia-smi topo -p2p w
nvidia-smi nvlink -h
nvidia-smi nvlink --status
```

Check local help first; unsupported commands or permission failures stay unavailable/unknown, not empty connectivity or a zero bandwidth. `-L` contains UUIDs and is not a public fixture. Reconcile CUDA ordinals and NVML/tool ordinals through a privately retained UUID/PCI bus-ID map. `CUDA_VISIBLE_DEVICES` can remap CUDA ordinals; never join the two inventories solely on `GPU0`.

Record GPU device access, sysfs visibility and query privileges. Some topology/NIC inspection depends on OS/driver permission; request an operator-supplied read-only record if necessary. No root elevation, clock modification, GPU reset or performance-counter privilege is part of this task. Record IOMMU/ACS state as known or unknown; reading the matrix does not authorize a peer transfer.

## Read the legend and its limits

The following is an original paraphrase of the reviewed owner legend, not a captured topology matrix. The actual installed tool's legend controls interpretation.

| Label | Relationship described | Boundary |
| --- | --- | --- |
| X | self | not a communication throughput value |
| PIX | PCIe connection through a single switch in the reviewed `topo -m` legend | no guarantee of CUDA peer access |
| PXB | multiple PCIe switches, without crossing a host bridge | switch uplinks may be shared |
| PHB | PCIe plus a host bridge, usually the CPU | no measured CPU staging claim |
| NODE | connection across host bridges within one NUMA node | not an application network route |
| SYS | PCIe and the interconnect between NUMA nodes | do not equate this with an off-host network |
| NV# | a bonded set of the indicated number of NVLinks | count is not generation, active payload rate or achieved bandwidth |

`topo -m` includes NVLink relationships and GPU/NIC affinities; `topo -mp` exposes PCI-only relationships, excluding NVLink. A pair can therefore show different labels without contradictory observations. CPU/memory affinity informs placement hypotheses, not a proof of thread pinning. `topo -p2p r/w` reports separate read/write capabilities; do not replace application CUDA queries and enablement with a legend label. NVLink status can describe link state; it does not show that a particular copy used that link.

NIC presence does not guarantee RDMA support; the manual notes that bonded NICs may be listed even when not RDMA capable. A local GPU–NIC relationship stops at the local attachment. To claim a network path, separately obtain authorized interface/port, routing or fabric evidence, remote endpoint, transport selection and transfer logs, with versions and permissions. Those observations and any multi-node execution are outside this two-GPU activity. Mark the remote path unknown; do not invent a route from local closeness.

## Predict only what the evidence bounds

For S bytes crossing a known bottleneck with **independently established** payload capacity B, an idealized lower bound is `time ≥ S/B`; it is not an observed time or an upper bound on latency. A host-staged serial transfer needs both device→host and host→device intervals plus overhead. Contention, message size, setup, synchronization, NUMA placement and protocol efficiency can all change achieved throughput. An NV# label alone supplies no numeric B.

An acceptable worksheet has columns **observation / hypothesis / missing evidence / falsification test**. For example, *if an actual record shows* a shared switch uplink, hypothesize contention under simultaneous transfers; compare isolated and concurrent cases with fixed byte counts and the same completion definition. Do not fill in rates. If G02 has not yet been completed, submit the measurement design rather than implementing its peer operations. A denied query yields “unknown,” not a slower-path ranking. A product name cannot fill a missing edge.

## Keep topology fixtures small and non-identifying

Public teaching fixtures contain only fixed aliases `GPU-A`, `GPU-B`, `NIC-A`, whitelisted relationship tokens and explicit provenance. **Synthetic** fixtures teach interpretation only; they are not “sanitized observations.” Never paste a whole real `nvidia-smi` report into source, tests or issue comments. Private originals may contain UUIDs, serial numbers, hostnames, PCI addresses, network addresses, paths and account data.

The original host-only validator `scripts/lib/topology-fixture-policy.mjs` accepts a small reviewed alias schema, rejects extra keys and invalid edges, keeps unknown fields unknown and emits a fresh allowlisted object. It does not parse raw tool text or establish runtime verification. Synthetic cases live in its unit tests. To publish a real derivative, first record privately the exact source/command/version, original hash, alias mapping, derivative hash, reviewer and removal policy; review the permitted relationships too because topology can itself identify a host. The derivative's `reviewed-observation` provenance only describes its origin and **does not grant** Community-Observed or Runtime-Verified status. Evidence review still requires the full Environment Manifest and logs.

## Exercises and review

Use the [topology Exercises](/en/multi-gpu/topology-paths/exercises/) to make a blank acquisition worksheet and review a synthetic alias graph, then read the [separate solutions](/en/multi-gpu/topology-paths/solutions/). [PB-R6-003](/en/practice/#pb-r6-003) challenges a network-route claim based on local proximity. No real topology, bandwidth, route or timing result is supplied on this page.

## Retrieval questions

1. Why might CUDA device zero differ from `nvidia-smi` GPU0?
2. Why can `topo -m` and `topo -mp` legitimately differ?
3. What does NV# omit that a numeric bandwidth prediction needs?
4. Why does SYS not mean an off-host network hop?
5. What additional evidence turns NIC proximity into a network-path claim?
6. What distinguishes a synthetic fixture, a reviewed derivative and qualifying runtime evidence?

## Primary sources and rights

Reviewed **2026-09-19**. [SRC-CUDA-096](/en/sources-and-versions/#src-cuda-096) records NVIDIA's rolling CLI manual and the archived CUDA 13.2 topology constraints. Current Context7 multi-GPU discovery was checked against these owner sources. The manual's exact publication terms remain NVIDIA's; we paraphrase facts and link, without copying its tables or actual machine output. Original instruction uses CC BY 4.0; the host-only validator/tests use Apache-2.0.
