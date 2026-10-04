---
title: 'LAB19: Compare Portable and Hopper Pipelines'
description: Run the canonical one-stage tile pipelines with independent correctness and separate timing records.
pairId: lab19
counterpart: /labs/hopper-portable-comparison/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [goal, environment, manifest, procedure, observations, results, sources]
resourceKind: lab
unitId: LAB19
prerequisites: [H04, H06]
relatedUnits: [EX25]
exampleIds: [EX25]
hardwareGate: 'Native Linux; one CC 9.0 GPU; 8 GB total and 512 MiB free; Toolkit 13.3.1'
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '9.0'
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
  - { title: 'PTX bulk copy and mbarrier', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'CC 9.0; native Linux', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab19 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,environment,manifest,procedure,observations,results,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB19 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H04,H06' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/labs/hopper-portable-comparison/" lang="zh-CN">阅读中文对应页</a>

## Goal and prerequisites

Exact prerequisites **[H04, H06]**: [H04](/en/architecture/hopper-clusters-tma/) for completion, [H06](/en/architecture/portable-specialization/) for fallback and comparison. Use [EX25's canonical project](/en/examples/feature-gated-copy/); do not copy listings into a second implementation. Allow 60–90 minutes after environment setup. Compare ordinary shared staging with Hopper bulk-copy staging on the same GPU. Both are one-stage load/consume pipelines, with no overlap claim.

## Environment and workload gates

Native Linux is the sole Supported Environment. Select **one CC 9.0 GPU**, at least **8 GB total / 512 MiB free**. Select **Ubuntu 24.04 x86-64, Toolkit 13.3.1, NVCC 13.3.73, GCC 13.3.0, C++17, driver 610.43.02**, Toolkit-bundled Compute Sanitizer (record `--version`) and optional **Nsight Compute 2026.2.1.5**. Confirm actual versions before running. This is a proposed coordinate, not a declared Reference Environment. An optional second CC 7.5+ device may validate a portable-only build independently; do not use it for the same-device speed comparison.

Build `TARGET=90`: specialized `compute_90/sm_90` plus PTX, baseline `compute_75/sm_75` plus ordinary PTX and `compute_90/sm_90`. No `90a` is needed. Counts **256/4096/65536**, 256 int32/tile, 128 threads/block, three input patterns, four guards at each end. Two guarded arrays consume at most **524352 B**. Shared tile 1024 B, specialized barrier 8 B plus alignment padding; no cluster/tensor-map allocation. Input starts 16 B into its allocation. This fixture has no tails.

Correctness and event timing need no performance-counter privilege. Profiling requires administrator-approved non-admin counter access and available metrics; record `ERR_NVGPUCTRPERM` or unavailable metrics as blocked, never zero. Do not escalate privileges. Close or record concurrent workloads, display use, MIG/MPS and clock/power policy.

## Environment Manifest before execution

Create a separate record for each device/target/run. Fill every environment field from observation; do not populate recorded results in advance.

```yaml
subject: LAB19
source_commit: null
target: '90'
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

Also retain exact commands, binary hashes, target/PTX listings, API return/exit status, UTC date, profiler filters and report hashes. Private raw identifiers stay with the evidence custodian; sanitize any public report without losing run identity.

## Procedure and acceptance

From the downloaded EX25 directory, retain separate logs and exit statuses for each command:

```sh
bash scripts/compile-check.sh 90
timeout 120s ./build/90/ex25-copy portable
timeout 120s ./build/90/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool memcheck ./build/90/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool racecheck ./build/90/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool synccheck ./build/90/ex25-copy specialized
```

1. Confirm the compiled target and ordinary fallback images. Host tests must pass. Build success is not runtime success.
2. Portable and specialized runs must check all three counts and patterns, every output and guard, after checked completion. The specialized run also validates the baseline. A timeout, CUDA error, sanitizer finding or missing PASS blocks acceptance; retain it without retrying under a false path label.
3. Only after correctness, use unprofiled event samples: five warmups, ten batches of 100 complete kernels per count. Transfers/initialization are excluded. Record raw batches, median/range and path order. Repeat alternating process order; report order bias instead of selecting favorable samples.
4. In a separate authorized profiler pass, inspect ordinary shared staging versus bulk-copy instructions and resources, using available metrics and explicit replay/cache settings. Do not compare profiler-replayed duration to unprofiled event duration as if they were identical measurements.
5. Explain the one-arrival/1024-byte wait and block publication from H06. This Lab does not validate DSM, TMA stores or a multistage overlap pipeline.

## Expected observations

Both admitted paths should reproduce inputs exactly and preserve guards. The specialization should fail before launch on a device outside its admitted set when explicitly requested. For tiny tiles, issue/wait overhead may outweigh benefits; **no faster path is predicted**. Source/PTX inspection can explain an instruction path but not prove executed overlap or throughput. Correctness on another GPU is a separate record.

## Recorded results and evidence

| Subject | Correctness / guards | Timing / profiler | Runtime |
| --- | --- | --- | --- |
| Portable on selected CC 9.0 | Not recorded | Not recorded | Pending Hardware Verification |
| Specialized on selected CC 9.0 | Not recorded | Not recorded | Pending Hardware Verification |

Compilation and recorded observations are empty. LAB19 remains **Pending Hardware Verification**; EX25 evidence is independent and target-specific. A qualifying Reference Environment and complete retained manifest/logs are required before Runtime-Verified. Browser, host tests and expected tables supply no GPU evidence.

## Sources and rights

Reviewed **2026-10-04**: [SRC-CUDA-108](/en/sources-and-versions/#src-cuda-108), [PTX 9.3 bulk-copy specification](https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html), [Hopper tuning](https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html). Original Lab and record template: CC BY 4.0; canonical code: Apache-2.0. Owner documents retain their notices; no sample or figure is copied.
