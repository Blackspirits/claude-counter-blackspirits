(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounterBlackSpirits = globalThis.ClaudeCounterBlackSpirits || {});

	function formatSeconds(totalSeconds) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}

	function shortUnit(key) {
		return CC.i18n.t(key);
	}

	function formatResetCountdown(timestampMs) {
		// <= 0: reset time reached
		const diffMs = timestampMs - Date.now();
		if (diffMs <= 0) return `0${shortUnit('unitSecondShort')}`;

		// < 1 min: show seconds
		const totalSeconds = Math.floor(diffMs / 1000);
		if (totalSeconds < 60) return `${totalSeconds}${shortUnit('unitSecondShort')}`;

		// < 1 hour: show minutes
		const totalMinutes = Math.round(totalSeconds / 60);
		if (totalMinutes < 60) return `${totalMinutes}${shortUnit('unitMinuteShort')}`;

		// < 1 day: show hours
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		if (hours < 24) return `${hours}${shortUnit('unitHourShort')} ${minutes}${shortUnit('unitMinuteShort')}`;

		// >= 1 day: show days
		const days = Math.floor(hours / 24);
		const remHours = hours % 24;
		return `${days}${shortUnit('unitDayShort')} ${remHours}${shortUnit('unitHourShort')}`;
	}


	function formatResetTime(timestampMs) {
		if (!timestampMs) return '';

		const resetDate = new Date(timestampMs);
		const now = new Date();
		const diffMs = resetDate.getTime() - now.getTime();

		const timeText = resetDate.toLocaleTimeString(CC.i18n.getLocale(), {
			hour: '2-digit',
			minute: '2-digit'
		});

		const sameDay = resetDate.toDateString() === now.toDateString();
		if (sameDay || diffMs < 24 * 60 * 60 * 1000) return timeText;

		return `${resetDate.toLocaleDateString(CC.i18n.getLocale(), {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		})} ${timeText}`;
	}

	function formatResetLabel(timestampMs) {
		if (!timestampMs) return '';
		return CC.i18n.t('resetLabel', { time: formatResetTime(timestampMs), countdown: formatResetCountdown(timestampMs) });
	}

	function setupTooltip(element, tooltip, { topOffset = 10 } = {}) {
		if (!element || !tooltip) return;
		if (element.hasAttribute('data-tooltip-setup')) return;
		element.setAttribute('data-tooltip-setup', 'true');
		element.classList.add('ccbs-tooltipTrigger');
		element.tabIndex = 0;
		element.setAttribute('aria-describedby', tooltip.id);

		let pressTimer;
		let hideTimer;

		const show = () => {
			const rect = element.getBoundingClientRect();
			tooltip.style.opacity = '1';
			const tipRect = tooltip.getBoundingClientRect();

			let left = rect.left + rect.width / 2;
			if (left + tipRect.width / 2 > window.innerWidth) left = window.innerWidth - tipRect.width / 2 - 10;
			if (left - tipRect.width / 2 < 0) left = tipRect.width / 2 + 10;

			let top = rect.top - tipRect.height - topOffset;
			if (top < 10) top = rect.bottom + 10;

			tooltip.style.left = `${left}px`;
			tooltip.style.top = `${top}px`;
			tooltip.style.transform = 'translateX(-50%)';
		};

		const hide = () => {
			tooltip.style.opacity = '0';
			clearTimeout(hideTimer);
		};

		element.addEventListener('focus', show);
		element.addEventListener('blur', hide);
		element.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
		element.addEventListener('pointerdown', (e) => {
			if (e.pointerType === 'touch' || e.pointerType === 'pen') {
				pressTimer = setTimeout(() => {
					show();
					hideTimer = setTimeout(hide, 3000);
				}, 500);
			}
		});

		element.addEventListener('pointerup', () => clearTimeout(pressTimer));
		element.addEventListener('pointercancel', () => {
			clearTimeout(pressTimer);
			hide();
		});

		element.addEventListener('pointerenter', (e) => {
			if (e.pointerType === 'mouse') show();
		});

		element.addEventListener('pointerleave', (e) => {
			if (e.pointerType === 'mouse') hide();
		});
	}

	let tooltipId = 0;
	function makeTooltip(text) {
		const tip = document.createElement('div');
		tip.className = 'bg-bg-500 text-text-000 ccbs-tooltip';
		tip.id = `ccbs-tooltip-${++tooltipId}`;
		tip.setAttribute('role', 'tooltip');
		tip.textContent = text;
		document.body.appendChild(tip);
		return tip;
	}

	class CounterUI {
		constructor({ onUsageRefresh } = {}) {
			this.onUsageRefresh = onUsageRefresh || null;

			this.headerContainer = null;
			this.headerDisplay = null;
			this.lengthGroup = null;
			this.lengthDisplay = null;
			this.cachedDisplay = null;
			this.lengthBar = null;
			this.lengthTooltip = null;
			this.lastCachedUntilMs = null;
			this.pendingCache = false;

			this.usageLine = null;
			this.sessionUsageSpan = null;
			this.weeklyUsageSpan = null;
			this.sessionBar = null;
			this.sessionBarFill = null;
			this.weeklyBar = null;
			this.weeklyBarFill = null;
			this.sessionResetMs = null;
			this.weeklyResetMs = null;
			this.sessionMarker = null;
			this.weeklyMarker = null;
			this.sessionWindowStartMs = null;
			this.weeklyWindowStartMs = null;
			this.refreshingUsage = false;

			this.domObserver = null;
			this.currentMetrics = null;
			this.currentUsage = null;
			this.sessionUsageBase = '';
			this.weeklyUsageBase = '';
			this.languageSwitcher = null;
			this.languageChip = null;
			this.languageSelect = null;
		}


		getProgressChrome() {
			const root = document.documentElement;
			const modeDark = root.dataset?.mode === 'dark';
			const modeLight = root.dataset?.mode === 'light';
			const isDark = modeDark && !modeLight;

			return {
				strokeColor: isDark ? CC.COLORS.PROGRESS_OUTLINE_DARK : CC.COLORS.PROGRESS_OUTLINE_LIGHT,
				fillColor: isDark ? CC.COLORS.PROGRESS_FILL_DARK : CC.COLORS.PROGRESS_FILL_LIGHT,
				markerColor: isDark ? CC.COLORS.PROGRESS_MARKER_DARK : CC.COLORS.PROGRESS_MARKER_LIGHT,
				boldColor: isDark ? CC.COLORS.BOLD_DARK : CC.COLORS.BOLD_LIGHT
			};
		}

		refreshProgressChrome() {
			const { strokeColor, fillColor, markerColor } = this.getProgressChrome();

			const applyBarChrome = (bar, { fillWarn } = {}) => {
				if (!bar) return;
				bar.style.setProperty('--ccbs-stroke', strokeColor);
				bar.style.setProperty('--ccbs-fill', fillColor);
				bar.style.setProperty('--ccbs-fill-warn', fillWarn ?? fillColor);
				bar.style.setProperty('--ccbs-marker', markerColor);
			};

			applyBarChrome(this.lengthBar, { fillWarn: fillColor });
			applyBarChrome(this.sessionBar, { fillWarn: CC.COLORS.RED_WARNING });
			applyBarChrome(this.weeklyBar, { fillWarn: CC.COLORS.RED_WARNING });
		}

		initialize() {
			// Header container (tokens + cache timer)
			this.headerContainer = document.createElement('div');
			this.headerContainer.className = 'text-text-500 text-xs !px-1 ccbs-header';

			this.headerDisplay = document.createElement('span');
			this.headerDisplay.className = 'ccbs-headerItem';

			this.lengthGroup = document.createElement('span');
			this.lengthDisplay = document.createElement('span');
			this.cachedDisplay = document.createElement('span');
			this.cacheTimeSpan = null; // reference to inner time span

			this.lengthGroup.appendChild(this.lengthDisplay);
			this.headerDisplay.appendChild(this.lengthGroup);

			// Usage line (session + weekly)
			this._initUsageLine();

			this._setupTooltips();
			this._observeDom();
			this._observeTheme();
			window.addEventListener('ccbs:languagechange', () => this._applyLanguage());
		}

		_observeTheme() {
			// Watch for theme changes (data-mode attribute on <html>)
			const observer = new MutationObserver(() => this.refreshProgressChrome());
			observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });
		}

		_observeDom() {
			// Track pending reattach attempts independently
			let usageReattachPending = false;
			let headerReattachPending = false;

			this.domObserver = new MutationObserver(() => {
				const usageMissing = this.usageLine && !document.contains(this.usageLine);
				const headerMissing = !document.contains(this.headerContainer);

				if (usageMissing && !usageReattachPending) {
					usageReattachPending = true;
					CC.waitForElement(CC.DOM.MODEL_SELECTOR_DROPDOWN, 60000).then((el) => {
						usageReattachPending = false;
						if (el) this.attachUsageLine();
					});
				}

				if (headerMissing && !headerReattachPending) {
					headerReattachPending = true;
					CC.waitForElement(CC.DOM.CHAT_MENU_TRIGGER, 60000).then((el) => {
						headerReattachPending = false;
						if (el) this.attachHeader();
					});
				}
			});
			this.domObserver.observe(document.body, { childList: true, subtree: true });
		}

		_initUsageLine() {
			this.usageLine = document.createElement('div');
			this.usageLine.className =
				'text-text-400 ccbs-usageRow';
			this.statusSpan = document.createElement('span');
			this.statusSpan.className = 'ccbs-status';
			this.statusSpan.setAttribute('role', 'status');
			this.transportSpan = document.createElement('span');
			this.transportSpan.className = 'ccbs-status ccbs-hidden';
			this.refreshButton = document.createElement('button');
			this.refreshButton.type = 'button';
			this.refreshButton.className = 'ccbs-refresh';
			this.refreshButton.textContent = '↻';
			this.refreshButton.addEventListener('click', () => this._refreshUsageFromUi());


			this.sessionUsageSpan = document.createElement('span');
			this.sessionUsageSpan.className = 'ccbs-usageText';

			this.sessionBar = document.createElement('div');
			this.sessionBar.className = 'ccbs-bar ccbs-bar--usage';
			this.sessionBarFill = document.createElement('div');
			this.sessionBarFill.className = 'ccbs-bar__fill';
			this.sessionMarker = document.createElement('div');
			this.sessionMarker.className = 'ccbs-bar__marker ccbs-hidden';
			this.sessionMarker.style.left = '0%';
			this.sessionBar.appendChild(this.sessionBarFill);
			this.sessionBar.appendChild(this.sessionMarker);

			this.weeklyUsageSpan = document.createElement('span');
			this.weeklyUsageSpan.className = 'ccbs-usageText';

			this.weeklyBar = document.createElement('div');
			this.weeklyBar.className = 'ccbs-bar ccbs-bar--usage';
			this.weeklyBarFill = document.createElement('div');
			this.weeklyBarFill.className = 'ccbs-bar__fill';
			this.weeklyMarker = document.createElement('div');
			this.weeklyMarker.className = 'ccbs-bar__marker ccbs-hidden';
			this.weeklyMarker.style.left = '0%';
			this.weeklyBar.appendChild(this.weeklyBarFill);
			this.weeklyBar.appendChild(this.weeklyMarker);

			this.sessionGroup = document.createElement('div');
			this.sessionGroup.className = 'ccbs-usageGroup';
			this.sessionGroup.appendChild(this.sessionUsageSpan);
			this.sessionGroup.appendChild(this.sessionBar);

			this.weeklyGroup = document.createElement('div');
			this.weeklyGroup.className = 'ccbs-usageGroup ccbs-usageGroup--weekly';
			this.weeklyGroup.appendChild(this.weeklyBar);
			this.weeklyGroup.appendChild(this.weeklyUsageSpan);

			this.languageSwitcher = this._createLanguageSwitcher();

			this.usageLine.appendChild(this.sessionGroup);
			this.usageLine.appendChild(this.weeklyGroup);
			this.usageLine.append(this.statusSpan, this.transportSpan, this.refreshButton, this.languageSwitcher);

			this.refreshProgressChrome();

		}

		async _refreshUsageFromUi() {
			if (!this.onUsageRefresh || this.refreshingUsage) return;
			this.refreshingUsage = true;
			this.refreshButton.disabled = true;
			this.usageLine.classList.add('ccbs-usageRow--dim');
			try {
				await this.onUsageRefresh();
			} finally {
				this.usageLine.classList.remove('ccbs-usageRow--dim');
				this.refreshingUsage = false;
				this.refreshButton.disabled = false;
			}
		}

		_getLanguageChipText() {
			const stored = CC.i18n.getStoredLanguage();
			if (stored === 'auto') return 'AUTO';
			const active = CC.i18n.getActiveLanguage();
			return ({
				'pt-PT': 'PT',
				en: 'EN',
				fr: 'FR',
				es: 'ES',
				de: 'DE',
				it: 'IT'
			}[active] || active.slice(0, 2).toUpperCase());
		}

		_setLanguageSwitcherOpen(open) {
			if (!this.languageSwitcher || !this.languageChip) return;
			this.languageSwitcher.classList.toggle('ccbs-langSwitcher--open', Boolean(open));
			this.languageChip.setAttribute('aria-expanded', String(Boolean(open)));
		}

		_createLanguageSwitcher() {
			const wrapper = document.createElement('span');
			wrapper.className = 'ccbs-langSwitcher';
			wrapper.addEventListener('click', (e) => e.stopPropagation());
			wrapper.addEventListener('keydown', (e) => e.stopPropagation());

			this.languageChip = document.createElement('button');
			this.languageChip.type = 'button';
			this.languageChip.className = 'ccbs-langChip';
			this.languageChip.setAttribute('aria-haspopup', 'listbox');
			this.languageChip.setAttribute('aria-expanded', 'false');

			const select = document.createElement('select');
			select.className = 'ccbs-langSelect';

			const autoOption = document.createElement('option');
			autoOption.value = 'auto';
			autoOption.textContent = CC.i18n.t('autoLanguage');
			select.appendChild(autoOption);

			for (const lang of CC.i18n.availableLanguages) {
				const option = document.createElement('option');
				option.value = lang;
				option.textContent = CC.i18n.getLanguageName(lang);
				select.appendChild(option);
			}

			select.value = CC.i18n.getStoredLanguage();
			select.addEventListener('click', (e) => e.stopPropagation());
			select.addEventListener('change', () => {
				CC.i18n.setStoredLanguage(select.value);
				this._setLanguageSwitcherOpen(false);
				this.languageChip?.focus();
			});
			select.addEventListener('blur', () => {
				setTimeout(() => {
					if (!wrapper.contains(document.activeElement)) this._setLanguageSwitcherOpen(false);
				}, 0);
			});

			this.languageChip.addEventListener('click', () => {
				const open = !wrapper.classList.contains('ccbs-langSwitcher--open');
				this._setLanguageSwitcherOpen(open);
				if (!open) return;
				select.focus();
				if (typeof select.showPicker === 'function') {
					try { select.showPicker(); } catch { /* Some browsers require a direct user gesture. */ }
				}
			});

			this.languageSelect = select;
			wrapper.appendChild(this.languageChip);
			wrapper.appendChild(select);
			this._updateLanguageSelect();
			return wrapper;
		}

		_updateLanguageSelect() {
			const title = CC.i18n.t('languageSelectTitle');
			const selected = CC.i18n.getStoredLanguage();
			if (this.languageSelect) {
				this.languageSelect.value = selected;
				this.languageSelect.title = title;
				this.languageSelect.setAttribute('aria-label', title);
				const autoOption = this.languageSelect.querySelector('option[value="auto"]');
				if (autoOption) autoOption.textContent = CC.i18n.t('autoLanguage');
			}
			if (this.languageChip) {
				this.languageChip.textContent = this._getLanguageChipText();
				this.languageChip.title = title;
				this.languageChip.setAttribute('aria-label', `${title}: ${this.languageChip.textContent}`);
			}
			if (this.usageLine) {
				this.refreshButton.title = CC.i18n.t('refreshUsageTitle');
				this.refreshButton.setAttribute('aria-label', CC.i18n.t('refreshUsageTitle'));
			}
		}

		_applyLanguage() {
			this._updateLanguageSelect();
			this._setupTooltips(true);
			if (this.currentMetrics) this.setConversationMetrics(this.currentMetrics);
			if (this.currentUsage) this.setUsage(this.currentUsage);
			if (this.usageStatus) this.setUsageStatus(this.usageStatus);
			if (this.transportLimited) this.setTransportNotice(true);
		}

		_setupTooltips(refreshOnly = false) {
			if (!this.lengthTooltip) this.lengthTooltip = makeTooltip('');
			this.lengthTooltip.textContent = CC.i18n.t('tooltipTokens');
			setupTooltip(this.lengthGroup, this.lengthTooltip, { topOffset: 8 });

			if (!this.sessionTooltip) this.sessionTooltip = makeTooltip('');
			this.sessionTooltip.textContent = CC.i18n.t('tooltipSession');
			setupTooltip(this.sessionGroup, this.sessionTooltip, { topOffset: 8 });

			if (!this.weeklyTooltip) this.weeklyTooltip = makeTooltip('');
			this.weeklyTooltip.textContent = CC.i18n.t('tooltipWeekly');
			setupTooltip(this.weeklyGroup, this.weeklyTooltip, { topOffset: 8 });
		}

		attach() {
			this.attachHeader();
			this.attachUsageLine();
			this.refreshProgressChrome();
		}

		attachHeader() {
			const chatMenu = document.querySelector(CC.DOM.CHAT_MENU_TRIGGER);
			if (!chatMenu) return;
			const anchor = chatMenu.closest(CC.DOM.CHAT_PROJECT_WRAPPER) || chatMenu.parentElement;
			if (!anchor) return;
			if (anchor.nextElementSibling !== this.headerContainer) {
				anchor.after(this.headerContainer);
			}
			this._renderHeader();
			this.refreshProgressChrome();
		}

		attachUsageLine() {
			if (!this.usageLine) return;
			const modelSelector = document.querySelector(CC.DOM.MODEL_SELECTOR_DROPDOWN);
			if (!modelSelector) return;
			const gridContainer = modelSelector.closest('[data-testid="chat-input-grid-container"]');
			const gridArea = modelSelector.closest('[data-testid="chat-input-grid-area"]');
			const findToolbarRow = (el, stopAt) => {
				let cur = el;
				while (cur && cur !== document.body) {
					if (stopAt && cur === stopAt) break;
					if (cur !== el && cur.nodeType === 1) {
						const style = window.getComputedStyle(cur);
						if (style.display === 'flex' && style.flexDirection === 'row') {
							const buttons = cur.querySelectorAll('button').length;
							if (buttons > 1) return cur;
						}
					}
					cur = cur.parentElement;
				}
				return null;
			};

			const toolbarRow = gridArea || gridContainer ||
				(gridContainer ? findToolbarRow(modelSelector, gridArea || gridContainer) : null) ||
				findToolbarRow(modelSelector) ||
				modelSelector.parentElement?.parentElement?.parentElement;
			if (!toolbarRow) return;
			if (toolbarRow.nextElementSibling !== this.usageLine) {
				toolbarRow.after(this.usageLine);
			}
			this.refreshProgressChrome();
		}

		setPendingCache(pending) {
			this.pendingCache = pending;
			if (this.cacheTimeSpan) {
				if (pending) {
					this.cacheTimeSpan.style.color = '';
				} else {
					const { boldColor } = this.getProgressChrome();
					this.cacheTimeSpan.style.color = boldColor;
				}
			}
		}

		setConversationMetrics({ totalTokens, unavailable = false } = {}) {
			this.currentMetrics = Number.isFinite(totalTokens) ? { totalTokens } : unavailable ? { unavailable } : null;
			this.pendingCache = false;
			this.lastCachedUntilMs = null;
			this.cachedDisplay.textContent = '';
			this.lengthDisplay.textContent = Number.isFinite(totalTokens)
				? `~${totalTokens.toLocaleString(CC.i18n.getLocale())} ${CC.i18n.t('tokens')}`
				: unavailable ? CC.i18n.t('tokensUnavailable') : '';
			// No verified model limit or cache signal is available from this payload.
			this.lengthBar = null;
			this.lengthGroup.replaceChildren(this.lengthDisplay);
			this._renderHeader();
		}

		setTransportNotice(limited) {
			this.transportLimited = limited;
			this.transportSpan.textContent = limited ? CC.i18n.t('transportNotice') : '';
			this.transportSpan.classList.toggle('ccbs-hidden', !limited);
		}

		setUsageStatus(status) {
			this.usageStatus = status;
			const key = `status${status.status[0].toUpperCase()}${status.status.slice(1)}`;
			const time = status.updatedAt ? new Date(status.updatedAt).toLocaleTimeString(CC.i18n.getLocale(), { hour: '2-digit', minute: '2-digit' }) : '—';
			this.statusSpan.textContent = CC.i18n.t(key, { time });
			this.usageLine.dataset.status = status.status;
		}

		_renderHeader() {
			this.headerContainer.replaceChildren();

			const hasTokens = !!this.lengthDisplay.textContent;
			const hasCache = !!this.cachedDisplay.textContent;

			if (!hasTokens) return;

			if (hasCache) {
				const gap = this.lengthBar ? '\u00A0\u00A0' : '\u00A0';
				this.headerDisplay.replaceChildren(
					this.lengthGroup,
					document.createTextNode(gap),
					this.cachedDisplay
				);
			} else {
				this.headerDisplay.replaceChildren(this.lengthGroup);
			}

			this.headerContainer.appendChild(this.headerDisplay);
		}

		setUsage(usage) {
			this.currentUsage = usage || null;
			this.refreshProgressChrome();
			const session = usage?.five_hour || null;
			const weekly = usage?.seven_day || null;
			this.sessionGroup.classList.toggle('ccbs-hidden', !session);

			if (session && typeof session.utilization === 'number') {
				const rawPct = session.utilization;
				const pct = Math.round(rawPct * 10) / 10;
				this.sessionResetMs = session.resets_at ? Date.parse(session.resets_at) : null;
				this.sessionWindowStartMs = this.sessionResetMs ? this.sessionResetMs - 5 * 60 * 60 * 1000 : null;
				const resetText = this.sessionResetMs ? formatResetLabel(this.sessionResetMs) : '';
				this.sessionUsageBase = CC.i18n.t('sessionUsage', { pct: pct.toLocaleString(CC.i18n.getLocale(), { maximumFractionDigits: 1 }) });
				this.sessionUsageSpan.textContent = `${this.sessionUsageBase}${resetText}`;

				const width = Math.max(0, Math.min(100, rawPct));
				this.sessionBarFill.style.width = `${width}%`;
				this.sessionBarFill.classList.toggle('ccbs-warn', width >= 90);
				this.sessionBarFill.classList.toggle('ccbs-full', width >= 99.5);
			} else {
				this.sessionUsageSpan.textContent = '';
				this.sessionBarFill.style.width = '0%';
				this.sessionBarFill.classList.remove('ccbs-warn', 'ccbs-full');
				this.sessionResetMs = null;
				this.sessionWindowStartMs = null;
			}

			const hasWeekly = weekly && typeof weekly.utilization === 'number';
			this.weeklyGroup?.classList.toggle('ccbs-hidden', !hasWeekly);
			this.sessionGroup?.classList.toggle('ccbs-usageGroup--single', !hasWeekly);

			if (hasWeekly) {
				this.weeklyUsageSpan.classList.remove('ccbs-hidden');
				this.weeklyBar.classList.remove('ccbs-hidden');

				const rawPct = weekly.utilization;
				const pct = Math.round(rawPct * 10) / 10;
				this.weeklyResetMs = weekly.resets_at ? Date.parse(weekly.resets_at) : null;
				this.weeklyWindowStartMs = this.weeklyResetMs ? this.weeklyResetMs - 7 * 24 * 60 * 60 * 1000 : null;
				const resetText = this.weeklyResetMs ? formatResetLabel(this.weeklyResetMs) : '';
				this.weeklyUsageBase = CC.i18n.t('weeklyUsage', { pct: pct.toLocaleString(CC.i18n.getLocale(), { maximumFractionDigits: 1 }) });
				this.weeklyUsageSpan.textContent = `${this.weeklyUsageBase}${resetText}`;

				const width = Math.max(0, Math.min(100, rawPct));
				this.weeklyBarFill.style.width = `${width}%`;
				this.weeklyBarFill.classList.toggle('ccbs-warn', width >= 90);
				this.weeklyBarFill.classList.toggle('ccbs-full', width >= 99.5);
			} else {
				this.weeklyUsageSpan.classList.add('ccbs-hidden');
				this.weeklyBar.classList.add('ccbs-hidden');
				this.weeklyResetMs = null;
				this.weeklyWindowStartMs = null;
				this.weeklyBarFill.classList.remove('ccbs-warn', 'ccbs-full');
			}

			this._updateMarkers();
		}

		_updateMarkers() {
			const now = Date.now();

			if (this.sessionMarker && this.sessionWindowStartMs && this.sessionResetMs) {
				const total = this.sessionResetMs - this.sessionWindowStartMs;
				const elapsed = Math.max(0, Math.min(total, now - this.sessionWindowStartMs));
				const ratio = total > 0 ? elapsed / total : 0;
				const pct = Math.max(0, Math.min(100, ratio * 100));
				this.sessionMarker.classList.remove('ccbs-hidden');
				this.sessionMarker.style.left = `${pct}%`;
			} else if (this.sessionMarker) {
				this.sessionMarker.classList.add('ccbs-hidden');
			}

			if (this.weeklyMarker && this.weeklyWindowStartMs && this.weeklyResetMs) {
				const total = this.weeklyResetMs - this.weeklyWindowStartMs;
				const elapsed = Math.max(0, Math.min(total, now - this.weeklyWindowStartMs));
				const ratio = total > 0 ? elapsed / total : 0;
				const pct = Math.max(0, Math.min(100, ratio * 100));
				this.weeklyMarker.classList.remove('ccbs-hidden');
				this.weeklyMarker.style.left = `${pct}%`;
			} else if (this.weeklyMarker) {
				this.weeklyMarker.classList.add('ccbs-hidden');
			}
		}

		tick() {
			// Cache countdown
			const now = Date.now();
			if (this.lastCachedUntilMs && this.lastCachedUntilMs > now) {
				const secondsLeft = Math.max(0, Math.ceil((this.lastCachedUntilMs - now) / 1000));
				if (this.cacheTimeSpan) {
					this.cacheTimeSpan.textContent = formatSeconds(secondsLeft);
				}
			} else if (this.lastCachedUntilMs && this.lastCachedUntilMs <= now) {
				this.lastCachedUntilMs = null;
				this.cacheTimeSpan = null;
				this.pendingCache = false;
				this.cachedDisplay.textContent = '';
				this._renderHeader();
			}

			// Reset countdown text + time markers
			if (this.sessionResetMs && this.sessionUsageBase) {
				this.sessionUsageSpan.textContent = `${this.sessionUsageBase}${formatResetLabel(this.sessionResetMs)}`;
			}

			if (this.weeklyResetMs && this.weeklyUsageBase) {
				this.weeklyUsageSpan.textContent = `${this.weeklyUsageBase}${formatResetLabel(this.weeklyResetMs)}`;
			}

			this._updateMarkers();
		}
	}

	CC.ui = {
		CounterUI
	};
})();
