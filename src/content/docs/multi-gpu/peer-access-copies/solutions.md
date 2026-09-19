---
title: 'G02 解答：等到最后一次读取完成'
description: 推导正确的对等依赖链和中转缓冲区生命周期。
pairId: g02-solutions
counterpart: /en/multi-gpu/peer-access-copies/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank-review, retrieval]
resourceKind: solution-set
unitId: G02-SOLUTIONS
prerequisites: [G02-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA peer access API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__PEER.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/peer-access-copies/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank-review,retrieval' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/peer-access-copies/solutions/" lang="en">Read the English counterpart</a>

## 先完成练习

精确先修 **[G02-EXERCISES]**：[对等访问练习](/multi-gpu/peer-access-copies/exercises/)。原创推导于 2026-09-19 根据 [SRC-CUDA-095](/sources-and-versions/#src-cuda-095) 复核，不含实测 GPU 输出。

## 解答一：分开四种合同

B 读取 A 需要 B→A 访问。查询成功且值为一，只允许尝试启用；查询本身不启用任何权限。G02 的保守拷贝策略检查并启用两个方向。零进入中转路径，其他意外 API 错误停止本轮。已有启用状态只记录，不声称归自己所有。清理只撤销本轮启用的权限。

选择 A，在 sA 提交生产者并记录 readyA。再选 B，在 sB 提交对已提交记录的等待、peer 拷贝、消费者，最后记录 doneB。同步 doneB 闭合依赖链。源在最后一次拷贝读取后释放，目标在最后消费者完成后释放。拷贝前用更强的主机等待也是正确、但并发性较低的方案。两者都不证明重叠。不能相减跨设备事件；使用本地区间或有明确完成边界的主机端到端时钟。能力位描述合法访问，不描述原子支持、物理路径或吞吐。

## 解答二：复核两条路径

每个长度、每个方向都独立产生 CPU 预言机（oracle）。两条路径的每个索引必须返回 `(i mod 251)+1`，包括 257 的尾部。最大 N 每设备使用 4,194,304 字节。直接路径采用 readyA→等待→拷贝→消费者顺序。中转路径使用可移植锁页存储，在 sA 生产→下载，主机同步后，在 sB 上传→消费，最终同步后才复用。这些是验收推导，不是已记录输出。

逐案例记录所选路径；强制中转不依赖 peer 能力。保留原始失败，不能用另一分支的成功替换错误。IOMMU／ACS 未知会阻塞直接 PCIe 测试；仍可评估独立本地传输。环境清单（Environment Manifest）包括精确版本、两个实际 CC 值、内存、归属、拓扑来源、权限和私有到公开的证据来源链。缺乏合格证据时，两种运行活动都保持待硬件验证（Pending Hardware Verification）。常见错误是只比校验和、提交后立即释放中转区、把单向兼容当双向。

## 练习题库复核

[PB-R6-002](/practice/#pb-r6-002) 即使双向权限已启用仍然错误：生产者完成不证明远端读取完成。保留 A 的分配，直到拷贝后记录的完成事件已同步，或保守地等到 doneB。之后选择所属设备并释放。如果 B 直接解引用 A 而不是拷贝，最后读者是消费者本身，此时拷贝完成不足以释放。这正是归属表必须列出实际最后使用者的原因。

## 自测答案

查询方向为访问者→分配所有者。失败使能力未知；成功返回零才证明不可用。启用授予权限，拷贝移动字节，事件／流依赖排列消费者。从未记录的事件不代表未来工作。允许跨设备事件等待，但耗时要求同设备事件。中转区复用须等待上传完成，而不只是提交。
