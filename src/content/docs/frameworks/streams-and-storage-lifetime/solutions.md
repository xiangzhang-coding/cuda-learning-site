---
title: 'P05 解答：让每项分配回到真实来源'
description: 解释双向流生命周期、只写复用存储、别名与释放时登记，提供有效替代方案并保持证据边界。
pairId: p05-solutions
counterpart: /en/frameworks/streams-and-storage-lifetime/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, solution-1, solution-2, solution-3, continue, sources]
resourceKind: solution-set
unitId: P05-SOLUTIONS
prerequisites: [P05-EXERCISES]
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
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/streams-and-storage-lifetime/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,solution-1,solution-2,solution-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P05-EXERCISES' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '4' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/streams-and-storage-lifetime/solutions/" lang="en">Read the English counterpart</a>

## 核对合同

先尝试 [P05 练习](/frameworks/streams-and-storage-lifetime/exercises/)。解答针对 torch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**、原生 Linux x86_64、native 分配器。四个证据数组均为空。**GPU 观察仍为待硬件验证（Pending Hardware Verification）**；下列标签描述静态使用图，不是运行跟踪。

## 解答 1：分别证明 x 与 y

| 存储 | 就绪证明 | 生命周期证明 |
| --- | --- | --- |
| x，来源 A | B 在正确位置等待 A，使 A 生产先于 B 消费 | 释放前登记 B 使用，持有到 B 完成，或释放前把 B 最后使用汇合回 A |
| y，来源 B | A 在正确位置等待 B，使 B 生产先于 A 消费 | 释放前登记 A 使用，持有到 A 完成，或释放前把 A 最后使用汇合回 B |

分配来源流（allocation origin）属于分配历史，不由释放时的当前流（stream）或最新写入者决定。最终释放意味着没有剩余持有者保住底层分配；删除一个变量后可能还有别名（alias）。由于提交不同于完成，最后 GPU 使用可能晚于最后 Python 使用。

S0 正确排序了两个数据交接并保护 x，但漏掉 y 的非来源 A 使用。S1 登记了两项生命周期，却允许消费者读取未完成数据。S2 只持有到提交，消费者仍在执行时存储就可能被回收。S3 在没有冲突修改的假定下有两项独立证明。S4 若在释放前把每项非来源最后使用纳入其来源流返回边界，也是有效手动证明。S3、S4 都不是实测运行证据。

登记修复中，B 的等待在所需 A 生产之后、B 使用 x 之前，且 x 活着时登记 B。A 则独立地在 B 生产 y 之后、A 使用 y 之前等待，并在 y 活着时登记 A。这些登记不必让 Python 等待；释放时分配器会延迟复用。

手动修复保留两个就绪等待。提交 B 对 x 的最后使用后、释放 x 存储前，把该使用返回来源 A。提交 A 对 y 的最后使用后、释放 y 存储前，把该使用返回来源 B。每个 `wait_stream` 只捕获已提交前缀，后续操作不会自动被纳入。妥善放置的双向快照不必产生循环，但应证明实际图，不能只凭方向就假定安全。

**有效替代方案：** 显式持有存储直到经检查的消费完成，再释放。这可能更广泛地阻塞 CPU，但对已覆盖使用有效。单流设计可简化所有权，但改变了并发政策；未经测量不能声称它更快或更慢。

**常见错误：** 只保护输入；因为 A 是默认流，就把来源 B 的 y 使用返回 A；认为 `record_stream` 转移所有权；把入队算作完成；在最终释放后才添加返回。

## 解答 2：没有旧值，不代表没有旧访问

前一个逻辑张量可能已经失去全部主机引用，但 A 上排队的访问仍未结束。native 与流关联的复用可以把这个块交给 z，因为新的 A 访问会排在旧 A 访问后面。B 默认没有这种顺序。即使 B 不消费 z 的未初始化内容，它的写入仍可能与更早的 A 读取或写入重叠。

所需依赖把相关分配来源 A 边界排在 B 第一次写入之前。位置正确的 B 等待 A 能提供这条顺序。B 写完后 z 来源仍是 A，所以 B 使用还需要登记、持有到完成，或释放前的最终 B 到 A 返回。即使只写，就绪与复用也是两项不同义务。

偏移视图（view）v 共享 z 的底层存储。v 仍是持有者时，删除 z 不会释放存储。视图偏移不会创建新分配来源，也不会让分配器的生命周期记账只管可见切片。应审查全部别名和最终持有者，而不是只看一个局部变量的作用域。

单独的修改情形中，登记 B 不能阻止 A 显式覆写仍存活的分配，而 B 同时读取。这是应用访问冲突，不是分配器回收。可以让 A 的冲突写入排在 B 读取之后，让 B 读取排在预期 A 生产之后，或采用真正独立的存储，并为必要复制与生命周期建立正确依赖。

**有效替代方案：** 在 B 上分配 z 并把初始工作留在 B，可消除这一次跨来源交接；若之后 A 消费，仍要另行审查。也可以持有存储，在转换点使用经检查的完成等待。这些改变了所有权/同步政策，不证明性能优势。

**常见错误：** 把 `torch.empty` 当成新鲜物理内存；把来源改成最后写入流；把视图看成独立分配；认为活引用或登记能阻止修改。这里不保证某个精确指针、崩溃或重复损坏。一次结果正确或返回地址不同，都不能证明依赖图安全。

## 解答 3：登记覆盖的是解除分配边界

| 使用 | 相对位置 | F 时已登记的 B 使用 | U1、U2 之间的手动来源返回 |
| --- | --- | --- | --- |
| U1 | R 后、F 前提交 | 覆盖 | 覆盖 |
| U2 | R 后、F 前提交 | 覆盖 | 不覆盖 |
| U3 | F 后企图使用 | 不授权 | 不授权 |

此 native 实现中的 R 把 B 放入分配使用集合，而不是冻结 R 时已排队工作的事件（event）快照。最终存储解除分配 F 时，才在已登记流上插入事件，以其完成控制复用。因此，U1、U2 虽然都在 R 后提交，仍可被覆盖。没有任何机制允许在 F 后通过悬空引用继续使用已释放分配。

手动返回不同：`origin.wait_stream(B)` 使用调用边界时 B 已提交的前缀。夹在 U1、U2 之间的返回保护不了 U2。把最终返回移到所有相关 B 提交之后、F 之前，或持有存储直到这些使用完成。如果有多个非来源使用者，每条相关流都要覆盖，而不是只管主机代码最后提到的流。

未来比较前，先在经检查的完成之后独立验证预期输出，声明容差/有限值要求，并给输入与结果都完成生命周期证明。比较同一操作、输入、形状/步长/数据类型，除有意改变的生命周期机制外保持相同所有权政策。采用 P04 的干净完成墙钟边界，或有效的事件开始/分叉/汇合/结束区间。事件要启用计时，在 end 完成后以毫秒报告。工作负载预热（warmup）、重复的无剖析计时、正确性和性能剖析（profiling）分开；不能从持有张量引用的剖析器推断未受扰动的生命周期。

仍须完整的 P05 环境清单（Environment Manifest）：运行/源码/输入/参考/日志身份；实际 GPU 型号/稳定身份/计算能力/数量/显存及 CPU/噪声/时钟/功率/温度；实际原生 Linux/内核/glibc/镜像/容器身份；CPython 可执行文件/构建/编译器/选项与安装器；torch wheel/索引/哈希/提交及全部依赖产物；驱动、构建 CUDA、随包及加载的 Runtime/cuDNN/CUPTI 身份；系统 Toolkit/编译器或不存在/未使用；实际分配器/配置、环境与精度开关；每项来源/别名/生产者/消费者/最后使用/释放/依赖；计时单位/覆盖/纳入/预热/重复/原始分布及独立剖析设置/产物。未观察的值保持空白。

进程启动前使用 `PYTORCH_ALLOC_CONF=backend:native`，并确认实际分配器，不能从构建 CUDA 12.8 推断。`cudaMallocAsync` 是另一种进程范围后端，要求 CUDA 11.4 或更新版本；native 的复用/统计结论不会自动转移。CUDA 包版本或已安装系统 Toolkit 都不证明实际后端或已加载库。

**有效替代方案：** 手动记录的事件可以表达精确返回边界；不追求重叠时，持有所有权到经检查的完成更简单。较晚返回可能保留并发，但持有内存更久；登记可能带来事件/轮询开销。这些都是值得测量的原因，不是已测出的赢家。

**常见错误：** 把 `record_stream` 覆盖冻结在 R；把 `wait_stream` 快照延伸到未来 U2；认为 U3 在释放后仍受保护；以指针相等作为验收测试；混用 native 与异步后端统计；把拟议 Linux/GPU/驱动配置报告为已观察。

## 继续学习

回到 [P05](/frameworks/streams-and-storage-lifetime/)与 [PB-R5-005](/practice/#pb-r5-005)。[P04](/frameworks/queued-work-timing/)提供独立的计时边界审查。

## 来源

精确所有者依据为 [CUDA 语义](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst)、[Stream 与 Event 接口](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py)、[Tensor 生命周期文档](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/_tensor_docs.py)及 [native 分配器源码](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/c10/cuda/CUDACachingAllocator.cpp)。参阅 [SRC-CUDA-080](/sources-and-versions/#src-cuda-080)、[SRC-CUDA-081](/sources-and-versions/#src-cuda-081)。原创解答采用 CC BY 4.0，未复制所有者实现或测试体；上游来源保留自身许可与通知。**事实核对与来源访问日期：2026-09-12。**
