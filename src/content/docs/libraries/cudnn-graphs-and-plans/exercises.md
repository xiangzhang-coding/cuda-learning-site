---
title: 'L10 练习：张量约定、候选门槛与复用'
description: 完成三份静态审查材料，覆盖图语义、假设工作区与构建决策，以及缓存和序列化验证，不虚构执行证据。
pairId: l10-exercises
counterpart: /en/libraries/cudnn-graphs-and-plans/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L10-EXERCISES
prerequisites: [L10]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l10-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cudnn-graphs-and-plans/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L10 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cudnn-graphs-and-plans/exercises/" lang="en">Read the English counterpart</a>

## 先修关系

先完成 [L10](/libraries/cudnn-graphs-and-plans/)。这些是静态练习（Exercise），不是 CUDA 实现或实验（Lab），不需要 GPU。四个证据数组全部为空；下文的候选大小与结果是构造的教学输入，不是 NVIDIA 查询结果。

## 提交要求

采用后端 **9.24.0** 和独立固定的前端 **1.27.0**，前端提交为 `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`。提交描述、计算、拒绝原因和未来验证协议，不提交完整源码或虚构日志。区分“题设指定”“可进入下一项检查”“已构建”和“数值已通过验收”。完成后再打开[解答](/libraries/cudnn-graphs-and-plans/solutions/)。

## 练习 1：先描述图，不指定引擎

**目标：** 描述 1x1 互相关（cross-correlation）之后加通道偏置、再做 ReLU 的计算图，并展示逻辑坐标如何对应实际字节。

**约束：** 只有一个分组，填充为零，空间步长和膨胀均为一，不累加旧 Y，激活没有上界截断。X、W、bias 和 Y 的实际存储均为 FP16；计算及两个内部张量（卷积结果、加偏置结果）均为 FP32。内部张量是虚拟张量（virtual tensor），Y 则是可观察输出。逻辑维度与元素步幅如下：

| 张量 | 逻辑轴 | 维度 | 元素步幅 |
| --- | --- | --- | --- |
| X | N,C,H,W | `[1,2,2,3]` | `[12,1,6,2]` |
| W | K,C,R,S | `[3,2,1,1]` | `[2,1,2,2]` |
| bias | N,K,H,W | `[1,3,1,1]` | `[3,1,3,3]` |
| Y | N,K,H,W | `[1,3,2,3]` | `[18,1,9,3]` |

不能为了套用熟悉的布局名称而交换逻辑轴，也不能假设这个小尺寸一定有受支持的 cuDNN 引擎。输入和 Y 使用独立分配；题目没有提供实际地址或对齐保证。

**预期提交证据：** 操作与数据边清单、输出公式和维度推导、`X[0,1,0,2]` 与 `Y[0,2,1,1]` 的元素和字节偏移、各张量最低存储范围、UID 到缓冲区的绑定及生命周期责任，以及独立参考的设计。

**验收标准：** 偏置沿 N/H/W 广播，不沿通道广播。计算类型不能重新解释缓冲区字节。内部虚拟张量不是调用者绑定的输出，但也不意味着工作区为零或只执行一个内核。分别说明前端验证、后端支持、计划构建、实际缓冲区合法性、完成状态和数值验收。参考计算从实际 FP16 输入出发，独立处理累加、偏置、激活和输出舍入，并另行声明容差策略。

<details><summary>提示 1：分开逻辑轴和步幅</summary>用逻辑索引与元素步幅做点积。只有将 FP16 元素偏移换成字节时才乘二。通道变化最快的布局不会给逻辑 C 轴改名。</details>

<details><summary>提示 2：沿着归约和数据边检查</summary>这里的 1x1 滤波器只沿 C 归约。哪些张量穿过应用边界，哪些只存在于卷积、加法和激活之间？</details>

## 练习 2：拒绝候选，不虚构优胜者

**目标：** 审查与 L10 相同的假设候选列表，写出从发现候选到未来验收的决策过程，并明确处理失败。

**约束：** 执行临时空间总预算为 8 MiB，后端筛选上限为 8 MiB，当前实际分配为 6 MiB；排除 `NONDETERMINISTIC`。图还需要 2 MiB 前端临时空间。`1 MiB = 1,048,576 bytes`。C0-C4 只是作业标签，不是引擎标识。大小和 C3 结果均由题设给定，不是观察，也不是候选发现接口承诺返回的内容。

| 候选 | 后端 MiB | 前端 MiB | 总计 MiB | 题设属性或结果 |
| --- | --- | --- | --- | --- |
| C0 | 2 | 2 | 4 | `NONDETERMINISTIC` |
| C1 | 9 | 2 | 11 | 没有被排除的数值标记 |
| C2 | 7 | 2 | 9 | 没有被排除的数值标记 |
| C3 | 4 | 2 | 6 | 没有被排除的数值标记；假设支持检查可接受，随后构建失败 |
| C4 | 5 | 2 | 7 | 没有被排除的数值标记；尚未尝试支持检查和构建 |

**预期提交证据：** 逐行写出最早已知的拒绝原因及剩余责任；在生命周期中标明筛选插入位置；比较 `HEURISTICS_CHOICE` 与 `ALL`；说明带状态检查的总大小查询、实际分配和生命周期协议；处理候选列表为空及之后设备执行失败的分支。

**验收标准：** 排除 C0，但不能因此说所有 Tensor Core 引擎都非确定。按后端上限拒绝 C1，按总预算拒绝 C2。C3 没有提供可执行计划。C4 符合 8 MiB 预算，却装不进 6 MiB 分配，且**不是已观察到的成功**。不能把存在性的 `check_support` 当成所有行都受支持，也不能把 `ALL` 当成实测选择。至少 7 MiB 的合法分配只是尚待满足的一个条件，不是成功证明。空列表应转向相同策略的 FALLBACK、保留语义且独立验证的分解路径，或明确返回不支持，不能盲读候选零。

<details><summary>提示 1：资源要比较两次</summary>后端上限看不到前端节点临时空间。总和符合预算后，还要与实际容量比较；设置任意一种上限都没有分配内存。</details>

<details><summary>提示 2：说清失败发生在哪个阶段</summary>发现候选、存在性支持、计划构建、执行完成和数值验收是不同主张。C4 哪些阶段还没有尝试？为什么设备失败不只是另一次构建拒绝？</details>

## 练习 3：设计复用与验证边界

**目标：** 为未来的外部实现设计保守的缓存/恢复策略，以及正确性和计时协议。

**约束：** 缓存的固定形状计划记录了 7 MiB 总需求，原预算为 8 MiB。分别独立判断这些变化：仅输入内容/指针改变；预算降为 6 MiB；后端版本/构建标识改变；目标硬件改变。另行考虑动态形状图覆盖形状/步幅后图键仍命中，以及尝试序列化 `NCHW_VECT_C` 的情形。题目没有实际观察到缓存命中、构建、恢复或耗时。

**预期提交证据：** 区分应用图/计划缓存、后端默认内核缓存和显式自定义内核缓存的表格；每种变化的失效决策；图 JSON 与选中计划 UBJSON 的区别；拟议 Native Linux 环境清单（Environment Manifest）；以及分别留空的冷启动成本、热执行成本、参考误差、重复性和失败阶段结果字段。

**验收标准：** 语义约定不变时，也必须检查当前缓冲区和资源才能复用应用条目；6 MiB 预算排除了 7 MiB 需求。库版本/构建或硬件改变，需要复核和重新构建，而不是盲目恢复。图键命中不等于完整策略或设备匹配；形状覆盖必须在分配之前按实际形状/步幅查询工作区，并记录后端 9.23.0 门槛。默认内核缓存开关不能定义自定义缓存的淘汰策略。恢复选中计划不会恢复原列表/索引，默认带句柄恢复的 `run_warmup=true` 也意味着它不只是解析。避免对已知受影响的 `NCHW_VECT_C` 布局做序列化。先定义独立参考与确定性检查，再测量；不能声称兼容性、恢复或缓存命中证明准确性或速度。

<details><summary>提示 1：问清缓存到底存什么</summary>已编译 CUBIN 不是已通过验收的应用选择。图 JSON 不是选中计划。应用要在图键之外保存哪些缺失的策略和设备字段？</details>

<details><summary>提示 2：计时之前先定义冷状态</summary>计划未命中时，内核缓存仍可能命中；恢复也可能触发预热。报告需要分别说明哪些主机成本、设备工作、缓存状态和同步边界？</details>

## 下一步

对照[独立解答](/libraries/cudnn-graphs-and-plans/solutions/)和 [PB-R4-011](/practice/#pb-r4-011)。来源依据为 [L10](/libraries/cudnn-graphs-and-plans/)、后端 [SRC-CUDA-071](/sources-and-versions/#src-cuda-071)与前端 [SRC-CUDA-072](/sources-and-versions/#src-cuda-072)，复核日期为 **2026-09-07**。相关的 [L11](/libraries/attention-backend-dispatch/)既不是额外先修项，也不为这些任务提供执行证据。
