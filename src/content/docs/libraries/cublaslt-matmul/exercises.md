---
title: 'L07 练习：描述符、候选与偏置方向'
description: 用三份静态审查记录证明布局、资源筛选和收尾语义，保留回退、复用失效和实际运行证据的边界。
pairId: l07-exercises
counterpart: /en/libraries/cublaslt-matmul/exercises/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L07-EXERCISES
prerequisites: [L07]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l07-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cublaslt-matmul/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-06' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L07 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cublaslt-matmul/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [L07](/libraries/cublaslt-matmul/)。本页只要求静态推导；题设中的候选是人为构造的审查输入，不是任何 NVIDIA 查询的结果。没有 GPU 要求，四个证据数组为空。

## 提交要求

使用 12.9.2 归档合同。每题明确目标、配置、拒绝条件与剩余验证义务。不要提供完整 CUDA 实现，不从题设推断任何算法存在、正确或最快；完成后再看[独立解答](/libraries/cublaslt-matmul/solutions/)。

## 练习一：描述存储而不是描述愿望

**目标：** 为 `D = 1.5*op(A)*B + 0.25*C` 建立对象与属性记录，解释布局如何配合转置。

**约束：** `op(A):3 x 2`，A 使用 T，实际行主序存储为 `2 x 3, ld=4`；B 行主序为 `2 x 5, ld=7`；C、D 为不重叠的行主序 `3 x 5`，主维度分别 6、8。全部 FP32，计算选 `CUBLAS_COMPUTE_32F_PEDANTIC`、FP32 缩放类型、主机指针模式和默认收尾。不得把 C 当成可以随意转置的输入，也不得因 D 改为原位就只比较布局属性。

**应提交证据：** 句柄、运算、四个布局、偏好的创建/设置/销毁清单；每个属性的归属；一个 A 逻辑元素到存储偏移的推导；流、标量与矩阵的生命期计划。

**验收条件：** A 布局仍为 `2 x 3` 且运算保留 T；C/D 同类型、同形状、同顺序，只有步长不同。若改成原位，需同一 C/D 指针及同一布局描述符对象。所有创建与设置检查状态，布局创建不当作设备数据分配，描述符有效也不当作执行成功。

<details><summary>提示一：把字段分给对象</summary>问每个字段是在改变数学运算，还是在解释已有字节。计算类型属于运算，存储行数属于布局。</details>

<details><summary>提示二：追踪一个元素</summary>`op(A)[1,0]` 从存储 A 的哪个行列读取？用行步长 4 计算，而不是为逻辑转置重新分配数组。</details>

## 练习二：不能盲用第一个候选

**目标：** 为以下人为构造的筛选情景写决策流程，区分搜索预算、真实容量与候选可用性。

**约束：** 查询请求 4 项，假设成功返回 3 项。第 0 项状态失败，其他字段不可用；第 1 项状态成功、需要 2 MiB；第 2 项状态成功、需要 512 KiB。偏好预算为 4 MiB，但实际工作区只有 1 MiB，地址 256 字节对齐。四个实际矩阵指针只能保证 64 字节对齐，查询却保留了默认 256 字节对齐偏好。题目不给真实算法、计时或数值输出。还须处理修正后的查询返回零项、调用返回不支持与设备执行失败三个分支。

**应提交证据：** 每个条目的可读范围与排除理由；修正后的偏好和重新查询步骤；`AlgoCheck`、实际执行、同步、独立参考、计时各自证明什么；保持语义的回退计划。

**验收条件：** 不访问第 3 项，不读取失败项的工作区或算法字段，不把 4 MiB 偏好当作已分配；第 1 项超实际容量。第 2 项虽然容量合适，也不能在错误的对齐声明下直接承诺可用或最快。按真实对齐重查，零候选不访问元素 0，设备执行失败不在失效上下文中盲重试。任何回退都保留计算政策与数学语义。

<details><summary>提示一：数量、状态、资源是三道门</summary>数组容量不等于返回数量；查询成功不等于每项成功；预算内也不等于分配内。</details>

<details><summary>提示二：审查声明是否真实</summary>即使某项工作区适合，搜索时对指针对齐说错了什么？`AlgoCheck` 又为什么不能看到所有实际地址问题？</details>

## 练习三：偏置方向与选择失效

**目标：** 为行主序 `Y:3 x 5` 的五元素输出特征偏置及 ReLU 制定合法描述方案，再写出选择复用边界。

**约束：** 原问题为 `Y[i,j] = max((A*B)[i,j] + bias[j], 0)`，A 行主序 `3 x 2, ld=4`，B 行主序 `2 x 5, ld=8`，Y 行步长 7。全部 FP32、`alpha=1,beta=0`，偏置为设备端五元素紧密向量。按 12.9.2 合同，不准直接组合行主序 D 与 `RELU_BIAS`。不得仅更换 D 的顺序枚举，不能假定任意 GPU 都有候选。

**应提交证据：** 整个转置等式与 A/B/C/D 布局方案；偏置广播方向及参考式；偏置属性设置的指针层级；无候选时保持语义的替代；保守复用键。分别判断只换数据内容、主维度变更、可用工作区缩小、对齐减弱和库组件升级时的处理。

**验收条件：** 合法候选方案的 D 为列主序 `5 x 3`，五元素偏置匹配 D 行数且对应原 Y 列方向；列主序解释与原 Y 字节一致。资源和算法支持仍需验证。应用的键与内部启发式缓存分开，不跨组件版本盲用序列化算法；任何“赢家”必须来自正确性验收后的实际测量，本题没有赢家。

<details><summary>提示一：先改写输出的坐标系</summary>将 `Y` 解释为列主序 `Y^T` 后，原输出特征 j 成了描述符中的哪个维度？ReLU 是逐元素操作。</details>

<details><summary>提示二：重新证明输入与复用条件</summary>外层普通转置会交换乘法顺序。布局和资源条件改变后，即便原始 `m,n,k` 看似相同，也不能只靠这三个整数取回旧算法。</details>

## 下一步

复核[解答](/libraries/cublaslt-matmul/solutions/)与 [PB-R4-008](/practice/#pb-r4-008)。[EX18](/examples/cublas-gemm/)和 [LAB12](/labs/compare-gemm-with-cublas/)是传统 FP32 对照，不提供这些 Lt 任务的运行证据。来源为 [L07](/libraries/cublaslt-matmul/)与 [SRC-CUDA-068](/sources-and-versions/#src-cuda-068)，复核日期 **2026-09-06**。
