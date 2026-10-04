---
title: 'H06: A Portable Baseline with Specialized Paths'
description: Design explicit admission, independently correct fallback and bounded same-device comparison.
pairId: h06
counterpart: /architecture/portable-specialization/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, contract, detection, build, fallback, correctness, comparison, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H06
prerequisites: [H01, H02, H04, H05]
relatedUnits: [EX25, LAB19, LAB20, VIS15]
hardwareGate: none
estimatedMinutes: 45
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVCC archived target tables', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html', version: '13.3', platform: 'Toolkit 13.3.1 archive', accessDate: '2026-10-04' }
  - { title: 'PTX bulk copy and mbarrier', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'sm_90 and selected Blackwell targets', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h06 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,contract,detection,build,fallback,correctness,comparison,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H06 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H01,H02,H04,H05' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/portable-specialization/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

In 45 minutes, specify when a specialized kernel may launch, what the fallback computes, and what a fair comparison measures. Then build [EX25](/en/examples/feature-gated-copy/) and follow [LAB19](/en/labs/hopper-portable-comparison/) or [LAB20](/en/labs/blackwell-portable-comparison/) in a qualifying external environment.

## Prerequisites

Exact ordered edges: **[H01, H02, H04, H05]**. [H01](/en/architecture/turing-warp-safety/) provides explicit participation, [H02](/en/architecture/ampere-pipelines-tensor-cores/) separates pipeline and precision contracts, [H04](/en/architecture/hopper-clusters-tma/) establishes TMA completion, and [H05](/en/architecture/blackwell-families/) defines target scopes. [VIS15](/en/visuals/architecture-evolution/) remains a source-reviewed model.

## Start with observable behavior

EX25 copies int32 input to distinct output through a shared tile. Counts are **256, 4096 and 65536**, all divisible by 256. Every block has 128 threads and handles one 256-value tile. Inputs cover signed index-varying values, zeros and alternating ±100000. Four guard elements at each end must remain unchanged. The portable path uses ordinary loads/stores and a block barrier; the specialized path uses a 1024 B bulk global-to-shared copy, one transaction barrier and block publication. Both then use the same neighbor-permuted output ownership, producing identical values.

This is a **single-stage load/consume pipeline**, not a claim of overlapped computation. It has no tails, tensor map, cluster, TMA store or Tensor Core precision change. Input/output plus guards total at most **524352 B**, with 1024 B shared per block and an additional 8 B barrier for specialization. Four int32 guards offset the payload by 16 B, preserving alignment from `cudaMalloc`.

## Capability detection and admission

Check device enumeration and selection, then query `cudaGetDeviceProperties`: use numeric major/minor CC, not the product name. Record actual driver/runtime versions and total/free memory. EX25 selects visible device 0, requires CC 7.5+, 8 GB total and 512 MiB free, and intersects the observed CC with the **compiled target's explicit reviewed set**. Unknown future CC values fail specialization admission even if their number is larger.

For this fixed 128-thread, ~1 KiB shared-memory kernel, the reviewed architectures provide the required resources. Any extension to larger tiles, dynamic memory or clusters must add actual kernel/device resource and cluster admission queries. Compile-time `__CUDA_ARCH__` identifies a device compilation pass, not the runtime GPU or the host's chosen path. A compiled suffixed image cannot be made compatible by an optimistic host branch.

## Keep separate build images

EX25 uses separate translation units so the ordinary baseline never compiles the bulk-copy PTX for `compute_75`. The specialized unit uses exactly `compute_90/sm_90` for Hopper or the selected Blackwell `f` pair; the portable unit includes ordinary 75 PTX/cubin plus the selected family's numeric baseline cubin. Ordinary PTX retains a fallback where the driver supports its PTX version. No `a` image is used because this protocol needs no architecture-exclusive instruction.

The full build profile is **Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / Ubuntu 24.04 x86-64**. Runtime Labs select driver **610.43.02**, recording any admitted substitution separately. The earlier 11.8.0 and 12.9.2 lanes only build the `portable` project profile. Separate target directories, compiler outputs and artifact listings prevent an old specialization object from masquerading as the new target. Compiler support, image compatibility and runtime correctness are separate checks.

## Select fallback before launch

| Requested mode | Admitted specialization | Result |
| --- | --- | --- |
| `portable` | Either | Run and validate portable only |
| `auto` | Yes | Validate portable, then specialized |
| `auto` | No | Run portable and print the selected path |
| `specialized` | No | Fail before kernel launch; never label a baseline as specialized |

Invalid modes fail. A CUDA allocation, launch, completion or cleanup error fails the process; it is not caught and retried under a different name. A failed asynchronous kernel may poison the context. A fallback must preserve inputs, outputs, ownership, synchronization, error handling and accepted numerical semantics. Lower precision is not an automatic fallback for an unsupported datatype.

## Correctness equivalence and lifetime

The host oracle regenerates expected values from the input rule; neither path is the other's oracle. Check every payload element and both guards after stream completion, including another check after timing. Host tests corrupt every output/guard position and reject cross-family requests; passing them is not GPU correctness.

The bulk path initializes one aligned 64-bit `mbarrier` with one arrival, publishes initialization to the async proxy, accounts **1024 expected bytes once**, issues one bulk copy, and waits on phase zero. This barrier has **one issuer/arriver**, unlike H04's 256-arrival conceptual ledger. A block barrier then publishes completion to all 128 consumers. A final block barrier finishes their reads before invalidating the transaction barrier and ending storage lifetime. There is one phase and no tile reuse loop; adding stages requires a fresh phase/reuse proof.

Run memcheck, racecheck and synccheck on each admitted path under an external timeout. A clean report supports the reasoning but cannot establish equivalence for arbitrary workloads. Preserve nonzero exits and all missing-tool/device cases.

## Bounded comparison

EX25 takes five warmups, then ten samples of **100 launches**, using CUDA events in the same nonblocking stream. It reports raw batch milliseconds separately for each path and count. Host/device transfers and initialization are outside the event interval; launch feed gaps can be included. Divide by 100 only when reporting the corresponding per-launch average. Never compare a specialized single stage with only part of the complete baseline.

Keep GPU, input, clocks, power, compiler and launch shape fixed. Record sequential path order and warm-cache effects; repeat with portable-only and specialized runs in alternating process order to expose order bias. Compare distributions, including a slower specialization; do not discard inconvenient samples. Use a separate **Nsight Compute 2026.2.1.5** pass with administrator-approved counters, exact metric availability, replay/cache settings and retained report. Permission denial blocks counters, not ordinary correctness/event timing. Results apply only to this workload/device; no universal architecture ranking follows.

## Evidence boundary

All four Learning Unit evidence arrays are empty. EX25 has independent compilation and runtime fields; a successful target build says nothing about another target. LAB19, LAB20, architecture behavior and performance remain **Pending Hardware Verification** until qualifying Reference Environment runs meet the criteria with complete Environment Manifests. Expected output is not a recorded result. Native Linux is the sole Supported Environment; no CUDA runs in the website.

## Retrieval check

1. Why does `major >= 10` fail as a family-target dispatch rule?
2. Why does the baseline live in a different device translation unit?
3. Which mode must reject an unsupported specialization without relabeling a fallback?
4. What differs between one-arrival and 256-arrival barrier protocols?
5. Which costs are excluded from EX25's event interval?

## Exercises and Labs

Attempt [H06 Exercises](/en/architecture/portable-specialization/exercises/), consult [separate solutions](/en/architecture/portable-specialization/solutions/) and [PB-R7-006](/en/practice/#pb-r7-006), then build [EX25](/en/examples/feature-gated-copy/). [LAB19](/en/labs/hopper-portable-comparison/) selects CC 9.0; [LAB20](/en/labs/blackwell-portable-comparison/) selects one exact Blackwell family contract.

## Sources and licensing

Reviewed **2026-10-04** through Context7 and the [13.3.1 NVCC archive](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html), [PTX bulk-copy/mbarrier specification](https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html#data-movement-and-conversion-instructions-cp-async-bulk), and [current capability scopes](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html). See [SRC-CUDA-108](/en/sources-and-versions/#src-cuda-108). Prose/ledgers: original CC BY 4.0; EX25: original Apache-2.0. Owner documents retain their notices; no owner sample or figure is copied.
