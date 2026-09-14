---
title: 'T05 练习：保留搜索并拒绝虚假优胜者'
description: 实现配置记录，修复冷调用比较。
pairId: t05-exercises
counterpart: /en/triton/autotuning/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T05-EXERCISES
prerequisites: [T05]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton autotuner', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/runtime/autotuner.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/autotuning/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T05 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/autotuning/exercises/" lang="en">Read the English counterpart</a>

## 前置与说明

精确前置 **[T05]**：[自动调优](/triton/autotuning/)。在 [LAB16](/labs/autotune-triton-gemm/) 学习者副本中按精确门禁完成练习（Exercise）。证据数组为空。核查于 2026-09-14；[SRC-CUDA-089](/sources-and-versions/#src-cuda-089)。

## 练习 1：实现可审查的搜索

**目标：**实现 `do_bench(fn, quantiles)` 回调，保留全部样本、返回中位数目标，并连同完整形状/设备背景记录选中 Config。

**约束：**使用实验四个候选及 M/N/K 键；无剪枝或磁盘选择缓存；启动时不重复元参数。全部候选先通过正确性，再搜索。未完成/非有限测量必须失败，不能消失。

**验收：**保留候选顺序、全部原始样本、目标、选中元数据，以及独立编译/搜索/缓存命中/预热/稳态记录。相同键重复调用不新增候选测量。独立重算选择，并再次验证选中输出。提交实际报告或精确执行阻塞。

<details><summary>提示 1：回调返回值不等于报告</summary>返回标量供选择，同时追加包含原始数据的结构化记录。不要把保留报告压缩成一个最小值。</details>
<details><summary>提示 2：在边界明确失败</summary>检查预期候选数、有限正样本，以及选中 Config 的归属/目标。新调优器隔离形状；直接启动选中 JIT 配置把搜索排除在稳态计时之外。</details>

## 练习 2：修复冷调用结论

**目标：**审查假设报告：“首次自动调优调用 40 ms，原生 0.1 ms，所以 Triton 慢 400 倍。缓存命中证明 GPU 数据热态。选中块在所有设备上都获胜。”这些是虚构教学输入，不是观察。

**约束：**不捏造替代测量。保留一次性成本而非删除它；保留逐形状结果和精确环境要求。

**验收：**区分算术比与公平稳态比，指出四种缓存，提出输出匹配、三轮的分阶段重跑，列出环境清单坐标，并声明缺少硬件或差异不明确时的处理办法。

<details><summary>提示 1：先问秒表包括什么</summary>首次调用可能编译并测量多个候选；原生时间必须范围相同，比值才有解释意义。</details>
<details><summary>提示 2：区分选择复用与数据复用</summary>JIT 产物、内存选择、磁盘选择与 GPU 数据是不同缓存。它们都不能替代时钟、负载、设备身份或正确性记录。</details>

## 单独复核

尝试两题后再打开[解答](/triton/autotuning/solutions/)。[PB-R5-018](/practice/#pb-r5-018) 追问相同键的选择能否带到第二块 GPU。
