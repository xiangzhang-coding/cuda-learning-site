---
title: 'LAB20：比较可移植与精确 Blackwell 家族路径'
description: 准入一个已核对家族目标，比较完整拷贝路径，不跨家族外推。
pairId: lab20
counterpart: /en/labs/blackwell-portable-comparison/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [goal, environment, manifest, procedure, observations, results, sources]
resourceKind: lab
unitId: LAB20
prerequisites: [H05, H06]
relatedUnits: [EX25]
exampleIds: [EX25]
hardwareGate: 'Native Linux x86-64; one exact CC 10.0, 10.3 or 12.0 GPU; 8 GB total and 512 MiB free; 11.0/12.1 compile-target coverage only'
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '10.0'
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
  - { title: 'Blackwell target scopes', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Exact family admission', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab20 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,environment,manifest,procedure,observations,results,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB20 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H05,H06' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/labs/blackwell-portable-comparison/" lang="en">Read the English counterpart</a>

## 目标与先修

精确先修 **[H05, H06]**：[H05](/architecture/blackwell-families/)提供目标集合，[H06](/architecture/portable-specialization/)提供等价回退。构建 [EX25](/examples/feature-gated-copy/)，在同一设备上比较普通和 bulk-copy 加载／消费路径。环境配置后预留 60–90 分钟。这一共同批量拷贝操作按家族目标构建，不是家族独有算术或 Tensor Core 加速演示。

## 精确环境与负载

仅原生 Linux：**Ubuntu 24.04 x86-64 / Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / 驱动 610.43.02**。单设备，**总显存 8 GB／可用 512 MiB**，精确 CC 必须来自准入表。使用 Toolkit 随附 Compute Sanitizer 并记录版本；可选 profiler 为 **Nsight Compute 2026.2.1.5**。确认实际配置；这些尚不是基准环境（Reference Environment）。

| TARGET | EX25 中的 GPU 镜像成员范围 | 特化镜像 | 普通附加 cubin |
| --- | --- | --- | --- |
| 100f | 10.0, 10.3 | compute_100f / sm_100f + PTX | sm_100 |
| 103f | 10.3 | compute_103f / sm_103f + PTX | sm_103 |
| 110f | 11.0 | compute_110f / sm_110f + PTX | sm_110 |
| 120f | 12.0, 12.1 | compute_120f / sm_120f + PTX | sm_120 |
| 121f | 12.1 | compute_121f / sm_121f + PTX | sm_121 |

所有基线另含普通 compute_75 PTX 与 sm_75。**运行准入另有主机平台门槛：此处仅准入所选 x86-64 主机上的 CC 10.0/10.3/12.0。**11.0 和 12.1 行**仅覆盖编译目标**。Jetson 11.0 与 GB10/DGX Spark 12.1 使用 Arm 主机；x86-64 程序不是原生 Arm 程序。其 Jetson/Arm64-SBSA 平台软件、驱动、原生工具链及 profiler 配置需独立核对，之后才能执行本实验。不能仅替换目标／路径就运行。表格描述 GPU 镜像成员范围，不是完整环境准入。

**此项目配置排除 10.7**，即使当前文档给家族目标更广的集合。数值下限不是准入规则。120f 与 121f 的编译必须分开记录；两者都不能提供 CC 12.1 运行证据。

负载：规模 **256/4096/65536**，三种 int32 输入，每 tile 256 个值，每块 128 线程，两端各四个保护元素。输入／输出最多 **524352 B**，共享 tile **1024 B**，特化事务屏障 **8 B** 加对齐填充。载荷 16 B 对齐；无尾部、张量映射、集群、多播或 TMA 存储。不改变精度。计数器采集需要管理员批准的非管理员权限和精确指标支持；拒绝时阻断该观察。普通正确性／event 计时无需计数器权限。

## 环境清单与独立记录

执行前填写观察值，每份记录保留目标身份。保存源码提交、二进制哈希、完整构建命令、目标列表及以下环境清单（Environment Manifest）：

```yaml
subject: LAB20
source_commit: null
target: null
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

记录 UTC 日期、显示／并发工作、时钟／功耗／温度策略、MIG/MPS、API 错误、退出状态、profiler 过滤条件、原始报告位置与哈希。私有标识由保管者留存，公开报告脱敏。设备或指标缺失是明确空缺，不能虚构结果。

## 操作与验收

以下命令选择 **100f**，只能在获准的 10.0/10.3 设备上运行。若选择其他行，须一致替换所有目标／路径并独立保留输出。

```sh
bash scripts/compile-check.sh 100f
timeout 120s ./build/100f/ex25-copy portable
timeout 120s ./build/100f/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool memcheck ./build/100f/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool racecheck ./build/100f/ex25-copy specialized
timeout 300s compute-sanitizer --error-exitcode 1 --tool synccheck ./build/100f/ex25-copy specialized
```

1. 通过主机测试，检查实际带后缀 PTX 和普通回退。编译成功限定此目标和源码。失败或不受支持的构建阻断实验（Lab）。
2. 两条路径的三个规模／输入模式均需全部载荷精确相等、保护区不变，检查启动／完成／清理且退出成功。特化执行也运行基线。保留错误／超时，不把失败启动转换为标作特化的基线结果。
3. 比较未附 profiler 的 event 分布：五次预热，十个各含 100 个完整内核的样本，排除传输／初始化。同一 GPU／配置，记录路径先后，重复时交替进程顺序。保留全部批次样本、中位数／范围，包括性能退化。
4. 用所选 profiler、获准计数器、精确指标过滤和重放／缓存设置独立检查指令／资源。`ERR_NVGPUCTRPERM` 或指标不可用表示未测量。不能把 profiler 重放时间用于 event 时间的分母。
5. 用实际 CC／目标对解释准入，说明结果为何不能转用于 11.0、12.x 或其他设备。额外设备只提供独立正确性记录，不能替代同设备基线比较。

## 预期观察

获准路径应精确拷贝并保持全部保护区。强制跨家族特化应在启动前拒绝；兼容时 `auto` 应选择普通路径。相对性能未知，小型单阶段拷贝可能因批量提交／等待更慢。本负载不建立重叠、Tensor Core 吞吐、FP4 精度或互连性能结论。

## 已记录结果与证据

| 主体 | 正确性／保护区 | 计时／性能分析 | 运行 |
| --- | --- | --- | --- |
| 所选精确 CC 上的可移植路径 | 未记录 | 未记录 | Pending Hardware Verification |
| 同一 CC 上所选家族路径 | 未记录 | 未记录 | Pending Hardware Verification |

编译和已记录观察为空。**LAB20 仍待硬件验证（Pending Hardware Verification）**。EX25 编译是独立且按目标限定的轴。只有合格基准环境和完整保留的环境清单／日志才能建立运行已验证（Runtime-Verified）；尚未观察速度对照。

## 来源与权利

核对日期 **2026-10-04**：[SRC-CUDA-107](/sources-and-versions/#src-cuda-107)、[SRC-CUDA-108](/sources-and-versions/#src-cuda-108)、[能力范围](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)、[13.3.1 NVCC 归档](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html)和 [PTX 归档](https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html)。原创实验／表格／模板采用 CC BY 4.0，EX25 采用 Apache-2.0。权利方文档保留专有声明，未复制或改编权利方示例／表格。
