---
title: 'O04 练习：审查生命周期与主机/设备边界'
description: 不执行 CUDA，审查一条所有权时间线和一组主机/设备构建与错误设计。
pairId: o04-exercises
counterpart: /en/start/cpp17-for-cuda/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O04-EXERCISES
prerequisites:
  - O04
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
    attrs: { name: 'cuda:pair-id', content: o04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O04 }
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

<a class="locale-pair" data-locale-counterpart href="/en/start/cpp17-for-cuda/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O04：面向 CUDA 学习者的 C++17 复习](/start/cpp17-for-cuda/)。这两道练习（Exercise）只做源码和设计审查，不需要 GPU、构建、检查工具（sanitizer）运行或尚未发布的实现。

## 作答方法

先写出可复核产物，再依次打开提示。把指针值（pointer value）、被指对象生命周期（pointee lifetime）、所有者（owner）、编译阶段（compilation stage）和错误通道（error channel）分成独立字段。完整答案在独立的[参考解答页](/start/cpp17-for-cuda/solutions/)。

## 练习 1：审查生命周期与所有权时间线

一个主机（host）侧资源获取即初始化（Resource Acquisition Is Initialization, RAII）对象拥有一块分配（allocation），并暴露裸 `float* view`。主机代码提交了未来可能使用 `view` 的工作，随后销毁 owner，最后才到达计划中的完成边界（completion boundary）。

**目标：** 审查这个顺序，并重写生命周期合同，使 `view` 的每次使用都发生在分配有效期间。

**约束：** 把 `view` 视为非拥有型（non-owning）；不能假设 owner 销毁会改变复制后的 pointer value 或把它设为 `nullptr`；不运行代码；保留显式 completion boundary。

**预期证据：** 一条时间线，标出 owner、非拥有型视图、最后一次可能使用、分配释放事件（allocation release）、无效区间和一种修正后的所有权顺序。

**验收条件：** 分开 pointer value 与 pointee lifetime；指出 view 最早可能成为悬空指针（dangling pointer）的位置；让 RAII owner 活到 completion 之后，或把它转交给能活到该边界的对象；携带所需范围（extent）；不写运行或性能声明。

<details><summary>提示 1</summary>为指针对象（pointer object）和它指示的 allocation 各画一条线。</details>

<details><summary>提示 2</summary>修改接口前，先把最后一次允许访问和释放事件放在同一条时间线上。</details>

## 练习 2：审查主机/设备构建与错误边界

一个头文件（header）声明了 `template<class T> __host__ __device__ T convert(T);`。通用定义只在 `.cpp` 文件中，而且包含 `throw`。某个 `.cu` 翻译单元（translation unit）在设备路径（device path）上使用 `convert<float>`，主机封装层（host wrapper）同时丢弃一个 CUDA Runtime 返回值。审查记录只写了预处理（preprocessing）已通过。

**目标：** 产出边界审查，使所需模板特化（template specialization）可用、异常（exception）留在 host，并保留显式 CUDA 错误处理（error handling）。

**约束：** 不编译或执行该场景；分开 preprocessing、host compilation、device compilation、可选 device linking 和 host linking；不能用一条未记录的 exception 替换 `cudaError_t` 结果。

**预期证据：** 一张定位各缺陷的阶段表，以及修正后的文件放置、标注（annotation）和 host error-policy 设计。

**验收条件：** 解释为什么只有声明（declaration）不能提供隐式实例化（implicit instantiation）；同时检查 `__host__ __device__` 的两个 target；从 device path 移除 exception handling；在 host boundary 检查并保留每个所需 CUDA error code；说明构建阶段成功也不能证明执行。

<details><summary>提示 1</summary>对每个阶段，列出该阶段实际可见的源码或定义。</details>

<details><summary>提示 2</summary>把模板函数体分别当作 host code 和 device code 审查，再单独审查 Runtime 调用。</details>

## 下一步

先独立完成两道审查，再对照[参考解答](/start/cpp17-for-cuda/solutions/)的推理，并继续到[练习题库（Practice Bank）PB-R1-001](/practice/#pb-r1-001)。
