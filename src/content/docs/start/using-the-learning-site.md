---
title: 'O01：如何使用学习站'
description: 认识学习资源、当前发布路线和本站边界。
pairId: o01
counterpart: /en/start/using-the-learning-site/
factCheckDate: '2026-09-03'
license: CC-BY-4.0
provenance: original
structure:
  - outcome
  - resource-types
  - published-route
  - themes
  - workflow
  - boundaries
  - check
resourceKind: learning-unit
unitId: O01
prerequisites: []
relatedUnits:
  - O02
  - O03
  - O04
  - O05
  - O06
  - O07
  - O08
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: o01
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-09-03'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'outcome,resource-types,published-route,themes,workflow,boundaries,check'
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: learning-unit }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O01 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: none }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O02,O03,O04,O05,O06,O07,O08' }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/using-the-learning-site/" lang="en">Read the English counterpart</a>

CUDA 学习站（Learning Site）不是按发布时间堆叠内容的博客。它把概念、代码和动手活动放进一条有先修关系的学习路线；同时保留直接查阅入口，方便你回来核对某个术语或来源。

## 学完本单元，你应该能

- 说清本站七类学习资源分别承担什么任务。
- 找到当前已经完整发布的先修路线，而不是把导航当作未来目录。
- 在不改变内容含义的前提下选择视觉主题，并说清无脚本回退行为。
- 判断何时阅读、何时动手，以及浏览器和外部 CUDA 环境各自负责什么。

## 七类资源，各做一件事

**学习单元（Learning Unit）** 负责教学。它先说明问题为什么值得解决，再建立心智模型和先修关系，最后用问题或实践检查理解。

**可运行示例（Runnable Example）** 是一个独立、可构建的源代码项目。页面中的完整代码不会成为另一个手工维护的副本。

**实验（Lab）** 是你在外部 CUDA 环境中执行的分步活动。它给出操作步骤、预期观察和完成标准；网站不会替你执行 CUDA。

**练习（Exercise）** 把工作留给学习者完成。它说明目标、约束和验收条件，而不是只展示答案。

**练习题库（Practice Bank）** 汇集跨单元反复出现的问题，并把每道题连回所需的先修单元。它不是从别处复制来的问答清单。

**可视化讲解（Visual Explainer）** 用交互或动画显露空间、时间或架构行为。它可以在浏览器里建模概念，但不是 CUDA 执行环境。

**术语表（Glossary）** 统一本站使用的中英文技术词，并指出容易造成歧义的替代说法。遇到陌生词时，先到[术语表](/glossary/)核对。

每个公开页面还必须和另一种语言的对应页组成**双语发布对（Publication Pair）**。两页共享事实、结构、元数据和来源日期，但各自使用自然的中文或英文表达。

## 当前发布路线

截至 **2026-09-03**，[issue #30](https://github.com/xiangzhang-coding/cuda-learning-site/issues/30) 后的稳定课程当前滚动发布已完整双语发布 60 个学习单元：O01-O08、F01-F08、M01-M19、A01-A11/A14，以及 Q01-Q13。下面是当前完整发布的严格先修关系：

已完成的 R2 聚合发布复核是不可变快照，固定为 186 个 Publication Pairs、372 条 source routes 与 284 条 catalog records。当前增量发布已前进到 226 个 Publication Pairs 与 452 条 source routes，但不会改写 R2；R3 聚合复核仍待完成。

1. [首页](/)
2. **O01：如何使用学习站**（本页）
3. [O02：诚实记录证据状态](/start/evidence-status/)、[O03：读懂环境清单](/start/environment-manifest/)、[O04：面向 CUDA 学习者的 C++17 复习](/start/cpp17-for-cuda/)、[O05：可复现的 Linux 命令行工作](/start/linux-command-line/)和 [O06：架构回顾](/start/architecture-refresher/)都直接依赖 O01。
4. [O07：GPU 为什么变得可编程](/start/programmable-gpus/)只依赖 O06。
5. [O08：准备基准环境候选配置](/start/reference-environment-candidate/)同时依赖 O02、O03 和 O05。
6. [EX01 环境报告可运行示例](/examples/environment-report/)没有严格学习单元先修条件；[LAB01：记录并解读 CUDA 环境](/labs/record-cuda-environment/)同时依赖 O03 和 O08，并使用 EX01。
7. Kernel 路线在完成 O03 后进入 [F01：从预测到第一个 CUDA kernel](/foundations/first-cuda-kernel/)。[F02：理解 CUDA 执行层次](/foundations/execution-hierarchy/)依赖 F01，[F03：把多维索引与边界写成正确性合同](/foundations/multidimensional-indexing/)依赖 F02；[F04：显式 host-device 资源生命周期](/foundations/host-device-lifecycle/)也依赖 F01。
8. [F05：CUDA 错误为何常常延后暴露](/foundations/asynchronous-errors/)仅依赖 F04；[F06：Compute capability 是功能合同](/foundations/compute-capability/)同时依赖 F02 和 O03；[F07：区分 CUDA Runtime API 与 Driver API 的角色](/foundations/runtime-driver-api/)同时依赖 F04 和 F05；[F08：Launch geometry 是先于速度的正确性与资源决策](/foundations/launch-geometry/)同时依赖 F02、F03 和 F06。
9. F01-F08 之后进入内存路线：[M01：地址空间、所有权、作用域与生命周期](/memory/address-spaces/)同时依赖 F04 和 F06；[M02：把合并访问理解为事务塑形](/memory/coalescing-transactions/)同时依赖 M01 和 F03；[M03：共享内存分块](/memory/shared-memory-tiling/)同时依赖 M01 和 M02；[M04：Bank conflict 与布局变换](/memory/bank-conflicts-layouts/)仅依赖 M03；[M05：同步作用域与内存可见性](/memory/synchronization-scopes/)同时依赖 F02 和 M01；[M06：分支发散、重汇合与线程束安全推理](/memory/warp-divergence-reconvergence/)同时依赖 F02 和 M05；[M07：用流取代全局顺序心智模型](/memory/stream-ordering/)同时依赖 F05 和 M01；[M08：用事件表达依赖并测量设备时间](/memory/event-dependencies-timing/)仅依赖 M07。
10. 当前内存扩展包含六个完整学习单元：[M09：页锁定内存与传输重叠](/memory/pinned-memory-transfer-overlap/)同时依赖 M07 和 M08；[M10：统一内存与页面迁移](/memory/unified-memory-page-migration/)同时依赖 M01 和 M02；[M11：流顺序分配与内存池](/memory/stream-ordered-allocation-memory-pools/)同时依赖 M07 和 M08；[M12：协作组与可组合同步](/memory/cooperative-groups/)同时依赖 M05 和 M06；[M13：异步复制与分阶段流水线](/memory/asynchronous-copy-pipelines/)同时依赖 M03、M05 和 M08；[M14：CUDA 图与重复启动结构](/memory/cuda-graphs/)同时依赖 M07 和 M08。
11. 工具链路线从 [M15：NVCC 主机/设备编译流程](/toolchain/nvcc-compilation-flow/)开始，它同时依赖 F04 和 O04；[M16：PTX、cubin、SASS 与 fatbinary](/toolchain/ptx-cubin-fatbinary/)同时依赖 M15 和 F06；[M17：选择编译器架构目标](/toolchain/compiler-architecture-targets/)同时依赖 M16 和 F06；[M18：分离编译与设备链接](/toolchain/separate-compilation-device-linking/)同时依赖 M15 和 M16；[M19：CUDA C++17、C++20 与 C++23 方言边界](/toolchain/cpp-dialect-boundaries/)同时依赖 O04 和 M15。
12. 并行算法路线保留 A01-A09，加入 [A10：数值稳定 Softmax](/algorithms/numerically-stable-softmax/)`<-[A02,M02,M03]`、[A11：把 Attention 分解为 IO 问题](/algorithms/attention-as-an-io-problem/)`<-[A08,A10]`，并保留 [A14](/algorithms/algorithm-choice-arithmetic-intensity/)`<-[A01,A02,A05,A08]`。
13. 正确性与质量路线保留 Q01-Q08，并加入 [Q09：用 Occupancy、Stalls 与 Throughput 解释延迟隐藏](/correctness/occupancy-stalls-throughput/)`<-[Q08,F08]`、[Q10：从 Arithmetic Intensity 构建可审计 Roofline](/correctness/roofline-arithmetic-intensity/)`<-[Q05,A14]`、[Q11：用受控证据优化 Canonical Transpose](/correctness/transpose-optimization-case-study/)`<-[A05,Q06,Q08,Q10]`、[Q12：用受控证据优化 Canonical Reduction](/correctness/reduction-optimization-case-study/)`<-[A02,Q02,Q06,Q08]`与 [Q13：用受控证据优化 Canonical GEMM](/correctness/gemm-optimization-case-study/)`<-[A08,Q06,Q08,Q10]`。Q13 从 immutable [EX15](/examples/tiled-gemm/)开始，并复用 evidence-neutral [VIS12](/visuals/gemm-tiling-hierarchy/)。
14. Runnable Example 集合仍是 EX01-EX16，Lab 集合仍是 LAB01-LAB10。Visual graph 加入 [VIS18：Attention Memory Traffic](/visuals/attention-memory-traffic/)`<-[A11]`；后续 framework、cuDNN 与 Triton 单元仍未发布。

下一步应按自己的缺口选择。O04 的 C++17 复习可在阅读 F01-F08 和所有已发布 Runnable Example 时使用，但不会成为它们的新先修条件。Linux 记录路线必须合并 O02、O03 和 O05 后才进入 O08；EX01 可直接查阅，LAB01 则必须同时满足 O03 和 O08。架构路线按 O06、O07 的顺序学习，再把这些模型用于基础课程。F05 从 F04 继续错误生命周期；F06 汇合 F02/O03；F07 汇合 F04/F05；F08 汇合 F02/F03/F06。内存路线从 F04/F06 汇入 M01，经 M02-M04 建立 memory access/layout，再分别进入 M05/M06 的同步与 warp 推理，以及由 F05/M01 汇入 M07、再到 M08 的 stream/event 路线。

完成这些基础后，算法路线从 A02/M02/M03 汇入 A10，再由 A08/A10 汇入 A11；A14 继续由 A01/A02/A05/A08 汇入。VIS18 严格依赖 A11。正确性路线与 LAB09/LAB10 的既有边不变；未发布的 production-library 与 framework 路线不进入当前图。

O02-O08、F01-F08、M01-M19 与 Q01-Q05 都有直接练习和独立参考解答。内存路线可按顺序进入 [M09 练习](/memory/pinned-memory-transfer-overlap/exercises/)与[解答](/memory/pinned-memory-transfer-overlap/solutions/)、[M10 练习](/memory/unified-memory-page-migration/exercises/)与[解答](/memory/unified-memory-page-migration/solutions/)、[M11 练习](/memory/stream-ordered-allocation-memory-pools/exercises/)与[解答](/memory/stream-ordered-allocation-memory-pools/solutions/)、[M12 练习](/memory/cooperative-groups/exercises/)与[解答](/memory/cooperative-groups/solutions/)、[M13 练习](/memory/asynchronous-copy-pipelines/exercises/)与[解答](/memory/asynchronous-copy-pipelines/solutions/)、[M14 练习](/memory/cuda-graphs/exercises/)与[解答](/memory/cuda-graphs/solutions/)。工具链路线可进入 [M15 练习](/toolchain/nvcc-compilation-flow/exercises/)与[解答](/toolchain/nvcc-compilation-flow/solutions/)、[M16 练习](/toolchain/ptx-cubin-fatbinary/exercises/)与[解答](/toolchain/ptx-cubin-fatbinary/solutions/)、[M17 练习](/toolchain/compiler-architecture-targets/exercises/)与[解答](/toolchain/compiler-architecture-targets/solutions/)、[M18 练习](/toolchain/separate-compilation-device-linking/exercises/)与[解答](/toolchain/separate-compilation-device-linking/solutions/)、[M19 练习](/toolchain/cpp-dialect-boundaries/exercises/)与[解答](/toolchain/cpp-dialect-boundaries/solutions/)。正确性路线可直接进入 [Q01 练习](/correctness/cpu-references-tolerances-invariants/exercises/)与[解答](/correctness/cpu-references-tolerances-invariants/solutions/)、[Q02 练习](/correctness/floating-point-order-reproducibility/exercises/)与[解答](/correctness/floating-point-order-reproducibility/solutions/)、[Q03 练习](/correctness/memcheck-invalid-memory-access/exercises/)与[解答](/correctness/memcheck-invalid-memory-access/solutions/)、[Q04 练习](/correctness/racecheck-initcheck-synccheck/exercises/)与[解答](/correctness/racecheck-initcheck-synccheck/solutions/)、[Q05 练习](/correctness/timing-asynchronous-gpu-work/exercises/)与[解答](/correctness/timing-asynchronous-gpu-work/solutions/)；既有单元仍可通过上方严格先修图直接访问。

Q06-Q13 都有直接练习与独立参考解答，包括 [Q09 练习](/correctness/occupancy-stalls-throughput/exercises/)与[解答](/correctness/occupancy-stalls-throughput/solutions/)、[Q10 练习](/correctness/roofline-arithmetic-intensity/exercises/)与[解答](/correctness/roofline-arithmetic-intensity/solutions/)、[Q11 练习](/correctness/transpose-optimization-case-study/exercises/)与[解答](/correctness/transpose-optimization-case-study/solutions/)、[Q12 练习](/correctness/reduction-optimization-case-study/exercises/)与[解答](/correctness/reduction-optimization-case-study/solutions/)，以及 [Q13 练习](/correctness/gemm-optimization-case-study/exercises/)与[解答](/correctness/gemm-optimization-case-study/solutions/)。

算法路线可进入 A01-A11 与 A14 各自的练习和独立解答，包括 [A10 练习](/algorithms/numerically-stable-softmax/exercises/)与[解答](/algorithms/numerically-stable-softmax/solutions/)，以及 [A11 练习](/algorithms/attention-as-an-io-problem/exercises/)与[解答](/algorithms/attention-as-an-io-problem/solutions/)。

[实验索引](/labs/)列出 10 个 Labs（LAB01-LAB10）。[可视化讲解索引](/visuals/)列出 19 项讲解：独立 VIS01-VIS14/VIS18，加上内嵌 VIS19-VIS22。当前 catalog 是 10 个 Lab、64 个[练习题库](/practice/)条目、19 项 Visual Explainer、170 项[术语表](/glossary/)和 74 项[来源记录](/sources-and-versions/)，共 337 条记录；当前滚动公开内容形成 226 个 Publication Pairs 和 452 条 source routes。这些数字独立于不可变的 R2 186/372/284 快照，R3 聚合复核仍待完成。

A10/A11 的四个 evidence arrays 均为空且不授予 Evidence Status。Numerical worksheets 是 host arithmetic，traffic formulas 与 VIS18 是 static analysis；本次增量没有 GPU numerical output、actual traffic、backend/dtype observation、timing、speedup、winner、Reference Environment 或 `performanceObservations`。

## 三种视觉主题，一套内容

页头和移动菜单中的视觉主题选择器提供三种阅读方式：

- **硅光浅色（Silicon Light）** 是默认模式，使用明亮表面和低干扰的硅片点阵，适合长文阅读。
- **分析器深色（Profiler Dark）** 使用深色表面、时间刻度和高对比代码区域，适合阅读代码与性能轨迹。
- **蓝图（Blueprint）** 使用工程蓝底、主次网格和数据路径色，突出空间关系与数据流。

三种主题共享同一份页面结构、文字、语义色、键盘顺序和焦点行为；主题不会隐藏内容，也不会把装饰图形当作 CUDA 观察。主题选择是本站唯一跨浏览器会话保留的学习者偏好，只写入当前站点的 `localStorage`，不需要账号、跟踪档案、应用 API、数据库或服务端状态。

如果脚本被关闭，或浏览器策略不允许持久化，页面会保持可读的 Silicon Light 静态默认并显示文字回退。减弱动态、高对比与强制色、窄屏重排和打印规则覆盖全部主题。自动化检查只能发现部分无障碍问题，不能证明 WCAG 一致性；键盘、屏幕阅读器和实际缩放仍需要人工复核。

## 建议的使用节奏

1. 先读学习单元的目标和先修条件，确认它回答的问题。
2. 在看到结论前先写下自己的预测；这能暴露心智模型中的缺口。
3. 遇到可运行示例时，以独立项目为代码源，不从页面拼接程序。
4. 进入实验前准备外部环境，并按验收条件记录自己的工作。
5. 用练习和练习题库检验迁移能力；卡住时先回到相关学习单元。

## 本站不替你做什么

- 不提供账号、学习进度、测验分数或个人学习档案。
- 不通过服务端渲染、应用 API 或浏览器内 CUDA 来隐藏真实执行环境。
- 不用空白页面、占位导航或“即将推出”链接冒充已经可学的材料。
- 不把可视化模型当作硬件执行结果。
- 不因为页面发布、网页 CI 或浏览器交互就授予 CUDA 证据状态；受控合同从 [O02](/start/evidence-status/)开始。

## 离开前检查

如果你能回答下面五个问题，就可以把 O01 当作已经掌握：

1. 可运行示例和实验的差别是什么？
2. 为什么练习题库中的条目要链接回先修学习单元？
3. 为什么导航中没有出现的学习材料不能视为已经发布？
4. 脚本或持久化不可用时，主题选择器如何回退？
5. 为什么公开一个页面不会授予 CUDA 证据状态？

**事实核查日期：2026-09-03。** 本页不依赖特定 CUDA Toolkit 版本，也不会授予 CUDA 证据状态。术语定义见[术语表](/glossary/)，发布接口与 CUDA 来源依据见[来源与版本记录](/sources-and-versions/)。
