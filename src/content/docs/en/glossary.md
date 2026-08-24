---
title: Glossary
description: Published canonical bilingual vocabulary and evidence boundaries for CUDA Learning Site.
pairId: glossary
counterpart: /glossary/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - use
  - entries
  - maintenance
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: glossary
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'use,entries,maintenance'
---

<a class="locale-pair" data-locale-counterpart href="/glossary/" lang="zh-CN">阅读中文对应页</a>

This Glossary records the canonical vocabulary used by CUDA Learning Site. Each entry pairs the English term used in source material and tools with the preferred Chinese term used here.

## How to use it

“Avoid” identifies wording that would blur a teaching contract or resource type. It is not a ban on ordinary language. Each entry also names related Learning Units and any version boundary.

## Published entries

### Learning Site · 学习站

- **Definition:** The complete public learning resource, including the Stable Curriculum, Runnable Examples, Labs, and Exercises.
- **Avoid:** Blog, documentation site.
- **Related unit:** O01.
- **Version note:** Not tied to a Toolkit version.

### Stable Curriculum · 稳定课程

- **Definition:** The prerequisite-bearing curriculum built on non-preview interfaces and durable concepts. Stability describes the teaching dependency contract, not a hardware-observation claim for every hands-on activity.
- **Avoid:** Main curriculum, latest-feature catalog.
- **Related unit:** O01.
- **Version note:** Maintained continuously rather than copied per Toolkit.

### Learning Unit · 学习单元

- **Definition:** A sequenced part of the curriculum that motivates one topic, develops its mental model and relevant historical context, and ends by checking understanding through practice.
- **Avoid:** Article, post.
- **Related unit:** O01.
- **Version note:** The resource type is version-independent.

### Publication Pair · 双语发布对

- **Definition:** The Chinese and English counterparts of one public page, sharing facts, structure, code, visuals, metadata, and source dates.
- **Avoid:** Translation fallback, optional translation.
- **Related unit:** O01.
- **Version note:** Applies to every release.

### Runnable Example · 可运行示例

- **Definition:** A standalone source project demonstrating one focused idea and serving as the canonical executable source for Learning Units.
- **Avoid:** Snippet, pseudocode, Lab.
- **Related units:** O01 and F01.
- **Version note:** Each project declares its own compatibility.

### Lab · 实验

- **Definition:** A guided activity that learners run in an external CUDA-capable environment, with expected observations and acceptance criteria.
- **Avoid:** Demo, browser playground.
- **Related units:** O01 and LAB02.
- **Version note:** Each Lab declares its environment requirements.

### Exercise · 练习

- **Definition:** A learner-completed task that states its goal, constraints, and acceptance criteria rather than only presenting an answer.
- **Avoid:** Example, Lab.
- **Related unit:** O01.
- **Version note:** The resource type is version-independent.

### Practice Bank · 练习题库

- **Definition:** A curated collection of original problems across the curriculum, with every entry linked to the Learning Units that teach its prerequisites.
- **Avoid:** FAQ, copied question dump.
- **Related unit:** O01.
- **Version note:** Individual entries declare version boundaries when needed.

### Visual Explainer · 可视化讲解

- **Definition:** An interactive or animated representation that exposes spatial, temporal, or architectural behavior. It may model CUDA concepts in the browser but never executes CUDA.
- **Avoid:** Decoration, CUDA demo.
- **Related resources:** O01, [VIS01](/en/visuals/kernel-journey/), and [VIS02](/en/visuals/indexing/).
- **Version note:** Conceptual models must be separated from hardware-specific behavior.

### Glossary · 术语表

- **Definition:** A learner-facing bilingual index of canonical terms used throughout the curriculum.
- **Avoid:** Dictionary, keyword list.
- **Related unit:** O01.
- **Version note:** Entries are reviewed with the curriculum but do not imply interface compatibility.

### Evidence Status · 证据状态

- **Definition:** A controlled label describing the reviewable evidence available for a Lab or Runnable Example. Compilation and runtime are independent axes.
- **Avoid:** Unqualified “verified” or “supported.”
- **Related unit:** O02.
- **Version note:** A status is scoped to a subject, environment, criteria, and date; publishing a web page grants none.

### Compile-Checked · 编译已检查

- **Definition:** The required source actually built in a declared Toolkit Lane with dialect, target, command, and build environment recorded. It neither requires nor implies GPU execution.
- **Avoid:** Runtime-Verified, tested on GPU.
- **Related units:** O02, O03.
- **Version note:** Every claim binds to an exact Toolkit Lane.

### Community-Observed · 社区已观察

- **Definition:** A contributor reported a runtime observation with a complete Environment Manifest, logs or artifacts, criteria, and date. It is not maintainer reproduction.
- **Avoid:** Runtime-Verified, anecdotal support.
- **Related units:** O02, O03.
- **Version note:** May coexist with Pending Hardware Verification.

### Runtime-Verified · 运行已验证

- **Definition:** The subject executed in a declared, maintainer-controlled Reference Environment and met its stated correctness and observation criteria.
- **Avoid:** Compile-Checked, expected to work.
- **Related units:** O02, O03.
- **Version note:** The conclusion covers only recorded GPU, driver, Toolkit, components, workload, and method coordinates.

### Pending Hardware Verification · 待硬件验证

- **Definition:** Acceptance requires GPU behavior, but the required qualifying runtime evidence does not yet exist.
- **Avoid:** Runtime-Verified, should run.
- **Related unit:** O02.
- **Version note:** A successful build or community observation does not remove it automatically.

### Runtime-Not-Applicable · 无需运行验证

- **Definition:** A runtime-axis status for acceptance criteria that require compilation or artifact inspection and no GPU behavior.
- **Avoid:** Compile-only, skipped runtime.
- **Related unit:** O02.
- **Version note:** It must not hide runtime correctness or performance requirements.

### Environment Manifest · 环境清单

- **Definition:** Separate GPU, compute-capability, count, driver, Toolkit, component, compiler, operating-system, workload, and method coordinates needed to interpret a build, run, or measurement.
- **Avoid:** Version string, machine description.
- **Related unit:** O03.
- **Version note:** New evidence records new coordinates and an observation date.

### Supported Environment · 受支持环境

- **Definition:** An environment family for which the site accepts setup guidance, troubleshooting boundaries, and validation responsibility. Native Linux is the only one.
- **Avoid:** Any platform that may happen to work.
- **Related unit:** O03.
- **Version note:** Upstream product support does not expand site responsibility automatically.

### Reference Environment · 基准环境

- **Definition:** A declared, maintainer-controlled configuration inside the Supported Environment with a complete manifest and successful controlled baseline run.
- **Avoid:** Recommended environment, community setup.
- **Related unit:** O03.
- **Version note:** No Reference Environment is currently declared.

### Toolkit Lane · 工具包通道

- **Definition:** A pinned Toolkit and host environment with declared C++ dialects, used as a compile-evidence target.
- **Avoid:** Site version, documentation version.
- **Related unit:** O03.
- **Version note:** A Lane is not a curriculum copy or Reference Environment; only a successful build can add Compile-Checked.

### GPU Capability Tier · GPU 能力层级

- **Definition:** A curriculum support tier defined by compute capability, memory, GPU count, features, and permissions.
- **Avoid:** GPU class, memory tier.
- **Related unit:** O03.
- **Version note:** Product names and extra memory cannot select a tier alone.

### Baseline GPU Capability Tier · 基础 GPU 能力层级

- **Definition:** The tier for Stable Curriculum fundamentals, requiring compute capability 7.5 or newer and problem sizes that fit within 8 GB.
- **Avoid:** 8 GB GPU tier, Turing tier.
- **Related unit:** O03.
- **Version note:** 8 GB is a workload boundary, not a separate hardware class.

### Modern Single-GPU Capability Tier · 现代单 GPU 能力层级

- **Definition:** The tier for the complete single-GPU route, requiring compute capability 8.0 or newer and at least 8 GB. Additional activities state extra gates.
- **Avoid:** Complete tier, Ampere tier.
- **Related unit:** O03.
- **Version note:** It does not automatically cover multi-GPU or architecture-specific activities.

### CUDA Toolkit · CUDA 工具包

- **Definition:** NVIDIA's bundle of compilers, libraries, tools, and runtime development components, recorded separately from the installed driver and individual component versions.
- **Avoid:** CUDA driver version, the whole CUDA environment.
- **Related unit:** O03.
- **Version note:** Toolkit Lanes use exact `X.Y.Z` coordinates.

### compute capability · 计算能力

- **Definition:** A major.minor capability coordinate describing a set of GPU architectural features and technical limits.
- **Avoid:** GPU generation, Toolkit version.
- **Related unit:** O03.
- **Version note:** Model mappings and feature tables require current NVIDIA documentation.

### kernel · 核函数

- **Definition:** A function launched by the host and executed by many threads on a CUDA device. In CUDA C++, a `__global__` kernel is launched with an execution configuration.
- **Avoid:** Ordinary CPU function, browser animation.
- **Related units:** F01 and LAB02.
- **Version note:** F01 uses the foundational execution model in CUDA Programming Guide v13.3.

### execution configuration · 执行配置

- **Definition:** The kernel-launch configuration that declares grid and thread-block shapes; a one-dimensional case commonly supplies block count and threads per block.
- **Avoid:** Data extent, GPU configuration.
- **Related resources:** F01 and VIS02.
- **Version note:** The configuration creates execution threads but does not define logical data extent automatically.

### grid · 网格

- **Definition:** The complete collection of thread blocks created by one kernel launch, with one-, two-, or three-dimensional shape.
- **Avoid:** Data array, fixed scheduling order.
- **Related resources:** F01, VIS01, and VIS02.
- **Version note:** Grid coordinates do not guarantee block dispatch or completion order.

### thread block · 线程块

- **Definition:** A group of threads in a grid scheduled together on one SM. `blockIdx` identifies a block, while `blockDim` describes its shape.
- **Avoid:** CPU thread pool, warp.
- **Related resources:** F01, VIS01, and VIS02.
- **Version note:** F01 uses only one-dimensional blocks; VIS02 covers multidimensional relationships.

### thread · 线程

- **Definition:** One logical execution instance of a kernel. It derives an owned data position from `threadIdx` and block/grid coordinates.
- **Avoid:** Element, warp, operating-system thread.
- **Related resources:** F01 and VIS02.
- **Version note:** A launched thread may lie beyond logical data extent, so a bounds check remains necessary.

### host and device · 主机与设备

- **Definition:** Host code runs on the CPU side and manages allocation, copies, launch, and synchronization. Device code executes on a CUDA GPU, with explicit memory and completion boundaries between them.
- **Avoid:** Treating a host test as a GPU run, treating device memory as host memory.
- **Related units:** F01 and LAB02.
- **Version note:** LAB02 uses the declared CUDA Runtime API 11.8.0, 12.9.2, or 13.3.1 Lane.

### bounds check · 边界判断

- **Definition:** A comparison between a thread's derived index and logical extent before array access, causing out-of-bounds threads in the final partial block to skip access.
- **Avoid:** Preventing thread launch, shrinking the grid.
- **Related resources:** F01, VIS02, and LAB02.
- **Version note:** EX02's one-dimensional condition is `index < element_count`.

### CPU reference · CPU 参考实现

- **Definition:** An implementation independent of the CUDA kernel that calculates expected results on the CPU for element-wise correctness comparison.
- **Avoid:** GPU runtime evidence, performance baseline unless separately defined by a measurement contract.
- **Related units:** F01 and LAB02.
- **Version note:** EX02's host-only test runs no GPU and grants no Runtime-Verified status.

### tolerance · 容差

- **Definition:** A predefined floating-point acceptance rule. EX02 accepts an element when either absolute `1e-5` or relative `1e-5` succeeds.
- **Avoid:** Requiring both criteria, treating any decimal output as correct.
- **Related units:** F01 and LAB02.
- **Version note:** The values belong to the EX02 correctness contract; changing them creates a new evidence scope.

## Maintenance rule

These entries share the O01, O02, O03, F01, and LAB02 fact-check date of **2026-08-24**. A new entry must include the canonical English, preferred Chinese, definition, aliases to avoid, related units, and a version note when needed. Its [Chinese counterpart](/glossary/) must be complete at the same time.
