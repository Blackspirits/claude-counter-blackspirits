# Security Policy

## Scope

This fork is intended for personal/local use on `https://claude.ai/*`.

## Data handling

- No external analytics.
- No third-party network calls in the extension build.
- No `chrome.storage`.
- `localStorage` is used only for the optional UI language preference under the key `claude-counter-blackspirits-language` on `claude.ai`. Choosing `Auto` removes that key.
- Conversation text is tokenized and hashed inside the isolated content script for local cache fingerprints; it is no longer sent through the injected page bridge for hashing.
- The extension reads Claude conversation and usage data from the active browser session only to render local UI counters.

## Reporting

For this BlackSpirits fork, review changes manually before publishing or distributing. Do not publish a store build without a fresh code review of:

- `manifest.json`
- `src/injected/bridge.js`
- `src/content/bridge-client.js`
- `src/content/usage.js`
- `src/content/main.js`

The legacy userscript is excluded from the beta package.

## Known risk

Any extension running on `claude.ai` has access to page data for that origin. Treat it as trusted code.


The MAIN-world bridge shares the page's trust boundary. Origin/source checks exclude foreign windows; they do not authenticate messages against scripts already running on claude.ai. The bridge exposes only readiness and bounded same-origin GET operations. It does not receive extension privileges or secrets. A page can still interfere with its own displayed counters.
