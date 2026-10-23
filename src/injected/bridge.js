(() => {
	'use strict';
	const CC_MARKER = 'ClaudeCounterBlackSpirits';
	const CLAUDE_ORIGIN = 'https://claude.ai';
	if (window.__ccbsBridgeInstalled) return;
	window.__ccbsBridgeInstalled = true;
	const originalFetch = window.fetch;
	let sequence = 0;
	const post = (type, payload) => window.postMessage({ ccbs: CC_MARKER, type, payload }, CLAUDE_ORIGIN);
	for (const name of ['pushState', 'replaceState']) {
		const original = history[name];
		history[name] = function (...args) {
			const result = original.apply(this, args);
			window.dispatchEvent(new CustomEvent('ccbs:urlchange'));
			return result;
		};
	}
	function getMeta(url) {
		if (url?.origin !== CLAUDE_ORIGIN) return null;
		const match = url.pathname.match(/^\/api\/organizations\/([^/]+)\/chat_conversations\/([^/]+)(?:\/|$)/);
		if (!match) return null;
		try { return { orgId: decodeURIComponent(match[1]), conversationId: decodeURIComponent(match[2]) }; }
		catch { return null; }
	}
	async function readJson(response) {
		const reader = response.body?.getReader();
		if (!reader) throw new Error('Empty response');
		const decoder = new TextDecoder();
		let text = '', size = 0;
		const timer = setTimeout(() => { reader.cancel().catch(() => {}); }, 18000);
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > 8 * 1024 * 1024) throw new Error('Response too large');
				text += decoder.decode(value, { stream: true });
			}
			return JSON.parse(text + decoder.decode());
		} finally { clearTimeout(timer); reader.cancel().catch(() => {}); }
	}
	async function observeStream(response, meta, requestSequence) {
		const reader = response.clone().body?.getReader();
		if (!reader) return;
		const decoder = new TextDecoder();
		let buffer = '', data = [], size = 0;
		const timer = setTimeout(() => { reader.cancel().catch(() => {}); }, 10 * 60000);
		function dispatch() {
			try {
				const json = JSON.parse(data.join('\n'));
				if (json?.type === 'message_limit' && json.message_limit) post('ccbs:message_limit', { ...meta, sequence: requestSequence, messageLimit: json.message_limit });
			} catch { /* Non-JSON events are not usage data. */ }
			data = [];
		}
		function line(value) {
			if (!value) dispatch();
			else if (value.startsWith('data:')) data.push(value.slice(5).replace(/^ /, ''));
		}
		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				size += value.byteLength;
				if (size > 8 * 1024 * 1024) break;
				buffer += decoder.decode(value, { stream: true });
				if (buffer.length > 1024 * 1024) break;
				// Retain a trailing CR until the next chunk to preserve CRLF boundaries.
				let match;
				while ((match = /\r\n|\n|\r(?!$)/.exec(buffer))) {
					line(buffer.slice(0, match.index));
					buffer = buffer.slice(match.index + match[0].length);
				}
			}
			buffer += decoder.decode();
			if (buffer) line(buffer.replace(/\r$/, ''));
			dispatch();
		} catch { /* Observation must never interfere with the original response. */ }
		finally { clearTimeout(timer); reader.cancel().catch(() => {}); }
	}
	window.fetch = async function (...args) {
		let url, meta;
		const requestSequence = ++sequence;
		try {
			url = new URL(args[0] instanceof Request ? args[0].url : String(args[0]), location.href);
			meta = getMeta(url);
			const method = String(args[1]?.method || (args[0] instanceof Request ? args[0].method : 'GET')).toUpperCase();
			if (meta && method === 'POST' && /\/(?:retry_)?completion$/.test(url.pathname)) post('ccbs:generation_start', meta);
		} catch { /* Preserve native fetch errors. */ }
		const response = await originalFetch.apply(this, args);
		try {
			const contentType = response.headers.get('content-type') || '';
			if (meta && contentType.includes('text/event-stream')) observeStream(response, meta, requestSequence).catch(() => {});
			if (meta && url.searchParams.has('tree') && response.ok) {
				readJson(response.clone()).then(data => post('ccbs:conversation', { ...meta, sequence: requestSequence, data })).catch(() => {});
			}
			if (url?.origin === CLAUDE_ORIGIN && url.pathname.startsWith('/claudeai-rpc/') && contentType.includes('application/connect+')) post('ccbs:transport', { supported: false });
		} catch { /* Only the page's original fetch may reject its request. */ }
		return response;
	};
	function validId(value) { return typeof value === 'string' && value.length > 0 && value.length <= 256; }
	window.addEventListener('message', async event => {
		if (event.source !== window || event.origin !== CLAUDE_ORIGIN) return;
		const message = event.data;
		if (!message || message.ccbs !== CC_MARKER || message.type !== 'ccbs:request' || !validId(message.requestId)) return;
		const { requestId, kind, payload } = message;
		const reply = (ok, result, error) => window.postMessage({ ccbs: CC_MARKER, type: 'ccbs:response', requestId, ok, payload: result, error }, CLAUDE_ORIGIN);
		let timer;
		try {
			if (kind === 'ping') { reply(true, { ready: true }); return; }
			if (!['usage', 'conversation'].includes(kind) || !validId(payload?.orgId)) throw new Error('Invalid bridge request');
			if (kind === 'conversation' && !validId(payload.conversationId)) throw new Error('Invalid conversation ID');
			const base = `${CLAUDE_ORIGIN}/api/organizations/${encodeURIComponent(payload.orgId)}`;
			const url = kind === 'usage' ? `${base}/usage` : `${base}/chat_conversations/${encodeURIComponent(payload.conversationId)}?tree=true&rendering_mode=messages&render_all_tools=true`;
			const controller = new AbortController();
			timer = setTimeout(() => controller.abort(), 18000);
			const requestSequence = ++sequence;
			const response = await originalFetch.call(window, url, { method: 'GET', credentials: 'include', signal: controller.signal });
			if (!response.ok) {
				const retry = response.headers.get('retry-after');
				const retryAfterMs = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now());
				throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status, retryAfterMs });
			}
			const data = await readJson(response);
			reply(true, kind === 'usage' ? data : { data, sequence: requestSequence });
		} catch (error) {
			reply(false, null, { message: error.message || 'Bridge request failed', status: error.status, retryAfterMs: error.retryAfterMs });
		} finally { clearTimeout(timer); }
	});
})();
