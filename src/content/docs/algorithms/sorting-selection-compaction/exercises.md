---
title: 'A09 练习：Flag Scan、Stable Bucket Rank 与 Production Decision'
description: 用 exact flag/scan/scatter table、bounded-key stable movement 和 CUB/Thrust/custom decision packet 复核 selection、compaction 与 sorting。
pairId: a09-exercises
counterpart: /en/algorithms/sorting-selection-compaction/exercises/
factCheckDate: '2026-08-31'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: A09-EXERCISES
prerequisites:
  - A09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a09-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/sorting-selection-compaction/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A09 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/sorting-selection-compaction/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [A09](/algorithms/sorting-selection-compaction/)。这些练习只创建静态 tables 与 decision records，不运行 CUDA、CUB 或 Thrust。

## 作答说明

每题分别写 operation semantics、ownership、movement 与 evidence。完成三题后再看[复核解答](/algorithms/sorting-selection-compaction/solutions/)。

## 练习 1：从 flags 推导 stable compaction

**目标：** 对 values `[8,3,5,4,9,2]` 与 even predicate，写 flags、exclusive positions、每个 selected scatter destination、output 与 count。

**约束：** 保留 original order；每个 destination 唯一；不得用 atomic arrival order 代替 prefix rank；处理最后一个 flag 的 count formula。

**预期证据：** 六行 `index/value/flag/position/destination` table、output vector 与 count proof。

**验收条件：** Flags 是 `[1,0,0,1,0,1]`，positions 是 `[0,1,1,1,2,2]`，output 是 `[8,4,2]`，count 是 3。

<details><summary>提示 1</summary>Exclusive position 只计数当前 index 之前的 1。</details>

<details><summary>提示 2</summary>`count = position[5] + flag[5]`。</details>

## 练习 2：补齐 bounded-key stable sorting 的缺口

**目标：** 对 keys `[2,0,1,2,1,0]`，写 histogram counts、exclusive bin starts、每个 item 的 stable within-bin rank、destination 与 sorted output。

**约束：** Key domain 只有 0、1、2；equal keys 保持 input order；必须说明 histogram+scan 后为何仍需要 per-item rank；不得从 atomic increments 声称 stability。

**预期证据：** Counts/starts table、六行 movement ledger、sorted keys 与 stability proof。

**验收条件：** Counts `[2,2,2]`，starts `[0,2,4]`，destinations `[4,0,2,5,3,1]`，output `[0,0,1,1,2,2]`。

<details><summary>提示 1</summary>Within-bin rank 是当前 item 之前相同 key 的数量。</details>

<details><summary>提示 2</summary>Destination 等于 `bin_start[key] + rank`。</details>

## 练习 3：写 production algorithm decision packet

**目标：** 为 32-bit key/value pairs 的 stable ascending sort 和 predicate compaction，比较 CUB `DeviceRadixSort`/`DeviceSelect`、Thrust `stable_sort`/`copy_if` 与 custom composition。

**约束：** 固定 CCCL v3.4.2，并明确它只覆盖 latest-patch Toolkit 12.x/13.x、不能用于 11.8 lane；记录 semantics、types、stability、temporary storage、stream/execution policy、correctness fixtures、maintenance 与 measurement plan；没有 measured data。

**预期证据：** 三路径 decision matrix、拒绝或选择条件、需要未来观测的字段。

**验收条件：** Packet 不把教学 composition 当 production default；不宣布任何路径更快；custom path 只有在 API mismatch 或 measured need 与维护责任都成立时才进入候选。

<details><summary>提示 1</summary>先按 required semantics 淘汰不匹配路径，再谈 measurement。</details>

<details><summary>提示 2</summary>Temporary-storage query 不是 runtime performance result。</details>

## 下一步

查看[复核解答](/algorithms/sorting-selection-compaction/solutions/)，再审查 [PB-R2-021](/practice/#pb-r2-021)及 CCCL v3.4.2 exact owner sources。
