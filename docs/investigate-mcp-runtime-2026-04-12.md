# MCP Runtime Investigation

Date: 2026-04-12

Scope: investigate why the current MCP browser session can install the unpacked
extension but does not expose a usable loaded-extension runtime for the final
manual verification pass.

This document is intended to be the continue-work entry for this investigation.

Template reference:

- [`./investigate-template.md`](./investigate-template.md)

---

## 1. Problem Description

Current task context:

- the MV3 runtime itself is already passing the automated repository gate
- default-profile routing expectations have already been updated and verified by
  automated checks
- the remaining manual follow-up is to confirm the default profile in a real MCP
  browser session on:
  - `example`
  - `injuring more`
  - `general secretary of the Communist Party of China`

Current blocking issue:

- the current MCP browser session in this environment can install the unpacked
  extension
- but it does not expose a usable loaded-extension runtime for direct extension
  page navigation or content-script follow-up checks

This means the current manual follow-up is blocked on MCP/runtime availability,
not on a known code regression.

---

## 2. Success Criteria

This investigation is complete only when all of the following are true in an
MCP browser session:

1. the unpacked extension is not only listed as installed, but behaves as a
   loaded extension runtime
2. at least one extension page is usable through MCP, or the content-script
   path is visibly active on a local fixture page
3. the default profile can be manually confirmed for:
   - `example`
   - `injuring more`
   - `general secretary of the Communist Party of China`
4. the result mix can be compared against the current expectation without making
   more profile changes first

---

## 3. Inputs To Read First

Before continuing this investigation, read:

- [`./workboard.md`](./workboard.md)
- [`./verification-report-2026-04-12.md`](./verification-report-2026-04-12.md)
- [`./collaboration-runbook.md`](./collaboration-runbook.md)

Supporting design notes:

- [`./gacui-phase-protocol-mapping-2026-04-12.md`](./gacui-phase-protocol-mapping-2026-04-12.md)
- [`./agent-protocol-execution-plane-discussion.md`](./agent-protocol-execution-plane-discussion.md)

---

## 4. Runtime Registry Snapshot

Known local runtime facts from this round:

- proxy convention:
  - `http://127.0.0.1:7890`
- built extension path:
  - `/srv/work/ext-saladict/dist/chrome-mv3`
- unpacked extension id observed in Playwright and MCP:
  - `almpmnhfcekajbogfambjghflcecacok`
- MCP server name in local Codex config:
  - `chrome-devtools-ext`
- current MCP server summary from local config:
  - uses `chrome-devtools-mcp`
  - launches Chrome with extension loading flags pointing at
    `/srv/work/ext-saladict/dist/chrome-mv3`
  - currently includes `--isolated=true`
- shared browser prototype files now exist:
  - [`../dev/agent/start-shared-chrome.sh`](../dev/agent/start-shared-chrome.sh)
  - [`../dev/agent/stop-shared-chrome.sh`](../dev/agent/stop-shared-chrome.sh)
  - [`../dev/agent/start-shared-chrome-tmux.sh`](../dev/agent/start-shared-chrome-tmux.sh)
  - [`../dev/agent/stop-shared-chrome-tmux.sh`](../dev/agent/stop-shared-chrome-tmux.sh)
  - [`../dev/agent/run-shared-chrome-foreground.sh`](../dev/agent/run-shared-chrome-foreground.sh)
  - [`../dev/agent/README.md`](../dev/agent/README.md)

Important comparison fact:

- Playwright real-extension E2E can load the same built extension successfully
- therefore the current failure is not sufficient evidence of a repository-side
  MV3 runtime regression

---

## 5. Confirmed Facts

The following were directly observed in the current MCP round.

### 5.1 Extension Installation Is Visible

- `install_extension` returned the extension id
- `list_extensions` showed the extension as enabled

### 5.2 Extension Page Navigation Failed

- direct navigation to:
  - `chrome-extension://almpmnhfcekajbogfambjghflcecacok/quick-search.html`
  failed with:
  - `net::ERR_BLOCKED_BY_CLIENT`

### 5.3 Iframe Fallback Also Failed

- embedding the extension page in an iframe on a local fixture page produced a
  blocked page rendered as:
  - `chrome-extension://invalid/`

### 5.4 Local Fixture Did Not Show Active Content-Script Artifacts

- a loopback fixture page loaded through MCP
- DOM inspection on that page did not show Saladict roots or injected extension
  UI artifacts in that round

### 5.5 `chrome://extensions` Was Not Enough To Recover Runtime Access

- the browser could open `chrome://extensions`
- but follow-up inspection through that page did not produce a usable path to a
  working extension runtime in this round

### 5.6 Playwright Still Passed

- `npm run test:e2e:playwright` passed in a real browser run with the same built
  extension
- `npm run test:required` also passed after the routing change set

---

## 6. Attempt Log

Attempts already made in this round:

1. installed unpacked extension through MCP
   - result: extension id returned and listed as enabled
2. attempted top-level navigation to `quick-search.html`
   - result: blocked by client
3. attempted to open extension content through iframe on a local fixture page
   - result: blocked/invalid extension page
4. attempted to inspect and recover state via `chrome://extensions`
   - result: no usable loaded-runtime path recovered in this round
5. validated the same build through Playwright real-extension E2E
   - result: extension runtime behaved correctly there
6. added a shared-browser launcher prototype under `dev/agent/`
   - result: startup contract and runtime registry now exist
7. verified that a direct foreground launch using Chrome for Testing with:
   - `--headless=new`
   - `--remote-debugging-port=9444`
   - unpacked extension loaded from `dist/chrome-mv3`
   can expose a reachable DevTools endpoint
   - result: `http://127.0.0.1:9444/json/version` responded successfully
8. tested the shared-browser launcher in multiple modes
   - result: current background persistence strategy still fails to keep the
     DevTools endpoint alive after launch
9. added a dedicated foreground launcher:
   - [`../dev/agent/run-shared-chrome-foreground.sh`](../dev/agent/run-shared-chrome-foreground.sh)
   - result: a foreground headless launch on `127.0.0.1:9222` exposed a
     reachable DevTools endpoint again
10. wrapped the foreground launcher in a detached tmux session:
   - [`../dev/agent/start-shared-chrome-tmux.sh`](../dev/agent/start-shared-chrome-tmux.sh)
   - result: `http://127.0.0.1:9222/json/version` was reachable while the
     browser was kept alive in tmux
   - result: a tmux runtime registry was written to:
     - `dev/agent/.runtime/shared-chrome-tmux.json`
11. connected to the tmux-shared browser over CDP and reached real extension
    pages again
    - result: `quick-search.html` opened successfully
    - result: the default profile was manually checked on:
      - `example`
      - `injuring more`
      - `general secretary of the Communist Party of China`
    - result: the rendered result mix matched the current routing expectation
12. added a reusable routing-check script:
    - [`../dev/agent/check-quick-search-routing.mjs`](../dev/agent/check-quick-search-routing.mjs)
    - result: the shared-browser lane can now be used for repeated routing
      checks without rewriting ad hoc CDP snippets
    - result: the script now tolerates one transient quick-search navigation
      failure by retrying once

---

## 7. Current Hypotheses

These are hypotheses, not confirmed facts.

### 7.1 MCP Browser Context Mismatch

Possible explanation:

- the extension install entry and the page/navigation context may not be backed
  by the same effective browser runtime context

### 7.2 Current MCP Launch Mode Is Too Isolated

Possible explanation:

- the current `chrome-devtools-mcp` configuration using `--isolated=true`
  may be good for clean sessions but not good for “keep and inspect a real
  loaded extension instance” workflows

### 7.3 This Is A Tooling/Session Problem Rather Than A Repository Problem

Possible explanation:

- because Playwright can load and exercise the same unpacked extension, the MCP
  failure is more likely caused by the MCP browser/session arrangement than by
  the ext-saladict MV3 runtime itself

### 7.4 Shared-Browser Background Persistence Is The Current Narrower Blocker

Possible explanation:

- the repository now has enough evidence that extension + remote debugging can
  work together
- the remaining issue is specifically how to keep a reconnectable browser
  instance alive in the background for MCP to attach to later

### 7.5 Tmux-Supervised Foreground Browser May Be The First Practical Lane

Possible explanation:

- a true daemonized shared browser is still unstable in this environment
- but a foreground browser in a dedicated `tmux` pane is already good enough to
  provide a reconnectable browser lane for MCP

### 7.6 The Remaining Gap Is Native MCP Reattachment, Not Real-Browser Access

Possible explanation:

- the shared browser lane has now restored real-browser extension-page access
- what remains unsolved is not “can we inspect a real extension instance?” but
  “can the native MCP tool session itself reattach to that lane cleanly?”

---

## 8. Non-Goals During Investigation

Do not do the following until MCP runtime access is re-established:

- do not modify `src/app-config/profiles.ts` again just because MCP is blocked
- do not reopen offscreen/runtime-boundary architecture
- do not treat the current MCP failure as proof of an MV3 regression

Keep using the existing repository rule:

- `Playwright -> MCP`

---

## 9. Next Experiments

Continue in this order.

1. Re-establish the MCP browser session itself before touching code.
   - Prefer a session that can attach to an already-running browser or otherwise
     preserves a real loaded extension runtime.
   - Start from the shared-browser prototype in:
     - [`../dev/agent/README.md`](../dev/agent/README.md)
   - Prefer the tmux launcher first:
     - [`../dev/agent/start-shared-chrome-tmux.sh`](../dev/agent/start-shared-chrome-tmux.sh)
2. Use that shared browser lane as the current manual-inspection fallback when
   native MCP reattachment is unavailable.
   - Prefer:
     - `./dev/agent/start-shared-chrome-tmux.sh`
     - `node dev/agent/check-quick-search-routing.mjs`
3. Only if the result mix becomes genuinely wrong in a usable real-browser lane
   should more product-routing code changes be considered.

---

## 10. First Action For The Next Session

If a new session picks this up, the first action should be:

1. read this document
2. read [`./workboard.md`](./workboard.md)
3. confirm that `npm run test:required` is already green in the current line
4. spend the next round on recovering a usable MCP loaded-extension runtime, not
   on changing repository code

---

## 11. Exit Note

This document exists because the current issue is a textbook `investigate`
phase problem:

- it is runtime/tooling-heavy
- it crosses sessions badly
- it is easy to lose context if everything stays only in chat history

So the purpose of this artifact is not to be elegant. The purpose is to let the
next session continue without reconstructing the entire investigation from
scratch.

---

## 12. Resolution Update

This investigation is no longer blocked at the same level.

Current resolved understanding:

- the original failing MCP lane was not the same as the working shared-browser
  lane
- the failing lane used:
  - system Chrome
  - isolated launch semantics
- the working lane uses:
  - tmux-supervised shared Chrome for Testing
  - a stable debug endpoint on `http://127.0.0.1:9222`
  - fresh MCP/Codex sessions attaching through `--browser-url`

Additional concrete fix:

- repo-local MCP launch now uses:
  - [`../dev/agent/start-shared-chrome-mcp.sh`](../dev/agent/start-shared-chrome-mcp.sh)
- that wrapper exists because `chrome-devtools-mcp` must not be started with
  both:
  - `--browser-url`
  - `--category-extensions=true`

Current verified result:

- fresh Codex/MCP sessions can now reach direct extension pages again
- extension service-worker/offscreen targets are visible in the shared browser
- a localhost fixture page in the same browser shows real Saladict content-script
  activity

So the remaining recommendation is no longer “recover any usable MCP runtime at
all”; it is:

- keep the shared-browser wrapper as the default MCP lane for this repository
- use fresh tmux-hosted Codex sessions when MCP config changes must be picked up
