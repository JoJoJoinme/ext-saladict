# Fork Comparison

Date: 2026-04-12

Upstream base:

- https://github.com/crimx/ext-saladict

This comparison focuses on forks that are either:

- explicitly attempting MV3
- recently updated
- or visible enough to be worth comparing

The goal is not to survey every fork. The goal is to identify approaches worth
learning from.

## 1. Forks Reviewed

### 1.1 `doraemonkeys/ext-saladict`

- Repo: https://github.com/doraemonkeys/ext-saladict
- Why reviewed:
  - highest visible star count among active forks in the current fork set
  - explicitly claims MV3 support in README
  - still keeps a large part of the original repo shape

### 1.2 `XZJIsme/ext-saladict-mv3`

- Repo: https://github.com/XZJIsme/ext-saladict-mv3
- Why reviewed:
  - explicit MV3 fork
  - recently updated
  - uses a much smaller rewrite instead of preserving the original structure

### 1.3 `zpwc/ext-saladict-2manifestv3`

- Repo: https://github.com/zpwc/ext-saladict-2manifestv3
- Why reviewed:
  - explicit MV3 fork target
  - useful as a comparison point for an incomplete migration attempt

## 2. High-Level Classification

### 2.1 `doraemonkeys/ext-saladict`

Approach:

- keep the original webpack/neutrino project shape
- move to MV3 service worker
- add a dedicated `src/offscreen/` area
- keep most dictionary execution in background
- add a custom fetch-based axios adapter for service worker compatibility

Key signs:

- MV3 manifest fragment in `src/manifest/chrome.manifest.json`
- offscreen lifecycle in `src/offscreen/lifecycle.ts`
- offscreen runtime in `src/offscreen/offscreen.ts`
- axios MV3 patch in `src/_helpers/axios-fetch-adapter.ts`
- background state persistence in `src/background/state.ts`

### 2.2 `XZJIsme/ext-saladict-mv3`

Approach:

- build a much smaller standalone MV3 extension at repo root
- keep the old project archived under `old-salad-archive/`
- reimplement only a subset of the original product

Key signs:

- root-level `manifest.json`
- root-level `background.js`
- root-level `offscreen.html` / `offscreen.js`
- no original build/test toolchain at the active root

### 2.3 `zpwc/ext-saladict-2manifestv3`

Approach:

- mostly retain the original webpack repo
- still documents the work as not yet implemented
- does not show a complete MV3 runtime separation

Key signs:

- README explicitly says the work is not implemented yet
- no dedicated offscreen runtime files found
- background still uses old `window.*` assumptions

## 3. Comparison Against Our Current Branch

Our current branch differs from the reviewed forks in several structural ways.

### 3.1 Build System

Our branch:

- WXT + Vite
- explicit MV3-oriented build output
- Playwright-based real-extension validation

`doraemonkeys`:

- webpack 4 / old project shape
- custom compatibility patches layered on top

`XZJIsme`:

- no preserved original build chain at active root
- appears closer to a hand-written minimal extension

`zpwc`:

- original webpack 4 toolchain retained
- no visible modern MV3-oriented build migration

### 3.2 Offscreen Strategy

Our branch:

- hidden offscreen is used for DOM-only work
- config/profile/cookie/DNR preparation stays in background
- no visible offscreen fallback page in production path
- background/offscreen contract is explicit

`doraemonkeys`:

- offscreen is used for audio + clipboard
- dictionary execution appears to remain in background service worker
- uses axios fetch adapter to make SW requests possible

`XZJIsme`:

- offscreen handles audio only in a minimal setup
- overall feature surface is much smaller

`zpwc`:

- no visible dedicated offscreen execution architecture in the current branch

### 3.3 State Model

Our branch:

- background caches storage-backed state
- hidden offscreen receives execution payloads
- MV3 runtime boundary is documented and enforced by tests

`doraemonkeys`:

- interesting idea: persist service worker critical state to
  `chrome.storage.session`
- background getters are synchronous after restore

`zpwc`:

- still uses `window.appConfig`, `window.activeProfile`, `window.profileIDList`
  in background code
- that is an MV2 mental model, not a clean MV3 one

### 3.4 Test Strategy

Our branch:

- acceptance tests
- Playwright real-extension E2E
- required gate
- MCP manual verification

`doraemonkeys`:

- still has Jest-era test tree
- no visible acceptance/E2E gate equivalent in the reviewed branch

`XZJIsme`:

- no visible mature automated validation setup in the active root

`zpwc`:

- inherits old test tree but does not show a completed MV3 verification story

## 4. Strengths and Weaknesses

### 4.1 Our Current Branch

Strengths:

- strongest verification story among reviewed branches
- cleanest current MV3 boundary between background and offscreen
- hidden offscreen works without user-visible fallback
- modernized build and test setup

Weaknesses:

- bigger migration surface
- more moving parts than a minimal rewrite
- still inherits older product-level routing rules such as coarse
  `selectionWC`-based dictionary filtering

### 4.2 `doraemonkeys/ext-saladict`

Strengths:

- practical MV3 mindset
- keeps the product mostly intact
- good idea: session-backed restoration for SW state
- simpler offscreen scope than a "run everything in offscreen" design

Weaknesses:

- still tied to older webpack/neutrino architecture
- less verification rigor than our branch
- background fetch/parser path depends on service-worker compatibility patches
  and may keep more logic in the SW than ideal

### 4.3 `XZJIsme/ext-saladict-mv3`

Strengths:

- very small and easy to understand
- easier to load and inspect manually
- useful as a minimal MV3 reference

Weaknesses:

- not close to full Saladict feature parity
- no visible mature test strategy
- not a strong reference for preserving the original product breadth

### 4.4 `zpwc/ext-saladict-2manifestv3`

Strengths:

- useful as an example of a preserved original repo shape
- shows the natural first instinct many people have when attempting MV3
  migration incrementally

Weaknesses:

- README explicitly says the work is not implemented
- old MV2 background assumptions still visible
- not a working architectural reference for a completed MV3 migration

## 5. What We Should Absorb

### 5.1 From `doraemonkeys`

Worth absorbing:

- session-backed restoration for critical service-worker state
- the idea of minimizing offscreen scope

Why:

- session-backed restore can reduce cold-start races after SW restart
- limiting offscreen responsibility is aligned with our current direction

How to absorb safely:

- do not copy the whole webpack-era architecture
- adopt only the targeted state-restoration idea if we see real SW wake-up
  races in practice

### 5.2 From `XZJIsme`

Worth absorbing:

- product-slice thinking
- willingness to reduce scope aggressively for an MVP

Why:

- useful when building isolated debugging prototypes
- useful when validating one capability without dragging the whole product

How to absorb safely:

- use it as a debugging pattern, not as the main repo architecture

### 5.3 From `zpwc`

Worth absorbing:

- mostly nothing architectural

Useful lesson:

- preserving the old project shape without enforcing MV3 boundaries is not
  enough

## 6. Final Judgment

Best fork to learn from:

- `doraemonkeys/ext-saladict`

Best fork to use as a cautionary contrast:

- `zpwc/ext-saladict-2manifestv3`

Best fork to use as a minimal MV3 experiment reference:

- `XZJIsme/ext-saladict-mv3`

Overall:

- our current branch has the strongest combination of runtime correctness,
  hidden-offscreen purity, and end-to-end verification
- the most realistic thing worth borrowing from outside is
  `doraemonkeys`'s service-worker session restoration idea
- the product-routing issues around long selections are not solved better by the
  reviewed forks based on the evidence collected here
