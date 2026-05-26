# Claude Counter - BlackSpirits Edition

[Português (pt-PT)](README.pt-PT.md)

A privacy-focused fork of [Claude Counter](https://github.com/she-llac/claude-counter) for `claude.ai` in the browser.

It adds lightweight context and usage indicators directly to the Claude web interface while keeping the extension small, local, and easy to audit.

> Original credits and MIT licence are preserved.

## Features

- **Approximate token counter** for the current conversation.
- **Context progress bar** using a 200k-token reference limit.
- **Cache timer** for the active conversation.
- **5-hour session usage** with reset time and countdown.
- **Weekly usage** with reset time and countdown.
- **Multilingual UI**: Auto, Portuguese (Portugal), English, French, Spanish, German and Italian.
- **Compact language chip** after selection (`AUTO`, `PT`, `EN`, `FR`, etc.).
- **Hidden-tab optimisation** to avoid unnecessary UI work in background tabs.
- **Keyboard-accessible refresh** on the usage row.
- **No analytics, no third-party requests, no `chrome.storage`** in the extension build.

## What changed in this fork

This BlackSpirits edition keeps the original concept, but hardens and modernises the implementation:

- isolated internal namespace to reduce conflict risk with the original extension;
- stricter `postMessage` origin checks;
- Claude API URLs use encoded organization/conversation IDs;
- usage data is not applied if the active organization changes while a request is in flight;
- conversation/token hashing stays in the isolated content script;
- better extraction of text from tool and web-search style payloads;
- clearer privacy, security and audit documentation;
- basic validation tooling and GitHub Actions workflow.

## Installation

### Chrome / Edge / Chromium

1. Download the release ZIP.
2. Extract it to a stable folder, for example:

   ```text
   C:\Tools\claude-counter-blackspirits
   ```

3. Open:

   ```text
   chrome://extensions
   ```

4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the folder containing `manifest.json`.
7. Reload `https://claude.ai`.

Do not delete the extracted folder afterwards. Chromium reads the extension directly from that folder.

## Recommended usage

Use the counters as a practical indicator, not as Claude's official accounting source.

The usage data is read from Claude's own web session, but token counting is still approximate. For important limits, compare with Claude's native usage panel.

## Language selection

The injected UI includes a small language selector. After choosing a language, it collapses into a compact chip:

```text
AUTO / PT / EN / FR / ES / DE / IT
```

Click the chip to open the selector again.

The selected language is stored locally on `https://claude.ai`:

```text
claude-counter-blackspirits-language
```

Choosing `Auto` removes that key.

## Privacy

The extension build:

- runs only on `https://claude.ai/*`;
- does not send prompts, responses or conversations to external servers;
- does not use analytics;
- does not use `chrome.storage`;
- does not keep local usage history;
- uses `localStorage` only for the optional language preference;
- makes requests only to `claude.ai`, using the browser session that is already active.

See [PRIVACY.md](PRIVACY.md) for details.

## Known limitations

- Token counts are estimates, not official Claude token counts.
- Web search, file, image and tool outputs can still be undercounted.
- After context compaction, the token bar may no longer reflect the full effective context.
- The extension targets `claude.ai` in the browser.
- Claude Desktop, Claude Code in the terminal and `claude.ai/code` are not officially supported.
- Claude UI or API changes can break selectors or internal endpoint assumptions.

## Development

Validate the extension before committing:

```bash
npm run validate
```

The validation checks:

- manifest shape and version alignment;
- allowed origins and absence of extra permissions;
- locale files;
- JavaScript syntax;
- bridge isolation markers;
- documentation split between English and pt-PT.

## Project structure

```text
src/content/        Isolated content scripts and UI logic
src/injected/       Page-context bridge used to observe Claude network events
src/vendor/         Vendored tokenizer
_locales/           Browser extension manifest translations
.github/workflows/  Validation workflow
```

## Userscript status

The userscript version is kept only as a legacy reference.

For normal use, install the browser extension. The extension vendors the tokenizer locally and is easier to audit.

## Security

Treat this as high-trust code: it runs inside `claude.ai` and can read page data for that origin.

Review at least these files before distributing a build:

- `manifest.json`
- `src/injected/bridge.js`
- `src/content/bridge-client.js`
- `src/content/tokens.js`
- `src/content/main.js`

See [SECURITY.md](SECURITY.md).

## Licence

MIT. Original Claude Counter credits are preserved.
