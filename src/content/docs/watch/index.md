---
title: 新特性观察
description: 阅读持续变化的 CUDA 接口，同时保持稳定课程的依赖契约。
pairId: emerging-feature-watch
counterpart: /en/watch/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [purpose, entries, review, promotion, evidence]
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'purpose,entries,review,promotion,evidence' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/" lang="en">Read the English counterpart</a>

## 为什么单独观察？

新特性观察（Emerging Feature Watch）跟踪新引入、预览、beta 与实验性接口，而不把它们变成稳定课程（Stable Curriculum）的前置条件。即使上游已发布稳定版本，教学价值和本站证据仍可能需要评审，因此条目可以继续留在这里。阅读不需要 GPU；外部实践的唯一受支持环境（Supported Environment）仍是原生 Linux。

## 已评审条目

| 条目 | 要回答的问题 | 本次版本坐标 |
| --- | --- | --- |
| [W01：CUDA Tile C++](/watch/cuda-tile-cpp/) | 用 tile 表达工作后，哪些责任交给了编译器？ | CUDA 13.3 引入；当前 13.4 编译器文档 |
| [W02：cuTile Python 与 Tile IR](/watch/cutile-python-tile-ir/) | 前端、字节码与调用约定如何配套？ | cuda-tile 1.6.0；Tile IR 13.4 |
| [W03：Developer Preview 边界](/watch/developer-preview/) | 新下载版本会改变工具包通道（Toolkit Lane）吗？ | 已归档的 13.4.0 Developer Preview；当前下载为 13.4.2 |
| [W04：NCCL 设备端与 fabric](/watch/nccl-device-fabric/) | 谁发起通信，走哪条路径？ | NCCL 2.32.3；CFT 从 2.31 引入 |
| [W05：CCCL 实验接口与 Python](/watch/cccl-experimental-python/) | 哪个命名空间真正承诺稳定性？ | CCCL v3.4.3；cuda.compute public beta |
| [W06：CUTLASS Python DSL](/watch/cutlass-python-dsls/) | 哪个编译器、布局模型和许可适用？ | CUTLASS v4.8.0；DSL 单独条款 |

## 怎样阅读和更新状态

本次核对日期为 **2026-10-04**。每个条目链接精确的维护方来源，分别说明包版本、API/ABI 契约、编译器、设备与许可。每次更新先在适用时查询当前 Context7，再核对维护方的精确文档、发布说明、源码及相关测试。持续更新的 URL 或成功导入包，不能证明旧环境符合要求。遇到来源不一致，应记录分歧，不能把不同版本的结论拼在一起。来源记录见[来源与版本](/sources-and-versions/)。

## 晋升需要单独决策

晋升要求非预览的稳定接口、明确的项目支持、持久的教学价值，以及适用工具包通道内编译已检查（Compile-Checked）的规范可运行示例（Runnable Example），和声明的基准环境（Reference Environment）内运行已验证（Runtime-Verified）的必需实验（Lab）。还须核对许可和双语发布对（Publication Pair）。本次发布不晋升任何条目，也不承诺未来实现。O–H 学习单元（Learning Unit）不能依赖 W 条目，包括通过中间资源形成的依赖。已准入通道仍为 cuda-11.8、cuda-12.9、cuda-13.3；版本号不是准入决策。

## 证据边界

这些条目是来源评审，没有编译或运行证据，也没有发布可选探测程序。若以后添加探测，应保留环境清单（Environment Manifest）、输入、精确命令和真实日志，分开预期与实测观察，并独立标记编译和运行的[证据状态（Evidence Status）](/start/evidence-status/)。网站测试和上游测试目录不能授予 GPU 证据，也不能支持性能结论。
