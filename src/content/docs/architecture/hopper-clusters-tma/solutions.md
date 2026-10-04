---
title: 'H04 解答：远端所有权与方向相关等待'
description: 集群生命周期修复、TMA 事务计数及可移植比较的解答。
pairId: h04-solutions
counterpart: /en/architecture/hopper-clusters-tma/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, cluster, tma, evidence]
resourceKind: solution-set
unitId: H04-SOLUTIONS
prerequisites: [H04-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Hopper feature contracts', url: 'https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,cluster,tma,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/hopper-clusters-tma/solutions/" lang="en">Read the English counterpart</a>

## 先修知识

精确先修：[H04-EXERCISES](/architecture/hopper-clusters-tma/exercises/)。原创纸面解答，核对日期 **2026-09-22**，[SRC-CUDA-106](/sources-and-versions/#src-cuda-106)。

## 解答 1：让两个所有者都存活

本地分配属于其线程块。每块 256 个线程初始化自己的 1024 B 段，再由每个线程参与 `cluster.sync()`，建立所有者均存在和初始化已发布的事实。各线程读取另一所有者映射段中的对应元素，写入自己的唯一全局输出。随后每个线程参与第二个 `cluster.sync()`，之后任何块才能退出或复用存储。第一条边让远端读取合法，第二条边保护读取期间的所有者生命周期。块内屏障不能建立任一集群级事实。

本地每块 1024 B，集群总分布式共享内存（Distributed Shared Memory，DSM）2048 B，全局输入／输出4096 B。2048 B 总量不能授权 2048 B 本地访问。没有对同一输出的竞争写入，因此无需原子操作。即使未来尾部访问被屏蔽，也要保留全部集体参与者，不能为“省掉”空闲块而提早返回。

针对实际两块配置及内核查询集群启动支持、潜在集群大小和活跃集群占用率。八块可移植上限不保证具体分区的资源。准入失败时，采用匹配目标的普通内核：先写 2048 B 全局暂存，再于同一流读取对方段写输出。全局共 6144 B，无需 DSM 或网格自旋屏障即可保留结果。仍适用 H04 的 ≥8 GB／空闲 512 MiB 原生 Linux 环境和精确目标检查。

把全部 512 个输出与 CPU 置换比较，测试不对称数据，检查启动／完成及适用的消毒器报告。以后比较性能时，应计入两个有序基线内核的总成本，对比完整集群内核，数据／迭代次数匹配，校验置于区间外。内核数不是加速比；更大的集群或没有记录的设备结果不能替代证明。

## 解答 2：只计一个分块，再按方向等待

采用 64 B 外层步长、全局基址 16 B 对齐、共享分块 **128 B 对齐**。映射秩为 2，int32 类型，维度 [16,16]、box [16,16]、元素步长 [1,1]，无 interleave／swizzle／L2 promotion／特殊浮点填充。保持类型要求的 64 字节对齐，检查 `cuTensorMapEncodeTiled`，为独立输入／输出分配传入不可变 `const __grid_constant__` 描述符，并保持分配存活。检查驱动 API 可用性／链接。60 B 步长既不能表达这里的连续行，也不满足外层步长是 16 倍数的要求。16 字节共享对齐满足所选一维批量规则，不满足本张量拷贝。

块共有 **256 次到达和 1024 预期字节**。若每个消费者都登记 1024，就会要求 **262144 字节**，一个 1024 B 拷贝无法满足完成条件。按所选 API 可见性规则初始化并发布对齐共享屏障；一个选出的发起者提交传输，在显式计数方案中只登记一次字节。高层重载已经计数时，不再手动重复登记。每个线程到达并等待该阶段，然后才读取。

加一操作的输入须限定为不发生有符号溢出，并与精确 CPU input+1 比较。各写者完成通用共享写入后，执行所需异步代理栅栏和块屏障，随后选出的存储发起者提交**批量**存储组。发起者的批量读取完成等待保护共享源；等待后再用块发布屏障，防止其他线程提前覆盖。加载事务屏障不能追踪此存储，非批量 `cp.async.wait_group` 等待的是另一种机制。

读取完成不等于全局目标完成。若发起者要在内核内消费目标，应使用完整完成等待，再向更广消费者正确发布。本题中 CPU 只在检查内核／流完成后读取。排空全部传输，保留源／描述符／屏障生命周期，不复用仍有未完成阶段的屏障。

`compute_90` / `sm_90` 覆盖所选主机编码 TMA 路径，无需 `sm_90a`；设备端描述符修改有独立目标契约。这个单块传输不需要集群。任一描述符／对齐／功能条件失败时，用普通加载写共享、块发布、加一、块协调和普通全局存储。该回退改变指令路径，保留声明的精确输出。显式更小分块也是可选重设计，但需新的预算与校验。两者都不提供耗时结果。

## 证据与许可

执行、拷贝行为与性能仍**待硬件验证（Pending Hardware Verification）**。未来声明需精确构建／目标产物、环境清单（Environment Manifest）、合格基准环境（Reference Environment）、正确性／完成检查及保留的性能分析报告。计数器权限失败时计数器证据缺失。发布更新 2026-10-04：[LAB19](/labs/hopper-portable-comparison/)现承接 H06。原创 CC BY 4.0；权利方资料保留原声明。
