# Userscript legacy

A versão userscript continua incluída por compatibilidade, mas não é a versão recomendada da BlackSpirits Edition.

## Porque não é a recomendada

- Carrega o tokenizer via `@require` externo.
- Não inclui todas as melhorias da versão de extensão.
- É mais difícil de auditar do que a extensão com tokenizer local.

## Recomendação

Usa a extensão em `Load unpacked` para teste local e desenvolvimento.
