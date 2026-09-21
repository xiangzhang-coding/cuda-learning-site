---
title: 'G09 Exercises: Select a Transport and Bound a Diagnosis'
description: Analyse identity-redacted synthetic records without claiming a cluster run.
pairId: g09-exercises
counterpart: /multi-gpu/multi-node-transport-failures/exercises/
factCheckDate: '2026-09-21'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, transport, diagnosis, review]
resourceKind: exercise-set
unitId: G09-EXERCISES
prerequisites: [G09]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL network and failure contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-21' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g09-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-21' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,transport,diagnosis,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G09 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/multi-node-transport-failures/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite **[G09]**: [transport and failure evidence](/en/multi-gpu/multi-node-transport-failures/). Reviewed 2026-09-21; [SRC-CUDA-102](/en/sources-and-versions/#src-cuda-102). Submit a selection ledger and a diagnosis/recovery ledger. No GPU or network access is needed. All fixtures are **synthetic**, original, identity-redacted teaching data, not captured NCCL output. Logical sequence numbers order events only within their node; they are not synchronized timestamps. Multi-node execution remains **Pending Hardware Verification**.

## Exercise 1: choose an admissible transport candidate

**Goal:** select a Socket comparison candidate and identify what an RDMA proposal still lacks. Use fictional fixture **F1**, with two nodes and one process/rank/full GPU per node, as in G09. The values below are paper premises, not verified routes.

<div data-diagnostic-fixture="F1" data-provenance="synthetic" data-evidence="none">

```text
fixture=F1 provenance=synthetic evidence=none
node=node-a process=process-a rank=0 local_rank=0 gpu_visible=0
node=node-b process=process-b rank=1 local_rank=0 gpu_visible=0
interface=mgmt0 state=UP peer_route=unknown
interface=data0 state=UP peer_route=declared-bidirectional-ipv4
interface=data1 state=UP peer_route=absent
hca=mlx5_0 port=1 link_layer=unknown provider=unknown
launcher=unselected selected_transport=unknown recorded_result=none
```

</div>

**Constraints:** native Linux, NCCL 2.31.2; names are hypothetical local labels on both nodes. Do not run commands, widen firewall rules, invent a launcher version or claim RDMA/GPUDirect from the HCA's presence. Preserve the distinction between a fixture premise and observed evidence.

**Acceptance:** specify exact interface matching and address family for the Socket candidate, explain why prefix `data` is unsuitable, and explain why `NCCL_IB_HCA` cannot choose an IP interface. List at least four missing RDMA facts and launch/permission requirements. State which per-rank messages and completed correctness checks would be needed to establish actual transport and success. Include filename/content redaction and leave recorded observations empty. A correct paper solution does not admit a runnable scenario.

<details><summary>Hint 1</summary>One prefix matches both data interfaces. UP is not a remote connectivity result.</details>
<details><summary>Hint 2</summary>Separate the IP address family from verbs HCA/port/link layer; then separate requested network from logs confirming selection and completed work.</details>

## Exercise 2: diagnose only what the record supports

**Goal:** use fictional fixture **F2** to prioritize hypotheses and reject the proposal “raise the IB timeout, then reuse rank 0's output.” Mark supported facts, unknowns and next observations.

<div data-diagnostic-fixture="F2" data-provenance="synthetic" data-evidence="none">

```text
fixture=F2 provenance=synthetic evidence=none
node=node-a rank=0 seq=1 phase=init state=complete
node=node-a rank=0 seq=2 phase=submit op=all-reduce count=257 dtype=int32
node=node-a rank=0 seq=3 phase=wait state=deadline-reached
node=node-b rank=1 seq=1 phase=init state=complete
node=node-b rank=1 seq=2 phase=producer state=cuda-error
node=node-b rank=1 seq=3 phase=process state=exited
node=node-b rank=1 collective_submit=missing
selected_transport=unknown clocks=uncorrelated termination=unconfirmed
recovery=unattempted recorded_result=none
```

</div>

**Constraints:** the CUDA error has no supplied numeric code or cause. No network-selection log, rank-1 submission record, output check or all-node termination receipt exists. Do not infer a particular GPU defect, faulty switch, globally ordered timestamps or successful recovery. Do not intentionally execute a broken distributed schedule.

**Acceptance:** explain why process/application failure deserves investigation before transport tuning, while missing submission evidence alone does not prove no call occurred. Request the producer's immediate error, launcher exit cause, per-rank operation/transport ledger and Q07 local timeline. Separate socket retry sleeps, verbs timeout, application deadline and job deadline; derive 59,500 ms from the defaults without treating it as an execution duration. Specify all-node termination, fresh job/communicator/input, every-rank oracle checks and cleanup receipts for a recovery attempt. Apply G09's future admission ledger before any execution, and give a public redaction checklist that preserves rank/phase relationships.

<details><summary>Hint 1</summary>Which node-local chain contains a reported failure before its process exits? What evidence is absent on that node?</details>
<details><summary>Hint 2</summary>A deadline bounds waiting. It cannot certify the cause, output validity or remote termination. Fresh attempts need their own manifest and result ledger.</details>

## Review separately

Compare with [worked solutions](/en/multi-gpu/multi-node-transport-failures/solutions/) after finishing both ledgers. Continue with [PB-R6-012](/en/practice/#pb-r6-012) and [PB-R6-013](/en/practice/#pb-r6-013). Static fixture checks establish teaching consistency only; no compilation or runtime Evidence Status is granted.
