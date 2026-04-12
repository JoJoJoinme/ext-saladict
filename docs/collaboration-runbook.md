# Collaboration Runbook

This document is for future handoff, whether the next person is a human
developer or another coding agent.

It describes:

- the current architecture boundary
- what has already been verified
- where the open questions are
- how to continue without breaking the MV3 runtime again

## 1. Current Status

As of 2026-04-12:

- Chrome MV3 runtime is working
- hidden offscreen is working without visible fallback
- `npm run test:required` passed
- MCP manual validation of the core lookup flow succeeded

See also:

- [verification-report-2026-04-12.md](./verification-report-2026-04-12.md)
- [mv3-runtime-boundaries.md](./mv3-runtime-boundaries.md)
- [fork-comparison-2026-04-12.md](./fork-comparison-2026-04-12.md)

## 2. Architecture Rules

### 2.1 Background Service Worker

Background owns all privileged extension APIs:

- storage
- cookies
- tabs
- windows
- DNR
- webRequest
- permissions
- notifications
- system.display

If a feature needs one of those, do it in background.

### 2.2 Hidden Offscreen

Offscreen owns only DOM-capable work:

- audio
- clipboard
- DOM parsing
- dictionary execution that genuinely requires document APIs

Do not make offscreen fetch config/profile from storage again.

Background must prepare execution payloads first.

### 2.3 Dictionary Engines

Dictionary engines should stay close to pure fetch/parse logic.

Do not reintroduce:

- `browser.cookies.*`
- `chrome.declarativeNetRequest.*`
- `browser.webRequest.*`
- `storage.*`

inside dictionary engines unless the design is being intentionally changed and
re-reviewed.

## 3. Files That Matter Most

### Runtime Boundary

- [src/background/server.ts](/srv/work/ext-saladict/src/background/server.ts)
- [src/background/dict-runtime.ts](/srv/work/ext-saladict/src/background/dict-runtime.ts)
- [src/background/offscreen-helper.ts](/srv/work/ext-saladict/src/background/offscreen-helper.ts)
- [src/background/offscreen-contract.ts](/srv/work/ext-saladict/src/background/offscreen-contract.ts)
- [src/entrypoints/offscreen/main.ts](/srv/work/ext-saladict/src/entrypoints/offscreen/main.ts)
- [src/background/state.ts](/srv/work/ext-saladict/src/background/state.ts)

### Product Routing / Profiles

- [src/app-config/profiles.ts](/srv/work/ext-saladict/src/app-config/profiles.ts)
- [src/content/redux/modules/action-handlers/search-start.ts](/srv/work/ext-saladict/src/content/redux/modules/action-handlers/search-start.ts)
- [src/options/components/Entries/Dictionaries/EditModal.tsx](/srv/work/ext-saladict/src/options/components/Entries/Dictionaries/EditModal.tsx)

### Tests

- [test/acceptance/playwright-acceptance.mjs](/srv/work/ext-saladict/test/acceptance/playwright-acceptance.mjs)
- [test/e2e/playwright-e2e.mjs](/srv/work/ext-saladict/test/e2e/playwright-e2e.mjs)
- [test/specs/background/dict-runtime.spec.ts](/srv/work/ext-saladict/test/specs/background/dict-runtime.spec.ts)
- [test/specs/background/offscreen-helper.spec.ts](/srv/work/ext-saladict/test/specs/background/offscreen-helper.spec.ts)
- [test/specs/background/initialization.spec.ts](/srv/work/ext-saladict/test/specs/background/initialization.spec.ts)

## 4. How To Validate Safely

### Minimum Gate

Always run:

```bash
npm run test:required
```

This is the main repository guardrail.

### If Touching Offscreen / Runtime Boundaries

Also check:

```bash
npm test -- --runInBand test/specs/background/offscreen-helper.spec.ts
npm test -- --runInBand test/specs/background/dict-runtime.spec.ts
npm run test:e2e:playwright
```

### If Touching Profiles / Long-Selection Behavior

Check:

```bash
npm run test:acceptance
```

And then manually inspect profile behavior via MCP or a real browser.

## 5. MCP Workflow

### Current Useful MCP Checks

Use MCP for:

- `chrome://extensions` reload of unpacked extension
- `quick-search.html` inspection
- `options.html` profile inspection
- local fixture pages
- manual selection flow

### Practical Note

The MCP browser in this environment had public DNS instability in this round.

If public sites fail to load through MCP:

- use local HTTP fixtures
- use extension pages like `quick-search.html`
- keep Playwright E2E as the stronger real-runtime signal

### Shared-Browser Rule

When MCP extension/runtime behavior is suspect, prefer a shared browser over a
fresh isolated browser launch.

Current validated repo path:

1. `npm run build`
2. `./dev/agent/start-shared-chrome-tmux.sh`
3. confirm `http://127.0.0.1:9222/json/version`
4. attach MCP through:
   - `./dev/agent/start-shared-chrome-mcp.sh`
   - or `npx -y chrome-devtools-mcp@latest --browser-url=http://127.0.0.1:9222`

Important constraints:

- prefer Chrome for Testing over arbitrary system Chrome when extension loading
  differs across browsers
- do not combine `--browser-url` with `--category-extensions=true`
- once MCP config changes, a currently running Codex/MCP session may stay stale

### Tool Selection Rules

Use Playwright when the goal is:

- gating
- repeatability
- fixture-driven verification
- regression prevention
- clean-room reproduction

Use MCP when the goal is:

- checking what a real loaded extension instance looks like right now
- validating options UI / profile switching / extension pages by inspection
- reproducing real browser interaction problems after the automated gate is green
- keeping a browser open for manual review

Default order:

1. use Playwright first to prove the change is stable
2. use MCP second to prove the loaded extension still looks and behaves right

Do not invert that order unless the task is explicitly exploratory.

### Fresh Codex Rule

If the current Codex session predates an MCP config change or still behaves like
the old browser lane:

1. keep the shared browser alive
2. launch a fresh `codex exec` in a new tmux session
3. restrict that fresh session to MCP/browser validation only
4. treat its findings as the authoritative MCP state for the new config

### Proxy Rule

Browser automation in this environment should use the local proxy:

```text
http://127.0.0.1:7890
```

Current convention:

- Playwright launchers read proxy from `BROWSER_PROXY`, `http_proxy`, or
  `HTTP_PROXY`
- MCP Chrome-for-Testing session is configured with
  `--proxyServer=http://127.0.0.1:7890`

When running local fixture pages, keep loopback addresses bypassed in Playwright.

## 6. Product-Level Open Questions

These are not currently MV3 breakages, but they are still open design questions.

### 6.1 Long Selection Routing

Current long-selection behavior is mostly controlled by:

- active profile
- `selectionWC.min/max`

This is inherited behavior from the older design, not a new MV3 regression.

The current weakness is that routing is still coarse:

- it distinguishes mostly by word count
- it does not explicitly distinguish:
  - single word
  - phrase
  - sentence
  - machine translation

If improving user experience here, change product routing deliberately rather
than assuming MV3 broke it.

### 6.2 Dictionary Coverage

Core functionality is verified, but not every third-party provider has been
manually certified one-by-one in a live browser session.

If a user reports a specific provider issue:

1. reproduce in real browser
2. decide whether it is:
   - provider/network issue
   - long-selection routing issue
   - runtime boundary issue

## 7. What Already Went Wrong Once

Avoid repeating these mistakes:

- treating hidden offscreen like a normal visible extension page
- putting `cookies` / `DNR` logic inside dictionary engines
- relying on service-worker `setTimeout(...)` for important startup behavior
- assuming acceptance route interception equals real hidden-offscreen behavior

## 8. External References

### Upstream

- https://github.com/crimx/ext-saladict

### Forks Reviewed

- https://github.com/doraemonkeys/ext-saladict
- https://github.com/XZJIsme/ext-saladict-mv3
- https://github.com/zpwc/ext-saladict-2manifestv3

### Relevant Internal Docs

- [verification-report-2026-04-12.md](./verification-report-2026-04-12.md)
- [mv3-runtime-boundaries.md](./mv3-runtime-boundaries.md)
- [fork-comparison-2026-04-12.md](./fork-comparison-2026-04-12.md)

## 9. Recommended Next Steps

If continuing from here, do the following in order:

1. keep MV3 boundary stable
2. avoid touching offscreen unless necessary
3. focus product work on long-selection routing and profile semantics
4. if a new runtime bug appears, reproduce it in Playwright E2E and MCP before
   changing architecture
