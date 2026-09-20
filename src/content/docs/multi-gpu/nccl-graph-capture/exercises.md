---
title: 'G08 练习：捕获代次与缓冲区所有权'
description: 修复集合捕获并设计显式生命周期账本，再考虑外部实现。
pairId: g08-exercises
counterpart: /en/multi-gpu/nccl-graph-capture/exercises/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, capture, lifetime, review]
resourceKind: exercise-set
unitId: G08-EXERCISES
prerequisites: [G08]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL CUDA Graph contract', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/cudagraph.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g08-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,capture,lifetime,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G08 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-graph-capture/exercises/" lang="en">Read the English counterpart</a>

## 先修条件与交付物

精确先修 **[G08]**：[捕获与注册契约](/multi-gpu/nccl-graph-capture/)。复核日期 2026-09-20；[SRC-CUDA-101](/sources-and-versions/#src-cuda-101)。先提交两份静态账本，无需 GPU。可选实现使用 G08 的原生 Linux 双进程／双 GPU 精确环境、180 秒作业截止时间及 10 秒终止宽限。捕获成功、注册效果与性能仍待硬件验证（Pending Hardware Verification）。

## 练习 1：修复捕获代次

**目标：**修复下列虚构时序，并为三次独立检查的重放（replay）制定外部实现方案。

| 阶段 | Rank 0 | Rank 1 |
| --- | --- | --- |
| A | 开始捕获；all-reduce | 普通 all-reduce |
| B | 同步捕获流；结束捕获 | 开始并结束另一次捕获 |
| C | 不检查返回图就实例化 | 实例化自己的图 |
| D | 重放三次 | 重放两次后返回 |

**约束：**两个不同 GPU，每进程／rank／GPU 一一对应；一个健康的阻塞通信器（communicator）；一个显式非阻塞流；默认混用／排序；不注册。捕获前分配相互独立、各含 4096 个 FP32 元素的发送／接收缓冲区。输入为 `r+1+k`，求和，捕获的消费者把输出乘二。生产者在捕获外、重放流上写输入。不得故意执行错误表格。

**验收条件：**给出匹配的捕获代次及重放账本；把完成检查移到捕获外；拒绝空图／错误图；要求每个 rank 的基线检查以及三次全元素有限／精确比较，推导预期值。处理即时 API 错误、异步错误、对端终止及外部截止时间。解释单 rank 重新捕获、跳过重放、主机指针重新赋值为何不能修复问题。静态方案可以通过，但不能声称执行过。可选实现必须具备完整环境清单（Environment Manifest）、每 rank 检查、成功清理及启动器零退出码。

<details><summary>提示 1</summary>rank 1 的普通操作能否作为 rank 0 捕获操作的匹配方？</details>
<details><summary>提示 2</summary>分开图定义、实例化、主机启动和设备完成；计算两个新输入之和的两倍。</details>

## 练习 2：谁能释放分配？

**目标：**修复生命周期方案：只注册 rank 0 的发送缓冲区，捕获、启动、销毁源图、注销本地句柄、释放两个分配，最后才等待另一流 Q 上的消费者。另审查一个独立的合格 NVLS 案例：rank 0 的发送／接收偏移为 `(0,4096)`，rank 1 为 `(1024,4096)`，单位字节。

**约束：**区分图管理注册与显式 `ncclCommRegister` 句柄，不能把两种所有权模型合成一个虚构句柄。本地注册案例使用 G08 获准的通用注册行与 `ncclMemAlloc`。NVLS 在独立 CC≥9.0／NVSwitch 配置有记录前只做纸面资格审查。分配须能容纳 N=4096 及这些偏移。不开启旧式注册、CFT、窗口／设备 API 或单边 RMA（one-sided RMA）。

**验收条件：**画出生产者 → 重放 → Q → 完成依赖，并列出可执行图／模板／克隆、本地句柄、缓冲区、通信器及流的释放账本。解释 rank 一致参与、两缓冲区注册和发送／接收各自的偏移匹配。分配或异步错误必须拒绝，不能称作回退。未注册基线与合格注册运行只有在工作量、完整计时边界和权限一致时才能比较；无真实证据时观察记录留空。

<details><summary>提示 1</summary>销毁一个模板不证明可执行图、克隆或消费者已停止使用存储。</details>
<details><summary>提示 2</summary>跨 rank 检查每个偏移相对于对应分配基址的位置，再区分自动图清理与显式注销。</details>

## 独立复核

完成两份账本后，再读[完整解答](/multi-gpu/nccl-graph-capture/solutions/)。将推理用于 [PB-R6-010](/practice/#pb-r6-010) 和 [PB-R6-011](/practice/#pb-r6-011)。这些是原创练习，不是上游测试副本。
