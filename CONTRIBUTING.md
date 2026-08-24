<!-- SPDX-License-Identifier: Apache-2.0 -->

# Contributing to CUDA Learning Site

CUDA Learning Site accepts focused changes through GitHub Issues and Pull Requests. Open or join an Issue before starting substantial work so prerequisites, ownership, and acceptance criteria remain visible.

## Publication Pairs

Every learner-facing page ships as a complete Chinese and English Publication Pair. Counterparts must share facts, heading structure, code, visuals, metadata, source dates, and direct locale links while using natural prose in each language. Chinese prose introduces a controlled term with its canonical English form on first use.

Do not expose unfinished Learning Units or empty future sections in navigation. A development fallback does not satisfy pair completeness.

## Canonical Runnable Examples

A Runnable Example is a standalone source project and the only canonical executable form of its lesson code. Both locales must import the same declared ranges from that project. Do not maintain a complete copy in Markdown or MDX, and do not reconstruct an upstream sample under a project license.

Example changes must keep build inputs, displayed ranges, downloads, compatibility metadata, and compile checks pointed at the same source tree and commit.

## Evidence and environment claims

Compilation evidence and runtime Evidence Status are independent:

- **Compile-Checked** requires a successful build in the declared Toolkit Lane without GPU execution.
- **Community-Observed** records a contributor report and complete Environment Manifest without becoming maintainer runtime evidence.
- **Runtime-Verified** requires execution in a declared maintainer-controlled Reference Environment and satisfaction of the stated criteria.
- **Pending Hardware Verification** remains when required qualifying runtime evidence is absent.
- **Runtime-Not-Applicable** applies only when acceptance requires compilation or artifact inspection and no GPU behavior.

Web CI, expected output, a browser model, a skipped job, or a blocked provider grants none of these statuses. Never invent output, profiler data, timing, speedup, or performance claims.

Native Linux is the only Supported Environment. Other environments may be discussed as unsupported comparisons but create no setup, troubleshooting, Lab, or validation commitment.

## Accessibility

Keep semantic structure, logical keyboard order, visible focus, reduced-motion behavior, forced-colors support, 200% zoom/reflow, mobile layout, and print output usable in both locales. Visual Explainers require keyboard controls, a textual explanation, and a static fallback. Automated axe scans are a regression tool, not a WCAG conformance claim.

Run the applicable Chromium, Firefox, WebKit, and Mobile Safari emulation checks. Record any real-device or assistive-technology boundary precisely rather than generalizing from emulation.

## Sources, licenses, and attribution

Before using a library, framework, SDK, CLI, cloud interface, or version-sensitive CUDA fact:

1. Select the exact version and platform.
2. Query current documentation through Context7 when available.
3. Verify the target version against owner documentation, versioned source, release notes, specifications, or tests.
4. Record source URLs and the review date in the public source/version record when the fact affects learners or maintainers.

Original website source, tooling, and Runnable Example code use Apache-2.0. Original instructional prose and visual assets use CC BY 4.0. Upstream work retains its own license and notices.

An adaptation requires the exact upstream file and release, governing license, attribution, required notices, and a description of modifications before publication. Link and paraphrase owner documentation by default; do not copy figures, tables, substantial prose, or sample listings without an explicit reviewed need and permission.

## Public and private boundary

Commit only material needed to build, test, understand, and contribute to the public Learning Site. Maintainer-only governance, rationale, local planning, research corpora, agent configuration, credentials, secrets, private host paths, and copyrighted working material must stay outside source, history, archives, generated output, reports, screenshots, traces, previews, and deployments.

The source allowlist and forbidden-content checks are release gates. `.gitignore` alone is not a privacy control. Never paste a credential into an Issue, Pull Request, workflow, fixture, snapshot, or log.

## Pull request checks

Use Node.js 24.19.0 and npm 11.17.0. Install from the committed lockfile and run the public release checks:

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

Pull Requests must explain the learner-visible change, source and license review, Publication Pair impact, test evidence, environment/evidence impact, and any unresolved external blocker. Web quality success never upgrades CUDA compilation or runtime status.
