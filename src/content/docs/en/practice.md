---
title: Practice Bank
description: Published original cross-unit practice with prerequisite links, layered hints, and solutions.
pairId: practice-bank
counterpart: /practice/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - use
  - entry-pb-r0-001
  - entry-pb-r0-002
  - review
resourceKind: practice-bank
unitId: PB-R0
prerequisites:
  - O02
  - O03
relatedUnits:
  - O02
  - O03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: practice-bank }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'use,entry-pb-r0-001,entry-pb-r0-002,review' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: practice-bank }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: PB-R0 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: 'O02,O03' }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O02,O03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/practice/" lang="zh-CN">阅读中文对应页</a>

The Practice Bank collects original problems that recur across the curriculum. Each entry names prerequisite Learning Units, a Hardware gate, acceptance criteria, hints, a solution, and its Source basis. It is not a copied question dump.

## How to use it

Review the linked prerequisite, then produce your own artifact before reading the solution. Open hints in order. The solution checks boundaries rather than replacing the work. This page publishes only the two complete entries below and uses no empty preview entries.

## PB-R0-001: Repair an Evidence Status record

- **ID and Publication Pair:** PB-R0-001 in the `practice-bank` Publication Pair.
- **Type and difficulty:** Core mental models; foundational.
- **Prerequisite:** [O02: Recording Evidence Honestly](/en/start/evidence-status/).
- **Hardware gate:** None; analyse a text record only.
- **Related Learning Unit:** O02.
- **Last reviewed:** 2026-08-24.

**Prompt:** A release note says: “The Linux build was skipped after the container registry timed out. A contributor pasted `PASS` from a personal GPU, so the project is Compile-Checked and Runtime-Verified. Web tests also prove that the browser explainer counts as a CUDA run.” Rewrite it as an honest record.

**Constraints:**

- Use only O02's controlled Evidence Status values.
- Invent no manifest, build log, observation date, or maintainer reproduction.
- Keep expected observations separate from recorded observations.

**Acceptance criteria:**

- A blocked build has no Compile-Checked.
- A community `PASS` without a complete Environment Manifest, logs, criteria, and date grants no Community-Observed.
- No Runtime-Verified appears before maintainer reproduction; Pending Hardware Verification remains when GPU behavior is required.
- Web tests and browser models grant no CUDA Evidence Status.

<details><summary>Hint 1</summary>For every sentence, ask who did what and which reviewable artifact remains.</details>

<details><summary>Hint 2</summary>Blocked is not passed, and one `PASS` line is not a complete community report.</details>

**Solution:** “The declared compile work did not run because the container registry timed out, so there is no Compile-Checked. The community supplied an incompletely recorded `PASS` with no manifest, logs, criteria, or date, so Community-Observed cannot yet be assigned. Maintainers have not reproduced the subject in a declared Reference Environment; if acceptance requires GPU behavior, the runtime axis remains Pending Hardware Verification. Web-quality tests validate the site and grant no CUDA status. Neither expected nor recorded observations have a qualifying record.”

**Common errors:** Assigning status after calling the job blocked; omitting a manifest to be polite to a contributor; treating web CI as a CUDA compile; removing Pending Hardware Verification without maintainer evidence.

**Source basis:** The site's original [O02 contract](/en/start/evidence-status/) and the separation of compile and run phases in NVIDIA `nvcc` 13.3.1 [supported phases](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases).

## PB-R0-002: Complete a manifest and repair a support claim

- **ID and Publication Pair:** PB-R0-002 in the `practice-bank` Publication Pair.
- **Type and difficulty:** Debugging and correctness; foundational.
- **Prerequisite:** [O03: Reading an Environment Manifest](/en/start/environment-manifest/).
- **Hardware gate:** None; use a hypothetical record and run no CUDA.
- **Related Learning Unit:** O03.
- **Last reviewed:** 2026-08-24.

**Prompt:** A record contains only “8 GB GPU, CUDA 12, WSL, kernel 0.2 ms” and claims “complete tier; this site supports the environment.” List the missing manifest fields and repair both conclusions.

**Constraints:**

- Do not guess GPU model, compute capability, driver, Toolkit patch, or measurement method.
- Cover correctness and performance fields, but leave result unobserved.
- Apply only O03's Supported Environment and GPU Capability Tier definitions.

**Acceptance criteria:**

- The manifest separates GPU identity, compute capability, GPU count, driver, Toolkit, components, NVCC, host compiler, OS, workload and shape, memory, permissions, exact command, correctness, and observation date.
- The performance appendix has baseline, hypothesis, clocks or power, warm-up, synchronization, timer or profiler version, statistics and sample method, and interpretation boundaries.
- The conclusion states that WSL is not this site's Supported Environment and 8 GB alone cannot select the Modern Single-GPU Capability Tier.

<details><summary>Hint 1</summary>Split “CUDA 12” into Toolkit patch, driver, and relevant component versions.</details>

<details><summary>Hint 2</summary>`0.2 ms` is uninterpretable without synchronization, tool version, samples, and baseline.</details>

**Solution:** Create hardware, software, workload, execution, correctness, date, and performance groups. Mark every unknown “to collect” and name a query method. Move `0.2 ms` to unreviewed raw text and leave result empty. Repair support to: “Native Linux is the only Supported Environment; WSL is an unsupported comparison.” Repair the tier to: “Modern Single-GPU requires compute capability 8.0 or newer, at least 8 GB, and the required count, features, and permissions; the current record cannot decide.”

**Common errors:** Treating “CUDA 12” as a complete software coordinate; replacing compute capability with memory capacity; accepting latency without synchronization; converting NVIDIA product support into this site's responsibility.

**Source basis:** The site's original [O03 contract](/en/start/environment-manifest/), NVIDIA [CUDA Compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html), and the CUDA Programming Guide [compute capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html).

## Review record

Both entries and their Chinese counterparts were reviewed together on **2026-08-24**. Every scenario, prompt, and solution is original project work. No external question, output, log, or performance figure was copied, and no CUDA execution occurred.
