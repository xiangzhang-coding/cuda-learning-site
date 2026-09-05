---
title: 'L05 复核解答：libcu++ 同步合同'
description: 复核完整的发布、barrier phase/reuse 与 portability/fallback 证明，并比较可行替代和常见 scope、lifetime、completion 错误。
pairId: l05-solutions
counterpart: /en/libraries/libcu-plus-plus-synchronization/solutions/
factCheckDate: '2026-09-05'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: L05-SOLUTIONS
prerequisites:
  - L05-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l05-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/libcu-plus-plus-synchronization/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L05-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/libcu-plus-plus-synchronization/solutions/" lang="en">Read the English counterpart</a>

## 复核前

本页是 [L05 练习](/libraries/libcu-plus-plus-synchronization/exercises/)的独立参考解答，遵循 [L05 v3.4.2 来源合同](/libraries/libcu-plus-plus-synchronization/)。这里只提供静态证明，不提供 CUDA/C++ 实现、执行、观察或性能结果。四个证据数组全为空，不赋予证据状态（Evidence Status）。事实与来源复核均对齐 **2026-09-05**。

## 解答 1：可复用 payload 需要两次所有权移交

**复核解答：** P、C 位于同一线程块（thread block），所以两个标志都显式选择线程块作用域（block scope）`cuda::thread_scope_block`，使用内存序（memory order）中的释放（release）写入与获取（acquire）读取。一种有效表示是：对分别初始化、四字节对齐、无填充位（padding bits）的 32 位整数各建立一个原子引用（atomic reference）。原始对象活得比所有引用、原子访问和最终确认更久。使用引用前初始化已可见，引用使用期间不对任何标志做普通访问。拥有对象的 `cuda::atomic` 是另一种表示，不改变证明。

| 对象 | 访问者与所有权 | 作用域、内存序或生命周期要求 |
| --- | --- | --- |
| 非原子载荷（payload） | P 写；C 只在发布后读 | 存储有效且可访问，C 最后读取被确认前不得覆盖 |
| 就绪代次 | P 发布；C 观察 | 相同线程块作用域；release 写入与读取该写入的 acquire 读取 |
| 已确认代次 | C 发布；P 观察 | 相同线程块作用域；最后读取后的 release 写入，复用前的 acquire 读取 |

第 1 代中，P 写载荷，再以 release 写入就绪代次 1。C 只有在 acquire 读取到该发布后才能消费。载荷写入在 P 的 release 前定序，该 release 与 C 匹配的 acquire 同步，acquire 又在 C 的载荷读取前定序，所以写入先发生于（happens before）读取。Acquire 读到初始零不授予这些权限。

C 在第 1 代最后读取后以 release 写入确认代次 1。P 必须通过 acquire 读到该确认后才能写第 2 代。最后读取在 C 的 release 前定序，P 匹配的 acquire 则在下一次写入前定序。这条反向链让消费先于覆盖。随后 P 以 release 写入就绪代次 2，C 通过 acquire 观察这次特定发布、消费，并以 release 写入确认代次 2。P 观察到确认代次 2 后才结束交换或回收载荷。

对这两代数据，可以将两个计数器初始化为零，使用不回绕的不同值 1 和 2。只有 P 写就绪标志，只有 C 写确认标志。观察到确认代次 1 前不得发布第 2 代，不得把值 1 当作第 2 代。这些限制防止旧数值授权下一次交换。长期运行的回绕计数器、更多生产者或消费者都需要新证明，两代答案不会自动解决那些协议。

| 修改 | 结论与修复 |
| --- | --- |
| 同一线程块的宽松（relaxed）标志操作 | 不足。只保证标志访问的原子性，没有载荷发布边。使用匹配的 release/acquire 关系，或另一种有明确合同的移交。 |
| 跨线程块的线程块作用域操作，采用顺序一致性（sequential consistency） | 作用域不足。题设同一设备、同一内存同步域（memory synchronization domain）可采用一致的设备作用域（device scope）和发布证明，但仍不授予跨线程块驻留或进展假设。 |
| 设备作用域的 acquire 读到初始零 | 不允许读载荷。等 acquire 读取所需代次的 release 发布后再消费；acquire 标签自身不是读取来源（reads-from）关系。 |
| 系统作用域（system scope），但所分配内存的原子支持未知 | 条件未解决，不予接受。先建立内存分配类型、设备及所有 CPU/GPU 参与者兼容的原子访问支持，或用显式完成的数据传输和执行边界替代直接共享。 |

Release 读取与 acquire 写入均为非法内存序选择。普通原子读取也不能使用 acquire-release；普通原子写入不能使用 consume 或 acquire-release。该固定版本的两种原子形式都默认系统作用域，但本答案刻意显式选择线程块作用域。上述关系都不证明轮询循环会终止。作用域受支持、内存序合法与协议能够取得进展仍是独立要求。

## 解答 2：本轮四次到达，之后每轮三次

**复核解答：** 保留一个屏障（barrier）与一个数据块（tile），由一个初始化者建立预期计数四，再让全部四个线程经过独立的初始化可见性边界，之后才进入下面的屏障阶段（barrier phase）协议。共享内存声明不等于初始化，在未初始化屏障上等待也无法建立该边界。屏障必须存活到每次到达与等待结束。

在**每个就绪阶段（ready phase）和消费完成阶段（consumed phase）**，A、B、C 都调用 `arrive_and_wait`。每个继续参与的线程必须等待该阶段完成，才能开始下一阶段或再次到达。就绪阶段中，A 先写完再调用，B、C 只在各自的就绪调用返回后读取。消费完成阶段中，B、C 先完成最后读取再调用，三个线程都等待。A 只在自己的消费完成调用返回后才能覆盖。每次普通调用已经贡献一次到达，不能再为该阶段另补一次。D 只在 ready-0 通过 `arrive_and_drop` 贡献一次，既不读取数据，以后也不再加入。

| 阶段 | 预期计数与贡献 | 下一阶段预期计数 | 允许的访问与复用 |
| --- | --- | --- | --- |
| ready-0 | 4：A、B、C 各自 `arrive_and_wait`；D 退出并贡献第四次 | 3 | A 到达前写完第 0 份数据块；B/C 各自等待后才能读取。A/B/C 每个线程都必须等自己的本阶段调用返回，再向 consumed-0 到达，A 仍不能覆盖。 |
| consumed-0 | 3：A、B、C 各自 `arrive_and_wait`；B/C 在第 0 份数据块最后读取后才到达 | 3 | A/B/C 每个线程都必须等自己的本阶段调用返回，再向 ready-1 到达。A 只在自己的 consumed-0 等待返回后，才能用第 1 份数据块覆盖。 |
| ready-1 | 3：A、B、C 各自 `arrive_and_wait`；A 写完第 1 份数据块后才到达 | 3 | B/C 各自等待后才能读取第 1 份数据块。A/B/C 每个线程都必须等自己的本阶段调用返回，再向 consumed-1 到达，不得提前覆盖。 |
| consumed-1 | 3：A、B、C 各自 `arrive_and_wait`；B/C 在第 1 份数据块最后读取后才到达 | 3 | 三者都等待完成。全部使用者和等待结束后才回收屏障与数据块，本协议不再发起下一次到达。 |

计数变为三，是退出对未来阶段的作用，不是在数据块边界手动重新初始化。D 的退出仍贡献到当前总数四；跳过 D 的到达会让 ready-0 无法完成。D 不能重新出现在只期待 A/B/C 的阶段中。Consumed-1 后下一阶段预期计数仍为三并无问题，只要不再进入新阶段，且等全部使用者结束才销毁；结束已完成协议不需要人为补一次到达。

错误复用规则的一个反例是：全部必需到达完成 ready-0；A 从等待返回；B 在读取前被延迟；A 用第 1 份数据块覆盖缓冲区；随后 B 才读取。就绪阶段允许 B 开始读第 0 份数据块，但从未证明 B 已读完。消费完成阶段把 B 的最后读取放在其到达前，再把 A 的覆盖放在相应等待后，从而修复问题。C 同理。

只让 A 等待还留下第二个错误。设 consumed-0 期待三次到达：A 已到达并等待，B 已读完并到达，C 却仍在读取。此时当前倒计数为一。若 B 跳过自己的消费完成等待，发出一次自称“ready-1”的到达，这次到达会把 **consumed-0 的当前倒计数**递减为零，A 随即可能返回并在 C 仍读取时覆盖。Ready-0、consumed-0、ready-1、consumed-1 只是账本标签，不会把到达送往未来阶段。要求 B、C 与 A 一样，在每次 `arrive_and_wait` 完成后才能再次到达，才阻止了这种错误完成。

错误方案中的重置也没有必要，如果还有参与者使用原阶段或令牌，则不安全。重新初始化不是普通阶段转换操作，当前屏障已经管理未来计数。这四个阶段是书面顺序证明，不是执行过的调度。本题 A 采用普通同步写入，因此没有需要额外记账的异步复制（asynchronous copy）完成贡献。

## 解答 3：分开判断 eligibility、dispatch 与 ownership

**复核解答：** 先检查编译坐标，再选择复制加速路径。C++17 使用 CCCL 一般下限 GCC 7 / Clang 7；C++20 提升到 GCC 10 / Clang 11。选定 12.9 工具包通道（Toolkit Lane）的 NVCC 上限为 GCC 14 / Clang 19；13.3 通道则为 GCC 15 / Clang 21。NVCC 接受 GCC 6 不会覆盖 CCCL 更高的下限。

| 候选 | 按题设材料作出的结论 |
| --- | --- |
| A：12.9.2、GCC 6、C++17、SM75 | 拒绝。低于选定 CCCL 的 GCC 7 下限，即使它位于 NVCC 主机编译器范围内。 |
| B：12.9.2、GCC 9、C++20、SM80 | 拒绝。C++20 要求 GCC 10 或更新；更高 GPU 架构不能修复编译器的 C++ 方言（C++ dialect）边界。 |
| C：12.9.2、GCC 10、C++20、SM75 | 满足所列编译器、方言与目标架构的数值政策交集，可进入语义回退审查。仍需检查实际安装的工具链、头文件与操作系统配置；不是成功构建，也不是加速复制的结论。 |
| D：13.3.1、GCC 14、C++20、SM80 | 数值范围满足，但仍有条件：必须确定选定 v3.4.2 不早于工具包随附的 CCCL。合格硬件既不提供该检查，也不提供执行证据。 |
| E：13.3.1、GCC 14、C++23、SM90 | 不纳入选定 C++17/C++20 合同。EX10 的窄范围 GCC 14 C++23 探测不建立 libcu++ 支持；SM90 也不在这里授权 TMA API。 |
| F：11.8.0、GCC 11、C++17、SM75 | 拒绝选定 v3.4.2 组合。较旧的随附 libcu++ 或更简单的回退必须另行复核源码和 API，不继承 L05。 |

标签下的 `13.X` 别名选择 13.2，不是 13.3；`12.X` 选择 12.9。配置中的上游测试覆盖与 v3.4.2 发布都不提供本地测试结果。原生 Linux 仍是站点环境边界。CUDA 12.x 的最新补丁政策与 CUDA 13.x 的随附版本下限必须独立于编译器区间检查。

对齐计算如下：16 字节对齐的基地址加偏移 4 后，对 16 的余数为 4；偏移 104 的余数为 8；字节数 100 的余数为 4。因此**两次复制的地址与长度都不满足** `cuda::aligned_size_t<16>`。源区与目标区偏移相同也没用，因为两个实际地址都不合格。证明类型不承诺自动填充或地址修复。

目标区间为 `[4,104)` 和 `[104,204)`，互不重叠，且都位于各自 208 字节的阶段缓冲区内；源区是独立分配的有效内存。保留非线程组（nongroup）复制：P0、P1 各自仅发出一次分配给自己的区间。不要让八个线程都复制两段。若改用线程组重载（group overload），必须声明有效的协作复制（cooperative copy）线程组，并让其全部成员以相同参数调用；当前由两个生产者发出复制的路径不是八成员线程组调用。

可采用绑定流水线（pipeline）、适合该情况的普通大小参数 `cuda::memcpy_async` 重载，允许受支持的回退；合同仍需跟踪复制完成与生命周期。也可有意采用每个生产者的同步复制，再加明确的全参与者就绪/消费完成移交。对于这组数据，四字节的较小对齐证明在算术上也成立，但必须先选择匹配且受支持的重载，它不会承诺 SM75 `cp.async`。

由八个成员共同构造使用共享状态的流水线，使用同一状态、两个流水线阶段（pipeline stage）和生产者数量二。所有成员一致确认哪两个负责生产、哪六个负责消费。共享状态的生命周期必须覆盖所有使用它的流水线对象。在 `producer_commit` 前让相关生产者在线程束（warp）内重新汇合，不把只负责消费的成员变成生产者操作的必需调用者。构造的参与者、按角色执行阶段操作的参与者，以及协作复制的参与者，是三套必须分别审查的集合。

| 阶段实例 | 生产者与源区责任 | 消费者与目标区责任 |
| --- | --- | --- |
| 槽位 0 中的第 0 代 | 两个生产者均先 `producer_acquire`，发出各自不重叠的复制，再提交；源区在相应复制完成前保持稳定 | 六个消费者都在读取已完成载荷前 `consumer_wait`，各自在最后读取后 `consumer_release` |
| 槽位 1 中的第 1 代 | 相同协议，独立目标存储；源区保持有效，直到全部在途读取结束 | 按流水线先进先出（FIFO）顺序消费，不能因为槽位 0 完成就释放槽位 1 |
| 后续代次回到槽位 0 | 新的获取必须确认槽位 0 已在所需消费者释放后可复用 | 生产者覆盖时，第 0 代的任何消费者都不能仍在读取槽位 0 |
| 结束 | 停止加入新工作，逐项处理尚未完成的复制与生产者责任 | 完成被授权读取和必需释放，结束全部流水线对象的使用后才回收共享状态或缓冲区 |

`producer_commit` 提交工作，不是数据已完成的凭证；`consumer_wait` 确认数据就绪，不代表消费者随后读取已经结束；`consumer_release` 只能在那些读取之后移交所有权。`quit` 释放流水线所有权，但不会排空或取消尚未完成的工作，也不能补上缺失的到达，所以单个参与者退出不能证明立即释放内存是正确的。

SM75 满足选定 GPU 下限与 SM70+ 屏障/流水线 API 下限，却不满足 SM80 的全局内存到共享内存（global-to-shared）`cp.async` 加速路径。SM80 仍需满足地址空间与复制前提，不证明生成指令或执行重叠。SM90 可选 TMA 路径不在本题范围。同步回退继续保留就绪与复用边界。面向主机和设备的命名空间，不意味着仅由 GCC 编译时可见全部绑定屏障的复制重载；精确标签下的定义仍有 CUDA 编译条件保护。本材料没有任何候选的实测速度、耗时或执行证据。

## 可行替代

- 单次发布可使用拥有对象、显式指定作用域的原子对象，避免借用已有对象，但仍须满足初始化、作用域、读取来源、生命周期与载荷所有权责任。
- 当应用需求允许时，有序内核阶段与显式完成的数据传输可替代跨线程块或 CPU/GPU 标志交换。这样避免虚构任意网格自旋屏障，却不会消除生产者/消费者工作的顺序要求。
- 若 D 将来会返回，应保留涵盖 D 必需到达的参与计划，不把 `arrive_and_drop` 当临时离开。只有在另行证明无在途使用的边界，才能引入另一个屏障或改变线程组。
- 就绪/消费完成移交可以用两个显式初始化的屏障，而不是交替使用一个屏障的阶段，前提是各自参与者、生命周期、代次记账正确。本题单屏障四阶段的答案更小。
- 两个生产者同步复制，再让全部必需线程经过就绪/消费完成的线程块边界，是更简单的有效设计，但不能悄悄省略六个消费者或提前释放共享存储。
- 较小且真实的对齐证明、普通大小参数的复制或单独复核的旧库回退都可能适用，却都不是扩大方言支持或宣称实测加速的捷径。

## 常见错误

- 把主机 `std`、不完整的 `cuda::std` 接口与 `cuda::` 扩展当成可互换、编译模式可用性相同的命名空间。
- 把缺失的载荷发布边归功于 relaxed 标志、读到初始值的 acquire 或独立内存栅栏（memory fence）。
- 认为顺序一致性修复过窄作用域、系统作用域证明所分配内存的原子支持，或两者会强制生产者取得进展。
- 没有所有权证明就复用代次值，提前销毁被引用对象，或让普通访问与 `atomic_ref` 操作竞争。
- 只从当前预期计数扣除退出、跳过它本轮到达，或未恢复有效参与协议就重新加入。
- 到达后、等待前读取，只有就绪等待而没有消费完成边界就覆盖，或让继续参与的线程在当前阶段等待完成前再次到达。
- 把 `aligned_size_t` 当取整要求，让多个线程重复非线程组复制，或用两个调用者满足八成员协作复制。
- 因分派到同步实现而删除等待或释放，混淆提交与完成，或把 `quit` 当成排空、取消、补齐缺失到达的操作。
- 把上游测试、CI 别名、EX10 或架构名称提升为 L05 编译、执行、指令选择或性能结论。

复核日期：**2026-09-05**。返回 [PB-R4-005](/practice/#pb-r4-005)和 [PB-R4-006](/practice/#pb-r4-006)进行另一轮静态审查。四个证据数组继续为空。
