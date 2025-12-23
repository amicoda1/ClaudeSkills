# AGENTS.md — ClaudeSkills (Guia para Coding Agents)

Escopo: todo este repositório local (`ClaudeSkills`).

Objetivo: usar os skills deste repositório com qualquer Coding Agent (Codex, Claude Code, Gemini, Antigravity, etc.) de forma genérica (documentos, apresentações, planilhas, PDFs, automações etc.) sem modificar arquivos versionados. Todo artefato local deve ir para `.local/`.

Princípios de operação

1) Não editar arquivos rastreados pelo git neste repositório. Criar e modificar apenas em `.local/`.
2) Detectar o skill a partir do pedido do usuário e do conteúdo dos diretórios deste repo (ex.: pastas com `SKILL.md`/`README.md`).
3) Seguir as instruções do skill correspondente; quando faltar um “runner” explícito, criar adaptadores locais em `.local/` para executar a tarefa.
4) Confirmar sempre um rascunho/escopo com o usuário antes de gerar o artefato final.
5) Usar PT‑BR claro e validar números, unidades e formatação.

Estrutura de trabalho local

- `.local/work/<skill>/specs/` — especificações (YAML/JSON/Markdown) criadas no fluxo.
- `.local/out/<skill>/` — saídas/artefatos gerados (ex.: `.docx`, `.pptx`, `.xlsx`, `.pdf`).
- `.local/tools/<skill>/` — scripts utilitários locais (quando necessário). Evitar dependências globais.
- `.local/.venv/` — ambiente Python opcional para dependências por tarefa.

Descoberta e uso de skills

1) Identificar skill: analisar o pedido e localizar o diretório mais relevante neste repo (ex.: `document-skills`, `presentation`, `excel`, `pdf`, `webapp-testing`, etc.). Ler `SKILL.md`/`README.md` do skill.
2) Planejar com o usuário: propor objetivos, sumário/estrutura e escopo mínimo viável.
3) Preparar insumos: criar uma especificação simples no formato sugerido pelo skill; quando não houver formato padrão, usar YAML/JSON simples com campos autoexplicativos.
4) Executar:
   - Se o skill fornecer scripts/comandos, segui‑los e registrar os comandos usados.
   - Se não houver runner, implementar um adaptador local em `.local/tools/<skill>/` e usar bibliotecas adequadas (ex.: `python-docx`, `python-pptx`, `openpyxl`, `reportlab`), instaladas no venv local.
5) Entregar: salvar em `.local/out/<skill>/`, informar o caminho absoluto e oferecer ajustes.

Ambiente e dependências

- Criar venv quando necessário:
  - `python -m venv .local/.venv`
  - `.local\\.venv\\Scripts\\activate`
- Instalar só o que for preciso para o skill em execução (ex.: `pip install python-docx`, `python-pptx`, `openpyxl`, `PyYAML`, `reportlab`).
- Registrar no chat quais pacotes foram instalados e para qual finalidade.

Padrões por tipo de artefato (diretrizes gerais)

- Documentos (.docx/.pdf): confirmar títulos, hierarquia de seções, cabeçalho/rodapé, margens e idioma. Validar quebras de página e listas. 
- Apresentações (.pptx): confirmar tema, paleta, tipografia e estrutura de slides; gerar slides com títulos claros e bullets curtos.
- Planilhas (.xlsx): confirmar abas, colunas, formatos de número e validações; gerar fórmulas apenas quando solicitado; documentar suposições.
- Outros skills: seguir o `SKILL.md` específico e manter entradas/saídas em `.local/work/` e `.local/out/`.

Boas práticas

- Sempre validar a especificação (YAML/JSON) com o usuário antes de gerar.
- Não armazenar dados sensíveis no repositório rastreado; usar somente `.local/`.
- Descrever rapidamente no chat o que foi feito (rascunho → spec → geração → caminho do artefato).

Observação

`AGENTS.md` e `.local/` devem permanecer fora de commits. O ignore local já foi configurado em `.git/info/exclude`.

Como usar no seu Coding Agent (setup local)

1) Mantenha este `AGENTS.md` versionado na raiz. Ele garante que o agente leia as instruções corretas ao abrir o repositório.
2) Execute `scripts\setup-local.ps1` em cada máquina para preparar a estrutura `.local/work` e `.local/out`. Use `-SetupDocTools` se quiser provisionar `.local\.venv` com bibliotecas para documentos, apresentações, planilhas e PDFs.
3) Armazene specs em `.local/work/<skill>/specs/` e artefatos finais em `.local/out/<skill>/`. Essas pastas já estão listadas em `.gitignore` para evitar commits acidentais.
4) Scripts auxiliares específicos podem ficar em `.local/tools/<skill>/`. Documente no chat quais pacotes foram instalados e para quê.
5) Ao receber um pedido no Agent, identifique o skill adequado, valide escopo com o usuário e siga o `SKILL.md`/`README.md` correspondente antes da geração do arquivo.
