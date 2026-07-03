# Deploy

Deploy de producao e bloqueado por padrao.

Para executar:

1. Preencher secrets no ambiente correto.
2. Rodar `npm run check:env`.
3. Rodar `npm run check:secrets`.
4. Rodar `npm run build`.
5. Definir `CONFIRM_PRODUCTION_DEPLOY=yes`.
6. Rodar `npm run deploy:production`.
