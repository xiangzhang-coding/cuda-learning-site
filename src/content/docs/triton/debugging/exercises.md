---
title: 'T06 练习：信任工具之前先调试合同'
description: 修复有界尾部缺陷，设计可辩护的诊断记录。
pairId: t06-exercises
counterpart: /en/triton/debugging/exercises/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T06-EXERCISES
prerequisites: [T06]
relatedUnits: [EX23]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton debugging guide', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/docs/programming-guide/chapter-3/debugging.rst', version: '3.7.1', platform: 'Interpreter and CUDA', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/debugging/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T06 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX23 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/debugging/exercises/" lang="en">Read the English counterpart</a>

## 先修与作答方式

精确先修 **[T06]**：[调试](/triton/debugging/)。执行使用该单元锁定的外部 Linux 设置，纸面诊断不需要 GPU。复核于 2026-09-15；来源见 [SRC-CUDA-090](/sources-and-versions/#src-cuda-090)。不能把预期结果当成已观察结果。

## 练习 1：修复逻辑尾部

**目标：** 在 `scripts/triton-diagnostics/kernel.py` 学习者副本上修复错误掩码（mask），不删除守卫、不改变逻辑长度。解释为什么分配范围内的访问仍可能有错。

**约束：** N=17、BLOCK=32、FP32、分配 18 元素、守卫 −999。保留独立主机预言机（oracle）、独立进程及完整版本门槛。不能制造实际非法 CPU 指针。执行前预测 clean/tail/print/assert 结果，区分 GPU 断言与解释器（interpreter）检查。

**验收：** 保留原始失败与修复结果，检查全部 17 个值及守卫；再把副本扩展到长度 1、31、32、33，使用向上取整网格和 N+1 存储。整块案例不能掩盖非整块缺陷。GPU 执行必须满足 T06 门槛和环境清单（Environment Manifest）；缺少条件时提交主机/解释器进展和明确运行阻塞。解释为什么解释器通过与 memcheck 零错误摘要不能授予运行已验证（Runtime-Verified）。

<details><summary>提示 1：存在两种长度</summary>分配含 18 个元素，计算只拥有 17 个。哪个比较放行了守卫？</details>
<details><summary>提示 2：审查两次内存操作</summary>加载与存储使用同一个逻辑有效谓词，并给掩码加载定义填充值。只遮蔽存储可能隐藏额外读取；只遮蔽加载仍可能覆盖守卫。</details>

## 练习 2：选择工具并留存报告

**目标：** 为归约单位元错误、非法设备访问、共享内存危害、未初始化全局读取、同步误用写决策表。用合成输入实现仅计数派生记录测试，不把真实日志粘贴进测试。

**约束：** memcheck 先于更窄的 GPU 检查。解释器不支持的操作单独记录。覆盖工具启动失败、应用非零退出但工具零错误、摘要缺失和多个摘要。绝不导出自由形式的路径、地址、主机名或凭据。

**验收：** 解释各工具的覆盖与排除项，证明缺失/歧义摘要仍为未知，并在报告设计中保留私有原件、公开派生记录的哈希及复核责任。仅计数摘要不能证明执行了哪个内核或定位原因。没有合格环境清单时，GPU 观察保持待硬件验证（Pending Hardware Verification）。

<details><summary>提示 1：检测器不等于预言机</summary>错误但有限的算术可能通过全部内存检查。racecheck 针对共享内存，不覆盖所有全局归属错误。</details>
<details><summary>提示 2：导出小型模式</summary>用已验证枚举、有界数字与固定标签构造输出。不要删掉几个已知秘密后就公开其余原始文本。</details>

## 单独复核

先尝试两题，再打开[解答](/triton/debugging/solutions/)，随后复核 [PB-R5-019](/practice/#pb-r5-019)。
