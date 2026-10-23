import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function harness(compute) {
 const events = {}, metrics = [], ticks = []; let now = 1800000000000;
 class Clock extends Date { static now() { return now; } }
 const document = { cookie: 'lastActiveOrg=A', hidden: false, body: {}, querySelector: () => ({}), addEventListener() {} };
 const window = { location: { pathname: '/chat/C' }, addEventListener() {} };
 const CC = { ui: { CounterUI: class { initialize() {} attachHeader() {} attachUsageLine() {} setUsage() {} setUsageStatus() {} setTransportNotice() {} setConversationMetrics(v) { metrics.push(v); } tick() {} } },
 bridge: { ready: async () => {}, on: (key, fn) => events[key] = fn, requestUsage: async () => ({ five_hour: { utilization: 10 } }), requestConversation: async () => null }, tokens: { computeConversationMetrics: compute } };
 const c = vm.createContext({ window, document, Date: Clock, setInterval: fn => ticks.push(fn), setTimeout: () => 0, clearTimeout() {}, ClaudeCounterBlackSpirits: CC });
 for (const name of ['usage', 'main']) vm.runInContext(fs.readFileSync(`src/content/${name}.js`, 'utf8'), c);
 return { events, metrics, document, ticks, advance: ms => now += ms };
}
test('same-conversation calculations only apply the newest result', async () => {
 const a = deferred(), b = deferred(); let n = 0; const h = harness(() => n++ ? b.promise : a.promise); await flush();
 const first = h.events['ccbs:conversation']({ orgId: 'A', conversationId: 'C', sequence: 1, data: {} });
 const second = h.events['ccbs:conversation']({ orgId: 'A', conversationId: 'C', sequence: 2, data: {} });
 b.resolve({ totalTokens: 20 }); await second; a.resolve({ totalTokens: 10 }); await first;
 assert.equal(h.metrics.at(-1).totalTokens, 20);
});
test('late older network response is rejected before tokenization', async () => {
 let n = 0; const h = harness(async () => ({ totalTokens: ++n })); await flush();
 await h.events['ccbs:conversation']({ orgId: 'A', conversationId: 'C', sequence: 2, data: {} });
 await h.events['ccbs:conversation']({ orgId: 'A', conversationId: 'C', sequence: 1, data: {} }); assert.equal(n, 1);
});
test('organization change invalidates an in-flight calculation even on the same chat path', async () => {
 const d = deferred(); const h = harness(() => d.promise); await flush();
 const work = h.events['ccbs:conversation']({ orgId: 'A', conversationId: 'C', sequence: 1, data: {} });
 h.document.cookie = 'lastActiveOrg=B'; d.resolve({ totalTokens: 100 }); await work;
 assert(!h.metrics.some(value => value?.totalTokens === 100));
});
