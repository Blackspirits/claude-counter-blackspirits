(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounterBlackSpirits = globalThis.ClaudeCounterBlackSpirits || {});
	const STORAGE_KEY = 'claude-counter-blackspirits-language';

	const STRINGS = Object.freeze({
	"pt-PT": {
		"languageName": "Português (Portugal)",
		"autoLanguage": "Automático",
		"languageSelectTitle": "Idioma da interface do Claude Counter",
		"refreshUsageTitle": "Clica para atualizar os dados de utilização",
		"tokens": "tokens",
		"unitSecondShort": "s",
		"unitMinuteShort": "min",
		"unitHourShort": "h",
		"unitDayShort": "d",
		"cachedFor": "em cache por",
		"resetLabel": " · repõe às {time} (daqui a {countdown})",
		"sessionUsage": "Sessão: {pct}%",
		"weeklyUsage": "Semanal: {pct}%",
		"tooltipTokens": "Tokens aproximados (exclui o prompt de sistema).\nUtiliza um tokenizer genérico; pode diferir da contagem do Claude.\nFica inválido após compactação de contexto.\nEscala da barra: 200k tokens (limite máximo de contexto do Claude; pode compactar antes disso).",
		"tooltipTokensCompacted": "Tokens aproximados (exclui o prompt de sistema).\nUtiliza um tokenizer genérico; pode diferir da contagem do Claude.\nEsta contagem fica inválida após compactação.",
		"tooltipCache": "As mensagens enviadas enquanto estão em cache são significativamente mais baratas.",
		"tooltipSession": "Janela de sessão de 5 horas.\nA barra mostra a tua utilização.\nA linha marca onde estás dentro da janela.",
		"tooltipWeekly": "Janela de utilização de 7 dias.\nA barra mostra a tua utilização.\nA linha marca onde estás dentro da janela."
	},
	"en": {
		"languageName": "English",
		"autoLanguage": "Auto",
		"languageSelectTitle": "Claude Counter interface language",
		"refreshUsageTitle": "Click to refresh usage data",
		"tokens": "tokens",
		"unitSecondShort": "s",
		"unitMinuteShort": "min",
		"unitHourShort": "h",
		"unitDayShort": "d",
		"cachedFor": "cached for",
		"resetLabel": " · resets at {time} (in {countdown})",
		"sessionUsage": "Session: {pct}%",
		"weeklyUsage": "Weekly: {pct}%",
		"tooltipTokens": "Approximate tokens (excludes system prompt).\nUses a generic tokenizer; may differ from Claude's count.\nBecomes invalid after context compaction.\nBar scale: 200k tokens (Claude's maximum context length; may compact before then).",
		"tooltipTokensCompacted": "Approximate tokens (excludes system prompt).\nUses a generic tokenizer; may differ from Claude's count.\nThis count is invalid after compaction.",
		"tooltipCache": "Messages sent while cached are significantly cheaper.",
		"tooltipSession": "5-hour session window.\nThe bar shows your usage.\nThe line marks where you are in the window.",
		"tooltipWeekly": "7-day usage window.\nThe bar shows your usage.\nThe line marks where you are in the window."
	},
	"fr": {
		"languageName": "Français",
		"autoLanguage": "Auto",
		"languageSelectTitle": "Langue de l'interface de Claude Counter",
		"refreshUsageTitle": "Cliquer pour actualiser les données d’utilisation",
		"tokens": "tokens",
		"unitSecondShort": "s",
		"unitMinuteShort": "min",
		"unitHourShort": "h",
		"unitDayShort": "j",
		"cachedFor": "en cache pendant",
		"resetLabel": " · réinitialisation à {time} (dans {countdown})",
		"sessionUsage": "Session : {pct} %",
		"weeklyUsage": "Hebdo : {pct} %",
		"tooltipTokens": "Tokens approximatifs (n'inclut pas le prompt système).\nUtilise un tokenizer générique ; peut différer du compteur de Claude.\nDevient invalide après compactage du contexte.\nÉchelle de la barre : 200k tokens (limite maximale de contexte de Claude ; le compactage peut arriver avant).",
		"tooltipTokensCompacted": "Tokens approximatifs (n'inclut pas le prompt système).\nUtilise un tokenizer générique ; peut différer du compteur de Claude.\nCe compteur est invalide après compactage.",
		"tooltipCache": "Les messages envoyés pendant que le cache est actif coûtent beaucoup moins cher.",
		"tooltipSession": "Fenêtre de session de 5 heures.\nLa barre indique ton utilisation.\nLa ligne marque ta position dans la fenêtre.",
		"tooltipWeekly": "Fenêtre d'utilisation de 7 jours.\nLa barre indique ton utilisation.\nLa ligne marque ta position dans la fenêtre."
	},
	"es": {
		"languageName": "Español",
		"autoLanguage": "Auto",
		"languageSelectTitle": "Idioma de la interfaz de Claude Counter",
		"refreshUsageTitle": "Haz clic para actualizar los datos de uso",
		"tokens": "tokens",
		"unitSecondShort": "s",
		"unitMinuteShort": "min",
		"unitHourShort": "h",
		"unitDayShort": "d",
		"cachedFor": "en caché durante",
		"resetLabel": " · se reinicia a las {time} (en {countdown})",
		"sessionUsage": "Sesión: {pct}%",
		"weeklyUsage": "Semanal: {pct}%",
		"tooltipTokens": "Tokens aproximados (excluye el prompt del sistema).\nUtiliza un tokenizador genérico; puede diferir del recuento de Claude.\nDeja de ser válido tras la compactación del contexto.\nEscala de la barra: 200k tokens (límite máximo de contexto de Claude; puede compactarse antes).",
		"tooltipTokensCompacted": "Tokens aproximados (excluye el prompt del sistema).\nUtiliza un tokenizador genérico; puede diferir del recuento de Claude.\nEste recuento no es válido tras la compactación.",
		"tooltipCache": "Los mensajes enviados mientras la caché está activa son mucho más baratos.",
		"tooltipSession": "Ventana de sesión de 5 horas.\nLa barra muestra tu uso.\nLa línea marca dónde estás dentro de la ventana.",
		"tooltipWeekly": "Ventana de uso de 7 días.\nLa barra muestra tu uso.\nLa línea marca dónde estás dentro de la ventana."
	},
	"de": {
		"languageName": "Deutsch",
		"autoLanguage": "Automatisch",
		"languageSelectTitle": "Sprache der Claude-Counter-Oberfläche",
		"refreshUsageTitle": "Klicken, um Nutzungsdaten zu aktualisieren",
		"tokens": "Tokens",
		"unitSecondShort": "s",
		"unitMinuteShort": "min",
		"unitHourShort": "h",
		"unitDayShort": "T",
		"cachedFor": "im Cache für",
		"resetLabel": " · wird um {time} zurückgesetzt (in {countdown})",
		"sessionUsage": "Sitzung: {pct}%",
		"weeklyUsage": "Wöchentlich: {pct}%",
		"tooltipTokens": "Ungefähre Tokens (ohne System-Prompt).\nVerwendet einen generischen Tokenizer; kann von Claudes Zählung abweichen.\nWird nach Kontextkompaktierung ungültig.\nBalkenskala: 200k Tokens (maximale Kontextlänge von Claude; Kompaktierung kann früher erfolgen).",
		"tooltipTokensCompacted": "Ungefähre Tokens (ohne System-Prompt).\nVerwendet einen generischen Tokenizer; kann von Claudes Zählung abweichen.\nDiese Zählung ist nach Kompaktierung ungültig.",
		"tooltipCache": "Nachrichten, die gesendet werden, während der Cache aktiv ist, sind deutlich günstiger.",
		"tooltipSession": "5-Stunden-Sitzungsfenster.\nDer Balken zeigt deine Nutzung.\nDie Linie markiert deine Position im Fenster.",
		"tooltipWeekly": "7-Tage-Nutzungsfenster.\nDer Balken zeigt deine Nutzung.\nDie Linie markiert deine Position im Fenster."
	},
	"it": {
		"languageName": "Italiano",
		"autoLanguage": "Automatico",
		"languageSelectTitle": "Lingua dell'interfaccia di Claude Counter",
		"refreshUsageTitle": "Fai clic per aggiornare i dati di utilizzo",
		"tokens": "token",
		"unitSecondShort": "s",
		"unitMinuteShort": "min",
		"unitHourShort": "h",
		"unitDayShort": "g",
		"cachedFor": "in cache per",
		"resetLabel": " · si azzera alle {time} (tra {countdown})",
		"sessionUsage": "Sessione: {pct}%",
		"weeklyUsage": "Settimanale: {pct}%",
		"tooltipTokens": "Token approssimativi (esclude il prompt di sistema).\nUsa un tokenizer generico; può differire dal conteggio di Claude.\nDiventa non valido dopo la compattazione del contesto.\nScala della barra: 200k token (limite massimo del contesto di Claude; può compattare prima).",
		"tooltipTokensCompacted": "Token approssimativi (esclude il prompt di sistema).\nUsa un tokenizer generico; può differire dal conteggio di Claude.\nQuesto conteggio non è valido dopo la compattazione.",
		"tooltipCache": "I messaggi inviati mentre la cache è attiva costano molto meno.",
		"tooltipSession": "Finestra di sessione di 5 ore.\nLa barra mostra il tuo utilizzo.\nLa linea indica dove ti trovi nella finestra.",
		"tooltipWeekly": "Finestra di utilizzo di 7 giorni.\nLa barra mostra il tuo utilizzo.\nLa linea indica dove ti trovi nella finestra."
	}
});

	function normalizeLanguage(lang) {
		if (!lang || typeof lang !== 'string') return 'en';
		const value = lang.trim().toLowerCase();
		if (value.startsWith('pt')) return 'pt-PT';
		if (value.startsWith('fr')) return 'fr';
		if (value.startsWith('es')) return 'es';
		if (value.startsWith('de')) return 'de';
		if (value.startsWith('it')) return 'it';
		return 'en';
	}

	function getStoredLanguage() {
		try {
			const value = localStorage.getItem(STORAGE_KEY);
			return value && (value === 'auto' || STRINGS[value]) ? value : 'auto';
		} catch {
			return 'auto';
		}
	}

	function setStoredLanguage(value) {
		const safeValue = value && (value === 'auto' || STRINGS[value]) ? value : 'auto';
		try {
			if (safeValue === 'auto') localStorage.removeItem(STORAGE_KEY);
			else localStorage.setItem(STORAGE_KEY, safeValue);
		} catch {
			// Ignore storage errors. The selected language will still apply until reload.
		}
		window.dispatchEvent(new CustomEvent('ccbs:languagechange'));
	}

	function getActiveLanguage() {
		const selected = getStoredLanguage();
		if (selected !== 'auto') return selected;
		return normalizeLanguage(navigator.language || navigator.userLanguage || 'en');
	}

	function t(key, vars = {}) {
		const lang = getActiveLanguage();
		const table = STRINGS[lang] || STRINGS.en;
		let text = table[key] ?? STRINGS.en[key] ?? key;
		for (const [name, value] of Object.entries(vars)) {
			text = text.replaceAll(`{${name}}`, String(value));
		}
		return text;
	}

	CC.i18n = Object.freeze({
		availableLanguages: Object.freeze(Object.keys(STRINGS)),
		getStoredLanguage,
		setStoredLanguage,
		getActiveLanguage,
		getLocale() {
			const lang = getActiveLanguage();
			return lang === 'pt-PT' ? 'pt-PT' : lang;
		},
		t,
		getLanguageName(lang) {
			return STRINGS[lang]?.languageName || lang;
		},
		getAutoLanguageName() {
			return STRINGS[getActiveLanguage()]?.autoLanguage || STRINGS.en.autoLanguage;
		}
	});
})();
