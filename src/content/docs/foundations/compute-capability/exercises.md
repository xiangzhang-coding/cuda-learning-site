---
title: 'F06 练习：建立并审查 compute-capability 功能合同'
description: 用三道深入练习分开功能行、数值限制、编译目标和仍未解决的环境坐标。
pairId: f06-exercises
counterpart: /en/foundations/compute-capability/exercises/
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
unitId: F06-EXERCISES
prerequisites:
  - F06
relatedUnits:
  - F06
  - F08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F06,F08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/compute-capability/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F06：Compute capability 是功能合同](/foundations/compute-capability/)。这些练习（Exercise）只需要静态复核。查表结果、浏览器筛选结果或 target plan 都不是 GPU observation。

## 作答方法

先生成每题要求的 matrix 或 decision ledger，再打开提示。保留直接观察值与每个未知坐标。Packet 没有提供的 product mapping、compiler result、driver verdict 或 performance result 都不能添加。完成三份合同后再对照独立的[参考解答](/foundations/compute-capability/solutions/)。

## 练习 1：建立三份功能与限制合同

一份 device inventory 含有三个直接查询到的 compute-capability 值：`7.5`、`9.0` 与 `12.0`。分别判断硬件加速 `memcpy_async`、Thread Block Cluster、architecture-specific 与 family-specific feature set 是否存在，并填写 warp size、每 block 最大 thread 数、每 SM 最大 shared memory 和每 block 最大 shared memory。

**目标：** 生成一份 contract matrix，把功能可用性与数值限制分开，而且不作超出 F06 精选行的推断。

**约束：** 只能使用三个精确查询值。不能插值未列出的 capability、命名 GPU product、从功能可用推断应用实际使用、把最大值改写成建议值，或给更大的数字附加性能含义。

**预期证据：** 两张表：一张含明确“是/否”单元格的 feature-availability table，一张带单位的 numeric-limit table。再分别用一句话声明 product identity、performance 与 compilation/runtime evidence 边界。

**验收条件：** `7.5` 不含两个精选功能，也没有带后缀功能集，shared-memory 最大值为 `64/64 KiB`；`9.0` 含两个精选功能和 architecture-specific set，但没有 family-specific set，最大值为 `228/227 KiB`；`12.0` 含两个精选功能和两类带后缀集合，最大值为 `100/99 KiB`。所有行的 warp size 都是 `32`，每 block 最大 thread 数都是 `1024`。答案没有产品或性能结论。

<details><summary>提示 1</summary>先从 F06 的不同表中读取“功能存在”和“数值最大值”，再用精确 capability key 连接。</details>

<details><summary>提示 2</summary>Shared-memory pair 的顺序是每 SM / 每 block。更大的 pair 不是速度排名。</details>

## 练习 2：修复四份 compiler-target plan

审查以下 proposed pairs：

| Plan | 所选 compiler 文档 | Proposed virtual / real target |
| --- | --- | --- |
| A | NVCC 11.8.0 | `compute_100` / `sm_100` |
| B | 12.9.2 archive，页面标签 NVCC 12.9 | `compute_90a` / `sm_100` |
| C | 当前 Toolkit 13.3.1，页面标签 NVCC 13.3 | `compute_100f` / `sm_120` |
| D | 当前 Toolkit 13.3.1，页面标签 NVCC 13.3 | `compute_120` / `sm_120` |

**目标：** 判断每份 plan 是否同时被所选 compiler 文档接受并具有正确 scope；若 blocked，给出最小有效修复，但不能声称实际 compilation 已发生。

**约束：** 先核对 compiler acceptance，再核对 target compatibility。保留 suffix 语义：baseline 无后缀，`a` 只限精确 capability，`f` 只限 owner 声明的 family。不能假设数字更大的 real target 会接受另一架构或家族的 `a`/`f` contract。不能改动 driver、GPU、OS 或 evidence 字段。

**预期证据：** 一张四行 review table，包含 compiler acceptance、feature-set scope、virtual/real relationship、verdict、repair 和仍未解决的环境检查。

**验收条件：** A blocked，因为 NVCC 11.8.0 没有列出精选 10.0 targets。B 不能把精确 `90a` contract 带到 `sm_100`；architecture-specific 9.0 plan 使用 `compute_90a` / `sm_90a`。C 不能把 10.x family contract 带入 12.x family；12.0 family plan 使用 `compute_120f` / `sm_120f`，或 baseline plan 使用 `compute_120` / `sm_120`。D 是所选 compiler 文档中的有效 baseline pair。所有 verdict 都只是 plan review，不是 Compile-Checked 或 runtime evidence。

<details><summary>提示 1</summary>先问精确 NVCC 页面是否同时列出两个名称，再问后缀 scope 是否允许配对。</details>

<details><summary>提示 2</summary>Architecture-specific PTX 是 exact 的；family-specific PTX 保持在 family table 内，数字顺序不会扩大它。</details>

## 练习 3：先 fail closed，再只重新打开有依据的 decision

一份请求写道：“这是 24 GB 的 Model Z，`nvidia-smi` 显示 `CUDA Version: 13.3`，所以使用 `compute_100a`，并报告环境 compatible 且 fast。”它没有 direct compute-capability query、installed Toolkit、NVCC version、target listing、driver release 字段、OS boundary、artifact inspection、run 或 measurement。随后只增加两项事实：direct query 报告 compute capability `10.0`，installed compiler 报告 NVCC `11.8.0`。

**目标：** 写一份两阶段 decision ledger：先对不完整请求 fail closed，再记录 direct query 后究竟新增了哪些功能与限制事实，以及为何 requested target 仍被 compiler coordinate 阻塞。

**约束：** 把 GPU model、memory、compute capability、Toolkit、driver、NVCC、host compiler、OS、artifact、execution 和 measurement 分列。`CUDA Version` banner 不是 installed Toolkit。不能从 product 或 memory 推断 compute capability。不能静默把 NVCC 11.8.0 替换成新 lane。不能作 compatibility 或 performance claim。

**预期证据：** 一张 before/after ledger，包含 observed value、source/query method、allowed decision、blocked decision、required next fact 和 evidence effect。结尾分别写一句 target-plan 结论和 environment-status 结论。

**验收条件：** 第一阶段返回 unknown，不暴露功能、限制或 target result。第二阶段可以应用 F06 的 `10.0` feature 与 numeric rows，但 NVCC 11.8.0 不接受 `compute_100`、`compute_100f` 或 `compute_100a`，因此在显式选择支持该目标的 compiler lane 之前，requested plan 仍 blocked。Driver、host compiler、OS、artifact、runtime、correctness 与 performance 保持 unresolved。Evidence axes 不变。

<details><summary>提示 1</summary>Direct capability query 解锁的是 hardware table row，不会改写 host 上安装的 compiler。</details>

<details><summary>提示 2</summary>有效下一步可以是“选择并记录一个支持目标的 lane”，不能是“假设使用最新 lane”。</details>

## 下一步

先独立完成三份合同，再查看[参考解答](/foundations/compute-capability/solutions/)。继续完成[练习题库（Practice Bank）PB-R1-010](/practice/#pb-r1-010)，复核另一份合并硬件与软件坐标的 capability-to-target packet。
