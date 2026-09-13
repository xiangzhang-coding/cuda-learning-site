---
title: 'P06 练习：参考值、分派例外与尺度生命周期'
description: 推导两份数值误差预算，修复 autocast 审查，并在纸面上审查双微批次优化器边界。
pairId: p06-exercises
counterpart: /en/frameworks/mixed-precision-contracts/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: P06-EXERCISES
prerequisites: [P06]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/mixed-precision-contracts/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P06 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/mixed-precision-contracts/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [P06](/frameworks/mixed-precision-contracts/)，唯一直接先修项为 `[P06]`。这些原创静态练习（Exercise）无需 GPU、安装或实现。四个证据数组均为空。**依赖 GPU 的行为保持待硬件验证（Pending Hardware Verification）。**

## 提交要求

源码合同固定为 PyTorch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**，原生 Linux x86_64，而不是本地已验证环境。提交计算、决策表与未来验收要求，不提交虚构 dtype 日志、追踪、计时或代码。完成三题后再打开[解答](/frameworks/mixed-precision-contracts/solutions/)。

## 练习 1：区分量化与后续误差

**目标：** 建立两份独立参考，说明各自能检验哪部分信息。

**约束：** 使用 P06 的两项点积：S 为 `a=[1+2^-12,1]`、`b=[1,-1/2]`；R 为 `a=[1+2^-10,1]`、`b=[1+2^-10,-1]`。输入与最终输出按最近值、偶数优先舍入到 FP16。仅在题设模型中，两次转换之间的乘法与累加精确执行。另考察一条先舍入乘积再减去 1 的 R 路径。两条路径都不是实测 GPU 实现。

**应提交证据：** 原始与存储操作数，完整原值参考（full-original reference）与存储输入参考（stored-input reference），模型输出，逐行有符号差与绝对误差，两行向量的最大绝对误差，相对完整原值向量的欧氏范数相对误差，以及 `atol=2^-21` 配合 `rtol=2^-11` 和 `rtol=0` 时的验收决策。

**验收标准：** 完整原值参考在窄化前计算，并独立于待评估路径。不得把存储输入参考改名为完整原值。解释两条内部路径为何能得到 R 的相同终值，以及修改 GradScaler 为何不能修复 S。声明零参考约定并拒绝非有限值。容差通过不隐含逐位可复现性、原生加速或累加器位宽。

<details><summary>提示 1：在纸上放置每个舍入点</summary>在 1 附近，FP16 间距是二的负十次方。先展开 R 的乘积再减去 1，随后比较它到相邻可表示输出的距离。</details>

<details><summary>提示 2：固定参考分母</summary>对每份参考，都用模型输出减去该参考。完整原值向量是模型向量乘以一个公共标量，因此范数相对误差可以简化。</details>

## 练习 2：修复 autocast 审查

**目标：** 用逐运算的分派、精度与能力检查替换只看 dtype 的批准。

**约束：** 某方案从 FP32 参数与输入开始，仅在调用者线程启用 CUDA FP16 autocast，并给出下列结论。假设形状合法、输出不重叠，不要用参数错误回避精度问题。

| 方案情形 | 待审查结论 |
| --- | --- |
| 非原地 `mm` 后接 `mse_loss` | 两者必须输出 FP16 |
| 原地 `addmm_`，以及 `addmm` 指定 `out=` | 两者获得与非原地调用相同的 autocast 政策 |
| `sum` 指定 `dtype=torch.float64` | 外层上下文覆盖 dtype |
| 未列出的 `mean`、`std` | 所有归约自动变为 FP32 |
| 工作线程；之后禁用 autocast 的区域 | 继承调用者状态；已有 half 张量自动扩大 |
| `torch.cuda.is_bf16_supported` 配合 `including_emulation=True` | 返回 true 证明原生 BF16 Tensor Core 速度 |
| FP32 输出；新 `fp32_precision` 加旧 `allow_tf32` | 输出证明 IEEE 乘法，而且控制族可以混用 |

**应提交证据：** 修正每一行，指出公开 autocast 与 scaler 命名空间及不同设备参数名，设计独立的更严格 FP32 分支与能力受限的 BF16 分支。分别记录输入、乘法、累加、输出与缩放，保留未知的内部字段。

**验收标准：** 把适用条件与原生提升、合法性分开；上下文或输出缓冲都不能决定全部内部精度。需要时在每个工作线程内启用上下文，敏感区域要明确扩大操作数。只用一套精度控制族，记录归约/全累加标志，不把能力或输出 dtype 当成已观察的后端行为。以有限性/误差与参数更新标准收尾，而不是预测速度。

<details><summary>提示 1：适用条件先于 dtype 预测</summary>先问这个确切重载是否参与 autocast。显式 dtype、输出缓冲与原地修改，是反驳统一结论的三种不同原因。</details>

<details><summary>提示 2：能力问题比基准测试窄</summary>BF16 查询可能允许模拟。即使确认原生能力，也没有说明这个运算实际选择的算法、数值验收或耗时。</details>

## 练习 3：两个微批次共用一个尺度

**目标：** 审查梯度累积经过有限更新与独立受控非有限分支的边界。

**约束：** 本题是标量纸面算术。初始 FP32 参数 `p=2`，普通 SGD 使用 `lr=1/4`，无动量、权重衰减或裁剪。两个等大微批次的损失贡献已经按有效批次（effective batch）的平均目标归一化；未缩放梯度贡献为 `g1=3/4`、`g2=-1/4`。有限分支尺度固定为 `s=8`。错误方案把第一份贡献乘以 8，在第二份前改为 4，并把总梯度除以 4。另一个独立分支把全部状态重置为 `p=2`，设 `init_scale=0.5`、默认 `backoff_factor=0.5`，并在反缩放完成前检测到非有限梯度。题目不提供运行观察。

**应提交证据：** 已缩放贡献、累积梯度、反缩放梯度、预测参数及尺度生命周期边界的台账。计算错误方案的梯度与参数。对非有限分支预测跳过更新与下一尺度。规定未来有限损失、梯度、参数差值与尺度检查；各分支恢复相同新状态，并把检查放在计时外。

**验收标准：** 两份贡献完成后再反缩放，每个优化器每步只做一次。已归一化的贡献不要再除以二。非有限分支检验的是低于 1 的溢出/回退，不是下溢检测或自然观察到的模型失败。有限损失本身不够；对照分支须有非零、可表示的有限更新，跳过分支参数须保持不变。反缩放后不能再未经检查地修改梯度而使检查失效。

<details><summary>提示 1：累积缓冲有单位</summary>尺度不变时，两份贡献具有相同单位，一次除法就能消去因子。如果因子不同，总和除以后一个因子不能还原第一份贡献的权重。</details>

<details><summary>提示 2：把 step 与 update 分开</summary>跳过优化器使本步参数不变。Scaler 仍在有效批次边界调整尺度；乘以回退因子没有以一为下限的钳制。</details>

## 下一步

对照[独立解答](/frameworks/mixed-precision-contracts/solutions/)与 [PB-R5-006](/practice/#pb-r5-006)。依据为 [P06](/frameworks/mixed-precision-contracts/)、[SRC-CUDA-080](/sources-and-versions/#src-cuda-080)和 [SRC-CUDA-082](/sources-and-versions/#src-cuda-082)，复核于 **2026-09-12**。原创纸面依据不是 GPU 观察。
