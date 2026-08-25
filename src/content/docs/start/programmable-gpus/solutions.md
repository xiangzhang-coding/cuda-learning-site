---
title: 'O07 参考解答：接口边界与因果历史'
description: O07 两道练习的接口分类、因果改写、可接受替代方案和常见错误。
pairId: o07-solutions
counterpart: /en/start/programmable-gpus/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O07-SOLUTIONS
prerequisites:
  - O07-EXERCISES
relatedUnits:
  - O07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O07 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/programmable-gpus/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O07 练习（Exercise）](/start/programmable-gpus/exercises/)的**参考解答**。先比较谁控制接口、哪些边界仍被保留，再比较分类名称和文字。只有在保留这些区别，并把历史事实归属到同一 owner source 时，不同措辞才是有效替代。

## 解答 1：判断接口边界

| 情形 | 主要类别 | 程序员控制什么 | 保留限制与理由 |
| --- | --- | --- | --- |
| A | 固定功能接口（fixed-function interface） | 预定义操作的参数和选项 | 系统拥有操作序列，所以配置状态不等于编程一个阶段 |
| B | 可编程图形阶段接口（programmed graphics-stage interface） | 明确的逐 vertex 指令序列 | 图形调用以及 vertex program 前后的阶段仍定义它的作用 |
| C | 可编程图形阶段接口 | 面向指定 vertex/fragment profile 的类似 C 源码 | 语法层次更高，但 profile 和图形 API 仍定义阶段输入输出 |
| D | 可编程图形阶段接口 | 用 fragment 计算产生非图形结果 | 工作目标是通用计算，但 drawing 产生调用，render target 限制输出 |
| E | 通用 GPU 接口（general-purpose GPU interface） | 由 language、compiler 和 runtime 暴露的 stream 与 kernel | 编程表面面向通用 stream computation，实现仍借道图形机制 |
| F | 通用 GPU 接口 | kernel、grid、thread block、数据和已声明协调方式 | 工作不依赖 drawing 语义，但 CUDA runtime、内存和同步模型仍保留限制 |

判断依据是暴露出来的合同。D 说明工作目标不足以决定接口类别：非图形算术仍可使用可编程图形阶段接口。E 说明另一面：Brook 提供通用 language/runtime 抽象，尽管这层抽象映射到图形硬件。类似 C 的语法既不能单独决定 C，也不能单独决定 E。

## 解答 2：把年代顺序改写成因果关系

图形处理会产生大量以相似方式处理的 vertex 和 fragment，因此汇总吞吐量比缩短一个串行项目的延迟更重要；[programmable vertex engine 论文](https://research.nvidia.com/publication/2001-08_user-programmable-vertex-engine)也说明了独立 vertex 工作怎样留在并行图形流水线中。随后，固定状态成为表达瓶颈，因为应用只能选择预定义操作，不能定义操作序列。[ARB_vertex_program](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_vertex_program.txt) 与 [ARB_fragment_program](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_fragment_program.txt) 用有限阶段的明确程序回应这种压力，同时保留图形调用、输入、输出和周围阶段。[Cg](https://doi.org/10.1145/882262.882362)把编写方式从目标指令提高到类似 C 的语言与 compiler，但仍以图形 profile 为目标。GPGPU 又把 texture、fragment invocation 和 render target 改作非图形计算，使图形编码本身成为下一项障碍。[BrookGPU](https://graphics.stanford.edu/projects/brookgpu/)及其[论文](https://doi.org/10.1145/1015706.1015800)通过 compiler/runtime 暴露 stream 和 kernel，实现却仍借道图形机制。CUDA 把主要抽象改成异构 host/device program、kernel、grid、thread block 和显式 locality，[CUDA Programming Guide v13.3](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/introduction.html)对此作了概述。[2008 年 CUDA 论文](https://doi.org/10.1145/1365490.1365500)解释了独立 block 为什么能跨不同核心数量调度，所以 block independence 是可扩展规则，不是普遍加速保证。

这段改写为每次转变都写出压力、新的表达表面和保留边界。它把 Cg 放在图形语言编写层，把 Brook 放在图形机制之上的通用 stream 抽象层，把 CUDA 放在以异构编程模型为主语的位置。日期与接口事实指向 owner source，因果组织本身则是原创的。

## 可接受的替代方案

- 如果解释保留图形调用和输入输出边界，“stage-programmable graphics interface”与“programmed graphics stage”可以视为同类名称。
- E 可以写成“建立在 graphics-backed implementation 上的 general-purpose language/runtime”，但不能把它缩减成 fragment program，也不能说它已经没有图形限制。
- 因果解释可以先从 fixed-state inflexibility 写起，再补充 throughput；前提是后文说明独立工作为什么使 GPU 基础适合这类探索。
- 来源归属可以使用脚注、括号引用或 claim-to-source table，只要读者能清楚匹配 claim 与 owner source。
- 为了比较，最终段落可以先讨论 CUDA 再回看 Brook，但因果关系不能暗示日期顺序本身造成了接口变化。

## 常见错误

- 根据类似 C 的语法分类，不检查 invocation、input、output 和保留限制。
- 只因为 D 的数据不是图形，就把它归为通用接口。
- 把 Cg 与 Brook 当成同一层，或声称它们消除了所有图形时代限制。
- 只把 CUDA 描述成较晚的产品功能，漏掉 heterogeneous kernel、locality 或 block independence。
- 声称普遍加速、CPU 或图形 API 被完全替代，或写没有来源支持的“史上首个”里程碑。
- 复制来源年代顺序，却不给接口专属事实标注来源，也没有建立原创因果解释。

复核日期：**2026-08-26**。这些解答只复核概念和来源使用，不提供 benchmark 或产品排名。
