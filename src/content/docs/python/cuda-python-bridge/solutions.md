---
title: 'P01 解答：所有权、配置身份与有条件的成本'
description: 推导五元素参考值、安全阻塞与异步所有权、精确配置修复，以及假设的摊销临界点。
pairId: p01-solutions
counterpart: /en/python/cuda-python-bridge/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P01-SOLUTIONS
prerequisites: [P01-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'CUDA core installation and support boundary'
    url: 'https://nvidia.github.io/cuda-python/cuda-core/1.2.0/install.html'
    version: 'cuda-core 1.2.0'
    platform: 'Static Python bridge and dependency audit, not execution'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/python/cuda-python-bridge/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/en/python/cuda-python-bridge/solutions/" lang="en">Read the English counterpart</a>

## 参考解答

先尝试 [P01 练习](/python/cuda-python-bridge/exercises/)；唯一直接前置为 `[P01-EXERCISES]`。以下为原创纸面解答，四个证据数组均为空，没有记录命令、编译器或 GPU 结果。

## 解答 1：返回拥有的值，或拥有资源的待完成操作

数学输出是 `[2,-1,0,8,-0.5]`。题设输入及其和都能由 float32 精确表示。一个 256 线程块覆盖五个有效索引和 251 个尾部无效索引。每个数组 20 字节；三个设备数组共 60 设备字节，三个页锁定主机数组共 60 主机字节。两项都不含原生运行库、编译器或上下文开销。

输入初始化和 Python 参考计算在 CPU 上执行。如果执行编译/链接，它们也在主机上发生，产生的是代码而非向量结果。H2D/启动/D2H 调用提交工作，CUDA 核函数才在 GPU 上计算。导入包不改变参考循环的执行位置。

必要数据链为 `初始化 -> H2D -> 核函数 -> D2H -> 经检查的完成 -> CPU 读取`。Buffer 持有者要跨过最后一次排队使用；输出持有者还要活到最后一次视图读取。流（stream）和核函数/库持有者必须活过执行。ctypes 视图不持有 Buffer，所以只返回视图同时违反所有权和就绪要求。

阻塞式设计把资源留在函数内，在 D2H 后调用 `s.sync()`，检查每个输出均有限且正确，再把通过验收的值复制到独立拥有存储的 Python 结果中，之后才关闭底层 Buffer。返回这种独立结果，清理不会留下悬空视图。仅同步后就返回视图，同时释放其 Buffer，仍然错误。

异步设计可以返回应用定义的待完成操作对象，持有必要 Buffer、流、核函数/库引用与状态。它的完成操作必须检查同步、报告失败，然后才暴露已验收数据，还要规定调用者放弃结果时的清理策略。这是接口设计，不是现成 core 类，也不证明存在安全取消机制。完成失败时，结果不能变为有效；保留原始诊断，另报清理问题。

## 解答 2：固定产物，再区分政策与观察

修复后的配置使用原生 Linux x86-64 Ubuntu 24.04、普通 GIL CPython 3.14.7（`cp314-cp314`）、core 1.2.0、bindings 13.4.1、pathfinder 1.8.1 和 NumPy 2.5.3。原生 Toolkit 13.3.1 提供 NVRTC 与 nvJitLink 13.3.33；驱动目标是 610.43.02。运行另需一个编译器支持、计算能力（compute capability）至少 7.5 的 GPU，并满足小问题预算。这些必须是独立清单字段，不是一个“CUDA 版本”。

使用精确基础发行包与已复核 wheel 哈希，不加可能选择另一原生 Toolkit 主/次版本的 extras。即使 EX21 没有导入 NumPy，core 仍需要它。锁定文件不证明导入或实际原生库身份，也不固定解释器、驱动、OS 包或 GPU。分别记录解析到的原生路径、版本与包身份；同主版本家族的支持政策仍有逐 API 限制。

| 已取得的依据 | 仍未证明什么 |
| --- | --- |
| 源码/政策与产物哈希审查 | 导入、原生编译/链接、加载、执行、正确性 |
| 主机测试通过 | 原生编译器/链接器路径及全部 GPU 阶段 |
| 实际原生编译/链接成功，且保留合格记录 | 加载、符号查找、带类型启动、完成检查、GPU 正确性 |
| 启动提交成功 | 完成、数据正确、安全复用与释放 |

未来合格构建可支持编译证据轴，不会将 EX21 变为无需运行验证（Runtime-Not-Applicable）或运行已验证（Runtime-Verified）。后者需要在声明的基准环境（Reference Environment）执行，并保留完整验收记录。

假设模型中，`1800+80*R < 170*R` 得到 `R>20`，所以首次满足的正整数为 **21**。R=20 时两边均为 3400；R=21 时分别为 3480、3570。若每次请求都重新准备，桥接时间为 `1880*R`，对全部正 R 都大于 `170*R`。这些结论依赖题设成本以及相同的工作负载、测量边界，不是实际 Python 或 GPU 性能。

## 合法替代与取舍

阻塞返回独立结果的服务合同更简单，也更容易审查；拥有资源的待完成操作可以保留并发机会，但增加就绪、生命周期、放弃结果与错误状态。两者都不自动更快。匹配的 CPU 实现也是合理选择，尤其在准备成本无法摊销时；但假设工作纸不能选出实测赢家。

## 常见错误

- 保留视图却丢弃分配持有者，可能留下悬空地址。
- 等待完成修复就绪，不修复随后释放造成的所有权缺失。
- 把 Toolkit 安装标签当成已加载 NVRTC 身份，忽略搜索路径与独立安装库。
- 删除 NumPy 或使用 `--no-deps`，违反选定 core 的依赖合同。
- 把 R=20 叫作严格获益，或把重复准备移到循环外，改变了题设模型。
- 将主机测试或成本模型变成 GPU 证据，跳过了执行验收。

返回 [P01](/python/cuda-python-bridge/)。来源为 [SRC-CUDA-077](/sources-and-versions/#src-cuda-077)与 [SRC-CUDA-079](/sources-and-versions/#src-cuda-079)，核对于 **2026-09-12**。[EX21](/examples/cuda-python-launch/)保持待硬件验证（Pending Hardware Verification）。
