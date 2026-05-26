(() => {
	'use strict';

	const CC_MARKER = 'ClaudeCounterBlackSpirits';
	const CLAUDE_ORIGIN = 'https://claude.ai';

	// Capture original fetch before anyone else can wrap it
	const originalFetch = window.fetch;

	// Wrap history methods early to detect SPA navigation (before frameworks cache them)
	const originalPushState = history.pushState.bind(history);
	const originalReplaceState = history.replaceState.bind(history);

	history.pushState = function (...args) {
		const result = originalPushState(...args);
		window.dispatchEvent(new CustomEvent('ccbs:urlchange'));
		return result;
	};

	history.replaceState = function (...args) {
		const result = originalReplaceState(...args);
		window.dispatchEvent(new CustomEvent('ccbs:urlchange'));
		return result;
	};

	window.fetch = async (...args) => {
		const url = toAbsoluteUrl(args[0]);
		const method = getRequestMethod(args[0], args[1]);

		// Detect generation start (completion requests)
		if (url && method === 'POST' && (url.includes('/completion') || url.includes('/retry_completion'))) {
			post('ccbs:generation_start', {});
		}

		const response = await originalFetch.apply(window, args);

		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('event-stream')) {
			handleEventStream(response);
		}

		// Catch conversation tree fetches
		if (url && url.includes('/chat_conversations/') && url.includes('tree=')) {
			const meta = getConversationMeta(url);
			if (meta) {
				handleConversationResponse(meta, response);
			}
		}

		return response;
	};

	function post(type, payload) {
		window.postMessage({ ccbs: CC_MARKER, type, payload }, CLAUDE_ORIGIN);
	}

	function postResponse(requestId, ok, payload, error) {
		window.postMessage(
			{
				ccbs: CC_MARKER,
				type: 'ccbs:response',
				requestId,
				ok,
				payload,
				error
			},
			CLAUDE_ORIGIN
		);
	}

	function getRequestMethod(input, options) {
		const method = options?.method || (input instanceof Request ? input.method : '') || 'GET';
		return String(method).toUpperCase();
	}

	function toAbsoluteUrl(input) {
		try {
			if (typeof input === 'string') return new URL(input, CLAUDE_ORIGIN).href;
			if (input instanceof URL) return input.href;
			if (input instanceof Request) return new URL(input.url, CLAUDE_ORIGIN).href;
		} catch {
			// Ignore malformed values from third-party wrappers.
		}
		return '';
	}

	function safeDecodeURIComponent(value) {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	function getConversationMeta(url) {
		// /api/organizations/{orgId}/chat_conversations/{conversationId}
		const match = url.match(/^https:\/\/claude\.ai\/api\/organizations\/([^/]+)\/chat_conversations\/([^/?]+)/);
		return match
			? { orgId: safeDecodeURIComponent(match[1]), conversationId: safeDecodeURIComponent(match[2]) }
			: null;
	}

	async function handleConversationResponse({ orgId, conversationId }, response) {
		try {
			const cloned = response.clone();
			const data = await cloned.json();
			post('ccbs:conversation', { orgId, conversationId, data });
		} catch {
			// ignore parse failures
		}
	}

	async function handleEventStream(response) {
		try {
			const cloned = response.clone();
			const reader = cloned.body?.getReader?.();
			if (!reader) return;

			const decoder = new TextDecoder();
			let buffer = '';

			const processLine = (line) => {
				if (!line.startsWith('data:')) return;
				const raw = line.slice(5).trim();
				if (!raw) return;
				try {
					const json = JSON.parse(raw);
					if (json?.type === 'message_limit' && json.message_limit) {
						post('ccbs:message_limit', json.message_limit);
					}
				} catch {
					// Ignore partial/non-JSON SSE lines.
				}
			};

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split(/\r\n|\r|\n/);
				buffer = lines.pop() || '';
				for (const line of lines) processLine(line);
			}

			buffer += decoder.decode();
			if (buffer) processLine(buffer);
		} catch {
			// Best-effort; never break claude.ai.
		}
	}

	window.addEventListener('message', async (event) => {
		if (event.source !== window || event.origin !== CLAUDE_ORIGIN) return;
		const data = event.data;
		if (!data || data.ccbs !== CC_MARKER) return;
		if (data.type !== 'ccbs:request') return;

		const { requestId, kind, payload } = data;
		try {
			if (kind === 'usage') {
				const orgId = payload?.orgId;
				if (!orgId) throw new Error('Missing orgId');
				const safeOrgId = encodeURIComponent(orgId);
				const res = await originalFetch(`https://claude.ai/api/organizations/${safeOrgId}/usage`, {
					method: 'GET',
					credentials: 'include'
				});
				if (!res.ok) throw new Error(`Usage request failed: HTTP ${res.status}`);
				const json = await res.json();
				postResponse(requestId, true, json, null);
				return;
			}

			if (kind === 'conversation') {
				const orgId = payload?.orgId;
				const conversationId = payload?.conversationId;
				if (!orgId || !conversationId) throw new Error('Missing orgId/conversationId');

				const safeOrgId = encodeURIComponent(orgId);
				const safeConversationId = encodeURIComponent(conversationId);
				const url = `https://claude.ai/api/organizations/${safeOrgId}/chat_conversations/${safeConversationId}?tree=true&rendering_mode=messages&render_all_tools=true`;
				const res = await originalFetch(url, {
					method: 'GET',
					credentials: 'include'
				});
				if (!res.ok) throw new Error(`Conversation request failed: HTTP ${res.status}`);
				const json = await res.json();
				post('ccbs:conversation', { orgId, conversationId, data: json });
				postResponse(requestId, true, json, null);
				return;
			}

			throw new Error(`Unknown request kind: ${kind}`);
		} catch (e) {
			postResponse(requestId, false, null, e?.message || String(e));
		}
	});
})();
