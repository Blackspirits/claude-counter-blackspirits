(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounterBlackSpirits = globalThis.ClaudeCounterBlackSpirits || {});
	const CLAUDE_ORIGIN = 'https://claude.ai';

	function makeRequestId() {
		return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	class BridgeClient {
		constructor() {
			this._pending = new Map();
			this._listeners = new Map();

			window.addEventListener('message', (event) => {
				if (event.source !== window || event.origin !== CLAUDE_ORIGIN) return;
				const data = event.data;
				if (!data || data.ccbs !== 'ClaudeCounterBlackSpirits') return;

				if (data.type === 'ccbs:response') {
					const { requestId, ok, payload, error } = data;
					const pending = this._pending.get(requestId);
					if (!pending) return;
					this._pending.delete(requestId);
					clearTimeout(pending.timeoutId);
					if (ok) pending.resolve(payload);
					else pending.reject(Object.assign(new Error(error?.message || 'Bridge request failed'), { status: error?.status, retryAfterMs: error?.retryAfterMs }));
					return;
				}

				// Events
				this._emit(data.type, data.payload);
			});
		}

		_emit(type, payload) {
			const listeners = this._listeners.get(type);
			if (!listeners) return;
			for (const fn of listeners) {
				try { Promise.resolve(fn(payload)).catch(() => {}); } catch { /* Isolate listeners. */ }
			}
		}

		on(type, fn) {
			if (!this._listeners.has(type)) this._listeners.set(type, new Set());
			this._listeners.get(type).add(fn);
			return () => this._listeners.get(type)?.delete(fn);
		}

		request(kind, payload, { timeoutMs = 10000 } = {}) {
			const requestId = makeRequestId();
			return new Promise((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					this._pending.delete(requestId);
					reject(new Error(`Bridge request timed out (${kind})`));
				}, timeoutMs);

				this._pending.set(requestId, { resolve, reject, timeoutId });
				window.postMessage(
					{
						ccbs: 'ClaudeCounterBlackSpirits',
						type: 'ccbs:request',
						requestId,
						kind,
						payload
					},
					CLAUDE_ORIGIN
				);
			});
		}

		async requestUsage(orgId) {
			return this.request('usage', { orgId }, { timeoutMs: 20000 });
		}

		async requestConversation(orgId, conversationId) {
			return this.request('conversation', { orgId, conversationId }, { timeoutMs: 20000 });
		}
	}

	CC.bridge = new BridgeClient();
	let readyPromise;
	CC.bridge.ready = () => {
		if (!readyPromise) readyPromise = CC.bridge.request('ping', {}, { timeoutMs: 3000 }).catch(error => {
			readyPromise = null;
			throw error;
		});
		return readyPromise;
	};
})();
