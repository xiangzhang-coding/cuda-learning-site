---
title: 'H05 练习：目标集合与安全回退'
description: 审查有方向的目标集合，并拒绝缺少依据的精度变化。
pairId: h05-exercises
counterpart: /en/architecture/blackwell-families/exercises/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, targets, fallback, review]
resourceKind: exercise-set
unitId: H05-EXERCISES
prerequisites: [H05]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA capability scopes', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,targets,fallback,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H05 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/blackwell-families/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修：[H05](/architecture/blackwell-families/)。提交两份纸面账本。这些练习（Exercise）无需硬件；执行仍**待硬件验证（Pending Hardware Verification）**。来源核对日期 2026-10-04：[SRC-CUDA-107](/sources-and-versions/#src-cuda-107)。

## 练习一：有方向的目标集合

**目标：**将 100a、100f、103f、110f、120f、121f 映射到 10.0、10.3、10.7、11.0、12.0、12.1 设备。某开发者假设全部 `f` 镜像可用于主 CC ≥10 的所有设备。

**约束：**使用当前文档集合，另行应用 EX25 的 Toolkit 13.3.1 配置。不要虚构该通道中的 107 构建，也不要混淆 cubin 与 PTX 的兼容性。

**验收：**给出六乘六准入矩阵，列出至少三个反例，说明为什么文档中的 10.7 兼容性不能授权 EX25 准入。指定普通回退及驱动／PTX 版本门槛。

<details><summary>提示一</summary>家族集合有方向，103f 不是 100f 的另一种写法。</details>
<details><summary>提示二</summary>把文档兼容性、编译器接受的目标、项目已核对的运行集合放在三列。</details>

## 练习二：精度不是回退开关

**目标：**修正这一提案：把 100a FP64 Tensor Core 内核的后缀改为 120f，并把输入替换成 FP4，从而在 CC 12.1 上运行。

**约束：**调用者要求原 FP64 数值契约，没有 GPU 结果。选择普通 FP64 SIMT 或经过明确复核的库替代路径，不默认降低精度。

**验收：**指出目标和数据类型两个层面的错误；规定等价输入／输出、容差及异常值策略、独立参考检查、精确构建产物，以及性能比较前需要的证据。无法建立等价时拒绝修改。

<details><summary>提示一</summary>FP64 算术与原生 FP64 Tensor Core 输入支持是两回事。</details>
<details><summary>提示二</summary>格式可用既不能建立应用误差预算，也不能证明加速。</details>

## 独立复核

尝试两题后阅读[解答](/architecture/blackwell-families/solutions/)及 [PB-R7-005](/practice/#pb-r7-005)。原创 CC BY 4.0；权利方文档保留其声明。
