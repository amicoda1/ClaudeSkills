# Scripts do skill `pptx(Valmet)`

## Dependências
Instale localmente (no diretório do projeto ou em um ambiente Node dedicado):

```bash
npm install mustache js-yaml pptxgenjs playwright sharp
# playwright precisa baixar o Chromium
npx playwright install chromium
```

Requisitos de SO para o Playwright: `libnspr4`, `libnss3`, `libasound2`.

## `build-web.js`
Gera o deck web validado com o usuário.

```bash
node document-skills/pptx(Valmet)/scripts/build-web.js \
  --spec document-skills/pptx(Valmet)/examples/linear-regression.spec.yml \
  --out .local/out/decks/linear-regression \
  --force   # use --force para sobrescrever diretórios existentes
```

Saídas:
- `index.html` com visualizador + navegação.
- `slides/slideXX.html` (um arquivo por slide, usado na conversão).
- `assets/` com imagens copiadas do spec.
- `deck.json` (spec resolvido para auditoria).

Regras implementadas:
- Fonte e paleta Valmet (tokens em `theme/valmet.tokens.json`).
- Textos sempre em tags semânticas (`<p>`, `<ul>`, `<ol>`).
- Proíbe gradientes CSS (delegado ao template – mantenha rasterizado se necessário).

## `to-pptx.js`
Converte os HTML aprovados para PPTX (layout 16:9).

```bash
node document-skills/pptx(Valmet)/scripts/to-pptx.js \
    --slides .local/out/decks/linear-regression/slides \
    --out .local/out/presentation/linear-regression.pptx \
  --title "Linear Regression" \
  --author "Dani"
```

Para cada `slideXX.html`, o script executa `html2pptx` (Playwright + pptxgenjs) e bloqueia o processo se detectar overflows ou violações de layout.

## analyze-template.py *(opcional)
Wrapper Python para extrair inventário de placeholders do template PPTX oficial via `inventory.py`. Útil quando for necessário preencher diretamente o arquivo corporativo.

### Helpers já existentes
- `document-skills/pptx/scripts/replace.py`
- `document-skills/pptx/scripts/inventory.py`
- `document-skills/pptx/scripts/thumbnail.py`

## Fluxo completo
1. Validar conteúdo/número de slides com o usuário, escrever spec YAML/JSON.
2. `build-web.js` → revisar web deck com o usuário.
3. `to-pptx.js` → gerar PPTX final sem overflow.
4. (Opcional) `replace.py` para preencher template Valmet oficial.
