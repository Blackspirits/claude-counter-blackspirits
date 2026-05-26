# Claude Counter - BlackSpirits Edition

Fork pessoal do [Claude Counter](https://github.com/she-llac/claude-counter), adaptado para dar mais visibilidade ao uso de contexto e aos limites do Claude no navegador.

Esta versão mantém a base do projeto original, com pequenas correções de segurança, desempenho e apresentação dos limites. O objetivo é continuar simples, local e fácil de auditar.

> Créditos e licença MIT do projeto original mantidos.

## Português (pt-PT)

### O que faz

A extensão adiciona indicadores diretamente na interface do `claude.ai`:

- **Contagem de tokens** — estima os tokens da conversa atual e mostra uma barra em relação ao limite de contexto de 200k.
- **Tempo de cache** — mostra quanto tempo falta até a cache da conversa expirar.
- **Uso da janela de 5 horas** — mostra a utilização aproximada do limite de mensagens da janela atual.
- **Uso semanal** — mostra a utilização aproximada do limite semanal.
- **Hora de reposição dos limites** — mostra a hora aproximada de reposição e o tempo restante, por exemplo: `resets at 18:05 (in 2h 10m)`.
- **Melhor desempenho em segundo plano** — reduz trabalho desnecessário quando o separador está oculto e atualiza os dados quando voltas ao separador.

### Interface multilingue

A interface injetada no `claude.ai` suporta agora seleção de idioma diretamente na barra de utilização. Idiomas incluídos:

- Automático, com base no idioma do navegador
- Português de Portugal
- Inglês
- Francês
- Espanhol
- Alemão
- Italiano

A preferência é guardada localmente no `localStorage` do próprio `claude.ai` com a chave `claude-counter-blackspirits-language`. Se escolheres `Automático`, a chave é removida. Não adiciona permissões novas à extensão.

Depois de escolheres um idioma, o seletor recolhe para um pequeno botão (`PT`, `EN`, `FR`, etc.). Clica nesse botão para voltar a abrir a lista.

O manifesto da extensão também está localizado para os idiomas suportados pelo navegador.

## Instalação recomendada

#### Chrome / Edge / Chromium

1. Descarrega o ZIP desta versão.
2. Extrai o ZIP para uma pasta fixa, por exemplo:

   ```text
   C:\Tools\claude-counter-blackspirits
   ```

3. Abre:

   ```text
   chrome://extensions
   ```

4. Ativa o **Modo de programador**.
5. Clica em **Carregar sem compactação**.
6. Escolhe a pasta onde está o ficheiro `manifest.json`.

> Não apagues a pasta depois de carregar a extensão. O Chrome/Edge continua a ler os ficheiros diretamente dessa pasta.

### Userscript

Também existe uma versão em:

```text
userscript/claude-counter.user.js
```

Recomendo a extensão. A versão userscript carrega o tokenizer através de `@require` externo, enquanto a extensão inclui o tokenizer localmente.

### Privacidade

Esta versão foi mantida simples de propósito:

- não envia conversas, prompts ou respostas para servidores externos;
- corre apenas em `https://claude.ai/*`;
- lê o cookie `lastActiveOrg` para consultar o endpoint `/usage` do Claude;
- faz pedidos apenas para `claude.ai`, utilizando a sessão já ativa no navegador;
- não utiliza `chrome.storage`;
- utiliza `localStorage` apenas para a preferência opcional de idioma (`claude-counter-blackspirits-language`);
- não guarda histórico local nesta versão.

Mais detalhe: ver `PRIVACY.md`.

Mesmo assim, trata isto como uma extensão de confiança elevada: ela corre dentro da página do Claude e consegue ler partes da interface. Instala apenas a partir do teu próprio fork ou de uma versão que tenhas auditado.

### Limitações conhecidas

- A contagem de tokens é uma estimativa, não a contagem oficial do Claude.
- Conversas com pesquisa web, ficheiros, imagens ou outputs de ferramentas podem ficar subcontadas.
- Depois de uma compactação de contexto, a barra pode deixar de representar o contexto real da sessão.
- A extensão foi pensada para `claude.ai` no navegador.
- Não é uma ferramenta para Claude Desktop nem para Claude Code no terminal.
- Pode deixar de funcionar se a Anthropic alterar a estrutura interna da interface do Claude.

### Alterações BlackSpirits v0.4.6

- Hashing de mensagens movido para o content script isolado; deixa de enviar texto completo pelo bridge injetado só para calcular fingerprints locais.
- Corrigida a documentação de privacidade sobre `localStorage`.
- A opção `Automático` remove a preferência de idioma guardada.
- Adicionados alemão e italiano à interface e ao manifesto.
- Adicionadas labels de acessibilidade e refresh por teclado na linha de utilização.
- Adicionados `PRIVACY.md`, `package.json`, `tools/validate.mjs` e GitHub Action de validação.
- Userscript marcado como versão legacy; a extensão continua a ser a recomendada.

### Alterações BlackSpirits v0.4.5

- Interface multilingue: Automático, pt-PT, inglês, francês e espanhol.
- README bilingue: pt-PT + inglês.
- Leitura de `lastActiveOrg` com `decodeURIComponent`.
- Deteção mais robusta de pedidos `fetch`, incluindo quando o método vem de um objeto `Request`.
- Erros HTTP dos endpoints internos do Claude passam a ser tratados explicitamente.
- Evita refreshes/polling de uso enquanto o separador está oculto; o refresh acontece ao regressar ao separador.
- Evita atualizar a UI com métricas antigas se a conversa mudar durante o cálculo.

### Alterações BlackSpirits v0.4.3

- Nome atualizado para `Claude Counter - BlackSpirits Edition`.
- Aplicada a melhoria da PR #15: pausa atualizações de UI quando o separador está oculto e atualiza ao voltar.
- Aplicada e melhorada a ideia da PR #14: hora de reset + contagem decrescente.
- `postMessage` limitado a `https://claude.ai`.
- URLs internas passam a utilizar `encodeURIComponent` para `orgId` e `conversationId`.
- Extração textual mais robusta para alguns outputs de ferramentas e pesquisa web.
- Adicionados `SECURITY.md`, `CHANGELOG.md` e `AUDIT_BLACKSPIRITS.md`.

### Como atualizar uma instalação existente

1. Descarrega a nova versão.
2. Extrai por cima da pasta antiga, ou substitui a pasta antiga pela nova.
3. Abre `chrome://extensions`.
4. Clica em **Atualizar**.
5. Recarrega o separador do Claude.

### Como testar rapidamente

1. Abre `https://claude.ai`.
2. Entra numa conversa existente ou cria uma nova.
3. Confirma se aparecem os indicadores de tokens/cache/uso.
4. Abre as definições de uso do Claude e compara os valores com os mostrados pela extensão.
5. Usa os valores como referência aproximada, não como verdade absoluta.

---

## English

Personal fork of [Claude Counter](https://github.com/she-llac/claude-counter), adapted to make Claude context usage and limits more visible in the browser.

This version keeps the original project small and auditable while adding minor security, performance and display improvements.

> Original project credits and MIT licence are preserved.

### What it does

The extension adds usage indicators directly to the `claude.ai` interface:

- **Token count** — estimates the tokens in the current conversation and shows a bar against a 200k context limit.
- **Cache timer** — shows how long the current conversation cache should remain active.
- **5-hour session usage** — shows the approximate usage of the current session window.
- **Weekly usage** — shows the approximate weekly usage.
- **Reset time** — shows the approximate reset time and countdown, for example: `resets at 18:05 (in 2h 10m)`.
- **Better background performance** — reduces unnecessary work while the tab is hidden and refreshes data when the tab becomes visible again.

### Multilingual interface

The injected `claude.ai` UI now includes a language selector in the usage row. Included languages:

- Auto, based on the browser language
- Portuguese (Portugal)
- English
- French
- Spanish
- German
- Italian

The preference is stored locally in `localStorage` on `claude.ai` under the key `claude-counter-blackspirits-language`. Choosing `Auto` removes the key. This does not add extension permissions.

After choosing a language, the selector collapses into a small chip (`PT`, `EN`, `FR`, etc.). Click the chip to open the full list again.

The extension manifest is also localized for supported browser languages.

### Recommended installation

#### Chrome / Edge / Chromium

1. Download the ZIP for this version.
2. Extract it to a stable folder, for example:

   ```text
   C:\Tools\claude-counter-blackspirits
   ```

3. Open:

   ```text
   chrome://extensions
   ```

4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the folder containing `manifest.json`.

> Do not delete the folder afterwards. Chrome/Edge keeps reading the extension files directly from that folder.

### Userscript

A userscript version is also included in:

```text
userscript/claude-counter.user.js
```

The extension build is recommended. The userscript loads the tokenizer through an external `@require`, while the extension vendors the tokenizer locally.

### Privacy

This version is intentionally simple:

- it does not send conversations, prompts or responses to external servers;
- it only runs on `https://claude.ai/*`;
- it reads the `lastActiveOrg` cookie to query Claude's `/usage` endpoint;
- it only makes requests to `claude.ai`, using the already active browser session;
- it does not use `chrome.storage`;
- it uses `localStorage` only for the optional language preference (`claude-counter-blackspirits-language`);
- it does not keep local usage history in this version.

More detail: see `PRIVACY.md`.

Still, treat this as a high-trust extension: it runs inside the Claude page and can read parts of that interface. Install only from your own fork or from a build you have audited.

### Known limitations

- Token counting is an estimate, not Claude's official count.
- Conversations with web search, files, images or tool outputs can be undercounted.
- After context compaction, the context bar may no longer represent the true session context.
- The extension targets `claude.ai` in the browser.
- It is not a tool for Claude Desktop or Claude Code in the terminal.
- It may stop working if Anthropic changes Claude's internal UI structure.

### BlackSpirits v0.4.6 changes

- Moved message hashing into the isolated content script; full message text is no longer sent through the injected page bridge just to compute local cache fingerprints.
- Fixed privacy documentation around `localStorage`.
- The `Auto` language option now removes the stored language preference.
- Added German and Italian to the injected UI and browser manifest.
- Added keyboard refresh/accessibility labels for the usage row and language selector.
- Added `PRIVACY.md`, `package.json`, `tools/validate.mjs` and a GitHub validation workflow.
- Marked the userscript as legacy; the extension build remains recommended.

### BlackSpirits v0.4.5 changes

- Multilingual interface: Auto, pt-PT, English, French and Spanish.
- Bilingual README: pt-PT + English.
- Reads `lastActiveOrg` with `decodeURIComponent`.
- More robust `fetch` request detection, including when the method comes from a `Request` object.
- Internal Claude endpoint HTTP errors are handled explicitly.
- Avoids usage refresh/polling while the tab is hidden; refresh happens when the tab becomes visible again.
- Avoids updating the UI with stale metrics if the conversation changes during calculation.

### BlackSpirits v0.4.3 changes

- Renamed to `Claude Counter - BlackSpirits Edition`.
- Applied PR #15: skip UI updates while the tab is hidden and refresh when visible again.
- Applied and improved PR #14: reset time + countdown.
- Restricted `postMessage` to `https://claude.ai`.
- Internal URLs now use `encodeURIComponent` for `orgId` and `conversationId`.
- More robust text extraction for some tool and web-search payloads.
- Added `SECURITY.md`, `CHANGELOG.md` and `AUDIT_BLACKSPIRITS.md`.

### Updating an existing installation

1. Download the new version.
2. Extract it over the old folder, or replace the old folder with the new one.
3. Open `chrome://extensions`.
4. Click **Update**.
5. Reload the Claude tab.

### Quick test

1. Open `https://claude.ai`.
2. Open an existing conversation or create a new one.
3. Check whether the token/cache/usage indicators appear.
4. Compare the values with Claude's native usage settings.
5. Treat the values as a useful estimate, not as absolute truth.

## Credits

- Original project: [she-llac/claude-counter](https://github.com/she-llac/claude-counter)
- Token counting via [gpt-tokenizer](https://github.com/niieani/gpt-tokenizer) — MIT
- Inspired by [Claude Usage Tracker](https://github.com/lugia19/Claude-Usage-Extension)

## Licence

MIT
