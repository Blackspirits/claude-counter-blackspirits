# Beta testing / Testar a beta

Version: **0.5.0-beta.2**. Status: candidate for live-account testing, not a stable release.

## Automated evidence

- `npm run validate`: manifest, paths, permissions, locales, syntax and documentation.
- `npm test`: deterministic regression tests for retry scheduling, organizations, out-of-order data, partial payloads, reset rollover, tokenizer failures, bridge filtering and localization.
- `npm run test:e2e`: real packaged extension in Chromium with mocked Claude pages/endpoints, including restrictive CSP. Check the corresponding Actions commit for its outcome.
- The package excludes development dependencies, tests, audit reports and the legacy userscript.

## BlackSpirits: primeira ação

Instala a beta numa janela normal do Chrome, recarrega o Claude e compara os valores de sessão/semanal com a página de utilização do próprio Claude. Não é necessário enviar conversas nem cookies para comunicar um problema.

| Teste na conta real | Resultado esperado |
| --- | --- |
| Página inicial e conversa existente | Indicadores colocados sem sobrepor o campo de escrita |
| Enviar uma mensagem e mudar de ramo | Estimativa atualizada quando chega uma árvore de conversa compatível; sem valores de outro ramo |
| Mudar de organização | Dados anteriores desaparecem; consulta da nova organização |
| Sessão terminada ou acesso recusado | Aviso visível, sem pedidos automáticos repetidos |
| Simular falha de rede | Aviso e tentativas espaçadas; atualização manual respeita a espera |
| Reposição da janela | Dados desatualizados assinalados até chegar uma nova resposta |
| Separador em segundo plano e regresso | Consulta pendente retomada, sem sequência rápida de pedidos |
| pt-PT, inglês e francês; tema claro/escuro | Texto legível, números localizados, seletor funcional |
| Janela estreita e navegação por Tab | Sem sobreposição; atualização e ajudas acessíveis |
| Conta com Connect/protobuf | Aviso de atualizações limitadas; verificar se a consulta REST continua disponível |

Regista navegador/versão, versão da extensão, página afetada e mensagem de erro. Remove dados privados de capturas e logs. Não partilhes cookies, cabeçalhos de autorização nem árvores completas de conversas.

## Before stable release

1. Complete the live-account checks above, particularly current DOM placement and endpoint compatibility.
2. Resolve failures and obtain review of the final diff; keep evidence tied to the tested commit.
3. Publish only a successful tested package with MIT notices and a clear changelog. Firefox and store publication need their own validation.

## Deferred work

Connect/protobuf decoding, verified model-specific context limits, official cache signals, worker-based tokenization for oversized conversations and multi-tab polling coordination remain future work. They are not claimed as supported in this beta. Retain the fork and attribution while evolving these independently testable modules.
