---
title: 'P04 练习：审查区间两端'
description: 分类计时声明，修复双分支事件边界，并在不写实现、不编造观察的前提下设计完整测量报告。
pairId: p04-exercises
counterpart: /en/frameworks/queued-work-timing/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, exercise-1, exercise-2, exercise-3, continue, sources]
resourceKind: exercise-set
unitId: P04-EXERCISES
prerequisites: [P04]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Pinned PyTorch CUDA semantics'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Native Linux CUDA; asynchronous execution and streams'
    accessDate: '2026-09-12'
  - title: 'Pinned PyTorch Stream and Event interfaces'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Event timing, completion, and call-time stream dependencies'
    accessDate: '2026-09-12'
  - title: 'Pinned PyTorch device synchronization'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/__init__.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Selected-device synchronization scope'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/queued-work-timing/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,exercise-1,exercise-2,exercise-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P04 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '3' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/queued-work-timing/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

先完成唯一直接前置 [P04](/frameworks/queued-work-timing/)。使用 torch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**、原生 Linux x86_64、native 分配器。提交书面边界图、判断与报告字段，不提交实现。这些练习（Exercise）无需 GPU，四个证据数组均为空，**GPU 观察仍为待硬件验证（Pending Hardware Verification）**。不要编造耗时，也不要运行不安全方案以获取失败。

## 练习 1：比较之前先说清测量量

**目标：** 审查 P04 的 T0-T2，区分诚实的主机观察、完成墙钟时间（wall time）与事件（event）计时。

**约束：** 工作负载是单 GPU 上固定的小型即时 CUDA 张量操作。T0 只测提交周围的主机区间。T1 在主机起点前完成所选设备的旧工作，在主机终点前等待声明工作完成。T2 在同一条显式流（stream）上记录 start、工作、end，并等待 end。假定正确性与存储生命周期另已满足，但不能据此推断性能。另外分别考虑 T2 使用默认事件、start 未记录，以及没有 end 完成检查这三种变体。

**预期证据：** 三行声明表；T1 纳入/排除的成本；三个 T2 变体各自的拒绝理由；以及为什么推不出通用主机/事件大小关系或加速阈值的解释。

**验收标准：** T0 是可能包含附带阻塞的主机经过时间，不是 GPU 完成延迟。T1 只对声明的所选设备区域有效，不覆盖全部 GPU，也不是纯核函数执行。T2 要求端点已记录、已启用计时，结束事件已完成，单位是毫秒。默认事件禁用计时。仅凭查询结果不能证明端点已记录。正确边界并未提供实测耗时。

<details><summary>提示 1：是哪种处理器到达了边界</summary>Python 返回说明主机已经前进。还需要什么事实，才能说明声明的设备工作完成了？</details>

<details><summary>提示 2：把事件有效性与事件覆盖分开</summary>即使没有剩余工作，事件也可能不适合计算经过时间。分别检查计时开关、记录、流中位置与完成。</details>

## 练习 2：在纸上修复分叉与汇合

**目标：** 证明事件区间完整包围了双分支工作负载。

**约束：** C 是协调流，A、B 是同设备的工作流。两个事件都启用计时，并记录在 C 上。T3 把开始依赖发给 A、B，但 end 前只汇合 A。T4 在 end 前汇合 A、B，但开始依赖只给 A。两种情形中，主机随后都同步整个设备。题目没有提供耗时、分支重叠或相对调度。用 `wait_stream` 表达的依赖只覆盖调用边界前已提交的工作。

**预期证据：** 两项不同的缺边解释；具有两条开始边、两条完成边的修正 T5 依赖图；主机完成检查的位置；以及修正后仍不能提出的声明。

**验收标准：** T3 没有包住 B 的结束，T4 没有包住 B 的开始。事后设备 synchronize 不能修复任何一个已记录时间戳。每条开始依赖位于对应分支的所测工作之前，每条返回依赖在最后纳入提交之后、C 的 end 之前。读毫秒值前等待 end。不能用“两个标记都在默认流上”代替依赖图，不能把重叠分支时间求和，也不能声称正确图保证实际重叠。

<details><summary>提示 1：分别检查两端</summary>B 能否在 start 前做一部分工作？B 能否在 end 后还有剩余工作？完整答案必须通过依赖排除两种可能，而不是猜调度。</details>

<details><summary>提示 2：后来的等待不修改标记</summary>区分 end 标记被设备到达的时刻，与 CPU 得知设备全部完成的时刻。</details>

## 练习 3：设计可审查的测量报告

**目标：** 为将来比较完成墙钟时间与正确覆盖的事件区间制定方案，不混淆准备、验证与性能剖析（profiling）。

**约束：** 使用选定环境、固定操作/形状/数据类型、单设备及同一组验收输出。选择并说明每个区域是否包含分配、传输、初始化和主机工作。安装与执行都不属于本练习。采用 P04 的完整环境清单（Environment Manifest）字段组，而不是只填包名。全部观察目前都未发生。

**预期证据：** 正确性参考与容差方案；独立的冷启动、工作负载预热（warmup）、计时及剖析记录；完整空白清单；重复/分布政策；以及结果错误、完成失败、分配器/构建不符或分辨率不足时的明确拒绝条件。

**验收标准：** 把预热和重复次数明确列为拟议政策，将来保留原始样本，并区分批次摊销与孤立延迟。除非明确纳入，否则把 `.item()`、输出打印、验证传输放在计时外。记录 launch-blocking 与剖析状态。包含硬件身份/计算能力/数量/显存、CPU 与 OS/内核/glibc、解释器来源/编译器/选项、wheel/提交/哈希/依赖、已安装驱动、随包及已加载组件身份、系统 Toolkit/编译器是否存在、所有权/流政策、测量边界及噪声条件。结果保持未填，不能把软件目标变成已观察的基准环境（Reference Environment）。

<details><summary>提示 1：寻找被记到相邻请求的成本</summary>初始化或延后的主机读取可能把成本挪到另一个请求。审查者需要知道什么，才能确认两个方案比较的是同一批工作？</details>

<details><summary>提示 2：包身份不等于进程身份</summary>wheel 描述一个构建。哪些字段能确定这次运行的驱动、加载库、实际设备、分配器与运行条件？</details>

## 继续学习

对照[编号解答](/frameworks/queued-work-timing/solutions/)，再复习 [PB-R5-004](/practice/#pb-r5-004)。[P05](/frameworks/streams-and-storage-lifetime/)会检查练习 1 假定已满足的存储义务。

## 来源

精确所有者依据为 [CUDA 语义](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst)、[Stream 与 Event 接口](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py)及[所选设备同步](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/__init__.py)。环境产物见 [SRC-CUDA-080](/sources-and-versions/#src-cuda-080)，计时/流审查见 [SRC-CUDA-081](/sources-and-versions/#src-cuda-081)。这些是原创 CC BY 4.0 练习，不是复制的所有者测试；上游来源保留自身许可与通知。**事实核对与来源访问日期：2026-09-12。**
