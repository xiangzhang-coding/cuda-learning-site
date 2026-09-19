---
title: 'G01 解答：先确认归属，再清理资源'
description: 复核线程局部设备选择、完成边界与插件清理权限。
pairId: g01-solutions
counterpart: /en/multi-gpu/devices-contexts-ownership/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank-review, retrieval]
resourceKind: solution-set
unitId: G01-SOLUTIONS
prerequisites: [G01-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Runtime context management', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/driver-vs-runtime-api.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/devices-contexts-ownership/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank-review,retrieval' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/devices-contexts-ownership/solutions/" lang="en">Read the English counterpart</a>

## 先完成练习

精确先修 **[G01-EXERCISES]**：[归属练习](/multi-gpu/devices-contexts-ownership/exercises/)。这些是原创纸面推导，于 2026-09-19 根据 [SRC-CUDA-094](/sources-and-versions/#src-cuda-094) 复核，不是 GPU 结果。

## 解答一：修复轨迹

工作线程必须先显式选择 B，再向 sB 启动内核。在共享的普通主上下文（primary context）中，协调线程创建 sB 本身合法，但归属和主机移交必须明确。工作线程可以在返回前等待 GPU 完成，也可以通过生命周期协议返回完成句柄；协调线程必须在读／释放结果前等待完成。单纯 join 只证明主机函数返回。

删除 reset：插件选择正确设备，等待自己分配的全部使用完成，释放该分配并只销毁自有句柄。其他插件的分配应存活。在独立进程中，工作方创建自己的流和分配，原来的指针／流数值不是有效共享合同。独立结果可以作为主机数据返回；显式进程间通信（IPC）需要新合同。常见错误是把设备选择视为全局、把入队视为完成、把上下文共享视为归属转移。

## 解答二：实现复核

单线程版本验证并记录两个实际设备，依次选择它们，分别创建流／缓冲区并启动带边界检查的填充。线程块大小为 128 时，257 个元素需要三个块，只有索引 0–256 写入。先等待各结果，再与独立 CPU 结果比较。预期值取决于所选序号 d，身份表则证明两个序号对应不同设备。

双工作线程版本保留同样的分配和比较合同。各工作线程在入口选择自己的设备并检查结果，在传输完成并验证后才返回；协调线程随后 join 并合并状态。另一种合法方案是通过显式生命周期协议返回完成句柄。两种变体都不调用 reset。分配／启动／完成错误都属于失败，不能变成空数组通过。受阻运行记录未满足门槛并保持待硬件验证（Pending Hardware Verification）。本解答不声称编译通过、执行重叠或计时结果。

## 练习题库复核

对 [PB-R6-001](/practice/#pb-r6-001)，在题设默认路径下，同进程两个插件使用同设备的主上下文。reset 该设备会使另一插件的资源失效，即使它们位于不同主机线程。正确清理只在最后使用后释放第一个插件的自有资源。独立进程拥有不同资源归属，但会改变共享架构，不能直接替换共享指针设计。库级归属协议才是直接修复。

## 自测答案

`cudaSetDevice` 对调用主机线程选择设备。默认路径运行时用户共享每进程每设备的一个主上下文。本地序号依赖可见性，不能建立跨进程共享。若线程只提交工作，join 不代表 GPU 完成。对等消费者会把缓冲区生命周期延长至最后访问。reset 清理的是上下文范围，而不是单个分配。这些解释不需要硬件，也不授予运行证据。
