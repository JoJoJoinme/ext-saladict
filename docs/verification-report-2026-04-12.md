# Verification Report

Date: 2026-04-12

Scope: Chrome MV3 build in this repository, after the offscreen/runtime-boundary
cleanup and the service-worker timing cleanup.

## 1. Summary

Current conclusion:

- The MV3 Chrome/Edge runtime is working for the repository's core user-visible
  flows.
- The required repository gate passed.
- The hidden offscreen path is working without opening a visible fallback page.
- The remaining user confusion around long selections is mostly product logic,
  not MV3 breakage.

The strongest signal is:

- `npm run test:required` passed
- acceptance passed: `10 passed, 0 failed`
- Playwright real-extension E2E passed: `31 passed, 0 failed`

## 2. Validation Methods

This verification used three layers.

### 2.1 Automated Gate

Command:

```bash
npm run test:required
```

This gate runs:

1. lookup contract unit tests
2. user-intent acceptance tests
3. Playwright real-extension E2E

Result: passed.

### 2.2 Focused Regression Checks

Additional focused tests were run while refactoring:

```bash
npm test -- --runInBand test/specs/background/offscreen-helper.spec.ts
npm test -- --runInBand test/specs/background/dict-runtime.spec.ts
npm test -- --runInBand test/specs/components/dictionaries/zdic/engine.spec.ts
npm test -- --runInBand test/specs/background/initialization.spec.ts
```

Result: passed.

### 2.3 MCP Manual Verification

The Chrome DevTools MCP session was reconfigured to use Chrome for Testing and a
real loaded unpacked extension instance.

Manual checks performed through MCP:

- reloaded the unpacked extension in `chrome://extensions`
- verified extension service worker presence
- verified `quick-search.html` and `options.html` extension pages
- verified a real selection flow on a live page fixture:
  - select text
  - show salad bowl
  - click bowl
  - open lookup panel
  - get real dictionary results
- verified no visible `offscreen.html` page remained open during the hidden
  offscreen flow
- verified long-selection behavior under multiple profiles

Notes:

- The MCP browser session could not resolve public DNS reliably during this
  round, so manual page validation used a local HTTP fixture page and extension
  pages.
- That limitation affected the *source page* used for manual interaction, not
  the extension runtime itself.

## 3. Automated Results

### 3.1 Acceptance

Command:

```bash
npm run test:acceptance
```

Result:

- `10 passed, 0 failed`

Covered user-intent scenarios:

- known word lookup success
- explicit empty state
- explicit provider error state
- terminal state transitions
- in-panel search refinement
- close and reopen panel
- add to notebook
- history navigation
- long-selection translation fallback
- fragment long-selection translation fallback

### 3.2 Playwright Real-Extension E2E

Command:

```bash
npm run test:e2e:playwright
```

Result:

- `31 passed, 0 failed`

Covered runtime areas:

- extension loading
- service worker startup
- popup/options/quick-search/word-editor pages
- content-script injection
- real interactive selection flow
- storage
- service-worker lifecycle
- hidden offscreen creation
- offscreen audio pipeline
- clipboard permission path
- PDF interception capability
- ZDIC audio DNR session rule
- context menus
- badge
- quick-search popup window positioning

### 3.3 Required Gate

Command:

```bash
npm run test:required
```

Result: passed.

This is the current repository minimum gate for user-visible changes.

## 4. MCP Manual Results

### 4.1 Real Selection Flow

A local fixture page was opened through MCP and used as a real browser page.

Observed sequence:

1. select `Example`
2. salad bowl appears
3. click bowl
4. lookup panel opens
5. panel returns actual content

Observed result:

- panel opened successfully
- multiple dictionaries returned real content
- no visible `offscreen.html` tab/window remained open

### 4.2 Hidden Offscreen Verification

Observed runtime state:

- hidden `OFFSCREEN_DOCUMENT` existed in `chrome.runtime.getContexts()`
- no visible `offscreen.html` page was listed in open pages
- offscreen-backed lookup returned real result content

This confirms the current production runtime is no longer relying on the old
visible offscreen fallback.

### 4.3 Long-Selection Profile Verification

The same long selection was tested under multiple profiles by switching the
active profile via extension storage and then searching in `quick-search.html`.

Observed behavior:

- default profile rendered:
  - `youdao`
  - `google`
  - `caiyun`
  - `youdaotrans`
- sentence profile rendered:
  - `jukuu`
  - `cnki`
  - `renren`
- translation profile rendered:
  - `google`
  - `tencent`
  - `baidu`
  - `caiyun`
  - `youdaotrans`

Conclusion:

- long-selection capability exists and is profile-dependent
- the extension is applying configured dictionary-selection rules, not randomly
  hiding dictionaries

### 4.4 Options Verification For Dictionary Selection Controls

The options UI was also inspected through MCP.

Verified:

- `Profiles` page exists and exposes the profile list
- `Dictionaries` page exists and shows selected dictionaries for the active
  profile
- opening a dictionary edit modal exposes:
  - selection languages
  - default unfold
  - selection word count (`min` / `max`)
  - dictionary-specific options

This confirms that long-selection participation is not hardcoded only in code:

- it is also surfaced in the options UI through the per-dictionary
  `Selection Word Count` controls

## 5. MV3 Boundary Findings

The following MV3 issues were found and corrected during this round.

### 5.1 Offscreen Was Treated Too Much Like a Normal Extension Page

Previous problem:

- hidden offscreen directly read config/profile state through storage-backed
  helpers
- some dictionary engines also performed extension-side effects directly

Why this was wrong:

- Chrome's offscreen model is much stricter than a normal visible extension
  page
- offscreen should depend on `chrome.runtime` messaging, not general extension
  API access assumptions

Current state:

- background prepares config/profile/cookie/DNR context first
- offscreen receives a pure execution payload
- offscreen is now limited to DOM/audio/clipboard/search execution

### 5.2 Dictionary Runtime Side Effects Were Moved Back to Background

Corrected:

- `ZDIC` Referer rule setup now happens in background
- `HJDict` cookie seeding now happens in background

This makes dictionary engines closer to pure fetch/parse logic again.

### 5.3 Service Worker Timing Logic Was Tightened

Corrected:

- startup/install flows no longer depend on arbitrary `setTimeout(...)` delays
  for core work
- tab recovery for already-open tabs is now event-driven

This is more aligned with MV3 service-worker lifecycle constraints.

## 6. Comparison With MV2-Era Behavior

A git-history review was done on the old selection/profile flow.

Findings:

- the `sentence` and `translation` profiles already existed in MV2-era history
- dictionary filtering by `selectionWC.min/max` already existed in MV2-era
  search-start logic
- per-dictionary selection word-count settings were already exposed in the
  options UI in MV2-era history

Practical conclusion:

- the current "some dictionaries appear for long selections while others do not"
  is not a new MV3 regression
- it is inherited product behavior from the older design

This explains why long-selection behavior can feel surprising while still being
consistent with the historical logic.

## 7. What Is Verified vs Not Fully Verified

### Verified

- MV3 extension loads in Chrome for Testing
- core lookup panel flow works end-to-end
- hidden offscreen lookup works without visible fallback page
- notebook/history core flows covered by acceptance
- quick-search works
- popup/options/word-editor pages render
- PDF interception capabilities and DNR capabilities are present
- context menus and badge APIs work

### Not Exhaustively Verified

- every external dictionary provider was not manually validated one-by-one in a
  live browser session
- some providers returned empty/error in long-selection tests because of current
  product routing rules or provider behavior, not because the MV3 runtime was
  failing globally
- the MCP browser session had public DNS limitations, so manual web-page
  interaction used local fixtures where needed

So the correct statement is:

- core extension functionality is verified working
- all major repository gates pass
- not every third-party provider has been manually exhaustively certified in
  this round

## 8. Remaining Product-Level Observations

These are not currently MV3-runtime failures, but they are still real product
questions.

### 8.1 Long Selections Only Show Some Dictionaries

Reason:

- search startup filters dictionaries by `selectionWC.min/max`
- many classic word dictionaries keep `max = 5`
- long selections therefore route mainly to translation-capable dictionaries

### 8.2 Some Dictionaries Return Very Fast `No result`

Reason:

- current routing mostly uses language + word-count filtering
- it does not yet have a richer notion of:
  - single word
  - phrase
  - sentence
  - machine translation

This is product selection logic, not MV3 breakage.

### 8.3 Follow-Up Default-Profile Routing Check

After the preset-profile routing adjustment, the current default-profile
expectation is:

- `example`
  - `bing`
  - `cobuild`
  - `cambridge`
  - `youdao`
  - `urban`
  - `vocabulary`
  - `googledict`
- `injuring more`
  - `bing`
  - `google`
  - `caiyun`
  - `youdaotrans`
- `general secretary of the Communist Party of China`
  - `bing`
  - `google`
  - `caiyun`
  - `youdaotrans`

Validation signals in the follow-up round:

- `npm test -- --runInBand test/specs/_helpers/profile-manager.spec.ts` passed
- `npm run test:required` passed
- acceptance still reported long-selection translation success for
  `general secretary of the Communist Party of China`
- a real extension page was reached again through the shared-browser lane by
  connecting to a tmux-supervised browser over CDP

Observed default-profile result mix in that follow-up round:

- `example`
  - `Bing Dict`
  - `COBUILD`
  - `Cambridge Dictionary`
  - `Youdao Dictionary`
  - `Urban`
  - `Vocabulary.com`
  - `Google Dictionary`
- `injuring more`
  - `Bing Dict`
  - `Google Translation`
  - `LingoCloud`
  - `Youdao Translate`
- `general secretary of the Communist Party of China`
  - `Bing Dict`
  - `Google Translation`
  - `LingoCloud`
  - `Youdao Translate`

Interpretation:

- `LingoCloud` is the current rendered title for the `caiyun` slot
- the result *mix* now matches the current default-profile routing expectation
- some providers still rendered explicit `No result` for these multiword queries,
  but the routing itself is no longer the blocker

Practical note:

- the current MCP browser session in this environment could install the unpacked
  extension, but it did not expose a usable loaded-extension runtime for direct
  extension-page or content-script verification in this follow-up round
- however, the repository now has a working shared-browser lane that keeps a
  real loaded extension instance reachable for follow-up inspection via a tmux
  session and DevTools endpoint

## 9. Final Status

Current repository status after this round:

- MV3 runtime: working
- hidden offscreen: working
- required test gate: passing
- user-intent acceptance: passing
- real-extension E2E: passing
- MCP manual verification: successful for core lookup flow

Overall conclusion:

- For Chrome/Edge MV3, the repository is in a working state and the major
  migration-critical paths are verified.
