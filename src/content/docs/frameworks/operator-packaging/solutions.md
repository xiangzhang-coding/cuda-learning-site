---
title: 'P10 独立参考解答'
description: 分开工具链身份、wheel 内容和干净导入证据。
pairId: p10-solutions
counterpart: /en/frameworks/operator-packaging/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: solution-set
unitId: P10-SOLUTIONS
prerequisites: [P10-EXERCISES]
relatedUnits: [P10, EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p10-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/operator-packaging/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P10-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P10-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'P10,EX22' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/operator-packaging/solutions/" lang="en">Read the English counterpart</a>

## 先尝试

完成 [P10 练习（Exercise）](/frameworks/operator-packaging/exercises/)。答案以 [P10](/frameworks/operator-packaging/)矩阵和 [EX22](/examples/adjacent-energy/)构建脚本为准。命令描述验收流程，不是虚构的成功输出。

## 解答 1：跟踪每个阶段的产物身份

创建选定 CPython 环境，在安装扩展前运行仓库的哈希锁应用检查器。确认 torch 2.11.0+cu128、Toolkit 12.8.1/NVCC 12.8.93 和 GCC 13.3.0。在新 EX22 副本设置声明的编译器、架构变量，运行规范 check-wheel 脚本。wheel 构建、安装、依赖检查、隔离导入、CPU 集成结果分别标识。

wheel 是交接产物：计算哈希，把相同字节安装到第二个匹配应用环境，不重新解析依赖，再用新隔离进程导入公开包。同时记录 Python 包和本地扩展路径。**有效替代方案：** 在无关目录运行并清空 PYTHONPATH，也可检查源码独立性，但 -I 提供了更简单的显式边界。**常见错误：** 接受 editable 导入、忽略 pip check、重用旧 dist 文件、仅因导入一致就声称构建逐字节一致。

## 解答 2：在错误构建前停止

应用 wheel 报告 CUDA 12.8，而本地 NVCC 13.3 是主版本不匹配。无论驱动声明何种 CUDA 能力，EX22 setup 都必须在编译前停止。选择精确 12.8.1 Toolkit、GCC 与架构合同，干净重建。不绕过检查，不把旧二进制塞进新 wheel。

editable 导入是另一个假阳性：它证明源码解析，不证明 wheel 完整。在一次性匹配环境安装所产 wheel，隔离导入，定位已安装 _C。临时移除这个已安装扩展，同时让源码目录仍存在于别处；新隔离进程必须失败。重装原 wheel 恢复，再重复正向导入和 CPU 检查。**有效替代方案：** 构造故意不完整的一次性 wheel，要求导入失败。**常见错误：** 删除源码而非已安装扩展、复用已缓存本地模块的进程、接受 JIT 回退。CUDA 不可用仍是运行阻塞，不会抹掉真实主机检查，也不会产生 GPU 通过。

## 继续学习

[PB-R5-010](/practice/#pb-r5-010)更换了发布情景。阅读日期为 2026-09-13 的 [SRC-CUDA-085](/sources-and-versions/#src-cuda-085)。环境清单（Environment Manifest）的观察与目标配置分开保存。
