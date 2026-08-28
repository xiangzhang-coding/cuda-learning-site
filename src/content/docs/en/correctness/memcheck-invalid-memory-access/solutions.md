---
title: 'Q03 Reviewed Solutions: Bound a memcheck investigation'
description: A six-case memcheck classification, three-lane command and coverage contract, and corrected lifecycle investigation for the Q03 Exercises.
pairId: q03-solutions
counterpart: /correctness/memcheck-invalid-memory-access/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/correctness/memcheck-invalid-memory-access/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [Q03 Exercises](/en/correctness/memcheck-invalid-memory-access/exercises/) as command and coverage specifications. They contain no captured Compute Sanitizer output and make no runtime claim.

## Solution 1: Classify six observations before reading a log

| situation | classification | required response |
| --- | --- | --- |
| executed read at index `N` of `N` elements | precise supported out-of-bounds candidate | correct the bound or address, then rerun the same path |
| executed four-byte store at byte-offset-one address | precise supported misaligned candidate | restore the required alignment or use a valid representation, then rerun |
| hardware exception without unique attribution | imprecise hardware report | preserve the raw report and narrow the reproducer without inventing a thread or line |
| invalid expression in an untaken branch | unexecuted path | add an input that executes the branch; this run supplies no clearance |
| ordinary host-buffer overflow outside a CUDA API | outside stated device-memcheck coverage | use host-side checking and repair the host ownership/bounds defect |
| ignored failing CUDA API return | supplemental API report plus application defect | check the return immediately and stop or recover before using dependent state |

The first two categories are precise only when they are supported instrumented accesses that execute. A source line, address, or thread coordinate would be runtime data, so none is guessed here.

## Solution 2: Design one command contract for three lanes

Use these templates in each installed lane after confirming lane-local help:

```text
compute-sanitizer --tool memcheck --report-api-errors explicit ./app [app_options]
compute-sanitizer --tool memcheck --report-api-errors explicit --leak-check full ./app [app_options]
```

For each of 11.8, 12.9, and current, record Toolkit version, driver, `compute-sanitizer --version`, OS, compiler/build flags, exact command, executable identity, and raw-output location. The 12.9 row notes that its archived Toolkit index delegates the detailed tool manual to the standalone documentation; it does not pretend that today's page is a frozen 12.9 copy.

The path matrix pairs each `N` in `{0, 1, B - 1, B, B + 1}` with launch geometry, expected in-bounds threads, expected guard-false threads, and both outcomes of every data branch. The leak template runs in a fresh process through orderly teardown. A defensible clean statement is: “For the recorded environment, command, inputs, and executed paths, memcheck reported no errors within the documented coverage.” It says nothing about unexecuted paths or numerical correctness.

## Solution 3: Repair a lifecycle and investigation order

The original sequence has four independent failures: an unchecked API return, no asynchronous completion/result validation, incomplete allocation ownership, and an inverted tool order. One corrected control-flow contract is:

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

Run the declared scenario first under access memcheck. Repair and repeat it until the bounded access criterion is met. Run the full-leak command through teardown when lifetime is in scope. Only then proceed to racecheck, initcheck, and synccheck as required. Each gate records its own pass condition; none substitutes for another, and a quiet racecheck result cannot establish access safety or output correctness.

## Valid alternatives

- Put the full-leak option on every memcheck invocation when the extra runtime cost is acceptable and the scenario always reaches teardown.
- Use an explicit driver-context destruction path instead of runtime teardown when the application owns a Driver API context.
- Split branch families into fresh-process scenarios when one access failure would prevent later paths from executing.
- Add documented allocation padding for a targeted global-overflow investigation after checking lane support and memory-pressure effects.

## Common errors

- Treating the current web manual as a frozen historical 12.9 document.
- Depending on a default API-report mode instead of spelling out the portable option.
- Calling every hardware exception precise.
- Inspecting leaks before context or process teardown.
- Relying on sanitizer API messages instead of checking returns in the application.
- Calling a clean report proof of unexecuted paths, correct numerical output, or universal safety.
- Running racecheck first while invalid accesses remain unresolved.
- Publishing invented report lines, addresses, or error counts.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
