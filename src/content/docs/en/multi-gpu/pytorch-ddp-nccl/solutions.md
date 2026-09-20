---
title: 'G07 Solutions: Match Ownership, Arithmetic and Evidence'
description: Independent gradient derivations and bounded diagnostic decisions for the DDP Exercises.
pairId: g07-solutions
counterpart: /multi-gpu/pytorch-ddp-nccl/solutions/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, ownership, correctness, diagnosis, review]
resourceKind: solution-set
unitId: G07-SOLUTIONS
prerequisites: [G07-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Pinned DDP API', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py', version: '2.11.0+cu128', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g07-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/pytorch-ddp-nccl/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,ownership,correctness,diagnosis,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G07-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/pytorch-ddp-nccl/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite and evidence boundary

Attempt **[G07-EXERCISES]**: [the Exercises](/en/multi-gpu/pytorch-ddp-nccl/exercises/) first. Reviewed 2026-09-20; [SRC-CUDA-100](/en/sources-and-versions/#src-cuda-100). Answers below are static proofs. The [original Python reference](/assets/exercise-solutions/g07-ddp.py) executes only in G07's external environment and remains **Pending Hardware Verification**. Its CPU-only oracle test does not import torch or establish distributed execution.

## Solution 1: connect the actual owner and consumer

For the shared visible list, worker 0 uses visible ordinal 0→physical 2; worker 1 uses ordinal 1→physical 5. Set the local device before allocation, initialize the default NCCL group with the same indexed device, place model/input there and wrap with a one-element `device_ids`. Log global/local rank and reconcile physical identities privately. Passing global rank works coincidentally on this single node, but does not define a general local device mapping.

The producer P writes payload. C waits for P before submitting the asynchronous collective; ProcessGroupNCCL connects C to its NCCL stream. Inside Q, call `work.wait()` before consuming. Retain payload, work and result until Q completion; the reference also records Q's payload use. Only after successful `consumer.synchronize()` can the host compare and release. P is the payload allocation origin; C and Q are uses, not new origins. Allocator safety supplied by the backend covers backend work, not arbitrary conflicting application writes.

**Valid alternative:** a correctly placed host completion wait before submission or consumption can establish a stronger dependency, with more serialization. Retaining all references through completion can replace explicit lifetime registration for this finite use graph. Neither alternative permits overwriting a still-used tensor. **Common errors:** physical ordinals passed through a remapped visible list, `wait()` on C followed by an unrelated Q read, and `record_stream` used without a producer dependency.

## Solution 2: derive rather than copy output

Let `a=mean_r((r+1)^2)=(R+1)*(2*R+1)/6`. The gradient is `g=w*a`, and one SGD update is `w_next=w*(1-a/8)`. In accumulation, `a=mean_r(((r+1)^2+(r+2)^2)/2)`. Dividing both microbatch losses by 2 and averaging ranks implements this formula. Two optimizer steps or an extra gradient all-reduce would implement a different update.

| Mode at R=2 | Step | Expected gradient | Expected updated weight |
| --- | --- | --- | --- |
| baseline | 0 | 2.5 | 0.6875 |
| baseline | 1 | 1.71875 | 0.47265625 |
| accumulate | 0 | 4.5 | 0.4375 |
| accumulate | 1 | 1.96875 | 0.19140625 |

These are algebraic values, not logs. For R=3 baseline, `a=14/3`, first weight `5/12`, second gradient `35/18`, second weight `25/144`; this non-binary case motivates tolerances. For the independent collective, ranks contribute `r+1`, so the sum is `R*(R+1)/2`, and multiplying by 2 on Q yields `R*(R+1)` exactly for these small FP64 integers. It is not an extra reduction of DDP gradients.

In the [reference implementation](/assets/exercise-solutions/g07-ddp.py), every healthy worker validates torch/source/NCCL/device/allocator gates, uses a 60-second process-group timeout, initializes DDP, checks two completed updates, checks the scalar stream chain, destroys the process group, and only then emits `destroyed`. The launcher retains rank stdout/stderr and exits nonzero on failure. Exceptions propagate without an error-path barrier. A missing worker, result or zero exit fails completeness even if the remaining values pass.

**Valid alternative:** independently calculate the coefficient with rational arithmetic, then widen to FP64 for comparison. A different model is useful further practice but does not satisfy this fixed workload's oracle. **Common errors:** forgetting the microbatch divisor, placing only backward inside `no_sync`, clearing gradients between microbatches, accepting identical but wrong replicas, or substituting an unbounded launch for G07's command. Complete the Environment Manifest and library/topology review before either mode. No loss-curve, throughput or scaling result follows from this reference.

## Solution 3: preserve uncertainty and the first failure

| Case | Supported classification | First action and limit |
| --- | --- | --- |
| D0 | duplicate-device | repair exclusive device mapping before running; does not predict an exact NCCL error |
| D1 | earlier-rank-failure | inspect rank-1 input exception; rank-0 waiting is downstream, not proof of a bad link |
| D2 | sequence-mismatch | align step/synchronization counts; the listed reduction sequence is unmatched |
| D3 | insufficient-evidence | request missing rank-1 records and launcher status; no transport diagnosis follows |

The [fixture](/assets/ddp-fixtures/g07-diagnosis.json) has `captured=false` and no recorded observations. Matching the listed sequence would still not prove a real run correct: tensor counts/types, stream dependencies, arithmetic, permissions and termination need evidence. D1 without its earlier exception would support a sequence mismatch but not that specific root cause. This counterfactual prevents treating every timeout as the same diagnosis.

Use the 60-second group timeout for process-group operations; the 90-second heartbeat threshold monitors a stuck watchdog; the 180-second external supervisor also covers hangs outside those mechanisms, with a further 10-second KILL grace. These values are policy bounds, not measured failure latencies. Preserve the earliest exception, peer logs and final status; a requested flight-recorder dump might be absent. Stop the job after asynchronous failure. Successful-path `destroy_process_group()` in all ranks is different from assuming Python `finally` always runs after a watchdog termination.

Keep private raw files and their hashes. Share a separately reviewed derivative that replaces hostnames, IPs, paths, UUIDs and bus IDs consistently, removes credentials, and retains rank/sequence/error relationships. Keep the replacement map private. **Valid alternative:** submit a manifest with explicit missing permissions/hardware and empty observations rather than a fabricated success. **Common errors:** calling a barrier after a peer failed, retrying silently with changed environment settings, treating INFO output as correctness, or claiming D3 proves a topology fault.

## Return and transfer

Return to [G07](/en/multi-gpu/pytorch-ddp-nccl/), [PB-R6-008](/en/practice/#pb-r6-008) and [PB-R6-009](/en/practice/#pb-r6-009). The [pinned DDP API](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py) and source record ground the contracts. Original answers and worksheet, CC BY 4.0; original Python solution, Apache-2.0; no imported owner implementation or captured log.
