---
title: 'Q13 复核解答：受控 GEMM 证据'
description: 复核 EX15 baseline、四阶段 GEMM runner，以及 resource、profiler、architecture 与 production-claim audit，并列出替代方案和常见错误。
pairId: q13-solutions
counterpart: /en/correctness/gemm-optimization-case-study/solutions/
factCheckDate: '2026-09-03'
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
unitId: Q13-SOLUTIONS
prerequisites:
  - Q13-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q13-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/gemm-optimization-case-study/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q13-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q13-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/gemm-optimization-case-study/solutions/" lang="en">Read the English counterpart</a>

## 复核前说明

这里是 [Q13 练习（Exercise）](/correctness/gemm-optimization-case-study/exercises/)的 static reviewed solutions。它们提供 source/method review，不提供 GPU output、timing、metric、occupancy、traffic、speedup 或 winner。Q13 是学习单元（Learning Unit），不授予证据状态（Evidence Status），四个 evidence arrays 均为空；EX15 继续保持待硬件验证（Pending Hardware Verification）。

## 解答 1：拒绝并重建 tile graph

拒绝原 proposal。Memorized 32-by-32 label 没有说明 block legality、ownership、K depth、edge behavior、reuse、compiled resource、workload、precision 或 hardware。Square aligned beta-zero cases 漏掉 partial M/N/K 与 initial-C behavior。Unpinned source 和缺失 independent oracle 使正确性也无法审计；同时改变五个变量使 attribution 无效。

修复后的 baseline 固定 EX15 revision `d03ff3b27294f77b5f5a0a3b594bebf20a89cf70`、三个 fixtures、row-major equation、FP32 device accumulation、double CPU accumulation、finite rejection 与 absolute-plus-relative comparator，再建立 `canonical-16x16x16 -> k-tile-16x16x8 -> rectangular-32x8x8 -> coarsened-32x16x8`。第一条 edge 隔离 K depth，并披露 barrier、storage、cooperative-load ownership、active-instruction 与 address-group coupling；第二条把 directional reuse 与 grid/edge shape 作为 bundle；第三条改变 output ownership/reuse，并披露 accumulator/register、grid 与 dependency coupling。每条 edge 都有 support、reject、no-answer 与 rollback branches。

**复核：** 通过。Correctness、source arithmetic、compiler resources、GPU observations 与 elapsed results 分列，没有预选 tile。

## 解答 2：复核 runner implementation

完成自己的 Exercise 2 后，可下载原创 [reviewed runner](/assets/exercise-solutions/q13-gemm-candidates.cu)。Repository path 是 `public/assets/exercise-solutions/q13-gemm-candidates.cu`，精确 SHA-256 是 `00a809be2e2224022f4dce544fd84cba7144a97918a2c0b2a17768054514ecc7`。它是一份 Apache-2.0 reviewed solution，不是第二份 canonical EX15，不是新的可运行示例（Runnable Example），也不授予任何 Evidence Status。

Runner include canonical `tiled_gemm_reference.hpp`，并直接调用 `ex15::matrix_counts`、`ex15::make_fixture`、`ex15::gemm_reference` 与 `ex15::verify_tolerance`。它通过 `ex15::kFixtures` 识别三个 canonical shapes，保留 exact inputs 与 alpha/beta；只有 measurement shape 使用 reviewed deterministic generator。一个 C++17 device-body template 在四个 uniquely named kernel wrappers 后实现四组 explicit tile/ownership coordinates，因此 `--kernel-name-base function` 可以唯一选择 stage，不会合并 template specializations。Cooperative linear load loop 为 bounds-invalid shared slots 写 zero，所有 256 threads 都到达两次 block barriers。每个 stage 恢复 initial C，检查 launch 与完整 `cudaDeviceSynchronize`，复制完整 output，再与 independent double result 比较。Candidates 不互相充当 oracle。

从 repository root、在已有 `build/` directory 下使用的 expanded C++17 command 是：

```bash
nvcc \
  --std=c++17 \
  --generate-code=arch=compute_75,code=sm_75 \
  --generate-code=arch=compute_75,code=compute_75 \
  --include-path examples/ex15-tiled-gemm/include \
  public/assets/exercise-solutions/q13-gemm-candidates.cu \
  --output-file build/q13-gemm-candidates
```

Pinned `cuda-11.8`、`cuda-12.9` 与 `cuda-13.3` gates 只 compile、link 与 static-inspect 这份 exact source，不执行。有效 learner alternative 可以改变内部组织，但要保留 CLI、stage IDs/order、EX15 oracle/comparator、C restoration、C++17 targets、fixture records 和 source/build/binary hashes。

**复核：** 通过。Reviewed source 保持 EX15 immutable，显式给出 tile/ownership coordinates，只输出 correctness labels，不输出 performance result。

## 解答 3：拒绝 resource、architecture 与 production claims

四项结论全部拒绝。没有 compiled registers/shared/local memory 与 exact device limits，friendly occupancy label 不能建立 theoretical occupancy。没有 exact metric definition、scope、GPU、version、query、report 与 custody，一个百分比不能建立 achieved occupancy。两者都不是 speed score。缺少 matched unprofiled samples，不能比较 elapsed；缺失 correctness 会在 performance interpretation 前拒绝所有 candidates。

Source 使用普通 FP32 multiplication/addition、shared arrays 与 block barriers；没有 Tensor Core、WMMA、MMA 或 architecture-specific branch。不能从 source-level multiply-accumulate panel 推断 emitted instructions。每份修复后的 stage record 都重复 `1024x1024x1024`、FP32 inputs/output/device accumulation、double CPU reference、exact compute capability、C restoration、三次 excluded warm-ups、checked completion、十次 retained attempts 和 median/min/max、query-first profiler method、permission、完整 Environment Manifest、EX15 tolerance result 与 named bounded interpretation。Source estimates、compiler resources、theoretical occupancy、achieved occupancy、queried path traffic 与 unprofiled elapsed samples 保持分列。

L06 与 LAB12 尚未发布。Educational kernel 缺少 production-library contracts，不能替代 cuBLAS。这里不提供 API 或 comparison 来修补这项 claim。

**复核：** 通过。Unsupported universal、causal、architecture 与 production statements 被拒绝；missing evidence 继续 expected and unrecorded，不被写成 zero 或 guess。

## 有效替代方案

- 三个 candidates 可以从同一个 correctness-qualified EX15-shaped baseline 分叉，只要每条 branch 保留独立 diff、ledger 与 matched collection record。
- 可以选择另一个带标签的 `TM/TN/TK` coordinate，但要推导 block legality、ownership、edge behavior、reuse arithmetic、resources 与 reject rules，而不是背诵。
- 可以使用另一 deterministic measurement shape，但它是新 comparison，必须重算 bytes、grid/edge behavior、work convention 与全部 retained coordinates。
- 可以使用另一 exact queried section 或 short metric list，只要 definition、unit、scope、availability、normalization、filter 与 report custody 回答同一个 frozen question。
- 可以保留每 thread 一个 output，只改变一个 output-tile dimension；问题更窄，但仍需要 compiled-resource 与 correctness records。

## 常见错误

- 写 `32x32` 却不标 `TM`、`TN`、`TK`、block dimensions、outputs per thread 或 hardware legality。
- 只测 square、tile-aligned、beta-zero matrices，漏掉 partial tiles 或 stale C input。
- Invalid output owner 在 block barrier 前 return，尽管它仍可能拥有合法 shared load。
- 把 source shared bytes 或 accumulator count 称为最终 register allocation 或 occupancy。
- 把 theoretical/achieved occupancy 当作 maximization target 或 speed proof。
- 把 source-requested tile bytes 称为 observed DRAM traffic，或不声明 normalization。
- 在 tile comparison 中改变 precision、fast-math、target architecture 或 compiler flags，却不建立新 edge。
- 从 source syntax 或 VIS12 推断 Tensor Core 或 FMA/MMA instructions。
- 只保留 ratio/screenshot，不保留 raw attempts、query output、report、command、status 与 hashes。
- 在 L06 发布前写 cuBLAS API/result 或 LAB12，或把 educational kernel 称为 production replacement。

复核日期：**2026-09-03**。继续使用 [PB-R3-011](/practice/#pb-r3-011)与 [PB-R3-012](/practice/#pb-r3-012)。
