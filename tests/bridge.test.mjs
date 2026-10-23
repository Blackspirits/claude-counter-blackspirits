import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const code = fs.readFileSync('src/injected/bridge.js', 'utf8');
const flush = async () => { for (let i = 0; i < 10; i++) await new Promise(resolve => setImmediate(resolve)); };
function harness(factory = () => Response.json({})) {
 const calls = [], posts = []; let listener;
 const window = { fetch: async (...args) => { calls.push(args); return factory(); }, postMessage: data => posts.push(data), dispatchEvent() {}, addEventListener: (name, fn) => { if (name === 'message') listener = fn; } };
 const context = vm.createContext({ window, history: { pushState() {}, replaceState() {} }, location: { href: 'https://claude.ai/new' }, URL, Request, Response, TextDecoder, AbortController, CustomEvent: class {}, setTimeout, clearTimeout });
 vm.runInContext(code, context);
 return { window, calls, posts, context, dispatch: (data, origin = 'https://claude.ai', source = window) => listener({ data, origin, source }) };
}
const request = (kind, payload) => ({ ccbs: 'ClaudeCounterBlackSpirits', type: 'ccbs:request', requestId: 'test', kind, payload });
test('bridge rejects foreign origins, foreign windows and malformed identifiers', async () => {
 const h = harness(); const message = request('usage', { orgId: 'A' });
 await h.dispatch(message, 'https://example.invalid'); await h.dispatch(message, 'https://claude.ai', {});
 await h.dispatch(request('usage', { orgId: {} })); assert.equal(h.calls.length, 0);
});
test('readiness handshake does not make a network request and installation is idempotent', async () => {
 const h = harness(); const wrapped = h.window.fetch; vm.runInContext(code, h.context); assert.equal(h.window.fetch, wrapped);
 await h.dispatch(request('ping', {})); assert.equal(h.calls.length, 0); assert.equal(h.posts[0].payload.ready, true);
});
test('identifiers are encoded; HTTP status and Retry-After reach the client', async () => {
 const h = harness(() => new Response('{}', { status: 429, headers: { 'retry-after': '120' } }));
 await h.dispatch(request('usage', { orgId: 'a/b?c' }));
 assert.equal(h.calls[0][0], 'https://claude.ai/api/organizations/a%2Fb%3Fc/usage');
 assert.equal(h.posts[0].error.status, 429); assert.equal(h.posts[0].error.retryAfterMs, 120000);
});
test('SSE parsing preserves final data, multiline events and organization identity', async () => {
 const h = harness(() => new Response('data: {"type":"message_limit",\r\ndata: "message_limit":{"windows":{"5h":{"utilization":0.4}}}}', { headers: { 'content-type': 'text/event-stream' } }));
 const response = await h.window.fetch('https://claude.ai/api/organizations/A/chat_conversations/C/completion', { method: 'POST' });
 assert.match(await response.text(), /message_limit/); await flush();
 const event = h.posts.find(p => p.type === 'ccbs:message_limit'); assert.equal(event.payload.orgId, 'A'); assert.equal(event.payload.messageLimit.windows['5h'].utilization, .4);
 assert(h.posts.some(p => p.type === 'ccbs:generation_end' && p.payload.conversationId === 'C'));
});
test('SSE split CRLF and final UTF-8 bytes are parsed without corrupting the page stream', async () => {
 const bytes = new TextEncoder().encode('data: {"type":"message_limit","message_limit":{"label":"ação","windows":{"5h":{"utilization":0.4}}}}\r\n\r\n');
 const h = harness(() => new Response(new ReadableStream({ start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); controller.close(); } }), { headers: { 'content-type': 'text/event-stream' } }));
 const response = await h.window.fetch('https://claude.ai/api/organizations/A/chat_conversations/C/completion'); await response.text(); await flush();
 assert.equal(h.posts.find(p => p.type === 'ccbs:message_limit').payload.messageLimit.label, 'ação');
});
test('foreign SSE is not observed; unsupported Claude transport is visible', async () => {
 const foreign = harness(() => new Response('data: {}', { headers: { 'content-type': 'text/event-stream' } })); await foreign.window.fetch('https://example.invalid/completion', { method: 'POST' }); await flush(); assert.equal(foreign.posts.length, 0);
 const connect = harness(() => new Response('', { headers: { 'content-type': 'application/connect+proto' } })); await connect.window.fetch('https://claude.ai/claudeai-rpc/Conversation/Stream'); assert.equal(connect.posts[0].type, 'ccbs:transport');
});
test('conversation requests return monotonically sequenced envelopes', async () => {
 const h = harness(() => Response.json({ chat_messages: [] })); await h.dispatch(request('conversation', { orgId: 'A', conversationId: 'C' })); await h.dispatch(request('conversation', { orgId: 'A', conversationId: 'C' }));
 assert(h.posts[1].payload.sequence > h.posts[0].payload.sequence); assert.equal(h.posts[0].payload.data.chat_messages.length, 0);
});
