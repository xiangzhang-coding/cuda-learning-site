---
title: 'P07 练习：关联、采集窗口与诚实报告'
description: 重建题设启动图，推导两个调度采集窗口，拒绝缺少环境与权限记录的仅表格性能分析报告。
pairId: p07-exercises
counterpart: /en/frameworks/python-to-cuda-profiling/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: P07-EXERCISES
prerequisites: [P07]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p07-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/python-to-cuda-profiling/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P07 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/python-to-cuda-profiling/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [P07](/frameworks/python-to-cuda-profiling/)，恰好为 `[P07]`。这些是原创静态练习（Exercise），不是追踪文件或 CUDA 实现。无需 GPU，四个证据数组均为空，**依赖 GPU 的行为保持待硬件验证（Pending Hardware Verification）**。

## 提交要求

使用 PyTorch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**，原生 Linux x86_64 的合同。提交关系图、调度计算与证据/保管计划。练习 3 中全部所谓观察都是待审查的假设声明，不是本站测量。不要创建代码、合成 JSON 追踪、截图或计时。完成三题后再读[解答](/frameworks/python-to-cuda-profiling/solutions/)。

## 练习 1：不匹配名称也能归属工作

**目标：** 根据显式连接恢复运算到设备的关系，识别仍然未知的部分。

**约束：** 以下符号关系仅在本题中完整覆盖 F-A、F-B 与 F-C。题设 F-B 只处理元数据。K-A2 与 K-C1 共享“elementwise”显示标签。题设 K-A1 在 F-A 主机范围结束后执行。额外 K-U 没有给定连接或设备/流身份。这些标识符不是实际追踪记录或 JSON 模式字段。

| 框架运算实例 | 主机启动 | 关联符号 | 设备工作 | 设备 / 流 |
| --- | --- | --- | --- | --- |
| `F-A` | `H-A1` | `C-X` | `K-A1` | `0 / 3` |
| `F-A` | `H-A2` | `C-Y` | `K-A2` | `0 / 3` |
| `F-B` | 无 | 无 | 无 | 不适用 |
| `F-C` | `H-C1` | `C-Z` | `K-C1` | `0 / 7` |

**应提交证据：** 所有给定框架到主机再到 CUDA 的链，每次运算的核函数数量，K-U 的处置，以及拒绝按显示名称、最近范围或 CPU 时间包含关系归属的理由。描述未来实际追踪必须保留的事件身份与采集上下文。

**验收标准：** 尽管 K-A1 延后执行，仍能正确归属；分开两个同名核函数，K-U 保持未解析。说明完整题设 F-B 中的零核函数，为何不同于不完整真实采集中的核函数缺失。表格不能推导时长、跨流顺序、利用率、精度或瓶颈。用户标注不强制一对一映射或 GPU 同步。

<details><summary>提示 1：连接身份，而非标签</summary>从框架运算实例出发，沿给定主机启动与关联符号追踪。共享显示标签无权替换一条连接。</details>

<details><summary>提示 2：缺失不等于零</summary>这里仅明确完整且只处理元数据的情形能确立零工作。没有连接的项属于未解析；真实采集也可能因采集失败而丢失活动。</details>

## 练习 2：保留两个活动窗口

**目标：** 不执行 profiler，推导调度及逐窗口导出合同。

**约束：** 采用 `wait=1`、`warmup=1`、`active=3`、`repeat=2`、`skip_first=0`、`skip_first_wait=0`；十个迭代索引 0-9，每次之后调用一次 `prof.step()`。每个迭代包含一个不同的中性工作负载标签，工作负载预热在性能分析之前完成。一个导出方案只在上下文结束后保存一次；另一个把两次回调都写入同一个目标。

**应提交证据：** 十行动作表、活动索引集合、回调转移与数量、不同的 W1/W2 产物位置、包含的工作负载标签，以及对两种导出方案的拒绝理由。解释 `acc_events=False` 与 `acc_events=True`、漏掉迭代边界 step 的影响，以及 step 为什么不是 CUDA 同步合同。

**验收标准：** 区分等待、profiler 预热、活动工作负载与完成窗口导出。要求每次回调各有一个不同且成功保留的产物，不只是回调被调用两次。不把 profiler 记账算成工作负载范围，也不声称追踪已经保存。说明只导出最后周期会丢失什么，以及累积摘要事件为何不能重建未保存时间线。

<details><summary>提示 1：先给工作编号，再给转移编号</summary>初始动作属于迭代零。迭代结束才前进到下一步；最后一个活动动作先记录工作，随后转移才保存窗口。</details>

<details><summary>提示 2：产物数量是另一项义务</summary>两个完成的记录周期需要两个不同且保留的时间线目标。回调次数、写入成功与聚合设置回答不同问题。</details>

## 练习 3：修复性能分析证据包

**目标：** 把过度声明的报告改成诚实的采集与计时计划，并补全环境与隐私边界。

**约束：** 假设报告列出支持 CUDA 活动及一张 CUDA 时间表，但导出 JSON 没有核函数事件。它只记系统 Toolkit 版本，省略已加载 CUPTI 与驱动身份。它启用形状和栈记录，却声称延迟复用分配是无插桩行为；通过累加核函数时长得到应用延迟；提议在 torch.profiler 外嵌套 Nsight，并要求提权重跑和公开上传含私有源码路径的原始栈。本练习不授权采集或政策变更。

**应提交证据：** 逐项接受/拒绝/未知表，CUDA 追踪冒烟验收条件，缺失值写未知的完整 P07 环境清单（Environment Manifest），分开的正确性、profiler 与无 profiler 计时计划，以及原始/派生产物的保管、脱敏、权限和审核批准规则。

**验收标准：** 识别可能存在 CUPTI 回退，但不声称它是唯一诊断。检查活动窗口里的 CPU/运行时/核函数证据，仅在窗口内含传输负载时要求传输事件。检查已加载库身份、精确构建/依赖、驱动/工具兼容性、采集完整性与主机/容器政策。形状采集能改变张量生命周期，表格总量不是墙钟时间。分开 CUPTI 客户端，区分活动追踪与硬件计数器，不要求一律 root 或削弱安全措施，不公开原始私有路径、凭据或机密工作负载数据。缺少条件时声明受阻，不伪造通过。

<details><summary>提示 1：问数字由哪一层产生</summary>CUDA 列可能来自回退计时，而不是导出的设备活动。检查实际时间线内容与启动关系，不只检查有无表格或文件。</details>

<details><summary>提示 2：观察工具也是实验的一部分</summary>形状采集可能持有张量，栈可能暴露源码位置。把关系实验与无插桩测量分开；任何共享都须先取得授权并审核脱敏副本。</details>

## 下一步

对照[独立解答](/frameworks/python-to-cuda-profiling/solutions/)与 [PB-R5-007](/practice/#pb-r5-007)。依据为 [P07](/frameworks/python-to-cuda-profiling/)、[SRC-CUDA-080](/sources-and-versions/#src-cuda-080)和 [SRC-CUDA-083](/sources-and-versions/#src-cuda-083)，复核于 **2026-09-12**。纸面答案不会产生 CUDA 追踪或性能观察。
