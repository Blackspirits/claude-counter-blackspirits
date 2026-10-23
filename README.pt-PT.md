# Claude Counter - BlackSpirits Edition

[English](README.md)

Um fork do [Claude Counter](https://github.com/she-llac/claude-counter) para `claude.ai`, com foco na privacidade. Mantém os créditos originais e a licença MIT.

**0.5.0-beta.3 — experimental, para testes antes de uma versão estável.**

## Funcionalidades

- Estimativa de tokens do texto visível no ramo atual da conversa.
- Utilização da sessão e utilização semanal global, com horas de reposição obtidas nos endpoints web do Claude.
- Estados visíveis de atualização, dados desatualizados, indisponibilidade e falta de acesso.
- Resumo compacto com minibarras, botão de detalhes, atualização e idioma acessíveis pelo teclado. As horas de reposição, o estado de atualização e o aviso de atualizações limitadas ficam nos detalhes; as falhas também são assinaladas no botão.
- Automático, português de Portugal, inglês, francês, espanhol, alemão e italiano.
- Tokenização local, sem análise de utilização, serviços externos ou histórico de conversas guardado.

A estimativa utiliza o tokenizador genérico `o200k_base`, não o tokenizador oficial do Claude. Exclui instruções ocultas e conteúdo não textual. A beta remove a barra de contexto fixada em 200 mil tokens e o temporizador de cache inferido, pois faltavam dados confirmados da conta e do modelo para os sustentar. Não mede o contexto restante nem deteta a compactação.

## Instalar a beta

Requer Chrome/Edge/Chromium 111 ou posterior. Firefox, Claude Desktop e Claude Code não foram validados.

1. Descarrega o artefacto `claude-counter-blackspirits-0.5.0-beta.3` de uma [execução do Actions](https://github.com/Blackspirits/claude-counter-blackspirits/actions) **concluída com sucesso**, ou cria o pacote localmente.
2. Extrai o ZIP para uma pasta permanente.
3. Abre `chrome://extensions` ou `edge://extensions` e ativa o **Modo de programador**.
4. Escolhe **Carregar expandida** e seleciona a pasta que contém `manifest.json`.
5. Recarrega `https://claude.ai`. Desativa outras instalações do Claude Counter durante o teste para evitar indicadores duplicados.

Para atualizar, substitui os ficheiros na mesma pasta, clica em Recarregar no cartão da extensão e recarrega o Claude. Não existe atualização automática nem painel no ícone da barra de ferramentas.

## Fiabilidade e limitações

- A utilização pertence à organização ativa. Mudar de organização ou terminar sessão limpa os dados anteriores.
- Atualizações SSE parciais preservam as restantes janelas; pedidos antigos não substituem valores mais recentes da mesma janela.
- A utilização é consultada a cada cinco minutos nos separadores visíveis. A reposição de uma janela pode antecipar uma consulta.
- As falhas adiam as novas tentativas entre um minuto e cerca de 30 minutos, com uma pequena variação aleatória. O erro HTTP 429 respeita `Retry-After`. Os erros HTTP 401/403 suspendem as tentativas automáticas; podes tentar manualmente após um minuto.
- As horas de reposição são apresentadas ao minuto, sem arredondamento para intervalos de cinco minutos. Os valores cuja janela terminou ficam assinalados como desatualizados.
- As atualizações Connect/protobuf **não são descodificadas**. A deteção apresenta um aviso; a consulta REST alternativa depende da disponibilidade dos endpoints internos do Claude.
- Mudanças no HTML podem impedir a inserção dos indicadores. Formatos desconhecidos mostram indisponibilidade, sem inventar um valor zero.
- Limites de processamento: 8 MiB por resposta observada, 10 mil mensagens, 250 mil carateres por mensagem contada e 2 milhões de carateres por cálculo. Acima destes limites, a estimativa fica indisponível.
- Os contadores não substituem a página de utilização do Claude. Os testes com dados sintéticos não confirmam os endpoints, limites ou disposição atuais de todas as contas reais.

## Idioma e privacidade

O seletor guarda apenas a preferência `claude-counter-blackspirits-language` no localStorage de `claude.ai`. Automático remove essa preferência. Se o armazenamento estiver bloqueado, a escolha mantém-se até recarregares a página.

A extensão funciona apenas em `https://claude.ai/*`, lê o cookie `lastActiveOrg` e faz pedidos GET com a sessão existente do Claude. O texto das conversas é processado localmente. Consulta [PRIVACY.md](PRIVACY.md) e [SECURITY.md](SECURITY.md).

## Desenvolvimento

Node.js 22 ou posterior:

```bash
npm ci --ignore-scripts
npm run validate
npm test
npm run package
npx playwright install chromium
npm run test:e2e
```

O comando `npm run package` cria `dist/claude-counter-blackspirits/`, pronta para instalação. O pacote contém apenas os recursos referenciados pelo manifesto, traduções e avisos de licença/privacidade. O Playwright é uma dependência de desenvolvimento e não acompanha a extensão.

O teste de navegador carrega a **extensão MV3 empacotada** num contexto persistente do Chromium, com uma página Claude sintética e respostas simuladas. Verifica o arranque, CSP restritiva, comunicação entre os contextos, utilização/tokens, pt-PT, ecrã estreito, navegação, mudança de organização e fim de sessão. Não utiliza uma conta Claude nem conversas reais.

Consulta [BETA_TESTING.md](BETA_TESTING.md) para os testes restantes numa conta real.

## Estrutura e licença

- `src/content/`: interface isolada, estado de utilização, localização e tokenização.
- `src/injected/`: observação inicial de fetch/history no contexto da página e pedidos GET limitados.
- `src/vendor/`: tokenizador incluído, com o aviso MIT existente.
- `tests/`: regressões e teste da extensão no Chromium.
- `userscript/`: referência histórica; excluída do pacote beta.

MIT. Consulta [LICENSE](LICENSE) e [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
