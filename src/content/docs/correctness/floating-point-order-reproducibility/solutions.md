---
title: 'Q02 参考解答：审查数值顺序与复现 contract'
description: Q02 三道练习的 reduction-order hand trace、FMA/compiler ledger review，以及 tolerance、determinism、bitwise reproducibility claim matrix。
pairId: q02-solutions
counterpart: /en/correctness/floating-point-order-reproducibility/solutions/
factCheckDate: '2026-08-30'
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
unitId: Q02-SOLUTIONS
prerequisites:
  - Q02-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/floating-point-order-reproducibility/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [Q02 练习（Exercise）](/correctness/floating-point-order-reproducibility/exercises/)的参考答案。以下内容是 static hand reasoning 与 review templates，不是 compiled executable、GPU observation 或 bitwise evidence。

## 解答 1：手算两种 reduction order

设每个 `rn` 都存回 binary32：

```text
left fold:
rn(a + b)       = rn(1e20f + -1e20f) = 0.0f
rn(0.0f + c)    = 3.14f               = rounded c

other tree:
rn(b + c)       = -1e20f              = c is below local spacing
rn(a + -1e20f)  = 0.0f
```

因此 `(a + b) + c` 得到 stored `3.14f`，而 `a + (b + c)` 得到 `0.0f`。Real arithmetic 中两式相等；binary32 中第一次 rounding 丢掉的 quantity 不同。Serial left fold 对 input order `[a,b,c]` 使用第一棵树；先形成 partial `(b+c)` 的三叶树使用第二棵树。

这项结果既不需要 race，也不证明某棵树普遍更 accurate。它只证明 parenthesization/reduction order 是 numerical algorithm 的一部分。

## 解答 2：审查 FMA 与 compiler/environment ledger

| Profile | Effective semantic review | 可以声称什么 |
| --- | --- | --- |
| A: `--fmad=true` | 普通 `alpha*x + beta` 可以 contraction 为 `rn(alpha*x+beta)`，只做一次 rounding；是否实际 contraction 仍取决于 expression 与 compilation | Contraction permitted；不能凭 flag 声称每个 expression 已 fused |
| B: `--fmad=false` | 普通 expression 保持 `rn(rn(alpha*x)+beta)` 的两次 rounding；explicit FMA 仍是 explicit FMA | Implicit contraction disabled；不表示跨 compiler/GPU bitwise portable |
| C: `--use_fast_math` | 蕴含 `--ftz=true --prec-div=false --prec-sqrt=false --fmad=true`，并可能采用 accuracy contract 不同的 intrinsics | 形成另一项 numerical configuration；原 tolerance rationale 必须重新审查 |

一份最小完整 ledger 如下：

| Scope | Record |
| --- | --- |
| Source/algorithm | commit、EX11 `cpu-reference`/GPU variant、stage pairings |
| Input | type、size、exact bytes、logical order、non-finite policy |
| Build | Toolkit、`nvcc`、host compiler、target architecture、完整/effective flags、explicit intrinsics |
| Environment | GPU、compute capability、driver、OS、relevant variables、math/CUB version 与 selected policy |
| Launch | grid/block shape、elements per thread、partial order、stream/atomic strategy |
| Claim | same-build 或 cross-build scope、comparator、predeclared `atol`/`rtol` rationale |

A/B/C 改变 FMA/rounding policy；C 还改变 denormal、division、square-root 与 selected function paths。即使 EX11 当前 fixture 只触发其中一部分，ledger 也应保留完整 effective configuration。没有 observed outputs 时只能审查 semantics，不能预告 exact bits。

## 解答 3：把三种 claim 拆成三个 tests

| Claim | Fixed setup | Comparator | Pass 的含义 |
| --- | --- | --- | --- |
| Numerical acceptance | exact input；独立 serial CPU reference；预先论证的 non-finite 与 scale policy | `abs(g-r) <= atol + rtol*abs(r)` | Candidate 满足这个 problem-specific accuracy contract；不涉及 repeatability |
| Determinism | same source/build/device/input/launch/library policy；固定 algorithm 与 reduction-order controls | 声明的 run-to-run observable/equality predicate，并保存每次 raw output | 在该 scope 内没有观察到 contract 禁止的 algorithm/order variation；不外推到另一 environment |
| Bitwise reproducibility | 两个明确命名的 environments 与完整 ledgers；exact same input bytes | exact floating representations，包括声明的 zero/NaN policy | 只在这两个 environment 与该 comparison scope 间观察到 identical bits |

一个有效反例是：固定 executable 的 unordered atomic reduction 每次产生略有不同的 low bits，但全部通过合理 tolerance；它满足 numerical acceptance，却不满足所声明的 deterministic-order 或 bitwise checks。另一个反例是 deterministic kernel 每次产生同一错误值：它可以满足 run-to-run bitwise equality，却不通过 numerical acceptance。

Failure record 保留 exact inputs、每次 raw output bits、first differing index/value、CPU reference、`error`/`limit`、algorithm/tree identifier、compile commands、Environment Manifest 与 launch policy。三行分别 verdict；tolerance acceptance 绝不写成 bitwise reproducibility。

## 有效替代方案

- 若 domain 有依据，可用 ULP bound、interval oracle 或 error bound 替代 reference-anchored abs+rel formula，但要把它命名为另一项 numerical contract。
- Pairwise、compensated 或 higher-precision summation 可以改善 error behavior；它们改变 algorithm，必须重新记录 order 与 acceptance rationale。
- 可以调用 pinned CUB primitive 并请求其明确支持的 determinism guarantee；claim 只能采用该 CCCL version、algorithm、type/operator constraints 与 scope。
- 需要明确 one-rounding semantics 时，可用 explicit FMA intrinsic/function，而不是从 optimization level 猜测 contraction。
- Cross-lane check 可以逐步扩大 scope：先 same executable run-to-run，再 same build/same GPU class，最后才是 named Toolkit/architecture pairs。

## 常见错误

- 把 real-number associativity 当成 floating-point associativity。
- 要求 parallel reduction 逐 bit 等于不同顺序的 serial CPU reference，却没有固定相同 operation graph。
- 把 `--fmad=false` 当作 universal accuracy fix 或 portability guarantee。
- 把 `--use_fast_math` 误写成只影响 performance、不影响 numerical semantics。
- 看到 mismatch 后增大 tolerance，或把 tolerance pass 标注为 bitwise reproducibility。
- 把 deterministic result 当成 correct result，或把 fixed random seed 当成 fixed reduction order。
- 只记录 Toolkit major version，遗漏 compiler flags、target、driver、GPU、library policy 与 launch geometry。
- 从 static page、source excerpt 或 hand calculation 宣称 runtime Evidence Status。

复核日期：**2026-08-30**。Compilation、runtime、expected-observation 与 recorded-observation evidence axes 保持为空。
