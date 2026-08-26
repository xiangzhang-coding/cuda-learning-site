---
title: 'F05 参考解答：重建异步错误的暴露边界'
description: F05 三道练习的独立复核解答、有效替代方案和常见错误。
pairId: f05-solutions
counterpart: /en/foundations/asynchronous-errors/solutions/
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
unitId: F05-SOLUTIONS
prerequisites:
  - F05-EXERCISES
relatedUnits:
  - F05
  - F03
  - EX04
  - LAB03
  - F07
  - VIS19
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
    attrs: { name: 'cuda:pair-id', content: f05-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F05,F03,EX04,LAB03,F07,VIS19' }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/asynchronous-errors/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F05 练习（Exercise）](/foundations/asynchronous-errors/exercises/)的**参考解答**。先比较 stage 是否到达、error origin、host observation 和 state transition，再比较 API 名称。答案不依赖某个固定错误码。

## 解答 1：从观察点反推两条错误时间线

Trace A 的合格时间线如下：

| 阶段 | Work state | 观察 channel | Host 可知事实 | 下一步 |
| --- | --- | --- | --- | --- |
| Launch submission | Configuration 在提交路径不被接受 | Launch expression 后的 last-error state | 没有可执行 launch 被建立 | 立即查询 launch boundary |
| Immediate check | 失败对 host 可见 | `cudaGetLastError` 或不清除的 `cudaPeekAtLastError` | Launch boundary 失败；不等于执行后失败 | 停止创建依赖工作 |
| Device execution | 未到达 | 无 execution return | Kernel body 没有执行 | 跳过依赖输出 |
| Synchronization | 不是首次发现点 | 不用于修复被拒绝的 launch | 等待不能创建不存在的工作 | 进入 cleanup |
| Host-visible result | Launch failed | 已保存的诊断结果 | D2H/comparison 没有前置结果 | Cleanup 后返回失败 |

Trace B 的合格时间线如下：

| 阶段 | Work state | 观察 channel | Host 可知事实 | 下一步 |
| --- | --- | --- | --- | --- |
| Launch submission | Launch 被接受 | 提交路径 | Device work 可以稍后执行；尚未完成 | 立即检查 launch boundary |
| Immediate check | 没有观察到新的 configuration failure | Last-error getter | 只覆盖此时可见的 launch boundary | 到明确 completion boundary |
| Device execution | 已提交工作执行并发生问题 | Device 内部 origin | Host 先前不能预知这个结果 | 等待相关工作 |
| Synchronization | 失败对 host 可见 | `cudaDeviceSynchronize` direct return | 此前请求的 device task 失败 | 不执行 D2H/comparison |
| Host-visible result | Execution failed | 已保存的同步结果 | 输出没有建立为有效结果 | Cleanup 后返回失败 |

Trace A 的 origin 与 observation 都在提交路径附近，但仍是两个概念；Trace B 则明确把 device execution 的 origin 与 synchronization 的 host observation 分开。API 还可能报告此前异步 launch 的错误，所以即使两个位置相邻，也要先建立受控 state 才能改善归因。

## 解答 2：审查没有隔离 stale state 的检索策略

在题目声明“期间没有其他新错误改变槽位”的前提下，原流程的核心 ledger 是：

| 操作 | State before | Observation | State after | 允许的结论 / 禁止的归因 |
| --- | --- | --- | --- | --- |
| 第一次 `cudaPeekAtLastError` | Stale error | 读到旧状态 | Stale error 仍保留 | 可说“已有未处理错误”；不能分配给未来 launch |
| 合法 launch A | Stale error | Launch 被提交 | 成功操作不会被当作显式清除步骤 | 不能说槽位已按 launch 分队 |
| 第二次 `cudaPeekAtLastError` | Stale error | 再次读到当前槽位 | Stale error 仍保留 | 不能仅凭位置归因给 A |
| 合法 launch B | Stale error | 第二个工作被提交 | 槽位仍未被 getter 消费 | 不能说下一次 getter 必然属于 B |
| `cudaGetLastError` | 当时的当前状态 | 读到并消费该状态 | 重置为 `cudaSuccess` | 可说“当前槽位被消费”；不能仅凭位置归因给 B |
| `cudaDeviceSynchronize` | Last-error 槽位已清；A/B work 可能待完成 | 直接返回同步结果 | Direct return 必须独立处理 | 可说此前 tasks 的等待结果；仍保留 previous-asynchronous-error caveat |

一种可审查的修复策略是：

1. 在目标区间前调用 `cudaGetLastError`，把取到的已有状态作为真实错误处理；失败时停止，而不是静默清空后继续。
2. Launch A 后立即读取并消费它的 launch boundary；若失败，进入 cleanup。
3. 若需要 A 的 execution 结论，建立并直接检查一个明确同步边界；失败时停止依赖操作。
4. 开始 B 前再次确认并处理当前 last-error state，使 B 的区间有明确起点。
5. Launch B 后立即检查并消费它的 launch boundary；需要 execution 结论时，同样直接检查为 B 设置的同步返回。
6. 每个 observation 都记录为“在此边界观察到”，不写成未经证明的唯一 origin。

在生产代码中，可以因性能与并发设计选择不同的同步粒度；本练习要求的是诊断隔离，而不是要求每个 launch 永久使用 device-wide synchronization。

## 解答 3：设计 LAB03 的观察与证据合同

合格 observation matrix 的最小列如下：

| 字段 | Launch-configuration 情景 | Deferred-execution 情景 |
| --- | --- | --- |
| Preflight | 记录已有状态是否被处理 | 同样记录，不默认干净 |
| Expected origin | Submission/configuration path | Accepted work during device execution |
| Immediate check | 预期观察 launch-boundary failure；不固定错误码 | 预期不观察新的 configuration failure；不等于 execution success |
| Kernel body | 预期未到达 | 预期到达并触发受控 failure condition |
| Synchronization direct return | 不是首次预期发现点 | 预期在此暴露 deferred failure；不固定错误码 |
| D2H/comparison | 跳过 | 同步失败后跳过 |
| Cleanup/process result | 释放已取得资源并报告失败 | 释放已取得资源并报告失败 |

Environment Manifest 记录 GPU、compute capability、GPU count、driver、Toolkit、compiler、OS、命令、source commit、时间与任何影响解释的测量条件。Acceptance checklist 至少确认：source 与声明 commit 一致；两个情景分别运行；每次 direct return 被记录；origin 与 observation 分栏；失败后没有使用依赖输出；cleanup 完成；没有从错误检查外推 numerical correctness 或 performance。

三种报告模板应当这样收窄：

| 报告类型 | 必需材料 | 允许状态/声明 | 不允许的升级 |
| --- | --- | --- | --- |
| 未运行 | Prediction 与空 recorded-observation fields | “尚无 runtime observation”；不改变 EX04/LAB03 已声明状态 | 不能从 F05、浏览器模型或 source review 推断执行 |
| Community-Observed | 完整 Environment Manifest、命令、日志与 acceptance review | 仅对实际被观察的 executable subject 记录 Community-Observed；可与 Pending Hardware Verification 共存 | 不能称 Reference Environment Runtime-Verified |
| Runtime-Verified | Maintainer-controlled Reference Environment、完整日志、全部 criteria 通过 | 只对满足合同的 EX04/LAB03 subject 记录 Runtime-Verified | 不能把状态复制给 F05 或另一个未运行 subject |

当前题目没有提供任何实际日志，所以本解答只定义 expected observations，recorded observations 保持为空，并且不改变 EX04 或 LAB03 的现有声明。F05 与 ErrorTimeline 仍没有 CUDA Evidence Status。

## 有效替代方案

- 五阶段时间线可以画成 sequence diagram，只要 launch submission、immediate check、device execution、synchronization 和 host-visible result 都有完整文字等价物。
- 可以用 `cudaPeekAtLastError` 做不消费观察，但必须另外说明谁在何处消费或有意保留 state；不能让 stale state 无期限漂移。
- 可以按每个 launch 同步，也可以在一组有明确归属的工作后同步；必须让报告能说明等待范围，且不能把 immediate check 写成 completion。
- LAB03 记录可以是 JSON、Markdown 表或结构化日志，只要 Environment Manifest、expected/recorded observations、criteria 与 subject-specific status 都可复核。

## 常见错误

- 认为 kernel launch 相对 host 异步，所以 launch configuration 不可能立即报错。
- 把 `cudaPeekAtLastError` 当作 reset，或以为 successful API call 自动等价于显式 `cudaGetLastError` 清理。
- 把 last-error state 当成按 kernel 排队的 FIFO，而不是 host thread / Runtime instance 的状态。
- 即时检查没有报错就宣称 kernel body 完成或结果正确。
- 只调用 `cudaGetLastError`，没有为 deferred execution 建立并检查同步边界。
- 某个 API 返回此前异步错误时，直接把根因归给这个 API 行。
- 同步失败后仍执行 D2H/comparison，消费尚未建立为有效的结果。
- 把 F05 静态内容、ErrorTimeline 或 unit test 写成 EX04/LAB03 GPU runtime evidence。

复核日期：**2026-08-26**。这些解答没有执行 CUDA，不记录错误码或性能，也不给 F05、ErrorTimeline、EX04 或 LAB03 添加新的 Evidence Status。
