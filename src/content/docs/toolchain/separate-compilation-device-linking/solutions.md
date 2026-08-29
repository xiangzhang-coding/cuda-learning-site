---
title: 'M18 参考解答：审查 device-link graph 与 build artifacts'
description: M18 三道练习的显式 RDC/device/host link graph、library/object/macro compatibility verdict，以及 artifact provenance 与 evidence repairs。
pairId: m18-solutions
counterpart: /en/toolchain/separate-compilation-device-linking/solutions/
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
unitId: M18-SOLUTIONS
prerequisites:
  - M18-EXERCISES
relatedUnits:
  - M18
  - EX10
  - M17
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m18-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M18-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M18-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M18,EX10,M17' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/separate-compilation-device-linking/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M18 练习（Exercise）](/toolchain/separate-compilation-device-linking/exercises/)作为 static symbol、link、artifact 与 evidence reviews 解答。它们不运行 compiler 或 executable，不替代 canonical EX10 source，也不建立 compilation、runtime 或 performance evidence。

## 解答 1：从 whole-program failure 到显式 link graph

Symbol ownership 是：`caller.cu` 声明并调用 external device `scale()`；`device_math.cu` 提供唯一 definition；`host_driver.cpp` 只有 host edge。普通 `nvcc -c` 生成 whole-program executable device code，不能为 caller 保留跨文件 external device reference，因此原计划在 device boundary 已经不成立，不能把修复责任交给 host linker。

Corrected ordered plan 是：

| Stage | Inputs | Required action | Output/state |
| --- | --- | --- | --- |
| RDC compile A | `caller.cu` | `-dc` 加 reviewed `compute_75`/`sm_75` clauses | `caller.o`，保留对 `scale` 的 relocatable reference |
| RDC compile B | `device_math.cu` | 相同 `-dc` 与 target contract | `device_math.o`，提供 relocatable definition |
| Host compile | `host_driver.cpp` | supported host compiler | `host_driver.o`，没有 device-link edge |
| Device link | `caller.o`, `device_math.o` | explicit `--device-link`、同一 final target set | `device_link.o`，解析 device reference |
| Host link | 三个 original objects 加 `device_link.o` | `nvcc --no-device-link ...` | final host artifact；不执行 |

`-dc` 的精确 expansion 是 `--relocatable-device-code=true --compile`。Graph edges 是 `caller.cu -> caller.o -> device_link.o`、`device_math.cu -> device_math.o -> device_link.o`，再由 `caller.o`、`device_math.o`、`host_driver.o` 与 `device_link.o` 一起进入 final host artifact。Device-link object 补充 linked device image，不替代 original objects 中的 host code/registration state。

本题 permitted conclusion 仅是计划完整表达了两个 link phases。没有 commands、exit statuses 与 artifacts，所以不能声称任何 phase actually succeeded。

## 解答 2：library、object compatibility 与 macro semantics

| Input | Device-link treatment | Mechanical verdict | Semantic/symbol result |
| --- | --- | --- | --- |
| `caller.o` | root RDC object | conditional on stated ABI/pointer/target contract | external references remain until definitions are selected |
| `libmath.a` | static archive is searchable by device linker | accept matching RDC member | its device definition can resolve the matching reference |
| `libplugin.so` | dynamic library is ignored by device linker | ignore for device link | device definition found only here remains unresolved, even if host linker later consumes `.so` |
| `future.o` from 13.3.1 | ordinary object input | reject under 12.9.2 linker | linker version is older than object Toolkit version |
| `variant.o` (`sm_86`, `compute_86`) | object input | mechanically conditional because problem grants link-compatible SM, same ABI, and pointer size | reject semantic-safety claim until macro behavior is repaired |

Device-link command 还要列出 final artifact 所需的全部 target architectures。`sm_80` 与题目明确声明 link-compatible 的 `sm_86` 只满足 mechanical target premise；不能从数字本身推导这种 compatibility，也不能把它扩展到其他 pair。

`variant.o` 的 shared-header weak template 在 `compute_80` 与 `compute_86` 下生成不同 behavior。Link 只保留一个同名 instance，所以 successful mechanical link 不能决定 caller 得到哪份 semantics。Repair 选择其一：让所有 affected objects 使用同一 compute architecture，或移除 shared-header function 对 `__CUDA_ARCH__` 的 behavior branch。Repair 后仍要重新 build/link 并记录结果。

## 解答 3：artifact pipeline 与 evidence packet

Corrected DAG 是 `caller.cu -> caller.o` 与 `device_math.cu -> device_math.o`；两个 RDC objects 共同进入 `device_link.o`；随后 **两个 original objects 加 `device_link.o`** 共同进入 `app`。Final link 使用 `--no-device-link`，因此不会把显式 device-link boundary 隐藏在第二次 implicit link 中。

Packet 至少缺以下 provenance：exact source commit、Toolkit Lane/NVCC version、OS 与 host compiler、dialect、pointer size、完整 target clauses、每个 compile/device-link/host-link command、input hashes、exit statuses、logs、output hashes，以及 link 前后 symbol ledger。只有四个 output hashes 不能重建这些 causal edges。

| Existing item | Permitted fact | Rejected claim |
| --- | --- | --- |
| Object/link hashes | named bytes had recorded digests | bytes 来自 claimed command 或 phase success |
| `device_link.o` filename | packet claims an artifact with that name | device symbols actually resolved、kernel executed/correct |
| Static symbol ledger（若后续提供） | inspection tool reported selected symbols | runtime loader selected image 或 launch succeeded |
| Final host artifact | intended host-link output | execution、correctness、latency、throughput、speedup |

Permitted reviewer statement 是：“Packet 描述了一个 intended RDC -> device link -> host link graph，并记录四个 unqualified hashes。缺少 exact provenance 与 phase records，因此 M18 不授予 compilation/runtime status，且没有 runtime 或 performance claim。”

EX10 的 Runtime-Not-Applicable 是 EX10 artifact-only acceptance 的独立 status，不传播给 M18 Learning Unit。M18 四个 evidence arrays 保持为空。

## 有效替代方案

- Production build 可以让 `nvcc <objects>` 隐式协调 device/host link，但 audit 必须仍能区分两个 phase results；本题要求 explicit split。
- 可以把 matching RDC definitions 放入 static archive，再让 device linker 搜索该 archive；不能换成 shared library 来满足同一 device reference。
- 可以统一 affected translation units 的 compute target，也可以重构 header，消除 `__CUDA_ARCH__` 驱动的同名 weak/template behavior。
- Compatibility 或 provenance 不完整时 fail closed，输出 conditional/indeterminate，而不是猜测 link success。

## 常见错误

- 认为 host separate compilation 自动允许跨 translation-unit device call。
- 只对 caller 或 definition 一侧使用 `-dc`。
- 把 `device_link.o` 当 final executable，或让它替代 original CUDA host objects。
- 因为 host linker 能消费 `.so`，就认为 device linker 也能从中解析 device symbol。
- 只比较 SM 数字，不检查 ABI、pointer size、link compatibility 与 linker/object Toolkit order。
- Mechanical link 通过后忽略 shared-header `__CUDA_ARCH__` semantic divergence。
- 把 hash、symbol listing、link object 或 final executable 当作 execution、correctness 或 performance evidence。

复核日期：**2026-08-29**。Compilation 与 runtime evidence axes 保持为空。
