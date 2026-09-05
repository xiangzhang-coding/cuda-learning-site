---
title: 'L05 练习：审查 libcu++ 同步协议'
description: 用静态推理材料证明带作用域的发布，计算 barrier phases 与 buffer 复用，并选择可移植的 pipeline copy 回退。
pairId: l05-exercises
counterpart: /en/libraries/libcu-plus-plus-synchronization/exercises/
factCheckDate: '2026-09-05'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: L05-EXERCISES
prerequisites:
  - L05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l05-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/libcu-plus-plus-synchronization/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L05 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/libcu-plus-plus-synchronization/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [L05](/libraries/libcu-plus-plus-synchronization/)。其先修模型继续适用：M05 提供同步作用域（synchronization scope）与进展（progress），M13 提供复制与存储所有权，M19 提供 C++ 方言（C++ dialect）边界。全部任务固定 CCCL/libcu++ v3.4.2，来源复核日期为 **2026-09-05**。

## 作答说明

提交原创表格与书面证明，不提交 CUDA/C++ 实现、伪代码围栏、GPU 运行结果或实测轨迹。以下预期证据均指推理材料，不是硬件观察记录。四个证据数组全为空，不赋予证据状态（Evidence Status）。依赖精确版本标签的结论应回查学习单元来源；完成自己的材料后再看[独立复核解答](/libraries/libcu-plus-plus-synchronization/solutions/)。

## 练习（Exercise）1：发布载荷（payload），不虚构会合

**目标：** 同一线程块（thread block）中，一个生产者 P 与一个消费者 C 通过可访问存储交换非原子载荷（payload）。就绪标志与确认标志是两个独立的普通 32 位整数，无填充位（padding bits），双方使用前已经初始化，实际地址均为四字节对齐。先设计单次发布证明，再扩展到两代数据，避免覆盖尚未读完的内容。

**约束：** 使用显式作用域与合法内存序（memory order）。若选择 `cuda::atomic_ref`，须列出被引用对象的生命周期，并禁止引用使用期间与其竞争的普通访问。写明每次获取（acquire）读取的值来自哪次释放（release）写入。读到初始值不授予载荷访问权限。只描述条件安全性与所有权移交，不实现轮询，不假设任意线程块同时驻留。对于建议使用的 release 读取与 acquire 写入，应判为非法，而不是更强的选择。

分别审查每项独立修改；除表格明确说明相关能力未知外，存储均可访问：

| 修改 | 待审查的理由 |
| --- | --- |
| 同一线程块，发布写入与标志读取都使用宽松（relaxed）内存序 | 标志的原子性应该也能发布载荷 |
| 同一设备、同一内存同步域（memory synchronization domain）的不同线程块，标志操作使用线程块作用域（block scope）与顺序一致性（sequential consistency） | 最强内存序应该弥补过窄作用域 |
| 同一设备和内存同步域，使用设备作用域（device scope）的 release/acquire，但消费者读到初始零 | Acquire 总会授权载荷读取 |
| CPU/GPU 参与者，使用系统作用域（system scope）的 release/acquire，所分配内存的原子访问能力未知 | 系统作用域加共享指针应该已经足够 |

**预期证据：** 参与者/存储/作用域表、正向读取来源（reads-from）与先发生于（happens-before）关系链、复用所需的反向确认链、对象生命周期与访问账本，以及四行修改结论，包含修复方法或明确的未解决条件。说明代次标识如何防止旧就绪值或旧确认值满足下一次交换。

**验收条件：** 单次证明只在 acquire 观察到匹配发布之后建立 P 的载荷写入先于 C 的读取。两代证明还须建立 C 的最后读取先于 P 的下一次覆盖。两个方向都用一致且足够的作用域覆盖参与者。没有普通访问与 `atomic_ref` 竞争，没有对象提前死亡，也不把进展、会合（rendezvous）或缺失的内存分配支持归功于更宽作用域或顺序一致性。

<details><summary>提示 1</summary>先写载荷访问，再标明每个观察者必须从哪次原子写入读取；返回的整数本身不能证明数据代次。</details>

<details><summary>提示 2</summary>就绪标志被观察后，谁持有覆盖权限？确认操作必须通过自己的顺序关系与代次标识把权限交回。</details>

## 练习 2：计算阶段并保护慢消费者的数据块（tile）

**目标：** 同一线程块中四个线程 A、B、C、D 共用一个屏障（barrier）与一个数据块（tile）。A 通过普通同步写入连续生产两份数据块，B、C 读取每份数据块。D 不贡献数据，在第一轮就绪阶段（ready phase）永久退出该屏障协议。构造完整屏障阶段（barrier phase）账本，让同一存储安全承载两份数据块。

**约束：** 一个指定初始化者将屏障预期计数设为四，随后经过独立的全线程块初始化可见性边界。A、B、C 保持参与，在每个就绪阶段与消费完成阶段（consumed phase）都调用 `arrive_and_wait`。每个继续参与的线程必须等待当前阶段完成，才能开始下一阶段或再次到达。D 在第一轮就绪阶段使用 `arrive_and_drop`，既不读数据，也不再加入。使用默认完成行为，不引入自定义完成函数或异步复制（asynchronous copy）。A 在就绪阶段到达前写完；B/C 在就绪等待返回后读取，在消费完成阶段到达前读完；A 只在消费完成等待返回后覆盖。两份数据块之间不重新初始化屏障。

错误方案声称：“D 跳过第一次到达，A/B/C 等待就绪，A 在自己的等待返回后立即覆盖。第二份数据块再把计数重置为三。”解释其中三个错误，不能只修复计数。

**预期证据：** 初始化与生命周期账本；名为 ready-0、consumed-0、ready-1、consumed-1 的四行阶段表；每行的预期计数、到达者、退出贡献、下一轮计数、允许的读取和最早覆盖边界；以及 B 比 A 慢的反例调度。还需解释：C 仍在读取第 0 份数据块时，B 为什么不能跳过自己的消费完成等待，并把一次提前到达称为“ready-1”？阶段名称只是账本标签，到达递减的是当前倒计数。这些是可能发生的顺序推理，不是实测轨迹。

**验收条件：** 首次就绪阶段包含 D 的退出在内，共四次贡献，随后各阶段期待三次。A、B、C 都必须等待每个就绪阶段和消费完成阶段完成后，才能再次到达。B、C 均在自己的就绪等待返回后才读取；A 只在双方读完且自己的消费完成等待返回后才能覆盖。任何参与者都不能用下一阶段的标签为当前阶段多贡献一次到达。D 不向三人阶段贡献，屏障与数据块存活到所有使用者及等待结束。反例须说明就绪为什么不能单独归还存储，以及为什么只让 A 等待并不足够。

<details><summary>提示 1</summary>退出的两个效果发生在不同时间：当前贡献一次，未来减少预期计数。不要从当前轮的必需总数中扣掉它。</details>

<details><summary>提示 2</summary>先设 A 已从就绪等待返回，而 B 还没读取数据；再考虑 C 仍在读取时，B 向 consumed-0 到达两次。哪些等待分别阻止这两个错误？第二次到达会递减哪个倒计数？</details>

## 练习 3：选择可移植复制路径并保留所有权协议

**目标：** 按选定 CCCL v3.4.2 合同审查下面六个编译与目标架构坐标，再修复一个两阶段分离角色流水线（pipeline），不承诺硬件加速或执行重叠。所有行均为原生 Linux，均没有本地编译或运行结果。

| 候选 | 工具包 | 主机编译器 | 方言 | GPU 目标架构 |
| --- | --- | --- | --- | --- |
| A | 12.9.2 | GCC 6 | C++17 | SM75 |
| B | 12.9.2 | GCC 9 | C++20 | SM80 |
| C | 12.9.2 | GCC 10 | C++20 | SM75 |
| D | 13.3.1 | GCC 14 | C++20 | SM80 |
| E | 13.3.1 | GCC 14 | C++23 | SM90 |
| F | 11.8.0 | GCC 11 | C++17 | SM75 |

D 的材料**没有**确定工具包随附的 CCCL 版本。E 唯一额外材料是窄范围 EX10 C++23 探测。使用标签下的支持政策，不能笼统写“CUDA 13.X 已通过 CI”。还需列出 C++20 的 GCC/Clang 下限与各选定工具包通道的 NVCC 上限。

拟议流水线由同一线程块的八个线程参与，分为两个生产者、六个消费者，使用两个独立的流水线阶段（pipeline stage）缓冲区与一个共享状态。每个阶段缓冲区至少 208 字节，基地址为 16 字节对齐；独立全局内存源区的大小和基地址对齐相同。P0 从源区偏移 4 向阶段缓冲区偏移 4 复制 100 字节，P1 从偏移 104 向偏移 104 复制 100 字节。两段都是有效、不重叠的平凡字节复制（trivial byte copy）范围。六个消费者都可以读取完成后的 200 字节载荷。方案采用**非线程组（nongroup）**复制，却为每次复制断言 `cuda::aligned_size_t<16>`，允许生产者分歧提交，并在某个参与者调用 `quit` 后立即释放共享状态。

**约束：** 构造必须由八个成员共同执行，使用同一共享状态和生产者数量二。明确生产者与消费者角色。检查地址**与**字节数的对齐，在合适时选择普通大小参数或同步回退，并保留获取、发出、提交、等待、消费、释放的所有权边。区分非线程组复制与可替代的协作复制（cooperative copy）线程组；两个生产者不满足八成员线程组复制。提交前协调相关线程束（warp）的参与状态，但不能要求消费者承担不存在的生产者角色。

**预期证据：** 六项资格结论，含原因及剩余检查；编译器政策交集；两段复制的对齐计算；展示源区、目标区、共享状态生命周期的两阶段所有权账本；以及在 SM75 上仍正确的回退决策。分别陈述 API 可用性、加速资格、上游测试配置和尚未测量的性能。

**验收条件：** 拒绝不支持的编译器/方言/工具包组合，D 保留随附版本核查条件。不从 EX10 推断 libcu++ C++23 支持，也不从标签的 `13.X` 别名推断实际覆盖了 13.3。拒绝两个错误的 16 字节对齐证明，不引入重叠复制。消费者在读取前等待、最后读取后释放，生产者在复用前获取。同步搬运或 `quit` 都不消除对尚未完成工作的责任。SM80 资格不是指令、耗时或执行重叠结果；可选 SM90 TMA 继续排除在合同之外。

<details><summary>提示 1</summary>先求库要求的编译器下限、方言下限、NVCC 上限与工具包政策的交集，再考虑 GPU。另行计算实际地址偏移与字节数对 16 的余数。</details>

<details><summary>提示 2</summary>对每个阶段标出源区最后可能被读取的事件、目标区的最后一次消费者读取，以及共享状态的最后使用者。分派到同步实现不会改变这些所有权问题。</details>

## 下一步

复核[独立解答](/libraries/libcu-plus-plus-synchronization/solutions/)，再审查 [PB-R4-005](/practice/#pb-r4-005)和 [PB-R4-006](/practice/#pb-r4-006)。使用[内存序（memory order），TERM-185](/glossary/#term-185)和[屏障阶段（barrier phase），TERM-186](/glossary/#term-186)命名证明边。来源复核日期仍为 **2026-09-05**，没有硬件观察。
