---
title: 'M19 参考解答：构造 dialect matrix 并审查 C++23 probe'
description: M19 三道练习的 exact C++17/C++20 matrix、current-documentation/R1-history claim ledger，以及 supported GCC 14 retained-record publication gate。
pairId: m19-solutions
counterpart: /en/toolchain/cpp-dialect-boundaries/solutions/
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
unitId: M19-SOLUTIONS
prerequisites:
  - M19-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m19-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M19-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M19-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/cpp-dialect-boundaries/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案解答 [M19 练习（Exercise）](/toolchain/cpp-dialect-boundaries/exercises/)中的 static matrix 与 probe audits。它们不执行 EX10、不产生 retained record，也不更新 M19 Evidence Status。当前 retained GCC 14.2 C++23 probe 是 narrow pass；ordinary EX10 C++23 support 仍未声明。

## 解答 1：从 versioned sources 重建教学矩阵

正确 declaration matrix 是：

| Toolkit Lane | Ordinary EX10 builds | C++23 treatment | Source role |
| --- | --- | --- | --- |
| CUDA 11.8.0 | C++17 | 不声明 | Archived NVCC `--std` list 只到 C++17 |
| CUDA 12.9.2 | C++17、C++20 | 不声明 | Archived Linux guide 与 NVCC page 提供 C++20 coordinate |
| CUDA 13.3.1 | C++17、C++20 | Separate `cxx23-probe`，retained narrow pass | Current Programming/Linux guides 提供 eligibility；retained exact record 与 current NVCC list mismatch 阻止 broad claim |

Ordinary rows 属于 EX10 artifact pipeline 的声明输入；它们不是 M19 的 observed build results。C++23 probe 只属于 13.3.1 candidate，不加入 ordinary matrix。Current guide 不能向 archived 11.8.0/12.9.2 投射新 dialect，反过来 archive 的 ceiling 也不能描述 current compiler。

因此 M19 frontmatter compilation array 为空仍是正确的：该静态 Learning Unit 没有继承 EX10 status。EX10 的五项 ordinary records 已分别证明声明的 Lane/dialect combinations 为 Compile-Checked。

## 解答 2：分类 documentation mismatch 与 R1 probe

Claim ledger 如下：

| Input | 可以支持 | 不能支持 |
| --- | --- | --- |
| Current Programming Guide v13.3 | CUDA C++23 language surface；GCC 14、Clang 18、NVHPC 24.3 minima；MSVC 不支持 | 任一精确 source/environment 已成功 build |
| Current Linux Installation Guide v13.3 | Supported host-compiler ranges 与 C++23 dialect declaration | 某个 host/compiler pair 已接受 EX10 |
| Current NVCC `--std` reference | Published accepted-value list 仍只到 C++20，形成需保留的 documentation mismatch | 所有 C++23 attempts 都必然失败 |
| Retained EX02 R1 record | CUDA 13.3.1 + NVCC 13.3.73 + GCC 13.3.0 exact probe 为 `unsupported` | Supported GCC 14 的 result、其他 compiler 的 result 或 broad Toolkit conclusion |

Intersection rule 是：candidate host compiler 必须同时位于 Linux guide 的 supported major range，并达到 Programming Guide 对 selected dialect 的 minimum。GCC 13.3 不满足 C++23 的 GCC 14 minimum；GCC 14 candidate 仍要 actual probe，不能只靠 table eligibility。

精确 historical conclusion 应写成：“Retained R1 evidence records the requested C++23 probe as unsupported for EX02 under CUDA Toolkit 13.3.1, NVCC 13.3.73, and GCC 13.3.0; it neither contradicts nor broadens the separate retained EX10 GCC 14.2 narrow pass.” R1 record 保持 immutable，ordinary C++23 compilation evidence 继续为空。

## 解答 3：设计 C++23 retained-record publication gate

Qualifying checklist 按顺序是：

1. Pin exact EX10 source commit，并记录 canonical `cxx23-probe` range/file identity。
2. 记录 Native Linux runner/container、Toolkit 13.3.1、exact NVCC build 与 exact supported GCC 14 version。
3. 保留 exact compile command、complete stdout/stderr 与 exit status。
4. 证明 `__cplusplus >= 202302L`、`if consteval` 与 `static_assert` guard 在 selected mode 下通过。
5. 保留 `cxx23_probe.o` identity/hash 与 selected inspection output。
6. 明确 host/GPU executable 均未执行，runtime 为 Runtime-Not-Applicable，没有 correctness/performance observation。
7. 把 record 链接回 EX10/M19，并确认 source pin 与 narrow publication claim 一致。

Decision table 是：

| Candidate packet | Decision | Publication wording |
| --- | --- | --- |
| 只有 source、Dockerfile 或 workflow row | Reject | blocked/pending；no Compile-Checked |
| Retained GCC 13.3 R1 `unsupported` record | Preserve，不能升级 | exact historical unsupported only |
| GCC 14 command success，但缺 diagnostics、guard、artifact 或 retained identity | Reject | incomplete probe；no Compile-Checked |
| Complete retained GCC 14 pass packet | Publish retained narrow pass | exact EX10/Toolkit/NVCC/GCC/platform/phase claim only |

当前可接受的两句声明是：“At source commit `8b4af3965147f2ead99e72a73f5fe2f92fa0114b`, EX10 range `cxx23-probe` compiled and produced the retained object under CUDA Toolkit 13.3.1, NVCC 13.3.73, and GCC 14.2.0 on Ubuntu 24.04.4 LTS. Run 33271481405 establishes that narrow `C++23-Dialect-Probe` result; no host or GPU executable ran.”

这项声明不等于 ordinary EX10 C++23 support，也不覆盖其他 compiler、platform、source、runtime 或 performance。五项 ordinary C++17/C++20 records 的 Compile-Checked status 与这项 probe claim 分开记录。

## 有效替代方案

- Retained packet 可以使用 reproducible container digest 或等价的完整 Environment Manifest，只要 exact GCC 14 与 NVCC identity 可复核。
- Object inspection 可以保留 tool output 或 structured artifact ledger，但必须同时保留 object hash/identity，不能只写摘要。
- Future Clang 18 或 NVHPC 24.3 probes 可以形成各自独立的窄记录，但不能替代本发布门要求的 GCC 14 EX10 probe。
- Ordinary C++17/C++20 rows 可以独立取得自己的 records；它们不会自动升级 C++23 probe，C++23 probe 也不会升级 ordinary matrix。

## 常见错误

- 把 WG21 standard draft 当作 CUDA compiler support evidence。
- 因为 Programming Guide/Linux guide 列出 C++23 就发布 broad pass。
- 因为 current NVCC option list 只到 C++20 就发布 broad impossibility。
- 删除或覆盖 GCC 13.3 unsupported R1 record，而不是保留 exact historical scope。
- 把 workflow、Dockerfile、canonical source、site build 或 command exit 当作 retained probe record。
- 没有检查 language guard，导致 ignored option 冒充 requested dialect。
- 用 unsupported-host bypass 改变 probe question。
- 把 compile-only artifact result写成 runtime、GPU correctness 或 performance evidence。

复核日期：**2026-08-29**。Hardware gate 为 none，M19 compilation/runtime evidence arrays 保持为空。
