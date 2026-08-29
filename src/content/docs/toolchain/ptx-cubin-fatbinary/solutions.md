---
title: 'M16 参考解答：审查 PTX、cubin、SASS 与 fatbinary artifacts'
description: M16 练习的 standalone/embedded artifact ledger、SASS-plus-PTX conditional selection tree，以及 lane-specific PTX 与 static inventory overclaim repairs。
pairId: m16-solutions
counterpart: /en/toolchain/ptx-cubin-fatbinary/solutions/
factCheckDate: '2026-08-29'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: M16-SOLUTIONS
prerequisites:
  - M16-EXERCISES
relatedUnits:
  - M16
  - M17
  - M18
  - EX10
  - VIS09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m16-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M16-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M16-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M16,M17,M18,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/ptx-cubin-fatbinary/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M16 练习（Exercise）](/toolchain/ptx-cubin-fatbinary/exercises/)作为 static artifact/evidence review 解答。它们不替代 canonical EX10 project，不生成 PTX/cubin/fatbinary，不调用 driver 或 JIT，不执行 kernel，也不建立 correctness 或 performance evidence。

## 解答 1：分类 standalone artifacts 与 embedded images

先分 carrier，再分 carrier 中的 image：

| Item | Artifact/carrier classification | Static check | 已建立 | 仍未知 |
| --- | --- | --- | --- | --- |
| `kernel.ptx` | standalone PTX text | 读取 `.version`、`.target` 与 module text | 文件声明的 PTX language/target coordinates | driver acceptance、JIT、execution |
| `kernel.cubin` | standalone architecture-specific CUDA ELF binary | binary utility 识别 ELF/cubin；需要时 disassemble | inspected cubin 的 target/sections/instructions | selection、load、execution |
| `kernel.fatbin` | standalone external fatbinary container | `cuobjdump` 的 ELF/PTX inventory | container 中列出的 cubin/PTX images | runtime 使用哪一个 image |
| `kernel.o` | host object，可能嵌入 fatbinary payload | 对 host object 做 static inventory | tool 实际列出的 embedded images | host link result 或 driver behavior |
| `app` | host executable，可能嵌入 fatbinary payload | 对 executable 做 static inventory | tool 实际列出的 embedded images | launch、selection、JIT、completion |
| SASS output | cubin machine instructions 的 retained disassembly view | `cuobjdump --dump-sass` 或 standalone cubin 的 `nvdisasm` | inspected binary 中呈现的 instructions | instructions 是否 loaded/executed |

Relationship 是 `source -> PTX and/or cubin -> fatbinary -> standalone .fatbin or embedded host payload`。PTX 与 cubin 也可以作为 standalone phase outputs；图中的关系不要求所有中间文件都 materialize。`cuobjdump` 可以检查 standalone cubin、external fatbinary 与 supported host binaries；`nvdisasm` 的 input boundary 是 standalone cubin。所有 runtime fields 必须保持 unknown。

## 解答 2：构造 SASS-plus-PTX fallback tree

任何 branch 之前先固定 coordinates：artifact hash；每个 image kind 与 declared virtual/real target；selected GPU identity/capability；loaded driver；使用的 selection/JIT observation mechanism。然后按条件推进：

| Branch | Static premise | Next transition | 可以写出的结论 |
| --- | --- | --- | --- |
| Applicable binary candidate | Inventory 有 cubin，independent target review 认为它可作为 current GPU/driver 的 binary load candidate | 收集 selection-specific observation | Observation 前只能写 candidate；observation 后才可写 selected cubin/SASS branch |
| PTX fallback candidate | 没有适用 binary image；inventory 有 PTX；driver acceptance 与 virtual-target assumptions 分别通过 | 收集 JIT-specific success/failure observation | Observation 前只能写 JIT candidate；之后只写观察到的 JIT result |
| No candidate | 没有适用 binary image，或 PTX 缺失/不被接受/assumptions 不适用 | 保留 load/launch error 或 unsupported record | 不能从 nonempty container 推断 executable path |

Binary selection 或 successful JIT 仍不等于 kernel execution。Execution 还需要 launch 与 completion；correctness 还需要 oracle；performance 还需要 correctness-qualified measurement。因此 decision tree 在这些 columns 都停止于 unestablished。

## 解答 3：修复 lane observations 与 image inventory 的过度声明

| 原 claim | 实际 observation | 合理 wording | 升级 claim 仍缺少的 evidence |
| --- | --- | --- | --- |
| PTX universally compatible | 三个 owner coordinates 标为 PTX ISA 7.8、8.8、9.3 | Selected Toolkit 11.8.0/12.9.2/13.3.1 Lanes 分别复核对应 archive/current documentation headings | Actual emitted `.version`/`.target`、driver acceptance 与 target-feature review |
| Driver selected SASS | Static inventory 有 cubin，disassembly 呈现 SASS | Artifact contains an inspected cubin/SASS candidate | Selected GPU/driver/artifact 上的 selection-specific observation |
| No JIT occurred | Static inventory 也有 PTX | PTX fallback is present; JIT is unobserved | JIT-specific observation bound to the same coordinates |
| Kernel executed | 没有 launch record | Execution is unestablished | Launch result、asynchronous error check、completion 与 Environment Manifest |
| Result is correct | 没有 output/oracle | Correctness is unestablished | Inputs、reference/invariant、comparison 与 pass/fail result |
| Binary path is faster everywhere | 没有 qualifying runs 或 samples | No performance claim | Defined comparison、correctness-qualified runs、raw samples、statistics 与 scope |

一份合格 corrected note 可以写成：

> 2026-08-29 source review 分别在 selected Toolkit 11.8.0、12.9.2 与 13.3.1 documentation coordinates 观察到 PTX ISA 7.8、8.8 与 9.3 headings；这些是 lane-specific observations，不是 universal compatibility claim。Static binary-utility inventory 在指定 host artifact 中列出 cubin 与 PTX images，并可从 inspected cubin 显示 SASS。该 inventory 没有观察 driver selection 或 JIT，也没有执行 kernel。因此 execution、correctness 与 performance 均未建立，unit evidence arrays 保持为空。

## 有效替代方案

- 用一张 normalized ledger，也可以用分开的 carrier table 与 image table，只要 embedded relationship 不丢失。
- Selection branch 的 observation mechanism 可以按真实 driver/tool contract 选择；答案不要求发明通用 selector。
- 若 JIT observation 不可取得，保持 indeterminate 比从 cache、startup delay 或 PTX presence 猜测更正确。
- 可以保留完整 disassembly 作为 artifact evidence，但 summary 必须指向 exact input hash/tool version，且不能升级为 execution evidence。

## 常见错误

- 把 `.ptx` suffix 当成足够的 version/target evidence。
- 把 cubin 与它的 SASS disassembly 当作两个独立 portable artifacts。
- 把 standalone `.fatbin`、embedded fatbinary payload 与整个 host executable 合并成同一类型。
- 看到 real-target image 就声称 driver selected it，或看到 PTX 就声称 JIT occurred。
- 把 PTX ISA 7.8、8.8、9.3 documentation observations 改写成 universal driver compatibility。
- 从 nonempty inventory 推断 execution、correctness 或 speedup。
- 省略 exact source commit、artifact hash、tool version、GPU/driver 与 completion/oracle/measurement boundaries。

复核日期：**2026-08-29**。Hardware gate 为 none；compilation 与 runtime evidence axes 保持为空。
