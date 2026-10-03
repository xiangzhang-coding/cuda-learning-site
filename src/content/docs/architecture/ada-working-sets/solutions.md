---
title: 'H03 解答：容量、复用距离与测量'
description: Ada 缓存假设的预算解答与有边界测量协议。
pairId: h03-solutions
counterpart: /en/architecture/ada-working-sets/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, budget, measurement, evidence]
resourceKind: solution-set
unitId: H03-SOLUTIONS
prerequisites: [H03-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ada cache contracts', url: 'https://docs.nvidia.com/cuda/ada-tuning-guide/index.html#memory-system', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,budget,measurement,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/ada-working-sets/solutions/" lang="en">Read the English counterpart</a>

## 先修知识

精确先修：[H03-EXERCISES](/architecture/ada-working-sets/exercises/)。原创解答，核对日期 **2026-09-22**，[SRC-CUDA-105](/sources-and-versions/#src-cuda-105)。

## 解答 1：三份预算，不编造命中

| W | 分配 2W | 每次启动请求流量 | 载荷 + 256 MiB 余量 |
| --- | --- | --- | --- |
| 4 MiB | 8 MiB | 8 MiB | 264 MiB |
| 32 MiB | 64 MiB | 64 MiB | 320 MiB |
| 128 MiB | 256 MiB | 256 MiB | 512 MiB |

均满足假设的空闲内存预算，最后一项恰好达到声明边界。实际分配仍需检查成功；空闲内存变化时应缩小大小。4 或 32 MiB 输入本身小于 64 MiB L2，这只支持必要的容量推理，不是充分的驻留证据。128 MiB 输入不能同时完整驻留。输出写入、替换策略、其他内核／显示任务及寄存器溢出会改变竞争。每次请求的 2W 字节不一定每轮都到达 DRAM。

32 MiB 窗口没有超过 64 MiB 窗口上限，却大于 16 MiB 预留区。比例 1 为整个窗口请求持久化待遇，可能造成预留区内驱逐。比例 0.5 约为一半访问请求该属性，在简化例中约对应 16 MiB 足迹；它不保证具体驻留行，也不保证 50% 命中。检查任务完成后禁用窗口，与上下文其他使用者协调重置持久化状态。不要把禁用窗口误认为重置旧行。

MIG 禁用该预留区；MPS 需要服务启动配置。不支持或未获授权时采用默认缓存。这里没有新增集群／TMA 门槛。用 CPU 按位比较保留 int32 输出语义，包含边界长度。更小输入或分块重设计也是可讨论的提议，但必须声明工作负载改变并重新验证语义，不能混入同大小比较。

## 解答 2：测量可比较的执行

原提议混合了不同设备、热数据与清理过的数据、有插桩与无插桩执行、显示负载，以及可能不同的时钟、软件和启动次数。所给材料没有建立其声称的性能结果。

先用同一个 CC 8.9 GPU 和 `compute_89` / `sm_89`，保持源码、大小、重复次数、int32 语义和校验相同。单独预热代码加载。声明首遍缓存历史协议，不把未经文档支持的技巧称为“保证冷缓存”。重复遍先显式预热同一输入，再用同流事件计时相同次数拷贝，检查结束事件完成。采集多次试验并报告分布，而不是最快样本。计时覆盖完整批次；初始化、H2D／D2H 和 CPU 校验与内核计时分开，另报端到端区间。

计数器单独采集，记录与假设相符的重放及缓存控制策略。默认内核重放清理缓存不能证明稳态复用。权限失败时保留错误，流量／命中结论仍为未知。以后取得事件耗时也不能填补这个缺口。记录精确 GPU／CC、L2／空闲显存、驱动、Toolkit／编译器／目标、OS、工具版本／指标、策略／窗口、显示／并发工作及功耗／时钟／温度坐标。

当前只能判断原比较受到混杂因素影响。未来正确的同设备结果可支持限定工作负载的策略选择；跨设备结果仍混合带宽、SM 资源、时钟、软件与缓存容量，不能证明普遍的代际加速。

## 证据与许可

架构执行与性能仍**待硬件验证（Pending Hardware Verification）**。没有提供构建、设备结果或分析器报告。未来正确性和测量证据必须附合格基准环境（Reference Environment）及环境清单（Environment Manifest）。原创解答采用 CC BY 4.0；权利方来源保留原声明。
