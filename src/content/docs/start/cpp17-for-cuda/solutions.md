---
title: 'O04 参考解答：生命周期与主机/设备边界'
description: O04 两道练习的复核推理、有效替代方案和常见错误。
pairId: o04-solutions
counterpart: /en/start/cpp17-for-cuda/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O04-SOLUTIONS
prerequisites:
  - O04-EXERCISES
relatedUnits:
  - O04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O04 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/cpp17-for-cuda/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O04 练习（Exercise）](/start/cpp17-for-cuda/exercises/)的**参考解答**。先比较生命周期（lifetime）和阶段推理，再比较修改方案。这些答案没有运行 CUDA 程序或检查工具（sanitizer）。

## 解答 1：审查生命周期与所有权时间线

合格时间线包含两条独立的线：

1. 资源获取即初始化（Resource Acquisition Is Initialization, RAII）所有者（owner）从成功获取到释放，控制分配生命周期（allocation lifetime）。
2. `view` 是复制得到的非拥有型指针值（non-owning pointer value），它的允许使用区间必须完全位于该 allocation lifetime 内。

提交工作本身不会转移所有权。销毁 owner 会释放 allocation，而 `view` 中保存的位可能完全不变。从释放到最后一次可能使用之间，`view` 是悬空指针（dangling pointer）。更晚出现的完成边界（completion boundary）不能倒过来让之前的释放合法。

**推理：** 安全条件是一条顺序边：所有可能使用先完成，资源后释放。最小修正是让 RAII owner 保持在作用域内，到达并检查 completion boundary，然后才允许析构。View 与范围（extent）一起传递，而且不能在该边界后继续保留。另一种正确设计是把 owner 移入一个操作对象（operation object），该对象只在完成后结束生命周期。

这项审查只建立源码级 lifetime contract，没有记录执行或计时结果。

## 解答 2：审查主机/设备构建与错误边界

各缺陷属于不同阶段：

| 边界 | 审查结论 | 修正 |
| --- | --- | --- |
| 预处理（preprocessing） | declaration 变得可见，通用 definition 仍不可见 | 让实例化路径看到所需 definition |
| 主机编译（host compilation） | 只有当函数体与 device compilation 分开时，host 版本才能使用 host-only facility | 把 host exception policy 隔离在 host-only code |
| 设备编译（device compilation） | `convert<float>` 需要可见且 device-valid 的 definition；device 不支持 `throw` | 提供 device-valid definition，不设置 device exception path |
| 设备链接（device linking） | 构建使用 relocatable device code 时需要 | 使用该模式时提供全部 relocatable device definition |
| 主机链接（host linking） | host object 与 Runtime library 必须完成解析 | 让 declaration、definition 与 explicit instantiation 保持一致 |
| host runtime boundary | 丢弃 `cudaError_t` 会丢失 CUDA failure channel | 与 `cudaSuccess` 比较，并保留 call site 和 error detail |

**推理：** 可靠安排要么把完整 `__host__ __device__` 模板定义（template definition）放在 header 中，让两条 compilation path 都能实例化；要么在由 CUDA 编译的实现代码中显式实例化（explicit instantiation）受支持特化，并暴露匹配 declaration。若操作确实只属于 host，就移除 device annotation，把实现留在普通 C++ host code，而不是强迫同一个函数体通过两个 compiler。

Runtime 返回值必须先被检查，之后可选 host adapter 才能把失败转成异常（exception）。该 host exception 可以在 stack unwinding 中使用 RAII，但绝不跨入 device code。即使 preprocessing、compilation 与 linking 全部通过，也仍没有 GPU execution evidence。

## 有效替代方案

- 调用者可以让 owner 活过显式 completion operation，也可以把 owner 转移给更长寿的 operation state。两种设计都必须让释放晚于最后一次可能使用。
- Template definition 可以放在 header 中供 implicit instantiation 使用，也可以为封闭的受支持类型集合做 explicit instantiation。若没有 device path 需要它，host-only template 可以留在普通 C++ implementation code。
- Host 层可以继续返回 `cudaError_t`，也可以只在一处转成 typed host exception。只要原始 CUDA code、call site 和 message 仍可观察，两种政策都有效。

## 常见错误

- 把复制后的 pointer 当成第二个 owner，或认为复制会延长 allocation lifetime。
- 认为 owner 销毁会把每个 raw pointer copy 都写成 `nullptr`。
- 提交后立即释放 allocation，没有等到最后一次可能的 asynchronous use。
- 认为 header 中的 template declaration 会让另一个 translation unit 里的通用 definition 自动可见。
- 只把 `__host__ __device__` 函数体当作 host code 审查。
- 从 device code 抛异常，或用未记录的 host exception 替换 `cudaError_t`。
- 把成功构建或 clean sanitizer run 当成未执行路径的证明。

复核日期：**2026-08-26**。这些解答只提供推理和设计，没有编译、GPU 执行、sanitizer 输出或性能声明。
