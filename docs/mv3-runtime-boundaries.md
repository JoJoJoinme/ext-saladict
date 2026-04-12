# MV3 Runtime Boundaries

This document records the runtime boundary rules that the current Chrome MV3
build must follow. It exists to prevent the repo from drifting back to MV2
assumptions that still "seem to work" in one browser, but break in real MV3
contexts such as service workers and hidden offscreen documents.

## Goals

- Keep the production runtime aligned with Chrome's MV3 model.
- Separate "works in a visible extension page" from "works in a hidden
  offscreen document".
- Make future AI or human changes reviewable against explicit boundaries.

## Runtime Roles

### Background Service Worker

Owns all extension APIs and browser integration:

- `storage`
- `cookies`
- `declarativeNetRequest`
- `webRequest`
- `tabs`
- `windows`
- `notifications`
- `contextMenus`
- `permissions`
- `system.display`

This layer is the only place that may depend on service-worker-only or
extension-wide capabilities.

### Offscreen Document

Owns only DOM-capable work that the service worker cannot do directly:

- audio playback
- clipboard read/write via DOM commands
- DOM parsing and dictionary HTML extraction

Per Chrome's offscreen design, the only extension API we should rely on here is
`chrome.runtime` messaging. The offscreen document must not behave like a
general-purpose hidden background page.

References:

- https://developer.chrome.com/docs/extensions/reference/offscreen
- https://developer.chrome.com/blog/Offscreen-Documents-in-Manifest-v3

### Extension Pages

Visible extension pages such as popup, options, history, notebook, quick
search, and word editor may use regular page APIs and extension page APIs as
needed. These are normal extension pages, not hidden execution carriers.

### Content Scripts

Own page DOM interaction and UI injection into arbitrary sites. They should not
own global extension state or privileged browser-side effects.

## Boundary Rules

### 1. Background Owns Extension Side Effects

Dictionary-specific runtime preparation must happen in background, not in
offscreen and not inside dictionary engines.

Examples:

- `ZDIC` audio referer rewriting belongs in background DNR setup.
- `HJDict` cookie seeding belongs in background cookie setup.

### 2. Offscreen Must Be Purely DOM-Oriented

Hidden offscreen code may:

- receive runtime messages
- parse fetched documents
- play audio
- use DOM clipboard shims

Hidden offscreen code must not directly depend on:

- `storage.sync`
- `storage.local`
- `cookies`
- `declarativeNetRequest`
- `webRequest`
- `tabs`
- `windows`

If offscreen needs config or profile state, background must compute that state
first and send it in the request payload.

### 3. Dictionary Engines Must Stay Pure

Dictionary engines are allowed to:

- fetch remote content
- parse documents
- format result payloads

Dictionary engines are not allowed to:

- mutate extension storage
- install browser rules
- set cookies via extension APIs
- inspect tabs/windows

If an engine needs privileged preparation, background must perform that
preparation before delegating execution.

### 4. Service Worker Must Not Assume Persistence

Background code must not rely on long-lived in-memory state or delayed timers as
critical infrastructure. Module-scoped caches are allowed as performance hints,
but storage remains the source of truth.

Prefer:

- event-driven logic
- storage-backed state
- `chrome.alarms` for durable delayed work

Treat `setTimeout` in service worker code as best-effort only.

Reference:

- https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers

## Findings From Current Review

### Confirmed MV3-Aligned Areas

- Manifest, permissions, and service worker entry are MV3.
- PDF interception already follows MV3-compatible non-blocking patterns.
- Background state cache in `src/background/state.ts` follows MV3 service worker
  constraints better than the old `window.*` model.

### Confirmed Boundary Violations

1. Hidden offscreen fetch path read `storage` through config/profile helpers.
2. `ZDIC` engine installed DNR/webRequest behavior directly.
3. `HJDict` engine set cookies directly.

These are exactly the kinds of bugs that can pass in a visible extension page
while failing in a real hidden offscreen document.

## Required Design Direction

The correct long-term architecture is:

1. Content/UI requests background work.
2. Background loads config/profile from storage-backed state.
3. Background performs any privileged preparation:
   - DNR
   - cookies
   - permissions checks
4. Background sends a pure execution payload to offscreen.
5. Offscreen runs DOM-capable engine work and returns results.

That means:

- background = privileged orchestrator
- offscreen = DOM worker
- dictionary engine = pure parser/fetch logic

## Testing Gates

Changes that touch MV3 boundaries must satisfy all of the following:

- unit tests for the boundary helper or runtime adapter
- Playwright real-extension E2E
- acceptance coverage for the affected user flow

Additionally, offscreen-related changes must preserve this invariant:

- user-visible flows must not open a visible `offscreen.html` tab or window

## Review Checklist

Before merging MV3-sensitive changes, verify:

- Does this code run in service worker, hidden offscreen, visible extension
  page, or content script?
- Is it using an API that is actually allowed in that context?
- If this code sits in a dictionary engine, is it still pure?
- If the code needs privileged browser-side effects, why is it not in
  background?
- Does the test cover the user intent, not just the helper implementation?
