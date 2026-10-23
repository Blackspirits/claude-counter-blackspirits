import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const context = vm.createContext({});
vm.runInContext(fs.readFileSync('src/content/usage.js', 'utf8'), context);
const { normalize, UsageStore } = context.ClaudeCounterBlackSpirits.usage;
const deferred = () => { let resolve; const promise = new Promise(r => resolve = r); return { promise, resolve }; };
function harness(request = async () => ({ five_hour: { utilization: 12 } })) {
 let now = 1800000000000, org = 'A'; const calls = [], renders = [];
 const store = new UsageStore({ request: async value => { calls.push(value); return request(value); }, getOrg: () => org, now: () => now, random: () => 0, render: (state, status) => renders.push({ state: JSON.parse(JSON.stringify(state)), ...status }) });
 return { store, calls, renders, advance: ms => now += ms, setOrg: value => org = value, now: () => now };
}
test('failed requests back off instead of repeating every second', async () => {
 const h = harness(async () => { throw Error('offline'); });
 await h.store.tick(); for (let i = 0; i < 59; i++) { h.advance(1000); await h.store.tick(); }
 assert.equal(h.calls.length, 1); h.advance(1000); await h.store.tick(); assert.equal(h.calls.length, 2);
 h.advance(60000); await h.store.tick(); assert.equal(h.calls.length, 2);
 h.advance(60000); await h.store.tick(); assert.equal(h.calls.length, 3);
});
test('auth errors pause automatic polling and permit a later manual retry', async () => {
 const h = harness(async () => { throw Object.assign(Error('denied'), { status: 403 }); });
 await h.store.tick(); h.advance(3600000); await h.store.tick(); assert.equal(h.calls.length, 1);
 assert.equal(h.renders.at(-1).status, 'signedOut'); await h.store.refresh(true); assert.equal(h.calls.length, 2);
});
test('Retry-After cannot be bypassed by the refresh button', async () => {
 const h = harness(async () => { throw Object.assign(Error('limited'), { status: 429, retryAfterMs: 600000 }); });
 await h.store.tick(); h.advance(120000); await h.store.refresh(true); assert.equal(h.calls.length, 1);
 h.advance(480000); await h.store.tick(); assert.equal(h.calls.length, 2);
});
test('organization switch clears old data and fetches the new organization', async () => {
 const h = harness(); await h.store.tick(); h.setOrg('B'); await h.store.tick();
 assert.deepEqual(h.calls, ['A', 'B']); assert(h.renders.some(r => Object.keys(r.state).length === 0));
 h.setOrg(null); await h.store.tick(); assert.equal(h.renders.at(-1).status, 'signedOut'); assert.deepEqual(h.renders.at(-1).state, {});
});
test('old organization response cannot apply or release a new request', async () => {
 const a = deferred(), b = deferred(); const h = harness(org => org === 'A' ? a.promise : b.promise);
 const first = h.store.tick(); h.setOrg('B'); const second = h.store.tick();
 a.resolve({ five_hour: { utilization: 90 } }); await first; assert(h.store.inFlight);
 b.resolve({ five_hour: { utilization: 20 } }); await second; assert.equal(h.store.state.five_hour.utilization, 20);
});
test('new SSE beats old HTTP per window, while HTTP may fill missing weekly data', async () => {
 const d = deferred(); const h = harness(() => d.promise); const work = h.store.tick();
 h.store.acceptEvent({ orgId: 'A', messageLimit: { windows: { '5h': { utilization: .85 } } } });
 d.resolve({ five_hour: { utilization: 10 }, seven_day: { utilization: 60 } }); await work;
 assert.equal(h.store.state.five_hour.utilization, 85); assert.equal(h.store.state.seven_day.utilization, 60);
});
test('partial updates preserve weekly data and explicit null clears it', async () => {
 const h = harness(async () => ({ five_hour: { utilization: 12 }, seven_day: { utilization: 60 } })); await h.store.tick();
 h.store.acceptEvent({ orgId: 'A', messageLimit: { windows: { '5h': { utilization: .2 } } } }); assert.equal(h.store.state.seven_day.utilization, 60);
 h.store.acceptEvent({ orgId: 'A', messageLimit: { windows: { '7d': null } } }); assert.equal(h.store.state.seven_day, null);
});
test('foreign and unidentified organization events are ignored', async () => {
 const h = harness(); await h.store.tick();
 for (const orgId of ['B', undefined]) h.store.acceptEvent({ orgId, messageLimit: { windows: { '5h': { utilization: 1 } } } });
 assert.equal(h.store.state.five_hour.utilization, 12);
});
test('malformed dates and numbers do not throw or masquerade as a valid window', () => {
 assert.equal(normalize({ windows: { '5h': { utilization: .2, resets_at: 1e100 } } }, 'sse').five_hour.resets_at, null);
 assert.equal(normalize({ five_hour: { utilization: '20' } }), null);
 assert.equal(normalize({ five_hour: { utilization: Infinity } }), null);
 assert.equal(normalize({ five_hour: { utilization: 20, resets_at: 'bad' } }).five_hour.resets_at, null);
});
test('supported limits variants keep session and global weekly scopes distinct', () => {
 const result = normalize({ limits: [{ kind: 'session', percent: 40 }, { kind: 'weekly_scoped', percent: 90 }, { kind: 'weekly_all', percent: 30 }] });
 assert.equal(result.five_hour.utilization, 40); assert.equal(result.seven_day.utilization, 30);
 assert.equal(normalize({ limits: [{ kind: 'weekly_scoped', percent: 90 }] }), null);
});
test('rollover failure retries after backoff without pretending usage is zero', async () => {
 let n = 0; const h = harness(async () => { if (n++) throw Error('offline'); return { five_hour: { utilization: 99, resets_at: new Date(h.now() + 2000).toISOString() } }; });
 await h.store.tick(); h.advance(10000); await h.store.tick(); assert.equal(h.calls.length, 2);
 h.advance(59000); await h.store.tick(); assert.equal(h.calls.length, 2);
 h.advance(1000); await h.store.tick(); assert.equal(h.calls.length, 3); assert.equal(h.store.state.five_hour.utilization, 99);
});
test('old reset returned successfully does not trigger a request storm', async () => {
 const h = harness(async () => ({ five_hour: { utilization: 99, resets_at: new Date(1799999999000).toISOString() } }));
 await h.store.tick(); for (let i = 0; i < 100; i++) { h.advance(1000); await h.store.tick(); }
 assert.equal(h.calls.length, 1); assert.equal(h.renders.at(-1).status, 'stale');
});
test('unknown payload is visible and follows backoff; periodic fallback is bounded', async () => {
 const h = harness(async () => ({ unknown: true })); await h.store.tick(); assert.equal(h.renders.at(-1).status, 'unsupported');
 const good = harness(); await good.store.tick(); good.advance(300000); await good.store.tick(); assert.equal(good.calls.length, 2);
});

test('late events from an older stream cannot overwrite a newer stream', async () => {
 const h = harness(); await h.store.tick();
 for (const [sequence, utilization] of [[2, .8], [1, .1]]) h.store.acceptEvent({ orgId: 'A', sequence, messageLimit: { windows: { '5h': { utilization } } } });
 assert.equal(h.store.state.five_hour.utilization, 80);
});
