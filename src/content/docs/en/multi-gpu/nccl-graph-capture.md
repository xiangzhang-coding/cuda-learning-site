---
title: 'G08: Capture NCCL Work Without Losing Its Contracts'
description: Separate collective capture and replay from buffer registration, lifetime, graph mixing and architecture-specific optimizations.
pairId: g08
counterpart: /multi-gpu/nccl-graph-capture/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, environment, capture, replay, lifetime, topology, registration, advanced, mixing, failure, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G08
prerequisites: [G05, M14]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 95
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL CUDA Graph contract', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/cudagraph.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'NCCL buffer registration', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/bufferreg.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'CUDA stream capture API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__STREAM.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g08 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/nccl-graph-capture/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,environment,capture,replay,lifetime,topology,registration,advanced,mixing,failure,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G08 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G05,M14' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-graph-capture/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Given a two-rank workflow, decide who captures, who replays, when buffers may change, and which optimization claims need additional evidence. Build a capture/lifetime ledger and reject unsafe transitions before external implementation. Allow 95 minutes. Reading needs no hardware; capture success, registration effects and performance remain **Pending Hardware Verification**. No GPU execution or speedup is recorded.

## Exact prerequisites

**[G05, M14]**: [NCCL stream dependencies](/en/multi-gpu/nccl-stream-dependencies/) supplies collective ordering and enqueue/completion distinctions; [CUDA Graphs](/en/memory/cuda-graphs/) supplies capture, instantiation, invalidation and external-resource lifetime. Review both before this unit. No device communication API is a prerequisite.

## Why capture preceded registration

Repeated host submission can be expensive even when the work is unchanged. CUDA Graphs reuse an instantiated dependency graph; they do not remove communication. NCCL **2.9 + CUDA 11.3** introduced capture support for collective, point-to-point and group operations. NCCL **2.11** added the CollNet graph-registration optimization. These are separate historical boundaries: an ordinary captured all-reduce does not require CollNet, NVLS or registered user buffers. The selected versions below are newer than those minima; the minima are not today's supported installation recipe.

## Selected external environment

Use native Ubuntu 24.04 x86-64, Toolkit **13.3.1**, NVCC **13.3.73**, GCC **13.3.0**, C++17, and independently pinned NCCL **2.31.2**, commit `7b83616df3ae082a1f32bb74c27458bfe8153a13`, packages `2.31.2-1+cuda13.3`. Reuse [EX24's exact package/build coordinates](/en/examples/nccl-all-reduce/) and [SRC-CUDA-097](/en/sources-and-versions/#src-cuda-097). The conservative native-driver floor is **610.43.02**, additionally requiring support for the actual GPUs; compatibility shims are outside this profile. G07's packaged NCCL 2.28.9 is a different environment.

The basic exercise selects **two distinct full GPUs, one process per GPU**, each **CC≥7.5**, ≥8 GB total and ≥1 GiB free. For N=4096 FP32 items, separate send/receive payloads total **32,768 bytes per rank**; contexts, NCCL workspace and graph resources are additional. Use one healthy blocking communicator and one explicit `cudaStreamNonBlocking` stream per process. One node with an authorized PCIe path suffices; NVLink, NVSwitch and InfiniBand are not basic requirements. Record the actual transport rather than inferring it from topology. Do not reuse EX24's single-process multi-GPU host loop for graph replay: a blocking `cudaGraphLaunch` can prevent that thread from launching a peer.

Record an [Environment Manifest](/en/start/environment-manifest/): package and loaded-library identity, source revision, OS/kernel/compiler, driver, Toolkit/NCCL, rank→PID→device mapping, CC and free/total memory, topology/peer access, stream dependencies, allocator/base/offset/size, graph generations, flags/config files/plugins, commands, every rank's errors and exit status. Require device access, authorized topology queries, local bootstrap sockets and host/shared-memory availability. Missing fields block acceptance. No profiler is required for correctness. Optional profiling requires permission to trace each process and write reports; hardware counters need separate administrator-granted access. Record denied permissions and exact profiler build, never substitute a missing trace with an expected timeline. [LAB18](/en/labs/pipeline-nccl-computation/) supplies the measurement discipline.

## Capture is a collective construction decision

Initialize the communicator and allocate buffers outside capture. First run and complete an ordinary correctness baseline, warming the exact operation and kernel path. For this exercise, keep input production outside capture. On every rank, call `cudaStreamBeginCapture(stream, cudaStreamCaptureModeThreadLocal)`, capture only the agreed `ncclAllReduce` → doubling-consumer sequence, and call `cudaStreamEndCapture` on the same origin stream and thread. Before each replay, produce fresh input on the replay stream, then launch the graph. Check each CUDA/NCCL result. Thread-local mode does not legalize synchronization or arbitrary unsafe operations inside capture. A group, if used, must open and close within the agreed capture region; group end is not device completion.

Captured operations define nodes instead of executing them. All ranks participating in an operation must agree whether that operation is captured. For a collective that means every communicator rank; for P2P it means the matched sender and receiver. Capturing only rank 0 while rank 1 issues ordinary all-reduce is invalid. Match count, datatype, reduction, communicator and operation order as in G05. Additional captured streams must fork and rejoin the origin through valid captured event edges before end capture.

| Boundary | Rank 0 | Rank 1 | What it establishes |
| --- | --- | --- | --- |
| baseline | ordinary sequence; complete | matching sequence; complete | comparison candidate, only after actual checking |
| capture generation A | capture reduce/consumer only | capture matching reduce/consumer only | graph definitions; input producer stays outside |
| instantiate A | own `cudaGraphExec_t` | own `cudaGraphExec_t` | local executable, no result |
| replay A, iteration k | launch own A | launch own A | matching participation, not completion |
| complete k | check stream and communicator | check stream and communicator | permits host comparison if successful |

## Replay preserves rank membership and addresses

After successful capture, require a non-null graph and successful `cudaGraphInstantiate`. Each participating rank launches its own executable **derived from the same collective capture**, with the same participating rank set. A replay is itself collective participation. A graph independently recaptured by one rank is not interchangeable merely because the count matches. Agree on graph generation and replay index outside the graph; do not skip a rank's replay after a local branch.

The basic path serializes iterations, completing the previous use before overwriting input for the next iteration. Changing the contents of live buffers is allowed when ordered before their reads. Assigning a new pointer to a host variable does not update addresses already captured. A count, datatype, reduction, communicator, address or dependency change requires draining old work and coordinated fresh capture/instantiation in this unit. Generic CUDA node-update support does not promise that opaque NCCL internals can be patched safely. Do not edit internal NCCL nodes.

An original oracle uses `send[r][i] = r + 1 + k`, `ncclFloat`, `ncclSum`, N=4096, two ranks and three replays k=0,1,2. The producer writes that input before graph launch on the same stream; the captured consumer doubles the reduced output. Expected every-element results are **6, 10, 14**. They are derived values, not logs. Require finite, exact values on both ranks after each completion. Separate out-of-place input prevents an in-place reduction from accidentally reusing the previous sum.

## Keep objects and storage alive

Capture records addresses and resource references, not copies of application data. Graph templates, executable graphs, user allocations, registration handles and communicators have different owners. Do not interpret `cudaGraphDestroy` or `cudaGraphExecDestroy` as a synchronization call. CUDA user-object reference retention can defer destruction; the source graph's destruction alone does not prove graph-associated registration is gone.

| Object | Conservative release boundary for this unit |
| --- | --- |
| graph executable | after final replay and dependent consumers complete; destroy with `cudaGraphExecDestroy` |
| graph template and any clones | keep through this exercise; destroy all with `cudaGraphDestroy` after executable release |
| graph-managed registration | NCCL manages it with graph lifetime; do not manually deregister an internal handle |
| explicit local registration handle | after all registered uses and retained graphs are finished, call `ncclCommDeregister` on its communicator |
| send/receive allocation | after all uses and registrations are released; match `cudaFree` or `ncclMemFree` to allocator |
| communicator/stream | retain through graph/registration cleanup; healthy `ncclCommDestroy`, then stream destruction |

The chosen order is conservative, not a claim that CUDA always needs the source template for replay. Retain host staging memory through any asynchronous copies too. Lifetime protection alone does not stop explicit overwrite. A consumer on another stream needs an event dependency after the replay and its own completion before reuse/free.

## Topology is still a runtime input

A CUDA dependency graph is different from NCCL's topology graph. Capture does not create P2P reachability, pin a network algorithm, or make registration eligible. Retain device placement, peer matrix, authorized topology and actual transport diagnostics from every rank. A successful local registration call is not proof that the selected collective used a zero-copy transport. Do not force NVLS on ordinary PCIe hardware or convert unsupported topology into a passing registration result.

## Two registration ownership models

**Graph registration** is managed by NCCL for eligible captured operations and follows graph lifetime. **Local registration** uses `ncclCommRegister(comm, base, bytes, &handle)` before operations and `ncclCommDeregister(comm, handle)` after final use. Local registration can be reused without recapture; neither form is CUDA host-memory pinning or an execution-completion signal.

When any communicator rank passes registered buffers to a communication operation, every other rank must pass its registered buffers; source and destination must both be registered to enable the optimization. Mixed registered/unregistered participation can be undefined behavior, not graceful fallback. For NVLS, each rank's send offset from its send allocation base must match the others, and likewise for receive offset. Send and receive offsets need not equal each other; absolute virtual addresses need not equal across processes.

Use `ncclMemAlloc` for the gated registration exercises. A custom VMM allocator must satisfy recommended allocation granularity, aligned virtual base and size, POSIX FD sharing and fabric handles where supported. Legacy `cudaMalloc` registration is disabled by default for general registration: enabling `NCCL_LEGACY_CUDA_REGISTER=1` can cause execution hangs and failure/abort segmentation faults. Leave it disabled. Graph capture using ordinary unregistered `cudaMalloc` buffers remains the basic path; do not mistake allocation for registration.

## Advanced-path gate ledger

All rows retain the exact **NCCL 2.31.2 / Toolkit 13.3.1 / driver≥610.43.02** profile, one process per GPU, **≥8 GB total and ≥1 GiB free per GPU**, N=4096 and 32,768 payload bytes plus measured allocation-granularity/workspace overhead. Every row requires the manifest and permissions above, including separate profiler permission when measuring. Version minima explain history only. Unmet optional eligibility means report **not eligible** and use the separately verified ordinary path; an API, allocation or asynchronous error means fail/stop, not retry inside a damaged communicator.

| Optional path | Architecture, GPU count and fabric gate | Registration/version contract and fallback | Why outside basic path |
| --- | --- | --- | --- |
| CollNet graph registration | CC≥7.5; ≥2 GPUs across ≥2 nodes; at most one GPU/process; all local GPUs mutually P2P reachable; functioning compatible CollNet plugin/fabric | since 2.11; `NCCL_GRAPH_REGISTER=1` defaults on but requires actual CollNet selection; record exact plugin/provider/firmware versions before running; missing plugin profile means not eligible | algorithm and cluster dependency; the flag is not a universal registration switch |
| general intra-node registration | CC≥7.5 with VMM/shareable-allocation support; ≥2 peer-reachable GPUs on one node, PCIe or NVLink | since 2.23.x; graph or local registration, qualified allocator; ordinary unregistered buffers are the comparison; no legacy-registration override | extra allocator, sharing and peer-path contract |
| NVLS registration | selected floor CC≥9.0 **and** NVLink SHARP-capable third-generation-or-later NVSwitch domain; ≥2 eligible full GPUs, not merely two Hopper cards | since 2.19.x; `ncclMemAlloc`, matching per-rank offsets, graph or local registration; unsupported NVLS can use ordinary algorithms; supported-but-failed NVLS resource allocation is an error in 2.31.2, including default `NCCL_NVLS_ENABLE=2` | multicast/fabric/resource requirements; CC alone is insufficient |
| IB SHARP registration | CC≥7.5; ≥2 nodes with exactly one participating GPU/rank per node; working IB SHARP fabric/plugin and approved RDMA access | since 2.21.x; both buffers registered locally or captured; record exact SHARP/plugin/OFED/firmware before admission; PXN excludes network registration, even after successful `ncclCommRegister`; disabling PXN is a separate measured configuration | cluster provider profile is not supplied here, so remains not eligible until reviewed |

For scale-out registration, `ncclMemAlloc` or appropriately RDMA-capable VMM memory avoids one cause of internal staging; it does not prove staging vanished. Do not mix allocator types or assume `NCCL_PXN_DISABLE=1` is automatically faster. Registration cost, setup, steady-state execution and teardown need separate measurements with unchanged correctness, workload, topology and flags. No row has a measured benefit.

Keep **Emerging Feature Watch** separate: newly introduced device APIs, **CFT**, **one-sided RMA**, symmetric-window/zero-CTA paths and new NVLS-related algorithms are not dependencies or alternative implementations for this exercise. The selected release notes describe CFT on Blackwell with Toolkit≥13.3, a PAT+NVLS H100 performance regression, B40 symmetric-TMA illegal accesses and B100 PCIe MLoPart allocation errors. None is evidence about basic capture; their workarounds must not be copied into the baseline. No executable profile is offered for these watch items.

## Graph mixing and ordering

Keep default `NCCL_GRAPH_STREAM_ORDERING=1` and graph-mixing policy for the basic serialized path; record effective environment/config overrides. Multiple communicators launched from the same host thread can deadlock through the graph-mixing mechanism. One GPU per process and one communicator reduce that risk; they do not excuse inconsistent participation.

`NCCL_GRAPH_MIXING_SUPPORT=0` is not a universal fix. With mixing disabled, parallel graph launches using the same or split-shared communicators are unsupported. Also unsupported: an ordinary NCCL call launched while a graph using those communicators is **outstanding**, even if placed on the same stream. Outstanding begins at host launch and ends when the device kernel completes. A stream dependency alone does not make that interval disappear; complete the graph before making the ordinary host call.

The advanced ordering bypass `NCCL_GRAPH_STREAM_ORDERING=0` (since 2.30) is outside this unit's execution profile. It is incompatible with `graphUsageMode=2`; explicitly setting `NCCL_GRAPH_MIXING_SUPPORT=1` forces mode 2 at initialization even over a lower configured mode. With bypass, the application must serialize all NCCL work on each GPU across graphs, communicators and captured/ordinary calls at execution time. A per-communicator `graphStreamOrdering=0` has the same obligation. Keep default ordering rather than treating fewer edges as a free optimization.

## Invalidation and failure are different from ineligibility

Do not call `cudaStreamSynchronize`, `cudaStreamQuery` or a broader device synchronization on a capturing stream/context; do not hide legacy-stream synchronous copies inside capture. An invalidated capture must still be ended on its origin stream/thread. Preserve the first error, check `cudaStreamEndCapture`, reject the returned null graph and never instantiate it. A rank failing capture must notify the external supervisor so peers do not continue into replay. A successful end/instantiate on another rank does not repair that failure.

Outside capture, inspect immediate API errors and poll stream completion plus `ncclCommGetAsyncError` under a deadline. Use a **180-second external whole-job deadline**, TERM then **10-second KILL grace**, because a blocking host API can prevent in-process polling. Retain all rank logs and launcher status. On asynchronous failure, output is not valid: stop all ranks, preserve the earliest error and use the documented abort/supervisor path; never insert a recovery collective or free active storage and continue. Healthy teardown and failed-job termination are different ledgers. A timeout fails acceptance.

## Practice and acceptance

Complete the [capture and lifetime Exercises](/en/multi-gpu/nccl-graph-capture/exercises/) before the [separate solutions](/en/multi-gpu/nccl-graph-capture/solutions/). Then audit [PB-R6-010](/en/practice/#pb-r6-010) and [PB-R6-011](/en/practice/#pb-r6-011). The static plan needs no GPU. An external implementation must retain every rank's ordinary baseline check, successful capture/instantiate, three completed replay checks against 6/10/14, cleanup outcomes and manifest. Optional registration comparisons require a separately admitted row and logs distinguishing requested from effective registration. Do not deliberately run broken collective schedules on shared hardware. All four page evidence arrays are empty; capture, registration and performance remain Pending Hardware Verification.

## Retrieval questions

1. Why does capture support not imply NVLS or CollNet support?
2. Which ranks must agree on capture, and which must replay?
3. Why does a new host pointer variable not update a captured buffer address?
4. What permits input overwrite, and what permits allocation release?
5. Why are local handles and graph-managed registration released differently?
6. Why can same-stream ordinary enqueue still violate disabled mixing?
7. What must happen after capture invalidation before discarding its result?
8. What distinguishes unsupported NVLS hardware, resource-allocation failure and a measured registration benefit?

## Primary sources and rights

Reviewed **2026-09-20** using current Context7 discovery followed by exact owner documentation/source/tests. [SRC-CUDA-101](/en/sources-and-versions/#src-cuda-101) retains immutable file hashes, registration/mixing semantics, CUDA archive, release issues and the separate nccl-tests source-reading boundary. Owner tests were inspected, not run. Original prose/tables/oracles are CC BY 4.0; site tests are Apache-2.0. No owner code, diagram, log or performance result is reproduced.
