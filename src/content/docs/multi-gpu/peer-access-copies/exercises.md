---
title: 'G02 练习：区分权限与完成'
description: 修复对等依赖链，实现带校验的主机中转后备路径。
pairId: g02-exercises
counterpart: /en/multi-gpu/peer-access-copies/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: G02-EXERCISES
prerequisites: [G02]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA peer access API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__PEER.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/peer-access-copies/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G02 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/peer-access-copies/exercises/" lang="en">Read the English counterpart</a>

## 先修条件与说明

精确先修 **[G02]**：[对等访问与拷贝](/multi-gpu/peer-access-copies/)。复核于 2026-09-19；[SRC-CUDA-095](/sources-and-versions/#src-cuda-095)。纸面分析不需要 GPU。运行继承 G02 的原生 Linux、双 GPU、精确 CC／内存／驱动／Toolkit、单进程单线程、兼容性、IOMMU／ACS、拓扑来源和权限合同，以及完整环境清单（Environment Manifest）。未观察的运行工作均保持待硬件验证（Pending Hardware Verification）。

## 练习一：修复合成 peer 轨迹

**目标：**纸面修复以下提案：只查询 A→B，然后让 B 消费 A 的分配；readyA 从未记录就提交对它的等待；用 A 事件和 B 事件相减计时；生产者完成后立即释放源。

**约束：**分别标注访问方向与拷贝方向。采用 G02 的显式生产者→事件→等待→拷贝→消费者链。区分能力零、查询失败、已经启用及其他启用错误。不执行非法访问。

**验收：**查询所需方向，先记录再等待，保证事件记录的设备归属合法，拒绝跨设备事件计时，并使源存活到拷贝完成。说明能力位为何不能证明实际路径或远端原子支持。

<details><summary>提示一：读懂参数角色</summary>查询中的 device 是访问者，peerDevice 拥有被访问内存。载荷反向移动不会自动改变此定义。</details>
<details><summary>提示二：画出最后使用者</summary>生产者完成早于拷贝的最后一次读取。源所有者要等后一个完成边界才能释放。</details>

## 练习二：两条路径共用一个预言机

**目标：**为 G02 的 `N=1,257,1048576`、`uint32_t` 载荷实现直接拷贝与强制主机中转。A 产生 `i mod 251`，拷贝后 B 加一，再与 CPU 公式精确比较。交换角色重做。

**约束：**单进程、单提交线程；每 GPU 最大载荷 4 MiB，可移植锁页中转区 4 MiB。遵守直接路径平台门槛和双向策略。中转下载与上传之间设置阻塞完成边界，中转区必须存活到上传结束。检查所有 API、启动和完成错误，区分不可用与错误。正确性通过前不计时。

**验收：**所有案例逐元素比较输出，记录所选分支、归属与有序清理，保留完整清单和真实日志。即使支持 peer 也强制测试中转。直接分支受阻时明确保留其待硬件验证状态，不能把后备通过记成直接分支通过。强制分支检查应用行为，不证明运行时不透明拷贝实际如何路由。

<details><summary>提示一：共享预言机，不共享依赖错误</summary>两条路径都应独立符合 CPU 结果。两份 GPU 输出相等不够。</details>
<details><summary>提示二：复用也是依赖</summary>B 上传结束前不能覆盖中转区。可移植锁页分配本身不排列两个设备。</details>

## 单独复核

完成两个尝试后阅读[解答](/multi-gpu/peer-access-copies/solutions/)，再复核 [PB-R6-002](/practice/#pb-r6-002)。
