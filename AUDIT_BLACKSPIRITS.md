# Auditoria BlackSpirits - Claude Counter

## Veredicto

Fork recomendado para uso pessoal no browser, desde que seja tratado como extensão de confiança elevada porque corre dentro de `claude.ai`.

## O que foi revisto

- `manifest.json`
- `src/content/main.js`
- `src/content/ui.js`
- `src/content/tokens.js`
- `src/content/bridge-client.js`
- `src/injected/bridge.js`
- `userscript/claude-counter.user.js`
- permissões, origens, storage, requests e pontos de injeção

## Pull requests avaliadas

### PR #15 - background UI tick

Aplicada e ligeiramente reforçada.

- Evita `ui.tick()` quando o separador está oculto.
- Ao voltar ao separador, atualiza UI imediatamente.
- Se o separador esteve oculto mais de 5 minutos, força refresh de uso e conversa.

### PR #14 - exact reset time

Aplicada como versão melhorada.

- Em vez de trocar o countdown pela hora, mostra ambos:
  - `resets at 18:05 (in 2h 10m)`
- A hora é arredondada para intervalos de 5 minutos, como na PR original.

### PR #19 - Chrome Web Store README

Não aplicada.

Motivo: não interessa para um fork local/pessoal. O README foi reescrito para instalação local via `Load unpacked`.

### PR/popup/settings/history

Não aplicada.

Motivo: adicionaria estado local/armazenamento e mudaria o perfil de privacidade. Para já, a versão BlackSpirits mantém-se sem `chrome.storage` e sem histórico local.

## Issues consideradas

### #9 - undercount com web search e tool outputs

Mitigação parcial aplicada.

- A extração textual de `tool_result` e blocos semelhantes foi reforçada.
- Ainda não é garantia absoluta, porque a API interna do Claude pode mudar o formato de payloads.

### #13 - Claude Code web

Não corrigida.

Motivo: requer testes reais em `claude.ai/code` e novos seletores de UI. Corrigir às cegas teria alto risco de regressão.

### Desktop / DXT / Firefox Store

Fora do âmbito desta versão.

## Segurança

### Pontos bons

- Sem permissões globais.
- Só corre em `https://claude.ai/*`.
- Sem `chrome.storage`.
- Sem `localStorage`.
- Sem analytics.
- Tokenizer vendorizado na extensão.

### Melhorias aplicadas

- `postMessage` limitado a `https://claude.ai` em vez de `*`.
- `event.origin` validado no bridge.
- `orgId` e `conversationId` codificados com `encodeURIComponent` antes de criar URLs.
- Adicionado `SECURITY.md`.

### Risco que continua a existir

Qualquer extensão que corre em `claude.ai` pode ver dados da página nessa origem. Isto deve ser usado como código de confiança, não como extensão aleatória instalada da Web Store sem revisão.

## Recomendação de uso

Usar a extensão, não o userscript.

O userscript continua incluído, mas carrega o tokenizer via `@require` externo. A extensão é mais previsível porque inclui o tokenizer localmente.

## Testes feitos

- `node --check` em todos os ficheiros JS principais.
- Validação JSON do `manifest.json`.
- Revisão estática de permissões e chamadas de rede.

## Próximos passos recomendados

1. Testar no Chrome/Edge com `Load unpacked`.
2. Abrir uma conversa longa no Claude e confirmar se a barra aparece.
3. Comparar os valores com `Settings > Usage` do Claude.
4. Só depois fazer commit/push para GitHub.
