---
title: 'G09: Trace Multi-Node Transport and Failure Evidence'
description: Separate launch, bootstrap, transport and application failures using bounded evidence.
pairId: g09
counterpart: /multi-gpu/multi-node-transport-failures/
factCheckDate: '2026-09-21'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, identities, transport, selection, logging, timeouts, diagnosis, admission, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G09
prerequisites: [G03, G04, Q07]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 65
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL network and failure contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-21' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g09 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-21' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,identities,transport,selection,logging,timeouts,diagnosis,admission,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G09 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G03,G04,Q07' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/multi-node-transport-failures/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Build a rank-to-node ledger, justify an interface/transport candidate and write a diagnosis that distinguishes facts, hypotheses and missing evidence. Allow 65 minutes. Reading and the static Exercises need no GPU. Multi-node execution, transport choice, recovery and performance remain **Pending Hardware Verification**; there is no operated cluster or recorded run behind this unit.

## Exact prerequisites

**[G03, G04, Q07]**: [topology paths](/en/multi-gpu/topology-paths/), [communicators and collectives](/en/multi-gpu/nccl-communicators-collectives/), and [timeline-first diagnosis](/en/correctness/timeline-first-nsight-systems/). Bring the distinctions between adjacency and transfer, collective participation and result placement, and host submission and device completion.

## Why crossing a node changes the problem

Within one machine, a device ordinal and a local topology query can identify resources. Across machines, independent operating systems, address spaces, names, routes and clocks intervene. Collective libraries preserve the rank-level operation while transport implementations manage movement. This separation makes portable applications possible, but adds failure domains: a correct GPU kernel cannot repair a missing process or unreachable interface.

## Keep identities in separate columns

A **node** is a machine in the allocation; a **process** is one OS instance of the program; a **rank** is an identity within a communicator. A **local rank** is a launcher/application-defined index on one node. None is a CUDA-visible ordinal, GPU UUID, hostname or IP address. A **network interface** belongs to a node; a **route** chooses how an endpoint is reached; a **transport** implements communication; **topology** describes attachments and paths, not successful transfer.

The fictional two-node ledger below has one process, one rank and one full GPU per node. Both processes may correctly select visible device 0. Symbols are public aliases, not addresses to resolve.

| Node alias | Process alias | Global rank | Local rank | Visible GPU | Interface alias |
| --- | --- | --- | --- | --- | --- |
| node-a | process-a | 0 | 0 | 0 | data-a |
| node-b | process-b | 1 | 0 | 0 | data-b |

Privately reconcile each row with hostname resolution, GPU identity, PCIe/NUMA attachment, NIC/HCA port and allocation ownership. Hostnames can resolve to a management network; the same interface name on two nodes need not denote the same fabric. G03's local GPU–NIC distance cannot establish the remote switch path or routing. Record node-local event order and clock synchronization/uncertainty before comparing Q07 timelines; timestamps from two hosts alone cannot prove overlap or the earliest global failure.

## Separate launch, bootstrap and data movement

The launcher starts processes and supplies placement/environment; NCCL does not launch processes. One process creates `ncclGetUniqueId`, and an out-of-band CPU mechanism distributes that ID before distinct ranks call `ncclCommInitRank`. `ncclCommInitAll` is single-process and cannot be turned into a multi-node launcher by changing an interface variable. EX24 uses that local design.

Launch control, NCCL bootstrap and collective data may use different paths. TCP bootstrap can coexist with IB/RoCE data. A successful launcher connection or bootstrap message proves neither collective completion nor GPUDirect RDMA. Socket transport uses TCP/IP; NCCL's internal `IB` network uses verbs for InfiniBand or RoCE. A plugin can provide another named network. RDMA availability, GPU-direct memory access and the chosen algorithm are separate claims requiring their own evidence.

The inspected nccl-tests revision requires an MPI-enabled build (`MPI=1`) for multiple processes; its total rank count is processes × threads per process × GPUs per thread. Its CPU ID distribution uses `MPI_Bcast`; local-rank device selection occurs in `src/common.cu`. This establishes source behavior, not a tested launch recipe. An MPI implementation/version and its remote launch, environment propagation and termination semantics must be pinned before a future runnable scenario is admitted.

## Select candidates, then verify the chosen path

These are **configuration values to reason about**, not a shell launch script. `data0`, `data1` and `mlx5_0` are hypothetical local names; replace them only after an authorized inventory on every native-Linux node.

| Control in NCCL 2.31.2 | Meaning and evidence boundary |
| --- | --- |
| `NCCL_SOCKET_IFNAME='=data0'` | Exact IP-interface filter; `data` is a prefix, `^=data1` excludes an exact name. Manual selection bypasses automatic selection and may match multiple interfaces. It does not select an RDMA HCA. |
| `NCCL_SOCKET_FAMILY=AF_INET` | Restrict to IPv4; `AF_INET6` selects IPv6. Family, local address and remote route must agree. |
| `NCCL_IB_HCA='=mlx5_0:1'` | Exact verbs device and port filter; an IP-interface name is not this namespace. An unanchored `mlx5_1` can also match `mlx5_10`. |
| `NCCL_NET=Socket` or `NCCL_NET=IB` | Request the named network rather than relying on automatic choice. Verify availability and selected network in every rank's logs; forcing an unavailable network may fail. |
| `NCCL_IB_DISABLE=1` | Disable internal verbs use for a controlled comparison; it does not repair a route or prove what an external plugin selected. |

Automatic IP selection favors `ib` names and normally excludes loopback/docker interfaces unless alternatives are unavailable. An UP interface can still be unreachable. Check authorized addresses, both directions of routing, address family, port policy and remote endpoint. NCCL opens TCP connections as well as any data transport; opening only the launcher's port is insufficient. Administrator-approved port ranges/firewalls are part of the environment, not learner-wide firewall-disable instructions.

For RDMA, separately record HCA/port, active state, link layer, firmware/provider versions, fabric/rail mapping and memory-registration permissions. IP reachability alone proves no RDMA path. A successful host-memory verbs test proves no GPU-memory path. Use owner-approved low-level tests only after their versions, permissions and memory modes are recorded. NCCL 2.31.2 dynamically selects RoCE GIDs; do not copy an old fixed `NCCL_IB_GID_INDEX` workaround into this profile. Fabric traffic-class policy belongs to the operator. Change one admitted variable at a time and remove debugging overrides after the comparison.

## Logs must retain causality without publishing identities

For a future diagnostic attempt, request `NCCL_DEBUG=INFO` with `NCCL_DEBUG_SUBSYS=INIT,BOOTSTRAP,NET,ENV,GRAPH,COLL`. `COLL` selection does not guarantee every-call INFO traces; preserve application sequence markers and immediate return values separately. Keep launcher stderr/status, each rank's application phase and CUDA/asynchronous NCCL states, and transport messages. Missing logs are missing evidence, not success.

`NCCL_DEBUG_FILE` supports `%h` (hostname) and `%p` (PID), overwrites an existing filename, and can corrupt/lose output when processes share a filename. Use a new private job directory and distinct per-process filenames for every attempt. Preserve the original bundle privately. Before publication, consistently alias hostnames, IP/MAC/GID addresses, GPU UUIDs, bus IDs, job IDs, usernames, paths and communicator IDs in **filenames and contents**, including launcher commands. Remove credentials/tokens and unrelated environment variables entirely; never publish a full environment dump. Retain rank relationships, phase ordering, error categories and version facts, with an explicit redaction ledger. Inspect archives, metadata and screenshots too.

The Exercises contain original, synthetic, identity-redacted diagnostic fixtures. They are structured teaching records, not verbatim NCCL logs or reports of executed failures. Only node/process/interface aliases and logical sequence numbers occur. No timing, hostname, route address, credential or result is implied.

## A timeout is a boundary, not a root cause

| Boundary | Pinned meaning | What it cannot certify |
| --- | --- | --- |
| Socket retry | `NCCL_SOCKET_RETRY_CNT=34`, `NCCL_SOCKET_RETRY_SLEEP_MSEC=100`: defaults for selected connection errors; linear waits sum to 34×35/2×100 ms = 59,500 ms | Not a global 59.5-second initialization or job deadline; connection attempts and other phases add time |
| Verbs acknowledgement | `NCCL_IB_TIMEOUT=20`: 4.096 µs × 2^20 ≈ 4.295 s; default `NCCL_IB_RETRY_CNT=7` | Not a collective deadline; zero or ≥32 timeout gives an infinite timeout, not an immediate failure |
| Application progress | Poll stream progress and both the return status and output state of `ncclCommGetAsyncError`, with an explicit phase deadline | A successful query does not mean the communicator state is healthy or work complete |
| Whole job | External supervisor bounds launch, init, collective, cleanup and remote termination | Killing only a local launcher is not proof that remote ranks stopped |

Increasing a timeout cannot fix mismatched collective counts/order, a missing rank or invalid routing. A hang means progress was not established within the observation window; identify the phase and missing evidence rather than declaring a broken switch. Blocking stream synchronization alone can wait indefinitely after an asynchronous network error.

## Diagnose by failure domain and preserve recovery evidence

Start with the smallest known failing phase, then choose an observation that distinguishes hypotheses:

| Symptom in a future report | Candidate domains | Next discriminating evidence |
| --- | --- | --- |
| One rank never emits an application-start marker | Launcher, executable/library visibility, placement, permission, process exit | Per-node launcher status, executable/build identity and stderr before NCCL |
| Bootstrap starts but peers do not connect | Name/address selection, family, route, TCP policy, missing peer | Both endpoints' selected interfaces/routes and per-rank startup coverage |
| Init completes; operation sequence differs | Application participation, count/dtype/order, producer dependency | Every rank's operation ledger plus local Q07 timeline; do not tune the fabric first |
| Verbs completion/registration failure | Provider, HCA/port, memory limits, fabric, peer exit | First error on each rank, authorized port/provider/counter and memory-limit evidence; counters need a before/after interval |
| Rank 0 times out after rank 1 exits | Process failure may have propagated through the communicator | Rank 1's earlier local error and launcher exit cause; a timeout report alone cannot prove the network caused it |

A node failure can remove several ranks; one process or GPU failure can make all peers wait; a shared switch can affect multiple jobs. Correlation at a shared failure domain is a hypothesis, not attribution. Preserve failures before retrying. Stop new work, coordinate failure out of band, attempt communicator abort on surviving ranks without concurrent NCCL calls, and use a supervisor to enforce whole-job termination. For an application-managed abortable design, pinned docs require nonblocking communicators and polling; abort/destroy themselves can still block. Do not introduce unsafe concurrent abort on a thread stuck in a blocking call.

The teaching recovery policy is a fresh whole-job attempt after operator-approved remediation. Record old/new attempt IDs, failed phase, error/exit states, termination confirmation on every node, changed configuration, fresh communicator/ID and restored input/checkpoint identity. Never reuse uncertain output as a checkpoint. Recovery is accepted only after all ranks complete correctness checks and cleanup in the new attempt. Retrying without that evidence proves no recovery; deleting a rank changes the mathematical contract. Fault-tolerant shrink/grow and unattended retries need a separate design.

## Admission contract for a future external run

This unit delivers static analysis, not a runnable multi-node Lab. A future run needs **at least two native-Linux nodes** and a completed [Environment Manifest](/en/start/environment-manifest/) before commands are published. The proposed smallest scope is two nodes, one process/rank/full GPU per node, each CC≥7.5, ≥8 GB total and ≥1 GiB free; no MIG or VM substitution. The following is a requirements ledger, not a record of provisioned hardware:

| Required field | Proposed scope or information still required |
| --- | --- |
| OS/compiler/driver/Toolkit/NCCL | Native Ubuntu 24.04 x86-64, GCC 13.3.0/C++17, Toolkit 13.3.1 (NVCC 13.3.73), NCCL packages 2.31.2-1+cuda13.3, driver ≥610.43.02; record exact installed builds on both nodes |
| GPU/network topology | Exact GPU capability/count/memory and GPU–NIC PCIe/NUMA map; actual NIC/HCA/port, firmware/provider, switch/rail links, link rates, MTU, interfaces, addresses/families and two-way route/port policy; currently unknown |
| Launcher and permissions | Exact MPI or other launcher/version/build, node allocation, rank mapping, remote environment propagation, executable/library visibility and all-node termination; GPU/device access, socket access, host/shared/pinned memory and private-log permissions; currently unselected |
| Workload and oracle | Proposed custom int32 sum all-reduce, R=2, N=257, input x[r,i]=3*(r+1)+(i mod 17)-8, expected 9+2*((i mod 17)-8) on both ranks; separate send/receive arrays total 2,056 bytes per GPU plus context/library overhead; check all elements after completion |
| Bounds and logs | Proposed 60-second per-phase progress deadline, 180-second whole-job deadline and 10-second termination grace, enforced on every node by the selected supervisor; record outcomes even on timeout; preserve complete per-rank/launcher bundle and redaction ledger |
| Expected versus recorded | Expected: admitted startup, documented selected transport, correct every-rank result, cleanup and zero job status. Recorded: none. Compile evidence: none. Runtime: Pending Hardware Verification. |

The oracle is hand-derived, not nccl-tests output; an upstream benchmark would need its own exact options and validation contract. Socket and RDMA comparisons require separate admitted manifests. Scaling/performance needs repeated completed measurements, workload/placement equality, clock and timing boundaries and uncertainty; no number is predicted here. A community bundle can be Community-Observed while maintainer Runtime Verification remains pending until a qualifying Reference Environment exists.

## Practice

Complete the [transport and diagnosis Exercises](/en/multi-gpu/multi-node-transport-failures/exercises/), then the [separate solutions](/en/multi-gpu/multi-node-transport-failures/solutions/). Apply the model to [PB-R6-012](/en/practice/#pb-r6-012) and [PB-R6-013](/en/practice/#pb-r6-013).

## Retrieval questions

1. Why can rank 0 and rank 1 both own visible GPU 0?
2. Which evidence separates launcher reachability, bootstrap and data transport?
3. Why does an IP-interface filter not choose an HCA port?
4. What can two unsynchronized node timestamps fail to order?
5. Why is 59,500 ms of retry sleeps not a job deadline?
6. What evidence would distinguish collective mismatch from a network failure?
7. What must be retained and redacted before publishing a failed attempt?
8. What makes a fresh attempt a verified recovery rather than another retry?

## Primary sources and rights

Reviewed **2026-09-21**. [SRC-CUDA-102](/en/sources-and-versions/#src-cuda-102) records current Context7 discovery, immutable NCCL documentation/implementation and nccl-tests launch/validation source, hashes and exact licenses. Instruction, tables, synthetic fixtures and Exercises are original CC BY 4.0; site checks are Apache-2.0. No upstream log, example, binary or test is redistributed. Hardware behavior remains Pending Hardware Verification.
