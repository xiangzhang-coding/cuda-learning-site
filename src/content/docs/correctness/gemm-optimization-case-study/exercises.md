---
title: 'Q13 练习：设计并审查受控 GEMM 证据'
description: 重建 EX15 baseline、实现四阶段 GEMM，并审查 tile、occupancy、profiler 与 production claims，不接受背诵的 winner。
pairId: q13-exercises
counterpart: /en/correctness/gemm-optimization-case-study/exercises/
factCheckDate: '2026-09-03'
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
unitId: Q13-EXERCISES
prerequisites:
  - Q13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q13-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/gemm-optimization-case-study/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q13-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q13 }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/gemm-optimization-case-study/exercises/" lang="en">Read the English counterpart</a>

## 先修关系

只需先完成 [Q13：用受控证据优化 Canonical GEMM](/correctness/gemm-optimization-case-study/)。Q13 是学习单元（Learning Unit），不授予证据状态（Evidence Status）；关联 [EX15](/examples/tiled-gemm/)仍是待硬件验证（Pending Hardware Verification），[VIS12](/visuals/gemm-tiling-hierarchy/)仍是 evidence-neutral browser model。

## 作答说明

这里恰好有三项迁移任务。Exercise 1 与 3 产出 static ledgers/audits。Exercise 2 可以在外部受支持环境（Supported Environment）构建和运行 learner-owned CUDA，但本页不提供 GPU output、timing、metric、occupancy、speedup 或 winner。每题有两层提示。完成自己的 acceptance checklist 前，不要打开[复核解答](/correctness/gemm-optimization-case-study/solutions/)。

## 练习 1：拒绝 memorized tile 并重建 comparison graph

**目标：** 修复一份 proposal：它声称“32-by-32 tile 最快”，只测 square aligned matrix 与 beta zero，遗漏 EX15 source revision 和 CPU oracle，并在一个 candidate 中同时改变 output shape、K depth、outputs per thread、compiler flags 与 precision。

**约束：** 保留 immutable EX15、row-major `A[M,K] * B[K,N] -> C[M,N]`、三个 canonical edge fixtures、FP32 device accumulation、double CPU accumulation、finite rejection 和 `absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)`。建立 `canonical-16x16x16 -> k-tile-16x16x8 -> rectangular-32x8x8 -> coarsened-32x16x8` 四阶段图。每条 edge 标记 `TM/TN/TK`、ownership、reuse、source shared bytes、accumulator count、coupling、support/reject/no-answer/rollback 和 competing explanations。不得填写 observed value。

**预期证据：** Defect list、修复后的 correctness gate、带标签的 stage graph、三份 adjacent source diffs、tile-load/reuse ledger、held-constant/coupling matrix 与 pre-result decisions。

**验收标准：** Memorized winner 与 confounded comparison 被拒绝。任何 stage 在通过同一 EX15 oracle/tolerance gate 前都不进入 measurement。每项 hypothesis 都可能失败或保持 unanswered，不能只凭 tile 数字论证。

<details><summary>提示 1</summary>在命名 profiler field 前，先计算 full-slice A/B values、completed outputs、K slices、barriers、source shared bytes 与 source accumulators。</details>

<details><summary>提示 2</summary>改变 tile shape 可能同时改变 reuse direction、grid size、edge waste、resources 与 instruction structure；应披露 bundle，不要发明单一 cause。</details>

## 练习 2：实现 EX15-derived 四阶段 runner

**目标：** 从 immutable [EX15](/examples/tiled-gemm/)派生 learner-owned `q13-gemm-candidates.cu`，不编辑 canonical files。实现 `build/q13-gemm-candidates --all-stages --m M --k K --n N --verify tolerance`，并按固定顺序运行四个 required stage IDs。

**约束：** 只 include 一次 canonical `tiled_gemm_reference.hpp`，直接调用 `ex15::matrix_counts`、`ex15::make_fixture`、`ex15::gemm_reference` 与 `ex15::verify_tolerance`。`2x3x2`、`33x31x35` 与 `32x32x32` 使用 exact `ex15::kFixtures` inputs 和各自 alpha/beta；只有声明的 `1024x1024x1024` workload 使用 learner-owned deterministic generator、`alpha=0.75` 与 `beta=0.25`。所有 stages 使用 256 threads；bounds-invalid shared slots 写 zero；每个 K slice 中所有 block threads 都到达两次 barriers。每个 stage 前恢复 original C bytes；检查 launch 与 `cudaDeviceSynchronize`；复制完整 C matrix；candidate 不能互相充当 oracle。每个 stage 暴露唯一 kernel function，避免 function-name profiler filter 把四个 template specializations 合并。Correctness runner 不加入 timing 或 profiler collection。

**预期证据：** Learner-owned source、EX15 files 未变化的证明、三份 adjacent source diffs、required CLI checklist、含 `sm_75`/`compute_75` 的 expanded C++17 command、source/build/binary SHA-256、stdout/stderr/status，以及每个 fixture/stage 的 EX15 tolerance records。GPU records 可以 absent，但不能伪造。

**验收标准：** Canonical stage 保留 EX15 的 16-by-16 ownership 与 p-order；K-tile stage 改变 `TK`，并披露 loop、barrier、storage、cooperative-load ownership、active-load-instruction 与 address-group effects；rectangular stage 实现 32-by-8 output ownership；coarsened stage 实现每 thread 两个 outputs。四个 unique kernel functions 与四个 stage IDs 一一映射。所有 stages 在 measurement 前独立通过 exact canonical fixtures 与同一 comparator。先完成自己的 source，再对照 Solution 2 链接的 reviewed implementation。

<details><summary>提示 1</summary>一份 templated kernel 可以共享 allocator、input generator、CPU oracle、comparator、zero fill 与 barriers，同时实例化四个 explicit tile/ownership coordinates。</details>

<details><summary>提示 2</summary>Cooperative linear load loop 可以让 256-thread block 填充元素数量不同的 tile arrays，又不在 barrier 前 early return。</details>

## 练习 3：审查 occupancy、traffic 与 production claim

**目标：** 审查一份摘要：它只有 friendly labels 与一个 occupancy percentage，没有 exact compiler resources、GPU、compute capability、metric query、permission、replay、report/hash、Environment Manifest、raw unprofiled samples 或 correctness result，却断言 coarsened tile 总是最快、使用了 Tensor Core，而且 educational kernel 可以取代 cuBLAS。

**约束：** 要求每个 stage 声明 matrix shapes、A/B/C 与 accumulation types、exact compute capability、workload/bytes、C restoration、warm-up、checked synchronization、retained statistics、profiler method/permissions、完整 Environment Manifest、EX15 tolerance result 与 bounded interpretation。分开 source requested-byte estimates、queried path traffic、compiler resources、theoretical occupancy、achieved occupancy 与 unprofiled elapsed samples。明确 L06/LAB12 尚未发布，不发明 cuBLAS API、Tensor Core path 或 result。

**预期证据：** Claim-by-claim verdict、missing-coordinate register、exact-GPU query-first repair plan、四份未填写 stage records、source/compiler/profiler/timing boundary table，以及至少五个 competing explanations。

**验收标准：** Universal、causal、architecture 与 production claims 全部被拒绝。每个修复后的 claim 足够窄，可得到 support、rejection 或 no answer。Missing measurements 继续标记 expected and unrecorded；production comparison 被推迟而不是猜测。

<details><summary>提示 1</summary>Source accumulators 与 shared arrays 是 resource hypothesis 的 inputs，不是 compiler 最终 register/local-memory allocation。</details>

<details><summary>提示 2</summary>即使 matched traffic direction 与较高 occupancy 都成立，也不能证明 elapsed difference 只有一个 cause，或能推广到其他 shape、precision、build 或 GPU。</details>

## 下一步

查看独立的[复核解答](/correctness/gemm-optimization-case-study/solutions/)，再完成 [PB-R3-011](/practice/#pb-r3-011)与 [PB-R3-012](/practice/#pb-r3-012)。获得 qualifying Environment Manifests 与 artifacts 前，runtime/performance cells 继续保持 expected and unrecorded。
