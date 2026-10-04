---
title: 'H06 解答：准入、完成，再比较'
description: 给出分派决策和单到达者批量拷贝完成证明。
pairId: h06-solutions
counterpart: /en/architecture/portable-specialization/solutions/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, dispatch, comparison, evidence]
resourceKind: solution-set
unitId: H06-SOLUTIONS
prerequisites: [H06-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'PTX bulk copy', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,dispatch,comparison,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/portable-specialization/solutions/" lang="en">Read the English counterpart</a>

## 先修

先尝试 [H06 练习（Exercise）](/architecture/portable-specialization/exercises/)，再阅读原创解答。

## 分派决策

| 模式 | 100f 构建／CC 10.3 | 100f 构建／CC 12.1 |
| --- | --- | --- |
| portable | 仅基线 | 仅基线 |
| auto | 基线再特化 | 仅基线 |
| specialized | 基线再特化 | 启动前拒绝 |
| 非法 | 拒绝 | 拒绝 |

启动失败既不是资格不匹配，也不是特化成功。停止并保留错误；复用损坏上下文会让后续结果失去意义。测试未知 CC（如 130）、跨家族 CC（120）、仅含 portable 的构建和非法模式。主机测试建立决策及 oracle 行为，不能证明镜像加载、GPU 同步或正确性。实际 CUDA 调用仍需检查完成。

## 完成等量工作

只有提交者到达，因此对齐屏障初始化为**一次到达**。仅登记一次 1024 预期字节，向异步代理发布初始化并提交对齐批量拷贝。等待第零阶段的到达和传输计数都完成，再用块屏障发布。所有消费者读取，最终块屏障结束读取，再由提交者使事务屏障失效。初始化为 128 次到达但只有一个到达者，屏障无法完成。

在同一流中用 event 测量完整加载／消费内核：两条路径均五次预热，十个各含 100 次启动的样本。计时前后独立检查全部输出与保护区。记录原始批次毫秒、负载、目标和执行顺序；没有计数器权限表示未测量，不是零。复用缓冲区的流水线增加了阶段及读取／复用依赖，本单阶段证明不覆盖这些变化。

## 证据与权利

预期观察可以描述载荷匹配、保护区完整。合格执行提供日志与环境清单（Environment Manifest）之前，已记录观察为空，运行与性能仍**待硬件验证（Pending Hardware Verification）**。核对日期 2026-10-04：[SRC-CUDA-108](/sources-and-versions/#src-cuda-108)。原创 CC BY 4.0；权利方引用保留原声明。
