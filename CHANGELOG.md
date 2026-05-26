# Changelog

## v0.4.7 - Compact language switcher

- Language choice now collapses into a small chip (`PT`, `EN`, `FR`, etc.) after selection.
- The full selector opens only when the chip is clicked, keeping Claude's input area cleaner.
- No new permissions or storage changes.

## 0.4.6 - BlackSpirits Edition

- Moved message hashing into the isolated content script; full message text is no longer sent through the injected page bridge for local cache fingerprints.
- Fixed privacy/security documentation to accurately mention the optional language `localStorage` key.
- Selecting `Auto` now removes the stored language preference.
- Added German and Italian to the injected UI and browser manifest locales.
- Added keyboard refresh/accessibility labels for the usage row and language selector.
- Added `PRIVACY.md`.
- Added `package.json`, `tools/validate.mjs` and a GitHub Actions validation workflow.
- Marked the userscript as legacy and documented why the extension build is recommended.

## 0.4.5 - BlackSpirits Edition

- Added multilingual injected UI with Auto, pt-PT, English, French and Spanish.
- Added a compact language selector in the usage row.
- Stores the selected language locally on `claude.ai` without adding extension permissions.
- Localized usage labels, reset text, cache label, countdown units and tooltips.
- Localized the browser extension manifest for supported languages.

## 0.4.4 - BlackSpirits Edition

### Added

- Bilingual README in pt-PT and English.

### Changed

- Decodes the `lastActiveOrg` cookie before using it.
- Detects completion requests more reliably when `fetch` receives a `Request` object.
- Treats non-OK Claude usage/conversation endpoint responses as explicit errors.
- Skips background usage polling while the tab is hidden and refreshes on visibility restore.
- Prevents stale conversation metrics from updating the UI after navigation.

## 0.4.3 - BlackSpirits Edition

### Added

- BlackSpirits Edition branding.
- Exact-ish reset time display with 5-minute rounding and countdown.
- `SECURITY.md` with extension risk notes.

### Changed

- Skips UI countdown ticks while the browser tab is hidden.
- Refreshes usage and conversation data after returning to a stale tab.
- Restricts `postMessage` traffic to `https://claude.ai`.
- Encodes organization and conversation IDs before building Claude API URLs.
- Improves textual extraction for some tool/web-search payloads.

### Not included

- No popup/settings/history PR included, to avoid adding storage permissions and local usage history before a deeper privacy review.
