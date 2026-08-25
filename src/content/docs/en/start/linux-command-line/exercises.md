---
title: 'O05 Exercises: Repair Command Records and Design a Reproduction Package'
description: Repair a pipeline log command that can hide failure, then design a reviewable build and process capture record.
pairId: o05-exercises
counterpart: /start/linux-command-line/exercises/
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

<a class="locale-pair" data-locale-counterpart href="/start/linux-command-line/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O05: Reproducible Linux Command-Line Work](/en/start/linux-command-line/) first. These Exercises design and review native Linux command records only. They require no GPU and produce no compilation or runtime evidence.

## How to answer

Submit your own fault analysis or record design before opening the two hints in order. Do not execute the supplied commands or invent output. Full review material lives on the separate [reviewed-solutions page](/en/start/linux-command-line/solutions/).

## Exercise 1: Repair a misleading pipeline log

Review this record command:

```bash
make -C "$build_dir" "$target" 2>&1 | tee "$record_dir/build.log"
printf '%s\n' "$?" >"$record_dir/build.exit"
```

**Goal:** Design a repair that cannot report build success merely because `tee` succeeded, and state whether the combined log is only a convenience view.

**Constraints:** Explain left-to-right redirection, the independent `make` and `tee` statuses, stdout/stderr channel identity, and whether live terminal display remains. Claim no execution and write no expected output. If retaining `tee`, handle every pipeline stage. If removing it, explain why separate logs are the authoritative record.

**Expected evidence:** An annotated fault analysis, a corrected command or record procedure, and an explicit continue-or-fail policy.

**Acceptance criteria:** A failing `make` cannot be hidden by a successful `tee`; a `tee` failure is also handled; statuses are preserved before another simple command overwrites them; the inability to recover channel identity after merging is stated; no log content is invented.

<details><summary>Hint 1: locate the recorded status</summary>Ask which command supplies default pipeline status and what `2>&1` does to the two descriptors before they enter the pipe.</details>

<details><summary>Hint 2: inspect when status is overwritten</summary>Bash `pipefail` supplies an aggregate policy. To identify every stage, look for a pipeline-status array that must be copied before the next simple command.</details>

## Exercise 2: Design a reproducible build and process record

**Goal:** Design a start-to-seal record package for one local build so another learner can review command coordinates and failure boundaries without guessing what happened on the machine.

**Constraints:** Include the literal script and arguments, logical and physical paths, explicit build stages and working directories, an allowlisted environment, tool and `uname` coordinates, per-stage UTC times and exit statuses, separate stdout/stderr, process snapshots before and after, procfs race and permission errors, and a final SHA-2 manifest. Do not collect the entire unfiltered environment, assume `/proc/PID` is readable, or fill in any observed value.

**Expected evidence:** A record-directory inventory, an ordered collection procedure, and an explanation of the question each file answers and how a failure is represented.

**Acceptance criteria:** Every stage maps to one command, working directory, and status; xtrace is optional diagnostics rather than literal command input; process snapshots carry time, PID identity, and collection-error boundaries; hashes are computed only after files close and exclude their own manifest; build cleanup cannot remove the record directory.

<details><summary>Hint 1: group by lifecycle first</summary>Start with path, command, environment, system, stage, process, log, and seal artifacts instead of listing every Linux command you know.</details>

<details><summary>Hint 2: find facts that cannot be captured at once</summary>Processes change during collection, PIDs are reused, and permissions deny fields. Preserve “unreadable” as a fact and bound conclusions with start and finish snapshots.</details>

## Next step

Compare with the separate [reviewed solutions](/en/start/linux-command-line/solutions/), then inspect a fuller failure record in [Practice Bank PB-R1-002](/en/practice/#pb-r1-002).
