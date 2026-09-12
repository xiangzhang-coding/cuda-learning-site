---
title: 'P05 练习：分别追踪就绪与复用'
description: 审查双向流交接，解释只写回收存储，并比较释放时登记与手动生命周期控制。
pairId: p05-exercises
counterpart: /en/frameworks/streams-and-storage-lifetime/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, exercise-1, exercise-2, exercise-3, continue, sources]
resourceKind: exercise-set
unitId: P05-EXERCISES
prerequisites: [P05]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Pinned PyTorch CUDA semantics'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Native allocator selection and write-only cross-stream hazards'
    accessDate: '2026-09-12'
  - title: 'Pinned PyTorch Stream and Event interfaces'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Call-time wait_stream boundary'
    accessDate: '2026-09-12'
  - title: 'Pinned Tensor record_stream contract'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/_tensor_docs.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Deallocation-time lifetime boundary and manual origin-stream return'
    accessDate: '2026-09-12'
  - title: 'Pinned native CUDA caching allocator'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/c10/cuda/CUDACachingAllocator.cpp'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Ordinary eager allocations; stream registration and events at free'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/streams-and-storage-lifetime/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,exercise-1,exercise-2,exercise-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P05 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '4' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/streams-and-storage-lifetime/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

先完成唯一直接前置 [P05](/frameworks/streams-and-storage-lifetime/)。这些静态书面练习（Exercise）针对 torch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**、原生 Linux x86_64、native 分配器。仅讨论普通即时分配，不涉及外部存储或图池。无需 GPU，四个证据数组均为空，**GPU 观察仍为待硬件验证（Pending Hardware Verification）**。不要提交代码、编造跟踪记录，或故意运行竞争。

## 练习 1：审查输入和返回结果

**目标：** 修复双向交接，不把数据就绪与分配器生命周期混为一谈。

**约束：** x 在流（stream）A 上分配/生产，由 B 消费。独立的 y 在 B 上分配/生产，由 A 消费。每项最终引用都可能在消费入队之后、完成之前消失。没有显式冲突修改。审查 P05 的 S0-S4：两个等待但只登记输入；两个登记但没有等待；两个等待但只持有到提交；两个等待加两个登记；两个等待加位置正确的手动返回依赖。

**预期证据：** x、y 的来源/生产者/消费者/最后使用/释放账本；独立的就绪与复用边；五项判断；分别采用登记和手动返回的两个完整修复。

**验收标准：** x 的 B 使用需要相对于来源 A 得到保护；y 的 A 使用独立地需要相对于来源 B 得到保护。S0-S2 不完整，S3、S4 对给定图有效，但不是运行已验证（Runtime-Verified）。解释调用时等待方向与覆盖、最终存储释放和删除一个变量的区别，以及只保留名称到入队为什么不够。手动返回必须在释放前覆盖全部相关非来源使用，不要求统一让 CPU 等待。

<details><summary>提示 1：从分配开始，不从当前流开始</summary>y 是在哪里分配的？x 的登记能说明这项独立分配的任何事情吗？</details>

<details><summary>提示 2：画两种箭头</summary>一种箭头使值对消费者就绪；另一种让未来复用访问排在最后消费之后。分别由哪个 API 或持有者提供？</details>

## 练习 2：解释只写的复用分配

**目标：** 反驳“新建且未初始化的张量不可能有跨流存储危险”的说法。

**约束：** z 是来源为 A 的 `torch.empty` 分配。它的块可能之前属于另一个逻辑张量，A 上仍有工作排队。B 不读旧值，直接覆写 z。之后偏移视图（view）v 共享 z 的存储；删除名称 z 后 v 仍活着。题目没有给定指针值或损坏输出，不允许运行竞争来“证明”答案。

**预期证据：** 一张可能的冲突访问图；缺失的来源依赖；B 使用的生命周期政策；剩余视图如何影响最终释放的解释。另外单独判断：即使已登记 B，A 显式覆写仍存活的 z，而 B 同时读取，会怎样？

**验收标准：** 物理内存可能被回收再用，因此 B 的只写访问仍需排在分配来源 A 的边界后面。B 写入不改变来源 A。登记覆盖存储生命周期，也涉及共享底层存储，但不保护显式并发修改。v 仍持有存储时，删除 z 不等于最终释放。不能要求精确指针复用、可重复的错误结果或崩溃；一次数值正确的运行不能独自证明图安全。

<details><summary>提示 1：新逻辑张量可能使用旧物理字节</summary>前一个张量的 Python 生命周期可以先于其排队的 A 访问结束。什么能让 B 的新写入排在那些访问之后？</details>

<details><summary>提示 2：回收与修改是两种威胁</summary>剩余视图可以防止回收，但它能阻止另一条流显式覆写同一批字节吗？</details>

## 练习 3：识别真正的生命周期边界

**目标：** 区分登记时刻、流等待时刻与存储解除分配，并为两种生命周期政策设计公平的未来比较。

**约束：** R 把仍存活的 x 登记到 B。B 使用 U1、U2 都在 R 后、最终存储释放 F 前提交。F 后企图执行 U3。另一种手动方案在 U1、U2 提交之间，于来源 A 放置返回等待。使用 native 后端，不进行图捕获。这些标签是顺序事实，不是执行时间戳。目前没有任何测量。

**预期证据：** 登记方案下 U1-U3 的覆盖/不覆盖分类；手动返回覆盖哪些工作；修正的返回或持有替代方案；以及带有 P05 完整环境清单（Environment Manifest）字段的未来正确性/计时方案。

**验收标准：** 已登记流在 F 前排队的工作包含 U1、U2，U3 不因登记而获得释放后使用权。夹在两次使用之间的 `wait_stream` 快照包含 U1，不包含 U2，因此手动生命周期证明不足。把最终返回移到全部相关提交之后、释放之前，或者持有到经检查的完成点。比较政策前，先证明正确性及输入/结果两项生命周期。分开预热（warmup）、计时与性能剖析（profiling）；记录实际后端、所有权图、释放边界、完整软硬件身份与测量条件。不能从 CUDA 12.8 推断 native 行为，也不能把其复用/统计结论套到 `cudaMallocAsync`。

<details><summary>提示 1：找到插入事件的位置</summary>在这个 native 实现中，登记是否立即冻结一个完成事件？还是解除分配时才在已登记流上插入事件？</details>

<details><summary>提示 2：公平比较要保留同样的工作</summary>移动返回边界会改变重叠机会与保留时间。剖析也可能持有对象。测量记录必须暴露哪些差异？</details>

## 继续学习

对照[编号解答](/frameworks/streams-and-storage-lifetime/solutions/)及 [PB-R5-005](/practice/#pb-r5-005)。使用 [P04](/frameworks/queued-work-timing/)检查任何未来多流计时区间的两端。

## 来源

依据精确提交的 [CUDA 语义](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst)、[Stream 与 Event 接口](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py)、[Tensor 生命周期文档](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/_tensor_docs.py)及 [native 分配器源码](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/c10/cuda/CUDACachingAllocator.cpp)。[SRC-CUDA-080](/sources-and-versions/#src-cuda-080)覆盖环境产物，[SRC-CUDA-081](/sources-and-versions/#src-cuda-081)覆盖语义。原创 CC BY 4.0 练习，未复制上游测试或实现。上游来源保留自身许可与通知。**事实核对与来源访问日期：2026-09-12。**
