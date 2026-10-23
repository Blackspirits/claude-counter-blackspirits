# Contributing

Use Node.js 22 or newer. Run `npm ci --ignore-scripts`, `npm run validate` and `npm test` before submitting a change. For bridge, manifest or UI changes, install Chromium with `npx playwright install chromium` and run `npm run test:e2e`.

Keep all six UI translations and their placeholders aligned. Add regression coverage for reproduced behavior. Do not use real conversation data, cookies or credentials in fixtures.

`npm run package` produces the installable extension folder. The userscript is historical and is not part of this package. Preserve upstream and tokenizer MIT notices. See BETA_TESTING.md for live-account release checks.
