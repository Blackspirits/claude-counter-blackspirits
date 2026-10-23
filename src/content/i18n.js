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
		"resetLabel": " · repõe às {time} (daqui a {countdown})",
		"sessionUsage": "Sessão: {pct}%",
		"weeklyUsage": "Semanal: {pct}%",
		"tooltipTokens": "Estimativa de tokens no texto visível, calculada com um tokenizador genérico. Exclui instruções ocultas e conteúdo não textual. Não mede o contexto restante nem deteta a compactação.",
		"tooltipSession": "Janela de sessão de 5 horas.\nA barra mostra a tua utilização.\nA linha marca onde estás dentro da janela.",
		"tooltipWeekly": "Janela de utilização de 7 dias.\nA barra mostra a tua utilização.\nA linha marca onde estás dentro da janela.",
		"statusLoading": "A atualizar…",
		"statusUpdated": "Atualizado às {time}",
		"statusStale": "Desatualizado · {time}",
		"statusSignedOut": "Inicia sessão ou verifica o acesso",
		"statusUnavailable": "Indisponível · nova tentativa agendada",
		"statusUnsupported": "Formato de utilização indisponível",
		"transportNotice": "Atualizações em direto limitadas; podes atualizar manualmente",
		"tokensUnavailable": "Estimativa de tokens indisponível",
		"showDetails": "Mostrar detalhes",
		"hideDetails": "Ocultar detalhes"
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
		"resetLabel": " · resets at {time} (in {countdown})",
		"sessionUsage": "Session: {pct}%",
		"weeklyUsage": "Weekly: {pct}%",
		"tooltipTokens": "Approximate tokens in visible text, using a generic tokenizer. Excludes hidden prompts and non-text media. Does not measure remaining context or detect compaction.",
		"tooltipSession": "5-hour session window.\nThe bar shows your usage.\nThe line marks where you are in the window.",
		"tooltipWeekly": "7-day usage window.\nThe bar shows your usage.\nThe line marks where you are in the window.",
		"statusLoading": "Updating…",
		"statusUpdated": "Updated {time}",
		"statusStale": "Out of date · {time}",
		"statusSignedOut": "Sign in or check access",
		"statusUnavailable": "Unavailable · retry scheduled",
		"statusUnsupported": "Usage format unavailable",
		"transportNotice": "Limited live updates; refresh available",
		"tokensUnavailable": "Token estimate unavailable",
		"showDetails": "Show details",
		"hideDetails": "Hide details"
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
		"resetLabel": " · réinitialisation à {time} (dans {countdown})",
		"sessionUsage": "Session : {pct} %",
		"weeklyUsage": "Hebdo : {pct} %",
		"tooltipTokens": "Estimation des tokens du texte visible avec un tokenizer générique. Exclut les instructions masquées et les médias non textuels. Ne mesure pas le contexte restant et ne détecte pas la compression.",
		"tooltipSession": "Fenêtre de session de 5 heures.\nLa barre indique ton utilisation.\nLa ligne marque ta position dans la fenêtre.",
		"tooltipWeekly": "Fenêtre d'utilisation de 7 jours.\nLa barre indique ton utilisation.\nLa ligne marque ta position dans la fenêtre.",
		"statusLoading": "Mise à jour…",
		"statusUpdated": "Mis à jour à {time}",
		"statusStale": "Données anciennes · {time}",
		"statusSignedOut": "Connectez-vous ou vérifiez l’accès",
		"statusUnavailable": "Indisponible · nouvelle tentative prévue",
		"statusUnsupported": "Format d’utilisation indisponible",
		"transportNotice": "Mises à jour en direct limitées ; actualisation disponible",
		"tokensUnavailable": "Estimation des tokens indisponible",
		"showDetails": "Afficher les détails",
		"hideDetails": "Masquer les détails"
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
		"resetLabel": " · se reinicia a las {time} (en {countdown})",
		"sessionUsage": "Sesión: {pct}%",
		"weeklyUsage": "Semanal: {pct}%",
		"tooltipTokens": "Estimación de tokens del texto visible con un tokenizador genérico. Excluye instrucciones ocultas y contenido no textual. No mide el contexto restante ni detecta la compactación.",
		"tooltipSession": "Ventana de sesión de 5 horas.\nLa barra muestra tu uso.\nLa línea marca dónde estás dentro de la ventana.",
		"tooltipWeekly": "Ventana de uso de 7 días.\nLa barra muestra tu uso.\nLa línea marca dónde estás dentro de la ventana.",
		"statusLoading": "Actualizando…",
		"statusUpdated": "Actualizado a las {time}",
		"statusStale": "Datos desactualizados · {time}",
		"statusSignedOut": "Inicia sesión o comprueba el acceso",
		"statusUnavailable": "No disponible · reintento programado",
		"statusUnsupported": "Formato de uso no disponible",
		"transportNotice": "Actualizaciones en directo limitadas; puedes actualizar manualmente",
		"tokensUnavailable": "Estimación de tokens no disponible",
		"showDetails": "Mostrar detalles",
		"hideDetails": "Ocultar detalles"
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
		"resetLabel": " · wird um {time} zurückgesetzt (in {countdown})",
		"sessionUsage": "Sitzung: {pct}%",
		"weeklyUsage": "Wöchentlich: {pct}%",
		"tooltipTokens": "Geschätzte Tokens im sichtbaren Text mit einem generischen Tokenizer. Verborgene Anweisungen und nicht textuelle Medien sind ausgeschlossen. Misst nicht den verbleibenden Kontext und erkennt keine Komprimierung.",
		"tooltipSession": "5-Stunden-Sitzungsfenster.\nDer Balken zeigt deine Nutzung.\nDie Linie markiert deine Position im Fenster.",
		"tooltipWeekly": "7-Tage-Nutzungsfenster.\nDer Balken zeigt deine Nutzung.\nDie Linie markiert deine Position im Fenster.",
		"statusLoading": "Wird aktualisiert…",
		"statusUpdated": "Aktualisiert um {time}",
		"statusStale": "Veraltete Daten · {time}",
		"statusSignedOut": "Anmelden oder Zugriff prüfen",
		"statusUnavailable": "Nicht verfügbar · erneuter Versuch geplant",
		"statusUnsupported": "Nutzungsformat nicht verfügbar",
		"transportNotice": "Live-Aktualisierung eingeschränkt; manuelle Aktualisierung verfügbar",
		"tokensUnavailable": "Token-Schätzung nicht verfügbar",
		"showDetails": "Details anzeigen",
		"hideDetails": "Details ausblenden"
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
		"resetLabel": " · si azzera alle {time} (tra {countdown})",
		"sessionUsage": "Sessione: {pct}%",
		"weeklyUsage": "Settimanale: {pct}%",
		"tooltipTokens": "Stima dei token nel testo visibile con un tokenizer generico. Esclude istruzioni nascoste e contenuti non testuali. Non misura il contesto rimanente e non rileva la compattazione.",
		"tooltipSession": "Finestra di sessione di 5 ore.\nLa barra mostra il tuo utilizzo.\nLa linea indica dove ti trovi nella finestra.",
		"tooltipWeekly": "Finestra di utilizzo di 7 giorni.\nLa barra mostra il tuo utilizzo.\nLa linea indica dove ti trovi nella finestra.",
		"statusLoading": "Aggiornamento…",
		"statusUpdated": "Aggiornato alle {time}",
		"statusStale": "Dati non aggiornati · {time}",
		"statusSignedOut": "Accedi o verifica l’accesso",
		"statusUnavailable": "Non disponibile · nuovo tentativo programmato",
		"statusUnsupported": "Formato di utilizzo non disponibile",
		"transportNotice": "Aggiornamenti in tempo reale limitati; aggiornamento manuale disponibile",
		"tokensUnavailable": "Stima dei token non disponibile",
		"showDetails": "Mostra dettagli",
		"hideDetails": "Nascondi dettagli"
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

	let memoryLanguage;
	function getStoredLanguage() {
		if (memoryLanguage !== undefined) return memoryLanguage;
		try {
			const value = localStorage.getItem(STORAGE_KEY);
			return value && (value === 'auto' || Object.hasOwn(STRINGS, value)) ? value : 'auto';
		} catch {
			return 'auto';
		}
	}

	function setStoredLanguage(value) {
		const safeValue = value && (value === 'auto' || Object.hasOwn(STRINGS, value)) ? value : 'auto';
		memoryLanguage = safeValue;
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
