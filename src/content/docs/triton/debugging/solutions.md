---
title: 'T06 解答：把结论限制在执行范围内'
description: 尾部诊断、报告导出和全局归属的独立推导。
pairId: t06-solutions
counterpart: /en/triton/debugging/solutions/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-review, next]
resourceKind: solution-set
unitId: T06-SOLUTIONS
prerequisites: [T06-EXERCISES]
relatedUnits: [EX23]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton debugging guide', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/docs/programming-guide/chapter-3/debugging.rst', version: '3.7.1', platform: 'Interpreter and CUDA', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/debugging/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-review,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX23 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/debugging/solutions/" lang="en">Read the English counterpart</a>

## 尝试后再阅读

精确先修 **[T06-EXERCISES]**：[作答](/triton/debugging/exercises/)。这里是复核后的推导，不是执行记录。核查于 2026-09-15；[SRC-CUDA-090](/sources-and-versions/#src-cuda-090)。

## 解答 1：区分分配与归属

将错误分支的 `offsets <= N` 改为 `offsets < N`，同时作用于加载与存储。N=17 时，偏移 17 虽已分配，却不属于逻辑输出。错误夹具用 18 覆盖 −999，前 17 个值仍可能全部正确。只比较输出切片会漏掉缺陷。正确版本保留守卫。N=32 且单程序宽度为 32 时根本不会生成偏移 32，所以仅此形状无法区分两种谓词；N=33、两个程序则可以。

预期 clean/print 通过预言机（oracle），原始 tail 失败。GPU assert 案例启用调试，在启动或同步时失败，随后结束进程。不支持的平台、导入失败或工具启动错误是阻塞，不是目标缺陷。解释器（interpreter）assert 案例显式拒绝运行：版本相关的解释器断言设置不能可靠替代主机预言机。按声明模式和版本留存实际结果，在具备合格证据前，GPU 运行保持待硬件验证（Pending Hardware Verification）。

## 解答 2：保留两个独立判断

归约单位元问题使用解释器和独立数值检查；非法或未对齐访问使用 GPU memcheck。memcheck 干净后，共享内存危害选 racecheck，未初始化全局读取选 initcheck，受覆盖的同步误用选 synccheck。解释器拒绝追逐指针不能证明任何一种 GPU 缺陷。干净检查只覆盖执行路径上的受支持指令。

进程退出码和工具摘要计数必须分开。缺失或多个摘要保留 null 并要求私下复核；不能因为工具零错误，就把非零进程退出变为成功。`sanitizer_summary` 只构造有界模式，不复制自由文本。合成测试覆盖缺失/歧义摘要、非法工具/退出值和注入的身份信息。私有原件用于识别内核、源码位置与检测原因。单独记录原件哈希、派生哈希、转换、复核者及环境清单（Environment Manifest）；仅派生记录不足以构成证据。

## 练习题库复核

**PB-R5-019：** 两个程序用非原子 load/add/store 更新同一个全局输出，可能丢失更新。顺序解释移除了交错，而 racecheck 的共享内存范围不能验证这一全局操作。应证明输出唯一归属，或采用具备适当原子/顺序语义的算法；随后以数值预言机和合格环境清单，在编译后的 GPU 路径上重复测试。memcheck 有助于排除访问错误，却不能证明缺失的全局顺序。解释器通过不支持速度或运行声明。

## 返回单元

返回 [T06](/triton/debugging/)，把诊断记录绑定到执行源码，不复用其他案例的干净摘要。
