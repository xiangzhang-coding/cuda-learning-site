---
title: 'L11 练习：描述符、资格与分派声明'
description: 推导第二组 BHSD 描述符，判断有界候选失败，并在不执行注意力的前提下审计路由、数值和可视化证据。
pairId: l11-exercises
counterpart: /en/libraries/attention-backend-dispatch/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L11-EXERCISES
prerequisites: [L11]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'SRC-CUDA-071: cuDNN backend release notes'
    url: 'https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/release-notes.html#cudnn-9-24-0'
    version: 'Backend 9.24.0'
    platform: 'Native Linux policy; versioned support and known issues, not runtime evidence'
    accessDate: '2026-09-07'
  - title: 'SRC-CUDA-072: cuDNN frontend release and immutable source'
    url: 'https://github.com/NVIDIA/cudnn-frontend/releases/tag/v1.27.0'
    version: 'Frontend 1.27.0; f77fbc3d21be3f24cd0286b9b368105f7c518b8a'
    platform: 'Pinned SDPA descriptors, representation gates, plans, and Python routing; source inspection only'
    accessDate: '2026-09-07'
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l11-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/attention-backend-dispatch/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: L11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L11 }
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
  - tag: meta
    attrs: { name: 'cuda:source-count', content: '2' }
  - tag: meta
    attrs: { name: 'cuda:source-versions', content: '9.24.0,1.27.0' }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/attention-backend-dispatch/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [L11](/libraries/attention-backend-dispatch/)。其严格有序直接先修仍为 `A11, L10, L08`；本练习（Exercise）集只直接依赖 `[L11]`。依据描述符（descriptor）、公式和固定提交源码推导，不要求 GPU、安装、编译或完整注意力实现。

## 提交要求

采用 **backend 9.24.0** 与 **frontend 1.27.0**，SHA 为 **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**，复核日期 **2026-09-07**，对应 [SRC-CUDA-071](/sources-and-versions/#src-cuda-071) 和 [SRC-CUDA-072](/sources-and-versions/#src-cuda-072)。应提交证据指纸面推导与源码阅读记录，不是运行观察。四个证据数组保持为空，不授予或继承证据状态（Evidence Status）。上游资料仅链接与转述，逐文件权利见共享来源记录；不复制代码、测试、手册或图。完成三题后再打开[独立解答](/libraries/attention-backend-dispatch/solutions/)。

## 练习一：没有越界的描述符也可能错误

**目标：** 在询问前端表示（frontend representation）或执行计划（execution plan）资格之前，证明逻辑注意力坐标与真实存储之间的映射。

**约束：** 从 L11 的稠密前向推理（dense forward inference）契约出发，但改用 `B=1,H=2,S=128,D=128`。Q/K/V/O 全部真实存为 BF16，使用各自独立的连续 BHSD 缓冲区；计算与中间类型为 FP32，明确设置缩放系数（scale）`1/sqrt(D)`，并设 `generate_stats=false`。头数、长度、深度均相等；没有掩码（mask）、偏置（bias）、dropout、分页（paging）、不规则偏移（ragged offsets）、反向（backward）、FP8 或形状覆盖。提案在未改变的 BHSD 字节上声明 `[32768,128,256,1]` 元素步长（element stride）。尚未实际分配或调用。

**应提交证据：** 各张量的逻辑形状、正确元素与字节步长、偏移公式、最后逻辑偏移与字节范围、每个张量的元素和字节容量，以及四份独立缓冲区总容量。给出精确缩放表达式和十进制近似，说明存储为 FP32 的缩放值会舍入。比较正确与提案描述符在 `(0,1,0,0)` 的偏移。解释为何数学上的 `K^T` 不改变前端 K 形状，以及此处为何不需要 Stats 输出分配。

**验收条件：** 证明最后一个元素未越界不等于逻辑映射正确。区分两字节 BF16 存储和四字节 FP32 计算与中间类型。四缓冲区容量中不能加入虚构工作区（workspace），不能由字节算术声称对齐，也不能推断计划、所选引擎或正确性结果。修复必须匹配真实存储，不能只改标签。

<details><summary>提示一：从最内层维度推导步长</summary>连续 BHSD 的深度维每次前进一个元素，序列维前进一整行深度，头维前进一整个序列。确定真实存储类型后，才能将元素步长转换为字节步长。</details>

<details><summary>提示二：检查能区分两种布局的坐标</summary>两种不同的紧凑布局可能让最后一个坐标具有相同偏移。在序列位置为零时，从头零移到头一，可以看出相邻头还是相邻序列行被交错存放。</details>

## 练习二：分类拒绝，但不改变参考

**目标：** 区分课程范围、前端特性资格、后端计划策略和执行证据，同时保持原始参考不变。

**约束：** 下表是相互独立的构造案例，不是观察。每行都从 L11 的 `B=1,H=2,S=128,D=64` 契约出发。内存策略中，`W_backend` 表示后端计划工作区，`W_frontend` 表示前端节点工作区，`W_cap` 表示应用总临时存储预算；没有测得或给定任何大小。

| 案例 | 假设条件 |
| --- | --- |
| A | 设备为 SM75，且后端整体支持矩阵列出了它 |
| B | Q/K/V/O 改为 FP32，同时显式请求 UNIFIED |
| C | 新增必需的因果掩码（causal mask）；提案为进入无掩码教学子集而删除它 |
| D | `W_backend <= W_cap`，但 `W_backend + W_frontend > W_cap` |
| E | 候选带 `NONDETERMINISTIC`，应用要求可重复性 |
| F | 图（graph）验证通过且计划构建成功，但没有执行或实际所选计划的运行记录 |

**应提交证据：** 逐项指出失败或尚不完整的层次，给出有边界的下一步，并说明仍不知道什么。必须区分 UNIFIED 拒绝 FP32 与 COMPOSITE/AUTO 可能接受 FP32，同时保持后者位于课程低精度契约之外。说明稳定 FP32 参考替代方案如何保留原公式、输入来源、缩放系数、请求特性和预先声明的验收策略。引用精确固定提交的支持检查、测试或后端来源作为事实条件依据。

**验收条件：** 所有案例均不得静默改变存储类型、移除必需特性、重写参考、放宽容差或授予运行证据。无法处理完整请求的替代路径必须报告不支持。工作区过滤不是最终分配，也不是总 GPU 内存上限。确定性（determinism）不等于准确性。图或计划阶段成功不识别真实框架分派（dispatch），也不证明注意力调用已完成。

<details><summary>提示一：将库整体支持与当前操作分开</summary>某个后端包可以在该 GPU 上支持其他操作。某种前端表示可以允许一个类型，却找不到支持引擎。两个陈述都没有抵达执行层。</details>

<details><summary>提示二：写出拒绝允许改变什么</summary>拒绝可以改变合格候选集合，或导致显式不支持结果，但不能改变数学目标。应将最终总临时存储需求与上限比较，独立于 Q/K/V/O 分配。</details>

## 练习三：对照来源审计分派叙述

**目标：** 修正一份混淆算法、前端表示、Python 路由（routing）、架构条件及运行观察的源码阅读报告。

**约束：** 下列声明均为虚构，没有运行代码。采用 L11 的不可变源码坐标和保持不变的独立 [VIS18](/visuals/attention-memory-traffic/)，不使用未固定版本的框架文档或新实现。

| 声明 | 待审计内容 |
| --- | --- |
| 算法与可视化 | FlashAttention 论文加上 VIS18 下轨证明了 cuDNN 后端；BF16 允许将可视化的 FP32 字节总数减半 |
| 表示 | AUTO 对 UNIFIED 和 COMPOSITE 做基准测试，并在任意执行错误后重试所有实现 |
| Python 路由 | 排名索引就是引擎身份；严格 `select_plan(i)` 在固定候选拒绝后静默尝试其他计划；普通 C++ 规划具有完全相同行为 |
| 硬件 | 一般 SM75 cuDNN 支持使这条 SDPA 路径可用；C++ SM100 OSS prefill 引擎支持所有 Blackwell GPU，包括 SM103 |
| 版本与问题范围 | 标为 9.18.1 的矩阵是完整 9.24 契约；9.25 预览条件已经稳定；解码因果掩码与不等头数问题及反向长度一限制说明全部前向都损坏 |
| 观察 | 成功构建名为 `flash_attention` 的图证明框架所选后端；确定性计划保证相对 FP32 参考的准确性 |

**应提交证据：** 给出六项修正及固定提交阅读坐标。重建 VIS18 不变的默认 `N=8,d=4,Br=Bc=4` 逻辑元素与字节总数。分别描述普通 C++ 规划、未固定 Python 计划的构建拒绝路由，以及可选严格 Python 选择。最后列出识别实际执行计划所缺少的最小运行记录，不编造记录内容。

**验收条件：** 论文只支持历史，VIS18 保持四字节逻辑账本，AUTO 选择前端表示而非实测引擎，任意执行失败不是声明的构建拒绝。对那个特定 C++ 引擎，SM100 就是恰好 SM100。保持 9.24 已知问题的精确范围，排除 9.25 开发者预览（Developer Preview）条件。框架真实 API 分派留给后续独立审查的单元，不编造框架版本、引擎身份、流量、输出、计时或性能声明。

<details><summary>提示一：为每个层次绑定依据</summary>AUTO 查图属性，资格查支持面和类型测试，Python 策略查 router 与 pygraph 源码，架构条件查确切引擎头文件。论文不能回答这些依赖发布版本的问题。</details>

<details><summary>提示二：沿着仍然缺失的证据检查</summary>候选列表不是所选计划，已构建计划不是已完成调用，可重复输出也不一定准确。列出虚构报告未提供的环境、所选计划身份、完成检查和参考验收。</details>

## 下一步

对照[独立解答](/libraries/attention-backend-dispatch/solutions/)，再完成 [PB-R4-012](/practice/#pb-r4-012)。来源：[L11](/libraries/attention-backend-dispatch/)、[SRC-CUDA-071](/sources-and-versions/#src-cuda-071) 和 [SRC-CUDA-072](/sources-and-versions/#src-cuda-072)，复核日期 **2026-09-07**。情景与推导均为原创，不新增实验（Lab）、可运行示例（Runnable Example）、CUDA 运行或继承证据。
