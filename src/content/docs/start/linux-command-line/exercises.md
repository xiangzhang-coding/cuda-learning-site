---
title: 'O05 练习：修复命令记录并设计复现包'
description: 修复会隐藏失败的管道日志命令，并设计可复核的构建与进程采集记录。
pairId: o05-exercises
counterpart: /en/start/linux-command-line/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O05-EXERCISES
prerequisites:
  - O05
relatedUnits:
  - O05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O05 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O05 }
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

<a class="locale-pair" data-locale-counterpart href="/en/start/linux-command-line/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O05：可复现的 Linux 命令行工作](/start/linux-command-line/)。这组练习（Exercise）只设计和审查原生 Linux（native Linux）命令记录，不需要 GPU，也不产生编译或运行证据。

## 作答方法

先提交自己的故障分析或记录设计，再按顺序打开两层提示。不得执行给出的命令，不得编造输出。完整复核内容位于独立的[参考解答页](/start/linux-command-line/solutions/)。

## 练习 1：修复误导性的管道日志

审查这段记录命令：

```bash
make -C "$build_dir" "$target" 2>&1 | tee "$record_dir/build.log"
printf '%s\n' "$?" >"$record_dir/build.exit"
```

**目标（Goal）：** 设计一条不会把 `tee` 成功误报为构建成功的修复方案，并明确合并日志是否只是便利视图。

**约束（Constraints）：** 必须解释重定向的从左到右顺序、`make` 与 `tee` 的独立状态、stdout/stderr 通道身份，以及是否保留终端实时显示。不得声称命令已经运行，也不得写任何预期输出。若保留 `tee`，必须处理每个管道阶段；若移除 `tee`，必须说明为什么独立日志更适合作为权威记录。

**预期证据（Expected evidence）：** 一份带注释的故障分析、一段修复后的命令或伪记录流程，以及明确的继续或失败政策。

**验收条件（Acceptance criteria）：** 失败的 `make` 不会被成功的 `tee` 遮住；`tee` 自己的失败也有处理；退出状态在被其他简单命令覆盖前保存；合并后不能恢复通道身份这一限制写清；没有虚构日志内容。

<details><summary>提示 1：先定位被记录的状态</summary>分别问管道默认返回谁的状态，以及 `2>&1` 在进入管道前对两个文件描述符做了什么。</details>

<details><summary>提示 2：再检查状态被覆盖的时刻</summary>Bash 的 `pipefail` 只能给出整体政策；要知道每一段，应考虑一个必须在下一条简单命令前复制的管道状态数组。</details>

## 练习 2：设计可复现的构建与进程记录

**目标（Goal）：** 为一次本地构建设计从开始到封存的记录包，使另一位学习者能复核命令坐标和失败边界，而不是猜测机器上发生了什么。

**约束（Constraints）：** 设计必须包含字面脚本与参数、逻辑和物理路径、明确构建阶段及工作目录、允许列表环境、工具和 `uname` 坐标、每阶段 UTC 时间与退出状态、独立 stdout/stderr、阶段前后进程快照、procfs 竞态与权限错误、最终 SHA-2 清单。不得收集整个未筛选环境，不得假定 `/proc/PID` 一定可读，不得填入任何实际观察值。

**预期证据（Expected evidence）：** 一个记录目录清单、一份有顺序的采集流程，以及每个文件回答的问题和失败时如何记载。

**验收条件（Acceptance criteria）：** 每个阶段能追溯到唯一命令、工作目录和状态；xtrace 被标为可选诊断而不是字面命令；进程快照有时间、PID 身份和采集错误边界；哈希只在文件关闭后计算且不包含自身；记录目录不会被构建清理删除。

<details><summary>提示 1：先按生命周期分组</summary>可以从 path、command、environment、system、stage、process、log、seal 八类产物开始，而不是罗列所有 Linux 命令。</details>

<details><summary>提示 2：再找无法一次捕获的事实</summary>进程会在采集中变化，PID 会复用，权限会拒绝字段。把“无法读取”保存为事实，并用开始与结束快照限制结论。</details>

## 下一步

对照独立的[参考解答](/start/linux-command-line/solutions/)，再到[练习题库（Practice Bank）PB-R1-002](/practice/#pb-r1-002)审查一份更完整的失败记录。
