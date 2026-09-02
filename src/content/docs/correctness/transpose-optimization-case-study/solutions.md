---
title: 'Q11 复核解答：受控 Transpose 证据'
description: 复核 EX14 baseline 修复、LAB10 四阶段 runner handoff 和 bank-layout profiler-claim 审计，并列出有效替代方案与常见错误。
pairId: q11-solutions
counterpart: /en/correctness/transpose-optimization-case-study/solutions/
factCheckDate: '2026-09-02'
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
unitId: Q11-SOLUTIONS
prerequisites:
  - Q11-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q11-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/transpose-optimization-case-study/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-02' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q11-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/transpose-optimization-case-study/solutions/" lang="en">Read the English counterpart</a>

## 复核前说明

这里是 [Q11 Exercises](/correctness/transpose-optimization-case-study/exercises/)的 static reviewed solutions。它们修复 implementation/experiment contract 与 evidence claim，不提供 CUDA output、profiler value、timing、tile winner 或 speedup。Q11 是 Learning Unit，本身不授予 Evidence Status；linked [EX14](/examples/tiled-transpose/)与 [LAB10](/labs/optimize-canonical-transpose/)目前都为 Pending Hardware Verification，且 recorded observations 为空。本 Solution page 的四项 evidence arrays 也全部为空。

## 解答 1：拒绝并重建 EX14 baseline

拒绝 supplied baseline。它没有绑定 immutable EX14 revision，遗漏两个 rectangular/partial-tile fixtures，不检查 output shape，也没有完整 exact comparison 或 recorded build/run identity。Square-only output 不能建立 edge 与 leading-dimension contract。

修复后的 acceptance gate 指定 immutable source revision，并要求 `5x7`、`33x35`、`64x32`，output shape 为 `columns x rows`，逐元素 exact equality，且满足 `output[col * rows + row] = input[row * columns + col]`。Measurement-baseline packet 还需要 source/patch 与 binary hashes、build command/result、Environment Manifest、launch arguments、完整 correctness log、observer 与 observation date。字段不全时，它仍只是 plan。

一行有效的 pre-result ledger 把 padding stride 写成 one primary variable，只预测 shared-address/bank-index mapping 变化，冻结 logical coordinates 与全部 comparison fields，并预先声明 support、reject、no-answer、rollback，以及 changed shared footprint 等至少一个 competing explanation。“Padding 应改善 performance”被拒绝，因为它没有可检验 evidence scope 与 failure branch。

**复核：** 通过。Correctness 先于 measurement，acceptance baseline 与 recorded baseline 保持分离，ledger 不暗藏结果。

## 解答 2：复核 learner-owned runner 并交接 LAB10

完成自己的 Exercise 2 尝试后，可以[下载一份完整的原创 reviewed runner](/assets/exercise-solutions/q11-lab10-transpose-candidates.cu)。其 repository path 是 `public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu`，精确 SHA-256 为 `920a4ca6f44586a3882e31756fca3e28feb655282327721e3fb3a308bac3f251`。这是 Apache-2.0 下的一份 reviewed solution，不是第二份 canonical EX14、不是新的 Runnable Example，也不改变 immutable [EX14](/examples/tiled-transpose/) files 或 canonical ranges。学习者自己的替代实现仍然有效，但必须满足相同 interface、四阶段、independent EX14 oracle、adjacent-stage diff 与 source/build/binary hash contract。

这份合格 handoff 从 immutable EX14 派生，按固定顺序定义四个可单独审计的 kernels/stages：frozen direct `baseline-direct`；只改变 thread-to-coordinate direction 的 `coalescing-direction`；使用无 padding `32x32` shared tile 的 `shared-memory-tiling`；以及只把 physical shared stride 改为 `32x33` 的 `padded-bank-layout`。三个 adjacent-stage source comparisons 证明一次只改变一个 primary variable，canonical files 保持未修改。

Driver 必须实现 exact interface `build/lab10-transpose-candidates --all-stages --rows ROWS --columns COLUMNS --verify exact`，并继续使用独立 EX14 CPU oracle，而不是让 candidates 互相验证。它使用 finite、non-NaN deterministic input/oracle values；每个 correctness、warm-up 与 profiled process 只创建一份 stable device output allocation，并在四阶段间保持同一 allocation/address。在 `5x7`、`33x35`、`64x32` 与 `4096x4096` 的每个 stage launch 紧前，driver 都通过 checked host-to-device copy 把 complete output 填为 quiet-NaN sentinel 并检查 CUDA status；随后 launch、检查 `cudaDeviceSynchronize`、通过 checked device-to-host copy 取回 complete output，再要求完整 transposed shape、`output[col * rows + row] = input[row * columns + col]`、每个 element exact oracle equality，且 no sentinel remains。Sentinel fill/readback 保持在 selected kernel metrics 外，identical procedure 与 allocation/address 都是 held constants。

从 repository root、在已有 `build/` directory 下执行的精确 C++17 NVCC compile/link command 是：

```bash
nvcc \
  --std=c++17 \
  --generate-code=arch=compute_75,code=sm_75 \
  --generate-code=arch=compute_75,code=compute_75 \
  --include-path examples/ex14-tiled-transpose/include \
  public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu \
  --output-file build/lab10-transpose-candidates
```

Source/build packet 保留这项 expanded command、log/status artifact、生成的 `build/lab10-transpose-candidates`，以及 source、三个 adjacent comparisons 或 learner alternative diffs、build records 与 binary 的 SHA-256。Per-stage audit 还必须证明 stable allocation/address、每次 prelaunch full-output sentinel copy status、checked synchronization、complete-output readback、exact comparison 与 no-sentinel-remains result。本站只在 pinned `cuda-11.8`、`cuda-12.9` 与 `cuda-13.3` 三条 Toolkit Lanes 上对该 reviewed asset 执行 compile/link 与 static artifact inspection gate；gate 不执行 binary，不产生 runtime observation，也不授予 Q11、Solution page、LAB10、EX14 或该 asset 任何 Evidence Status。Timing、profiler query/report、Environment Manifest 与 runtime custody 仍由 Lab 执行阶段负责。

**复核：** 通过。Reviewed asset 的 exact path/hash、required CLI、四阶段、oracle、fixtures、stable allocation、quiet-NaN stage independence、fill/copy CUDA statuses、synchronization、complete readback、build 与 hash contracts 都可审计，而且没有预填结果或让 sequential stage false-pass 的路径。把该 asset 或满足同一 contract 的 learner alternative packet 带入 guided follow-on [LAB10：优化 canonical transpose](/labs/optimize-canonical-transpose/)完成 GPU correctness 与 profiler workflow。

## 解答 3：拒绝并收窄 bank-layout claim

拒绝 supplied claim。Screenshot 与 friendly label 没有标识 exact metric、unit、denominator、scope、exact GPU、tool version、kernel occurrence、filter、replay、permission、workload 或 report artifact。Packet 也没有证明 `T` 与 `T+1` 是唯一 physical change。VIS11 arithmetic 不能填补任何 missing observation。

修复后的 plan 先 exact-pass EX14，再 hash `T2` 与 `P3`，并冻结 logical tile shape、global mapping、launch、workload、compiler 与 timing。它保留 `ncu --version`、`ncu --list-sections`、`ncu --query-metrics`、permission outcome、exact metric definition、完整 commands、独立 `.ncu-rep` hashes、filter/replay records 与 matched unprofiled raw timing。Narrow claim 只能涉及这些 reports 上的 named shared-access mechanism。

竞争解释（competing explanations）包括 shared-memory footprint/residency 变化、不同 generated access instruction、cache/clock drift、replay perturbation、run-order effect 与普通 sample variation。Conflict-related field 可以支持 access hypothesis，但不能单独归因 elapsed-time change；Q10 traffic 或 Roofline geometry 同样不能提供 causality。

**复核：** 通过。原 causal claim 被拒绝；修复方案 query-first、可复核，并保留 unresolved alternatives。

## 有效替代方案

- Learner-owned directory 与 build system 可以不同，但不能编辑 canonical EX14；required source filename、binary path、CLI、四个 stage IDs 与 hash custody 必须保持不变。
- Coalescing evidence 可来自另一项 current queried section 或 exact metric list，只要 documented definition 回答同一 lane/address question。
- 另一项 logical extent 可以开始独立 APOD pass，但 LAB10 handoff 仍固定无 padding `32x32` tiling 与 `32x33` padded layout。
- 另一种 physical stride 或 element width 属于独立实验，不能替换 required `shared-memory-tiling -> padded-bank-layout` adjacent diff。
- Run ordering 可以 blocked 或 interleaved，只要在查看结果前声明并对称应用。

## 常见错误

- 把 source inspection、host test 或一份正确 square output 叫作 recorded GPU baseline。
- 在三个 EX14 fixtures 与 output-shape checks 全部通过前 timing candidate。
- 编辑 canonical EX14 files，或让 candidate output 代替独立 CPU oracle。
- 改写 required CLI、stage IDs、`32x32`/`32x33` layouts 或 fixed stage order。
- 同时改变 lane mapping、shared staging、padding、tile extent、block geometry 与 workload。
- 忘记在每个 stage 后调用并检查 `cudaDeviceSynchronize`，或缺失 source/diff/build/binary hashes。
- 把 adjacent-address arithmetic 当作 observed transaction count。
- 从另一块 GPU 或另一 tool version 选择 metric name，而不查询 exact environment。
- 绕过 permission denial，或把 unavailable field 写成 zero。
- 直接比较 profiler-replayed duration 与 unprofiled timing sample。
- 把 conflict field、traffic change、Roofline region 或 VIS11 browser state 当作 causal proof。
- 只保留 ratio，却丢弃 raw samples、filters、commands、reports 或 competing explanations。

复核日期：**2026-09-02**。这些 Solution pages 的 evidence arrays 为空；Q11 本身不授予 Evidence Status，也不继承 EX14 或 LAB10 的状态。继续使用已发布的 [PB-R3-007](/practice/#pb-r3-007)与 [PB-R3-008](/practice/#pb-r3-008)，并把 runner 交给 guided [LAB10](/labs/optimize-canonical-transpose/)。
