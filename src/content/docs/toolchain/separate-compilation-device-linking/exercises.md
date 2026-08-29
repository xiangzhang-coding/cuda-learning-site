---
title: 'M18 练习：审查 device-link graph 与 build artifacts'
description: 用三道静态任务修复 cross-translation-unit RDC pipeline，审查 library/object compatibility 与 __CUDA_ARCH__ 风险，并把 link artifacts 和 evidence claims 分开。
pairId: m18-exercises
counterpart: /en/toolchain/separate-compilation-device-linking/exercises/
factCheckDate: '2026-08-29'
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
unitId: M18-EXERCISES
prerequisites:
  - M18
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
    attrs: { name: 'cuda:pair-id', content: m18-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M18-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M18 }
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

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/separate-compilation-device-linking/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M18：分离编译与设备链接](/toolchain/separate-compilation-device-linking/)。这些练习只创建 symbol/link graphs、command plans、compatibility matrices 与 evidence ledgers；不调用 `nvcc`、不产生 artifact，也不执行 CUDA，因此不增加 Evidence Status。

## 作答方法

每道题都标出 declaration、definition、translation unit、RDC object、device-link input/output、host-link input/output 与 unresolved symbol。再记录 target、ABI、pointer size、Toolkit linker version、library kind 和 `__CUDA_ARCH__` behavior。完成三份独立 audit 后再查看[参考解答](/toolchain/separate-compilation-device-linking/solutions/)。

## 练习 1：把 whole-program failure 重建为显式 link graph

**目标：** `caller.cu` 中的 kernel 调用 `device_math.cu` 才定义的 external `__device__ scale()`；`host_driver.cpp` 只调用一个 host launch wrapper。原计划分别执行 ordinary `nvcc -c`，随后把 objects 直接交给 host linker。指出 failure boundary，并重写为 source -> RDC objects -> device-link object -> final host artifact 的 graph 与 ordered command plan。

**约束：** 两个 CUDA translation units 都必须使用 `-dc`，并说明其 long-option equivalence；所有 device compile/device-link rows 使用同一 reviewed `compute_75`/`sm_75` target contract；device link 必须显式命名 output；final host link 必须消费两个 original CUDA objects 与 device-link object，并用 `--no-device-link` 保持 phase boundary。Pure-host object 不得虚构 device-link edge。不得执行 final artifact。

**预期证据：** Symbol ownership table、五节点以上的 directed link graph、四阶段 command ledger、每个 artifact 的 unresolved/resolved state，以及独立的 device-link/host-link acceptance checks。

**验收条件：** Whole-program objects 被拒绝，因为 caller 的 external device reference 跨 translation unit；`-dc` 被写为 `--relocatable-device-code=true --compile`；`caller.o` 与 `device_math.o` 同时进入 device link；`device_link.o` 只作为 host-link input；original CUDA objects 也进入 final host link；没有 runtime/performance claim。

<details><summary>提示 1</summary>先画 device symbol edge `caller.o -> scale definition`，再画 host artifact edges；host linker 不能替 device linker解析前一条 edge。</details>

<details><summary>提示 2</summary>`device_link.o` 不替代 original CUDA host objects；它补充 linked device image，而 original objects 仍可能携带 host registration code。</details>

## 练习 2：审查 library、object compatibility 与 macro semantics

**目标：** 一次 64-bit Toolkit 12.9.2 device link 以 `caller.o` 为 root。`libmath.a` 含同 ABI、same pointer size、`compute_80`/`sm_80` RDC definition；`libplugin.so` 含另一个唯一 device definition；`future.o` 由 Toolkit 13.3.1 生成；`variant.o` 具有 same ABI/pointer size 和题目明确给出的 link-compatible `sm_86` code，但用 `compute_86` 编译，并与 `caller.o` 从同一 header instantiate 一个 behavior 依赖 `__CUDA_ARCH__` 的 weak template。分别给出 mechanical-link 与 semantic-safety verdict。

**约束：** 区分 static archive 与 shared library 在 device linker/host linker 中的 treatment；检查 linker Toolkit version 不早于 objects；检查 ABI、pointer size、link-compatible SM 与 desired target set；不能因为题目声明 `sm_80`/`sm_86` link-compatible 就忽略 different compute assumptions。为每项 input 写 accept、ignore、reject 或 conditional，并说明 unresolved symbols。

**预期证据：** 五行 input matrix、device-symbol resolution graph、target/linker-version gate、mechanical-versus-semantic verdict，以及两种 `__CUDA_ARCH__` repair 中至少一种。

**验收条件：** `libmath.a` 可以被 device linker 考虑；`.so` 被 device linker 忽略，因此其唯一 device definition 不能解析 reference；12.9.2 linker 拒绝更新 Toolkit 生成的 `future.o`；`variant.o` 即使通过 mechanical gates 也不能在当前 shared-header behavior 下判定 semantic-safe；repair 要求 same compute architecture 或移除 shared-header macro-dependent behavior。

<details><summary>提示 1</summary>“Host linker 能加载 `.so`”与“device linker 会从 `.so` 解析 device symbol”是两个不同命题。</details>

<details><summary>提示 2</summary>把 compatibility 分成两层：先问 objects 能否机械链接，再问同名 weak/template definition 是否在每个 translation unit 中表达相同行为。</details>

## 练习 3：修复 artifact pipeline 与 evidence packet

**目标：** 一个 packet 声称已生成 `caller.o`、`device_math.o`、`device_link.o` 与 `app`。Final host command 只传 `caller.o`/`device_link.o`，没有 `device_math.o`，也没有禁止隐式 device link。Packet 只有四个 hashes，没有 exact source commit、Toolkit Lane、host compiler、full commands、exit status、target set 或 symbol ledger，却声称“device link 成功证明 kernel 正确运行，并使程序更快”。修复 pipeline 与 permitted claim。

**约束：** 保持 EX10 canonical order：`device-link-contract` 后接 `artifact-pipeline`；写出 explicit RDC compile、device link、`--no-device-link` host link 与 static inspection 四个 boundaries；列出每项 qualifying compilation record 所缺字段；final artifact 不执行。M18 的 compilation/runtime/observation arrays 保持为空，不能继承 EX10 的 Runtime-Not-Applicable status。

**预期证据：** Corrected artifact DAG、final host-link input list、provenance gap table、artifact-to-claim classification，以及一条不超过两句的 permitted reviewer statement。

**验收条件：** Final host link 同时消费 `caller.o`、`device_math.o` 和 `device_link.o`，并显式禁止重做 device link；hash 只绑定 bytes；symbol ledger 只记录 static symbol observations；缺少 qualifying records 时不授予 Compile-Checked；任何 link artifact 都不证明 execution、correctness、latency、throughput 或 speedup。

<details><summary>提示 1</summary>把每个 hash 左侧补上“由哪个 exact command、在什么 Lane、从哪些 input bytes 生成”，就能看出 packet 缺少哪些 provenance。</details>

<details><summary>提示 2</summary>Final executable 是 host-link output；除非另有 execution/completion/oracle record，否则名称中的 “executable” 也不是运行证据。</details>

## 下一步

完成后查看独立的[参考解答](/toolchain/separate-compilation-device-linking/solutions/)，再审查[练习题库（Practice Bank）PB-R2-010](/practice/#pb-r2-010)。使用 [TERM-037](/glossary/#term-037)、[TERM-122](/glossary/#term-122)、[TERM-123](/glossary/#term-123)与 [TERM-124](/glossary/#term-124)标注 graph nodes 和 phase boundaries，并对照 related [EX10](/examples/ptx-fatbinary-inspection/)与 [M17](/toolchain/compiler-architecture-targets/)。
