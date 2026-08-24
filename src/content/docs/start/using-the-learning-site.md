---
title: 'O01：如何使用学习站'
description: 认识学习资源、当前发布路线和本站边界。
pairId: o01
counterpart: /en/start/using-the-learning-site/
factCheckDate: '2026-08-24'
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
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: o01
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'outcome,resource-types,published-route,themes,workflow,boundaries,check'
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

截至 **2026-08-24**，完整的先修关系是：

1. [首页](/)
2. **O01：如何使用学习站**（本页）
3. 完成 O01 后，可以分别进入 [O02：诚实记录证据状态](/start/evidence-status/)和 [O03：读懂环境清单](/start/environment-manifest/)，学习证据状态（Evidence Status）和环境清单（Environment Manifest）。

O02 和 O03 各有练习与独立参考解答；[练习题库](/practice/)当前包含两道分别链接回 O02 和 O03 的完整题目。你还可以直接查阅[术语表](/glossary/)、[来源与版本记录](/sources-and-versions/)和[关于本站](/about/)。导航没有列出的学习材料尚未公开，不应从编号或文字描述中推断存在对应页面。

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

**事实核查日期：2026-08-24。** 本页不依赖特定 CUDA Toolkit 版本，也不会授予 CUDA 证据状态。术语定义见[术语表](/glossary/)，发布接口与 CUDA 来源依据见[来源与版本记录](/sources-and-versions/)。
