# Claude Counter - BlackSpirits Edition

[Português (pt-PT)](README.pt-PT.md)

A privacy-focused fork of [Claude Counter](https://github.com/she-llac/claude-counter) for `claude.ai`. Original credits and MIT licence are preserved.

**0.5.0-beta.2 — experimental, for testing before a stable release.**

## Features

- Approximate token count for visible text in the current conversation branch.
- Session and global weekly usage, with reset times from Claude's web endpoints.
- Visible loading, updated, stale, unavailable and sign-in/access states.
- Dedicated keyboard-accessible refresh button and language selector.
- Auto, Portuguese (Portugal), English, French, Spanish, German and Italian.
- Local tokenization, no analytics, no external services and no saved conversation history.

The token estimate uses a generic `o200k_base` tokenizer, not Claude's official tokenizer. It excludes hidden prompts and non-text media. The beta removes the fixed 200k context bar and inferred cache timer because neither was backed by verified account/model data. It does not measure remaining context or detect compaction.

## Install the beta

Chrome/Edge/Chromium 111 or newer is required. Firefox, Claude Desktop and Claude Code are not validated targets.

1. Download the `claude-counter-blackspirits-0.5.0-beta.2` artifact from a **successful** [Actions run](https://github.com/Blackspirits/claude-counter-blackspirits/actions), or build locally below.
2. Extract the ZIP into a permanent folder.
3. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
4. Choose **Load unpacked** and select the folder containing `manifest.json`.
5. Reload `https://claude.ai`. Disable another Claude Counter installation while testing to avoid duplicate indicators.

To update an unpacked installation, replace its files, click Reload on its extension card, then reload Claude. There is no automatic updater or toolbar popup.

## Reliability and limits

- Usage is scoped to the active organization. Switching organizations or signing out clears the previous state.
- Partial SSE updates preserve other windows; older requests cannot overwrite newer values for the same window.
- Usage is polled every five minutes in visible tabs as a fallback. Reset boundaries can trigger an earlier request.
- Failed requests back off from one minute up to roughly 30 minutes, with jitter. HTTP 429 respects `Retry-After`. HTTP 401/403 pauses automatic retries; manual refresh can retry after one minute.
- Reset times are displayed to the minute without rounding to five-minute boundaries. Values past their reset are marked stale until replaced.
- Connect/protobuf live updates are **not decoded**. Detection displays a limitation notice; the REST fallback still depends on Claude retaining the internal endpoints.
- Missing/changed DOM anchors can prevent insertion. Unknown payloads report unavailability instead of a fabricated zero.
- Large conversations are bounded: 8 MiB per observed response, 10,000 messages, 250,000 characters per counted message and 2 million characters per calculation. Exceeding a limit makes the estimate unavailable.
- The counters do not replace Claude's native usage page. Synthetic tests cannot verify current endpoints, quotas or layout on every real account.

## Language and privacy

The language selector stores only the preference `claude-counter-blackspirits-language` in `claude.ai` localStorage. Auto removes it. If storage is blocked, the choice lasts until reload.

The extension runs only on `https://claude.ai/*`, reads the `lastActiveOrg` cookie and makes GET requests using the existing Claude session. Conversation text is processed locally; it is not sent to another service. See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

## Development

Node.js 22 or newer:

```bash
npm ci --ignore-scripts
npm run validate
npm test
npm run package
npx playwright install chromium
npm run test:e2e
```

`npm run package` creates `dist/claude-counter-blackspirits/`, ready for Load unpacked. It includes only manifest-referenced assets, translations and licence/privacy notices. Playwright is a development dependency; it is not shipped in the extension.

The browser test loads the **packaged MV3 extension** into a persistent Chromium context against a synthetic Claude page with mocked endpoints. It covers early MAIN-world startup, a strict page CSP, bridge handshake, usage/tokens, pt-PT, a narrow viewport, navigation, organization change and logout. No Claude account or live conversation is used.

See [BETA_TESTING.md](BETA_TESTING.md) for the remaining live-account checks.

## Structure and licence

- `src/content/`: isolated UI, usage state, localization and tokenization.
- `src/injected/`: early page-world fetch/history observer and bounded GET bridge.
- `src/vendor/`: bundled tokenizer with its existing MIT notice.
- `tests/`: regression tests and Chromium extension integration test.
- `userscript/`: historical reference only; excluded from the beta package.

MIT. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
