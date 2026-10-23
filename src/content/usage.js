(() => {
	'use strict';
	const CC = (globalThis.ClaudeCounterBlackSpirits = globalThis.ClaudeCounterBlackSpirits || {});
	const KEYS = ['five_hour', 'seven_day'];
	const POLL_MS = 5 * 60 * 1000;
	const has = (object, key) => Object.hasOwn(object, key);

	function normalizeWindow(raw, hours, scale) {
		if (raw === null) return null;
		if (!raw || !Number.isFinite(raw.utilization)) return undefined;
		const value = raw.utilization * scale;
		if (!Number.isFinite(value)) return undefined;
		const timestamp = typeof raw.resets_at === 'number' ? raw.resets_at * 1000 :
			typeof raw.resets_at === 'string' ? Date.parse(raw.resets_at) : NaN;
		const date = new Date(timestamp);
		return {
			utilization: Math.max(0, Math.min(100, value)),
			resets_at: Number.isFinite(date.getTime()) ? date.toISOString() : null,
			window_hours: hours
		};
	}

	// Omitted fields are patches; explicit null clears a window. Never infer units.
	function normalize(raw, source = 'http') {
		if (!raw || typeof raw !== 'object') return null;
		const patch = {};
		const input = source === 'sse' ? raw.windows : raw;
		for (const [key, wireKey, hours] of [['five_hour', '5h', 5], ['seven_day', '7d', 168]]) {
			const field = source === 'sse' ? wireKey : key;
			if (input && has(input, field)) {
				const value = normalizeWindow(input[field], hours, source === 'sse' ? 100 : 1);
				if (value !== undefined) patch[key] = value;
			}
		}
		if (Array.isArray(raw.limits)) {
			for (const entry of raw.limits) {
				const key = entry?.kind === 'session' ? 'five_hour' : entry?.kind === 'weekly_all' ? 'seven_day' : null;
				if (!key || has(patch, key)) continue;
				const value = normalizeWindow({ utilization: entry.percent, resets_at: entry.resets_at }, key === 'five_hour' ? 5 : 168, 1);
				if (value !== undefined) patch[key] = value;
			}
		}
		return Object.keys(patch).length ? patch : null;
	}

	class UsageStore {
		constructor({ request, getOrg, render, now = Date.now, random = Math.random }) {
			Object.assign(this, { request, getOrg, render, now, random });
			this.org = undefined;
			this.syncOrg();
		}
		syncOrg() {
			const org = this.getOrg() || null;
			if (org === this.org) return false;
			this.org = org;
			this.epoch = (this.epoch || 0) + 1;
			this.state = {};
			this.revisions = { five_hour: 0, seven_day: 0 };
			this.updated = {};
			this.streamSequences = { five_hour: -1, seven_day: -1 };
			this.inFlight = null;
			this.failures = 0;
			this.lastAttempt = -Infinity;
			this.nextAt = 0;
			this.status = org ? 'loading' : 'signedOut';
			this.publish();
			return true;
		}
		isStale() {
			return KEYS.some(key => this.state[key] && (
				this.now() - this.updated[key] >= POLL_MS ||
				(this.state[key].resets_at && Date.parse(this.state[key].resets_at) <= this.now())
			));
		}
		publish() {
			const status = this.status === 'updated' && this.isStale() ? 'stale' : this.status;
			const times = Object.values(this.updated);
			this.render(this.state, { status, updatedAt: times.length ? Math.max(...times) : null });
		}
		apply(patch, revisions) {
			for (const key of KEYS) {
				if (!has(patch, key) || (revisions && revisions[key] !== this.revisions[key])) continue;
				this.state[key] = patch[key];
				this.revisions[key]++;
				this.updated[key] = this.now();
			}
			this.status = 'updated';
			this.publish();
		}
		acceptEvent({ orgId, messageLimit, sequence } = {}) {
			this.syncOrg();
			if (!this.org || orgId !== this.org) return;
			const patch = normalize(messageLimit, 'sse');
			if (!patch) return;
			for (const key of Object.keys(patch)) {
				if (Number.isFinite(sequence)) {
					if (sequence < this.streamSequences[key]) delete patch[key];
					else this.streamSequences[key] = sequence;
				}
			}
			if (Object.keys(patch).length) this.apply(patch);
		}
		async refresh(manual = false) {
			this.syncOrg();
			const now = this.now();
			if (!this.org || this.inFlight) return;
			// Manual refresh may resume an auth pause, but cannot bypass a rate limit/backoff.
			if (now - this.lastAttempt < (this.failures ? 60000 : 10000)) return;
			if (now < this.nextAt && !(manual && (!this.failures || this.nextAt === Infinity))) return;
			const epoch = this.epoch, org = this.org, revisions = { ...this.revisions };
			const ticket = {};
			this.inFlight = ticket;
			this.lastAttempt = now;
			this.status = 'loading';
			this.publish();
			try {
				const raw = await this.request(org);
				this.syncOrg();
				if (epoch !== this.epoch) return;
				const patch = normalize(raw);
				if (!patch) throw Object.assign(new Error('Unsupported usage response'), { unsupported: true });
				this.failures = 0;
				this.nextAt = this.now() + POLL_MS;
				this.apply(patch, revisions);
			} catch (error) {
				this.syncOrg();
				if (epoch !== this.epoch) return;
				this.failures++;
				const delay = Math.min(30 * 60000, 60000 * 2 ** Math.min(this.failures - 1, 5));
				this.nextAt = this.now() + Math.max(delay + Math.floor(this.random() * 10000), Number.isFinite(error.retryAfterMs) ? Math.max(0, error.retryAfterMs) : 0);
				if (error.status === 401 || error.status === 403) {
					this.nextAt = Infinity;
					this.status = 'signedOut';
				} else this.status = error.unsupported ? 'unsupported' : 'unavailable';
				this.publish();
			} finally {
				if (this.inFlight === ticket) this.inFlight = null;
			}
		}
		tick() {
			this.syncOrg();
			const now = this.now();
			// Only one immediate attempt per reset boundary. Failed attempts use backoff.
			const rollover = KEYS.some(key => {
				const reset = Date.parse(this.state[key]?.resets_at);
				return reset <= now && this.lastAttempt < reset;
			});
			if (rollover && !this.failures) this.nextAt = Math.min(this.nextAt, now);
			this.publish();
			return this.refresh();
		}
	}
	CC.usage = { normalize, UsageStore };
})();
