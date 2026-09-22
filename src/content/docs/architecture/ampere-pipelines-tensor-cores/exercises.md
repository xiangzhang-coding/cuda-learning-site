---
title: 'H02 练习：审查阶段与功能门槛'
description: 修复过早复用缓冲区，并拒绝无效的拷贝及 Tensor Core 方案。
pairId: h02-exercises
counterpart: /en/architecture/ampere-pipelines-tensor-cores/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, pipeline, gating, review]
resourceKind: exercise-set
unitId: H02-EXERCISES
prerequisites: [H02]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ampere capability contracts', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,pipeline,gating,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H02 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/ampere-pipelines-tensor-cores/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修：[H02](/architecture/ampere-pipelines-tensor-cores/)。提交所有权／阶段账本和资格表。原创纸面样例无需 GPU；核对日期 **2026-09-22**，见 [SRC-CUDA-104](/sources-and-versions/#src-cuda-104)。外部行为仍待硬件验证（Pending Hardware Verification）。

## 练习 1：修复跨线程消费

**目标：**保留 H02 的三个 FP32 分块，每块 256 元素，使用两个共享槽位。块内 256 个线程全部存活，每个通过线程作用域流水线（Pipeline）发出自己的 4 B 拷贝。每线程消费下一个线程的元素，索引对 256 取模。方案只等待本线程拷贝，读取邻居，释放自己的阶段，随即用分块 2 覆盖该槽位。

**约束：**先描述普通拷贝基线，再修复异步路径。预填充、消费和排空时保留全部参与者，包括尾部。不能假定时序、增加缓冲或执行设备代码。记录全局 6144 B、共享缓冲 2048 B 预算，并单独计算同步状态存储。

**验收：**解释缺失的两条跨线程顺序边；给拷贝完成、块级发布、邻居读取、块级复用屏障、释放和下一次获取排序。说明每个槽位的分块，以及排空时最后一次等待如何变化。解释为什么只有 `arrive()` 不能授权消费，以及为什么即使内存范围有效，分歧的 commit/arrive-on 仍需审查参与规则。

<details><summary>提示 1</summary>某个线程的 wait 只回答自己的拷贝完成问题。谁保证邻居也走到这里？</details>
<details><summary>提示 2</summary>同时跟踪“可读取”与“可覆盖”。队列中有两个阶段时，等待最旧阶段可保留一个较新阶段；最后一个分块必须等待至较新阶段数为零。</details>

## 练习 2：检查每项条件，而不只是 CC

**目标：**在一块 CC 8.6、8 GB 的设备上审查四条路径。拟议构建为 H02 的原生 Linux／C++17／Toolkit 13.3.1 配置，使用匹配的 `compute_86` / `sm_86` 目标。

| 方案 | 声明条件 |
| --- | --- |
| A | 从对齐 FP32 数组的 `base+1` 拷贝 1024 B，断言 16 B 对齐；目标是对齐共享内存 |
| B | 因 `CC >= 8.0` 而选择原生 FP64 Tensor Core |
| C | BF16 WMMA、FP32 累加／输出、完整对齐分块；部分通道在 `mma_sync` 前返回 |
| D | 调用方要求普通 FP32 乘数且拒绝低精度输入转换，却选择 TF32 WMMA |

**约束：**保留设备、调用方数值要求及声明字节范围。不能按产品名判断，不能由 API 可用性自动推导成功。不执行任何方案。

**验收：**按具体失败条件拒绝各方案，选择显式普通拷贝或 SIMT 回退，说明回退保留或改变了哪些数据类型／精度契约。解释改为 CC 8.0 为何会改变 B 的原生硬件门槛，却不会修复 A、C、D。列出宣称架构行为或性能前仍需取得的构建／产物、正确性、消毒器及测量记录。

<details><summary>提示 1</summary>float 指针前进一项，字节地址增加四。编译器承诺不是分配器。</details>
<details><summary>提示 2</summary>分别检查原生 FP64、完整线程束（Warp）参与及调用方接受的精度。设备满足 API 目标仍可能不满足所选契约。</details>

## 独立复核

完成两次尝试后比较[参考解答](/architecture/ampere-pipelines-tensor-cores/solutions/)，再做[练习题库（Practice Bank）PB-R7-002](/practice/#pb-r7-002)。练习为原创 CC BY 4.0。权利方文档保留各自声明；没有提供已观察的 CUDA 证据。
