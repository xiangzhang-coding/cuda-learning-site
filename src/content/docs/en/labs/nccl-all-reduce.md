---
title: 'LAB17: Run and Explain NCCL All-reduce'
description: Retain rank-level correctness and the environment needed to interpret it, without inventing hardware evidence.
pairId: lab17
counterpart: /labs/nccl-all-reduce/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [goal, prerequisites, environment, build, run, correctness, explanation, expected, recorded, sources]
resourceKind: lab
unitId: LAB17
prerequisites: [G04, G05]
relatedUnits: [EX24]
exampleIds: [EX24]
hardwareGate: 'Native Linux; at least two distinct full GPUs, each CC 7.5+, total memory >=8 GB and free memory >=256 MiB'
estimatedMinutes: 90
difficulty: advanced
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '7.5'
maximumProblemMemoryBytes: 8388608
gpuCount: 2
permissions: ['Read authorized topology and device inventory', 'Build EX24 and access selected GPUs', 'Write private environment, build and rank logs']
evidence:
  compilation: []
  runtime: [Pending Hardware Verification]
  expectedObservations: ['Every rank should have zero mismatches for all three counts after stream completion and successful cleanup.']
  recordedObservations: []
sources:
  - { title: 'NCCL selected source', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab17 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,prerequisites,environment,build,run,correctness,explanation,expected,recorded,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB17 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G04,G05' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX24 } }
  - { tag: meta, attrs: { name: 'cuda:example-ids', content: EX24 } }
  - { tag: meta, attrs: { name: 'cuda:estimated-minutes', content: '90' } }
  - { tag: meta, attrs: { name: 'cuda:difficulty', content: advanced } }
  - { tag: meta, attrs: { name: 'cuda:toolkit-lanes', content: cuda-13.3 } }
  - { tag: meta, attrs: { name: 'cuda:minimum-compute-capability', content: '7.5' } }
  - { tag: meta, attrs: { name: 'cuda:maximum-problem-memory-bytes', content: '8388608' } }
  - { tag: meta, attrs: { name: 'cuda:gpu-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/labs/nccl-all-reduce/" lang="zh-CN">阅读中文对应页</a>

## Goal and deliverables

Run the original [EX24](/en/examples/nccl-all-reduce/) externally, retain every rank's correctness result and explain the stream dependency chain. Submit a source/build identity, filled environment worksheet, private raw logs with exit statuses, rank/device table, workload table and a dependency explanation. Allow 90 minutes. The website never executes CUDA.

## Exact prerequisites

**[G04, G05]**: [communicators and collectives](/en/multi-gpu/nccl-communicators-collectives/) and [stream dependencies](/en/multi-gpu/nccl-stream-dependencies/). EX24 is the canonical executable, not another prerequisite unit. Complete both units' Exercises first.

## Stage 1: establish the environment

Use native Ubuntu 24.04 x86-64, C++17, Toolkit 13.3.1, NCCL packages `2.31.2-1+cuda13.3`, driver ≥610.43.02. Select two distinct full GPUs, each CC≥7.5, ≥8 GB total and ≥256 MiB free; record exact values, not just a product label. Maximum caller allocation is 8 MiB per GPU, with library/context overhead additional and 8 MiB host input/output per rank. Optional R=3–8 requires R qualifying GPUs. MIG, VMs and multi-node execution are outside this profile.

Copy the canonical project's blank `environment-manifest.json` into private working storage and fill the [Environment Manifest](/en/start/environment-manifest/):

| Field | Required record |
| --- | --- |
| Source/build | immutable source commit, build-contract hash, compiler, commands and statuses |
| Devices | count, per-device CC/total/free memory, rank→visible ordinal→private physical identity |
| Platform | OS/architecture, exact driver/Toolkit/NCCL packages, CUDA API codes, loaded library paths/hashes |
| Topology | authorized `nvidia-smi --version`, `-L`, `topo -m`, `topo -mp`, installed help/legend, permissions and errors |
| P2P platform | operator assessment of IOMMU/ACS and suitable peer paths; unknown is a blocker |
| Execution | one process, one submitting thread, one nonblocking CUDA stream per rank; default blocking NCCL communicators |
| Configuration | CUDA visibility, NCCL environment variables/config files/plugins; no custom tuning override in baseline |
| Workload/result | R, all counts, type, reduction, input formula, per-rank mismatch counts, completion/cleanup and exit status |

Follow [G03](/en/multi-gpu/topology-paths/) for private identity reconciliation. Do not run direct PCIe peer communication when platform suitability is unknown or incompatible; ask the operator rather than changing IOMMU/ACS policy. No hardware or denied permissions means stop and submit the blocker with unfilled observation fields. Do not replace two GPUs with two ranks on one GPU.

## Stage 2: build the same source

Acquire EX24's immutable source/download, verify its package hashes and follow its build commands. Retain `make host-test preprocess inspect` stage logs, `g++ --version`, package identities and linkage inspection. The Docker build is GPU-free; its CPU oracle and linking do not establish runtime evidence. The host oracle checks literal signed results and deliberate corruption before any GPU test.

## Stage 3: run with bounded failure handling

On the qualifying native host, from the EX24 directory:

```sh
timeout --signal=TERM --kill-after=5s 180s env NCCL_DEBUG=INFO ./build/ex24-nccl-all-reduce 2 > rank-run.log 2>&1
status=$?
```

Immediately retain `status` with the command and private raw log. The log interleaves library diagnostics with application lines carrying `rank=`; index those lines by rank and count without replacing the raw file. A timeout (typically 124), signal, missing GPU, package mismatch, CUDA/NCCL failure or nonzero mismatch is a failed/blocked run. Preserve the first failure and stop; do not reinterpret partial output as collective success. The external watchdog covers host calls that the internal 60-second completion poll cannot interrupt.

## Stage 4: verify all ranks

For each of counts 1, 257 and 1048576, require one result per rank, `ncclInt32`, `ncclSum` and zero mismatches. Recompute the CPU oracle `3*R*(R+1)/2+R*((i mod 17)-8)` independently and explain the rank-dependent input. Require the final successful-cleanup line **and exit status zero**. A missing rank/count row fails completeness even if another row passes. Keep hand-worked expected -7 (R=2/i=0) separate from actual logs. There is no bandwidth or latency acceptance threshold.

## Stage 5: explain the dependencies

Draw one lane per rank: upload → all-reduce → download → completion poll → CPU compare → grouped finalize → release. Mark group start/end on the host lane. Explain why the group is needed with one submitting thread, why success at group end means enqueue, and why all buffers remain alive until every rank completes. Add a paper-only two-stream ready/done event variant from G05; do not claim measured overlap. [VIS16](/en/visuals/collective-paths/) is a logical routing model, not the run's selected algorithm.

## Expected observations

Every rank should have zero mismatches for all three counts after stream completion and successful cleanup. Header/loaded version codes should match; the independently recorded packages and hashes establish finer identity. Explain all required ordering edges. These are acceptance criteria, not measured results.

## Recorded results and evidence

**No qualifying two-GPU run is recorded.** Rank logs, topology observations, algorithm selection, timing, bandwidth and collective outputs are unrecorded. Compilation is independently empty; EX24/LAB17 remain **Pending Hardware Verification**. The public worksheet's recorded arrays are empty. Future maintainer runtime verification requires a declared Reference Environment and reviewed raw records; a community report does not silently replace it. Review logs for machine identifiers before sharing a sanitized derivative, retaining the private source-to-derivative mapping.

## Sources and rights

Reviewed **2026-09-19**: [SRC-CUDA-097](/en/sources-and-versions/#src-cuda-097) and [SRC-CUDA-098](/en/sources-and-versions/#src-cuda-098). Original protocol and worksheets; no imported NCCL sample or fabricated run.
