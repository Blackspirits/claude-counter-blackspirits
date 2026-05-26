import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const errors = [];

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

const manifest = await readJson('manifest.json');
if (manifest) {
  assert(manifest.manifest_version === 3, 'manifest.json: expected manifest_version 3');
  assert(manifest.name === '__MSG_extName__', 'manifest.json: name should use __MSG_extName__');
  assert(manifest.description === '__MSG_extDescription__', 'manifest.json: description should use __MSG_extDescription__');
  assert(manifest.default_locale === 'en', 'manifest.json: default_locale should be en');

  const matches = manifest.content_scripts?.flatMap((script) => script.matches || []) || [];
  assert(matches.length === 1 && matches[0] === 'https://claude.ai/*', 'manifest.json: content script should only match https://claude.ai/*');

  const resources = manifest.web_accessible_resources?.flatMap((entry) => entry.resources || []) || [];
  assert(resources.includes('src/injected/bridge.js'), 'manifest.json: bridge.js must be web-accessible');
}

const localesDir = path.join(root, '_locales');
if (existsSync(localesDir)) {
  const locales = (await readdir(localesDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  assert(locales.includes('en'), '_locales: missing default en locale');
  for (const locale of locales) {
    const file = path.join('_locales', locale, 'messages.json');
    const json = await readJson(file);
    if (!json) continue;
    assert(typeof json.extName?.message === 'string' && json.extName.message, `${file}: missing extName.message`);
    assert(typeof json.extDescription?.message === 'string' && json.extDescription.message, `${file}: missing extDescription.message`);
  }
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

const bridge = existsSync('src/injected/bridge.js') ? await readFile('src/injected/bridge.js', 'utf8') : '';
assert(!bridge.includes("kind === 'hash'"), 'bridge.js: hashing should stay in the isolated content script, not page bridge');
assert(!bridge.includes('requestHash'), 'bridge.js: requestHash should not be exposed');

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join('\n'));
  process.exit(1);
}

console.log('Validation passed.');
