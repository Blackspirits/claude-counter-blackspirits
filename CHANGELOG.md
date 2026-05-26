# Changelog

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
