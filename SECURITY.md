# Security Policy

## Scope

This fork is intended for personal/local use on `https://claude.ai/*`.

## Data handling

- No external analytics.
- No third-party network calls in the extension build.
- No `chrome.storage` or `localStorage` usage in v0.4.3.
- The extension reads Claude conversation and usage data from the active browser session only to render local UI counters.

## Reporting

For this BlackSpirits fork, review changes manually before publishing or distributing. Do not publish a store build without a fresh code review of:

- `manifest.json`
- `src/injected/bridge.js`
- `src/content/bridge-client.js`
- `userscript/claude-counter.user.js`

## Known risk

Any extension running on `claude.ai` has access to page data for that origin. Treat it as trusted code.
