---
title: 'P01 练习：审查桥接与证据'
description: 修复排队结果的所有权方案，审查固定环境和假设摊销模型，不将推导写成 GPU 运行结论。
pairId: p01-exercises
counterpart: /en/python/cuda-python-bridge/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: P01-EXERCISES
prerequisites: [P01]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'CUDA core installation and support boundary'
    url: 'https://nvidia.github.io/cuda-python/cuda-core/1.2.0/install.html'
    version: 'cuda-core 1.2.0'
    platform: 'Static Python bridge and dependency audit, not execution'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/python/cuda-python-bridge/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P01 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/en/python/cuda-python-bridge/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [P01](/python/cuda-python-bridge/)，严格为 `[P01]`。这些原创纸面练习（Exercise）不需要 GPU、安装包或执行 CUDA，证据数组保持为空。前置链为 `P01 -> P01-EXERCISES -> P01-SOLUTIONS`。

## 提交要求

打开[解答](/python/cuda-python-bridge/solutions/)前，提交分层/所有权图、独立算术、配置审查和有条件的成本推导。以下数值为题设输入，不是实测性能或 EX21 输出。只用选定配置；增加另一个 Toolkit 版本不是修复。

## 练习 1：返回视图不等于结果已完成

**目标：** 修复 Python 服务方案，同时区分 CPU 工作、已提交的 CUDA 工作与已完成输出。

**约束：** 一个请求对五个 float32 值相加：`a=[1,-2,0.5,4,0]`、`b=[1,1,-0.5,4,-0.5]`。方案先初始化页锁定主机输入、用 Python 算参考值，再排队 H2D、以每块 256 线程启动带边界判断的核函数、排队 D2H。函数只返回页锁定输出的 ctypes 视图，放弃全部 Buffer、流与 Kernel 持有者，调用者立即比较。作者还因为进程导入了 CUDA Python，就把 Python 参考计算称为“GPU 执行”。假设参数封送和核函数本身都正确。

**预期提交证据：** 按执行位置分类每一步；推导五个输出、网格/尾部线程数及分开的主机/设备载荷。分别为“阻塞后返回”和“异步结果对象”画最小生命周期与完成依赖。说明后者必须持有什么，不要虚构新的 CUDA API。

**验收标准：** Python 参考实现仍在 CPU 上运行。两种设计都持有存储与代码至排队使用完成，在 CPU 检查前确认 D2H 完成，并在完成失败时报告错误，而非返回貌似有效的结果。单独视图不足以拥有资源。字节总数不含上下文/库开销；纸面算术不提供运行证据。

<details><summary>提示 1：跟踪函数返回之后的使用</summary>H2D 仍会读取主机输入，D2H 仍会写入主机输出。局部变量消失不会取消这些排队使用。</details>

<details><summary>提示 2：区分所有权与就绪</summary>应用可以设计类似 future 的对象持有资源，但它还需要检查完成的操作。仅保留存储，不代表输出已经可读。</details>

## 练习 2：审查配置与性能声明

**目标：** 拒绝没有依据的兼容性/证据声明，并求解明确标为假设的复用模型。

**约束：** 一个方案安装普通 CPython 3.14.7 和 bindings 13.4.1，不固定 core/pathfinder/NumPy，另外加入 `[cu13]` extras。它假设系统 Toolkit 13.3.1 决定了全部已加载原生库，说示例没有导入 NumPy 所以可以删除它，并将主机测试通过标为运行已验证（Runtime-Verified）。将其修复为 P01 唯一的原生 Linux x86-64 配置。另有独立成本模型：桥接一次准备花 1800 时间单位，每个请求另花 80；匹配的 CPU 路径每次花 170。这些是给定模型值，不是观察；假定两条路径解决同一个通过验收的问题。

**预期提交证据：** 精确的解释器/包/原生组件/驱动账本，带哈希 wheel 锁定文件的范围，主机测试后及原生编译/链接后仍缺失的证据，首次严格获益的整数复用次数，以及每次请求都重新准备时的结果。

**验收标准：** 分开记录 core 1.2.0、bindings 13.4.1、pathfinder 1.8.1、NumPy 2.5.3、原生 NVRTC/nvJitLink 13.3.33、Toolkit 13.3.1、Ubuntu 24.04 和驱动目标 610.43.02。要求实际加载库的身份。区分政策允许的 API 子集与“所有绑定均兼容”。不将成本不等式或任何非 GPU 检查转为实测速度提升或运行已验证状态。

<details><summary>提示 1：包版本不是加载器记录</summary>wheel 固定值与哈希标识 Python 产物，不冻结系统驱动、解释器构建、原生库搜索结果或 GPU。</details>

<details><summary>提示 2：先写两边总成本</summary>比较 `1800+80*R` 与 `170*R`；相等不算严格获益。若每次都准备，先把准备成本移入乘以 R 的括号。</details>

## 下一步

查看[独立参考解答](/python/cuda-python-bridge/solutions/)和 [PB-R5-001](/practice/#pb-r5-001)。来源依据为 [SRC-CUDA-077](/sources-and-versions/#src-cuda-077)与 [SRC-CUDA-079](/sources-and-versions/#src-cuda-079)，核对于 **2026-09-12**。场景与提示为原创，没有复制上游习题。[EX21](/examples/cuda-python-launch/)独立保持待硬件验证（Pending Hardware Verification）。
