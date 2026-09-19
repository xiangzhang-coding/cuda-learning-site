---
title: 'G01 练习：证明资源归属'
description: 修复多线程归属轨迹，并实现有独立校验的双设备工作。
pairId: g01-exercises
counterpart: /en/multi-gpu/devices-contexts-ownership/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: G01-EXERCISES
prerequisites: [G01]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Runtime context management', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/driver-vs-runtime-api.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/devices-contexts-ownership/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G01 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/devices-contexts-ownership/exercises/" lang="en">Read the English counterpart</a>

## 先修条件与说明

精确先修 **[G01]**：[设备与归属](/multi-gpu/devices-contexts-ownership/)。复核于 2026-09-19；[SRC-CUDA-094](/sources-and-versions/#src-cuda-094)。纸面任务无硬件要求；运行须满足完整 G01 原生 Linux／双 GPU 门槛和环境清单（Environment Manifest），包括逐设备精确 CC、内存、驱动、Toolkit、进程模型、peer 兼容性、拓扑来源与权限。硬件缺失时保持待硬件验证（Pending Hardware Verification）。

## 练习一：修复合成归属轨迹

**目标：**注释并修复下面的提案，不运行非法操作：协调线程选择 B、创建流 sB、启动新工作线程，却要求它不选设备就向 sB 启动内核。工作线程只提交异步工作，协调线程 join 后便释放结果。随后插件为清理自身分配而 reset B。

**约束：**单进程、普通主上下文（primary context）、双主机线程和两个不同设备；不使用显式 Driver 上下文。逐项记录分配／流／事件的所有者、所选设备、最后消费者和释放边界。解释把工作线程换成独立进程后哪里不同。不能由零号序号推断身份。

**验收：**修复方案在工作线程显式选择 B，区分主机 join 与设备完成，阻止提前释放，用自有资源清理替代 reset。进程变体拒绝原始指针／流共享。说明纸面修复为何不授予编译或运行证据。

<details><summary>提示一：选择有作用域</summary>协调线程的设备选择不是全进程分配。标明每个调用由哪个线程执行。</details>
<details><summary>提示二：两种完成</summary>工作线程可以在入队后就返回。最终资源使用者释放归属前，要补上 GPU 完成边界。</details>

## 练习二：实现两个独立设备所有者

**目标：**先用一个提交线程，再用两个工作线程实现 G01 的 257 元素 `uint32_t` 公式。各选定本地序号 d 的 CPU 预言机（oracle）是 `1000*d+i`。

**约束：**分配前枚举并验证两个设备。使用不同缓冲区／流、显式设备选择、向上取整网格及边界检查。每个分配保持到全部使用者完成。记录全部错误、选择映射及逐设备完成。不要求 peer 访问，但兼容性仍须写成已查询或明确未知，不能假定。采用精确 G01 外部配置。

**验收：**两种变体都逐设备精确比较全部 257 个元素；拒绝设备不足及目标／驱动／内存不合格配置。分别保留源码、构建命令、完整清单、真实结果和预期标准。受阻时提交归属表、实现与阻塞原因，不虚构通过。浏览器测试或源码审查都不能升级待硬件验证状态。

<details><summary>提示一：让分配可检查</summary>预期值包含分配的序号，避免两份相同数据掩盖误用同一设备；同时保留身份映射。</details>
<details><summary>提示二：按依赖逆序释放</summary>等待最后 GPU 使用、验证结果，再销毁所属设备的资源。启动检查成功本身不够。</details>

## 单独复核

完成两个任务后再看[解答](/multi-gpu/devices-contexts-ownership/solutions/)，随后审核 [PB-R6-001](/practice/#pb-r6-001)。
