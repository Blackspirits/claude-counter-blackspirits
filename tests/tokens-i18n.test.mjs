import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import { webcrypto } from 'node:crypto';
const read = file => fs.readFileSync(file, 'utf8');
const context = vm.createContext({ TextEncoder, TextDecoder, crypto: webcrypto });
for (const file of ['constants', '../vendor/o200k_base', 'tokens']) vm.runInContext(read(`src/content/${file}.js`), context);
const count = context.ClaudeCounterBlackSpirits.tokens.computeConversationMetrics;
const conversation = text => ({ current_leaf_message_uuid: 'a', chat_messages: [{ uuid: 'a', sender: 'human', content: [{ type: 'text', text }] }] });
test('special token-looking text is counted as ordinary text', async () => {
 assert.equal((await count(conversation('Hello world'))).totalTokens, 2);
 assert.equal((await count(conversation('Hello <|endoftext|> world'))).totalTokens, 9);
});
test('cyclic and incomplete trees fail instead of hanging or undercounting', async () => {
 await assert.rejects(count({ current_leaf_message_uuid: 'a', chat_messages: [{ uuid: 'a', parent_message_uuid: 'b' }, { uuid: 'b', parent_message_uuid: 'a' }] }), /Cyclic/);
 await assert.rejects(count({ current_leaf_message_uuid: 'missing', chat_messages: [] }), /Incomplete/);
 await assert.rejects(count({ chat_messages: [{ uuid: 'a' }] }), /Missing/);
});
test('large inputs and cancelled calculations fail explicitly', async () => {
 await assert.rejects(count(conversation('x'.repeat(250001))), /too large/);
 await assert.rejects(count(conversation('hello'), () => true), /Superseded/);
});
test('hash cache invalidates edited message content', async () => {
 const first = await count(conversation('Hello world'));
 const second = await count(conversation('Hello world and another sentence'));
 assert(second.totalTokens > first.totalTokens);
});
function i18n(blocked = false, language = 'en-US') {
 const map = new Map(); const c = vm.createContext({ navigator: { language }, localStorage: { getItem: k => map.get(k), setItem(k, v) { if (blocked) throw Error('blocked'); map.set(k, v); }, removeItem() { if (blocked) throw Error('blocked'); } }, window: { dispatchEvent() {} }, CustomEvent: class {} });
 vm.runInContext(read('src/content/i18n.js').replace('function normalizeLanguage(lang)', 'globalThis.tables = STRINGS; function normalizeLanguage(lang)'), c);
 return { api: c.ClaudeCounterBlackSpirits.i18n, tables: c.tables };
}
test('language preference survives blocked storage until reload', () => {
 const { api } = i18n(true); api.setStoredLanguage('pt-PT'); assert.equal(api.getActiveLanguage(), 'pt-PT');
 api.setStoredLanguage('auto'); assert.equal(api.getActiveLanguage(), 'en');
 api.setStoredLanguage('__proto__'); assert.equal(api.getActiveLanguage(), 'en');
});
test('six translations have matching keys and placeholders', () => {
 const { tables } = i18n(); const keys = Object.keys(tables.en).sort();
 assert.equal(Object.keys(tables).length, 6);
 for (const [lang, table] of Object.entries(tables)) {
  assert.deepEqual(Object.keys(table).sort(), keys, lang);
  for (const key of keys) assert.deepEqual((table[key].match(/\{\w+\}/g) || []).sort(), (tables.en[key].match(/\{\w+\}/g) || []).sort(), `${lang}:${key}`);
 }
});
