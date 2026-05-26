import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const errors = [];

async function readText(file) {
  try {
    return await readFile(file, 'utf8');
  } catch (err) {
    errors.push(`${file}: cannot read file (${err.message})`);
    return '';
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    errors.push(`${file}: invalid JSON (${err.message})`);
    return null;
  }
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

const pkg = await readJson('package.json');
const manifest = await readJson('manifest.json');

if (pkg) {
  assert(pkg.name === 'claude-counter-blackspirits', 'package.json: unexpected package name');
  assert(typeof pkg.version === 'string' && pkg.version, 'package.json: missing version');
  assert(pkg.type === 'module', 'package.json: expected type=module');
}

if (manifest) {
  assert(manifest.manifest_version === 3, 'manifest.json: expected manifest_version 3');
  assert(manifest.name === '__MSG_extName__', 'manifest.json: name should use __MSG_extName__');
  assert(manifest.description === '__MSG_extDescription__', 'manifest.json: description should use __MSG_extDescription__');
  assert(manifest.default_locale === 'en', 'manifest.json: default_locale should be en');
  if (pkg?.version) assert(manifest.version === pkg.version, 'manifest.json: version must match package.json');

  assert(!manifest.permissions || manifest.permissions.length === 0, 'manifest.json: avoid extension permissions unless strictly needed');
  assert(!manifest.host_permissions || manifest.host_permissions.length === 0, 'manifest.json: avoid host_permissions; content_scripts already scope claude.ai');
  assert(!manifest.browser_specific_settings, 'manifest.json: browser_specific_settings should be omitted until Firefox is tested');

  const matches = manifest.content_scripts?.flatMap((script) => script.matches || []) || [];
  assert(matches.length === 1 && matches[0] === 'https://claude.ai/*', 'manifest.json: content script should only match https://claude.ai/*');

  const resources = manifest.web_accessible_resources?.flatMap((entry) => entry.resources || []) || [];
  assert(resources.length === 1 && resources.includes('src/injected/bridge.js'), 'manifest.json: only bridge.js should be web-accessible');
}

const requiredLocales = ['en', 'pt_PT', 'fr', 'es', 'de', 'it'];
const localesDir = path.join(root, '_locales');
if (existsSync(localesDir)) {
  const locales = (await readdir(localesDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const locale of requiredLocales) {
    assert(locales.includes(locale), `_locales: missing ${locale} locale`);
  }
  for (const locale of locales) {
    const file = path.join('_locales', locale, 'messages.json');
    const json = await readJson(file);
    if (!json) continue;
    assert(typeof json.extName?.message === 'string' && json.extName.message, `${file}: missing extName.message`);
    assert(typeof json.extDescription?.message === 'string' && json.extDescription.message, `${file}: missing extDescription.message`);
  }
} else {
  errors.push('_locales: missing directory');
}

const jsFiles = [
  'src/content/constants.js',
  'src/content/bridge-client.js',
  'src/content/i18n.js',
  'src/content/tokens.js',
  'src/content/ui.js',
  'src/content/main.js',
  'src/injected/bridge.js',
  'userscript/claude-counter.user.js'
];

for (const file of jsFiles) {
  if (!existsSync(file)) {
    errors.push(`${file}: missing`);
    continue;
  }
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`${file}: syntax check failed\n${result.stderr || result.stdout}`);
  }
}

const bridge = existsSync('src/injected/bridge.js') ? await readText('src/injected/bridge.js') : '';
const bridgeClient = existsSync('src/content/bridge-client.js') ? await readText('src/content/bridge-client.js') : '';
const constants = existsSync('src/content/constants.js') ? await readText('src/content/constants.js') : '';
const styles = existsSync('src/styles.css') ? await readText('src/styles.css') : '';
const ui = existsSync('src/content/ui.js') ? await readText('src/content/ui.js') : '';

assert(bridge.includes("const CC_MARKER = 'ClaudeCounterBlackSpirits'"), 'bridge.js: expected BlackSpirits marker');
assert(bridgeClient.includes("data.ccbs !== 'ClaudeCounterBlackSpirits'"), 'bridge-client.js: expected ccbs marker validation');
assert(!bridge.includes("kind === 'hash'"), 'bridge.js: hashing should stay in the isolated content script, not page bridge');
assert(!bridge.includes('requestHash'), 'bridge.js: requestHash should not be exposed');
assert(constants.includes("BRIDGE_SCRIPT_ID: 'ccbs-bridge-script'"), 'constants.js: bridge script id should be namespaced');
assert(!styles.includes('.cc-'), 'styles.css: use ccbs-* classes, not generic cc-* classes');
assert(!ui.includes('cc-'), 'ui.js: use ccbs-* classes, not generic cc-* classes');

const readme = existsSync('README.md') ? await readText('README.md') : '';
const readmePt = existsSync('README.pt-PT.md') ? await readText('README.pt-PT.md') : '';
assert(readme.startsWith('# Claude Counter - BlackSpirits Edition'), 'README.md: missing title');
assert(readme.includes('[Português (pt-PT)](README.pt-PT.md)'), 'README.md: should link to pt-PT README');
assert(readmePt.includes('[English](README.md)'), 'README.pt-PT.md: should link back to English README');
assert(!readme.includes('## Português (pt-PT)'), 'README.md: keep English as the primary README; pt-PT belongs in README.pt-PT.md');

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}

console.log('Validation passed.');
