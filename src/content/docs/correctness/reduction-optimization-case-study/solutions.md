---
title: 'Q12 复核解答：受控 Reduction 证据'
description: 复核 EX11 baseline、四阶段 runner 与 profiler/numerical claim audit，并列出有效替代方案和常见错误。
pairId: q12-solutions
counterpart: /en/correctness/reduction-optimization-case-study/solutions/
factCheckDate: '2026-09-05'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: Q12-SOLUTIONS
prerequisites:
  - Q12-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q12-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/reduction-optimization-case-study/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q12-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q12-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/reduction-optimization-case-study/solutions/" lang="en">Read the English counterpart</a>

## 复核前说明

这里是 [Q12 练习（Exercise）](/correctness/reduction-optimization-case-study/exercises/)的 static reviewed solutions。它们提供 source/method review，不提供 GPU output、timing、metric、speedup 或 winner。Q12 是学习单元（Learning Unit），不授予证据状态（Evidence Status），并与本页一样保持四项 evidence arrays 为空；EX11 继续保持待硬件验证（Pending Hardware Verification）。

## 解答 1：拒绝并重建 baseline 与 hypothesis graph

原 proposal 被拒绝。Final scalar alone不能证明每个 stage 的 bounds、identity、barrier participation 或 operation tree；unpinned source、missing CPU oracle/tolerance 与四项同时变化也使 performance attribution 无效。

修复方案先锁定 EX11 revision `81d43aa7568514e37ef190da59c845b8072b7011`、double CPU reference、finite comparator、`1/3/511/512/513/4099` edge fixtures 与 `4099 -> 9 -> 1` stage DAG。Variant graph 再建立 `canonical-shared-tree -> warp-tail-control -> reassociated-warp-order -> four-load-staging`。第一条 edge 明确披露 divergence/synchronization/shared-access bundle；第二条改变 warp operand/active-lane schedule，同时保持五次 shuffles 与 31 次有效 additions；第三条改变 loads per thread，并把 local additions/order 列为 coupling。每条 edge 分别拥有 support、reject、no-answer 与 rollback。

**复核：** 通过。Correctness gate、source-derived mechanism 与 GPU observation保持分离，任何 stage 都没有预填结果。

## 解答 2：复核 runner implementation

完成自己的 Exercise 2 后，可以[下载一份原创 reviewed runner](/assets/exercise-solutions/q12-reduction-candidates.cu)。Repository path 是 `public/assets/exercise-solutions/q12-reduction-candidates.cu`，精确 SHA-256 是 `a7dde4a836c44b296d62a92e7131f43f568857ff8bb910a8edad6d28a821c106`。它是一份 Apache-2.0 reviewed solution，不是第二份 canonical EX11，不是新的可运行示例（Runnable Example），也不授予任何 Evidence Status。

Runner include canonical header并直接调用 `ex11::initialize_input`、`ex11::cpu_reference_sum` 与 `ex11::compare_reduction_sum`。四个 kernels/stages 顺序固定。每个 algorithm重用同一 input allocation和两份 stable partial allocations；运行前用 checked copies写 quiet-NaN sentinels，随后检查 launch、完整 multi-kernel completion与最终 scalar readback，并由独立 CPU result和同一 tolerance判定。Candidate不能互相充当 oracle。

从 repository root、在已有 `build/` directory 下使用的 expanded C++17 command 是：

```bash
nvcc \
  --std=c++17 \
  --generate-code=arch=compute_75,code=sm_75 \
  --generate-code=arch=compute_75,code=compute_75 \
  --include-path examples/ex11-multi-stage-reduction/include \
  public/assets/exercise-solutions/q12-reduction-candidates.cu \
  --output-file build/q12-reduction-candidates
```

三条 pinned `cuda-11.8`、`cuda-12.9` 与 `cuda-13.3` gates只 compile、link并 static-inspect这个 exact source；它们不执行 binary。Learner alternative 可以使用不同内部组织，但必须保留 required CLI、四个 IDs/顺序、canonical oracle、stage-size/operand ledgers、C++17 build records与 source/build/binary hashes。

**复核：** 通过。Reviewed source保持 EX11 immutable，显式处理 warp participation与 numerical-order change，并输出 correctness labels而不输出 performance result。

## 解答 3：拒绝 profiler、bitwise 与 production claim

摘要中的 universal、causal、bitwise 与 fastest claims全部拒绝。Friendly label没有 exact metric name、unit、scope或 availability；没有 permission/replay/filter/report custody就没有 profiler observation；没有 matched raw unprofiled attempts就没有 elapsed comparison；tolerance pass也不等于 bitwise reproducibility。

修复后的四项 stage records 各自声明 fixed workload、三次 excluded warm-up、checked synchronization、十次 retained attempts 与 predeclared median/min/max、exact-GPU query-first profiler method、permission gate、完整环境清单（Environment Manifest）、同一 comparator correctness result，以及只回答 named mechanism 的 bounded interpretation。所有 result fields 保持 `expected; unrecorded`。Competing explanations 包括 instruction mix、shared traffic、resource use、cache state、clock/thermal state、replay perturbation 与 numerical-order coupling。

Production CUB comparison 现在属于已发布的 [L03](/libraries/cub-device-primitives/)与 [LAB11](/labs/compare-custom-reduction-with-cub/)。它们不会回填本题缺失的 evidence；Q12 仍不提供 CUB build、runtime、timing 或 performance result。

**复核：** 通过。Unsupported claims被降级，missing evidence没有被 zero、guess或 browser state替代。

## 有效替代方案

- 四个 candidates可以从同一个 correctness-qualified EX11-shaped baseline分叉，只要每条 branch保留独立 diff、hypothesis与collection record。
- Warp-tail 可以使用另一项在三条工具包通道（Toolkit Lane）均明确支持的 primitive，但必须重新声明 participant mask、operation tree 与 source boundary。
- Measurement workload可以改变，但它会建立新 comparison；两侧必须使用相同 bytes、stage graph、warm-up、completion、statistics与correctness cadence。
- 另一项 exact queried section或short metric list可以回答同一 question，只要保存 definition、unit、scope、availability与report custody。

## 常见错误

- 只检查 final scalar，却不保存 EX11 revision、CPU reference、tolerance或stage DAG。
- 让 bounds-invalid thread return before a block barrier，或依赖 implicit warp lockstep。
- 把 warp-tail bundle写成单因果改动，却隐藏 branch、barrier、shared access与instruction changes。
- 因 tolerance通过就宣称逐 bit一致、deterministic或cross-GPU reproducible。
- 把更少 partial elements直接称为 measured DRAM traffic或speedup。
- 在查看 samples后改变warm-up、删除outlier或选择statistic。
- 把 permission denial/unavailable metric写成 zero，或用screenshot替代 report/hash。
- 从 VIS10 integer tree推断GPU schedule、floating-point result或performance。
- 因为 L03/LAB11 已发布，就把其 API contract 当成这份 Q12 summary 的 comparison result。

复核日期：**2026-09-05**。继续使用 [PB-R3-009](/practice/#pb-r3-009)与 [PB-R3-010](/practice/#pb-r3-010)完成迁移练习。
