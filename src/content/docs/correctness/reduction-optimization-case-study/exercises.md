---
title: 'Q12 练习：设计并审查受控 Reduction 证据'
description: 三项迁移任务分别重建 EX11 baseline、实现四阶段 reduction runner，并审查 profiler 与数值结论。
pairId: q12-exercises
counterpart: /en/correctness/reduction-optimization-case-study/exercises/
factCheckDate: '2026-09-05'
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
unitId: Q12-EXERCISES
prerequisites:
  - Q12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q12-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/reduction-optimization-case-study/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q12 }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/reduction-optimization-case-study/exercises/" lang="en">Read the English counterpart</a>

## 先修关系

只需先完成 [Q12：用受控证据优化 Canonical Reduction](/correctness/reduction-optimization-case-study/)。Q12 是学习单元（Learning Unit），不授予证据状态（Evidence Status）；关联 [EX11](/examples/multi-stage-reduction/)仍为待硬件验证（Pending Hardware Verification），[VIS10](/visuals/reduction-stages/)仍是 evidence-neutral browser model。

## 作答说明

这里恰好有三项迁移任务。练习（Exercise）1 与 3 产出静态 ledger/audit；Exercise 2 可以实现并构建 learner-owned runner，但本页不要求 GPU execution，也不提供 timing、metric、speedup 或 winner。每题有两层提示。完成自己的 acceptance checklist 前，不要打开[复核解答](/correctness/reduction-optimization-case-study/solutions/)。

## 练习 1：拒绝一个无效 EX11 baseline 与四变量 hypothesis

**目标：** 修复一份 proposal：它只比较最终 scalar，没有固定 EX11 revision、CPU reference、tolerance、stage DAG 或 edge fixtures，并在一个 candidate 中同时改变 warp-tail control、barrier、shuffle tree 与 loads per thread。

**约束：** 保留 immutable EX11、double CPU reference、`absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)`、`4099 -> 9 -> 1`、identity zero 与 uniform barrier participation。为 divergence、synchronization、numerical order 和 memory traffic 分别写 pre-result hypothesis；披露无法隔离的 coupling，并加入 support/reject/no-answer/rollback 与 competing explanations。不得填写观察值。

**预期证据：** Defect list、修复后的 canonical correctness gate、四节点 variant graph、三份 adjacent hypothesis ledgers，以及 held-constant/coupling/decision matrix。

**验收标准：** 原 baseline 与 confounded claim 被拒绝；修复方案在同一 CPU-reference/tolerance gate 通过前不进入 measurement；每条 edge 都能被证据否定，并允许 no answer。

<details><summary>提示 1</summary>先画每个 candidate 的 operand tree 和 stage-size DAG，再判断两个版本是否真的只差一个 intervention。</details>

<details><summary>提示 2</summary>把“source 预测了什么”和“exact GPU 实际观察了什么”放在不同列。</details>

## 练习 2：实现 EX11-derived 四阶段 runner

**目标：** 从 immutable [EX11](/examples/multi-stage-reduction/)派生 learner-owned `q12_reduction_candidates.cu`，不编辑 canonical files。实现 `build/q12-reduction-candidates --all-stages --elements ELEMENTS --verify tolerance`，并按固定顺序运行 `canonical-shared-tree`、`warp-tail-control`、`reassociated-warp-order` 与 `four-load-staging`。

**约束：** 必须 include canonical `multi_stage_reduction_reference.hpp`，直接调用 `ex11::initialize_input`、`ex11::cpu_reference_sum` 与 `ex11::compare_reduction_sum`。所有 variants 使用 256-thread blocks、bounds-invalid identity zero 和 host-driven multi-kernel stages。Warp collectives必须有显式 participant mask/synchronization；不得依赖 implicit lockstep。每个 algorithm 前用 checked host-to-device copy 把两个 stable partial buffers 填为 quiet-NaN sentinel，运行全部 stages，检查 launch 和 `cudaDeviceSynchronize`，只从最终合法 location read back，再用同一 tolerance 判定。至少覆盖 `1, 3, 511, 512, 513, 4099, 16777219`；不得让 candidate 互相充当 oracle。

**预期证据：** Learner-owned source、证明 EX11 files 未修改的 diff、三个 adjacent source diffs、required CLI checklist、C++17 expanded build command、stdout/stderr/status、source/build/binary SHA-256，以及每个 fixture/stage 的 CPU reference、actual、absolute error、allowed error 与 pass/fail record。GPU records 可保持 absent，但不能伪造。

**验收标准：** Source 定义四个 required stages且顺序固定；canonical stage保持 EX11 tree；warp-tail stage显式同步并保留完整 participant set；reassociated stage提交不同 operand ledger；four-load stage提交 `16777219 -> 16385 -> 17 -> 1` 与 traffic estimate。每个 variant独立通过同一 comparator后才有资格测量。先完成自己的实现，再对照独立[复核解答的 Solution 2](/correctness/reduction-optimization-case-study/solutions/)提供的一份 reviewed implementation。

<details><summary>提示 1</summary>把 shared driver、allocation、sentinel、CPU oracle 与 comparator 保持单份；四个 kernel bodies 和 stage-size helper 分开审查。</details>

<details><summary>提示 2</summary>Down-shuffle 与 XOR butterfly 都要画 operand edges；数学项相同并不意味着 floating-point operation sequence 相同。</details>

## 练习 3：审查缺少 stage contract 的 profiler 与 CUB claim

**目标：** 审查一份摘要：它给出 friendly metric labels，却没有 raw samples、query、permission、replay、report/hash、环境清单（Environment Manifest）或 correctness result；随后宣称 four-load variant “消除 divergence、减少 synchronization、保持逐 bit 相同并且总是最快”，再引用一个未固定 API 的 CUB 调用作为证明。

**约束：** 对四个 stage 分别要求 workload、warm-up、synchronization、statistics、profiler method/permissions、Environment Manifest、correctness result 与 bounded interpretation。分开 source-derived traffic estimate、queried metric、unprofiled elapsed samples 和 numerical acceptance。明确 [L03](/libraries/cub-device-primitives/)与 [LAB11](/labs/compare-custom-reduction-with-cub/)是独立的已发布后续资源，但不会为这份 Q12 summary 回填 CUB API、build、runtime 或 result。

**预期证据：** Claim-by-claim verdict、missing-coordinate register、exact-GPU query-first repair plan、四项未填写 stage records、timing/profiler/numerical boundaries，以及至少四个 competing explanations。

**验收标准：** Supplied universal/causal/bitwise claims全部被拒绝。修复后的每项 claim足够窄，可得到 support、reject 或 no answer；缺失 measurement继续明确标为 expected and unrecorded，production comparison移交 LAB11 而不是在 Q12 中补写。

<details><summary>提示 1</summary>Profiler report可以帮助解释 mechanism，但不能追溯附加到另一组 unprofiled samples。</details>

<details><summary>提示 2</summary>Tolerance pass、same-run determinism、cross-run determinism 与 bitwise reproducibility 是四个不同问题。</details>

## 下一步

查看独立的[复核解答](/correctness/reduction-optimization-case-study/solutions/)，再完成 [PB-R3-009](/practice/#pb-r3-009)与 [PB-R3-010](/practice/#pb-r3-010)。所有 runtime 与 performance cells 在获得 qualifying Environment Manifest 和 artifacts 前继续保持 expected and unrecorded。
