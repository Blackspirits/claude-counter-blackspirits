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

Motivo: adicionaria histórico local e mudaria o perfil de privacidade. Para já, a versão BlackSpirits mantém-se sem `chrome.storage` e sem histórico local; só guarda a preferência opcional de idioma no `localStorage` de `claude.ai`.

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
- `localStorage` usado apenas para a preferência opcional de idioma (`claude-counter-blackspirits-language`).
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

## Revisão adicional v0.4.4

- README convertido para formato bilingue pt-PT + inglês.
- Corrigida leitura de `lastActiveOrg` para suportar valores codificados.
- Reforçada deteção de pedidos de completion quando `fetch` recebe um objeto `Request`.
- Adicionado tratamento explícito de respostas HTTP não OK nos endpoints internos usados pela extensão.
- Evitado polling de uso enquanto o separador está oculto; o refresh fica concentrado no regresso ao separador.
- Adicionada proteção contra atualização de UI com métricas de uma conversa antiga após navegação.

## Próximos passos recomendados

1. Testar no Chrome/Edge com `Load unpacked`.
2. Abrir uma conversa longa no Claude e confirmar se a barra aparece.
3. Comparar os valores com `Settings > Usage` do Claude.
4. Só depois fazer commit/push para GitHub.


## v0.4.5 additional review

- Added a small i18n layer for injected UI text.
- Added manual language choice without new permissions.
- Chose `localStorage` on `claude.ai` instead of `chrome.storage` to keep the extension permission profile unchanged.
- Known trade-off: this stores one non-sensitive language preference under the Claude origin.

## Revisão adicional v0.4.6

- Corrigida a documentação de privacidade que ainda dizia que não havia `localStorage`; agora explica que só a preferência opcional de idioma é guardada.
- A opção `Automático` passou a remover a chave `claude-counter-blackspirits-language`.
- Hashing de mensagens movido para o content script isolado, evitando enviar texto completo pelo bridge injetado apenas para calcular fingerprints de cache local.
- Removido `requestHash` do bridge e o respetivo handler do script injetado.
- Adicionados alemão e italiano ao i18n interno e ao manifesto.
- Adicionadas labels de acessibilidade e refresh por teclado na linha de utilização e no seletor de idioma.
- Adicionado `PRIVACY.md` com explicação bilingue.
- Adicionado `tools/validate.mjs`, `package.json` e workflow GitHub Actions para validação básica.
- Userscript marcado como legacy e documentado separadamente.


## v0.4.7

- O seletor de idioma passou a recolher para um botão curto (`PT`, `EN`, `FR`, etc.) após seleção.
- Não foram adicionadas permissões novas nem armazenamento adicional.
