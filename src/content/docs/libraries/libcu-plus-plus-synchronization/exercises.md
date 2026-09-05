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

先完成 [L05](/libraries/libcu-plus-plus-synchronization/)。其先修模型继续适用：M05 提供作用域与进展，M13 提供 copy/storage ownership，M19 提供方言边界。全部任务固定 CCCL/libcu++ v3.4.2，来源复核日期为 **2026-09-05**。

## 作答说明

提交原创表格与书面证明，不提交 CUDA/C++ 实现、伪代码围栏、GPU runs 或实测 traces。以下预期证据均指推理材料，不是硬件观察记录。四个 evidence arrays 全为空，不赋予证据状态（Evidence Status）。依赖 exact tag 的结论应回查学习单元来源；完成自己的材料后再看[独立复核解答](/libraries/libcu-plus-plus-synchronization/solutions/)。

## 练习（Exercise）1：发布 payload，不虚构会合

**目标：** 同一 block 中，一个生产者 P 与一个消费者 C 通过可访问存储交换非原子载荷（payload）。Flag 与 acknowledgement 是两个独立的普通 32 位整数，无填充位（padding bits），双方使用前已经初始化，实际地址均为四字节对齐。先设计单次发布证明，再扩展到两代数据，避免覆盖尚未读完的内容。

**约束：** 使用显式作用域与合法内存序。若选择 `cuda::atomic_ref`，须列出被引用对象的生命周期，并禁止引用使用期间与其竞争的普通访问。写明每次 acquire 从哪次 release store 读取。读到初始值不授予 payload 访问权限。只描述条件安全性与所有权移交，不实现 polling，不假设任意 blocks 同时驻留。对于建议使用的 release load 与 acquire store，应判为非法，而不是更强的选择。

分别审查每项独立修改；除表格明确说明 capabilities 未知外，存储均可访问：

| 修改 | 待审查的理由 |
| --- | --- |
| 同一 block，发布 store 与 flag load 都使用 relaxed | Flag 的原子性应该也能发布 payload |
| 同一 device、同一 memory synchronization domain 的不同 blocks，flag operations 使用 block scope 与 sequential consistency | 最强内存序应该弥补过窄 scope |
| 同一 device/domain，device-scoped release/acquire，但消费者读到初始零 | Acquire 总会授权 payload read |
| CPU/GPU 参与者，system-scoped release/acquire，allocation atomic capabilities 未知 | System scope 加共享指针应该已经足够 |

**预期证据：** Participant/storage/scope 表、正向 reads-from 与 happens-before 链、复用所需的反向 acknowledgement 链、object-lifetime/access 账本，以及四行修改结论，包含修复方法或明确的未解决条件。说明 generation identity 如何防止旧 ready value 或旧 acknowledgement 满足下一次交换。

**验收条件：** 单次证明只在匹配 acquire observation 之后建立 P 的 payload write 先于 C 的 read。两代证明还须建立 C 的最后读取先于 P 的下一次覆盖。两个方向都用一致且足够的 scope 覆盖参与者。没有普通访问与 `atomic_ref` 竞争，没有对象提前死亡，也不把 progress、会合或缺失的 allocation 支持归功于更宽 scope 或 sequential consistency。

<details><summary>提示 1</summary>先写 payload 访问，再标明每个观察者必须从哪次 atomic write 读取；返回的整数本身不是 generation proof。</details>

<details><summary>提示 2</summary>Ready flag 被观察后，谁持有覆盖权限？Acknowledgement 必须通过自己的 ordering edge 与 generation identity 把权限交回。</details>

## 练习 2：计算阶段并保护慢消费者的 tile

**目标：** 同一 block 中四个线程 A、B、C、D 共用一个 barrier 与一个 tile。A 通过普通同步写入连续生产两份 tile，B、C 读取每份 tile。D 不贡献 tile data，在第一轮 ready phase 永久退出该 barrier protocol。构造完整 phase ledger，让同一存储安全承载两份 tile。

**约束：** 一个指定初始化者将 barrier expected count 设为四，随后经过独立的全 block 初始化可见性边界。A、B、C 保持参与；D 在第一轮 ready phase 使用 `arrive_and_drop`，既不读 tile，也不再加入。使用默认 completion 行为与普通 waits，不引入自定义 completion 或异步复制。区分 ready phase 与 consumed phase，每次 B/C 的 consumed-phase arrival 都在其最后一次 tile read 之后。两份 tile 之间不重新初始化 barrier。

错误方案声称：“D 跳过第一次 arrival，A/B/C 等待 ready，A 在自己的 wait 返回后立即覆盖。第二份 tile 再把计数重置为三。”解释其中三个错误，不能只修复计数。

**预期证据：** Initialization/lifetime 账本；名为 ready-0、consumed-0、ready-1、consumed-1 的四行 phase 表；每行的 expected count、到达者、drop contribution、next count、允许的读取和最早覆盖边界；以及 B 比 A 慢的反例调度。反例是可能发生的顺序推理，不是实测 trace。

**验收条件：** 首次 ready phase 包含 D 的 drop 在内，共四次贡献，随后各 phase 期待三次。B、C 均在自己的 ready wait 完成后才读取；A 必须等 consumed phase 覆盖双方最后读取后才能覆盖。D 不向三人 phases 贡献，barrier 与 tile 存活到所有使用者及 waits 结束。反例须说明 readiness 为什么不能单独归还存储。

<details><summary>提示 1</summary>Drop 的两个效果发生在不同时间：当前贡献一次，未来减少 expected counts。不要从当前轮的必需总数中扣掉它。</details>

<details><summary>提示 2</summary>设 A 已从 ready wait 返回，而 B 还没读取 tile。什么后续事件能证明 B 已读完？A 必须等待哪个 phase？</details>

## 练习 3：选择可移植复制路径并保留所有权协议

**目标：** 按选定 CCCL v3.4.2 合同审查下面六个 compilation/target coordinates，再修复一个两阶段分离角色 pipeline，不承诺硬件加速或 overlap。所有行均为 native Linux，均没有本地 compilation 或 runtime 结果。

| 候选 | Toolkit | Host compiler | 方言 | GPU target |
| --- | --- | --- | --- | --- |
| A | 12.9.2 | GCC 6 | C++17 | SM75 |
| B | 12.9.2 | GCC 9 | C++20 | SM80 |
| C | 12.9.2 | GCC 10 | C++20 | SM75 |
| D | 13.3.1 | GCC 14 | C++20 | SM80 |
| E | 13.3.1 | GCC 14 | C++23 | SM90 |
| F | 11.8.0 | GCC 11 | C++17 | SM75 |

D 的材料**没有**确定 Toolkit bundled CCCL version。E 唯一额外材料是窄范围 EX10 C++23 probe。使用 tagged support policy，不能笼统写“CUDA 13.X 已通过 CI”。还需列出 C++20 的 GCC/Clang 下限与各 selected lanes 的 NVCC 上限。

拟议 pipeline 由同一 block 的八个线程参与，分为两个 producers、六个 consumers，使用两个独立 stage buffers 与一个 shared state。每个 stage buffer 至少 208 bytes，base address 为 16-byte aligned；独立 global source allocation 的大小和 base alignment 相同。P0 从 source offset 4 向 stage offset 4 复制 100 bytes，P1 从 offset 104 向 offset 104 复制 100 bytes。两段都是有效、不重叠的 trivial-byte-copy ranges。六个 consumers 都可以读取完成后的 200-byte payload。方案采用 **nongroup** copies，却为每次复制断言 `cuda::aligned_size_t<16>`，允许 producer commits 分歧，并在某个参与者调用 `quit` 后立即释放 shared state。

**约束：** Construction 必须由八个成员共同执行，使用同一 shared state 和 producer count 二。明确 producer/consumer roles。检查地址**与** byte count alignment，在合适时选择普通 size 或同步回退，并保留 acquire、issue、commit、wait、consume、release 所有权边。区分 nongroup issues 与可替代的 cooperative-copy group；两个 producers 不满足八成员 group copy。Commit 前协调相关 warp participation，但不能要求 consumers 承担不存在的 producer roles。

**预期证据：** 六项 eligibility 结论，含原因及剩余检查；compiler-policy 交集；两段复制的 alignment 计算；展示 source、destination、shared-state lifetimes 的两阶段 ownership 账本；以及在 SM75 上仍正确的 fallback decision。分别陈述 API availability、acceleration eligibility、owner-test configuration 和尚未测量的 performance。

**验收条件：** 拒绝不支持的 compiler/dialect/Toolkit 组合，D 保留 bundled-version 核查条件。不从 EX10 推断 libcu++ C++23 支持，也不从 tag 的 13.X alias 推断实际 13.3 coverage。拒绝两个错误的 16-byte proofs，不引入重叠复制。Consumers 在读取前 wait、最后读取后 release，producers 在复用前 acquire。同步搬运或 `quit` 都不消除 outstanding-work 责任。SM80 eligibility 不是 instruction、timing 或 overlap 结果；可选 SM90 TMA 继续排除在合同之外。

<details><summary>提示 1</summary>先求 library minimum、dialect minimum、NVCC maximum 与 Toolkit policy 的交集，再考虑 GPU。另行计算实际地址 offset 与 byte count 对 16 的余数。</details>

<details><summary>提示 2</summary>对每个 stage 标出 source 最后可能被读取的事件、destination 的最后 consumer read，以及 shared state 的最后使用者。同步 dispatch 不会改变这些所有权问题。</details>

## 下一步

复核[独立解答](/libraries/libcu-plus-plus-synchronization/solutions/)，再审查 [PB-R4-005](/practice/#pb-r4-005)和 [PB-R4-006](/practice/#pb-r4-006)。使用[内存序（Memory Order），TERM-185](/glossary/#term-185)和[屏障阶段（Barrier Phase），TERM-186](/glossary/#term-186)命名证明边。来源复核日期仍为 **2026-09-05**，没有硬件观察。
