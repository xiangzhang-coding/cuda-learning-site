---
title: 'G07 Exercises: Ownership, Gradients and First Failures'
description: Prove rank ownership and gradient scaling, then diagnose synthetic failures without inventing a run.
pairId: g07-exercises
counterpart: /multi-gpu/pytorch-ddp-nccl/exercises/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, ownership, correctness, diagnosis, review]
resourceKind: exercise-set
unitId: G07-EXERCISES
prerequisites: [G07]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Pinned DDP API', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py', version: '2.11.0+cu128', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g07-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/pytorch-ddp-nccl/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,ownership,correctness,diagnosis,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G07 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/pytorch-ddp-nccl/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite and submission

Exact prerequisite **[G07]**: [PyTorch DDP as an NCCL client](/en/multi-gpu/pytorch-ddp-nccl/). Reviewed 2026-09-20; [SRC-CUDA-100](/en/sources-and-versions/#src-cuda-100). Submit a rank table, independent algebra, implementation and diagnostic worksheet before opening the solutions. Static reasoning needs no GPU; external execution requires G07's native Linux, two-or-more-GPU environment, exact wheel closure and watchdog. Runtime remains **Pending Hardware Verification**.

## Exercise 1: prove ownership and stream dependencies

**Goal:** repair a two-worker setup that gives both workers `cuda:0`, and a consumer Q that reads an asynchronous all-reduce output before establishing a completion dependency.

**Constraints:** the shared visible list represents physical devices 2 and 5. Use one process per GPU, local-rank selection, one default NCCL process group and eager `device_id`. Payload is allocated/written on P, collective is called on C, and consumer runs on Q. Do not replace the proof with a sleep or reuse DDP's internal communicator directly.

**Expected evidence:** a rank→visible→physical table, ordered initialization/model placement, and P→C→NCCL→Q dependency ledger with an allocation-origin/lifetime column.

**Acceptance criteria:** both workers own different physical devices; all tensors/model/DDP identifiers agree locally. Show where C waits for P and where `work.wait()` runs under Q. Distinguish retained references or `record_stream(Q)` from data readiness, prevent explicit overwrites through last use, and require Q completion before host validation/release.

<details><summary>Hint 1: separate namespaces</summary>CUDA visibility renumbers devices. A local rank chooses an ordinal in the visible list, while global rank belongs to a process group.</details>
<details><summary>Hint 2: audit the caller stream</summary>The backend observes the stream current at collective submission. The wait must protect the actual consumer, and allocator tracking alone does not connect producer writes.</details>

## Exercise 2: implement two correct DDP updates

**Goal:** implement both G07 scalar training modes and the independent asynchronous scalar collective, checking every rank against a reference derived without DDP.

**Constraints:** R=2–8 on one node; FP64 one-weight linear model, no bias, `w=1`, target zero, loss `(w*x)^2/2`, SGD `lr=1/8`, two steps, no momentum/AMP/hooks/unused parameters. Baseline uses `x=r+1`; accumulation uses `x=r+1,r+2` and one optimizer step per pair. Use G07's 60-second group timeout and external launch bound. Keep all training work on one current stream.

**Expected evidence:** derive the R-dependent gradient coefficient; hand-calculate R=2 results for both modes; submit code and a manifest template with empty recorded observations. With qualifying hardware, retain complete per-rank stage logs, values, loaded-library identity, topology, completion/teardown and exit status in private storage.

**Acceptance criteria:** scale each accumulation loss correctly, place both first forward/backward inside `no_sync`, synchronize on the second, and clear gradients only at update boundaries. Check every gradient and updated weight with finite values and `atol=rtol=1e-12`; compare the independent scalar collective exactly. Reject a missing rank/step or failed exit even when surviving ranks agree. Do not reduce DDP gradients a second time or print expected values as observations.

<details><summary>Hint 1: differentiate locally</summary>The derivative of the local loss is w times the square of x. Apply the rank mean after differentiating, not after the optimizer update.</details>
<details><summary>Hint 2: preserve one effective batch</summary>Accumulation averages over two microbatches and R ranks. The second update starts with the previous updated weight and cleared gradients.</details>

## Exercise 3: diagnose without running a broken collective

**Goal:** classify D0–D3 in the [synthetic fixture](/assets/ddp-fixtures/g07-diagnosis.json), give the first useful check for each, and design a bounded evidence collection plan.

**Constraints:** these are invented logical records, not observed logs. D1 explicitly provides an earlier rank-1 exception. D3 has no rank-1 record. Do not manufacture timestamps, NCCL messages, transport selection or hardware results. Keep one node; do not deliberately execute mismatched collectives.

**Expected evidence:** four classifications with the supplied facts that justify them; missing-evidence requests; a 60/90/180-second timeout-policy explanation; a private-to-public log sanitization plan.

**Acceptance criteria:** distinguish duplicate ownership, an earlier local exception, unequal collective counts and insufficient evidence. Explain why a timeout is not a root cause; separate the group timeout, watchdog monitoring and external supervisor. Stop after asynchronous failure, avoid an error-path barrier, preserve the first exception and do not assume a requested dump exists. Remove identifying host/device/network/path information and credentials before sharing a derivative.

<details><summary>Hint 1: find the earliest supplied fact</summary>A rank that never reaches its next reduction can make healthy peers wait. The peer timeout is downstream evidence, not necessarily the originating error.</details>
<details><summary>Hint 2: absence is not a measurement</summary>A missing worker record does not prove that its GPU or network failed. Request that worker's first error, identity mapping and launcher exit information.</details>

## Review and transfer

Compare the [separate numbered solutions](/en/multi-gpu/pytorch-ddp-nccl/solutions/) and solve [PB-R6-008](/en/practice/#pb-r6-008)/[PB-R6-009](/en/practice/#pb-r6-009). Primary authority is the [pinned DDP API](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py). Original exercises, CC BY 4.0. No hardware execution is claimed.
