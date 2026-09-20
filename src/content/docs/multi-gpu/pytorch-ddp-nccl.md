---
title: 'G07：把 PyTorch DDP 看作 NCCL 客户端'
description: 从一进程一 GPU 的所有权出发，追踪梯度归约、流依赖、分配器生命周期与有界诊断。
pairId: g07
counterpart: /en/multi-gpu/pytorch-ddp-nccl/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, ownership, initialization, gradients, streams, environment, scenarios, diagnosis, teardown, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G07
prerequisites: [P04, P05, G04]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 100
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'PyTorch DDP implementation and API', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py', version: '2.11.0+cu128', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'ProcessGroupNCCL implementation', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp', version: '2.11.0', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'NCCL archived stream semantics', url: 'https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2289/user-guide/docs/usage/streams.html', version: '2.28.9', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g07 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/pytorch-ddp-nccl/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,ownership,initialization,gradients,streams,environment,scenarios,diagnosis,teardown,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G07 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P04,P05,G04' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/pytorch-ddp-nccl/" lang="en">Read the English counterpart</a>

## 学习目标

解释局部损失如何变成共享梯度，区分 Python 返回和 GPU 完成。审查 rank／设备所有权、分布式数据并行（DistributedDataParallel，DDP）的集合通信（Collective）序列、自定义流（Stream）依赖及失败证据。预计 100 分钟，外部实践另计。阅读和合成工作表无需 GPU；**下列全部 GPU 场景仍为待硬件验证（Pending Hardware Verification）**。没有已记录日志、同步结果、扩展性结果或性能数字。

## 精确先修

**[P04, P05, G04]**：[排队工作与计时](/frameworks/queued-work-timing/)、[流与存储生命周期](/frameworks/streams-and-storage-lifetime/)、[NCCL 通信器与集合通信](/multi-gpu/nccl-communicators-collectives/)。复习主机返回与完成、就绪与生命周期、匹配参与者的区别。直接先修不包含另一套分布式框架或多节点网络。

## 为什么框架仍需要通信契约

数据并行（Data Parallelism）复制模型，把不同样本交给各副本。独立优化器会让副本偏离，因此要先交换梯度，再执行等价的局部更新。DDP 通过自动微分钩子（Autograd Hook）、梯度桶（Gradient Bucket）归约和 c10d 进程组（Process Group）实现这一过程；NCCL 后端负责 GPU 通信。旧 DDP 设计说明明确基于 v1.4：它能解释分桶的动机，却不能决定本次版本的流和分配器实现。分桶带来重叠机会；有桶或 GPU 更多都不能证明加速。

## 一进程拥有一个可见设备

使用一个原生 Linux 节点、R 张不同的完整 GPU 与 R 个工作进程。`torchrun --standalone --nnodes=1 --nproc-per-node=2 --max-restarts=0` 启动两个进程，并提供 `RANK`、`LOCAL_RANK`、`WORLD_SIZE`、`LOCAL_WORLD_SIZE`、`MASTER_ADDR`、`MASTER_PORT`。全局 rank 标识组成员，本地 rank 选择可见序号。共享 `CUDA_VISIBLE_DEVICES=2,5` 时，本地 rank 0、1 对应第一、第二张可见卡，不是物理设备 0、1。这个映射仅作说明，不是机器清单。

| 工作进程 | 可见序号 | 私有物理映射 | 所有权要求 |
| --- | --- | --- | --- |
| `RANK=0, LOCAL_RANK=0` | `cuda:0` | 第一张选定 GPU | 在本作业内独占 |
| `RANK=1, LOCAL_RANK=1` | `cuda:1` | 第二张选定 GPU | 必须是另一张完整 GPU |

在 CUDA 分配和初始化前调用 `torch.cuda.set_device(local_rank)`；模型、输入和进程组都用同一设备。构造 `DDP(model, device_ids=[local_rank], output_device=local_rank)`。NCCL 进程不能共享同一 GPU，否则可能死锁或报告无效使用。一张卡上的两个 rank 不满足场景。CPU 进程身份、全局 rank、可见序号、物理身份是四个不同字段。

## 会合、进程组与通信器

`init_process_group("nccl", init_method="env://", device_id=device, timeout=timedelta(seconds=60))` 使用启动器提供的会合（Rendezvous）信息。存储（Store）交换建立连接所需的信息，不承担梯度数据传输。固定后端中，指定 `device_id` 会立即建立 NCCL 通信器（Communicator），比首次使用时延迟初始化更早暴露初始化错误。ProcessGroupNCCL 拥有通信器句柄和通信资源；应用不应为 DDP 梯度再创建一个裸 NCCL 通信器。

所有 rank 在 DDP 包装前构造相同模型，保持参数注册顺序、形状和步长一致。默认 `init_sync=True` 检查形状并广播参数／缓冲区。参考实现没有缓冲区，并显式设定 `broadcast_buffers=False`。DDP 构造、前向和反向都有同步义务；按 rank 提前返回可能让其他进程无法继续。额外进程组需要一致的创建及集合通信顺序，本场景只使用默认组。

## 梯度同步到底同步什么

自动微分钩子标记梯度就绪；归约器（Reducer）以一致顺序安排匹配的桶归约，并在优化器依赖这些梯度的 CUDA 工作执行前使归约结果可用。在选定的普通 DDP 路径中，各 rank 得到局部梯度的**跨 rank 均值**。DDP 不划分输入，也不替你平均日志中的损失。真实数据集可用 DistributedSampler，并在逐轮洗牌时调用 `set_epoch`，同时保持步数一致；参考实现直接提供 rank 相关标量输入。

各 rank 样本数相等、局部损失取均值时，rank 均值等于全体样本均值。样本数不等时通常不成立：若目标是在匹配步数下得到全体样本均值，应把局部损失乘以 `R*n_r/sum(n_r)`。迭代次数不等是另一种参与问题；补齐或显式设计 join 协议都需要独立分析。本场景没有暗中启用 `join`、自定义通信钩子、未使用参数、自动混合精度（AMP）或编译。

原创代数参考：一个 FP64 权重 `w=1`，预测 `w*x`，目标零，局部损失 `(w*x)^2/2`，一个样本 `x=r+1`，SGD `lr=1/8`，两步，无动量。R=2 时，预期梯度／更新后权重为 `(2.5,0.6875)`，再为 `(1.71875,0.47265625)`。这些是推导值，**不是运行输出**。各 rank 权重相同还不够：每个 rank 都必须符合独立公式。

两个微批次（Microbatch）累积时，使用 `x=r+1`、`x=r+2`，每个微批次损失除以 2，且把第一个微批次的**前向和反向**都放进 `ddp.no_sync()`。退出上下文后的第二次前向／反向同步累积梯度；更新一次，下对微批次前清空梯度。R=2 的预期值为 `(4.5,0.4375)`、`(1.96875,0.19140625)`。不要再次手动全归约（All-reduce）DDP 梯度。所有 rank 必须遵守相同的同步安排。

## 流：分别证明就绪与生命周期

固定 ProcessGroupNCCL 的异步路径从当前调用流向内部 NCCL 流建立依赖。`Work.wait()` 把完成依赖加到调用它时的当前流上；在选定的非阻塞等待策略中，这不是通用的 CPU／设备完成屏障。同份源码的同步集合通信路径使用当前流，异步路径则暂存张量引用以保护分配器生命周期。不能把旧的“每次集合通信都在独立流上调用 recordStream”描述套到此版本。

参考实现使用独立标量 `all_reduce(..., async_op=True)` 教授这些依赖，不修改 DDP 梯度：

| 阶段 | 必需依赖或生命周期 |
| --- | --- |
| 在生产者 P 上分配／写入 payload | 分配／复用前，P 等待来源流的已有工作 |
| 在当前来源流 C 上调用全归约 | C 等待 P；后端看到 C，不会自动看到无关生产者 |
| 自定义流 Q 消费 | 在 Q 内先调用 `work.wait()`，再读取结果 |
| 分配器安全 | 持有 payload／work／result 到 Q 完成；`payload.record_stream(Q)` 登记 Q 使用，不建立就绪 |
| 主机比较与销毁 | `Q.synchronize()` 成功后才能比较、复用或释放 |

持有张量引用保护分配生命周期，但不能阻止显式覆盖。`record_stream` 无法修复遗漏的生产者等待。DDP 内部桶处理不会替任意用户流建立顺序。若反向与优化器在不同流上运行，要按 P05 补齐依赖与存储生命周期。参考实现的训练留在同一当前流上，并在主机验证前显式等待完成；这是正确性练习，不是重叠基准。

## 外部环境与权限

选定原生 Ubuntu 24.04 x86-64、CPython **3.12.14**、torch **2.11.0+cu128**、随包 runtime／CUPTI **12.8.90**、CUDA 元包 **12.8.1**、cuDNN **9.19.0.56**、随包 **nvidia-nccl-cu12 2.28.9**。复用 [SRC-CUDA-080](/sources-and-versions/#src-cuda-080) 的精确产物锁与仅 CPU 环境检查；参阅[安装／检查命令](https://github.com/xiangzhang-coding/cuda-learning-site/blob/main/scripts/pytorch-environment/README.md)。无需系统 Toolkit 或 nvcc。本 NCCL 与 EX24 的 2.31.2／Toolkit 13.3.1 路径独立。驱动须兼容所选 GPU 和 CUDA 12.8；本场景采用保守下限 **570.26**，不接受兼容性垫片替代。记录实际驱动，不只填写下限。

要求两张不同的完整 GPU，各 CC≥7.5、总显存≥8 GB、空闲≥1 GiB。可选 R=3–8 要有对应数量的合格设备。标量张量很小；CUDA 上下文、DDP 桶和 NCCL 分配另计，必须容纳。本配置是裸机原生 Linux；MIG、虚拟机、容器和多节点需要单独配置。需要访问选定 GPU、读取获授权的拓扑及 `/sys`、打开本地会合套接字、分配主机／共享内存、写私有日志的权限。管理员须确认 PCIe 对等路径及 IOMMU／ACS 策略适用；不要用修改机器安全设置来代替诊断。

保留[环境清单（Environment Manifest）](/start/environment-manifest/)：源码提交／哈希；精确 OS／内核／glibc／Python／venv 及全部 wheel URL／哈希；驱动、torch git／构建身份与**实际加载**的 CUDA／NCCL 库路径／哈希；`torch.cuda.nccl.version()`；rank→PID→可见序号→私有物理映射；GPU 数量／CC／总量／空闲显存；获授权的 `nvidia-smi -L`、`nvidia-smi topo -m` 及图例；权限和拒绝的查询；NCCL 配置文件／插件；相关环境变量；进程／流图；模型、FP64 输入／损失／优化器／步数／容差；命令、逐 rank 日志、退出状态及预期／已记录字段。将加载库与锁定产物比较。空白或未知字段是阻塞项，不是默认值。

## 运行两个有界正确性场景

先完成[实现练习](/multi-gpu/pytorch-ddp-nccl/exercises/)，再对照[参考解答](/assets/exercise-solutions/g07-ddp.py)。下载到全新私有工作目录，记录 SHA-256 和源码提交，将已检查环境的 Python 放在 PATH 中。下列命令假设恰有两张获授权设备可见；在**全新**私有运行目录中用 `--mode accumulate` 再执行一次：

```sh
timeout --signal=TERM --kill-after=10s 180s env \
  PYTORCH_ALLOC_CONF=backend:native NCCL_DEBUG=INFO \
  TORCH_DISTRIBUTED_DEBUG=OFF TORCH_NCCL_BLOCKING_WAIT=0 \
  TORCH_NCCL_ASYNC_ERROR_HANDLING=3 TORCH_NCCL_ENABLE_MONITORING=1 \
  TORCH_NCCL_HEARTBEAT_TIMEOUT_SEC=90 TORCH_NCCL_TRACE_BUFFER_SIZE=2000 \
  TORCH_NCCL_DUMP_ON_TIMEOUT=1 TORCH_NCCL_DEBUG_INFO_TEMP_FILE="$PWD/nccl-dump-" \
  python -m torch.distributed.run --standalone --nnodes=1 \
  --nproc-per-node=2 --max-restarts=0 --log-dir "$PWD/rank-logs" --redirects 3 \
  g07-ddp.py --mode baseline > launcher.log 2>&1
status=$?
```

立即随命令保留 `status`，不要通过管道让其他命令掩盖退出状态。`python -m torch.distributed.run` 是已检查解释器的 torchrun 入口。启动前清除冲突的旧别名、库搜索路径和未审查 NCCL 调优覆盖；保留白名单配置记录。不要倾倒整个 shell 环境，其中可能有凭据。

对**每种模式的每个 rank**，要求 ownership／initialized 记录、恰好两条步号对应的 `checked-step`、一条等于 `R*(R+1)` 的 `checked-stream` 结果、一条 `destroyed`，以及启动器零退出。FP64 梯度／权重要求有限值，容差 `atol=rtol=1e-12`；小整数标量集合通信要求精确相等。缺行、版本不符、超时或非零退出都不通过。仅 rank 0 的最后一行不足以验收。此处清单的已记录观察保持空；两个场景都没有在基准环境（Reference Environment）运行。

## 在期限内诊断最早失败

60 秒进程组超时、90 秒看门狗心跳阈值、180 秒外部期限覆盖不同失败路径，不能保证固定报错文字或精确终止时刻；外部监督器在 KILL 前另留 10 秒。NCCL 异步失败可能留下不完整数据，因此停止整个作业，诊断后再重新启动。不要在捕获异常后继续训练，也不要插入屏障来“修复”缺席 rank。

| 设置 | 选定含义与边界 |
| --- | --- |
| `NCCL_DEBUG=INFO` | 库初始化／传输诊断，不证明梯度正确 |
| `TORCH_NCCL_ASYNC_ERROR_HANDLING=3` | 看门狗错误时终止进程，不中止通信器；显式固定默认值 |
| `TORCH_NCCL_BLOCKING_WAIT=0` | 保留异步等待策略；设为 1 会改变主机等待／看门狗行为 |
| `TORCH_NCCL_TRACE_BUFFER_SIZE=2000`, `TORCH_NCCL_DUMP_ON_TIMEOUT=1` | 有界飞行记录器事件及转储请求，不保证产物一定生成 |
| `TORCH_NCCL_ENABLE_MONITORING=1`, `TORCH_NCCL_HEARTBEAT_TIMEOUT_SEC=90` | 监控停滞的看门狗，与集合通信超时不同 |
| `TORCH_DISTRIBUTED_DEBUG=DETAIL` | 可选独立诊断重跑，增加一致性检查／开销；不属于 OFF 基线 |

[原创合成 fixture](/assets/ddp-fixtures/g07-diagnosis.json) 提供逻辑记录，**不是 PyTorch／NCCL 日志**。D0 把两个 rank 分配给 device-A；D1 记录其他 rank 归约未完成前的 rank-1 输入异常；D2 的集合通信次数不同；D3 缺少 rank-1 证据。先比较所有权，再找最早局部错误和序列／形状／类型契约。rank 0 超时不代表根因在 rank 0。证据缺失意味着无法判定，不证明传输失败。

真实启动失败时，先验证 wheel／加载库身份、可见性、rank 数及会合配置，再依据 [NCCL 2.28.9 排障指南](https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2289/user-guide/docs/troubleshooting.html) 检查最早 rank 错误、获授权拓扑、共享内存／NUMA 可用性和设备权限。不能从 GPU 名称推断 NVLink、所选算法或性能。单节点 fixture 不需要集群网络诊断，也不要求故意执行不匹配集合通信。保留私有原始日志；分享派生文件前清理主机名、IP、路径、设备 UUID、总线 ID 和凭据，并保留私有映射。

## 销毁也是正确性的一部分

健康路径中，完成全部未完成工作、验证每个 rank，在每个工作进程退出前调用一次 `destroy_process_group()`。多组场景还需一致的销毁顺序。垃圾回收不是可靠的跨 rank 关闭协议。失败路径中，参考实现将异常传给启动器，由启动器终止其他工作进程；后端错误处理及外部监督器给停滞工作设限。它不在 `finally` 中进入新集合通信，看门狗也可能在 Python 清理前终止进程。即使销毁再次失败，仍保留最早错误。超时是失败运行，不是成功清理记录。

## 实践与证据边界

先完成[所有权、正确性与失败练习](/multi-gpu/pytorch-ddp-nccl/exercises/)，再看[独立解答](/multi-gpu/pytorch-ddp-nccl/solutions/)，接着做 [PB-R6-008](/practice/#pb-r6-008)、[PB-R6-009](/practice/#pb-r6-009)。CPU 代数和合成 fixture 检查不建立 DDP／NCCL 运行证据。G07 四个证据数组为空，外部场景保持**待硬件验证（Pending Hardware Verification）**。不设扩展性或加速验收门槛。

## 提取式自测

1. 为什么 LOCAL_RANK 不是物理设备身份？
2. 本版本的 `device_id` 如何改变 NCCL 初始化？
3. 何时各 rank 局部均值梯度的均值等于全体样本均值？
4. 为什么前向必须在 `no_sync` 内，微批次损失为什么要除以次数？
5. 在 Q 内调用 `work.wait()` 时，哪个流获得完成依赖？
6. 为什么 `record_stream` 能保护复用，却不能修复过早消费？
7. 为什么首先报告的超时不足以定位出错 rank？
8. 验收一次运行前，需要哪些逐 rank 记录和完成检查？

## 一手来源与许可

经当前 Context7 发现后，于 **2026-09-20** 复核。[SRC-CUDA-100](/sources-and-versions/#src-cuda-100) 将 API、启动器、归约器、后端、上游测试和失败配置绑定到精确文件。一手入口：[DDP API／源码](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py)、[ProcessGroupNCCL](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/csrc/distributed/c10d/ProcessGroupNCCL.cpp)、[NCCL 归档流语义](https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2289/user-guide/docs/usage/streams.html)。上游测试仅检查、未执行。正文、表格和合成工作表为原创 CC BY 4.0；原创可下载解答为 Apache-2.0。未复制上游代码、日志或图。
