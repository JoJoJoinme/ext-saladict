# Workboard

This file is the single entry point for ongoing work.

Rules:

- Before starting work in a new session, read:
  - [`../AGENTS.md`](../AGENTS.md)
  - [`../CLAUDE.md`](../CLAUDE.md)
  - [`./workboard.md`](./workboard.md)
- Every task must use one of the fixed statuses:
  - `todo`
  - `in_progress`
  - `blocked`
  - `verify`
  - `done`
- At the end of a work session, always update:
  - `Latest Findings`
  - `Next Step`
  - `Verification`
  - `Decision Log`

## Task T1

### ID

`T1`

### Title

MV3 migration hardening and product-behavior alignment

### Goal

Keep the Chrome/Edge MV3 runtime stable while aligning short phrase / long
selection behavior more closely to expected product behavior.

### Status

`in_progress`

### Current Phase

`execute`

### Owner

Current coding agent

### Inputs

- [`./verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)
- [`./mv3-runtime-boundaries.md`](./mv3-runtime-boundaries.md)
- [`./fork-comparison-2026-04-12.md`](./fork-comparison-2026-04-12.md)
- [`./collaboration-runbook.md`](./collaboration-runbook.md)
- [`./investigate-mcp-runtime-2026-04-12.md`](./investigate-mcp-runtime-2026-04-12.md)

### Constraints

- Do not break MV3 runtime boundaries.
- Use `Playwright -> MCP` in that order for final confidence.
- Browser automation should use proxy `http://127.0.0.1:7890`.
- Treat long-selection routing as product alignment work, not as a reason to
  reopen MV3 architecture.

### Plan

1. Keep MV3 infrastructure stable.
2. Reduce noisy `No result` behavior for default multiword lookups.
3. Preserve translation profile usability for single-word translation.
4. Verify with tests first, then MCP real browser checks.

### Latest Findings

- MV3 runtime migration is functionally complete for Chrome/Edge.
- Hidden offscreen works without visible fallback.
- A first-pass migration-baseline discovery document has been created:
  - [`migration-baseline-discovery.md`](./migration-baseline-discovery.md)
  - It maps the current task onto:
    - `Epic --(探索定义迁移基线)--> Feature --> User Story --(定义BDD场景/验收约束)--> Tech Story`
  - Current conclusion from that baseline pass:
    - acceptance kernel already freezes the core lookup flow
    - `Quick Search` and `PDF` are the clearest `P1` baseline gaps
- A dedicated MV2 capability inventory has now been added:
  - [`mv2-capability-inventory.md`](./mv2-capability-inventory.md)
  - Purpose:
    - avoid defining MV3 only from the current migration implementation
    - use explicit MV2一级能力块 as an additional baseline input
- `Quick Search` has now been formalized as the first concrete migration slice:
  - [`feature-quick-search-baseline.md`](./feature-quick-search-baseline.md)
  - It now has:
    - first-pass `Feature`
    - first-pass `User Story`
    - first-pass `BDD` candidates
  - Current recommendation:
    - treat it as the first `P1` feature to continue into E2E-backed scenario implementation
- `Quick Search` test carry-over has now been sketched:
  - [`test-tech-story-quick-search.md`](./test-tech-story-quick-search.md)
  - It maps:
    - `QS-BDD-1 ~ QS-BDD-4`
    - into E2E-oriented test tech stories
  - It also identifies the shared blockers before code implementation:
    - popup/page discovery helper
    - config injection strategy
    - Quick Search page state reader
    - controlled result source
- `Quick Search` spec-extension direction has now been clarified:
  - [`spec-quick-search-proposal.md`](./spec-quick-search-proposal.md)
  - Key decision:
    - keep `test/acceptance/spec.json` as the single formal BDD carrier
    - extend spec minimally instead of creating a parallel Quick Search BDD format
  - Status:
    - `frozen-v1`
- `Quick Search` formal BDD is now present in `spec.json`:
  - scenario ids added:
    - `quick-search-open-window`
    - `quick-search-reuse-window`
    - `quick-search-selection-preload`
    - `quick-search-selection-auto-search`
  - current execution state:
    - these scenarios are formally carried by `spec.json`
    - current acceptance runner still filters to `runner=acceptance`
    - `openQuickSearch` runner-side execution is now implemented in
      [`../test/e2e/playwright-e2e.mjs`](../test/e2e/playwright-e2e.mjs)
    - all four `quick-search-*` scenarios now execute in Playwright E2E and
      pass
- A deterministic CI BDD gate now validates this state:
  - [`docs/gates/T1.json`](./gates/T1.json)
  - `scripts/check-bdd-gate.mjs`
  - `.github/workflows/acceptance.yml`
  - latest local result:
    - `T1: bdd_covered, implementation_allowed=true, covered_scenarios=39, tracked_features=11, feature_gaps=0`
- `PDF` formal BDD is now also present in `spec.json`:
  - scenario ids added:
    - `pdf-open-current-page`
    - `pdf-open-link`
    - `pdf-sniff-redirect`
  - related carry-over docs:
    - [`feature-pdf-baseline.md`](./feature-pdf-baseline.md)
    - [`spec-pdf-proposal.md`](./spec-pdf-proposal.md)
    - [`test-tech-story-pdf.md`](./test-tech-story-pdf.md)
  - current execution state:
    - these scenarios are formally carried by `spec.json`
    - runner-side execution is still pending
- Current interpretation of the top-level `T1: bdd_gap` state:
  - this previous interpretation is now obsolete
- Remaining user-visible feature families have now also been formalized:
  - `Trigger Entry Paths`
  - `Extension Pages`
  - `Audio Playback`
  - `Clipboard`
- Additional MV2 capability groups are now also formalized:
  - `Profiles and Search Modes`
  - `Provider System`
  - `Page Translation`
  - `Notebook Sync Services`
  - `Settings Surfaces`
- `MV2 capability inventory` has now been explicitly reviewed for completeness:
  - [`mv2-capability-inventory.md`](./mv2-capability-inventory.md)
  - current coarse result:
    - `formalized`: 15 capability groups
    - `partially formalized`: 0 capability groups
    - `not yet formalized`: 0 capability groups
  - current coarse result:
    - `formalized`: 10 capability groups
    - `partially formalized`: 4 capability groups
    - `not yet formalized`: 1 capability group
- Current gate state has therefore moved to:
  - `T1: bdd_covered, implementation_allowed=true`
- Current meaning of that state:
  - spec-side carry-over is complete for the currently selected user-visible feature families
  - the remaining major gaps are now:
    - execution-layer carry-over
- A dedicated runner-contract review now exists:
  - [`test-contract-layer-review.md`](./test-contract-layer-review.md)
  - It uses `lookup` as the template and classifies each formalized feature by:
    - formal BDD carrier
    - runner action
    - product test contract
    - fixture/control source
    - helper / adapter
  - Current conclusion:
    - the dominant remaining gap is no longer spec-side formalization
    - it is execution-layer contract/support
- Current long-selection dictionary participation is mostly inherited MV2-era
  behavior driven by profile selection and `selectionWC.min/max`.
- MCP verification confirmed:
  - profile switching exists in options
  - per-dictionary `Selection Word Count` is exposed in options
  - long-selection behavior changes across profiles
- Current product issue is not primarily MV3 breakage; it is dictionary routing
  quality.
- Work has started on preset-profile routing defaults and preset-profile
  migration logic for existing stored profiles.
- Follow-up automated verification after the preset-profile routing adjustments
  passed again:
  - `npm test -- --runInBand test/specs/_helpers/profile-manager.spec.ts`
  - `npm run test:required`
- Current default-profile routing expectation is now:
  - `example` -> `bing`, `cobuild`, `cambridge`, `youdao`, `urban`,
    `vocabulary`, `googledict`
  - `injuring more` -> `bing`, `google`, `caiyun`, `youdaotrans`
  - `general secretary of the Communist Party of China` -> `bing`, `google`,
    `caiyun`, `youdaotrans`
- Acceptance still confirms long-selection translation success under the new
  routing defaults.
- The current MCP browser session in this environment could install the unpacked
  extension, but it did not expose a usable loaded-extension runtime for direct
  extension-page or content-script follow-up checks in this round.
- A dedicated `investigate` artifact now exists for the MCP/browser runtime
  issue:
  - [`investigate-mcp-runtime-2026-04-12.md`](./investigate-mcp-runtime-2026-04-12.md)
  - It is the continue-work entry for this blocking issue.
- A tmux-supervised shared-browser lane is now working as a practical fallback:
  - [`../dev/agent/README.md`](../dev/agent/README.md)
  - Through that lane, a real extension page was reached again and the default
    profile was manually checked on:
    - `example`
    - `injuring more`
    - `general secretary of the Communist Party of China`
  - Current result mix matches the routing expectation.
  - A reusable routing-check script now exists:
    - [`../dev/agent/check-quick-search-routing.mjs`](../dev/agent/check-quick-search-routing.mjs)
- The first execution-layer carry-over slice is now landed for `Quick Search`:
  - shared runner capabilities now exist for:
    - fixture-page driven source selection
    - runtime config injection via `TEST_CONFIGURE_ACCEPTANCE_RUNTIME`
    - Quick Search page discovery / reuse counting
    - standalone panel state reads through the generalized
      [`../test/acceptance/helpers.mjs`](../test/acceptance/helpers.mjs)
  - current remaining execution-layer gap is no longer `openQuickSearch`
  - the next pending runner actions are:
    - `openPdf`
    - `triggerContextMenuAction`
    - `triggerCommand`
    - `openExtensionPage`
    - `playAudio`
    - `clipboardRoundtrip`
- The remaining `runner=e2e` execution-layer carry-over is now also landed:
  - [`../test/e2e/playwright-e2e.mjs`](../test/e2e/playwright-e2e.mjs) now
    executes:
    - `openPdf`
    - `triggerContextMenuAction`
    - `triggerCommand`
    - `openExtensionPage`
    - `playAudio`
    - `clipboardRoundtrip`
  - `spec.json` `runner=e2e` scenarios are now green end-to-end in Playwright
- PDF carry-over required both runner and product fixes:
  - build output now copies the legacy/static PDF and translation assets needed
    by E2E
  - [`../src/background/context-menus.ts`](../src/background/context-menus.ts)
    now awaits async menu actions
  - [`../src/background/pdf-sniffer.ts`](../src/background/pdf-sniffer.ts) now:
    - synchronizes sniffer state immediately for acceptance runtime updates
    - uses cached synchronous config inside `onHeadersReceived`
    - treats `.pdf` URLs as PDF even when `content-type` is absent
    - falls back when the request has `tabId=-1`
- `pdf-sniff-redirect` debugging established the concrete MV3/browser behavior in
  this environment:
  - the request did reach `webRequest.onHeadersReceived`
  - the PDF response may arrive without a usable `content-type` header
  - the original failure was therefore product detection logic, not only runner
    orchestration
- Current local gate state for the formalized E2E slice is now:
  - `npm run test:e2e:playwright` -> `60 passed, 0 failed`
- The previous SW console noise in page translation is now fixed:
  - [`../src/_helpers/saladict.ts`](../src/_helpers/saladict.ts) no longer
    reads `window` directly in service-worker code paths
  - [`../src/_helpers/analytics/index.ts`](../src/_helpers/analytics/index.ts)
    now:
    - uses `fetch` instead of `axios` in the background GA path
    - respects the stored `analytics` config before attempting any network call
  - current Playwright SW console health result:
    - `No significant SW console errors/warnings.`
- MCP browser verification now works through the repaired shared-browser path:
  - the old failing lane was:
    - system Chrome
    - `--isolated=true`
    - and, briefly, an invalid wrapper using `--browser-url` together with
      `--category-extensions=true`
  - the working lane is now:
    - tmux-supervised shared Chrome for Testing on `http://127.0.0.1:9222`
    - a fresh Codex/MCP session attaching through `--browser-url`
  - verified runtime facts on that lane:
    - unpacked Saladict is enabled in `chrome://extensions`
    - direct extension pages are reachable
    - extension service worker and offscreen targets exist
    - a localhost acceptance fixture page opens in the same browser
    - selecting `Example` creates `saladict-saladbowl-root`
    - interacting with the injected UI creates `saladict-dictpanel-root`
- Root-cause evidence for that MCP mismatch is now concrete:
  - the current built-in MCP launch was using system Chrome:
    - `/opt/google/chrome/chrome`
    - with `--isolated=true`
  - the validated tmux shared-browser lane uses Chrome for Testing:
    - `/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`
    - with a stable profile and `--remote-debugging-port=9222`
  - local Codex MCP config has now been switched to a wrapper that:
    - starts/reuses the tmux shared browser
    - connects `chrome-devtools-mcp` through `--browser-url=http://127.0.0.1:9222`
  - note:
    - a fresh MCP/Codex session is required to pick up that repaired path
    - that fresh-session path has now been verified successfully

### Next Step

1. Keep offscreen/background architecture untouched unless a new runtime bug is
   reproduced outside the current verified browser paths.
2. Treat the `runner=e2e` carry-over as functionally complete for the currently
   formalized feature families; do not reopen the runner contract unless a new
   spec action appears.
3. Move the next confidence step to browser verification follow-up:
   - keep the shared-browser wrapper as the default MCP path for this repo
   - if a future MCP session regresses, compare it against the verified tmux
     shared-browser lane first
4. Rerun the broader required gate when the next product/code slice is selected:
   - `npm run test:required`
5. Keep [`mv2-capability-inventory.md`](./mv2-capability-inventory.md) as the
   reference guardrail while any further feature slices are added or revised.

### Verification

Already verified in this task line:

- `npm run test:required` passed before the newest profile-routing change set
- `npm run test:required` passed again after the newest profile-routing change
  set
- `npm test -- --runInBand test/specs/_helpers/profile-manager.spec.ts` passed
  after preset-profile routing updates
- `npm test -- --runInBand test/specs/background/offscreen-helper.spec.ts`
  passed in earlier round
- `npm test -- --runInBand test/specs/background/dict-runtime.spec.ts`
  passed in earlier round
- `npm run test:acceptance` passed in earlier round
- `npm run test:e2e:playwright` passed in earlier round
- `node --check test/acceptance/helpers.mjs` passed
- `node --check test/e2e/playwright-e2e.mjs` passed
- `npm run test:e2e:playwright` passed again after landing the
  `openQuickSearch` runner slice:
  - `35 passed, 0 failed`
  - includes:
    - `quick-search-open-window`
    - `quick-search-reuse-window`
    - `quick-search-selection-preload`
    - `quick-search-selection-auto-search`
- `npm run test:acceptance` passed again after generalizing
  `readLookupUi` for standalone Quick Search:
  - `10 passed, 0 failed`
- `npm test -- --runInBand test/specs/background/pdf-sniffer.spec.ts` passed
  after the PDF sniffer hardening:
  - `13 passed, 0 failed`
- `npm run build` passed after the final PDF/runtime carry-over fixes
- `E2E_SCENARIO=pdf-sniff-redirect npm run test:e2e:playwright` passed after
  the PDF sniffer detection fix:
  - `32 passed, 0 failed`
- `npm run test:e2e:playwright` passed after landing the remaining
  `runner=e2e` action support and the PDF sniffer fix:
  - `60 passed, 0 failed`
- `npm run test:acceptance` passed after the final runtime/analytics fixes:
  - `10 passed, 0 failed`
- `npm run test:e2e:playwright` passed again after the service-worker-safe
  Saladict helper change and the analytics GA-path hardening:
  - `60 passed, 0 failed`
  - `SW Console Health Report: No significant SW console errors/warnings.`
- a fresh tmux-hosted Codex/MCP verification session confirmed the repaired MCP
  path:
  - `chrome-devtools-mcp` attached through `--browser-url=http://127.0.0.1:9222`
  - unpacked Saladict is visible and enabled in `chrome://extensions`
  - direct extension pages are reachable in the shared browser
  - the shared browser exposes extension service-worker and offscreen targets
  - a localhost fixture page was opened in the same browser
  - selecting `Example` created `saladict-saladbowl-root`
  - interacting with the bowl path created `saladict-dictpanel-root`
- direct shared-browser checks also passed outside the Playwright gate:
  - `node dev/agent/check-quick-search-routing.mjs`
    - matched the expected result mix for:
      - `example`
      - `injuring more`
      - `general secretary of the Communist Party of China`
  - direct `options.html` reachability in the shared browser showed:
    - title `Saladict Options - General`
    - rendered root content
  - direct fixture-page interaction in the shared browser showed:
    - content-script bowl injection on selection
    - dict panel root creation after bowl interaction
- screenshot-driven lookup UX follow-up is now landed:
  - empty terminal dict items no longer auto-expand by default
  - `baidu`, `caiyun`, and `youdaotrans` now return
    `requireCredential` when credentials are missing, instead of silently
    degrading into fake empty results
  - likely interpretation of the screenshoted `youdao` phrase lookup:
    - current default preset would not render `youdao` for multiword phrases
      because `selectionWC.max = 1`
    - so that screenshot is more consistent with a stale/custom profile
- targeted verification for that follow-up now exists:
  - `npm test -- --runInBand test/specs/content/dict-item-fold-state.spec.ts`
    - `3 passed, 0 failed`
  - `npm test -- --runInBand test/specs/components/dictionaries/machine-trans-auth.spec.ts`
    - `3 passed, 0 failed`
  - `npm test -- --runInBand test/specs/_helpers/profile-manager.spec.ts`
    - `21 passed, 0 failed`
  - shared-browser check on `zzzznotaword`
    confirmed `bing`, `cambridge`, `youdao`, `vocabulary`, and `googledict`
    empty items now stay `isUnfold=false`
- the default preset is now adjusted toward mainland-user-first behavior:
  - default single-word set:
    - `bing`
    - `cambridge`
    - `youdao`
    - `vocabulary`
    - `zdic`
    - `guoyu`
    - `liangan`
  - default phrase/sentence translation keeps:
    - `google`
  - removed from default preset:
    - `cobuild`
    - `urban`
    - `googledict`
    - token-dependent translators from the default preset
  - legacy default preset selections are migrated only when they still match the
    old untouched default list
- shared-browser routing verification after that preset change confirmed:
  - `example` -> `bing`, `cambridge`, `youdao`, `vocabulary`
  - `injuring more` -> `bing`, `google`
  - `general secretary of the Communist Party of China` -> `bing`, `google`
- release-prep status is now:
  - package version bumped to `7.20.1`
  - `npm run test:bdd-gate` passed
  - `npm run test:required` passed
  - `npm run test:required` details:
    - lookup acceptance contract: `6 passed`
    - acceptance: `10 passed, 0 failed`
    - Playwright E2E: `60 passed, 0 failed`
- a reusable global skill now exists for this orchestration pattern:
  - [`/root/.codex/skills/tmux-mcp-browser-verify/SKILL.md`](/root/.codex/skills/tmux-mcp-browser-verify/SKILL.md)

Pending follow-up:

- `npm run test:required` was not rerun in this specific slice; the directly
  affected acceptance + Playwright layers are green

### Decision Log

- Chose `Playwright -> MCP` as the default workflow and wrote it into repo docs.
- Chose explicit browser proxy configuration instead of relying on inherited
  shell environment.
- Chose to keep MV3 runtime work separate from product routing changes.
- Chose to migrate existing preset profiles by preset name instead of assuming
  only new installs matter.
- Chose to trust the automated gate again for regression confidence after the
  preset-profile routing changes, while recording the current MCP limitation as
  an environment/tooling issue instead of treating it as an MV3 runtime failure.
- Chose to express migration requirement carry-over using:
  - `Epic --(探索定义迁移基线)--> Feature --> User Story --(定义BDD场景/验收约束)--> Tech Story`
- Chose to treat the current acceptance spec as the repository's migration
  baseline kernel instead of restarting requirements discovery from scratch.
- Chose to use `Quick Search` as the first fully formalized `Feature -> User Story -> BDD`
  migration slice before entering `Tech Story`.
- Chose to finish the remaining `runner=e2e` carry-over in the existing
  Playwright contract instead of introducing a parallel PDF/extension-page test
  harness.
- Chose to route test-triggered commands and context-menu actions through a
  persistent options-page bridge so the intended source tab stays active.
- Chose to debug `pdf-sniff-redirect` by instrumenting the product sniffer path
  instead of continuing to guess at runner timing.
- Chose to harden the product PDF sniff logic after evidence showed the request
  reached `webRequest`, but some PDF responses arrived without a usable
  `content-type` header.
- Chose to remove the temporary PDF-sniffer diagnostic bridge after the real
  product fix was identified, so the final state keeps only the runtime fix.
- Chose to make the page-context helper service-worker-safe at the shared
  helper layer instead of papering over `window` access at each analytics call
  site.
- Chose to replace the background analytics `axios` call with `fetch` and to
  enforce the stored `analytics` toggle in the helper, so background event
  reporting respects product config and does not create false-positive SW
  console noise during real browser verification.
- Chose to collapse `empty` dict items by default instead of auto-expanding
  every terminal item, because explicit empty state should remain observable but
  should not dominate the panel.
- Chose to surface missing machine-translation credentials as
  `requireCredential` instead of silently mapping them to empty results, because
  “missing auth” and “no result” are different user actions.
- Chose to retune the default preset toward mainland-user-first behavior while
  still keeping `google` as the single default phrase/sentence translator,
  because it is the most useful zero-credential option for users who do have
  access to it.
- Chose to switch the repo-local MCP launch path from isolated system Chrome to
  a tmux-supervised shared Chrome for Testing wrapper attached by
  `--browser-url`, because that is the first path that produced a stable loaded
  extension runtime in fresh Codex sessions.
- Chose to codify the tmux + fresh `codex exec` MCP validation pattern as a
  reusable global skill instead of leaving it as an ad-hoc debugging trick.
- Chose to design Quick Search test tech stories before writing any Quick Search
  test code, so that the next implementation step is driven by explicit test
  carry-over rather than ad-hoc E2E edits.
- Chose to land Quick Search BDD into `spec.json` before runner implementation,
  so that formal BDD carry-over is completed first and execution-layer work can
  proceed against a frozen spec.
- Chose to formalize `PDF` into the same unified `spec.json` carrier rather than
  treating it as runtime-only evidence.
- Chose to continue formalizing the remaining `P2` feature families into the same
  unified `spec.json` carrier instead of leaving them at the evidence-only level.
- Chose to finish spec-side formalization for all currently identified MV2
  capability groups before moving the main effort to runner-side execution.
- Chose to review runner dependency layers against the existing `lookup` model
  before implementing new runner actions, so execution-layer work stays
  contract-driven rather than ad-hoc.
- Chose to make the BDD constraint deterministic in CI rather than relying only
  on markdown rules.
- Chose to freeze the first Quick Search spec-extension proposal before runner
  implementation, so that the next step is a pure execution-layer carry-over
  rather than a mixed spec/implementation discussion.
- Chose to move `T1` from `investigate` to `execute` once the first
  `runner=e2e` action was actually landed and verified.
- Chose to implement the first spec-driven execution slice inside the existing
  [`../test/e2e/playwright-e2e.mjs`](../test/e2e/playwright-e2e.mjs) harness
  instead of creating a second Playwright runner.
- Chose to reuse `TEST_CONFIGURE_ACCEPTANCE_RUNTIME` for runner-side config and
  controlled lookup results, rather than introducing a second storage-only
  injection path before it was needed.
- Chose to generalize
  [`../test/acceptance/helpers.mjs`](../test/acceptance/helpers.mjs) so it can
  read standalone Quick Search panel state, instead of changing production DOM
  structure only for test instrumentation.
- Chose to introduce a dedicated `investigate` artifact for the current
  MCP/browser runtime issue, following the phase-driven continue-work idea, so
  that the next session can resume this specific problem without reconstructing
  the whole history from chat.
- Chose to accept a tmux-supervised shared-browser lane as the current practical
  real-browser fallback, instead of waiting for the native MCP session to become
  perfectly reconnectable before continuing product validation.
