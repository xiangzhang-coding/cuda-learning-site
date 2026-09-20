---
title: 'G07: Read PyTorch DDP as an NCCL Client'
description: Trace one-process-per-GPU ownership through gradient reduction, stream dependencies, allocator lifetimes and bounded diagnosis.
pairId: g07
counterpart: /multi-gpu/pytorch-ddp-nccl/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, ownership, initialization, gradients, streams, environment, scenarios, diagnosis, teardown, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G07
prerequisites: [P04, P05, G04]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 100
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'PyTorch DDP implementation and API', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py', version: '2.11.0+cu128', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'ProcessGroupNCCL implementation', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp', version: '2.11.0', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'NCCL archived stream semantics', url: 'https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2289/user-guide/docs/usage/streams.html', version: '2.28.9', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g07 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/pytorch-ddp-nccl/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,ownership,initialization,gradients,streams,environment,scenarios,diagnosis,teardown,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G07 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P04,P05,G04' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/pytorch-ddp-nccl/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Explain how a local loss becomes a shared gradient without treating a Python return as GPU completion. Audit rank/device ownership, DDP's collective sequence, custom-stream edges and failure evidence. Allow 100 minutes plus external practice. Reading and the synthetic worksheet need no GPU; **all GPU scenarios below remain Pending Hardware Verification**. No recorded log, synchronization result, scaling result or performance number is available.

## Exact prerequisites

**[P04, P05, G04]**: [queued work and timing](/en/frameworks/queued-work-timing/), [streams and storage lifetime](/en/frameworks/streams-and-storage-lifetime/), and [NCCL communicators and collectives](/en/multi-gpu/nccl-communicators-collectives/). Recall host return versus completion, readiness versus lifetime, and matching participation. The direct prerequisite set does not include another distributed framework or multi-node networking.

## Why a framework still needs a communication contract

Data parallelism replicates a model and assigns different samples to each replica. Independent optimizers would diverge, so replicas exchange gradients before equivalent local updates. DDP combines autograd hooks and bucketed reductions with c10d process groups; the NCCL backend implements GPU communication. The older DDP design note explicitly describes v1.4: it motivates buckets but is not authority for the selected version's stream or allocator implementation. Buckets provide an opportunity for overlap; neither buckets nor more GPUs establish a speedup.

## One process owns one visible device

Use one native Linux node with R distinct full GPUs and R worker processes. `torchrun --standalone --nnodes=1 --nproc-per-node=2 --max-restarts=0` starts two workers and supplies `RANK`, `LOCAL_RANK`, `WORLD_SIZE`, `LOCAL_WORLD_SIZE`, `MASTER_ADDR` and `MASTER_PORT`. Global rank identifies group membership; local rank selects a visible ordinal. With a shared `CUDA_VISIBLE_DEVICES=2,5`, local ranks 0 and 1 mean the first and second visible devices, not physical devices 0 and 1. That mapping is illustrative, not an inventory.

| Worker | Visible ordinal | Private physical mapping | Required ownership |
| --- | --- | --- | --- |
| `RANK=0, LOCAL_RANK=0` | `cuda:0` | first selected GPU | exclusive within this job |
| `RANK=1, LOCAL_RANK=1` | `cuda:1` | second selected GPU | different full GPU |

Set `torch.cuda.set_device(local_rank)` before CUDA allocations and initialization; pass the same device to the model, inputs and process group. Construct `DDP(model, device_ids=[local_rank], output_device=local_rank)`. NCCL processes must not share the same GPU: a duplicate can deadlock or report invalid usage. Two ranks on one GPU do not meet the scenario. CPU process identity, global rank, visible ordinal and physical identity are four different fields.

## Rendezvous, group and communicator

`init_process_group("nccl", init_method="env://", device_id=device, timeout=timedelta(seconds=60))` uses launcher-provided rendezvous information. The store exchanges setup information; it is not the gradient data path. With this pinned backend, specifying `device_id` forms the NCCL communicator eagerly, surfacing initialization failures earlier than lazy first use. ProcessGroupNCCL owns communicator handles and communication resources; application code does not manufacture a second raw NCCL communicator for DDP's gradients.

All ranks construct the same model with the same parameter registration order, shapes and strides before DDP. Default `init_sync=True` checks shapes and broadcasts parameters/buffers. The reference has no buffers and explicitly sets `broadcast_buffers=False`. DDP construction, forward and backward have synchronization obligations; a rank-conditional early return can strand peers. Additional groups would need consistent creation and collective order, but this scenario uses only the default group.

## What gradient synchronization means

Autograd hooks mark gradients ready; the reducer schedules matching bucket reductions in consistent order and makes reduced gradients usable before the optimizer's dependent CUDA work. In the selected ordinary DDP path, each rank receives the **mean across ranks** of its local gradients. DDP does not shard input data or average your logged losses. Use a DistributedSampler and `set_epoch` for a shuffled real dataset, while keeping equal step counts; the reference instead supplies rank-specific scalar inputs directly.

For equal per-rank sample counts and local mean losses, the rank mean equals the global sample mean. For unequal counts it generally does not: weight local losses by `R*n_r/sum(n_r)` if a matching-step global sample mean is intended. Uneven iteration counts are a separate participation problem; padding or an explicitly designed join protocol needs its own analysis. We do not silently enable `join`, custom communication hooks, unused parameters, AMP or compilation here.

Original algebraic oracle: one FP64 weight `w=1`, prediction `w*x`, target zero, local loss `(w*x)^2/2`, one sample `x=r+1`, SGD `lr=1/8`, two steps, no momentum. For R=2 the expected gradients/updated weights are `(2.5,0.6875)` then `(1.71875,0.47265625)`. These are derived values, **not output from a run**. Identical weights across ranks alone are insufficient: every rank must also agree with the independent formula.

For two-microbatch accumulation, use `x=r+1` and `x=r+2`, divide each microbatch loss by 2, and put **both forward and backward** of the first microbatch inside `ddp.no_sync()`. The second forward/backward outside the context synchronizes the accumulated gradients; step once, then clear gradients before the next pair. For R=2, expected pairs are `(4.5,0.4375)` and `(1.96875,0.19140625)`. Never manually all-reduce DDP gradients again. Every rank must agree on the synchronization schedule.

## Streams: readiness and lifetime are separate

The pinned ProcessGroupNCCL asynchronous path records a dependency from the current caller stream to its internal NCCL stream. `Work.wait()` establishes a completion dependency on the stream current when it is called; under the selected nonblocking-wait policy this is not a universal CPU/device completion barrier. The same source uses the current stream for the synchronous collective path and stashes tensors for asynchronous allocator safety. Do not generalize the older “every collective always calls recordStream on a separate stream” description to this build.

The reference's separate scalar `all_reduce(..., async_op=True)` teaches these edges without modifying DDP gradients:

| Stage | Required edge or lifetime |
| --- | --- |
| allocate/write payload on producer P | P waits for earlier origin work before allocation/reuse |
| call all-reduce on current origin C | C waits for P; the backend sees C, not an unrelated producer |
| consume on custom stream Q | call `work.wait()` inside Q before reading output |
| allocator safety | retain payload/work/result through Q completion; `payload.record_stream(Q)` records Q use, not readiness |
| host comparison and teardown | `Q.synchronize()` succeeds before comparison, reuse or release |

Holding a tensor reference protects allocation lifetime but does not prevent explicit overwrite. `record_stream` cannot repair a missing producer wait. DDP's internal bucket handling does not order arbitrary user streams. If backward and the optimizer use different streams, establish their dependency and storage lifetimes as in P05. The reference keeps training on one current stream and uses explicit completion before host validation; it is a correctness exercise, not an overlap benchmark.

## External environment and permissions

Select native Ubuntu 24.04 x86-64, CPython **3.12.14**, torch **2.11.0+cu128**, packaged runtime/CUPTI **12.8.90**, CUDA metapackage **12.8.1**, cuDNN **9.19.0.56**, and packaged **nvidia-nccl-cu12 2.28.9**. Reuse the exact artifact lock and CPU-only environment gate at [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080); inspect [the installation/check commands](https://github.com/xiangzhang-coding/cuda-learning-site/blob/main/scripts/pytorch-environment/README.md). No system Toolkit or nvcc is needed. This NCCL is independent of EX24's 2.31.2 / Toolkit 13.3.1 path. Use a driver compatible with the selected GPUs and CUDA 12.8; the scenario sets a conservative floor **570.26**, rejecting compatibility-shim substitutions. Record the actual driver, not only that floor.

Require two distinct full GPUs, each CC≥7.5, ≥8 GB total and ≥1 GiB free. Optional R=3–8 requires that many qualifying devices. Scalar tensors are tiny; CUDA contexts, DDP buckets and NCCL allocations are additional and must fit. Bare native Linux is this profile; MIG, VMs, containers and multi-node jobs need a separate profile. Permission is needed to access the selected GPUs, read authorized topology and `/sys`, open local rendezvous sockets, allocate host/shared memory and write private logs. An operator must confirm suitable PCIe peer paths and IOMMU/ACS policy; do not change machine security settings as a debugging shortcut.

Retain an [Environment Manifest](/en/start/environment-manifest/) with source commit/hash; exact OS/kernel/glibc/Python/venv and all wheel URLs/hashes; driver, torch git/build identity and **loaded** CUDA/NCCL library paths/hashes; `torch.cuda.nccl.version()`; rank→PID→visible ordinal→private physical mapping; GPU count/CC/total/free memory; authorized `nvidia-smi -L`, `nvidia-smi topo -m` and legend; permissions and denied queries; NCCL config files/plugins; all relevant environment variables; process/stream graph; model, FP64 inputs/loss/optimizer/steps/tolerances; commands, per-rank logs, exit statuses and expected/recorded fields. Compare loaded libraries with the locked artifacts. Empty or unknown fields are blockers, not defaults.

## Run two bounded correctness scenarios

First complete the [implementation Exercise](/en/multi-gpu/pytorch-ddp-nccl/exercises/), then compare the [reference solution](/assets/exercise-solutions/g07-ddp.py). Download it into a fresh private working directory, record its SHA-256 and source commit, and use the checked environment's Python on PATH. The following assumes exactly two authorized devices are visible; repeat with `--mode accumulate` in a **fresh** private run directory:

```sh
timeout --signal=TERM --kill-after=10s 180s env \
  PYTORCH_ALLOC_CONF=backend:native NCCL_DEBUG=INFO \
  TORCH_DISTRIBUTED_DEBUG=OFF TORCH_NCCL_BLOCKING_WAIT=0 \
  TORCH_NCCL_ASYNC_ERROR_HANDLING=3 TORCH_NCCL_ENABLE_MONITORING=1 \
  TORCH_NCCL_HEARTBEAT_TIMEOUT_SEC=90 TORCH_NCCL_TRACE_BUFFER_SIZE=2000 \
  TORCH_NCCL_DUMP_ON_TIMEOUT=1 TORCH_NCCL_DEBUG_INFO_TEMP_FILE="$PWD/nccl-dump-" \
  python -m torch.distributed.run --standalone --nnodes=1 \
  --nproc-per-node=2 --max-restarts=0 --log-dir "$PWD/rank-logs" --redirects 3 \
  g07-ddp.py --mode baseline > launcher.log 2>&1
status=$?
```

Retain `status` immediately with the command. Do not pipe through a command that masks it. `python -m torch.distributed.run` is the checked interpreter's torchrun entry point. Clear conflicting legacy aliases, library search paths and unreviewed NCCL tuning overrides before launch; preserve an allowlisted configuration record. Do not dump the whole shell environment because it can contain credentials.

For **each rank in each mode**, require ownership/initialized records, exactly two `checked-step` records with matching step indices, one `checked-stream` result equal to `R*(R+1)`, a `destroyed` record, and launcher exit zero. FP64 gradient/weight acceptance uses `atol=rtol=1e-12` with finite results; the small integer scalar collective uses exact equality. Missing rows, unexpected versions, timeout or nonzero exit fail acceptance. The final line on rank 0 alone is insufficient. The manifest's recorded observations remain empty here; neither scenario has been run in a Reference Environment.

## Diagnose the first failure within a bound

The 60-second process-group timeout, 90-second watchdog heartbeat threshold and 180-second external deadline cover different failure paths. They do not guarantee a particular error string or an exact termination instant; the external supervisor allows 10 seconds before KILL. NCCL asynchronous failures can leave incomplete data, so stop the job and restart only after diagnosis. Never continue training in a catch block or insert a barrier to “heal” missing ranks.

| Setting | Selected meaning and limit |
| --- | --- |
| `NCCL_DEBUG=INFO` | library setup/transport diagnostics; not proof of gradient correctness |
| `TORCH_NCCL_ASYNC_ERROR_HANDLING=3` | tear down the process without communicator abort on watchdog error; explicit pinned default |
| `TORCH_NCCL_BLOCKING_WAIT=0` | keep asynchronous waiting policy; setting 1 changes host waits/watchdog behavior |
| `TORCH_NCCL_TRACE_BUFFER_SIZE=2000`, `TORCH_NCCL_DUMP_ON_TIMEOUT=1` | bounded flight-recorder events and requested dump; artifact availability is not guaranteed |
| `TORCH_NCCL_ENABLE_MONITORING=1`, `TORCH_NCCL_HEARTBEAT_TIMEOUT_SEC=90` | monitor a stalled watchdog; distinct from collective timeout |
| `TORCH_DISTRIBUTED_DEBUG=DETAIL` | optional separate diagnostic rerun with additional consistency checks/overhead; not the OFF baseline |

The [original synthetic fixture](/assets/ddp-fixtures/g07-diagnosis.json) contains logical records, **not PyTorch/NCCL logs**. D0 assigns both ranks to device-A; D1 records a rank-1 input exception before the peer's incomplete reduction; D2 has different collective counts; D3 lacks rank-1 evidence. Compare ownership first, then earliest local failures and sequence/shape/type contracts. A timeout on rank 0 need not identify the originating rank. Missing evidence is inconclusive, not proof of a transport failure.

For a real startup failure, first validate wheel/loaded-library identity, visibility, rank count and rendezvous. Then inspect the earliest rank error and authorized topology, shared-memory/NUMA availability and device permissions against the [NCCL 2.28.9 troubleshooting guide](https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2289/user-guide/docs/troubleshooting.html). Do not infer NVLink, selected algorithms or performance from GPU names. The single-node fixture requires no network-cluster diagnosis or deliberate broken-collective execution. Keep private raw logs; sanitize hostnames, IPs, paths, device UUIDs, bus IDs and credentials before sharing a derivative, retaining a private mapping.

## Teardown is part of correctness

On the healthy path, finish all outstanding work, validate every rank and call `destroy_process_group()` once in every worker before exit. Multiple groups would need consistent teardown order. Garbage collection is not a reliable cross-rank shutdown protocol. On a failed path the reference propagates the exception to the launcher, which terminates peer workers; backend failure handling and the external supervisor bound stuck work. It does not enter a new collective in `finally`, and a watchdog may terminate before Python cleanup runs. Preserve the first failure even if teardown also fails. A timeout is a failed run, not a successful cleanup record.

## Practice and evidence boundary

Complete the [ownership, correctness and failure Exercises](/en/multi-gpu/pytorch-ddp-nccl/exercises/) before the [separate solutions](/en/multi-gpu/pytorch-ddp-nccl/solutions/). Then solve [PB-R6-008](/en/practice/#pb-r6-008) and [PB-R6-009](/en/practice/#pb-r6-009). CPU algebra and synthetic-fixture checks establish no DDP/NCCL runtime evidence. G07's four evidence arrays are empty; its external scenarios remain **Pending Hardware Verification**. No scaling or speed acceptance threshold exists.

## Retrieval questions

1. Why is LOCAL_RANK not a physical device identifier?
2. What does `device_id` change about NCCL initialization in this build?
3. When does the mean of rank-local mean gradients equal the global sample mean?
4. Why must forward be inside `no_sync`, and why divide microbatch losses?
5. Which stream receives the dependency when `work.wait()` runs inside Q?
6. Why can `record_stream` protect reuse but not fix an early consumer?
7. Why is the first reported timeout insufficient to identify the failing rank?
8. Which per-rank records and completion checks are required before accepting a run?

## Primary sources and rights

Reviewed **2026-09-20** after current Context7 discovery. [SRC-CUDA-100](/en/sources-and-versions/#src-cuda-100) binds API, launcher, reducer, backend, owner tests and failure configuration to exact files. Primary anchors: [DDP API/source](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py), [ProcessGroupNCCL](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp), [archived NCCL stream semantics](https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2289/user-guide/docs/usage/streams.html). Owner tests were inspected, not executed. Prose, tables and synthetic worksheet are original CC BY 4.0; the original downloadable solution is Apache-2.0. No upstream code, log or diagram is reproduced.
