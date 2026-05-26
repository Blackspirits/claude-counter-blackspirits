# Privacidade / Privacy

## Português (pt-PT)

Esta fork foi desenhada para ser simples e auditável.

### O que a extensão lê

- Conteúdo da conversa ativa no `claude.ai`, apenas para estimar tokens localmente.
- Cookie `lastActiveOrg`, apenas para descobrir a organização ativa e consultar o endpoint interno `/usage` do Claude.
- Dados de utilização devolvidos pelo próprio `claude.ai`.

### O que a extensão guarda

- Apenas a preferência de idioma da interface, quando escolhes manualmente um idioma.
- Chave: `claude-counter-blackspirits-language`.
- Local: `localStorage` do próprio `https://claude.ai`.
- Se escolheres `Automático`, a chave é removida.

### O que a extensão não faz

- Não envia prompts, respostas ou conversas para servidores externos.
- Não usa analytics.
- Não usa `chrome.storage`.
- Não guarda histórico de utilização.
- Não faz pedidos para domínios de terceiros na versão de extensão.

### Nota importante

A extensão corre dentro de `claude.ai`, por isso deve ser tratada como código de confiança elevada. Instala apenas a partir do teu fork ou de builds que tenhas auditado.

---

## English

This fork is designed to stay small and auditable.

### What the extension reads

- Active conversation content on `claude.ai`, only to estimate tokens locally.
- The `lastActiveOrg` cookie, only to identify the active organization and query Claude's internal `/usage` endpoint.
- Usage data returned by `claude.ai` itself.

### What the extension stores

- Only the UI language preference when you manually choose a language.
- Key: `claude-counter-blackspirits-language`.
- Location: `localStorage` on `https://claude.ai` itself.
- If you choose `Auto`, the key is removed.

### What the extension does not do

- It does not send prompts, responses or conversations to external servers.
- It does not use analytics.
- It does not use `chrome.storage`.
- It does not keep usage history.
- It does not make third-party network requests in the extension build.

### Important note

The extension runs inside `claude.ai`, so treat it as high-trust code. Install only from your own fork or from builds you have audited.
