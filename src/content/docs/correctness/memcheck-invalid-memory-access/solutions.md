---
title: 'Q03 参考解答：限定 memcheck 调查结论'
description: Q03 练习的 six-case memcheck classification、three-lane command/coverage contract 与 corrected lifecycle investigation。
pairId: q03-solutions
counterpart: /en/correctness/memcheck-invalid-memory-access/solutions/
factCheckDate: '2026-08-28'
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
unitId: Q03-SOLUTIONS
prerequisites:
  - Q03-EXERCISES
relatedUnits:
  - Q03
  - Q04
  - EX16
  - LAB07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q03,Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/memcheck-invalid-memory-access/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案把 [Q03 练习（Exercise）](/correctness/memcheck-invalid-memory-access/exercises/)解成 command/coverage specifications，不包含 captured Compute Sanitizer output，也不提出 runtime claim。

## 解答 1：读取 log 前先分类六种 observation

| situation | classification | required response |
| --- | --- | --- |
| executed read at index `N` of `N` elements | precise supported out-of-bounds candidate | 修复 bound/address，再重跑同一 path |
| executed four-byte store at byte-offset-one address | precise supported misaligned candidate | 恢复 required alignment 或使用 valid representation，再重跑 |
| hardware exception without unique attribution | imprecise hardware report | 保存 raw report，缩小 reproducer，不虚构 thread/line |
| invalid expression in untaken branch | unexecuted path | 添加执行该 branch 的 input；本次 run 不能排除 defect |
| ordinary host-buffer overflow outside CUDA API | outside stated device-memcheck coverage | 使用 host-side checker，并修复 host ownership/bounds |
| ignored failing CUDA API return | supplemental API report 加 application defect | 立即 check return，在使用 dependent state 前 stop/recover |

前两项只有在 supported instrumented access 实际执行时才是 precise。Source line、address 与 thread coordinate 都属于 runtime data，因此本答案不猜测。

## 解答 2：为三个 lanes 设计一份 command contract

确认 lane-local help 后，在每个 installed lane 使用：

```sh
compute-sanitizer \
  --tool memcheck \
  --report-api-errors explicit \
  ./app [app_options]

compute-sanitizer \
  --tool memcheck \
  --report-api-errors explicit \
  --leak-check full \
  ./app [app_options]
```

对 11.8、12.9 与 current 分别记录 Toolkit version、driver、`compute-sanitizer --version`、OS、compiler/build flags、exact command、executable identity 与 raw-output location。12.9 row 要说明 archived Toolkit index 把 detailed tool manual 委托给 standalone docs，不能假装 today page 是 frozen 12.9 copy。

Path matrix 把 `{0, 1, B - 1, B, B + 1}` 中每个 `N` 与 launch geometry、expected in-bounds threads、expected guard-false threads 及每个 data branch 的两种 outcome 配对。Leak template 在 fresh process 中运行到 orderly teardown。可辩护的 clean statement 是：“在已记录 environment、command、inputs 与 executed paths 下，memcheck 在 documented coverage 内未报告 error。”它不涉及 unexecuted paths 或 numerical correctness。

## 解答 3：修复 lifecycle 与 investigation order

原 sequence 有四项独立 failure：unchecked API return、缺少 asynchronous completion/result validation、allocation ownership 不完整，以及 tool order 反转。一份 corrected control-flow contract 是：

```text
allocate A; check return
allocate B; check return or release A before exit
copy into A; check return and stop/recover on failure
launch kernel; check submission status
reach declared completion boundary; check asynchronous status
copy/observe output; run Q01 reference, exact checks, and invariants
release B; check return
release A; check return
reach orderly context/process teardown
```

先在 access memcheck 下运行 declared scenario；repair 后重复，直到满足 bounded access criterion。Lifetime 在 scope 内时，再用 full-leak command 贯穿 teardown。之后才按需进入 racecheck、initcheck 与 synccheck。每个 gate 记录自身 pass condition；它们不能互相替代，quiet racecheck result 也不能建立 access safety 或 output correctness。

## 有效替代方案

- 若额外 runtime cost 可接受且 scenario 总能到达 teardown，可让每次 memcheck invocation 都带 full-leak option。
- Application 拥有 Driver API context 时，可用 explicit driver-context destruction path 替代 runtime teardown。
- 若一次 access failure 会阻止 later paths 执行，可把 branch families 拆成 fresh-process scenarios。
- 核对 lane support 与 memory-pressure effect 后，可为 targeted global-overflow investigation 增加 documented allocation padding。

## 常见错误

- 把 current web manual 当作 frozen historical 12.9 document。
- 依赖 default API-report mode，而不是显式写 portable option。
- 把每个 hardware exception 都叫 precise。
- Context/process teardown 前就检查 leaks。
- 依靠 sanitizer API message，application 却不检查 return。
- 把 clean report 当成 unexecuted paths、correct numerical output 或 universal safety 的证明。
- Invalid accesses 尚未解决就先 run racecheck。
- 发布虚构 report lines、addresses 或 error counts。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
