---
title: 'F08 参考解答：先证明 Launch Geometry 可行'
description: F08 三道合同式练习的完整 coverage ledger、安全算术实现、resource 缺口与合法结论。
pairId: f08-solutions
counterpart: /en/foundations/launch-geometry/solutions/
factCheckDate: '2026-08-26'
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
unitId: F08-SOLUTIONS
prerequisites:
  - F08-EXERCISES
relatedUnits:
  - F08
  - LAB03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f08-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F08,LAB03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/launch-geometry/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F08 练习（Exercise）](/foundations/launch-geometry/exercises/)的**参考解答**。先比较 fail-closed 顺序和结论边界，再比较最终数字。全部计算都是手算或 host/browser 算术；没有执行 CUDA，也没有产生 occupancy 或性能记录。

## 解答 1：签发二维 launch-feasibility 记录

四个输入都是正整数。Block.x `32 <= 1024`，block.y `8 <= 1024`，checked product `32 * 8 = 256 <= 1024`，所以 block 的 device-level axis 与 aggregate checks 通过。

| 检查 | 安全计算 | 结果 |
| --- | --- | ---: |
| grid.x | `1 + floor((1000 - 1) / 32)` | 32 |
| grid.y | `1 + floor((750 - 1) / 8)` | 94 |
| grid limits | `32 <= 2147483647`; `94 <= 65535` | pass |
| grid blocks | `32 * 94` | 3008 |
| coverage | `(32 * 32, 94 * 8)` | `1024 x 752` |
| launched threads | `3008 * 256` | 770048 |
| logical elements | `1000 * 750` | 750000 |
| fringe | `770048 - 750000` | 20048 |

Logical extent 仍是 `1000 x 750`。Coverage 多出的坐标由 `gx < 1000 AND gy < 750` 拒绝；不能把 `1024 x 752` 传给 kernel 作为新 extent。

允许的结论是：**这份 record 中声明的 device axis、aggregate 与 grid limits 通过，安全整数 geometry 如表所示。** 仍需查询实际函数的 `maxThreadsPerBlock`、register 与 static/dynamic shared-memory demand，并执行真实 launch/error 与结果检查。没有这些事实就不能声明整个 kernel/device launch feasible，更不能声明性能。

## 解答 2：实现 fail-closed 安全算术合同

下面的语言无关伪代码保留题目要求的顺序：

```text
parse_positive_decimal(text, MAX):
  require text matches [1-9][0-9]*
  parse without exceeding MAX
  otherwise return invalid

checked_product(a, b, MAX):
  require 1 <= a <= MAX and 1 <= b <= MAX
  if a > floor(MAX / b): return invalid
  return a * b

ceil_div_positive(n, d, MAX):
  require 1 <= n <= MAX and 1 <= d <= MAX
  return 1 + floor((n - 1) / d)

plan(input, capability, MAX):
  parse width, height, block.x, block.y
  if any parse fails:
    return invalid, geometry null
  check block axes
  checked_product(block.x, block.y)
  if the product fails or exceeds the limit:
    return invalid, geometry null
  checked_product(width, height)
  if the product fails:
    return invalid, geometry null
  calculate grid.x and grid.y with ceil_div_positive
  check grid axes
  checked_product every grid, coverage, and launch value
  if any check fails:
    return invalid, geometry null
  subtract fringe only after launched >= logical is established
  return valid geometry plus unresolved kernel-resource checks
```

`ceil_div_positive(MAX, 2)` 不会构造 `MAX + 1`，所以在 `MAX` 为正时安全返回 `1 + floor((MAX - 1) / 2)`。`checked_product(MAX, 2, MAX)` 在乘法前因为 `MAX > floor(MAX / 2)` 而失败。`(1024, 2)` 的两个 axis predicates 为 true，但 aggregate 2048 超过 1024。`0` 和 `"8.5"` 不满足 parser，planner 在任何 geometry 算术前停止。

`MAX` 是实现合同的一部分：JavaScript 版本可选择 `Number.MAX_SAFE_INTEGER`，C++ host helper 应使用其明确无符号类型的 `std::numeric_limits<T>::max()`。二者不能互相冒充。

## 解答 3：拒绝没有 resource 与测量证据的“最快”结论

两个 block 都有 256 threads，分别满足 x/y axis limits 与 aggregate 1024 limit。Geometry 为：

| 候选 | block | grid | grid blocks | coverage | launched | logical | fringe |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: |
| A | `(32, 8)` | `(32, 94)` | 3008 | `1024 x 752` | 770048 | 750000 | 20048 |
| B | `(16, 16)` | `(63, 47)` | 2961 | `1008 x 752` | 758016 | 750000 | 8016 |

两者必须继续使用同一个 `gx < 1000 AND gy < 750` bounds contract。B 比 A 少 `12032` 个 fringe thread；这只是一项输入与 geometry 已明确的整数事实。

Decision ledger 还没有完成：

1. **Correctness：** 表格说明 coverage，但没有执行 kernel 或验证输出。
2. **Device：** 给定 record 的 axis、aggregate 与 grid limits 通过。
3. **Kernel resource：** 缺少函数的 `maxThreadsPerBlock`、`numRegs`、`sharedSizeBytes`、requested dynamic shared memory、编译 target 与实际 launch result。
4. **Measurement：** 缺少 Environment Manifest、正确结果、warm-up、同步边界、计时方法、重复和观测值。

原句的最小合法改写是：**“在 `1000 x 750` logical extent 和给定 device record 下，B 的 device-level geometry 产生 8016 个 fringe thread，比 A 少 12032；kernel feasibility 和运行时间排序尚未建立。”** 不能从这张表生成 occupancy 或最快 verdict。

## 有效替代方案

- 练习 1 可以用逐步计算图代替表格，只要 input、axis、aggregate、grid、overflow、coverage 与未决 resource gates 都可复核。
- `checked_product` 可以使用除法 guard、语言提供的 checked arithmetic 或更宽中间类型，但必须证明目标类型结果可表示，失败时不能返回 wraparound 值。
- Ceiling division 可以用商与余数实现为 `n / d + (n % d != 0)`，前提同样是正整数且结果类型安全。
- 练习 3 可以记录更多候选 shape，但每个候选都必须独立通过相同 correctness 与 feasibility contract；数量更多不会自动形成性能证据。

## 常见错误

- 只检查 `maxThreadsPerBlock`，遗漏 block.x/block.y 的逐轴 limits，或只检查逐轴而遗漏 product。
- 用 `(n + d - 1) / d` 却没有证明加法可表示，或在 overflow check 前已经做了乘法。
- 把 coverage 写回 logical extent，使 fringe thread 获得错误的数据 ownership。
- Device limits 通过后，忽略函数自己的 thread、register、static/dynamic shared-memory constraints。
- 为 invalid input 保留一部分旧 grid 或 fringe，让 UI 看起来像有可用 geometry。
- 把较少 fringe、相同 block thread 数、浏览器模型或 host-only test 写成 occupancy、GPU 运行或最快 shape 证据。

复核日期：**2026-08-26**。这些解答没有执行 CUDA，也没有改变 LAB03 或任何其他资源的 Evidence Status。
