---
title: 'LAB20: Compare Portable and Exact Blackwell-family Paths'
description: Admit one reviewed family target and compare complete copy paths without extrapolating between families.
pairId: lab20
counterpart: /labs/blackwell-portable-comparison/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [goal, environment, manifest, procedure, observations, results, sources]
resourceKind: lab
unitId: LAB20
prerequisites: [H05, H06]
relatedUnits: [EX25]
exampleIds: [EX25]
hardwareGate: 'Native Linux; one exact CC 10.0, 10.3, 11.0, 12.0 or 12.1 GPU; 8 GB total and 512 MiB free; Toolkit 13.3.1'
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '10.0'
maximumProblemMemoryBytes: 524352
gpuCount: 1
estimatedMinutes: 90
difficulty: advanced
permissions: ['Build EX25 and access the selected GPU', 'Write environment and result logs', 'Administrator-approved counters for optional profiling']
evidence:
  compilation: []
  runtime: [Pending Hardware Verification]
  expectedObservations: ['Both admitted paths should reproduce every input and preserve guards; relative timing is not predicted.']
  recordedObservations: []
sources:
  - { title: 'Blackwell target scopes', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Exact family admission', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab20 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,environment,manifest,procedure,observations,results,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB20 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H05,H06' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/labs/blackwell-portable-comparison/" lang="zh-CN">阅读中文对应页</a>

## Goal and prerequisites

Exact prerequisites **[H05, H06]**: [H05](/en/architecture/blackwell-families/) for target sets and [H06](/en/architecture/portable-specialization/) for equivalent fallback. Build [EX25](/en/examples/feature-gated-copy/) and compare its ordinary and bulk-copy load/consume paths on one device. Allow 60–90 minutes after setup. This common bulk-copy operation is family-targeted, not a demonstration of family-exclusive arithmetic or Tensor Core acceleration.

## Exact environment and workload

Native Linux only: **Ubuntu 24.04 x86-64 / Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / driver 610.43.02**. One device, **8 GB total / 512 MiB free**, with exact CC from the admission table. Use Toolkit-bundled Compute Sanitizer and record its version; optional profiler is **Nsight Compute 2026.2.1.5**. Confirm actual coordinates; none is already a Reference Environment.

| TARGET | EX25 admitted CC | Specialized image | Ordinary extra cubin |
| --- | --- | --- | --- |
| 100f | 10.0, 10.3 | compute_100f / sm_100f + PTX | sm_100 |
| 103f | 10.3 | compute_103f / sm_103f + PTX | sm_103 |
| 110f | 11.0 | compute_110f / sm_110f + PTX | sm_110 |
| 120f | 12.0, 12.1 | compute_120f / sm_120f + PTX | sm_120 |
| 121f | 12.1 | compute_121f / sm_121f + PTX | sm_121 |

Every baseline also includes ordinary compute_75 PTX and sm_75. **10.7 is excluded by this project profile**, even though current documentation gives some family targets a broader set. A numeric minimum is not the admission rule. On CC 12.1 choose 120f or 121f explicitly and record which; do not compare one target's output as evidence for the other.

Workload: counts **256/4096/65536**, three int32 patterns, 256 values/tile, 128 threads/block, four guards at each end. Maximum input/output allocation **524352 B**, shared tile **1024 B**, specialized transaction barrier **8 B** plus alignment padding. Payload alignment is 16 B; no tails, tensor map, cluster, multicast or TMA store. No precision changes. Counter collection needs administrator-approved non-admin access and exact metric support; denial blocks that observation. Ordinary correctness/event timing needs no counter privilege.

## Environment Manifest and separate records

Fill observed values before executing; keep target identity in each record. Retain source commit, binary hash, full build commands and target listings with the following template:

```yaml
subject: LAB20
source_commit: null
target: null
gpu: {model: null, uuid: null, cc: null, count: 1, total_bytes: null, free_bytes: null}
environment: {os: null, kernel: null, driver: null, toolkit: null, nvcc: null, host_compiler: null, dialect: c++17, image_digest: null}
tools: {sanitizer: null, nsight_compute: null, counter_permission: null, metrics: null, replay_cache_policy: null}
conditions: {mig_mps: null, clocks_power: null, concurrent_work: null, path_order: null}
workload: {counts: [256, 4096, 65536], patterns: 3, threads: 128, tile_bytes: 1024, warmups: 5, samples: 10, launches_per_sample: 100}
portable: {correctness: null, guards: null, exit_status: null, batch_ms: [], reports: []}
specialized: {correctness: null, guards: null, exit_status: null, batch_ms: [], reports: []}
compilation: []
runtime: Pending Hardware Verification
recorded_observations: []
```

Record UTC date, display/concurrent work, clock/power/thermal policy, MIG/MPS, API errors, exit status, profiler filters, raw report location and hashes. Keep private identifiers with the custodian and sanitize public reports. An absent metric or device is an explicit gap, never an invented result.

## Procedure and acceptance

The commands below select **100f**, so run them only on an admitted 10.0/10.3 device. For another row, replace every target/path consistently and retain separate outputs.

```sh
bash scripts/compile-check.sh 100f
timeout 120s ./build/100f/ex25-copy portable
timeout 120s ./build/100f/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool memcheck ./build/100f/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool racecheck ./build/100f/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool synccheck ./build/100f/ex25-copy specialized
```

1. Pass host tests and inspect the actual suffixed PTX plus ordinary fallback. Successful compilation is specific to this target and source. A failed or unsupported build stops the Lab.
2. Require exact full-payload equality and unchanged guards for all three counts/patterns on both paths, with checked launch/completion/cleanup and successful exit. The specialized run also runs the baseline. Preserve errors/timeouts; never convert a failed launch into a baseline result labeled specialized.
3. Compare unprofiled event distributions: five warmups, ten samples of 100 complete kernels, excluding transfers/initialization. Keep the same GPU/configuration; record sequential path order and alternate process order in repeated runs. Retain all batch samples and median/range, including regressions.
4. Separately inspect instructions/resources with the selected profiler, authorized counters, exact metric filters and replay/cache settings. `ERR_NVGPUCTRPERM` or unavailable metrics leave counters unmeasured. Do not use profiler replay time as the event-time denominator.
5. Explain admission using the actual CC/target pair, and explain why results do not transfer to 11.0, 12.x or any other device. Extra devices are optional independent correctness records, not substitutes for same-device baseline comparison.

## Expected observations

Admitted paths should copy exactly and preserve all guards. A forced cross-family specialization should reject before launch; `auto` should select an ordinary path when compatible instead. Relative performance is unknown: a small single-stage copy may be slower with bulk setup/wait. The workload does not establish overlap, Tensor Core throughput, FP4 accuracy or interconnect performance.

## Recorded results and evidence

| Subject | Correctness / guards | Timing / profiler | Runtime |
| --- | --- | --- | --- |
| Portable on selected exact CC | Not recorded | Not recorded | Pending Hardware Verification |
| Selected family path on same CC | Not recorded | Not recorded | Pending Hardware Verification |

Compilation and recorded observations are empty. **LAB20 remains Pending Hardware Verification**. EX25 compilation is an independent target-specific axis. A qualifying Reference Environment and complete retained Environment Manifest/logs are needed for Runtime-Verified; no speed comparison has been observed.

## Sources and rights

Reviewed **2026-10-04**: [SRC-CUDA-107](/en/sources-and-versions/#src-cuda-107), [SRC-CUDA-108](/en/sources-and-versions/#src-cuda-108), [capability scopes](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html), [13.3.1 NVCC archive](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html) and [PTX archive](https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html). Original Lab/table/template: CC BY 4.0; EX25: Apache-2.0. Owner documents retain proprietary notices; no owner sample/table is copied or adapted.
