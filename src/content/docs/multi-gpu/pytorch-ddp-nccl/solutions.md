---
title: 'G07 解答：对齐所有权、算术与证据'
description: DDP 练习的独立梯度推导与有界诊断判断。
pairId: g07-solutions
counterpart: /en/multi-gpu/pytorch-ddp-nccl/solutions/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, ownership, correctness, diagnosis, review]
resourceKind: solution-set
unitId: G07-SOLUTIONS
prerequisites: [G07-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Pinned DDP API', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py', version: '2.11.0+cu128', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g07-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/pytorch-ddp-nccl/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,ownership,correctness,diagnosis,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G07-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/pytorch-ddp-nccl/solutions/" lang="en">Read the English counterpart</a>

## 先修与证据边界

先尝试 **[G07-EXERCISES]**：[练习](/multi-gpu/pytorch-ddp-nccl/exercises/)。2026-09-20 复核；[SRC-CUDA-100](/sources-and-versions/#src-cuda-100)。下列答案是静态证明。[原创 Python 参考实现](/assets/exercise-solutions/g07-ddp.py) 仅在 G07 外部环境执行，仍为**待硬件验证（Pending Hardware Verification）**。仅 CPU 的参考公式测试不导入 torch，也不建立分布式运行证据。

## 解答 1：连接真实所有者与消费者

共享可见列表中，进程 0 使用可见序号 0→物理 2；进程 1 使用序号 1→物理 5。分配前选择本地设备，以同一带索引设备初始化默认 NCCL 进程组（Process Group），把模型／输入放在那里，用单元素 `device_ids` 包装。记录全局／本地 rank，私下核对物理身份。这里传全局 rank 恰好可用，但不能据此定义一般的本地设备映射。

生产者 P 写 payload；C 在提交异步集合通信前等待 P；ProcessGroupNCCL 把 C 连接到其 NCCL 流。在 Q 内先调用 `work.wait()`，再消费。持有 payload、work、result 到 Q 完成；参考实现还登记 Q 对 payload 的使用。只有 `consumer.synchronize()` 成功后，主机才能比较和释放。P 是 payload 的分配来源；C、Q 是使用者，不是新的来源。后端提供的分配器安全覆盖后端工作，不覆盖应用任意冲突写入。

**有效替代方案：** 在正确位置加入主机完成等待，再提交或消费，可建立更强依赖，但更串行。对这个有限使用图，持有全部引用直到完成可替代显式生命周期登记。两种方案都不允许覆盖仍在使用的张量。**常见错误：** 在重映射可见列表下传入物理序号；在 C 上 `wait()` 后让无关 Q 读取；只 `record_stream` 却没有生产者依赖。

## 解答 2：推导而不是复制输出

令 `a=mean_r((r+1)^2)=(R+1)*(2*R+1)/6`，梯度为 `g=w*a`，一次 SGD 更新为 `w_next=w*(1-a/8)`。累积模式中，`a=mean_r(((r+1)^2+(r+2)^2)/2)`。两个微批次（Microbatch）损失都除以 2，再跨 rank 平均，才实现此公式。执行两次优化器更新或额外全归约梯度都会改变更新。

| R=2 模式 | 步号 | 预期梯度 | 预期更新后权重 |
| --- | --- | --- | --- |
| baseline | 0 | 2.5 | 0.6875 |
| baseline | 1 | 1.71875 | 0.47265625 |
| accumulate | 0 | 4.5 | 0.4375 |
| accumulate | 1 | 1.96875 | 0.19140625 |

这些是代数值，不是日志。R=3 基线中，`a=14/3`，首次权重 `5/12`，第二次梯度 `35/18`，第二次权重 `25/144`；这个非二进制分数案例说明容差的作用。独立集合通信中，各 rank 提供 `r+1`，总和为 `R*(R+1)/2`，在 Q 上乘以 2 得到 `R*(R+1)`；这些 FP64 小整数可以精确表示。这不是再次归约 DDP 梯度。

[参考实现](/assets/exercise-solutions/g07-ddp.py) 的每个健康工作进程验证 torch／源码／NCCL／设备／分配器门槛，采用 60 秒进程组超时，初始化 DDP，检查两次已完成更新，检查标量流链，销毁进程组，然后才输出 `destroyed`。启动器保留各 rank 的 stdout／stderr，失败时非零退出。异常直接传播，不进入错误路径屏障。即使其他数值通过，缺少进程、结果或零退出仍不能通过完整性检查。

**有效替代方案：** 用有理数独立计算系数，再扩大到 FP64 比较。不同模型适合扩展练习，但不满足本固定工作负载的参考公式。**常见错误：** 忘记微批次除数，只把反向放进 `no_sync`，在微批次之间清空梯度，接受一致却错误的副本，或用无界启动替代 G07 命令。两种模式执行前都要完成环境清单（Environment Manifest）及库／拓扑审查。本参考实现不带来损失曲线、吞吐或扩展性结论。

## 解答 3：保留不确定性和最早失败

| 案例 | 有依据的分类 | 首要行动及边界 |
| --- | --- | --- |
| D0 | duplicate-device | 运行前修复独占设备映射；不能预测精确 NCCL 报错 |
| D1 | earlier-rank-failure | 检查 rank-1 输入异常；rank-0 等待是下游表现，不证明链路损坏 |
| D2 | sequence-mismatch | 对齐步数／同步次数；给出的归约序列不匹配 |
| D3 | insufficient-evidence | 请求缺失的 rank-1 记录和启动器状态；不能诊断传输 |

[fixture](/assets/ddp-fixtures/g07-diagnosis.json) 的 `captured=false`，已记录观察为空。即使给定序列匹配，也不证明真实运行正确：张量数量／类型、流依赖、算术、权限和终止都需要证据。删掉 D1 的更早异常后，只能判断序列不匹配，不能断定该具体根因。这种反事实检查能防止把所有超时归为同一诊断。

60 秒组超时针对进程组操作；90 秒心跳阈值监控卡住的看门狗；180 秒外部监督器还覆盖这些机制之外的挂起，另有 10 秒 KILL 宽限。这些值是策略期限，不是实测失败延迟。保留最早异常、其他进程日志及最终状态；请求的飞行记录器转储可能不存在。异步失败后停止作业。所有 rank 在成功路径调用 `destroy_process_group()`，与假设看门狗终止后 Python `finally` 总会执行，是不同的事。

保留私有原始文件及哈希。分享另行审查的派生文件：一致替换主机名、IP、路径、UUID、总线 ID，移除凭据，保留 rank／序列／错误关系；替换映射留在私有存储。**有效替代方案：** 没权限或硬件时，提交明确阻塞项及空观察的清单，不编造成功。**常见错误：** 其他进程已失败后调用屏障，暗中更改环境重试，把 INFO 输出当正确性，或声称 D3 证明拓扑故障。

## 返回与迁移

返回 [G07](/multi-gpu/pytorch-ddp-nccl/)、[PB-R6-008](/practice/#pb-r6-008)、[PB-R6-009](/practice/#pb-r6-009)。[固定 DDP API](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py) 及来源记录支撑这些契约。原创解答／工作表为 CC BY 4.0，原创 Python 解答为 Apache-2.0；没有导入上游实现或采集日志。
