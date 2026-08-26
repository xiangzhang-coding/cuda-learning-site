---
title: 'F05 练习：重建异步错误的暴露边界'
description: 用三道深入练习分类即时与延后错误、审查 last-error state，并设计可复核的运行记录。
pairId: f05-exercises
counterpart: /en/foundations/asynchronous-errors/exercises/
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
unitId: F05-EXERCISES
prerequisites:
  - F05
relatedUnits:
  - F05
  - F03
  - EX04
  - LAB03
  - F07
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
    attrs: { name: 'cuda:pair-id', content: f05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F05 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F05,F03,EX04,LAB03,F07' }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/asynchronous-errors/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F05：CUDA 错误为何常常延后暴露](/foundations/asynchronous-errors/)。你应当能区分 API direct return、last-error state、launch submission、device execution 与 synchronization boundary。三道练习（Exercise）都能通过静态推理完成；没有 CUDA-capable system 和实际执行记录时，不得填写 runtime observation。

## 作答方法

先独立提交时间线、状态账本或观察合同，再按顺序打开两层提示。需要核对实现边界时，从[固定提交中的 EX04 canonical project](https://github.com/xiangzhang-coding/cuda-learning-site/tree/349f2f65c195ca940eb85bc89941507aed326496/examples/ex04-error-handling-lifecycle)开始，不要从本页拼接第二份程序。完整答案在独立的[参考解答页](/foundations/asynchronous-errors/solutions/)。

## 练习 1：从观察点反推两条错误时间线

Review packet 给出两条不带具体错误码的 trace。Trace A：preflight last-error state 已处理；launch 使用 Runtime 不接受的 execution configuration；紧邻 launch 的检查失败；没有 kernel body 执行。Trace B：preflight state 已处理；launch 被接受；即时检查没有观察到新的 launch failure；device execution 期间发生问题；显式同步返回失败。

**目标：** 为两条 trace 各画一张五阶段时间线，阶段固定为 launch submission、immediate check、device execution、synchronization 和 host-visible result，并分别标出 error origin 与 host observation。

**约束：** 不指定或猜测精确错误码；不把即时检查写成 execution completion；Trace A 的 device execution 必须标为未到达；Trace B 的 launch submission 不得标为失败；两条路径都必须在失败后停止使用依赖输出。

**预期证据：** 两张五行表，每行至少包含 stage、work state、last-error/direct-return channel、host 可知事实和下一步；再用两句话说明为什么“观察点”与“根因位置”不能合并。

**验收条件：** Trace A 在 immediate check 首次暴露并跳过 device execution；Trace B 的错误在 device execution 产生、在 synchronization 暴露；两张表都以 cleanup 而不是 D2H/comparison 结束；没有“所有 CUDA API 都异步”或固定错误码承诺。

<details><summary>提示 1</summary>先只问每个阶段有没有被到达，不要先填错误名称。被拒绝的 launch 没有可等待的 kernel body。</details>

<details><summary>提示 2</summary>Trace B 的即时检查只能写“此时没有观察到新的 launch-configuration failure”，不能写“kernel 成功”。</details>

## 练习 2：审查一个没有隔离 stale state 的检索策略

某段 review-only 流程在开始时已有一项未消费的 last error，然后依次执行：`cudaPeekAtLastError`、合法 launch A、再次 `cudaPeekAtLastError`、合法 launch B、`cudaGetLastError`、`cudaDeviceSynchronize`。作者把第二次 peek 的失败归因给 launch A，又把 get 的结果归因给 launch B。

**目标：** 重建 last-error state 在每一步“保留、可能被新错误覆盖、被消费或与 direct return 无关”的状态，并把流程改写为能分别审查 launch A 与 launch B 的边界策略。

**约束：** `cudaPeekAtLastError` 不得写成清除操作；`cudaGetLastError` 取到旧错误时不能静默忽略；每个返回 `cudaError_t` 的同步调用直接检查自己的返回值；必须保留官方 caveat，即 getter 与其他 API 可能报告此前异步 launch 的错误；不借助计时或 sleep 推断 completion。

**预期证据：** 一张六步 state ledger，包含 operation、state before、observation、state after、可允许归因和禁止归因；再给一份按边界分组的修复步骤，说明每个 launch 前后以及每个 synchronization return 如何处理。

**验收条件：** Ledger 说明第一次 peek 保留 stale state，因此第二次 peek 不能单独归因给 A；后续 get 消费“当时的当前状态”但不能仅凭位置归因给 B；修复方案先处理旧状态、分别紧邻检查两个 launch，并在需要 execution 结论时加入并直接检查明确同步边界。

<details><summary>提示 1</summary>把 last-error state 想成每个 host thread / Runtime instance 的一个槽位，而不是按 launch 排队的 FIFO。</details>

<details><summary>提示 2</summary>一个可审查区间的两端分别是“已有状态已处理”和“目标工作的同步返回已检查”；区间中不要混入另一个未标记 launch。</details>

## 练习 3：设计 LAB03 可用的观察与证据合同

你要为未来 LAB03 设计一张记录表，用同一份 EX04 project 分别观察 launch-configuration 情景与 deferred-execution 情景。当前你没有 Reference Environment 日志，也不能假设两条 Toolkit Lane 返回相同错误码或相同文字。

**目标：** 写出一份运行前预测、运行时记录和运行后判定合同，使另一位学习者能判断错误 origin、host observation、cleanup 与 correctness 是否符合预期，同时不会越界授予 Evidence Status。

**约束：** Environment Manifest 至少预留 GPU、compute capability、driver、Toolkit、compiler、OS、命令和 source commit；分别记录 preflight、immediate check、synchronization direct return、是否执行 D2H/comparison 与 process result；不要求固定错误码；不虚构输出、日期、硬件或性能；浏览器 ErrorTimeline 不得列为 CUDA evidence。

**预期证据：** 一份两情景 observation matrix、一份 acceptance checklist，以及“未运行”“Community-Observed”“Runtime-Verified”三种报告模板；每种模板都指明 subject 是 EX04、LAB03 还是 F05。

**验收条件：** Matrix 能区分 origin 与 observation；configuration 路径不声称 kernel body 执行，deferred 路径不声称 immediate check 已验证 execution；没有真实日志时 recorded observations 保持为空；只有 Reference Environment 中满足全部 acceptance criteria 的实际 GPU run 才能为对应 executable subject 支持 Runtime-Verified，且没有性能推断。

<details><summary>提示 1</summary>先写 expected observation，不要先写 status。Expected 是验收合同；recorded 只能来自真实 run。</details>

<details><summary>提示 2</summary>Evidence Status 属于具体 subject。F05 的静态解释、EX04 的 executable run 和 LAB03 的 guided procedure 不能共享同一状态行。</details>

## 下一步

先完成三道题，再对照[参考解答](/foundations/asynchronous-errors/solutions/)。随后到[练习题库（Practice Bank）PB-R1-009](/practice/#pb-r1-009)审查一份更短、但故意混入 stale state 与错误归因的记录。
