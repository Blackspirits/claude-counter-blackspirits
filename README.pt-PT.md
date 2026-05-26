# Claude Counter - BlackSpirits Edition

[English](README.md)

Fork do [Claude Counter](https://github.com/she-llac/claude-counter), focado em privacidade, para `claude.ai` no navegador.

Adiciona indicadores leves de contexto e utilização diretamente na interface web do Claude, mantendo a extensão pequena, local e fácil de auditar.

> Créditos originais e licença MIT mantidos.

## Funcionalidades

- **Contador aproximado de tokens** da conversa atual.
- **Barra de contexto** com referência ao limite de 200k tokens.
- **Temporizador de cache** da conversa ativa.
- **Utilização da sessão de 5 horas** com hora de reposição e contagem decrescente.
- **Utilização semanal** com hora de reposição e contagem decrescente.
- **Interface multilingue**: Automático, Português (Portugal), Inglês, Francês, Espanhol, Alemão e Italiano.
- **Botão compacto de idioma** após seleção (`AUTO`, `PT`, `EN`, `FR`, etc.).
- **Otimização em separadores ocultos** para evitar trabalho desnecessário em segundo plano.
- **Atualização por teclado** na linha de utilização.
- **Sem analytics, sem pedidos a terceiros, sem `chrome.storage`** na versão de extensão.

## O que mudou nesta fork

Esta edição BlackSpirits mantém a ideia original, mas reforça e moderniza a implementação:

- namespace interno isolado para reduzir risco de colisão com a extensão original;
- validação mais apertada de origem no `postMessage`;
- URLs internas do Claude usam IDs de organização/conversa codificados;
- dados de utilização não são aplicados se a organização ativa mudar durante um pedido;
- hashing de conversa/tokens fica no content script isolado;
- melhor extração de texto de payloads de ferramentas e pesquisa web;
- documentação de privacidade, segurança e auditoria mais clara;
- validação básica e workflow de GitHub Actions.

## Instalação

### Chrome / Edge / Chromium

1. Descarrega o ZIP da release.
2. Extrai para uma pasta fixa, por exemplo:

   ```text
   C:\Tools\claude-counter-blackspirits
   ```

3. Abre:

   ```text
   chrome://extensions
   ```

4. Ativa o **Modo de programador**.
5. Clica em **Carregar sem compactação**.
6. Escolhe a pasta onde está o `manifest.json`.
7. Recarrega `https://claude.ai`.

Não apagues a pasta depois. O Chromium lê a extensão diretamente dessa pasta.

## Utilização recomendada

Usa os contadores como indicador prático, não como fonte oficial dos limites do Claude.

Os dados de utilização vêm da própria sessão web do Claude, mas a contagem de tokens continua a ser aproximada. Para limites importantes, compara com o painel nativo de utilização do Claude.

## Seleção de idioma

A interface injetada inclui um pequeno seletor de idioma. Depois de escolheres um idioma, recolhe para um botão compacto:

```text
AUTO / PT / EN / FR / ES / DE / IT
```

Clica no botão para abrir novamente o seletor.

O idioma escolhido fica guardado localmente em `https://claude.ai`:

```text
claude-counter-blackspirits-language
```

Ao escolher `Automático`, essa chave é removida.

## Privacidade

A versão de extensão:

- corre apenas em `https://claude.ai/*`;
- não envia prompts, respostas ou conversas para servidores externos;
- não usa analytics;
- não usa `chrome.storage`;
- não guarda histórico local de utilização;
- usa `localStorage` apenas para a preferência opcional de idioma;
- faz pedidos apenas a `claude.ai`, usando a sessão já ativa no navegador.

Consulta [PRIVACY.md](PRIVACY.md) para mais detalhes.

## Limitações conhecidas

- A contagem de tokens é estimada, não é a contagem oficial do Claude.
- Pesquisa web, ficheiros, imagens e outputs de ferramentas ainda podem ficar subcontados.
- Depois de compactação de contexto, a barra de tokens pode deixar de representar o contexto efetivo completo.
- A extensão foi pensada para `claude.ai` no navegador.
- Claude Desktop, Claude Code no terminal e `claude.ai/code` não são oficialmente suportados.
- Alterações na UI ou nos endpoints internos do Claude podem partir seletores ou pressupostos internos.

## Desenvolvimento

Valida a extensão antes de fazer commit:

```bash
npm run validate
```

A validação verifica:

- estrutura do manifesto e alinhamento de versões;
- origens permitidas e ausência de permissões extra;
- ficheiros de idioma;
- sintaxe JavaScript;
- isolamento do bridge;
- separação da documentação em inglês e pt-PT.

## Estrutura do projeto

```text
src/content/        Content scripts isolados e lógica da UI
src/injected/       Bridge em contexto de página para observar eventos de rede do Claude
src/vendor/         Tokenizer incluído localmente
_locales/           Traduções do manifesto da extensão
.github/workflows/  Workflow de validação
```

## Estado do userscript

A versão userscript fica apenas como referência legacy.

Para utilização normal, instala a extensão. A extensão inclui o tokenizer localmente e é mais fácil de auditar.

## Segurança

Trata isto como código de confiança elevada: corre dentro de `claude.ai` e consegue ler dados da página nessa origem.

Revê pelo menos estes ficheiros antes de distribuíres uma build:

- `manifest.json`
- `src/injected/bridge.js`
- `src/content/bridge-client.js`
- `src/content/tokens.js`
- `src/content/main.js`

Consulta [SECURITY.md](SECURITY.md).

## Licença

MIT. Os créditos originais do Claude Counter são mantidos.
