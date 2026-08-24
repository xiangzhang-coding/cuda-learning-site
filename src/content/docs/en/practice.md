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
  - entry-pb-r0-003
  - entry-pb-r0-004
  - entry-pb-r0-005
  - review
resourceKind: practice-bank
unitId: PB-R0
prerequisites:
  - O02
  - O03
  - F01
relatedUnits:
  - O02
  - O03
  - F01
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
    attrs: { name: 'cuda:structure', content: 'use,entry-pb-r0-001,entry-pb-r0-002,entry-pb-r0-003,entry-pb-r0-004,entry-pb-r0-005,review' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: practice-bank }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: PB-R0 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: 'O02,O03,F01' }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O02,O03,F01' }
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

Review the linked prerequisite, then produce your own artifact before reading the solution. Open hints in order. The solution checks boundaries rather than replacing the work. This page publishes only the five complete entries below and uses no empty preview entries.

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

## PB-R0-003: Review an indexing prediction before execution

- **ID and Publication Pair:** PB-R0-003 in the `practice-bank` Publication Pair.
- **Type and difficulty:** Concepts and implementation; foundational.
- **Prerequisite:** [F01: From Prediction to a First CUDA Kernel](/en/foundations/first-cuda-kernel/).
- **Hardware gate:** None; use static reasoning only.
- **Related Learning Unit:** F01.
- **Last reviewed:** 2026-08-24.

**Prompt:** For one-dimensional vector addition with `N = 65` and `blockDim.x = 32`, give the block count, total launched thread count, final valid index, and bounds state of `threadIdx.x = 0` and `1` in the final block. Explain why a bounds check remains necessary.

**Constraints:** Write equations first, run no program, use zero-based indices, and do not equate launch extent with logical data extent.

**Expected evidence:** A coordinate table and an ownership explanation of no more than five sentences.

**Acceptance criteria:** Derive 3 blocks, 96 launched threads, and final valid index 64; identify local thread 0 in the last block as valid and 1 as out of bounds; explain that 31 out-of-bounds threads must skip access.

<details><summary>Hint 1</summary>Use `ceil(65 / 32)` for block count.</details>

<details><summary>Hint 2</summary>The final block has `blockIdx.x = 2`, so its global indices start at 64.</details>

**Solution:** `ceil(65 / 32) = 3`, giving 96 launched threads. The final valid element is index 64. Local thread 0 in the final block has global index 64 and is IN BOUNDS; local thread 1 has global index 65 and is OUT OF BOUNDS. Every remaining local thread is also out of bounds, so the kernel must guard access with `index < N`.

**Valid alternative:** A number line or VIS02-style static coordinate table is valid when equations and bounds reasons remain reviewable.

**Common errors:** Rounding down to two blocks, treating index 65 as the final element, or believing surplus threads were not launched.

**Source basis:** The original indexing model in [F01](/en/foundations/first-cuda-kernel/) and [VIS02](/en/visuals/indexing/), plus NVIDIA [Introduction to CUDA C++](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/intro-to-cuda-cpp.html).

## PB-R0-004: Repair incomplete error and correctness boundaries

- **ID and Publication Pair:** PB-R0-004 in the `practice-bank` Publication Pair.
- **Type and difficulty:** Debugging and correctness; foundational.
- **Prerequisite:** [F01](/en/foundations/first-cuda-kernel/).
- **Hardware gate:** None; review a hypothetical flow.
- **Related Learning Units:** F01 and O02.
- **Last reviewed:** 2026-08-24.

**Prompt:** A program checks only `cudaMalloc` and final output text, then claims “no error and GPU-correct.” Write the missing boundaries and define the acceptance rule for one element.

**Constraints:** Use EX02's declared Runtime flow and tolerances, invent no output, and separate API success from numerical correctness.

**Expected evidence:** An execution-ordered checklist and one computable numerical acceptance condition.

**Acceptance criteria:** Include three allocations, two H2D copies, launch error, synchronization, D2H copy, CPU comparison, and three frees; accept when absolute `1e-5` or relative `1e-5` passes; explain why one output line cannot replace these checks.

<details><summary>Hint 1</summary>Launch return and kernel completion are separate boundaries.</details>

<details><summary>Hint 2</summary>Failure requires both absolute and relative criteria to reject, not either one.</details>

**Solution:** After three `cudaMalloc` calls, check both H2D copies. After launch, call `cudaGetLastError`, then wait and check execution with `cudaDeviceSynchronize`. Check D2H copy, compare each element with an independent CPU reference, and check all three `cudaFree` calls. An element passes when `abs(expected-actual) <= 1e-5` **or** that difference is `<= 1e-5 * max(abs(expected), abs(actual))`. API success and numerical acceptance are both required.

**Valid alternative:** A state machine or sequence diagram may replace the checklist when it preserves the same order and two independent acceptance layers.

**Common errors:** Synchronizing without checking launch, combining tolerances with AND, or treating the host test as a GPU result.

**Source basis:** The canonical error/correctness contract in [F01](/en/foundations/first-cuda-kernel/) and [EX02](/en/examples/vector-addition/), plus NVIDIA [CUDA Runtime API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html).

## PB-R0-005: Review a LAB02 evidence request

- **ID and Publication Pair:** PB-R0-005 in the `practice-bank` Publication Pair.
- **Type and difficulty:** Evidence review and Lab preparation; foundational.
- **Prerequisite:** [F01](/en/foundations/first-cuda-kernel/), with [O02](/en/start/evidence-status/) and [O03](/en/start/environment-manifest/).
- **Hardware gate:** None; review a text record and run no CUDA.
- **Related Learning Units:** F01, O02, and O03.
- **Last reviewed:** 2026-08-24.

**Prompt:** A LAB02 request contains only “CUDA 13, vector add PASS, 0.01 ms” and asks for Runtime-Verified. Decide which status can be assigned now and list the completion path.

**Constraints:** Do not guess environment patch, GPU, or logs. Do not treat a performance number as correctness. Compile-Checked may refer only to the existing canonical EX02 Lane records.

**Expected evidence:** A status decision, gap list, and pre-run record template.

**Acceptance criteria:** Keep runtime Pending Hardware Verification; grant neither Community-Observed nor Runtime-Verified; require a complete manifest, exact commands, raw logs, date, and criterion result; label unsupported `0.01 ms` as uninterpretable raw text.

<details><summary>Hint 1</summary>A bare `PASS` lacks subject, criteria, environment, logs, and date.</details>

<details><summary>Hint 2</summary>Runtime-Verified also requires maintainer reproduction in a declared Reference Environment.</details>

**Solution:** The request grants neither Community-Observed nor Runtime-Verified; the runtime axis remains Pending Hardware Verification. Completion requires GPU identity, compute capability, count, driver, Toolkit patch, NVCC, host compiler, native Linux, workload, memory, permissions, exact commands, CPU/tolerance criteria, date, exit status, and raw logs. Move `0.01 ms` to uninterpretable raw text without synchronization, tool version, samples, and baseline. Evaluate Runtime-Verified only after maintainers reproduce the predefined criteria in a declared Reference Environment.

**Valid alternative:** A complete community record that meets its criteria may qualify for Community-Observed while Pending Hardware Verification remains. It is still not maintainer reproduction.

**Common errors:** Upgrading runtime because EX02 is Compile-Checked, treating unknown CUDA 13 as the 13.3.1 Lane, or preserving an unsupported performance number as an observation.

**Source basis:** The original evidence contracts in [LAB02](/en/labs/vector-addition/), [O02](/en/start/evidence-status/), and [O03](/en/start/environment-manifest/).

## Review record

All five entries and their Chinese counterparts were reviewed together on **2026-08-24**. Every scenario, prompt, and solution is original project work. No external question, output, log, or performance figure was copied, and no CUDA execution occurred.
