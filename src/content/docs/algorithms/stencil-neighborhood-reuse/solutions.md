---
title: 'A06 复核解答：Boundary Policies、2D Halos 与 Reuse Arithmetic'
description: 复核 A06 三道练习的 boundary vectors、center/side/corner coverage、uniform phase repair、复用预算、有效替代方案与常见错误。
pairId: a06-solutions
counterpart: /en/algorithms/stencil-neighborhood-reuse/solutions/
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
unitId: A06-SOLUTIONS
prerequisites:
  - A06-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a06-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/stencil-neighborhood-reuse/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A06-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/stencil-neighborhood-reuse/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A06 练习](/algorithms/stencil-neighborhood-reuse/exercises/)的独立复核页。结果 vectors、coverage proofs 和 request counts 都是静态 reasoning；没有 CUDA executable、runtime observation 或 measured performance。

## 解答 1：对同一输入推导四种 boundary contracts

Interior neighborhoods 是 `[2,4,6]` 与 `[4,6,8]`，因此 positions 1、2 的 sums 分别是 12、18。

- `valid` output domain 只有 positions 1、2，vector 是 `[12,18]`。
- `zero` 把域外值定义为 0：position 0 使用 `[0,2,4]`，position 3 使用 `[6,8,0]`，vector 是 `[6,12,18,14]`。
- `clamp` 把 -1 映射到 0、4 映射到 3：edge values 是 `[2,2,4]` 与 `[6,8,8]`，vector 是 `[8,12,18,22]`。
- `periodic` 把 -1 wrap 到 3、4 wrap 到 0：edge values 是 `[8,2,4]` 与 `[6,8,2]`，vector 是 `[14,12,18,16]`。

Reasoning 先映射 requested index，再读取或生成 boundary value，因此 reference 不会执行 out-of-bounds read。四个 vectors 不同是合同选择的结果，不是 implementation tolerance。

## 解答 2：覆盖 center、side halos 与 corner halos

Output center 是 `3 x 4`，radius 1 后 staged rectangle 是 `(3+2) x (4+2) = 5 x 6`，共 30 positions。Row-major linear assignment 为：

| thread | staged linear indices |
| ---: | --- |
| 0 | `0,8,16,24` |
| 1 | `1,9,17,25` |
| 2 | `2,10,18,26` |
| 3 | `3,11,19,27` |
| 4 | `4,12,20,28` |
| 5 | `5,13,21,29` |
| 6 | `6,14,22` |
| 7 | `7,15,23` |

每个 `q` 映射到 `(sy=floor(q/6), sx=q mod 6)`。四个 corners 0、5、24、29 分别由 threads 0、5、0、5 定义；它们是 staged rectangle 的独立 cells，不再重复计入只有 center-width/height 的 side strips。八条 arithmetic progressions 按 residue modulo 8 partition `0..29`，所以 coverage complete 且 writer unique。所有 8 threads 在 loops 结束后参加 barrier，即使 threads 6、7 只有三次 load。

## 解答 3：修复 early return 并计算复用预算

修复后的 phase reasoning 是：先计算 `output_valid`；所有 threads 仍按 staged linear stride分配 loads，对域外 coordinate 依据 `zero` policy 写 0；全 block barrier；只有 `output_valid` 的 owner 读取 shared neighborhood、compute 并 store。Predicate 控制 value action，不控制 rendezvous。

一维 direct logical requests 是 `B(2r+1) = 8*5 = 40`，complete staged unique positions 是 `B+2r = 8+4 = 12`。二维 direct requests 是 `8*8*(2*1+1)^2 = 64*9 = 576`，complete staged rectangle 是 `(8+2)*(8+2) = 10*10 = 100` positions。

Reasoning 可以把 `40/12` 与 `576/100` 记作 request-count reuse opportunities。它们没有包括 cache behavior、global transactions、cooperative overhead、barrier、shared capacity 或 architecture，因此 observed timing、throughput 与 speedup fields 保持 `unrecorded`。

## 有效替代方案

- Exercise 1 可用显式 padded input array 表达 `zero` 或 `periodic`，只要 reference mapping 与 output domain 不变。
- 2D loader 可以采用二维 thread assignment，而不是 linear stride；必须仍覆盖 center、sides 和 corners，且 writer contract 明确。
- Sparse cross stencil 可以省略 unused corners，但要重新声明 footprint 和 coverage proof。
- 多个 loads 可由不同 threads 分担，只要每个 staged slot 在 barrier 前已定义且没有错误 race。
- Direct non-shared baseline 是有效 correctness comparison；它不需要假装拥有 shared reuse。

## 常见错误

- 用同一 edge output 同时混合 clamp、zero 与 periodic values。
- 对负 index 使用语言的 remainder 结果，却没有规范化到 `[0,n)`。
- 只加载 top/bottom/left/right strips，漏掉 square stencil 的 corners。
- 因某个 thread 没有 staged load 或合法 output 就让它在 barrier 前 return。
- 将 `B+2r` 错写成 `B+r`，或把 corners 在 staged rectangle 中重复计数。
- 把 logical request-count ratio 当作 transaction ratio、timing 或 speedup。
- 把 asynchronous copy 当作 A06 correctness baseline 的必要条件。

复核日期：**2026-08-30**。四个 evidence arrays 保持为空。
