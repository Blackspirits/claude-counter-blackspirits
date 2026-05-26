# Contributing

This fork is intentionally small and conservative.

## Rules

- Keep the extension permission profile minimal.
- Do not add analytics.
- Do not add third-party network calls to the extension build.
- Prefer local/vendor assets over runtime CDN dependencies.
- Keep `README.md` in English and `README.pt-PT.md` in Portuguese (Portugal).
- Run validation before every commit:

  ```bash
  npm run validate
  ```

## Areas that need real testing

Do not claim support without testing for:

- Claude Desktop;
- Claude Code in the terminal;
- `claude.ai/code`;
- Firefox/AMO packaging.
