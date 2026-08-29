---
title: 'M19 练习：构造 dialect matrix 并审查 C++23 probe'
description: 用三道静态 matrix/probe 任务重建 C++17/C++20 Lane 声明，分类 current documentation 与 immutable R1 history，并设计 supported GCC 14 retained-record publication gate。
pairId: m19-exercises
counterpart: /en/toolchain/cpp-dialect-boundaries/exercises/
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
unitId: M19-EXERCISES
prerequisites:
  - M19
relatedUnits:
  - M19
  - EX02
  - EX10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m19-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M19-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M19 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M19,EX02,EX10' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/cpp-dialect-boundaries/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M19：CUDA C++17、C++20 与 C++23 方言边界](/toolchain/cpp-dialect-boundaries/)。这些练习只构造 matrices、claim ledgers 与 probe packets；不执行 compiler、host executable 或 GPU executable，也不增加 Evidence Status。

## 作答方法

每份答案都要分开 language-standard provenance、Toolkit/NVCC declaration、host compiler gate、requested compilation phase、actual retained record 与 claim scope。不要把 source eligibility、workflow definition 或 static page build 写成 probe result。完成三道题后再查看[参考解答](/toolchain/cpp-dialect-boundaries/solutions/)。

## 练习 1：从 versioned sources 重建教学矩阵

**目标：** 根据三条 selected Toolkit Lanes 重建 M19/EX10 dialect matrix。已知 11.8.0 NVCC option reference 列到 C++17；12.9.2 Linux guide/NVCC 列到 C++20；13.3 current Programming Guide/Linux guide 列出 C++23，但 current NVCC option reference 仍只列到 C++20。

**约束：** Matrix 必须分别列出 Toolkit、ordinary EX10 builds 与 C++23 treatment。只允许 11.8.0 的 C++17、12.9.2 的 C++17/C++20、13.3.1 ordinary EX10 的 C++17/C++20。C++23 只能作为 13.3.1 separate `cxx23-probe`，不得进入 ordinary row 或向旧 Lanes 回填。

**预期证据：** 一张三行 matrix、一段 declaration-versus-evidence 说明，以及每行对应的 owner-source role。

**验收条件：** 三行与指定 dialect 完全一致；五项 ordinary row 根据 retained run 33271481405 标为 Compile-Checked；13.3.1 C++23 标为独立 retained narrow probe pass；11.8.0/12.9.2 没有 C++23 row。

<details><summary>提示 1</summary>先写 ordinary rows，再单独添加 probe column；不要从 newest guide 向 archive 反向推断。</details>

<details><summary>提示 2</summary>“Declared build row”回答将检查什么，“retained pass record”才回答检查是否通过。</details>

## 练习 2：分类 documentation mismatch 与 R1 probe

**目标：** 审查四项输入：current Programming Guide 的 C++23 entry、current Linux guide 的 supported C++23 dialect、current NVCC `--std` list 只到 C++20，以及 retained EX02 CUDA 13.3.1/NVCC 13.3.73/GCC 13.3.0 `unsupported` record。写出每项能支持和不能支持的 claim。

**约束：** 必须记录 current guide 的 C++23 minima：GCC 14、Clang 18、NVHPC/`nvc++` 24.3，Microsoft Visual Studio/MSVC 不支持。必须把 GCC 13.3 record 保持为 immutable R1 history，并说明它低于 GCC minimum。不得从 documentation mismatch 推出 broad pass 或 broad failure。

**预期证据：** 四行 claim ledger、一个 supported-host intersection rule，以及一句精确的 R1 historical conclusion。

**验收条件：** Owner docs 与 observed records 分层；GCC 13.3 result 只约束 exact historical combination；GCC 14.2 probe pass 只约束 exact EX10/Toolkit/NVCC/GCC coordinate；ordinary C++23 Compile-Checked 仍未声明。

<details><summary>提示 1</summary>Programming Guide 的 dialect-specific minimum 与 Linux guide 的 broad supported range 是 intersection，不是二选一。</details>

<details><summary>提示 2</summary>历史 unsupported record 可以反驳“GCC 13.3 已通过”，但不能预测尚未执行的 GCC 14 probe。</details>

## 练习 3：设计 C++23 retained-record publication gate

**目标：** 一位 reviewer 看到了 EX10 `cxx23-probe` source、GCC 14 Dockerfile、workflow row 与 retained pass，准备发布 broad “CUDA 13.3.1 supports C++23”。修复这项 proposal，并审查 qualifying record packet 的精确范围。

**约束：** 以 retained run 33271481405、source commit `8b4af3965147f2ead99e72a73f5fe2f92fa0114b`、canonical range `cxx23-probe`、CUDA 13.3.1、NVCC 13.3.73 与 GCC 14.2.0 为准。Packet 必须保留 environment identity、command、complete diagnostics、exit status、language guard outcome、object hash/inspection 与 no-execution statement。不得使用 unsupported-host bypass；结论只能是 `C++23-Dialect-Probe` narrow pass，不能写 ordinary C++23 support。

**预期证据：** Ordered gate checklist、pass/reject decision table，以及一段不超过两句的 admissible narrow claim template。

**验收条件：** Source/workflow presence 与 actual result 分开；`__cplusplus >= 202302L`、`if consteval`/`static_assert` guard 被纳入检查；host/GPU executable 都不执行；successful record 只支持 exact EX10 + Toolkit 13.3.1 + NVCC 13.3.73 + GCC 14.2.0 combination；其他 compiler、platform、runtime 与 performance claim 均被拒绝。

<details><summary>提示 1</summary>Retained record URL/identity 允许发布 exact narrow pass，但不能扩大 subject 或 matrix。</details>

<details><summary>提示 2</summary>把 scope 写到句子里：source、Toolkit、NVCC、GCC、platform、phase 与 no-runtime boundary 缺一不可。</details>

## 下一步

完成后查看独立的[参考解答](/toolchain/cpp-dialect-boundaries/solutions/)，再审查[练习题库（Practice Bank）PB-R2-011](/practice/#pb-r2-011)。使用 [TERM-125](/glossary/#term-125)、[TERM-116](/glossary/#term-116)与 [TERM-117](/glossary/#term-117)保持 dialect、host compiler 与 compilation phase 的 scope 分离。
