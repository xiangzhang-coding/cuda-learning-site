---
title: T08 综合练习
description: 从固定契约实现注意力，提交数值、IO、框架与性能分析证据。
pairId: t08-exercises
counterpart: /en/triton/attention-capstone/exercises/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, goal, constraints, stages, acceptance, hints, evidence, solution]
resourceKind: exercise-set
unitId: T08-EXERCISES
prerequisites: [T08]
relatedUnits: [VIS18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton attention source and tests', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/tutorials/06-fused-attention.py', version: '3.7.1', platform: 'Reference-only architecture-gated owner tutorial', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t08-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/attention-capstone/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,goal,constraints,stages,acceptance,hints,evidence,solution' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T08 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: VIS18 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/attention-capstone/exercises/" lang="en">Read the English counterpart</a>

## 先修

精确先修 **[T08]**：[融合注意力综合学习单元](/triton/attention-capstone/)。核查于 2026-09-15；[SRC-CUDA-092](/sources-and-versions/#src-cuda-092)。书面推导无需 GPU；外部运行继承 T08 全部软件/硬件门槛。

## 目标

在 `scripts/attention-capstone/` 的学习者副本中编写自己的 `attention_forward` 与 eager `attention` 适配器。保持独立参考和验收采集器不变；仅以你的实现替换解答内核模块，保留函数名/签名，让 `check.py` 检查你的工作。不要先打开独立解答。提交推导、可工作源码、正确性结果、IO 账本和有边界的框架/性能报告。

## 约束

保持 T08 的连续 FP16 `(B,H,N,D)` 契约：B/H 1..2，N 1..128，D 16/32/64，有限且绝对值 ≤4，固定缩放，零 dropout，因果/非因果前向。拒绝梯度和不支持的输入。初次提交使用 BM=16、BN=32、四个 warp、两个阶段；不分配全局 S/P，不做全局同步、自动调优、TMA 或生产 API 扩展。状态用 FP32，概率/值点积操作数用 FP16。阅读无硬件门槛，设备验收需要原生 Linux 和声明的单 GPU 环境。

## 分阶段任务

1. **契约：** 写内核前先列出允许/拒绝输入和逐元素容差。解释为什么每个因果行分区质量非零。
2. **递推：** 推导 m/l/a 合并并证明实数等价。手算一个跨两块的行，第二块最大值更大。区分舍入与实数等价。
3. **分块：** 画 Q/K/P/V 形状与指针偏移，证明输出唯一所有权，再实现掩码循环和适配器。分别解释查询尾部与键尾部。
4. **正确性：** 运行主机测试、固定环境 CPU 框架检查与显式 SM80 编译。在合格硬件上运行全部混合/均匀/极端输入与两种掩码，检查输入和尾部保护区不变；失败时先调查再继续。
5. **框架：** 固定缩放/dropout，对照独立参考与强制 MATH/FLASH 输出。记录不支持后端诊断和梯度拒绝。不把两个 GPU 输出相同视为独立参考。
6. **性能分析：** 复现合成账本 28672 B 与 6144 B，解释 VIS18 位宽差异，再提出一个固定形状假设。区分含分配的前向计时与过滤后的计数器采集，报告全部轮次，包括回退。
7. **证据审查：** 附完整环境清单（Environment Manifest）、原始日志和逐案例决定。缺硬件或权限时，提交完成的主机/编译工作与明确待完成的运行部分，不伪造结果。

## 验收清单

- 覆盖全部七个阶段，源码与报告中可见精确契约和错误处理。
- 不存储完整 N×N S/P；两个运行状态项都重缩放，先屏蔽分数再归一化。
- 主机测试和 CPU FP64 SDPA 检查通过；30 个编译特化都产生五类产物。这些结果不是 GPU 执行。
- 运行验收需要全部 30 个形状/输入/掩码案例，输出有限且满足 `atol=0.02,rtol=0.01`，输入/保护区不变，MATH 输出对照成功，FLASH 输出对照或保留 unavailable-or-failed 诊断。任何数值不匹配都阻止验收。
- 计时前全部正确性通过。三轮交替顺序保留所有样本，计时后输出再次通过。性能可以更慢或不确定。
- 声称运行已验证（Runtime-Verified）需要完整清单与合格基准环境记录。缺少时保持 **待硬件验证（Pending Hardware Verification）**，分别说明主机/编译完成与运行完成情况。
- 维护文字/源码归属与发布事实；不复制教程结果，不暗示未声明的梯度/库支持。

## 分层提示

<details><summary>提示一：状态不变量</summary>

处理一个键前缀后，l 是相对于 m 的指数和，a 是使用同一尺度的未归一化 V 加权和。下一个最大值改变所有旧贡献的尺度。

</details>

<details><summary>提示二：掩码与形状</summary>

分数块有 BM 行、BN 列。键尾部掩码沿行广播，因果有效性还要求键索引 ≤ 查询索引。K 为零仍然产生有限分数，除非把该分数改为负无穷。

</details>

<details><summary>提示三：字节与框架</summary>

Q/O 只计一次，每个查询块都计一次 K/V。它们每元素两字节，假设完整 S/P 每元素四字节。强制 SDPA 调用保持零 dropout 和相同缩放，检查后端列表只有一个元素。

</details>

<details><summary>提示四：解释结果</summary>

耗时变化不能确认内存流量是原因。缺计数器权限就是缺观察。CPU 通过、生成 cubin 或漂亮的字节比值都不能填补这一缺口。

</details>

## 必交证据

附源码差异/提交与哈希、推导、无效输入表、案例覆盖、逐元素误差策略、测试命令/退出、编译产物哈希、原始运行/基准报告、警告/失败、原创 IO 计算、分析器过滤器/指标/权限与 T08 完整清单。原始机器路径和敏感追踪不进入部署，仅发布经过审查、带保管链的脱敏衍生物。分别标注实测、推导、提议和缺失信息。

## 独立解答

提交尝试后再看[复核解答与常见错误](/triton/attention-capstone/solutions/)。数学等价递推或更严格验证可以有效；改变类型、掩码语义或测量边界需要单独审核契约。
