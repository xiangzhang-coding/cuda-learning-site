---
title: 'P04 解答：完成是必要条件，覆盖要另外证明'
description: 逐项审查提交与完成、多流区间两端及证据有限的报告，解释有效替代方案与常见错误。
pairId: p04-solutions
counterpart: /en/frameworks/queued-work-timing/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, solution-1, solution-2, solution-3, continue, sources]
resourceKind: solution-set
unitId: P04-SOLUTIONS
prerequisites: [P04-EXERCISES]
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
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/queued-work-timing/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,solution-1,solution-2,solution-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P04-EXERCISES' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '3' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/queued-work-timing/solutions/" lang="en">Read the English counterpart</a>

## 核对合同

先尝试 [P04 练习](/frameworks/queued-work-timing/exercises/)。本解答使用 torch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**、原生 Linux x86_64、native 分配器。四个证据数组均为空。GPU 观察仍为**待硬件验证（Pending Hardware Verification）**；以下是静态推理，不是测量结果。

## 解答 1：保留时钟原本回答的问题

| 情形 | 有依据的声明 | 不能升级成什么 |
| --- | --- | --- |
| T0 | 提交周围的主机区间，包括实际发生的阻塞 | 设备完成延迟、纯入队成本、纯核函数时间，或保证小于事件时间 |
| T1 | 声明的所选设备区域的完成墙钟时间（wall time） | 所有 GPU 完成，或只含设备执行的区间 |
| T2 | 包围 S 上全部声明工作的已完成设备事件（event）区间 | 孤立核函数耗时之和、加速证明，或无关侧流的覆盖 |

T1 必须在主机起点之前完成所选设备的旧工作，否则旧积压可能被记到当前操作。所选设备的最终完成必须在主机终点之前，否则工作可能逃出区间。最后同步的主机开销在墙钟测量内。还要声明是否包含分配、传输、库初始化和输入准备。设备同步覆盖该设备所有流（stream），所以进程内无关工作可能污染区域；其他设备不在覆盖内。

T2 的两个事件都要求 `enable_timing=True`，在 S 上包住所测工作的记录位置，以及主机在读 `start.elapsed_time(end)` 前已经确认 end 完成。单位是毫秒。默认禁用计时的事件不能用于经过时间。start 未记录也无效，即使事件查询报告就绪。没有 end 完成检查时，不能假定读取经过时间本身已经完成必要等待。

**有效替代方案：** 如果问题确实是主机提交观察，可以保留 T0 并独立标注。也可以通过等待位置正确的结束事件，为范围更窄的墙钟区间建立声明工作负载的完成点，同时明确控制旧工作。这不同于 T1 的设备范围方案，必须标清范围。

**常见错误：** 把 T0 叫作“核函数时间”；假定主机时钟必然更小；把毫秒当秒换算；把 `query` 当作记录证明；要求任意微小事件测量都超过某个正阈值。样本有限且非负是必要条件，但分辨率与覆盖仍需审查。

## 解答 2：证明覆盖的两个方向

T3 有两条开始边，却遗漏 B 的完成边，所以 C 到达 end 后 B 仍可能执行。T4 有两条完成边，却遗漏通向 B 的开始边，所以 C 到达 start 之前，B 可能已做了一部分甚至全部工作。这些反例不需要假定耗时或调度政策。

修正后的 T5 包含以下关系，标记和依赖边界必须按提交顺序放置：

1. C 的 start 通过开始依赖先于 A 的第一个纳入工作。
2. C 的 start 通过另一条开始依赖先于 B 的第一个纳入工作。
3. A 的最后纳入工作通过完成汇合先于 C 的 end。
4. B 的最后纳入工作通过另一条完成汇合先于 C 的 end。
5. 主机读取经过时间在 end 成功完成之后。

如果用 `wait_stream` 表达某条边，其生产流快照必须已包含相关标记或最终工作。在 B 提交最后一个纳入操作之前调用汇合，不覆盖该操作。同样，把 B 的开始等待放在 B 工作提交之后，也不能排序之前的工作。

T3/T4 的事后设备 synchronize 只说明所选设备的全部工作最终完成，不会重写已经到达的 start 或 end 标记。修正图没有提供耗时，因此不能推导分支时间之和或加速比。即使事件区间正确，仍可能包含空隙、主机供给延迟及设备干扰，也不保证实际重叠。

**有效替代方案：** 用显式记录的完成事件代替流快照；或者当问题包括整个设备区域时，选择完成设备范围的墙钟区间。仍要保留双分支覆盖证明。把全部工作串行放在一条流上可以形成另一个有效实验，但不能说它测量的是原本的并发政策。

**常见错误：** 把默认流标记当作通用屏障；只检查结束汇合；试图在 end 之后等更久来修复覆盖；把重叠事件耗时之和称为端到端延迟。

## 解答 3：观察留空，要求不要含糊

一个可审查的拟议政策可以选择 8 次工作负载预热（warmup）和 30 次无剖析测量重复，明确这些数字是选择，不是达到稳态的保证。保持形状、数据类型、输入构造、精度设置和验收输出不变。如果后续原始数据出现漂移，可以修改政策，但要保留理由与全部样本，而不是悄悄删掉不合意的数值。将来可以同时报告原始序列、中位数和范围，不能现在编一个结果。

为所选操作构造独立参考，在采样前声明有限值检查及有依据的绝对/相对混合容差。经检查的完成之后，在计时外验证。验证传输、`.item()` 与打印不放进区间。如果实际应用问题包含某项传输，就一致地纳入那项声明传输，而不是声称任何传输都必须排除。

冷初始化、工作负载预热、完成墙钟试次、正确包围的事件试次与性能剖析（profiling）各有记录。每项记录说明是否包含分配与主机准备。成组试次除以组大小得到摊销的每操作时间，不是孤立延迟。剖析配置与 `CUDA_LAUNCH_BLOCKING` 都是明确字段；调试或插桩运行不是无插桩基线。

环境清单（Environment Manifest）必须包含 P04 的每组字段，并保留以下区别：

| 记录 | 必须保留的区别 |
| --- | --- |
| 硬件与主机 | 实际 GPU 身份/计算能力/数量/显存、CPU、时钟/功率/温度/噪声条件；实际 Linux/架构/内核/glibc、OS/容器来源，不能填拟议值 |
| 解释器与包 | CPython 可执行文件/构建/编译器/选项和安装器；torch wheel/索引/哈希/提交及完整依赖产物，不能只有版本串 |
| 驱动与库 | 已安装驱动、构建 CUDA 12.8、随包 Runtime/CUPTI 12.8.90 与 cuDNN 9.19.0.56、操作后的实际加载路径；系统 Toolkit/编译器记录为存在或不存在/未使用 |
| 工作与所有权 | 源码修订、种子、形状/步长/数据类型、分配器和环境变量、设备/流/依赖图、正确性/参考政策及诊断阶段 |
| 测量 | 时钟/单位、两端边界、纳入政策、预热/重复/批次政策、原始样本/分布/噪声政策、独立剖析配置与产物 |

结果错误、完成失败、构建/后端不符或标记无效，都使试次不能支持原声明。分辨率不足意味着所选测量无法有效区分工作负载，不意味着 CUDA 没花时间。实测误差、耗时、加载库观察与 GPU 身份在执行前保持未填。拟议 Ubuntu 24.04、单 GPU 计算能力至少 8.0/显存至少 8 GB、仍受维护且兼容并保守至少为 570.124.06 的驱动，不是已观察的基准环境（Reference Environment）。

**有效替代方案：** 其他有依据的重复次数、稳健统计摘要，或单独标注的冷启动研究都可接受。依赖范围的墙钟区间也可接受，但完成与排除证明要匹配问题。任何选择都不能事先确定性能赢家。

**常见错误：** 把目标版本抄进观察字段；用一个“CUDA 版本”标量代替驱动/构建/包/加载身份；用剖析运行证明未受扰动的计时；只记录最快样本；把受阻或跳过的 CUDA 运行记为成功。

## 继续学习

回到 [P04](/frameworks/queued-work-timing/)和 [PB-R5-004](/practice/#pb-r5-004)，再带着区间证明阅读 [P05](/frameworks/streams-and-storage-lifetime/)。

## 来源

本解答使用精确提交的 [CUDA 语义](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst)、[Stream 与 Event 接口](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py)及[所选设备同步](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/__init__.py)。环境与语义记录为 [SRC-CUDA-080](/sources-and-versions/#src-cuda-080)、[SRC-CUDA-081](/sources-and-versions/#src-cuda-081)。原创推理采用 CC BY 4.0；上游来源保留自身许可/通知，未被复制成实现。**事实核对与来源访问日期：2026-09-12。**
