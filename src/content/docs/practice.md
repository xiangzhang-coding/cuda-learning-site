---
title: 练习题库
description: 当前已发布的跨单元原创练习，包含先修链接、分层提示和解答。
pairId: practice-bank
counterpart: /en/practice/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - use
  - entry-pb-r0-001
  - entry-pb-r0-002
  - review
resourceKind: practice-bank
unitId: PB-R0
prerequisites:
  - O02
  - O03
relatedUnits:
  - O02
  - O03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: practice-bank }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'use,entry-pb-r0-001,entry-pb-r0-002,review' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: practice-bank }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: PB-R0 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: 'O02,O03' }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O02,O03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/practice/" lang="en">Read the English counterpart</a>

练习题库（Practice Bank）收录跨课程反复出现的原创问题。每个条目都说明先修学习单元（Learning Unit）、硬件门槛（Hardware gate）、验收条件、提示、解答和来源依据；它不是复制来的问答清单。

## 如何使用

先按条目的先修链接复习，再不看解答完成自己的产物。提示按层展开；解答用于复核边界，不替代作答。当前页面只发布下面两个完整条目，不用空白题目预告未来内容。

## PB-R0-001：修复证据状态（Evidence Status）记录

- **ID 与双语发布对（Publication Pair）：** PB-R0-001；位于 `practice-bank` Publication Pair。
- **类型与难度：** 核心心智模型；基础。
- **先修条件：** [O02：诚实记录证据状态](/start/evidence-status/)。
- **硬件门槛（Hardware gate）：** 无；只分析文本记录。
- **相关学习单元：** O02。
- **最后复核（Last reviewed）：** 2026-08-24。

**题目：** 一份发布说明写道：“Linux 构建因容器仓库超时而跳过。贡献者在自己的 GPU 上贴出 `PASS`，所以项目已经 Compile-Checked 和 Runtime-Verified。网页测试也证明浏览器演示可以算 CUDA 运行。”请重写成一条诚实记录。

**约束：**

- 只能使用 O02 的受控 Evidence Status。
- 不能虚构 manifest、构建日志、观察日期或维护者复现。
- 必须把预期观察和已记录观察分开。

**验收条件：**

- blocked build 没有 Compile-Checked。
- 社区 `PASS` 在缺少完整 Environment Manifest、日志、标准和日期时不能授予 Community-Observed。
- 维护者复现前不能授予 Runtime-Verified；若活动需要 GPU 行为，则保留 Pending Hardware Verification。
- 网页测试和浏览器模型不授予任何 CUDA Evidence Status。

<details><summary>提示 1</summary>逐句问“谁做了什么，留下了什么可复核材料”。</details>

<details><summary>提示 2</summary>blocked 不是 passed；一句 `PASS` 也不是完整社区报告。</details>

**解答：** “声明的编译工作因容器仓库超时而未执行，因此没有 Compile-Checked。社区提供了未经完整记录的 `PASS` 文本，缺少 manifest、日志、标准和日期，暂不能授予 Community-Observed。维护者没有在声明的 Reference Environment 中复现；如果验收要求 GPU 行为，运行轴保持 Pending Hardware Verification。网页质量测试只验证网站，不授予 CUDA 状态。预期输出与已记录观察均未形成合格记录。”

**常见错误：** 把 blocked 写成失败后仍授予状态；为了“尊重社区”而省略 manifest；把网页 CI 当成 CUDA 编译；删除 Pending Hardware Verification 却没有维护者证据。

**来源依据（Source basis）：** 本站 [O02](/start/evidence-status/) 的原创证据合同，以及 NVIDIA `nvcc` 13.3.1 [supported phases](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases)对编译和运行阶段的区分。

## PB-R0-002：补全 manifest 并修复支持边界

- **ID 与双语发布对：** PB-R0-002；位于 `practice-bank` Publication Pair。
- **类型与难度：** 调试与正确性；基础。
- **先修条件：** [O03：读懂环境清单（Environment Manifest）](/start/environment-manifest/)。
- **硬件门槛（Hardware gate）：** 无；使用假设记录，不运行 CUDA。
- **相关学习单元：** O03。
- **最后复核（Last reviewed）：** 2026-08-24。

**题目：** 一份记录只有“8 GB GPU、CUDA 12、WSL、kernel 0.2 ms”，并声称“属于完整层级，且本站支持这个环境”。列出必须补充的 manifest 字段，并修复两条结论。

**约束：**

- 不猜 GPU 型号、compute capability、driver、Toolkit patch 或测量方法。
- 正确性和性能字段都要覆盖，但 result 保持未观察。
- 只按 O03 的 Supported Environment 和 GPU Capability Tier 定义判断。

**验收条件：**

- manifest 分开 GPU identity、compute capability、GPU count、driver、Toolkit、component、NVCC、host compiler、OS、workload/shape、memory、permissions、exact command、correctness 和 observation date。
- 性能附录包含 baseline、hypothesis、clocks/power、warm-up、synchronization、timer/profiler version、statistics/sample method 和 interpretation boundaries。
- 结论说明 WSL 不是本站 Supported Environment；8 GB 本身不能决定 Modern Single-GPU Capability Tier。

<details><summary>提示 1</summary>先把“CUDA 12”拆成 Toolkit patch、driver 和相关 component versions。</details>

<details><summary>提示 2</summary>`0.2 ms` 没有同步、工具版本、样本和基线时不可解释。</details>

**解答：** 建立硬件、软件、工作负载、执行、正确性、日期和性能七组字段，所有未知值标成“待采集”并注明查询方法。把 `0.2 ms` 移到“未审核原始文字”，结果字段保持空。支持结论改为：“原生 Linux 是唯一 Supported Environment；WSL 只可作为非支持比较。”层级结论改为：“需要 compute capability 8.0 或更新、至少 8 GB，并同时满足 count、features 和 permissions，才能进入 Modern Single-GPU Capability Tier；现有记录无法判断。”

**常见错误：** 把“CUDA 12”当作完整软件坐标；用显存代替 compute capability；接受一个没有 synchronization 的延迟；把 NVIDIA 产品支持写成本站责任。

**来源依据（Source basis）：** 本站 [O03](/start/environment-manifest/) 的原创 manifest 和支持合同，以及 NVIDIA [CUDA Compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html)与 [compute capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)。

## 复核记录

两个条目及其英文对应内容在 **2026-08-24** 同步复核。所有情景、题目和解答均为项目原创；没有复制外部题目、输出、日志或性能数字，也没有执行 CUDA。
