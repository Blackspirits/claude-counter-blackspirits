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

		// Claude's native usage UI is rounded, so keep display stable around 5-minute boundaries.
		const fiveMinutesMs = 5 * 60 * 1000;
		const resetDate = new Date(Math.round(timestampMs / fiveMinutesMs) * fiveMinutesMs);
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

	function makeTooltip(text) {
		const tip = document.createElement('div');
		tip.className = 'bg-bg-500 text-text-000 ccbs-tooltip';
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
				'text-text-400 text-[11px] ccbs-usageRow ccbs-hidden flex flex-row items-center gap-3 w-full';
			this.usageLine.tabIndex = 0;
			this.usageLine.setAttribute('role', 'button');
			this.usageLine.title = CC.i18n.t('refreshUsageTitle');
			this.usageLine.setAttribute('aria-label', CC.i18n.t('refreshUsageTitle'));

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
			this.usageLine.appendChild(this.languageSwitcher);

			this.refreshProgressChrome();

			this.usageLine.addEventListener('click', () => this._refreshUsageFromUi());
			this.usageLine.addEventListener('keydown', (event) => {
				if (event.key !== 'Enter' && event.key !== ' ') return;
				event.preventDefault();
				this._refreshUsageFromUi();
			});
		}

		async _refreshUsageFromUi() {
			if (!this.onUsageRefresh || this.refreshingUsage) return;
			this.refreshingUsage = true;
			this.usageLine.classList.add('ccbs-usageRow--dim');
			try {
				await this.onUsageRefresh();
			} finally {
				this.usageLine.classList.remove('ccbs-usageRow--dim');
				this.refreshingUsage = false;
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
				this.usageLine.title = CC.i18n.t('refreshUsageTitle');
				this.usageLine.setAttribute('aria-label', CC.i18n.t('refreshUsageTitle'));
			}
		}

		_applyLanguage() {
			this._updateLanguageSelect();
			this._setupTooltips(true);
			if (this.currentMetrics) this.setConversationMetrics(this.currentMetrics);
			if (this.currentUsage) this.setUsage(this.currentUsage);
		}

		_setupTooltips(refreshOnly = false) {
			if (!this.lengthTooltip) this.lengthTooltip = makeTooltip('');
			this.lengthTooltip.textContent = CC.i18n.t('tooltipTokens');
			setupTooltip(this.lengthGroup, this.lengthTooltip, { topOffset: 8 });

			if (!this.cacheTooltip) this.cacheTooltip = makeTooltip('');
			this.cacheTooltip.textContent = CC.i18n.t('tooltipCache');
			setupTooltip(this.cachedDisplay, this.cacheTooltip, { topOffset: 8 });

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

			const toolbarRow =
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

		setConversationMetrics({ totalTokens, cachedUntil } = {}) {
			this.currentMetrics = typeof totalTokens === 'number' ? { totalTokens, cachedUntil } : null;
			this.pendingCache = false;

			if (typeof totalTokens !== 'number') {
				this.lengthDisplay.textContent = '';
				this.cachedDisplay.textContent = '';
				this.lastCachedUntilMs = null;
				this._renderHeader();
				return;
			}

			const pct = Math.max(0, Math.min(100, (totalTokens / CC.CONST.CONTEXT_LIMIT_TOKENS) * 100));
			this.lengthDisplay.textContent = `~${totalTokens.toLocaleString()} ${CC.i18n.t('tokens')}`;

			// Mini bar (hide when full - context is definitely compacted by then)
			const isFull = pct >= 99.5;
			if (isFull) {
				this.lengthDisplay.style.opacity = '0.5';
				this.lengthBar = null;
				this.lengthGroup.replaceChildren(this.lengthDisplay);
				if (this.lengthTooltip) {
					this.lengthTooltip.textContent = CC.i18n.t('tooltipTokensCompacted');
				}
			} else {
				this.lengthDisplay.style.opacity = '';
				const bar = document.createElement('div');
				bar.className = 'ccbs-bar ccbs-bar--mini';
				this.lengthBar = bar;
				const fill = document.createElement('div');
				fill.className = 'ccbs-bar__fill';
				fill.style.width = `${pct}%`;
				bar.appendChild(fill);
				this.refreshProgressChrome();

				const barContainer = document.createElement('span');
				barContainer.className = 'inline-flex items-center';
				barContainer.appendChild(bar);

				this.lengthGroup.replaceChildren(this.lengthDisplay, document.createTextNode('\u00A0\u00A0'), barContainer);
			}

			// Cache timer
			const now = Date.now();
			if (typeof cachedUntil === 'number' && cachedUntil > now) {
				this.lastCachedUntilMs = cachedUntil;
				const secondsLeft = Math.max(0, Math.ceil((cachedUntil - now) / 1000));
				const { boldColor } = this.getProgressChrome();
				this.cacheTimeSpan = Object.assign(document.createElement('span'), {
					className: 'ccbs-cacheTime',
					textContent: formatSeconds(secondsLeft)
				});
				this.cacheTimeSpan.style.color = boldColor;
				this.cachedDisplay.replaceChildren(document.createTextNode(`${CC.i18n.t('cachedFor')}\u00A0`), this.cacheTimeSpan);
			} else {
				this.lastCachedUntilMs = null;
				this.cacheTimeSpan = null;
				this.cachedDisplay.textContent = '';
			}

			this._renderHeader();
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
			const hasAnyUsage =
				!!(session && typeof session.utilization === 'number') || !!(weekly && typeof weekly.utilization === 'number');
			this.usageLine?.classList.toggle('ccbs-hidden', !hasAnyUsage);

			if (session && typeof session.utilization === 'number') {
				const rawPct = session.utilization;
				const pct = Math.round(rawPct * 10) / 10;
				this.sessionResetMs = session.resets_at ? Date.parse(session.resets_at) : null;
				this.sessionWindowStartMs = this.sessionResetMs ? this.sessionResetMs - 5 * 60 * 60 * 1000 : null;
				const resetText = this.sessionResetMs ? formatResetLabel(this.sessionResetMs) : '';
				this.sessionUsageBase = CC.i18n.t('sessionUsage', { pct });
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
				this.weeklyUsageBase = CC.i18n.t('weeklyUsage', { pct });
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
