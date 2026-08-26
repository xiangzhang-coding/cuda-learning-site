---
title: 'F07 练习：编写 Runtime 与 Driver API 边界合同'
description: 通过三道合同式任务审查 API 角色、context 互操作 ownership 与异步错误观察点。
pairId: f07-exercises
counterpart: /en/foundations/runtime-driver-api/exercises/
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
unitId: F07-EXERCISES
prerequisites:
  - F07
relatedUnits:
  - F07
  - EX04
  - VIS21
exampleIds:
  - EX04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F07,EX04,VIS21' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX04 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/runtime-driver-api/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F07：区分 CUDA Runtime API 与 Driver API 的角色](/foundations/runtime-driver-api/)。三道练习（Exercise）都要求产出可审查的合同，而不是另一份完整 CUDA 程序。它们不需要 GPU，不产生编译或运行证据。

## 作答方法

每道题先写出 subject、owner、acquire/precondition、valid-use boundary、completion/error observation 与 release/teardown，再打开提示。API 名称只能支持它所在版本的局部事实；不要从前缀推断性能或一一映射。参考答案位于独立的[参考解答页](/foundations/runtime-driver-api/solutions/)。

## 练习 1：建立角色与 handle 合同

一个设计评审给出两条**不完整的角色草图**：

```text
Runtime path:
  select device → allocate/copy → launch symbol
  → check submission → observe completion → release
Driver path:
  initialize → get device → establish current context
  → load module/get function → allocate/copy → launch function
  → observe completion → release/unload/teardown
```

**目标：** 写一份六阶段 role contract，阶段为 initialization/device、context、module/function、memory、launch、completion/error。每行分别列出 Runtime owner、Driver owner、代表性 `cuda*` / `cu*` 调用或 handle，以及两条路径共享的不变条件。

**约束：** Driver 列必须包含 `cuInit`、`CUdevice`、`CUcontext`、`CUmodule`、`CUfunction`、`CUdeviceptr`、`cuLaunchKernel` 与 `CUresult`；Runtime 列必须承认 implicit primary-context/module management，同时保留 allocation、transfer、launch arguments、completion 与 release 责任；不得声称逐调用一一对应；不得补写完整程序。

**预期证据：** 一张六行 matrix，外加一句 scope 声明，说明它只覆盖 EX04-style lifecycle role comparison，不覆盖全部 API surface。

**验收条件：** 每个 handle 有 acquire/valid-use/release 或 teardown owner；Runtime 不是“全部自动”；Driver 不是“只有函数名前缀不同”；两条路径都到达 driver 栈；没有性能结论或 CUDA 运行声明。

<details><summary>提示 1</summary>先把“谁创建状态”和“谁仍需检查/释放资源”分成两列。Implicit context management 不等于 implicit buffer ownership。</details>

<details><summary>提示 2</summary>Driver 的依赖链是 initialize → device → context → module → function → launch；memory resource 还必须在适用 context 与 last-use 边界内有效。</details>

## 练习 2：为混合调用编写 context ownership 合同

假设 host application 加载两个 plugin。Plugin A 用 Driver API 建立一个 context、加载 module 并取得 function；随后它调用一个内部使用 Runtime API 的 library。Plugin B 也在同一进程使用默认 Runtime 路径。旧设计让任一 plugin 在“完成自己的工作”后调用 `cudaDeviceReset`，且没有记录 host thread 的 current context。

**目标：** 重写成一份不少于八条的 interoperability contract，明确 context creator/retainer、current-context thread rule、allocation/module/function owner、library call precondition、reset/teardown authority、error observation、release order 与 exact-version exception review。

**约束：** 不能假设 Plugin A 的 Runtime library call 必然使用期望 context；不能让 Plugin A 或 B 单方面 reset 共享 primary context；必须区分 Driver-created context 与 Runtime primary context；只允许在所选 11.8.0、12.9.2 archive（页面标为 12.9.1）或 13.3.1 文档明确允许时互换 data type；不得以“文档说可互操作”替代具体 owner 条款。

**预期证据：** 一份编号合同和一张至少包含 `context`、`module/function`、`allocation`、`completion boundary`、`reset/teardown` 的 owner table；每条包含 violation response。

**验收条件：** 调用 Runtime library 前 current context 可复核；所有 context-bound object 有 owner；reset 不是局部 cleanup；teardown 晚于最后使用；版本例外待逐项核对；任何未满足前置条件都会停止跨边界调用，而不是继续猜测。

<details><summary>提示 1</summary>把 host thread 也视为合同坐标：哪个 context 在“调用发生的那个 thread”上 current？</details>

<details><summary>提示 2</summary>Primary context 是进程中的共享资源。把 reset authority 收口到 process-level owner，或明确禁止 plugin 调用 reset。</details>

## 练习 3：保留两套 API 的异步错误边界

评审一份假想诊断计划。Runtime 路径只记录 `cudaGetLastError`；Driver 路径只记录 `cuLaunchKernel` 返回的 `CUresult`。作者据此宣称：“两次 launch 都返回 success，所以 kernel 已完成且结果正确；Driver 路径尤其不需要后续同步。”

**目标：** 分别为 Runtime 与 Driver 写一份 error-observation contract，至少包含 pre-launch stale-status policy、submission check、completion observation point、returned-status attribution、copy-back/host-verification gate 与 cleanup rule。

**约束：** Runtime 与 Driver 必须各保留 submission 和 later completion 两个边界；Driver completion 可选择适用的 context、stream 或 event primitive，但要声明 scope；任何 API 可能报告 prior asynchronous error 时要保留 attribution caveat；success 不能升级为 correctness 或 Runtime-Verified；不得虚构日志、设备输出或 timing。

**预期证据：** 两条并排 timeline 和一张 claim-review table，至少驳回“launch success = completion”“completion success = correctness”“Driver API = synchronous”三条声明。

**验收条件：** 两条 timeline 都能定位 deferred execution error 的观察点；只有 completion boundary 成功后才允许进入依赖结果的 copy/verification；host comparison 独立产生 correctness verdict；cleanup 不遗漏已取得资源；证据轴不因纸面合同改变。

<details><summary>提示 1</summary>把 status 分为“这次 submission”“此前 asynchronous work 可能在这里被报告”和“这个 scope 已完成”三种含义。</details>

<details><summary>提示 2</summary>同步只建立声明 scope 的 completion/error observation；它不会替代独立 host reference comparison。</details>

## 下一步

完成三份合同后再查看[参考解答](/foundations/runtime-driver-api/solutions/)。继续在[练习题库（Practice Bank）PB-R1-011](/practice/#pb-r1-011)审查跨 API ownership，并只把 [EX04](/examples/error-handling-lifecycle/) 当作相关 Runtime lifecycle 输入，不复制完整实现。
