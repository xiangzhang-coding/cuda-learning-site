---
title: 'G08 解答：对齐参与和最后一次使用'
description: 完整推导捕获、重放、失效和注册生命周期，并列出替代方案与错误分析。
pairId: g08-solutions
counterpart: /en/multi-gpu/nccl-graph-capture/solutions/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, capture, lifetime, alternatives, mistakes, evidence]
resourceKind: solution-set
unitId: G08-SOLUTIONS
prerequisites: [G08-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL CUDA Graph contract', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/cudagraph.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g08-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,capture,lifetime,alternatives,mistakes,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G08-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-graph-capture/solutions/" lang="en">Read the English counterpart</a>

## 先修条件与阅读顺序

精确先修 **[G08-EXERCISES]**：先完成[两份账本](/multi-gpu/nccl-graph-capture/exercises/)。这些原创解答遵循 [G08 契约](/multi-gpu/nccl-graph-capture/)及 2026-09-20 复核的 [SRC-CUDA-101](/sources-and-versions/#src-cuda-101)。这里不声称有参考实现或 GPU 结果；外部场景仍待硬件验证（Pending Hardware Verification）。

## 解答 1：一次集合捕获，三次匹配重放

两个进程在捕获外初始化各自不同的设备、通信器（communicator）、显式流和分离缓冲区，先完成并检查相同的普通工作量。然后各 rank 开启线程局部捕获（capture），记录匹配的 all-reduce 及乘二消费者，在源流／源线程结束，捕获内没有完成查询。只有成功、非空的图才实例化。主机／输入生产者仍在捕获外，每次启动前在该流写入输入。

| k | rank 0 输入 | rank 1 输入 | 归约值 | 消费者输出 |
| --- | --- | --- | --- | --- |
| 0 | 1 | 2 | 3 | 6 |
| 1 | 2 | 3 | 5 | 10 |
| 2 | 3 | 4 | 7 | 14 |

这些是由 `2*((1+k)+(2+k))` 推导的可精确表示的小 FP32 整数，4096 个元素的预期值相同。每个 k，各 rank 都启动源自代次 A 的自身可执行图。检查即时启动状态、有界异步通信器／流完成及主机下载完成，然后比较全部元素并保留各 rank 记录。下一次写入在前一轮消费完成后进行；启动成功本身不允许覆盖。180 秒外部监督器及 10 秒终止宽限覆盖阻塞主机调用；缺 rank 证据或启动器非零退出码均失败。

若捕获失效，保留第一处错误，在源流结束捕获，拒绝空图／错误图并停止所有 rank 的作业，绝不能让对端进入重放（replay）。地址或形状变化按本练习保守契约先排空再协调重新捕获。主机变量重新赋值不能改变旧可执行图。健康路径的最终完成先于可执行图／模板清理、缓冲区释放及通信器／流清理。

## 解答 2：按最后一次使用释放，不按主机返回释放

先拒绝只注册 rank 0 发送缓冲区的方案。获准的本地注册（local registration）实验中，各 rank 在使用前用自己的通信器注册两个 `ncclMemAlloc` 分配，保留返回的本地句柄。不能把图管理的内部注册交给 `ncclCommDeregister`。

若生产者在 P、重放在 C，则生产后记录 ready，C 在启动前等待；C 在启动后记录 done，Q 在消费前等待；释放资源前观察 Q 完成。如果生产本来就在 C，则流内顺序提供第一条边。发送、接收、主机暂存、通信器及注册须跨三次重放和 Q 的最后一次使用保持存活。

健康保守释放顺序为：全部最后使用完成 → 销毁所有可执行图 → 销毁模板／克隆 → 在原通信器注销全部显式本地句柄 → 用 `ncclMemFree` 释放分配 → 销毁健康通信器 → 销毁流／事件。图管理注册不做显式注销：NCCL 将清理绑定到图持有的引用，仅销毁源模板不够。释放错误保留第一处失败并阻止验收，不能把部分清理写成全部成功。

独立 NVLS 偏移方案失败，因为跨 rank 的发送偏移 0 和 1024 不同；接收偏移已经都是 4096。可将两边均改成 `(0,4096)`，分离的分配必须覆盖这些范围：每个发送分配至少 16,384 字节，每个接收分配至少 20,480 字节，再计分配粒度。发送与接收偏移不必相等。偏移相同不证明 NVSwitch 可用、分配合格或实际使用了注册。

## 合理替代方案

如果图初始化无法摊销，或不满足注册资格，可以保留普通未注册集合通信。串行重放可每轮显式完成；流水线替代方案必须使用独立槽，并证明每槽最后消费者已完成，超出本练习范围。单进程多 GPU 启动器需要独立线程／排序复核；仅使用分组不能消除阻塞图启动死锁。通用图更新和自定义分配器需要另做精确 API 复核。

## 常见错误答案

“图已启动，所以现在释放”混淆提交和完成。“销毁模板就立即注销全部注册”忽略可执行图／克隆引用。“关闭混用仍可同流普通提交”忽略主机启动到设备完成的未完成区间。“注册返回成功，所以已证明零拷贝”忽略传输选择和 PXN。“NVLS=2 能承受任何分配错误”违背选定 2.31.2 的行为。恢复屏障不能修复这些错误。

## 证据边界

表格是数学／静态推理，不是观察输出、日志、注册效果或性能。真实实现需要 G08 精确环境、每 rank 的基线及 6／10／14 重放检查、完整清单及清理记录。可选注册行要求独立资格与测量权限。CFT、设备 API、单边 RMA（one-sided RMA）和新 NVLS 路径仍在新特性观察（Emerging Feature Watch）。四组证据数组为空，外部场景仍待硬件验证（Pending Hardware Verification）。
