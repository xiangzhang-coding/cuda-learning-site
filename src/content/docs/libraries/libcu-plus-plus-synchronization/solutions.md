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

本页是 [L05 练习](/libraries/libcu-plus-plus-synchronization/exercises/)的独立参考解答，遵循 [L05 v3.4.2 来源合同](/libraries/libcu-plus-plus-synchronization/)。这里只提供静态证明，不提供 CUDA/C++ 实现、执行、观察或性能结果。四个 evidence arrays 全为空，不赋予证据状态（Evidence Status）。事实与来源复核均对齐 **2026-09-05**。

## 解答 1：可复用 payload 需要两次所有权移交

**复核解答：** P、C 位于同一 block，所以两个 flags 都显式选择 `cuda::thread_scope_block`，使用 release 发布和 acquire 观察。一种有效表示是：对分别初始化、四字节对齐、无填充位（padding bits）的 32 位整数各建立一个 atomic reference。原始对象活得比所有引用、原子访问和最终 acknowledgement 更久。使用引用前初始化已可见，引用使用期间不对任何 flag 做普通访问。拥有对象的 `cuda::atomic` 是另一种表示，不改变证明。

| 对象 | 访问者与所有权 | Scope/order 或 lifetime 要求 |
| --- | --- | --- |
| 非原子载荷（payload） | P 写；C 只在发布后读 | 存储有效且可访问，C 最后读取被确认前不得覆盖 |
| Ready generation | P 发布；C 观察 | 相同 block scope；release store 与读取该 store 的 acquire load |
| Acknowledged generation | C 发布；P 观察 | 相同 block scope；最后读取后的 release store，复用前的 acquire |

第 1 代中，P 写 payload，再 release-store ready generation 1。C 只有在 acquire 读取到该发布后才能消费。Payload write 在 P 的 release 前定序，该 release 与 C 匹配的 acquire 同步，acquire 又在 C 的 payload read 前定序，所以 write happens before read。Acquire 读到初始零不授予这些权限。

C 在第 1 代最后读取后 release-store acknowledgement 1。P 必须 acquire 到该确认后才能写第 2 代。最后读取在 C 的 release 前定序，P 匹配的 acquire 则在下一次写入前定序。这条反向链让消费先于覆盖。随后 P release-store ready generation 2，C acquire 这次特定发布、消费并 release-store acknowledgement 2。P 观察到 acknowledgement 2 后才结束交换或回收 payload。

对这两代数据，可以将两个 counters 初始化为零，使用不回绕的不同值 1 和 2。只有 P 写 ready，只有 C 写 acknowledgement。观察到 acknowledgement 1 前不得发布第 2 代，不得把值 1 当作第 2 代。这些限制防止旧数值授权下一次交换。长期运行的回绕 counter、更多 producers/consumers 都需要新证明，两代答案不会自动解决那些协议。

| 修改 | 结论与修复 |
| --- | --- |
| 同一 block 的 relaxed flag operations | 不足。只保证 flag 访问原子性，没有 payload publication edge。使用匹配的 release/acquire 关系，或另一种有明确合同的移交。 |
| 跨 blocks 的 block-scoped sequential consistency | Scope 不足。题设同一 device/domain 可采用一致 device scope 和发布证明，但仍不授予跨 block 驻留或进展假设。 |
| Device-scoped acquire 读到初始零 | 不允许读 payload。等 acquire 读取需要的 generation release publication 后再消费；acquire 标签自身不是 reads-from 关系。 |
| System scope，但 allocation atomic support 未知 | 条件未解决，不予接受。先建立 allocation/device 支持及所有 CPU/GPU 参与者兼容的原子访问，或用显式完成的数据传输和执行边界替代直接共享。 |

Release load 与 acquire store 均为非法内存序选择。普通 load 也不能使用 acquire-release；普通 store 不能使用 consume 或 acquire-release。该 pin 的两种 atomic forms 都默认 system scope，但本答案刻意显式选择 block scope。上述关系都不证明 polling loop 会终止。Scope 受支持、memory order 合法与协议能够取得进展仍是独立要求。

## 解答 2：本轮四次到达，之后每轮三次

**复核解答：** 保留一个 barrier 与一个 tile，由一个初始化者建立 expected count 四，再让全部四个线程经过独立的初始化可见性边界，之后才使用 barrier。Shared declaration 不等于初始化，在未初始化 barrier 上等待也无法建立该边界。Barrier 必须存活到每次 arrival 与 wait 结束。

每个 ready phase 中，A 写完后才 arrive；B、C 可在读取前 arrive，但必须 wait 后才读。每个 consumed phase 中，B、C 在最后读取后才 arrive，A arrive 并 wait 以取回覆盖权限。每次普通 arrival 贡献一。D 只在 ready-0 通过 `arrive_and_drop` 贡献一次，后面不再参与。

| Phase | Expected count 与贡献 | Next expected count | 允许的访问与复用 |
| --- | --- | --- | --- |
| ready-0 | 4：A、B、C arrive；D 用 drop 贡献第四次 | 3 | 各自 waits 后，B/C 可读 tile 0，A 仍不能覆盖。 |
| consumed-0 | 3：A arrive；B/C 在最后 tile-0 reads 后 arrive | 3 | A 的 wait 完成后，才可用 tile 1 覆盖。 |
| ready-1 | 3：A 写完 tile 1 后 arrive；B/C arrive | 3 | 各自 waits 后，B/C 可读 tile 1，仍不能提前覆盖。 |
| consumed-1 | 3：A arrive；B/C 在最后 tile-1 reads 后 arrive | 3 | 对应 waits 后 payload 访问结束；全部 users/waits 结束后才能回收 barrier。 |

计数变为三，是 drop 对未来 phases 的作用，不是在 tile boundary 手动重新初始化。D 的 drop 仍贡献到当前总数四；跳过 D 的 arrival 会让 ready-0 无法完成。D 不能重新出现在只期待 A/B/C 的 phase 中。Consumed-1 后 next expected count 仍为三并无问题，只要不再进入新 phase，且等全部 users 结束才销毁；结束已完成协议不需要人为补一次到达。

一个反例足以否定错误复用规则：全部必需 arrivals 完成 ready-0；A 从 wait 返回；B 在读取前被延迟；A 用 tile 1 覆盖 buffer；随后 B 才读取。Ready phase 允许 B 开始读 tile 0，但从未证明 B 已读完。Consumed phase 把 B 的最后读取放在其 arrival 前，再把 A 的覆盖放在相应 wait 后，从而修复问题。C 同理。

错误方案中的 reset 也没有必要，如果还有参与者使用原 phase/token，则不安全。重新初始化不是普通 phase-transition operation，当前 barrier 已经管理未来计数。这四个 phases 是书面 ordering proof，不是执行过的 schedule。本题 A 采用普通同步写入，因此没有需要额外记账的 async-copy completion contribution。

## 解答 3：分开判断 eligibility、dispatch 与 ownership

**复核解答：** 先检查编译坐标，再选择复制加速路径。C++17 使用 CCCL 一般下限 GCC 7 / Clang 7；C++20 提升到 GCC 10 / Clang 11。选定 12.9 lane 的 NVCC 上限为 GCC 14 / Clang 19；13.3 lane 则为 GCC 15 / Clang 21。NVCC 接受 GCC 6 不会覆盖 CCCL 更高的下限。

| 候选 | 按题设材料作出的结论 |
| --- | --- |
| A：12.9.2、GCC 6、C++17、SM75 | 拒绝。低于选定 CCCL 的 GCC 7 minimum，即使它位于 NVCC host range 内。 |
| B：12.9.2、GCC 9、C++20、SM80 | 拒绝。C++20 要求 GCC 10 或更新；更高 GPU 架构不能修复 compiler dialect boundary。 |
| C：12.9.2、GCC 10、C++20、SM75 | 满足所列 compiler/dialect/target 数值政策交集，可进入语义回退审查。仍需检查实际安装的 toolchain、headers 与 OS configuration；不是成功 build，也不是 accelerated-copy claim。 |
| D：13.3.1、GCC 14、C++20、SM80 | 数值范围满足，但仍有条件：必须确定选定 v3.4.2 不早于 Toolkit bundled CCCL。合格硬件既不提供该检查，也不提供执行证据。 |
| E：13.3.1、GCC 14、C++23、SM90 | 不纳入选定 C++17/C++20 合同。EX10 的窄范围 GCC 14 C++23 probe 不建立 libcu++ 支持；SM90 也不在这里授权 TMA APIs。 |
| F：11.8.0、GCC 11、C++17、SM75 | 拒绝选定 v3.4.2 组合。较旧 bundled libcu++ 或更简单 fallback 必须另行复核 source/API，不继承 L05。 |

Tag 的 `13.X` alias 选择 13.2，不是 13.3；`12.X` 选择 12.9。配置中的 owner coverage 与 v3.4.2 release 都不提供本地 test result。Native Linux 仍是站点环境边界。CUDA 12.x latest-patch policy 与 CUDA 13.x bundled-version floor 必须独立于 compiler intervals 检查。

对 alignment，16-byte aligned base 加 offset 4 后，对 16 的余数为 4；offset 104 的余数为 8；byte count 100 的余数为 4。因此**两次复制的地址与长度都不满足** `cuda::aligned_size_t<16>`。Source/destination offsets 相同也没用，因为两个实际地址都不合格。Proof type 不承诺自动 padding 或地址修复。

Destination intervals 为 `[4,104)` 和 `[104,204)`，互不重叠，且都位于各自 208-byte stage buffer 内；source 是独立的有效 allocation。保留 nongroup copies：P0、P1 各自仅发出一次分配给自己的 range。不要让八个 threads 都复制两段。若改用 group overload，必须声明有效 cooperative-copy group，并让其全部成员以相同参数调用；当前两个 producers 的 issue path 不是八成员 group invocation。

可采用绑定 pipeline、适合该情况的普通 size `cuda::memcpy_async` overload，允许受支持的 fallback；合同仍需跟踪 copy completion 与 lifetime。也可有意采用每个 producer 的同步复制，再加明确的全参与者 ready/consumed 移交。对于这组数据，四字节的较小 alignment proof 在算术上也成立，但必须先选择匹配且受支持的 overload，它不会承诺 SM75 `cp.async`。

由八个成员集体构造 shared-state pipeline，使用同一 state、两个 stages 和 producer count 二。所有成员一致确认哪两个是 producers、哪六个是 consumers。Shared state 比所有使用它的 pipeline objects 活得更久。在 `producer_commit` 前让相关 producer warp participants 重新汇合，不把 consumer-only 成员变成 producer operations 的必需调用者。Construction participation、role-specific stage participation 与 cooperative-copy participation 是三套不同的待审查集合。

| Stage instance | Producer/source 责任 | Consumer/destination 责任 |
| --- | --- | --- |
| Slot 0 中的 generation 0 | 两个 producers 均 `producer_acquire`、issue 各自不重叠 copies、再 commit；source 在相应 copy work 完成前保持稳定 | 六个 consumers 都在读取已完成 payload 前 `consumer_wait`，各自在最后读取后 `consumer_release` |
| Slot 1 中的 generation 1 | 相同协议，独立 destination storage；source 有效性覆盖全部 outstanding reads | 按 pipeline FIFO 顺序消费，不能因为 slot 0 完成就 release slot 1 |
| 后续 generation 回到 slot 0 | 新 acquire 必须建立 slot 0 已在必需 consumer releases 后可复用 | Producers 覆盖时，generation 0 的任何 consumer 都不能仍在读取 slot 0 |
| 结束 | 停止加入新工作，逐项处理 outstanding copies 与 producer 责任 | 完成被授权读取和必需 releases，结束全部 pipeline-object 使用后才回收 state 或 buffers |

`producer_commit` 提交工作，不是 completed-data receipt；`consumer_wait` 建立 readiness，不代表消费者随后读取已经结束；`consumer_release` 只能在那些读取之后移交所有权。`quit` 释放 pipeline ownership，但不会 drain/cancel outstanding work，也不能修复 missing arrival，所以单个参与者 quit 不能证明立即 free 正确。

SM75 满足选定 GPU 下限与 SM70+ barrier/pipeline API 下限，却不满足 SM80 eligible global-to-shared `cp.async` 路径。SM80 仍需 address-space 与 copy preconditions，不证明生成指令或 overlap。SM90 可选 TMA 路径不在本题范围。同步 fallback 继续保留 ready/reuse boundaries。Host/device namespace 不意味着 GCC-only 可见全部 barrier-bound copy overloads，exact tagged definitions 存在 CUDA-compilation guards。本材料没有任何候选的实测速度、timing 或 execution evidence。

## 可行替代

- 单次发布可使用拥有对象的 scoped atomics，避免借用已有对象，但仍须满足 initialization、scope、reads-from、lifetime 与 payload ownership 责任。
- 当应用需求允许时，有序 kernel phases 与显式完成的数据传输可替代跨 block 或 CPU/GPU flag exchange。这样避免虚构任意 grid spin barrier，却不会消除 producer/consumer 工作的顺序要求。
- 若 D 将来会返回，应保留涵盖 D 必需 arrivals 的参与计划，不把 `arrive_and_drop` 当临时离开。只有在另行证明无在途使用的边界，才能引入另一个 barrier 或改变 group。
- Ready/consumed 移交可以用两个显式初始化的 barriers，而不是交替使用一个 barrier 的 phases，前提是各自 participant、lifetime、generation 记账正确。本题单 barrier 四 phase 的答案更小。
- 两个 producers 同步复制，再让全部必需线程经过 ready/consumed block boundaries，是更简单的有效设计，但不能悄悄省略六个 consumers 或提前释放 shared storage。
- 较小且真实的 alignment proof、普通 size copy 或单独复核的旧库 fallback 都可能适用，却都不是扩大 dialect support 或宣称实测加速的捷径。

## 常见错误

- 把 host `std`、不完整的 `cuda::std` 接口与 `cuda::` 扩展当成可互换、编译模式可用性相同的 namespaces。
- 把缺失的 payload publication edge 归功于 relaxed flag、读到初始值的 acquire 或独立 fence。
- 认为 sequential consistency 修复过窄 scope、system scope 证明 allocation atomic support，或两者会强制 producer progress。
- 没有 ownership proof 就复用 generation values，提前销毁 referenced objects，或让普通访问与 `atomic_ref` operations 竞争。
- 只从当前 expected count 扣除 drop、跳过它本轮 arrival，或未恢复有效参与协议就重新加入。
- Arrival 后、wait 前读取，或只有 ready wait 而没有 consumed boundary 就覆盖。
- 把 `aligned_size_t` 当 rounding request，让多个线程重复 nongroup copies，或用两个 callers 满足八成员 cooperative copy。
- 因 synchronous dispatch 删除 wait/release，混淆 commit 与 completion，或把 `quit` 当 drain、cancellation、missing-arrival repair。
- 把 upstream tests、CI alias、EX10 或 architecture name 提升为 L05 compilation、execution、instruction-selection 或 performance 结论。

复核日期：**2026-09-05**。返回 [PB-R4-005](/practice/#pb-r4-005)和 [PB-R4-006](/practice/#pb-r4-006)进行另一轮静态审查。四个 evidence arrays 继续为空。
