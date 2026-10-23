(() => {
	'use strict';
	const CC = (globalThis.ClaudeCounterBlackSpirits = globalThis.ClaudeCounterBlackSpirits || {});
	if (CC.__started) return;
	CC.__started = true;

	const getConversationId = () => window.location.pathname.match(/\/chat\/([^/?]+)/)?.[1] || null;
	function getOrg() {
		try {
			const row = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('lastActiveOrg='));
			return row ? decodeURIComponent(row.slice('lastActiveOrg='.length)) : null;
		} catch { return null; }
	}
	CC.waitForElement = (selector, timeoutMs = 60000) => new Promise(resolve => {
		const existing = document.querySelector(selector);
		if (existing) return resolve(existing);
		const observer = new MutationObserver(() => {
			const element = document.querySelector(selector);
			if (element) { clearTimeout(timer); observer.disconnect(); resolve(element); }
		});
		observer.observe(document.body, { childList: true, subtree: true });
		const timer = setTimeout(() => { observer.disconnect(); resolve(null); }, timeoutMs);
	});

	let conversationId = null, orgId = null, conversationRevision = 0, lastSequence = -1;
	let conversationInFlight = null, conversationAttemptAt = -Infinity;
	let renderedUsage = '';
	const ui = new CC.ui.CounterUI({ onUsageRefresh: async () => {
		syncContext();
		await Promise.allSettled([usage.refresh(true), refreshConversation()]);
	} });
	ui.initialize();
	const usage = new CC.usage.UsageStore({
		getOrg,
		request: async org => { await CC.bridge.ready(); return CC.bridge.requestUsage(org); },
		render: (state, status) => {
			const signature = JSON.stringify([state, status]);
			if (signature === renderedUsage) return;
			renderedUsage = signature;
			ui.setUsage(state);
			ui.setUsageStatus(status);
		}
	});

	function syncContext() {
		const nextOrg = getOrg(), nextConversation = getConversationId();
		if (orgId === nextOrg && conversationId === nextConversation) return false;
		orgId = nextOrg;
		conversationId = nextConversation;
		conversationRevision++;
		lastSequence = -1;
		conversationAttemptAt = -Infinity;
		conversationInFlight = null;
		ui.setConversationMetrics();
		usage.syncOrg();
		return true;
	}

	async function handleConversation(payload = {}) {
		syncContext();
		if (!orgId || payload.orgId !== orgId || !conversationId || payload.conversationId !== conversationId || !payload.data) return;
		if (!Number.isFinite(payload.sequence) || payload.sequence < lastSequence) return;
		lastSequence = payload.sequence;
		const revision = ++conversationRevision;
		try {
			const metrics = await CC.tokens.computeConversationMetrics(payload.data, () => revision !== conversationRevision);
			syncContext();
			if (revision !== conversationRevision) return;
			ui.setConversationMetrics(metrics);
		} catch {
			if (revision === conversationRevision) ui.setConversationMetrics({ unavailable: true });
		}
	}

	async function refreshConversation() {
		syncContext();
		if (!orgId || !conversationId || conversationInFlight || Date.now() - conversationAttemptAt < 10000) return;
		const requestOrg = orgId, requestConversation = conversationId, ticket = {}, revision = conversationRevision;
		conversationInFlight = ticket;
		conversationAttemptAt = Date.now();
		try {
			await CC.bridge.ready();
			const result = await CC.bridge.requestConversation(requestOrg, requestConversation);
			await handleConversation({ ...result, orgId: requestOrg, conversationId: requestConversation });
		} catch {
			syncContext();
			if (revision === conversationRevision && requestOrg === orgId && requestConversation === conversationId) ui.setConversationMetrics({ unavailable: true });
		} finally {
			if (conversationInFlight === ticket) conversationInFlight = null;
		}
	}

	CC.bridge.on('ccbs:conversation', handleConversation);
	CC.bridge.on('ccbs:message_limit', payload => usage.acceptEvent(payload));
	CC.bridge.on('ccbs:transport', () => ui.setTransportNotice(true));
	CC.bridge.on('ccbs:generation_start', payload => {
		if (payload?.orgId === orgId && payload?.conversationId === conversationId) ui.setPendingCache(true);
	});

	function attach() {
		ui.attachHeader();
		ui.attachUsageLine();
	}
	function navigate() {
		if (syncContext()) refreshConversation();
		attach();
		usage.tick();
	}
	window.addEventListener('ccbs:urlchange', navigate);
	window.addEventListener('popstate', navigate);
	let branchObserver = null, branchTimer = null;
	document.addEventListener('click', event => {
		const button = event.target.closest?.('button');
		const indicator = Array.from(button?.closest('.inline-flex')?.querySelectorAll('span') || [])
			.find(span => /^\d+\s*\/\s*\d+$/.test(span.textContent.trim()));
		if (!indicator || !conversationId) return;
		branchObserver?.disconnect();
		clearTimeout(branchTimer);
		const original = indicator.textContent;
		branchObserver = new MutationObserver(() => {
			if (indicator.textContent === original) return;
			branchObserver.disconnect();
			clearTimeout(branchTimer);
			// Invalidate calculations for the previous branch; its fetch can still finish.
			conversationRevision++;
			ui.setConversationMetrics();
			refreshConversation();
		});
		branchObserver.observe(indicator, { childList: true, characterData: true, subtree: true });
		branchTimer = setTimeout(() => branchObserver?.disconnect(), 60000);
	});
	document.addEventListener('visibilitychange', () => {
		if (!document.hidden) { navigate(); refreshConversation(); }
	});
	navigate();
	setInterval(() => {
		if (document.hidden) return;
		if (syncContext()) refreshConversation();
		ui.tick();
		usage.tick();
	}, 1000);
})();
