---
title: 'M01 参考解答：签发内存对象责任合同'
description: M01 三道练习的 owner/scope/lifetime ledger、release 修复和可复核 placement 改写。
pairId: m01-solutions
counterpart: /en/memory/address-spaces/solutions/
factCheckDate: '2026-08-27'
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
unitId: M01-SOLUTIONS
prerequisites:
  - M01-EXERCISES
relatedUnits:
  - M01
  - VIS06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m01-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M01,VIS06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/address-spaces/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [M01 练习（Exercise）](/memory/address-spaces/exercises/)的**参考解答**。先比较责任边界，再比较术语。所有结果来自静态审查；没有 CUDA build 或 run。

## 解答 1：完成六对象 ledger

| 对象 | creator / owner | 共享 scope | lifetime / release | physical / 未决事实 |
| --- | --- | --- | --- | --- |
| `std::vector<float>` | host language object | host scope | C++ object lifetime；destructor 管理 | host memory；device access 未建立 |
| `cudaMalloc` buffer | host Runtime call | 持有合法 pointer 的 device thread 可共享 | 最后 use 完成后 `cudaFree` | global/device memory；cache behavior 未测 |
| `__constant__` coefficients | module/context symbol | grid 可读，host 用 symbol API 更新 | module/context 管理，不 `cudaFree` | device constant space；具体 cache behavior 未测 |
| `__shared__` tile | 每个 block 的 declaration/launch storage | owning block | block completion 自动结束 | shared resource；capacity 取决于 device/kernel |
| local array | compiler 为一个 thread 管理 | owning thread | thread invocation 自动结束 | physical device memory；placement 由 compiler 决定 |
| scalar accumulator | source value，compiler 分配 | owning thread | thread invocation 自动结束 | 可能 register，也可能 spill 到 local |

关键区分是 local array 的 **scope** 与 **location**。它不会因为位于 device memory 就成为 global shared object。Accumulator 也只有 source semantics；没有 compiler artifact 时，register placement 是未知事实。

## 解答 2：修复错误的 release plan

原 plan 的四处错误分别是：launch return 没证明 global buffer 的最后 use 完成；host 不拥有 per-block shared allocation；thread 不会对 compiler-managed local storage 调用 Runtime free；constant symbol 不按 block lifetime 创建或释放。

修复顺序：

1. Host 创建并初始化 `d_data`，记录 allocation owner。
2. Launch kernel，并按 F04 检查 launch state。
3. 在 `d_data` 的最后一个 device user 之后建立 completion proof，例如所需同步边界和成功状态。
4. 若需要，先完成结果 transfer/verification。
5. Host 对 `d_data` 调用一次 matching `cudaFree`。
6. Shared/local storage 分别随 block/thread completion 自动结束；constant symbol 留给 module/context teardown。

这份 plan 证明 release responsibility，但没有运行，所以不证明任何实际调用成功。

## 解答 3：把 placement claim 改写成可复核合同

1. **Register：** Scalar 是 thread-private source value；compiler 可把它放入 register，也可因 target、liveness 与 pressure spill 到 local。检查 compiler artifact/resource report；随后若问成本，再单独测量。
2. **Local：** Local 是 thread-private address space，物理位于 device memory。它不是“per-thread cache”，名称也不产生 fastest verdict。检查 compiler placement 与实际 access pattern。
3. **Shared/L1：** Shared scope 仍是 block，lifetime 仍是 block/kernel execution；capacity 和 shared/L1 配置来自 selected device 与 kernel。查询 properties/configuration 后仍不能跳过 correctness 和 measurement。

三项改写都把稳定 semantics、environment fact 和 performance question 分开，因此不会把 table 变成运行证据。

## 有效替代方案

- Ledger 可以把 owner 与 allocator、scope 与 accessibility 拆成更多列，只要没有把它们合并成一个模糊的 “where”。
- Release plan 可以用 RAII wrapper 表达 `cudaFree` responsibility，但 wrapper 仍必须在 last use completion 之后销毁。
- Placement verification 可以使用 compiler diagnostics、resource report 或 binary inspection；任何一种都必须记录精确 Toolkit、target 和 kernel。
- Constant lifetime 可以按 module/context ledger 细化，只要不发明 per-block `cudaFree`。

## 常见错误

- 把 local 的 thread-private scope 误写成 on-chip physical location。
- 把 shared 的 per-block instance 误写成所有 block 共用一份。
- 在 asynchronous device use 完成前释放 global allocation。
- 对 shared、local、register 或 constant symbol 调用不存在的 matching `cudaFree`。
- 从 source scalar、address-space 名称或静态表声称 register placement、固定 latency 或最快空间。

复核日期：**2026-08-27**。这些解答没有改变任何资源的 Evidence Status。
