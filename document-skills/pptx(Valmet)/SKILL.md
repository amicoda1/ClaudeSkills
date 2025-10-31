---
name: "pptx(Valmet)"
description: "Workflow especializado para criar apresentações Valmet: web deck aprovado primeiro, depois conversão HTML→PPTX"
license: Proprietary. LICENSE.txt tem os termos completos
---

# Skill: pptx(Valmet)

Crie apresentações no padrão Valmet seguindo o fluxo validado:

1. **Alinhar com o usuário** o conteúdo principal, número de slides e objetivos antes de qualquer geração.
2. **Entregar uma versão web** responsiva em HTML/CSS/JS (fontes e cores Valmet) e solicitar aprovação.
3. **Converter o deck aprovado para PPTX** usando `html2pptx` + `pptxgenjs`, validando overflow/margens.

O skill encapsula tokens de marca, templates HTML e utilitários para automatizar esse fluxo sem exigir um número mínimo de slides – a spec define exatamente o que deve ser gerado.

## Estrutura
```
document-skills/pptx(Valmet)/
├── SKILL.md                    # este guia
├── theme/valmet.tokens.json    # cores, tipografia, espaçamentos padrão
├── templates/                  # blocos HTML reutilizáveis por tipo de slide
├── scripts/                    # utilidades (build web, conversão, QA)
└── examples/                   # specs de exemplo + assets de referência
```

## Tokens de Marca (theme/valmet.tokens.json)
- Fonte: `Arial` (títulos e corpo)
- Cores primárias: `#50B948` (green), `#96D591` (light green), `#4C4D4F` (charcoal), `#ECEDEF` (light gray), `#008ABA` (accent blue)
- Espaçamentos: usar `pt` compatível com PPTX (ex.: `36pt` margens internas)
- Raio padrão de cards: `24pt`

## Templates HTML
Cada arquivo em `templates/` é um slide 16:9 (720×405pt) com texto em `<p>/<h1-6>/<ul>/<ol>`. Substitua tokens `{{...}}` pelos dados da spec.

Exemplos incluídos:
- `cover.html`
- `agenda.html`
- `section.html`
- `two-column.html`
- `checklist.html`
- `qna.html`
- `example.html`
- `interpret.html`

> **Regra:** não insira texto direto em `<div>` / `<span>` (sempre envolver em elementos de texto). Evite `linear-gradient`; se precisar, rasterize previamente como imagem PNG.

## Scripts
- `scripts/build-web.js` → lê spec YAML/JSON, aplica templates Mustache e gera o web deck (index + `slides/slideXX.html` + assets + `deck.json`)
- `scripts/to-pptx.js` → converte os HTML aprovados para PPTX via `html2pptx` + `pptxgenjs`
- `scripts/analyze-template.py` *(opcional)* → wrappers Python para extrair inventário/rodapé ao usar template oficial
- Reutilize utilitários existentes: `document-skills/pptx/scripts/replace.py`, `thumbnail.py`, `inventory.py`

### Ferramentas necessárias
- Node 18+
- NPM packages: `mustache`, `js-yaml`, `pptxgenjs`, `playwright`, `sharp`
- Playwright Chromium: `npx playwright install chromium`
- Python 3.10+ com `markitdown[pptx]`, `python-pptx`, `defusedxml`
- Dependências de SO para Playwright: `libnspr4`, `libnss3`, `libasound2`

#### Setup (primeira vez em uma máquina nova)
- Se `node_modules/` já existir aqui, pode pular esta etapa.
- Caso contrário:
  ```bash
  cd document-skills/pptx(Valmet)
  npm run setup   # instala dependências e Chromium do Playwright
  ```
  Observação: o navegador do Playwright é baixado para o cache do usuário, não entra no repositório.

## Spec de Entrada (exemplo)
Veja `examples/linear-regression/spec.yml`:
```yaml
brand: valmet
layout: 16x9
output:
  web_dir: .local/out/decks/linear-regression
  pptx_file: .local/out/presentation/linear-regression.pptx
slides:
  - type: cover
    tagline: "Valmet Insights"
    title: "Linear Regression Made Simple"
    subtitle: "Understanding predictive lines with real-world examples"
  - type: agenda
    title: "What We'll Cover"
    items:
      - "Why linear regression matters"
      - "How the method works"
      - "Step-by-step example"
      - "Reading the results"
  # ... restante conforme necessidade do usuário
```

> Não existe quantidade mínima de slides. O spec deve refletir exatamente o combinado com o usuário.

## Fluxo operacional
1. **Descoberta/Validação**
   - Confirmar com o usuário títulos, tópicos, exemplos e volume de slides.
   - Escrever spec YAML/JSON e registrar em `.local/work/<projeto>/specs/`.
2. **Geração Web**
   - `node document-skills/pptx(Valmet)/scripts/build-web.js --spec path/to/spec.yml --out .local/out/decks/<nome> --force`
   - (Use `--force` para sobrescrever diretórios existentes.)
   - Revisar `index.html`, garantir estilos Valmet e solicitar aprovação do usuário.
3. **Conversão PPTX**
   - `node document-skills/pptx(Valmet)/scripts/to-pptx.js --slides .local/out/decks/<nome>/slides --out .local/out/presentation/<nome>.pptx`
   - Validar com `markitdown` ou abrir no PowerPoint.
4. **(Opcional) Template Oficial**
   - Se for obrigatório aplicar o `.pptx` corporativo, usar `replace.py` com JSON mapeando os placeholders do template base.

## QA Checklist
- [ ] Fonte em todo o deck = Arial
- [ ] Cores obedecem `theme/valmet.tokens.json`
- [ ] Slides ≤ 720×405 pt, sem overflow (mínimo 0,5" livre no rodapé)
- [ ] Bullets via `<ul>/<ol>` (sem símbolos manuais)
- [ ] Charts/gradientes rasterizados (*.png)
- [ ] Cores em `pptxgenjs` sem `#`

## Próximos passos sugeridos
1. Adicionar testes automatizados (por exemplo, Jest) garantindo ausência de overflow ou fontes incorretas.
2. Criar biblioteca de ícones rasterizados (SVG → PNG) para chips e elementos gráficos recorrentes.
3. Incluir novos layouts (timeline, comparativos 3 colunas) conforme demandas futuras.

Mantenha evolução incremental – valide com o usuário cada etapa antes de gerar artefatos finais.
