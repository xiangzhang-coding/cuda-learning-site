---
title: 'LAB18：构建并审查 NCCL 通信计算流水线'
description: 验证分块多 GPU 流水线，区分实测重叠与预期时间线。
pairId: lab18
counterpart: /en/labs/pipeline-nccl-computation/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [goal, prerequisites, environment, build, correctness, measurement, capture, interpretation, expected, recorded, sources]
resourceKind: lab
unitId: LAB18
prerequisites: [G05, Q05, Q07]
relatedUnits: [G06, EX24, VIS16, VIS14]
exampleIds: [EX24]
hardwareGate: 'Native Linux; 2-8 distinct full GPUs, each CC 7.5+, total memory >=8 GB and free memory >=256 MiB'
estimatedMinutes: 150
difficulty: advanced
toolkitLanes: [cuda-13.3]
minimumComputeCapability: '7.5'
maximumProblemMemoryBytes: 8388608
gpuCount: 2
permissions: ['Access selected GPUs and authorized topology', 'Collect CUDA activity with Nsight Systems', 'Write private logs and profiler reports']
evidence:
  compilation: []
  runtime: [Pending Hardware Verification]
  expectedObservations: ['Every rank and iteration should match the integer oracle; overlap classification requires a qualified two-GPU capture.']
  recordedObservations: []
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'Nsight Systems User Guide', url: 'https://docs.nvidia.com/nsight-systems/UserGuide/index.html', version: '2026.5', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: lab18 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'goal,prerequisites,environment,build,correctness,measurement,capture,interpretation,expected,recorded,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: lab } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: LAB18 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G05,Q05,Q07' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'G06,EX24,VIS16,VIS14' } }
  - { tag: meta, attrs: { name: 'cuda:example-ids', content: EX24 } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: 'Pending Hardware Verification' } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: '1 declared expectation' } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/labs/pipeline-nccl-computation/" lang="en">Read the English counterpart</a>

## 目标与交付物

依据 [G06](/multi-gpu/communication-computation-overlap/)，为相同的生产者／全归约（All-reduce）／消费者工作负载构建串行和流水线（Pipeline）调度。提交依赖图、源码／二进制身份、完整环境清单（Environment Manifest）、正确性日志、无 profiler 样本表及有证据支持的时间线分类。候选更慢或实际串行也是有效结果。预计 150 分钟，在外部环境执行。

## 精确先修

**[G05, Q05, Q07]**：[NCCL 流依赖](/multi-gpu/nccl-stream-dependencies/)、[异步计时](/correctness/timing-asynchronous-gpu-work/)、[时间线优先分析](/correctness/timeline-first-nsight-systems/)。先完成 [G06 练习](/multi-gpu/communication-computation-overlap/exercises/)。[EX24](/examples/nccl-all-reduce/)建立 NCCL 包与逐 rank 正确性基础；它的单流程序不是重叠基准。

## 阶段一：记录环境

使用原生 Ubuntu 24.04 x86-64、Toolkit **13.3.1**、C++17、NCCL 包 **2.31.2-1+cuda13.3**、驱动 **≥610.43.02**。选择两个不同的完整 GPU，各自 CC≥7.5、总内存≥8 GB、空闲≥256 MiB。可选 R=3–8 仍要求每个 GPU 满足同样条件，不用 MIG、虚拟机或多节点替代。调用方最大设备分配为每 GPU 8 MiB（两个 N 元素 int32 数组）；主机验证仅使用一份 4 MiB 缓冲区，上下文／库／事件另有开销。拒绝超过 1024 个分块。

遵循 [LAB17](/labs/nccl-all-reduce/) 的 NCCL 包身份与授权拓扑流程。记录 `nvidia-smi --version`、`-L`、`topo -m`、`topo -mp`、安装版图例、错误、rank→可见编号→私有物理身份、CC、内存、OS、驱动、Toolkit、主机编译器、`nvcc`、实际加载 NCCL 路径／哈希、插件和配置。保留管理员对 peer 路径／ACS／IOMMU 适用性的判断；未知或不适用时停止，不修改系统策略。

本次复核的官方 profiler 指南为 **Nsight Systems 2026.5**。记录 `nsys --version` 的精确构建版本及包、`nsys profile --help`、`nsys status --environment`、GPU／驱动兼容性和 CUDA 跟踪权限。本协议使用兼容的 2026.5 安装；旧的随 Toolkit 附带的 2026.1 工具需要另行复核命令。CUDA 跟踪权限被拒绝就不能分类重叠。本流程不请求 CPU 采样、上下文切换或性能计数器，也不提权绕过权限策略。

将[教学 fixture](/assets/overlap-fixtures/lab18-timeline.json) 中空白 `environmentManifest` 复制到私有存储，按[环境清单](/start/environment-manifest/)扩充。加入并发负载、时钟／功耗／温度、源码提交、编译参数、二进制 SHA-256、所有命令／状态、工作负载、五次预热、统计规则、同步、原始报告、诊断及保管映射。公开空白字段不是实测环境事实。

## 阶段二：实现与构建

先实现 G06 依赖表，再对照[独立解答](/multi-gpu/communication-computation-overlap/solutions/)及[原创可下载源码](/assets/exercise-solutions/g06-pipeline.cu)。将其保存为原生 Linux 私有工作目录中的 `g06-pipeline.cu`。这是练习解答，与 EX24 的规范可执行文件及编译证据独立。记录源码 SHA-256 和提交。使用 EX24 选定的 NCCL 安装，针对实际 GPU 支持的 SM 目标编译（示例 `75` 仅适用于 CC 7.5）：

```sh
nvcc --version
g++ --version
nvcc -std=c++17 -O2 -lineinfo -arch=sm_75 g06-pipeline.cu -lnccl -o lab18
sha256sum g06-pipeline.cu lab18
ldd ./lab18
```

保存编译输出／状态和实际动态库哈希。头文件及加载 API 版本检查补充而不替代包身份。这里没有附带成功构建记录。解答检查 CUDA/NCCL 立即错误，在处理提交错误前关闭分组，轮询每个通信器的异步错误，并设置 60 秒设备完成期限。外部 watchdog 还约束阻塞主机调用与中止／清理。

## 阶段三：先正确，再计时

参数为 `MODE R N C SAMPLES TRACE`。两种模式（`serial`、`pipeline`）均运行 `(N,C)=(1,1),(257,128),(1048576,65536)`，R=2、一个样本、TRACE=0。例如：

```sh
timeout --signal=TERM --kill-after=5s 180s ./lab18 pipeline 2 257 128 1 0 > correctness.log 2>&1
status=$?
```

每条命令使用独立日志，立即保留 `status`。要求**每个 rank、五次预热及全部样本**均零错误，出现最终清理 PASS 行，退出状态为零。超时、缺行、版本不符或权限被拒绝均为失败／阻塞，不是部分通过。保留首次失败后停止。可以另外进行授权的 Compute Sanitizer 正确性检查，但不能把 sanitizer 计时混入性能样本。

以零起始迭代 t、全局下标 i 表示，生产者输入为 `3*(rank+1)+(i%17)-8+(t%3)`。全归约求 int32 和；消费者变换为 `2*x+1`。独立 CPU 参考式为 `2*(3*R*(R+1)/2+R*(i%17-8+t%3))+1`。R=2、t=0、i=0 的字面结果为 **-13**。R≤8 时所有值都在 int32 范围内。全局偏移和迭代变化用于发现尾块及陈旧结果错误，必须逐元素验证，不能只看校验和。

为每个 rank 的每块画出 p→ready→c→done→q。数组使用不相交切片；每块独立事件只能在前一迭代完成并验证后重新记录。每个 A(k) 组包含所有 rank 的匹配调用，且仅包含通信流（Stream）。`serial` 每块后等待 q，`pipeline` 提交全部块后才等待。最终 q 完成经依赖传递证明生产者和集合通信完成。下载位于计时之后。

## 阶段四：条件匹配的无 profiler 测量

保持 N=1048576、R=2，比较 C=16384、65536、262144。每个 C 的串行与流水线都使用 SAMPLES=20、TRACE=0。三轮交替进程顺序（A/B、B/A、A/B），每个配置保留全部 60 个样本。每个进程先完成并验证五次预热，再保留样本。不能静默丢弃离群值。

主机单调时钟区间从首次生产者提交前开始，到全部 rank 的最终消费者完成后结束。包含启动／分组／等待／轮询和流水线填充／排空，不含初始化、分配、验证拷贝、CPU 比较、清理。这是整项工作负载完成延迟，不是内核时间。不能跨设备相减 CUDA 事件。记录轮询成本和并发负载；报告中位数、最近秩 p95（60 个排序样本中的第 57 个）、最小／最大及每轮中位数。应用吞吐量为 **N/完成秒数**，不是 R×N，也不是 NCCL 总线带宽。比较需要等量工作、完整正确性和足够稳定的分布，但仅凭这些不能确立重叠或瓶颈。

## 阶段五：采集有界时间线

正确性通过后，分别采集串行和流水线，SAMPLES=1、TRACE=1，保持 R/N/C 一致。源码在五次预热后调用 `cudaProfilerStart`，全部 GPU 完成后才调用 `cudaProfilerStop`，随后验证。采集样本受到插桩影响，不能进入无 profiler 统计。

```sh
timeout --signal=TERM --kill-after=5s 180s nsys profile --trace=cuda --sample=none --cpuctxsw=none --capture-range=cudaProfilerApi --capture-range-end=stop --output=lab18-pipeline ./lab18 pipeline 2 1048576 65536 1 1 > capture-pipeline.log 2>&1
status=$?
```

改为 `serial` 并更换输出／日志名后重复。使用前检查安装版帮助；保留命令、状态、程序正确性、profiler 诊断、`.nsys-rep` 和报告哈希。用兼容查看器打开，保留经授权脱敏的衍生材料，包括设备／流标签、选定区域和时间单位。统计总量不能证明区间相交。最小命令跟踪 CUDA；可选 NCCL 专用跟踪需另行复核版本和开销。如果添加 NVTX，其标记的是主机提交区域，不能证明设备执行。事件跟踪可能扰动依赖；记录其实际设置和采集方式，检查记录丢失／截断警告。采集不完整时不能分类。

## 阶段六：解释与决策

复用 [VIS16](/visuals/collective-paths/) 分析逻辑参与者，复用 [VIS14](/visuals/nsight-systems-versus-nsight-compute/) 选择时间线优先的路径，无需新增可视化。识别每个 GPU 的 `produce`、NCCL 工作及 `consume`，关联 API／启动／流行与分块顺序，确认 ready/done 等待。NCCL／分块映射不清就停止推断。使用同一报告时间轴，而非跨设备事件相减。

对**同一 GPU** 上的独立 `[start,end)` 区间求交；正交集支持该区域的局部重叠。仅跨 GPU 相交不支持此结论。检查全部 rank、rank 偏斜、隐式同步、启动间隙和完整填充／排空过程。分类为**观察到重叠**、**此区域观察到串行**或**无法判断**；缺少活动属于无法判断。即使观察到重叠，也不能确立吞吐量改善，需另行比较匹配的无 profiler 记录。瓶颈结论需要受控干预和合格双 GPU profiler 证据，而不是长时间条。所有结论仅限记录的系统／配置。

## 预期观察

每个 rank 和迭代应符合整数参考结果；重叠分类需要合格双 GPU 采集。串行对照应遵守所有完成边界；流水线依赖允许但不保证局部重叠。[Fixture](/assets/overlap-fixtures/lab18-timeline.json) 是无量纲合成刻度，无原始报告；它的案例是练习输入，绝非执行观察。

## 已记录观察与发布门槛

**尚无合格双 GPU 执行或 profiler 采集记录。**编译和已记录观察数组为空；LAB18 保持**待硬件验证（Pending Hardware Verification）**。不发布重叠、吞吐量、瓶颈或加速结论。未来运行已验证（Runtime-Verified）证据需要声明的基准环境（Reference Environment）、完整清单、经过复核的正确性与原始报告；社区观察单独标记。

原始报告保留在私有存储：可能包含主机／用户名、路径、进程参数、环境变量、设备身份和拓扑。只发布复核过的最小必要衍生材料，使用稳定 rank 别名；标签／截图也需移除秘密与标识符。私下保留原件哈希及原件→衍生材料映射。脱敏必须保留支持结论所需的区间、单位和关联；无法保留就不发布结论。不要把私有原始报告附到 issue 或仓库。

## 一手来源与权利

复核日期 **2026-09-20**，[SRC-CUDA-099](/sources-and-versions/#src-cuda-099)。NCCL 2.31.2 流／分组行为固定到提交 `7b83616df3ae082a1f32bb74c27458bfe8153a13`；profiler 协议依据官方 2026.5 指南及实际安装构建版本门槛。协议与 fixture 为原创 CC BY 4.0，练习解答为原创 Apache-2.0，未引入 NCCL 或 profiler 源码。
