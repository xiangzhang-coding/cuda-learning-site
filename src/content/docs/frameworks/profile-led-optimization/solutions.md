---
title: 'P11 独立参考解答'
description: 解释计时边界，推导保留合同的候选，不声称已获得加速。
pairId: p11-solutions
counterpart: /en/frameworks/profile-led-optimization/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [review, diagnosis, implementation, transfer]
resourceKind: solution-set
unitId: P11-SOLUTIONS
prerequisites: [P11-EXERCISES]
relatedUnits: [P11]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p11-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/profile-led-optimization/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,diagnosis,implementation,transfer' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P11-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P11-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: P11 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/profile-led-optimization/solutions/" lang="en">Read the English counterpart</a>

## 复核你的尝试

先尝试[两道练习](/frameworks/profile-led-optimization/exercises/)。以下是推理解答，不是运行输出。

## 解答 1：计时边界

两倍加速声明没有依据。已知：范围和预热不同。未知：设备完成时间、实际二进制、环境与正确性。错误推断：主机提交区间更短就表示 GPU 工作更少。两种实现各预热 20 次，等待已有工作，采集七组每组 100 次的无分析器事件样本，同步结束事件并保留全部样本。用同一调度独立采集诊断轨迹。比较同样包含分配的前向范围，三轮交替进程顺序，并记录源码/wheel/实际加载扩展标识。缺少 GPU 事件仍是轨迹阻塞。

## 解答 2：改变几何但不漂移语义

将启动参数对改为 `(count+127)/128,128`。n=128,129,130,258 对应输出数 `[127,128,129,257]`，线程块数 `[1,1,2,3]`。保留零计数提前返回和逐线程边界检查。把这些边界加入数值与非均匀梯度测试；保留带偏移连续视图和非法输入用例。重跑 gradcheck、gradgradcheck、opcheck、meta/fake、动态编译前向/反向和非默认流测试，以及双路径构建与隔离 wheel 导入。取整公式证明覆盖，不证明性能。测量无法证实符合预先策略的收益时，保留原 256 线程 wheel。

## 迁移推理

[PB-R5-011](/practice/#pb-r5-011) 追问前向调优能否改善反向占主导的应用。[P11](/frameworks/profile-led-optimization/) 和 [SRC-CUDA-086](/sources-and-versions/#src-cuda-086) 保留 2026-09-13 来源边界。解答不升级硬件证据。
