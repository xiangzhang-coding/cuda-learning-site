---
title: 'F03 练习：诊断并修复多维索引合同'
description: 用三道独立任务检查非整除坐标、x/y/z 边界和 row-major 展平缺陷。
pairId: f03-exercises
counterpart: /en/foundations/multidimensional-indexing/exercises/
factCheckDate: '2026-08-26'
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
unitId: F03-EXERCISES
prerequisites:
  - F03
relatedUnits:
  - F03
  - VIS02
  - EX03
  - F04
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F03,VIS02,EX03,F04' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/multidimensional-indexing/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F03：把多维索引与边界写成正确性合同](/foundations/multidimensional-indexing/)。三道练习（Exercise）都可以用静态推理和 host-only 检查完成；没有实际 CUDA 运行就不要填写 device 结果。

## 作答方法

先提交每题要求的可复核产物，再依次打开提示。实现复核从[固定提交中的 EX03 canonical project](https://github.com/xiangzhang-coding/cuda-learning-site/tree/a69a52b0b0c271f931ebe813b3ec320baeb18f04/examples/ex03-multidimensional-indexing)开始，不从学习页面拼接第二份程序。完成后使用独立的[参考解答](/foundations/multidimensional-indexing/solutions/)复核推理。

## 练习 1：分类三维 partial fringe

**目标：** 对 `width = 10`、`height = 7`、`depth = 5`、`blockDim = (4, 3, 2)` 的三维 launch，计算 grid shape，并分类最后一个 block `blockIdx = (2, 2, 2)` 中四个 thread：`threadIdx = (1, 0, 0)`、`(2, 0, 0)`、`(1, 1, 0)`、`(1, 0, 1)`。

**约束：** 必须分别写出 `gx`、`gy`、`gz`；逐轴判断后才能为合法 thread 展平；不能先看 VIS02 或运行程序反推答案。

**预期证据：** 一张表，包含 grid shape、block/thread 坐标、global 坐标、x/y/z 三个 bounds 谓词、最终 IN/OUT 状态，以及合法 thread 的线性索引。

**验收条件：** 得到 grid shape `(3, 3, 3)`；识别 `(9, 6, 4)` 为唯一合法 global 坐标且索引为 `349`；其余三个 thread 分别因 x、y、z 越界而跳过；不为无效坐标计算可访问索引。

<details><summary>提示 1</summary>每轴 block 数分别是 `ceil(10 / 4)`、`ceil(7 / 3)`、`ceil(5 / 2)`。</details>

<details><summary>提示 2</summary>最后一个合法坐标是 `(width - 1, height - 1, depth - 1)`；仅对它使用 `((gz * height) + gy) * width + gx`。</details>

## 练习 2：修复 x/y/z 边界保护

**目标：** 审查一个在 `gx >= width AND gy >= height AND gz >= depth` 时才返回的三维 kernel，并把它修复为覆盖 x、y、z 任一轴越界的正确保护。

**约束：** 保护必须发生在展平和任何数组访问之前；不能 clamp 坐标、改变 extent 或缩小 launch 来隐藏错误；必须给出仅 x、仅 y、仅 z 越界的三个反例。

**预期证据：** 原条件与修复条件、三个反例的逐轴真值表，以及一段说明为什么无效谓词使用 `OR` 或有效谓词使用 `AND` 的解释。

**验收条件：** 修复在 `gx >= width OR gy >= height OR gz >= depth` 时返回，或只在三个 `<` 谓词同时成立时包围全部访问；三个单轴反例都不再到达展平；合法坐标仍执行一次且只执行一次访问。

<details><summary>提示 1</summary>问“任一轴无效时是否还存在一个合法元素”，而不是问“三轴是否同时无效”。</details>

<details><summary>提示 2</summary>可以对练习 1 的三个 OUT thread 分别代入原条件；原来的 `AND` 对它们都得到 false。</details>

## 练习 3：修复 flattening 并保住独立参考边界

**目标：** 在 EX03 的本地工作副本中，诊断把坐标写成 `((gx * height) + gy) * depth + gz` 的错误映射，恢复本站声明的 x-fastest row-major 映射，并设计一个 host-only 检查来捕获维度交换。

**约束：** 必须使用 `width` 作为行 stride、`width * height` 作为层 stride；CPU reference 不得读取 kernel 输出作为预期值，也不得调用待测的错误映射；至少包含 `(0, 0, 0)`、`(1, 0, 0)`、`(0, 1, 0)`、`(0, 0, 1)` 和 `(9, 6, 4)`；保留 `10 x 7 x 5` 非整除案例。

**预期证据：** 修复前后公式、五个坐标的预期索引表、针对 canonical implementation/reference ranges 的本地 diff，以及一句明确的 host-only 证据边界。

**验收条件：** 修复结果为 `((gz * height) + gy) * width + gx` 或其代数等价式；五个索引依次为 `0`、`1`、`10`、`70`、`349`；检查能让错误映射失败；结论不声称 GPU kernel 已运行或具有任何性能。

<details><summary>提示 1</summary>先问 x、y、z 各增加 1 时，线性索引应分别增加多少。</details>

<details><summary>提示 2</summary>用独立的嵌套 host 循环生成坐标和值；不要让 expected path 与待测 path 共用同一个 flatten helper。</details>

## 下一步

先独立完成三题，再查看[参考解答](/foundations/multidimensional-indexing/solutions/)。还可以在[练习题库（Practice Bank）PB-R1-007](/practice/#pb-r1-007)复核另一组边界与布局缺陷。
