---
title: 'LAB18: Build and Inspect an NCCL Compute Pipeline'
description: Validate a chunked multi-GPU pipeline and distinguish observed overlap from an expected timeline.
pairId: lab18
counterpart: /labs/pipeline-nccl-computation/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [goal, prerequisites, environment, build, correctness, measurement, capture, interpretation, expected, recorded, sources]
resourceKind: lab
unitId: LAB18
prerequisites: [G05, Q05, Q07]
relatedUnits: [G06, EX24, VIS16, VIS14]
exampleIds: [EX24]
hardwareGate: 'Native Linux; 2-8 distinct full GPUs, each CC 7.5+, total memory >=8 GB and free memory >=256 MiB'
estimatedMinutes: 150
difficulty: advanced
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '7.5'
maximumProblemMemoryBytes: 8388608
gpuCount: 2
permissions: ['Access selected GPUs and authorized topology', 'Collect CUDA activity with Nsight Systems', 'Write private logs and profiler reports']
evidence:
  compilation: []
  runtime: [Pending Hardware Verification]
  expectedObservations: ['Every rank and iteration should match the integer oracle; overlap classification requires a qualified two-GPU capture.']
  recordedObservations: []
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'Nsight Systems User Guide', url: 'https://docs.nvidia.com/nsight-systems/UserGuide/index.html', version: '2026.5', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab18 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,prerequisites,environment,build,correctness,measurement,capture,interpretation,expected,recorded,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB18 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G05,Q05,Q07' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'G06,EX24,VIS16,VIS14' } }
  - { tag: meta, attrs: { name: 'cuda:example-ids', content: EX24 } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/labs/pipeline-nccl-computation/" lang="zh-CN">阅读中文对应页</a>

## Goal and deliverables

Use [G06](/en/multi-gpu/communication-computation-overlap/) to build serial and pipelined schedules of the same producer/all-reduce/consumer workload. Submit the dependency graph, source/binary identities, filled Environment Manifest, correctness logs, unprofiled sample table and a qualified timeline classification. A slower or serialized candidate is a valid result. Allow 150 minutes; execution is external.

## Exact prerequisites

**[G05, Q05, Q07]**: [NCCL stream dependencies](/en/multi-gpu/nccl-stream-dependencies/), [asynchronous timing](/en/correctness/timing-asynchronous-gpu-work/), [timeline-first analysis](/en/correctness/timeline-first-nsight-systems/). Complete the [G06 Exercises](/en/multi-gpu/communication-computation-overlap/exercises/). [EX24](/en/examples/nccl-all-reduce/) establishes NCCL package and rank correctness; its single-stream executable is not an overlap benchmark.

## Stage 1: record the environment

Use native Ubuntu 24.04 x86-64, Toolkit **13.3.1**, C++17, NCCL packages **2.31.2-1+cuda13.3**, driver **≥610.43.02**. Use two distinct full GPUs, each CC≥7.5, ≥8 GB total and ≥256 MiB free. R=3–8 is optional with the same per-GPU gates. No MIG, VM or multi-node substitution. The maximum caller device allocation is 8 MiB per GPU (two N-element int32 arrays); host validation uses 4 MiB once, while context/library/event overhead is additional. Reject more than 1024 chunks.

Use the NCCL package identities and authorized topology procedure from [LAB17](/en/labs/nccl-all-reduce/). Record `nvidia-smi --version`, `-L`, `topo -m`, `topo -mp`, their installed legends, errors, rank→visible ordinal→private physical identity, CC, memory, OS, driver, Toolkit, host compiler, `nvcc`, loaded NCCL paths/hashes, plugins and configuration. Preserve operator assessment of peer-path/ACS/IOMMU suitability; unknown or unsuitable platforms block execution. Do not change system policy.

The owner profiler guide reviewed here is **Nsight Systems 2026.5**. Record the exact `nsys --version` build and package, `nsys profile --help`, `nsys status --environment`, GPU/driver compatibility and CUDA tracing permissions. Use a compatible 2026.5 installation for this protocol; older bundled 2026.1 tooling needs a separate command review. Denied CUDA tracing blocks overlap classification. CPU sampling, context switches and performance counters are not requested. Do not use privilege escalation to bypass permission policy.

Copy the blank `environmentManifest` from the [teaching fixture](/assets/overlap-fixtures/lab18-timeline.json) into private storage and expand it using the [Environment Manifest](/en/start/environment-manifest/) contract. Add concurrent load, clocks/power/thermal state, source commit, compiler flags, binary SHA-256, all commands/statuses, workload, five warm-ups, sample policy, synchronization, raw reports, diagnostics and custody mapping. Blank public fields are not measured environment facts.

## Stage 2: implement and build

Implement the G06 dependency table first, then compare against the [separate solution](/en/multi-gpu/communication-computation-overlap/solutions/) and its [original downloadable source](/assets/exercise-solutions/g06-pipeline.cu). Save it as `g06-pipeline.cu` in a private native-Linux work directory. It is an exercise solution, independent of EX24's canonical executable and compilation evidence. Record its SHA-256 and source commit. Use the EX24-selected NCCL package installation; compile for the actual GPU's supported SM target (the example `75` is only for CC 7.5):

```sh
nvcc --version
g++ --version
nvcc -std=c++17 -O2 -lineinfo -arch=sm_75 g06-pipeline.cu -lnccl -o lab18
sha256sum g06-pipeline.cu lab18
ldd ./lab18
```

Retain compiler output/status and actual dynamic library hashes. Header and loaded API version checks supplement, not replace, package identity. No successful build record is bundled. The solution checks immediate CUDA/NCCL errors, closes groups before handling submission errors, polls every communicator for asynchronous errors, and has a 60-second device-completion deadline. The external watchdog also bounds blocking host calls and abort/cleanup.

## Stage 3: correctness before timing

Arguments are `MODE R N C SAMPLES TRACE`. For each mode (`serial`, `pipeline`), run `(N,C)=(1,1),(257,128),(1048576,65536)` with R=2, one sample and TRACE=0; for example:

```sh
timeout --signal=TERM --kill-after=5s 180s ./lab18 pipeline 2 257 128 1 0 > correctness.log 2>&1
status=$?
```

Use a unique log for every command and immediately retain its `status`. Require zero mismatches for **every rank, all five warm-ups and every sample**, the final cleanup PASS line, and exit status zero. Timeout, missing rows, version mismatch or denied access is failure/blockage, never a partial pass. Preserve the first failure and stop. A separate authorized Compute Sanitizer correctness run may supplement this gate; do not combine sanitizer timing with performance samples.

For zero-based iteration t and global index i, producer input is `3*(rank+1)+(i%17)-8+(t%3)`. All-reduce sums int32; consumer transforms each result as `2*x+1`. The independent CPU oracle is `2*(3*R*(R+1)/2+R*(i%17-8+t%3))+1`. At R=2, t=0, i=0 the literal answer is **-13**. All values fit int32 for R≤8. Global offsets and iteration variation expose tail and stale-result errors. Validate all elements, not just a checksum.

Draw p→ready→c→done→q for every chunk on every rank. All arrays have disjoint chunk slices; events are per chunk and re-recorded only after the preceding iteration drains and validates. Every A(k) group contains the matching call from each rank and only communication streams. `serial` drains q after every chunk; `pipeline` drains q after all chunks. Final q completion transitively completes producer and collective work. The download is after the timer.

## Stage 4: matched unprofiled measurements

Keep N=1048576 and R=2 fixed; compare C=16384, 65536 and 262144. For each C, run serial and pipeline with SAMPLES=20, TRACE=0. Alternate serial/pipeline process order over three repetitions (A/B, B/A, A/B); retain all 60 samples per configuration. Five complete, validated warm-ups occur inside every process before retained samples. Do not remove outliers silently.

The host steady-clock interval begins before first producer submission and ends after all ranks' final consumers complete. It includes launch/group/wait/poll and pipeline fill/drain, excluding initialization, allocation, validation copies, CPU checking and teardown. This is whole-workload completion latency, not kernel time. Do not subtract CUDA events across devices. Record polling cost and concurrent load. Report median, nearest-rank p95 (sorted sample 57 of 60), min/max and per-repetition medians. Application throughput is **N/completion-seconds**, not R×N or NCCL bus bandwidth. A comparison needs equal work, complete correctness and stable-enough distributions; it does not by itself establish overlap or a bottleneck.

## Stage 5: collect a bounded timeline

After correctness passes, collect serial and pipeline separately with SAMPLES=1 and TRACE=1, keeping R/N/C identical. The source calls `cudaProfilerStart` after five warm-ups, drains all GPUs before `cudaProfilerStop`, then validates. The captured sample's timing is instrumented and must not enter the unprofiled statistics.

```sh
timeout --signal=TERM --kill-after=5s 180s nsys profile --trace=cuda --sample=none --cpuctxsw=none --capture-range=cudaProfilerApi --capture-range-end=stop --output=lab18-pipeline ./lab18 pipeline 2 1048576 65536 1 1 > capture-pipeline.log 2>&1
status=$?
```

Repeat with `serial` and a distinct output/log name. Check installed help before use; retain command, status, application correctness, profiler diagnostics, `.nsys-rep` and report hash. Open with a compatible viewer and preserve an authorized sanitized derivative with device/stream labels, selected region and time unit. Stats totals cannot establish intersection. The minimal command traces CUDA; optional NCCL-specific tracing needs separate version/overhead review. NVTX, if added, labels host submission ranges rather than proving device execution. Event tracing can perturb dependencies; record its effective setting and collector mode, and inspect dropped/truncated activity warnings. Incomplete collection blocks classification.

## Stage 6: interpret and decide

Use [VIS16](/en/visuals/collective-paths/) for logical participation and [VIS14](/en/visuals/nsight-systems-versus-nsight-compute/) for the timeline-first decision. Reuse them; no new visual is needed. Identify `produce`, NCCL work and `consume` on each GPU, correlate API/launch/stream rows and chunk order, and confirm ready/done waits. Reject an ambiguous NCCL/chunk mapping. Use a shared report time axis, not separately subtracted device events.

For independent intervals on the **same GPU**, intersect `[start,end)`; a positive intersection supports local overlap for that region. A cross-GPU-only intersection does not. Inspect every rank, rank skew, hidden synchronization, launch gaps and complete pipeline fill/drain. Classify **observed overlap**, **observed serialization in this region**, or **inconclusive**. Missing activity is inconclusive. Even observed overlap does not establish throughput improvement; compare the matched unprofiled records separately. A bottleneck claim requires a controlled intervention and qualifying two-GPU profiler evidence, not just a long bar. Limit every conclusion to the recorded system/configuration.

## Expected observations

Every rank and iteration should match the integer oracle; overlap classification requires a qualified two-GPU capture. Serial control should respect all completion boundaries; pipeline dependencies permit but do not guarantee local overlap. The [fixture](/assets/overlap-fixtures/lab18-timeline.json) is synthetic, uses dimensionless ticks and has no raw report. Its cases are practice inputs, never execution observations.

## Recorded observations and publication gate

**No qualifying two-GPU execution or profiler capture is recorded.** Compilation and recorded-observation arrays remain empty; LAB18 is **Pending Hardware Verification**. No overlap, throughput, bottleneck or speedup conclusion is published. Future Runtime-Verified evidence requires a declared Reference Environment, complete manifest, reviewed correctness and raw reports; community observations remain separately labeled.

Keep original reports private: they may contain host/user names, paths, process arguments, environment variables, device identities and topology. Publish only reviewed, minimized derivatives with stable rank aliases; remove secrets and identifiers from labels/screenshots too. Retain private original hashes and source→derivative mapping. Sanitization must preserve the intervals, units and correlation required by the claim; if it cannot, withhold the conclusion. Do not attach private raw reports to an issue or the repository.

## Primary sources and rights

Reviewed **2026-09-20**, [SRC-CUDA-099](/en/sources-and-versions/#src-cuda-099). NCCL 2.31.2 stream/group behavior is pinned to commit `7b83616df3ae082a1f32bb74c27458bfe8153a13`; the profiler protocol follows the owner 2026.5 guide and installed-build gate. Protocol and fixture: original CC BY 4.0. Exercise solution: original Apache-2.0; no vendored NCCL or profiler source.
