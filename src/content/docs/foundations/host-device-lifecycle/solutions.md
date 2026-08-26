---
title: 'F04 参考解答：审查显式 host-device 生命周期'
description: F04 三道练习的独立复核解答、有效替代方案和常见错误。
pairId: f04-solutions
counterpart: /en/foundations/host-device-lifecycle/solutions/
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
unitId: F04-SOLUTIONS
prerequisites:
  - F04-EXERCISES
relatedUnits:
  - F04
  - O04
  - EX03
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
    attrs: { name: 'cuda:pair-id', content: f04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F04,O04,EX03' }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/host-device-lifecycle/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F04 练习（Exercise）](/foundations/host-device-lifecycle/exercises/)的**参考解答**。先比较 ownership、state transition 与 last-use 推理，再比较最终顺序。

## 解答 1：重建顺序与最后使用边界

合格 ledger 的核心行如下：

| 顺序 | 动作 | 关键状态变化 | Last use / cleanup |
| ---: | --- | --- | --- |
| 1 | 初始化 host data | host inputs/reference 从未定义变为可读 | Host input 仍可能被 comparison 读取 |
| 2 | 分配 device buffers | 每次成功 allocation 从 unacquired 变为 acquired；内容仍未初始化 | 增加一项 release obligation |
| 3 | H2D transfer | device inputs 变为本次 launch 可用 | 仍需活到 kernel 完成 |
| 4 | kernel launch | device work submitted | 全部 device buffers 保持 live |
| 5 | `cudaGetLastError` | launch boundary checked | 不建立 completion |
| 6 | `cudaDeviceSynchronize` | 成功时 device work completed | device inputs 的 last use 结束 |
| 7 | D2H copy-back | host output 变为可读结果候选 | device output 的 last use 结束 |
| 8 | host comparison | 保存 pass/fail verdict | host output/reference 的本次 last use 结束 |
| 9 | release | acquired device allocations 逐项变为 released | Cleanup 后返回保存的 verdict |

Host input/container 由 C++ host owner 管理；device pointer value 是 host 上的 handle；device allocation 是独立 CUDA resource；host output 在 D2H 成功前不是本次 GPU 结果。`cudaMalloc` 只取得 storage，不填充其内容。

## 解答 2：设计部分失败也安全的 cleanup

一种合格方案维护 `unacquired → acquired → released` 状态：

1. Allocation 1 成功后标记 acquired；allocation 2 同理。
2. Allocation 3 失败时，不执行 H2D、launch、sync、D2H 或 comparison，直接进入 cleanup。
3. Cleanup 逆序检查状态，只 release allocation 2 和 1，并把状态改为 released；allocation 3 保持 unacquired。
4. 成功路径继续完成 H2D、launch、`cudaGetLastError`、`cudaDeviceSynchronize`、D2H 和 comparison。
5. Comparison 把 verdict 写入 host 变量，不直接 return；控制流进入同一 cleanup，释放三项 acquired allocation 后返回 verdict。

若 launch check 或 synchronization 失败，D2H 与 comparison 都没有满足前置条件，因此跳过它们并 cleanup。若 D2H 失败，同样不比较 host output。每条路径都只处理已经建立为有效的 state。

## 解答 3：修复越界证据声明

| 原声明 | 实际 evidence | 允许的 claim | 禁止的 inference |
| --- | --- | --- | --- |
| Host-only tests 通过 | 声明的 host reference/comparison/helper 在 host 上通过 | 对应 host contract 通过 | GPU kernel 已执行或结果正确 |
| 源码编译成功 | 若有合格记录，只能说明声明 build stages 通过 | Compile-Checked 可用于具体 EX03 build subject | Runtime-Verified 或任何 GPU output |
| 静态表展示顺序 | 原创 HTML teaching composition 可被阅读 | 它表达 F04 的确定性顺序模型 | 表中的 API 已执行、计时或成功 |

Packet 没有实际 GPU observation，因此 EX03 的 runtime 仍是 **Pending Hardware Verification**。F04 Learning Unit 不是 executable subject，它的 compilation 与 runtime evidence axes 都为空。两者的状态不能相互复制。

## 有效替代方案

- Lifecycle ledger 可以画成 state machine，只要 action order、owner、last use 和 cleanup obligation 都能按文字复核。
- Cleanup 可以使用单一 cleanup block，也可以使用 O04 所复习的显式 RAII owner；两者都必须只 release 已取得的 allocation，并避免 mismatch early return 跳过析构或错误检查。
- Verdict 可以是 boolean、枚举或结构化 comparison report；必须先保存，再 cleanup，最后返回。
- Failure table 可以按 API 展开，也可以按 acquisition/launch/completion/copy/verification 阶段分组，但不能合并 compilation 与 runtime evidence。

## 常见错误

- 认为 `cudaMalloc` 会把 device memory 清零，或认为复制 device pointer 就复制了 allocation。
- 在 H2D 之前没有初始化 host input，或把 H2D/D2H 方向写反。
- 在 launch 后只调用 `cudaGetLastError` 就开始 blocking D2H，却没有说明 completion/error 在哪里暴露；canonical flow 用显式同步保留独立诊断边界，而同步 D2H 本身也会等待相关工作。
- 在 D2H 之前比较 host output，或把 copy-back 成功当成 correctness verdict。
- 在 kernel 完成前 release device input，或在 D2H 完成前 release device output。
- Comparison mismatch 直接 return，造成成功取得的 allocation 泄漏。
- 把 host-only test、Compile-Checked 或静态教学表写成 GPU runtime observation。

复核日期：**2026-08-26**。这些解答没有执行 CUDA，没有改变 EX03 的 Pending Hardware Verification，也没有给 F04 Learning Unit 添加 Evidence Status。
