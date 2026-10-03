---
title: 'H03 练习：预算复用与审查缓存证据'
description: 计算有界工作集，修复混入其他变量的缓存比较。
pairId: h03-exercises
counterpart: /en/architecture/ada-working-sets/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, budget, measurement, review]
resourceKind: exercise-set
unitId: H03-EXERCISES
prerequisites: [H03]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ada cache contracts', url: 'https://docs.nvidia.com/cuda/ada-tuning-guide/index.html#memory-system', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,budget,measurement,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H03 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/ada-working-sets/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修：[H03](/architecture/ada-working-sets/)。提交字节账本和测量协议。这些原创纸面练习（Exercise）无需 GPU；架构行为仍**待硬件验证（Pending Hardware Verification）**。核对日期 **2026-09-22**，[SRC-CUDA-105](/sources-and-versions/#src-cuda-105)。

## 练习 1：分配不等于驻留

**目标：**分析 H03 的 4／32／128 MiB 输入和同大小输出。假设 CC 8.9 GPU 报告 64 MiB L2、8 GB 显存，上下文建立后空闲 512 MiB。候选优化给 32 MiB 输入设置持久化窗口；设备允许 16 MiB 预留区和 64 MiB 最大窗口。

**约束：**保留精确 int32 拷贝语义、默认策略普通拷贝基线和 `compute_89` / `sm_89`。MiB 采用二进制单位，保留 256 MiB 非载荷余量。不能根据容量推断实际命中或耗时。无需集群／TMA。

**验收：**列出每个案例的分配与请求字节，计算载荷加余量是否可容纳。区分“仅输入能装入”与输入／输出同时驻留。解释 32 MiB 窗口下比例 1 与 0.5 分别请求什么、简单账本漏了哪些竞争流量，以及任务完成后怎样恢复默认策略。包含 MIG／MPS 条件失败时的动作和 CPU 按位校验。

<details><summary>提示 1</summary>把两个数组都算上，但不能把总和当作硬件缓存驻留定理。</details>
<details><summary>提示 2</summary>窗口与预留区有不同上限。获得持久化属性的比例不等于测量出的缓存命中比例。</details>

## 练习 2：修复因果结论

**目标：**审查以下合成提议：“设备 A 在无分析器情况下反复处理预热数据计时；设备 B 用默认内核重放并清理缓存，同时承担显示任务。B 报告较少 L2 命中，因此 A 所属产品代际更快。”没有提供合格运行报告。

**约束：**首次修复比较只用同一个 CC 8.9 设备、同一普通拷贝负载。保留 4／32／128 MiB 大小、相同且有记录的重复次数，检查全部输出，将默认策略与可选策略试验分开。不得编造数字或运行 GPU。

**验收：**指出至少四个未控制因素；给出冷／首遍与重复遍协议、事件边界、正确性、试验分布和独立计数器采集方案。说明计数器权限失败的结果、所需环境清单（Environment Manifest）字段，以及现有证据最多允许什么结论。解释为何即使正确测得跨设备差异，也不能独立归因于 L2 容量。

<details><summary>提示 1</summary>目前耗时与计数器对应不同执行和不同缓存历史。</details>
<details><summary>提示 2</summary>记录重放／缓存策略、显示／并发工作、时钟／功耗／温度、软件及完整计时边界。计数器访问被拒绝表示未知，不是零。</details>

## 独立复核

完成两题后再读[解答](/architecture/ada-working-sets/solutions/)，然后做[练习题库（Practice Bank）PB-R7-003](/practice/#pb-r7-003)。原创 CC BY 4.0；权利方来源保留原声明。不授予编译或运行证据。
