---
title: 'O08 参考解答：审查基准环境候选配置'
description: 两道 O08 练习的复核分诊与兼容性解答，包含推理、有效替代方案和常见错误。
pairId: o08-solutions
counterpart: /en/start/reference-environment-candidate/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O08-SOLUTIONS
prerequisites:
  - O08-EXERCISES
relatedUnits:
  - O08
  - EX01
  - LAB01
exampleIds:
  - EX01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o08-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O08,EX01,LAB01' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX01 }
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

<a class="locale-pair" data-locale-counterpart href="/en/start/reference-environment-candidate/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O08 练习（Exercise）](/start/reference-environment-candidate/exercises/)的**参考解答**。解答只复核基准环境候选配置（Reference Environment candidate）的推理和必需记录，不会把两份假设材料变成观察。目前没有声明任何基准环境（Reference Environment）。

## 解答 1：分诊不完整候选配置

这份接收记录只能支持缺口分析：

| 已给文字 | 仍然未知 | 审查结论 |
| --- | --- | --- |
| `Host: native Linux` | 发行版、版本、架构、kernel、container boundary、permission 和 maintainer control | 只写出了受支持环境（Supported Environment）这一环境族，没有形成完整 host coordinate |
| `GPU: 16 GB` | GPU identity、UUID、direct compute capability、count、实际可用 memory、feature 和所选设备 | 不能选择 GPU 能力层级（GPU Capability Tier） |
| `CUDA: 13.3` | KMD、driver-supported CUDA API、Toolkit patch/path、Runtime、NVCC、library、tool 和 host compiler | 兼容性为 `indeterminate` |
| `EX01: complete` | 精确 EX01 revision、command、raw output、date 和逐字段复核 | 不授予声明或证据状态（Evidence Status） |
| `Build: PASS` | subject、Lane、command、target、log、exit status 和 criteria | 不能证明编译已检查（Compile-Checked），也没有说明 runtime |

一份合格采集计划包含：

1. 把接收记录保存为未经验证的输入。直接查询 `name,compute_cap`，用 UUID 标识 GPU，并记录 visible/used count、memory、features 和 permissions。
2. KMD 与 CUDA UMD 或 `cudaDriverGetVersion()` 分开记录。再记录精确 Toolkit `X.Y.Z`、active path、`nvcc --version`、Runtime、相关 component version、host compiler 和 package record。
3. 补全 workload、source revision、input、shape、memory requirement、exact command、所选 C++ 方言、target、环境变量、correctness method、预声明 criteria、date、observer、log 和 artifact custody。
4. Capability、memory、count、feature 和 permission 都已知后才选择 tier。Driver、Toolkit、component、target 和必要 package facts 都已知后才重新做 compatibility triage。
5. 建立 maintainer control，准备一份独立 baseline protocol，result field 保持为空。不能为了填 worksheet 就擅自执行。

当前判断是：候选配置不完整，tier 为 `indeterminate`，compatibility 为 `indeterminate`，baseline 未执行，不作声明，也不授予 CUDA Evidence Status。每道判断门槛都需要这五行记录没有提供的坐标。即使另有 EX01 输出、一次构建、`nvidia-smi`、compatibility 结果或社区报告，只要完整门槛没有满足，仍然不足。

## 解答 2：复核兼容性判断与声明尝试

原判断使用了错误的 major-family floor。`525.60.13` 是所选 CUDA 12.9.2 Lane floor。CUDA 13.3.1 的 minor-version path 使用 `R580`，数值条件为 `>= 580`。Minor-version compatibility 只在同一个 CUDA major family 内适用，因此不能把 12.x floor 借给 13.x。

所以，给出的 KMD 与 Toolkit 不能证明普通 minor compatibility。只有记录该系统属于 NVIDIA eligible set、matching `cuda-compat-<major>-<minor>` package、正确的 user-mode library selection 和 feature exception 后，才能评估跨 major forward-package path。题目没有提供这些事实，诚实的 explorer outcome 是 `indeterminate`，不是 `documented-path`。

即使补全材料后得到 `documented-path`，它也只识别一条文档路径。仍然要按预声明标准做 runtime validation；explorer 不授予 Compile-Checked、社区已观察（Community-Observed）、运行已验证（Runtime-Verified）或 Reference Environment 声明。

题目中的 community `PASS` 没有附 manifest、log、criteria、date 或 maintainer reproduction，不能虚构这些材料。这份材料还缺少适用 tier、maintainer control 和单独指定的成功 baseline。修订后的判断是：**没有声明 Reference Environment；候选配置仍不具备声明条件，也不能授予 Runtime-Verified。** 先补全记录，修改或证明 compatibility path，预声明 baseline criteria，然后才能做受控 runtime validation。

## 有效替代方案

- 可以使用 Markdown table、structured JSON record 或逐门槛 review form，只要 unknown value 保持明确，五道声明门槛继续分开。
- Compute capability 可以通过 `nvidia-smi`、`cudaDeviceGetAttribute()`、`cuDeviceGetAttribute()` 或 NVML 直接查询。方法必须 direct、绑定具体设备、带日期，并与 raw result 一起保存。
- 可以用足够新的 documented driver stack 替换不确定的 forward-package route，简化候选配置。它仍需 component review 与 runtime validation，也不会自动授予证据。
- Baseline subject 可以与其他维护者的选择不同，但必须与 EX01 reporting 分开，写明精确 input 和 command，并在执行前声明 correctness criteria。

## 常见错误

- 把 `nvidia-smi` CUDA banner 当成 installed Toolkit，或把 `nvcc --version` 当成 KMD。
- 只凭 memory capacity 或产品名选择 GPU Capability Tier，不做 direct compute-capability query。
- 把 CUDA 12.x floor 借给 Toolkit 13.3.1，或假设 forward package 对所有 GPU 通用。
- 把 `documented-path` 读成“已经验证”，或把 `not-documented` 读成“可以先运行再解释”。
- 用 EX01 输出、成功 build、zero exit status 或 community `PASS` 代替 maintainer control 和 predeclared baseline。
- 看到输出后才写 baseline correctness criteria，或虚构缺失 log、version、package state 和 observation。

复核日期：**2026-08-26**。这些解答不包含机器观察、runtime result、性能数字或 Reference Environment 声明，也不授予 CUDA Evidence Status。
