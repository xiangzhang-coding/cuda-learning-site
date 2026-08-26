---
title: 'O01：如何使用学习站'
description: 认识学习资源、当前发布路线和本站边界。
pairId: o01
counterpart: /en/start/using-the-learning-site/
factCheckDate: '2026-08-26'
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
      content: '2026-08-26'
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

截至 **2026-08-26**，完整发布的严格先修关系是：

1. [首页](/)
2. **O01：如何使用学习站**（本页）
3. [O02：诚实记录证据状态](/start/evidence-status/)、[O03：读懂环境清单](/start/environment-manifest/)、[O04：面向 CUDA 学习者的 C++17 复习](/start/cpp17-for-cuda/)、[O05：可复现的 Linux 命令行工作](/start/linux-command-line/)和 [O06：架构回顾](/start/architecture-refresher/)都直接依赖 O01。
4. [O07：GPU 为什么变得可编程](/start/programmable-gpus/)只依赖 O06。
5. [O08：准备基准环境候选配置](/start/reference-environment-candidate/)同时依赖 O02、O03 和 O05。
6. [EX01 环境报告可运行示例](/examples/environment-report/)没有严格学习单元先修条件；[LAB01：记录并解读 CUDA 环境](/labs/record-cuda-environment/)同时依赖 O03 和 O08，并使用 EX01。
7. Kernel 路线在完成 O03 后进入 [F01：从预测到第一个 CUDA kernel](/foundations/first-cuda-kernel/)。[F02：理解 CUDA 执行层次](/foundations/execution-hierarchy/)依赖 F01，[F03：把多维索引与边界写成正确性合同](/foundations/multidimensional-indexing/)依赖 F02；[F04：显式 host-device 资源生命周期](/foundations/host-device-lifecycle/)也依赖 F01。
8. [F05：CUDA 错误为何常常延后暴露](/foundations/asynchronous-errors/)仅依赖 F04；[F06：Compute capability 是功能合同](/foundations/compute-capability/)同时依赖 F02 和 O03；[F07：区分 CUDA Runtime API 与 Driver API 的角色](/foundations/runtime-driver-api/)同时依赖 F04 和 F05；[F08：Launch geometry 是先于速度的正确性与资源决策](/foundations/launch-geometry/)同时依赖 F02、F03 和 F06。
9. [EX03 多维索引可运行示例](/examples/multidimensional-indexing/)依赖 F03，并为 F03/F04 提供 canonical source；[EX04 错误处理生命周期可运行示例](/examples/error-handling-lifecycle/)仅依赖 F05。[LAB02](/labs/vector-addition/)同时依赖 O03 和 F01，并使用 canonical [EX02](/examples/vector-addition/)；[LAB03：破坏并修复索引](/labs/break-and-repair-indexing/)同时依赖 F03 和 F05，并使用 EX04。F08 与 LAB03 相关，但不是 LAB03 的先修条件。

下一步应按自己的缺口选择。O04 的 C++17 复习可在阅读 F01-F08 和 EX02-EX04 时使用，但不会成为它们的新先修条件。Linux 记录路线必须合并 O02、O03 和 O05 后才进入 O08；EX01 可直接查阅，LAB01 则必须同时满足 O03 和 O08。架构路线按 O06、O07 的顺序学习，再把这些模型用于基础课程。F05 从 F04 继续错误生命周期；F06 汇合 F02/O03；F07 汇合 F04/F05；F08 汇合 F02/F03/F06。这些学习建议不增加上面没有列出的先修边。

O02-O08 和 F01-F08 都有直接练习和独立参考解答。基础路线可直接进入 [F01 练习](/foundations/first-cuda-kernel/exercises/)与[解答](/foundations/first-cuda-kernel/solutions/)、[F02 练习](/foundations/execution-hierarchy/exercises/)与[解答](/foundations/execution-hierarchy/solutions/)、[F03 练习](/foundations/multidimensional-indexing/exercises/)与[解答](/foundations/multidimensional-indexing/solutions/)、[F04 练习](/foundations/host-device-lifecycle/exercises/)与[解答](/foundations/host-device-lifecycle/solutions/)、[F05 练习](/foundations/asynchronous-errors/exercises/)与[解答](/foundations/asynchronous-errors/solutions/)、[F06 练习](/foundations/compute-capability/exercises/)与[解答](/foundations/compute-capability/solutions/)、[F07 练习](/foundations/runtime-driver-api/exercises/)与[解答](/foundations/runtime-driver-api/solutions/)、[F08 练习](/foundations/launch-geometry/exercises/)与[解答](/foundations/launch-geometry/solutions/)。

[实验索引](/labs/)按当前顺序直接列出 [LAB01](/labs/record-cuda-environment/)、[LAB02](/labs/vector-addition/)和 [LAB03](/labs/break-and-repair-indexing/)；导航没有未完成学习单元。[可视化讲解索引](/visuals/)仍只有 VIS01 kernel 路径与 VIS02 索引两条正式路线。F05 的错误时间线、F06 的 capability filter、F07 的 API boundary 和 F08 的 block-shape explorer 是原创内嵌教学界面，不是独立 Visual Explainer，也没有新的 VIS 路由；它们提供静态或文字回退，不执行 CUDA，也不产生证据。F04 的原创静态生命周期表同样不是 Visual Explainer 或证据来源。[练习题库](/practice/)现收录十七道链接回 O02-O08 与 F01-F08 的完整题目。你还可以直接查阅已经扩展的[术语表](/glossary/)、[来源与版本记录](/sources-and-versions/)和[关于本站](/about/)。导航没有列出的学习材料尚未公开，不应从编号或文字描述中推断存在对应页面。

EX01 保留现有状态：没有 Compile-Checked 声明，runtime 为 Pending Hardware Verification。EX03 也保留现有状态：在 11.8.0、12.9.2 与 13.3.1 三条工具包通道（Toolkit Lane）使用同一份原创 C++17 source，compilation evidence 为空，runtime 为 Pending Hardware Verification。EX04 与 LAB03 的 compilation evidence 同样为空，runtime 都是 Pending Hardware Verification。Host-only checks 不编译或运行 CUDA；本站没有运行 EX03 或 EX04 CUDA binary，也没有记录它们的实际 output、error code、timing 或 performance number。

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

**事实核查日期：2026-08-26。** 本页不依赖特定 CUDA Toolkit 版本，也不会授予 CUDA 证据状态。术语定义见[术语表](/glossary/)，发布接口与 CUDA 来源依据见[来源与版本记录](/sources-and-versions/)。
