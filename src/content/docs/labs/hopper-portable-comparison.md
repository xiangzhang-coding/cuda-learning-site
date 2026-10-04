---
title: 'LAB19：比较可移植与 Hopper 流水线'
description: 运行规范单阶段 tile 流水线，独立检查正确性并分开记录计时。
pairId: lab19
counterpart: /en/labs/hopper-portable-comparison/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [goal, environment, manifest, procedure, observations, results, sources]
resourceKind: lab
unitId: LAB19
prerequisites: [H04, H06]
relatedUnits: [EX25]
exampleIds: [EX25]
hardwareGate: 'Native Linux; one CC 9.0 GPU; 8 GB total and 512 MiB free; Toolkit 13.3.1'
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '9.0'
maximumProblemMemoryBytes: 524352
gpuCount: 1
estimatedMinutes: 90
difficulty: advanced
permissions: ['Build EX25 and access the selected GPU', 'Write environment and result logs', 'Administrator-approved counters for optional profiling']
evidence:
  compilation: []
  runtime: [Pending Hardware Verification]
  expectedObservations: ['Both admitted paths should reproduce every input and preserve guards; relative timing is not predicted.']
  recordedObservations: []
sources:
  - { title: 'PTX bulk copy and mbarrier', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'CC 9.0; native Linux', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab19 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,environment,manifest,procedure,observations,results,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB19 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H04,H06' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/labs/hopper-portable-comparison/" lang="en">Read the English counterpart</a>

## 目标与先修

精确先修 **[H04, H06]**：[H04](/architecture/hopper-clusters-tma/)解释完成，[H06](/architecture/portable-specialization/)解释回退与比较。使用 [EX25 规范项目](/examples/feature-gated-copy/)，不要复制列表形成第二套实现。环境配置后预留 60–90 分钟。在同一 GPU 上比较普通共享暂存与 Hopper 批量拷贝暂存。两者都是单阶段加载／消费流水线，不声称重叠。

## 环境与工作负载门槛

原生 Linux 是唯一受支持环境（Supported Environment）。选择**一张 CC 9.0 GPU**，至少**总显存 8 GB／可用 512 MiB**。选择 **Ubuntu 24.04 x86-64、Toolkit 13.3.1、NVCC 13.3.73、GCC 13.3.0、C++17、驱动 610.43.02**，Toolkit 随附 Compute Sanitizer（记录 `--version`），可选 **Nsight Compute 2026.2.1.5**。执行前确认实际版本。这是提议配置，不是已声明基准环境（Reference Environment）。可选第二张 CC 7.5+ 设备独立验证仅可移植构建，但不能用于同设备速度比较。

构建 `TARGET=90`：特化为 `compute_90/sm_90` 加 PTX，基线为 `compute_75/sm_75` 加普通 PTX 及 `compute_90/sm_90`，无需 `90a`。规模 **256/4096/65536**，每 tile 256 个 int32，每块 128 线程，三种输入，两端各四个保护元素。两个带保护区数组最多 **524352 B**。共享 tile 1024 B，特化屏障 8 B 加对齐填充；不分配集群／张量映射。输入从分配起点偏移 16 B，没有尾部。

正确性和 event 计时无需性能计数器特权。性能分析要求管理员批准的非管理员计数器访问权限及可用指标；`ERR_NVGPUCTRPERM` 或指标缺失记为阻断，不能记零。不提权。关闭或记录并发负载、显示用途、MIG/MPS 与时钟／功耗策略。

## 执行前填写环境清单

每个设备／目标／运行单独建立环境清单（Environment Manifest）。环境字段来自观察，不提前填入运行结果。

```yaml
subject: LAB19
source_commit: null
target: '90'
gpu: {model: null, uuid: null, cc: null, count: 1, total_bytes: null, free_bytes: null}
environment: {os: null, kernel: null, driver: null, toolkit: null, nvcc: null, host_compiler: null, dialect: c++17, image_digest: null}
tools: {sanitizer: null, nsight_compute: null, counter_permission: null, metrics: null, replay_cache_policy: null}
conditions: {mig_mps: null, clocks_power: null, concurrent_work: null, path_order: null}
workload: {counts: [256, 4096, 65536], patterns: 3, threads: 128, tile_bytes: 1024, warmups: 5, samples: 10, launches_per_sample: 100}
portable: {correctness: null, guards: null, exit_status: null, batch_ms: [], reports: []}
specialized: {correctness: null, guards: null, exit_status: null, batch_ms: [], reports: []}
compilation: []
runtime: Pending Hardware Verification
recorded_observations: []
```

同时保留精确命令、二进制哈希、目标／PTX 列表、API 返回值／退出状态、UTC 日期、性能分析过滤条件和报告哈希。原始私有标识交由证据保管者保留；公开报告脱敏时保持运行身份可追溯。

## 操作与验收

在下载的 EX25 目录中执行，为每条命令保留独立日志及退出状态：

```sh
bash scripts/compile-check.sh 90
timeout 120s ./build/90/ex25-copy portable
timeout 120s ./build/90/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool memcheck ./build/90/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool racecheck ./build/90/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool synccheck ./build/90/ex25-copy specialized
```

1. 确认编译目标和普通回退镜像，主机测试必须通过。构建成功不是运行成功。
2. 两条路径都要在检查完成后核对三个规模、三种模式的全部输出和保护区。特化执行也验证基线。超时、CUDA 错误、sanitizer 报错或缺少 PASS 均阻断验收；保留失败，不换标签重试。
3. 正确性通过后，使用未附性能分析的 event 样本：五次预热，每规模十个各含 100 个完整内核的批次。排除传输／初始化。记录原始批次、中位数／范围及执行顺序；交替进程顺序重复，报告顺序偏差，不挑有利样本。
4. 单独运行获准性能分析，使用可用指标和明确的重放／缓存设置检查普通共享暂存与 bulk-copy 指令及资源。不能把 profiler 重放时间与未附 profiler 的 event 时间当作同一测量。
5. 解释 H06 的单到达／1024 字节等待及块级发布。本实验（Lab）不验证 DSM、TMA 存储或多阶段重叠流水线。

## 预期观察

两条获准路径应逐值复制输入并保持保护区。显式请求特化时，准入集合外设备应在启动前失败。小 tile 的提交／等待开销可能大于收益，**不预言哪条路径更快**。源码／PTX 检查可以解释指令路径，不能证明实际重叠或吞吐。另一 GPU 的正确性需单独记录。

## 已记录结果与证据

| 主体 | 正确性／保护区 | 计时／性能分析 | 运行 |
| --- | --- | --- | --- |
| 所选 CC 9.0 上的可移植路径 | 未记录 | 未记录 | Pending Hardware Verification |
| 所选 CC 9.0 上的特化路径 | 未记录 | 未记录 | Pending Hardware Verification |

编译和已记录观察为空。LAB19 仍**待硬件验证（Pending Hardware Verification）**；EX25 证据独立且按目标限定。只有合格基准环境、完整保留的清单／日志才能建立运行已验证（Runtime-Verified）。浏览器、主机测试和预期表格不提供 GPU 证据。

## 来源与权利

核对日期 **2026-10-04**：[SRC-CUDA-108](/sources-and-versions/#src-cuda-108)、[PTX 9.3 批量拷贝规范](https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html)、[Hopper 调优](https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html)。原创实验及记录模板采用 CC BY 4.0，规范代码采用 Apache-2.0。权利方文档保留原声明，未复制示例或图形。
