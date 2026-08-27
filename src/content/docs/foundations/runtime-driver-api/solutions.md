---
title: 'F07 参考解答：Runtime 与 Driver API 边界合同'
description: F07 三道合同式练习的完整复核答案、有效替代方案与常见错误。
pairId: f07-solutions
counterpart: /en/foundations/runtime-driver-api/solutions/
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
unitId: F07-SOLUTIONS
prerequisites:
  - F07-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: f07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/runtime-driver-api/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F07 练习（Exercise）](/foundations/runtime-driver-api/exercises/)的**参考解答**。先比较 owner、precondition、valid-use、completion 与 teardown 边界，再比较具体 API 名称。以下都是静态合同，不是 CUDA 运行记录。

## 解答 1：角色与 handle 合同

**Scope：** 只比较 EX04-style initialization/device、context、module/function、memory、launch 与 completion/error 角色；不覆盖完整 Runtime/Driver API，也不声称调用一一对应。

| 阶段 | Runtime owner 与坐标 | Driver owner 与坐标 | 共同不变条件 |
| --- | --- | --- | --- |
| Initialization/device | Runtime 按需管理较高层初始化；应用选择 device ordinal，并检查 `cuda*` status | 应用调用 `cuInit(0)`，再用 ordinal 取得 `CUdevice`；两步都检查 `CUresult` | 选中 device 不代表 launch 或 completion |
| Context | Runtime 常见路径按需使用 primary context；应用不得把共享 context 当成局部私有资源 | 应用 retain primary context 或创建/取得 `CUcontext`，并管理 host-thread current 状态 | 后续 object 必须在适用 context 中创建与使用 |
| Module/function | Runtime 隐式管理已注册 device code/module；应用提供 kernel symbol | 应用 load 得到 `CUmodule`，再取得 `CUfunction`；module owner 规定 unload | Function 的有效期不能超过所属 module/context |
| Memory | 应用通过 `cudaMalloc/cudaMemcpy/cudaFree` 管理 pointer、byte count、direction、last use 与 release | 应用通过 `cuMemAlloc/cuMemcpy*/cuMemFree` 管理 `CUdeviceptr` 与相同资源账本 | 每项成功取得的 allocation 在 last use 后恰好 release 一次 |
| Launch | 应用提供 symbol、execution configuration 与参数，并检查 Runtime submission status | 应用在有效 `CUfunction`/context 下向 `cuLaunchKernel` 提供 grid/block 与参数数组 | Submission 不建立 completion |
| Completion/error | 应用检查 `cudaError_t`，在 device/stream/event scope 建立 completion observation | 应用检查每个 `CUresult`，在 context/stream/event scope 建立 completion observation | 两条路径都可能在后续边界发现 deferred error；success 不是 correctness |

两条 host API 路径都进入 CUDA driver 栈，但 Runtime 在一个较高层操作中可能组合多个管理动作。Driver 的显式 handle 链改变可见 ownership，不证明它只是 Runtime 的逐行改名版。

## 解答 2：混合调用的 context ownership 合同

一份满足题目要求的合同是：

1. **Process owner** 在加载 plugin 前登记 device 与 context policy；未登记则禁止任何 plugin 发起 CUDA 调用。
2. **Plugin A** 创建或 retain 它声明的 Driver context，并保存 `CUcontext` owner；失败时不加载 module，也不调用 Runtime library。
3. **Current-thread rule：** A 每次跨入 Runtime library 前，在实际调用的 host thread 上设置并核对预期 context current；核对失败就停止调用并返回错误。
4. **Module/function owner：** A 取得 `CUmodule` 与 `CUfunction`；function 只在 module 与 context 有效期间使用，A 在最后 launch/completion 后 unload。
5. **Allocation owner：** 创建 allocation 的 component 记录 context、byte count、last use 与 release API；另一 plugin 不释放它。
6. **Runtime-library precondition：** 精确 Lane 文档必须允许该 Runtime call 在当前 Driver context 上运行，并逐项检查例外；无法确认时不混用，改用单一 API 边界。
7. **Plugin B** 使用 process policy 指定的 Runtime primary context；B 不假设 A 的 context、module 或 allocation 对它可见。
8. **Reset authority：** A 与 B 都不得调用 `cudaDeviceReset` 作为局部 cleanup。只有 process owner 在所有 clients quiescent、资源已释放且 policy 允许时 teardown/reset。
9. **Error observation：** 每个 submitter 记录自己的 submission status，并在所声明 context/stream/event scope 建立 completion boundary；失败后停止依赖结果的操作并进入 owner cleanup。
10. **Version/type rule：** 只有 11.8.0、12.9.2 archive 页面所标 12.9.1 或 13.3.1 的精确文档明确允许时才互换 handle/type；否则保留 API 边界或执行文档要求的 cast。
11. **Release order：** 先等待最后使用完成，再释放 allocation；随后使 function 不再可用、unload module，最后才 release/destroy context。
12. **Violation response：** 任一 current-context、owner、version 或 quiescence precondition 不成立时 fail closed，保留诊断上下文，不继续 launch、reset 或 teardown。

| 对象/边界 | Owner | 必要前置条件 | 最后使用与 teardown |
| --- | --- | --- | --- |
| A 的 Driver context | Plugin A，在 process policy 下 | 正确 host thread 上 current | A 的全部 work 与 context-bound object 完成/释放后 |
| Runtime primary context | Process policy；多个 Runtime client 共享 | Device/context 选择符合 Lane 文档 | 只有 process owner 在所有 client quiescent 后 reset |
| `CUmodule` / `CUfunction` | Plugin A | A 的 context current；load/get 成功 | Function 的全部 launch 完成后 unload module |
| Allocation | 创建它的 component | 适用 context 有效；size/direction 已检查 | 对应 copy/kernel 最后使用完成后 release |
| Completion boundary | 提交 work 的 component | 明确 context/stream/event scope | 成功后才允许依赖结果；失败进入 cleanup |

## 解答 3：两套 API 的异步错误观察合同

### Runtime timeline

```text
establish stale-status policy
→ submit through Runtime launch surface
→ check this submission boundary
  (for example cudaGetLastError under the declared policy)
→ establish the relevant device/stream/event completion boundary
→ only on success perform result-dependent copy-back
→ independently compare with host reference
→ release acquired resources
```

### Driver timeline

```text
validate current context and CUfunction
→ validate configuration and parameter storage
→ call cuLaunchKernel and check CUresult as the submission boundary
→ establish the declared context/stream/event completion boundary
→ only on success perform result-dependent copy-back
→ independently compare with host reference
→ release allocation and unload module
→ tear down owned context state
```

两条 timeline 的返回状态都要附 attribution caveat：若精确 API reference 说明某调用也可能返回此前 asynchronous launch 的错误，就记录“error observed here; cause may precede this call”，而不是把返回位置强行当成起因。

| 原声明 | 判定 | 正确合同 |
| --- | --- | --- |
| Launch 返回 success，所以 work 已完成 | 不成立 | Success 只通过所检查的 submission boundary；还需要 later completion observation |
| Completion boundary 返回 success，所以结果正确 | 不成立 | 它建立完成/error scope；correctness 仍由独立 host comparison 判断 |
| Driver API 是显式的，所以 launch 是同步的 | 不成立 | 显式 handle 不改变 kernel launch 对 host 的异步边界 |
| Driver 只需检查 `cuLaunchKernel` 的 `CUresult` | 不成立 | 还必须检查声明 scope 的后续 completion boundary |
| 纸面合同使 EX04 Runtime-Verified | 不成立 | 没有 GPU observation；Exercise 与 solution 都不改变 evidence axis |

若 submission 或 completion 失败，正常路径不得 copy/compare 尚未建立为有效的结果；cleanup 只释放已经取得的资源，并保持 module/context 活到相关 work 不再使用它们为止。

## 有效替代方案

- 解答 1 可把六行表改成 layered ownership graph，只要所有 required handle、owner、valid-use、release 与 shared invariant 都可复核。
- 解答 2 可由 process owner 统一管理 primary context，或让 A 使用明确的 Driver-created context；两者都必须满足 exact-version Runtime interoperation rules，且 plugin 不能单方面 reset 共享状态。
- 解答 3 的 Driver completion boundary 可以是 context、stream 或 event primitive；有效答案必须写出 scope，并保留 submission/completion 两阶段与独立 correctness comparison。

## 常见错误

- 把 Runtime 的 implicit context/module management 写成“所有资源都自动释放”。
- 只把 `cuda` 改成 `cu`，遗漏 `CUdevice`、`CUcontext`、`CUmodule` 与 `CUfunction` 依赖链。
- 认为两条 API 都进入 driver 栈，所以每个调用必然一一对应。
- 在错误 host thread 上调用 Runtime，却没有核对哪个 Driver context current。
- 让 plugin 用 `cudaDeviceReset` 清理共享 primary context，破坏其他 client 的状态。
- 把 launch success 当 completion，把 completion success 当 correctness，或把静态合同当 Runtime-Verified evidence。

复核日期：**2026-08-26**。这些解答没有编译或执行 CUDA，没有生成 GPU observation，也没有复制 EX04 的完整程序。
