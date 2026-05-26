# Claude Counter - BlackSpirits Edition

Fork pessoal do [Claude Counter](https://github.com/she-llac/claude-counter), focado em contagem aproximada de contexto e visibilidade dos limites do Claude no browser.

> Mantém os créditos e a licença MIT do projeto original.

## O que mostra

- **Token count** — contagem aproximada dos tokens da conversa atual, com barra contra o limite de 200k.
- **Cache timer** — tempo restante da cache da conversa.
- **Usage bars** — uso da janela de 5 horas e da janela semanal a partir da API nativa do Claude.
- **Reset time melhorado** — mostra a hora aproximada de reset e o tempo restante, por exemplo `resets at 18:05 (in 2h 10m)`.
- **Melhor desempenho em background** — evita atualizar a UI a cada segundo quando o separador está oculto e atualiza ao voltar.

## Instalação recomendada

### Chrome / Edge / Chromium

1. Descarrega o ZIP desta versão.
2. Extrai o ZIP para uma pasta fixa, por exemplo `C:\Tools\claude-counter-blackspirits`.
3. Abre `chrome://extensions`.
4. Ativa **Developer mode**.
5. Clica em **Load unpacked** / **Carregar sem compactação**.
6. Escolhe a pasta onde está o `manifest.json`.

> Não apagues a pasta depois de carregar a extensão. O Chrome continua a ler os ficheiros daí.

### Userscript

Existe uma versão em `userscript/claude-counter.user.js`, mas a extensão é a opção recomendada. O userscript carrega o tokenizer via `@require` externo, enquanto a extensão inclui o tokenizer localmente.

## Privacidade

- Não envia dados para servidores externos teus ou de terceiros.
- Corre apenas em `https://claude.ai/*`.
- Lê o cookie `lastActiveOrg` para consultar o endpoint `/usage` do Claude.
- Faz pedidos apenas para `claude.ai`, usando a sessão já ativa no browser.
- Não utiliza `chrome.storage`, `localStorage` ou histórico local nesta versão.

## Limitações conhecidas

- A contagem de tokens é aproximada e pode divergir da contagem real do Claude.
- Conversas com web search, ficheiros e outputs de ferramentas continuam a ser difíceis de contar com 100% de precisão.
- Depois de compactação de contexto, a contagem visual pode deixar de representar o contexto real.
- Esta extensão é para `claude.ai` no browser, não para Claude Desktop nem Claude Code no terminal.

## Alterações BlackSpirits v0.4.3

- Branding atualizado para `Claude Counter - BlackSpirits Edition`.
- Aplicada a melhoria da PR #15: pausa os ticks de UI quando o separador está oculto e atualiza ao voltar.
- Aplicada e melhorada a ideia da PR #14: hora de reset + countdown, em vez de apenas countdown.
- Hardening de `postMessage`: origem limitada a `https://claude.ai`.
- URLs internas passam a utilizar `encodeURIComponent` para `orgId` e `conversationId`.
- Extração textual mais robusta para alguns outputs de ferramentas/web search.
- Adicionado `SECURITY.md` e `CHANGELOG.md`.

## Créditos

- Projeto original: [she-llac/claude-counter](https://github.com/she-llac/claude-counter)
- Token counting via [gpt-tokenizer](https://github.com/niieani/gpt-tokenizer) (MIT)
- Inspirado por [Claude Usage Tracker](https://github.com/lugia19/Claude-Usage-Extension)

## Licença

MIT
