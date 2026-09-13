---
title: 'P10 练习：构建一次，干净导入'
description: 实现 wheel 验收流程，诊断编译器不匹配和源码目录遮蔽。
pairId: p10-exercises
counterpart: /en/frameworks/operator-packaging/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: exercise-set
unitId: P10-EXERCISES
prerequisites: [P10]
relatedUnits: [EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p10-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/operator-packaging/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P10-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P10 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX22 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/operator-packaging/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

前置：[P10](/frameworks/operator-packaging/)。使用 [EX22](/examples/adjacent-energy/) 的选定矩阵，不能直接用机器上碰巧安装的 torch。练习（Exercise）的书面审查不需要 GPU，实际构建要求声明的原生 Linux 工具链。

## 练习 1：实现产物验收流程

**目标：** 构建包含两条本地路径的 wheel，证明新进程导入的是安装产物，而不是 editable 源码目录。

**约束：** 使用既有哈希锁应用环境、精确 Toolkit/NVCC 与编译器、显式架构列表；不重新解析依赖，不在导入时回退 JIT，保留以前结果。

**预期证据：** 提交命令、分阶段退出码、wheel 哈希、Python ABI、torch/CUDA/编译器身份、解析到的包与扩展路径，以及第二个匹配虚拟环境的导入计划或实际报告。

**验收标准：** 构建并安装唯一 wheel；pip check 成功；隔离导入解析到 site-packages；已安装包 CPU 检查成功。CUDA 不可用应单独记录为阻塞，不是通过的 CUDA 测试。

<details><summary>提示 1：定位产物</summary><p>构建目录有扩展，并不证明 wheel 含有它。应问新 Python 进程实际加载了哪个文件。</p></details>
<details><summary>提示 2：移除意外源码路径</summary><p>使用 python -I，避免 editable 安装，把 wheel 安装到另一匹配环境。编译器准备应在导入命令之外。</p></details>

## 练习 2：调试“我这里能用”的发布

**目标：** 审查使用 torch 2.11.0+cu128、本地 NVCC 13.3、editable 安装且导入解析到源码目录的候选发布。

**约束：** 新驱动不能替代 Toolkit 匹配。不允许重命名 wheel、绕过版本检查，或把成功的源码导入当作打包测试。

**预期证据：** 指出独立的编译器缺陷和产物选择缺陷。明确预期停止阶段、修正工具链、干净重建，以及在一次性环境移除已安装 _C 的负向导入实验。

**验收标准：** 编译前拒绝不匹配；重建使用 NVCC 12.8.93 及选定矩阵。已安装 _C 缺失应导致导入失败，不能静默加载源码副本或编译一个替代。

<details><summary>提示 1：驱动和编译器回答不同问题</summary><p>驱动能够执行 CUDA 程序时，扩展构建仍可能使用不兼容头文件和编译器输出。分别查看 torch.version.cuda 与本地 nvcc。</p></details>
<details><summary>提示 2：成功回退代表测试失败</summary><p>负向实验中成功导入说明另一个产物满足了请求。先检查解析路径并排除替代，才能评价该 wheel。</p></details>

## 审查

尝试后打开[独立解答](/frameworks/operator-packaging/solutions/)，再审查 [PB-R5-010](/practice/#pb-r5-010)。[SRC-CUDA-085](/sources-and-versions/#src-cuda-085)记录 2026-09-13 的精确构建和权利复核。
