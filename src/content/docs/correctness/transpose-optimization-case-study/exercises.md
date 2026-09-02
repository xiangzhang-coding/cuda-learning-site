---
title: 'Q11 练习：修复并设计受控 Transpose 证据'
description: 三项迁移任务分别修复 EX14 baseline、实现供 LAB10 使用的四阶段 runner，并审计 bank-layout profiler claim。
pairId: q11-exercises
counterpart: /en/correctness/transpose-optimization-case-study/exercises/
factCheckDate: '2026-09-02'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: Q11-EXERCISES
prerequisites:
  - Q11
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q11-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/transpose-optimization-case-study/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-02' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q11 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/transpose-optimization-case-study/exercises/" lang="en">Read the English counterpart</a>

## 先修关系

只需先完成 [Q11：用受控证据优化 Canonical Transpose](/correctness/transpose-optimization-case-study/)。Q11 是 Learning Unit，本身不授予 Evidence Status；linked [EX14](/examples/tiled-transpose/)与 [LAB10](/labs/optimize-canonical-transpose/)目前都为 Pending Hardware Verification，且 recorded observations 为空。

## 作答说明

这里恰好有三项迁移任务。Exercise 1 与 3 产出可复核 ledger；Exercise 2 产出 learner-owned source 与 C++17 build handoff，可以实现并构建，但这个 static Exercise page 不提供也不要求 GPU result。不得编造 output、选择 tile winner，或把 proposed profiler field 当作 observed。每题有两层提示；完成自己的 acceptance checklist 前，不要打开[复核解答](/correctness/transpose-optimization-case-study/solutions/)。

## 练习 1：修复无效的 EX14 baseline 与 hypothesis ledger

**目标：** 修复一份 proposal：它把 unpinned、只跑 square input 的结果叫作“EX14 baseline”，跳过 `5x7` 与 `33x35`，既不检查 output shape，也不逐元素检查，并且 hypothesis ledger 只有“padding 应改善 performance”。

**约束：** 保留 immutable EX14 oracle、全部三个 fixtures、`output[col * rows + row] = input[row * columns + col]`、exact equality、source/build identities，以及 acceptance baseline 与 recorded measurement baseline 的区别。补齐一个 primary variable、一个 mechanism、invariants、competing explanations、support/reject/no-answer rules 与 rollback；不得填写结果。

**预期证据：** 一份 defect list、修复后的 correctness gate、baseline-qualification packet，以及一行完整的 pre-result hypothesis ledger。

**验收标准：** 原 baseline 被拒绝。修复后的 plan 在全部 EX14 检查通过前不能 timing/profile candidate；其 hypothesis 可被证伪，并且不假定 padding 获胜。

<details><summary>提示 1</summary>一个 source revision 加一份正确 square output，不能建立 rectangular output-shape 与 edge contract。</details>

<details><summary>提示 2</summary>先写 reject 与 no-answer 分支，再写 evidence field。</details>

## 练习 2：实现 LAB10 coalescing-to-tiling 四阶段 runner

**目标：** 从 immutable [EX14](/examples/tiled-transpose/)派生 learner-owned `lab10_transpose_candidates.cu`，且不编辑任何 canonical file。相邻 stages 每次只改变一个 primary variable。实现 required CLI `build/lab10-transpose-candidates --all-stages --rows ROWS --columns COLUMNS --verify exact`，并按固定顺序提供四个独立 kernels/stages：frozen direct `baseline-direct`、只改变 thread-to-coordinate direction 的 `coalescing-direction`、使用无 padding `32x32` shared tile 的 `shared-memory-tiling`，以及只把 physical shared stride 改为 `32x33` 的 `padded-bank-layout`。Shared driver 必须在每个 process 中只创建一份 stable device output allocation，四阶段复用同一 allocation/address，同时让每个 stage 的 correctness 独立于前一 stage。

**约束：** 保留独立的 EX14 CPU oracle、out-of-place mapping，以及 finite、non-NaN deterministic input/oracle values；不能让 candidates 互相充当 oracle。在每个 correctness、warm-up 与 profiled process 的每次 stage launch 紧前，必须用 checked host-to-device copy 将 complete output 填为 quiet-NaN sentinel 并检查 fill/copy CUDA status；随后 launch、检查 `cudaDeviceSynchronize`、用 checked device-to-host copy 取回 complete output，再要求正确 output shape、`output[col * rows + row] = input[row * columns + col]`、每个 element exact oracle equality，且 no sentinel remains。该 procedure 必须对 `5x7`、`33x35`、`64x32`、`4096x4096` 的四个 stages 分别执行；stable allocation/address 与 identical sentinel procedure 是 held constants，且 fill/copy 不进入 selected kernel metrics。使用 C++17；允许实现和构建，但本 static Exercise page 不提供也不要求 GPU execution、timing、profiler value 或 winner。

**预期证据：** Learner-owned source artifact；证明 canonical files 未修改的记录；三个 reviewed adjacent-stage diffs；required CLI 与四阶段顺序 checklist；C++17 build instructions、expanded build command、log/status artifact 和生成的 `build/lab10-transpose-candidates`；source、每个 adjacent diff、build records 与 binary 的 SHA-256；以及 oracle、四个 fixtures、stable allocation/address、per-stage sentinel fill/copy statuses、synchronization、complete-output readback、exact comparison 与 no-sentinel-remains audit。不得提交由本站代填的 GPU output。

**验收标准：** Handoff 能证明 EX14 保持 immutable，source 定义四个 required kernels/stages，C++17 build 产出 required binary，CLI 能表达全部四个 exact checks；每个 process 只分配一次 output 并保持 address；每个 fixture/stage 都在 launch 前完成 checked full-output quiet-NaN fill，在 launch 后完成 checked synchronization 与 full readback，并通过 shape、every-element exact oracle 与 no sentinel remains；三个 adjacent diffs 各自只包含声明的变量变化。该 source/build/hash packet 可以直接进入 guided [LAB10](/labs/optimize-canonical-transpose/)；缺少 GPU result 不会让这项 static Exercise 失败，也不会填充任何 Evidence Status axis。先完成自己的尝试与 checklist，再到独立[复核解答的 Solution 2](/correctness/transpose-optimization-case-study/solutions/)对照一份完整 reviewed implementation。

<details><summary>提示 1</summary>把 CLI parsing、allocation、独立 CPU oracle 与 exact comparison 放在 shared driver contract 中；四个 kernel bodies 仍保持可单独审计。</details>

<details><summary>提示 2</summary>先哈希 learner source 与三个 adjacent diffs，再保留 C++17 build records 和 binary hash；GPU execution 与 profiler custody 留给 LAB10。</details>

## 练习 3：审计 bank layout profiler claim 与竞争解释

**目标：** 审计“`T+1` 消除了 bank conflicts 并让 transpose 更快”这一 claim。它的 packet 只有 screenshot 与 friendly metric label，没有 exact GPU query output、permission/replay record、raw timing samples，也没有证明 logical tile shape 与 launch 保持不变。

**约束：** 分开 VIS11 arithmetic、static bank-index reasoning、queried metric definition、`.ncu-rep` custody 与 unprofiled timing。检查 physical stride、access width、source instruction、workload、correctness、exact GPU/tool、metric unit/scope、filter、replay 与 permission。列出至少三个不赋值的 competing explanations。

**预期证据：** Claim-by-claim verdict、missing-coordinate register、exact-GPU query-first repair plan、matched report/timing custody plan，以及 competing-explanation matrix。

**验收标准：** 不接受 supplied claim 作为 evidence。修复后的 claim 足够窄，可以被支持、否定或保持 unanswered；它不会把 conflict-related field、Roofline region 或 VIS11 state 当作 causal proof。

<details><summary>提示 1</summary>先检查 `T` 与 `T+1` 是否是唯一 physical change；shared footprint 变化可能影响其他 mechanism。</details>

<details><summary>提示 2</summary>即使 workloads 匹配，profiler report 与 unprofiled timing run 仍是两项独立 observations。</details>

## 下一步

查看独立的[复核解答](/correctness/transpose-optimization-case-study/solutions/)，再使用已发布的 [PB-R3-007](/practice/#pb-r3-007)与 [PB-R3-008](/practice/#pb-r3-008)。把 Exercise 2 的 runner 带入 guided follow-on [LAB10：优化 canonical transpose](/labs/optimize-canonical-transpose/)；static Exercise 内容本身不填充 Lab record。
