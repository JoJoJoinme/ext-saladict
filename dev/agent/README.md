# Shared Browser Prototype

This folder contains a minimal prototype for a persistent Chrome runtime that
can survive agent/session replacement better than a fresh isolated MCP launch.

## Why

The current MCP/browser issue in this repository is not that Playwright cannot
load the extension. Playwright can. The problem is that the current MCP session
does not reliably expose a usable loaded-extension runtime after installation.

The prototype here follows the simpler pattern recommended by
`chrome-devtools-mcp`:

1. start a real browser yourself
2. keep it alive with a known profile and debug port
3. connect MCP to that browser with `--browser-url=...`

On Linux in this repository, the launcher prefers a helper script that runs
`Xvfb + Chrome + liveness loop` together so the browser can stay alive even
when there is no durable desktop session attached.

## Files

- `start-shared-chrome.sh`
  - launches Chrome/Chromium with:
    - remote debugging enabled
    - the unpacked extension loaded from `dist/chrome-mv3`
    - the repository proxy default
  - writes runtime metadata to `dev/agent/.runtime/shared-chrome.json`
- `stop-shared-chrome.sh`
  - stops the browser recorded in the runtime file
- `start-shared-chrome-mcp.sh`
  - starts or reuses the tmux shared browser
  - then launches `chrome-devtools-mcp` attached through `--browser-url`
  - this is the preferred repo-local MCP wrapper after the runtime mismatch
    investigation

## Usage

Build the extension first:

```bash
npm run build
```

Start the browser:

```bash
./dev/agent/start-shared-chrome.sh
```

Start in headless mode:

```bash
SHARED_CHROME_HEADLESS=1 ./dev/agent/start-shared-chrome.sh
```

Run a foreground browser that is suitable for a dedicated `tmux` pane:

```bash
./dev/agent/run-shared-chrome-foreground.sh
```

Create a detached `tmux` session that keeps the foreground browser alive:

```bash
./dev/agent/start-shared-chrome-tmux.sh
```

Check the default profile routing through that shared browser:

```bash
node dev/agent/check-quick-search-routing.mjs
```

Check custom queries:

```bash
node dev/agent/check-quick-search-routing.mjs "example" "injuring more"
```

The checker retries once on transient extension-page navigation failure so it is
more tolerant of quick page detach/recreate behavior in the shared browser.

Dry-run the resolved configuration without launching:

```bash
DRY_RUN=1 ./dev/agent/start-shared-chrome.sh
```

Then connect Chrome DevTools MCP to the already-running browser:

```bash
npx -y chrome-devtools-mcp@latest --browser-url=http://127.0.0.1:9222
```

Or use the repo-local wrapper:

```bash
./dev/agent/start-shared-chrome-mcp.sh
```

## Current Note

- The repository now has evidence that a direct foreground headless launch can
  keep the DevTools endpoint reachable with the unpacked extension loaded.
- The background shared-browser launcher still needs more work before it can be
  treated as a stable always-on browser lane.
- So at the moment, `SHARED_CHROME_HEADLESS=1` is the safer fallback experiment
  mode than the default headful path.
- The currently validated practical path is:
  - run `start-shared-chrome-tmux.sh`
  - confirm `http://127.0.0.1:9222/json/version` responds
  - run `node dev/agent/check-quick-search-routing.mjs`
  - connect MCP to `--browser-url=http://127.0.0.1:9222`
- The old failing MCP lane used a different browser/runtime shape:
  - system Chrome rather than Chrome for Testing
  - isolated launch semantics rather than a stable shared profile
- The working shared-browser lane is explicitly Chrome for Testing:
  - `/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`
- Important `chrome-devtools-mcp` constraint:
  - `--browser-url` and `--category-extensions=true` must not be used together
  - once MCP attaches to an existing shared browser, extension targets come from
    that browser runtime directly

## Fresh Session Validation

If MCP config changed, do not trust the current Codex/MCP session to pick it up.

Preferred recovery pattern:

1. keep the shared browser running in tmux
2. start a fresh tmux session
3. run `codex exec` there
4. constrain that fresh session to MCP/browser validation
5. collect logs and final output under `dev/agent/.runtime/`

This is the practical way to distinguish:

- stale current session
- broken MCP wiring
- actual extension/runtime regression

Stop the browser:

```bash
./dev/agent/stop-shared-chrome.sh
```

Stop the detached `tmux` browser session:

```bash
./dev/agent/stop-shared-chrome-tmux.sh
```

## Runtime Registry

When running, the browser runtime is described in:

```text
dev/agent/.runtime/shared-chrome.json
```

When the `tmux` launcher is used, an additional registry file is written:

```text
dev/agent/.runtime/shared-chrome-tmux.json
```

That file is intentionally machine-readable and session-neutral so the next
agent/session can find the current browser instead of guessing how it was
started.
