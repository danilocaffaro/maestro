# UX Vision -- Agent Orchestrator

**Autor:** Kai (Designer UI/UX)
**Data:** 2026-04-12
**Versao analisada:** v0.2

---

## 1. Avaliacao do UX Atual

### 1.1 Arquitetura da Interface

O Agent Orchestrator v0.2 e uma aplicacao Next.js 16 com layout de dois paineis:

```
+-------------------+----------------------------------------------------+
|   Sidebar (272px) |  AgentFlowDiagram (Cytoscape, 220px fixo)          |
|                   +----------------------------------------------------+
|  - Teams list     |  [Tabs: Em Execucao | Chat | Chat Agentes | Tasks  |
|  - Agent filter   |         | Outputs]                                  |
|  - Create form    |                                                     |
|  - Msg input      |  <LiveOutput | MessageFeed | TaskList>              |
|                   +----------------------------------------------------+
|                   |  Status bar (conexao, time, agentes ativos, v0.2)   |
+-------------------+----------------------------------------------------+
```

Stack: React 19, Tailwind 4, shadcn/ui (base-nova), Cytoscape.js, SSE streaming, sonner toasts.

### 1.2 Pontos Fortes (Manter e Ampliar)

1. **Visualizacao P2P em tempo real (Cytoscape)**: O diagrama de nos com animacao de edges ao trocar mensagens e uma affordance poderosa. Status por cores (idle=cinza, working=verde, thinking=amarelo, error=vermelho, done=azul) oferece feedback visual imediato. Edges ganham classe "active" por 1.5s ao receber mensagem nova -- excelente.

2. **Streaming SSE robusto**: Arquitetura de `EventSource` com `eventBus` (TypedEventBus) + `stream-parser` bem implementada. Reconexao automatica, deduplicacao de mensagens por ID, keepalive a cada 15s, e carregamento de dados historicos via `fetch` antes de acoplar o SSE (`useTeamStream`). Padrao correto.

3. **Separacao taxonomica nas abas**: Dividir "Em Execucao" (output tecnico dos agentes), "Chat" (interacao usuario-time), "Chat Agentes" (P2P entre agentes), "Tasks" (progresso), e "Outputs" (artefatos) mostra uma taxonomia pensada que evita um feed unico poluido. Os contadores em cada aba sao uteis.

4. **Filtragem por agente na sidebar**: Clicar em um agente na sidebar filtra toda a interface. O badge "selectedAgentFilter" com "x" para limpar e intuitivo. O visual muda (ring-1 ring-primary/20) indicando filtro ativo. A label no input de mensagem muda de "Mensagem ao time" para "Mensagem para [Agente]".

5. **Theme system sem FOUC**: Script inline no `<head>` aplica dark class antes do paint. Toggle de 3 estados (light/dark/system) com persistencia em localStorage. Paleta OKLCH bem calibrada com inspiracao Anthropic/Material.

6. **Densidade informacional controlada**: Fontes de 9-12px, timestamps no hover (opacity-0 -> group-hover:opacity-100), badges ultra-compactos (h-3.5 px-1 text-[9px]), scroll areas contidas. Denso mas legivel.

7. **Criacao de time flexivel**: Formulario inline com agentes customizaveis (nome, role, modelo por agente), 3 agentes default (Pesquisador/Desenvolvedor/Revisor), task textual livre.

8. **Color coding consistente no MessageFeed**: Paleta rotativa por agente (blue, emerald, amber, purple, pink, cyan) com Record<string, string> para persistencia da cor.

### 1.3 Problemas de Usabilidade (Criticos)

| # | Problema | Causa Raiz | Impacto |
|---|----------|------------|---------|
| 1 | **Sidebar sobrecarregada** | Sidebar de 272px acumula navegacao, criacao de time (formulario complexo com N agentes), lista hierarquica, E input de mensagens em um unico componente (Sidebar.tsx com 295 linhas) | Formulario de criacao empurra lista e input. Em times com 5+ agentes, precisa scrollar muito. |
| 2 | **Diagrama P2P passivo** | `userZoomingEnabled: false`, `userPanningEnabled: false`, `autoungrabify: true`. Nenhum handler de clique nos nos. | 220px desperdicados em visualizacao que nao permite interacao. Clicar em um no deveria filtrar; hover deveria mostrar detalhes. |
| 3 | **5 tabs fragmentam atencao** | Modelo mental exige alternar entre abas constantemente. "Em Execucao" e "Chat" sao ambos LiveOutput -- mesma UI, dados diferentes. | Usuario perde contexto ao alternar. Nao pode ver tasks e execucao simultaneamente. |
| 4 | **Outputs com heuristica fragil** | Deteccao via `includes(".md") \|\| includes(".ts") \|\| includes("http") \|\| includes("criado") \|\| includes("salvo") \|\| includes("escrev")` | Falsos positivos (qualquer mensagem mencionando arquivo) e negativos (artefatos sem essas palavras). |
| 5 | **Sem persistencia** | `teamStore` usa `Map()` in-memory. Reload = perda total. | Zero historico, zero replay, zero confiabilidade. |
| 6 | **Mensagem unidirecional** | `sendMessage()` so emite AgentMessage no feed -- nao envia stdin para os processos `claude` rodando. | Usuario pensa que esta falando com agentes, mas a mensagem nunca chega. |
| 7 | **Sem metricas de custo** | `maxBudget` existe no tipo TeamConfig mas nao e implementado. Stream nao extrai token counts. | Impossivel saber custo, otimizar, ou comparar runs. |
| 8 | **Sem onboarding** | Empty state e apenas "Nenhum time criado. Clique em + para comecar." | Novo usuario nao sabe o que sao agentes, times, ou como comecar. |
| 9 | **Tasks inferidas, nao gerenciadas** | `stream-parser` detecta `TodoWrite` calls mas usuario nao pode criar/editar tasks. | Progresso e read-only e incompleto. |
| 10 | **Sem responsividade** | Layout fixo `w-72`, `h-[220px]`, sem breakpoints. | Inutilizavel em telas < 1200px ou mobile. |

### 1.4 Gaps de Funcionalidade

| Gap | Descricao | Prioridade |
|-----|-----------|------------|
| Persistencia de sessoes | Dados perdem ao recarregar | P0 |
| Artefact preview | Arquivos criados nao sao visualizados na UI | P0 |
| Comunicacao bidirecional | Mensagens nao chegam aos agentes | P0 |
| Cost tracking | Sem contagem de tokens ou custos | P1 |
| Templates de time | Cada criacao parte do zero | P1 |
| Sistema de checkpoints | Agentes rodam sem gates de aprovacao | P1 |
| Historico de runs | Sem replay ou audit trail | P1 |
| Autenticacao | Sem multi-usuario | P2 |
| Integracao VCS | Sem git status, diff, ou PR | P2 |
| Notificacoes | Sem push quando agente precisa de input | P2 |

---

## 2. Personas Principais

### Persona 1: Dev Lead ("Caio")

- **Perfil**: Engenheiro senior liderando projeto. Quer delegar tarefas paralelas (pesquisa, coding, review) e manter visibilidade.
- **Necessidade principal**: Dashboard de progresso em tempo real, controle de custo, capacidade de intervir.
- **Frustracao**: "Lancei 3 agentes e nao sei se estao travados ou trabalhando. Quanto ja gastei? Posso redirecionar o pesquisador?"
- **Metrica de sucesso**: Tempo economizado vs. fazer sozinho; qualidade do output final comparavel a trabalho manual.
- **Cenario tipico**: Cria time com Opus para pesquisa, Sonnet para dev, Haiku para review. Monitora por 15min. Intervem quando pesquisador desvia do escopo. Coleta artefatos e abre PR.

### Persona 2: Arquiteta de AI ("Luna")

- **Perfil**: Especialista em prompts e orquestracao. Experimenta configuracoes de times, modelos, e system prompts.
- **Necessidade principal**: Templates reutilizaveis, comparacao A/B entre runs, historico de experimentos.
- **Frustracao**: "Criei um time com Opus para pesquisa e Haiku para triage mas perdi a config quando fechei o browser. Quero comparar 3 variacoes."
- **Metrica de sucesso**: Capacidade de iterar rapidamente, reproduzir resultados, comparar custo/qualidade entre configs.
- **Cenario tipico**: Salva template "Research Team v3", roda 2 variacoes (Opus vs Sonnet no pesquisador), compara outputs e custo side-by-side, escolhe a melhor config.

### Persona 3: Product Manager ("Rafa")

- **Perfil**: Nao-tecnico que quer usar agentes para gerar specs, pesquisa de mercado, analise competitiva.
- **Necessidade principal**: Templates prontos, linguagem acessivel, outputs renderizados (Markdown, nao raw JSON).
- **Frustracao**: "Vejo um monte de JSON e tool_use no feed. Onde esta o resultado final? Por que preciso configurar 'model: claude-sonnet-4-6'?"
- **Metrica de sucesso**: Obter entregavel util em <5 minutos sem conhecimento tecnico.
- **Cenario tipico**: Abre o app, seleciona template "Research Team", descreve "Analisar concorrentes do produto X", aguarda, recebe documento Markdown renderizado com pesquisa completa.

---

## 3. Happy Path End-Game (Step by Step)

### Fluxo: "Caio implementa feature com time de 3 agentes"

**Passo 1 -- Dashboard**
Caio abre o app. Ve dashboard com: runs recentes (ultima: "OAuth2 Auth", ontem, $3.20, 4 artefatos), templates salvos (estrela no "Dev Team"), e resumo de uso do mes ($47.30 / $100 budget).

**Passo 2 -- Selecionar Template**
Clica em "Dev Team (3 agents)" na galeria. Ve descricao: "Pesquisador + Desenvolvedor + Revisor. Estimativa: 10-20min, $2-5." Card mostra rating medio (4.2/5 de runs anteriores).

**Passo 3 -- Customizar**
Modal de criacao abre com agentes pre-configurados. Ajusta: Opus para pesquisa (profundidade), Sonnet para dev (custo-beneficio), Haiku para review (velocidade). Cola task: "Implementar autenticacao OAuth2 com Google no projeto ~/Projects/myapp".

**Passo 4 -- Definir Guardrails**
Seta budget maximo ($5), timeout (30min). Habilita "Checkpoint antes de escrever arquivos" para o Desenvolvedor. Habilita "Notificar quando concluido" para receber push.

**Passo 5 -- Lancar Time**
Clica "Iniciar". Canvas central mostra 3 nos com animacao de spin-up (thinking -> working). Status bar mostra "$0.00 / $5.00" e "0/0 tasks".

**Passo 6 -- Monitorar em Tempo Real**
Canvas mostra agentes comunicando (edges pulsando). Painel inferior mostra timeline unificada com filtros. Caio ve:
- 14:32 [Pesquisador] Pesquisando melhores praticas OAuth2 com Google
- 14:33 [Pesquisador] [Read] oauth-patterns.md (clicavel para expandir)
- 14:35 [Desenvolvedor] Implementando fluxo principal
- 14:36 [Desenvolvedor] [Write] src/auth.ts (clicavel para preview)

Sidebar mostra tasks se movendo: "Pesquisar padroes" (done) -> "Implementar auth" (in_progress) -> "Revisar codigo" (pending).

Cost ticker: "$1.47 / $5.00" atualizado em tempo real.

**Passo 7 -- Checkpoint (Human-in-the-Loop)**
O Desenvolvedor quer criar 3 arquivos. Banner proeminente aparece no topo:

```
[!] Checkpoint: Desenvolvedor quer criar 3 arquivos
    auth.ts  |  middleware.ts  |  types.ts
    [Ver Preview]  [Aprovar Todos]  [Rejeitar]
```

Caio clica "Ver Preview", ve diff de cada arquivo, aprova.

**Passo 8 -- Resultado Final**
Agentes finalizam. Summary Panel automatico aparece:
- Resumo executivo: "Autenticacao OAuth2 com Google implementada. 3 arquivos criados, 1 middleware, 1 type definition."
- Artefatos: lista clicavel com preview inline (Markdown renderizado, codigo com syntax highlight)
- Metricas: 12min, $2.30, 3 arquivos, 247 linhas de codigo
- Acoes: [Abrir PR] [Exportar] [Salvar Template] [Rodar Novamente]

**Passo 9 -- Persistir e Iterar**
Run salva automaticamente no historico. Caio marca template como favorito. Na proxima vez, "Dev Team" ja aparece no topo da galeria com "Ultimo uso: hoje, $2.30".

---

## 4. 5 Features de UX Diferenciadores

### 4.1 Agent Canvas Interativo

Substitui o diagrama Cytoscape passivo por canvas interativo (React Flow / XYFlow):

- **Nos draggable** com card expandivel: nome, role, modelo, status, task atual, tokens consumidos
- **Edges animados** com particulas se movendo na direcao da mensagem em transito
- **Clicar em no** filtra toda a interface para aquele agente (integra com selectedAgentFilter existente)
- **Clicar em edge** abre painel com historico de conversas P2P entre os dois agentes
- **Hover em no** mostra tooltip com: ultimo output (primeiras 3 linhas), task atual, custo acumulado
- **Zoom semantico**: zoom out = visao macro (nos como dots com status cor), zoom in = cards expandidos com detalhes
- **Minimap** no canto para times grandes (5+ agentes)
- **Layout automatico** que se adapta ao numero de agentes (circular para 3-5, force-directed para 6+)

**Diferencial competitivo**: Nenhuma plataforma de orquestracao (CrewAI, AutoGen, LangGraph) oferece canvas interativo em tempo real com zoom semantico.

### 4.2 Timeline Unificada com Filtragem Multi-Dimensional

Substitui as 5 abas por timeline unica com filtros combinaveis:

- **Filter chips combinaveis**: por agente (multi-select), por tipo (texto/tool/result/P2P), por topico (auto-classificado via heuristica)
- **Slider de detalhe**: "Summary <-> Detail". Summary mostra 1 linha por acao ("Pesquisador leu auth.ts"); Detail mostra output completo
- **Collapse inteligente**: tool_use + tool_result colapsados em "[Agente] usou [Read] em auth.ts -- Resultado: 247 linhas" (clicavel para expandir)
- **Busca full-text** com highlight amarelo nos resultados
- **Bookmarks**: marcar momentos importantes (estrela) para revisao posterior
- **Branching visual**: quando agentes trabalham em paralelo, timeline mostra "lanes" por agente (como git log --graph)

**Diferencial competitivo**: Elimina tab-switching. O modelo mental do usuario e uma unica linha do tempo, nao 5 feeds separados.

### 4.3 Cost Intelligence Dashboard

Painel dedicado (acessivel via header) de metricas financeiras e performance:

- **Ticker em tempo real** no header: "$2.47 / $5.00" sempre visivel, cores mudam (verde < 50%, amarelo 50-80%, vermelho > 80%)
- **Breakdown por agente**: pie chart mostrando proporcao de custo (Pesquisador: $1.20, Desenvolvedor: $0.87, Revisor: $0.40)
- **Burn-rate graph**: tokens/min por agente ao longo do tempo (sparkline)
- **Alertas inteligentes**: Warning visual a 80% do budget, auto-pause a 100% com dialogo "Budget atingido. Continuar? [+$2] [Parar]"
- **Comparacao entre runs**: tabela com colunas: run, template, custo, tempo, artefatos, rating
- **Recomendacao de modelo**: "Revisor usou Opus ($1.20) mas analise sugere Haiku ($0.12) para qualidade similar nesta task"

**Diferencial competitivo**: Nenhuma ferramenta de orquestracao oferece cost intelligence. Isso transforma gasto em investimento otimizavel.

### 4.4 Artefact Gallery com Preview Rico

Painel dedicado para outputs concretos dos agentes (substitui tab "Outputs"):

- **File tree** mostrando artefatos organizados por agente e por tipo (docs, codigo, configs)
- **Preview inline**: Markdown renderizado (react-markdown + rehype), codigo com syntax highlight (Shiki), diff viewer (side-by-side ou unified) para edicoes
- **Metadados por artefato**: gerado por qual agente, quando, tamanho, se foi editado por outro agente
- **Acoes por artefato**: [Copiar] [Baixar] [Abrir no editor] [Ver diff] [Accept/Reject]
- **Export em lote**: baixar todos artefatos como .zip, ou exportar summary como .pdf
- **Versionamento**: se agente edita arquivo existente, mostra historico de versoes com diff entre elas

**Diferencial competitivo**: O "produto final" dos agentes (arquivos, documentos, codigo) e tratado como entidade de primeira classe, nao como linha perdida num log.

### 4.5 Template Marketplace e Smart Onboarding

Sistema que elimina a barreira de entrada e permite reutilizacao:

- **Smart Onboarding**: tela inicial com prompt "O que voce quer construir hoje?" -> usuario descreve em linguagem natural -> sistema sugere template e configuracao de time
- **Templates built-in curados**: "Code Review Team" (3 agentes, ~$1), "Research Team" (2 agentes, ~$2), "Full-Stack Feature Team" (4 agentes, ~$5), "Content Writing Team" (3 agentes, ~$1.50)
- **Cada template inclui**: agentes pre-configurados com system prompts otimizados, modelo recomendado por agente, estimativa de custo e tempo, exemplo de output
- **Fork e customize**: clonar template, ajustar agentes/modelos, salvar como novo template
- **Historico por template**: todas as runs de um template, metricas agregadas (custo medio, tempo medio, rating medio)
- **Import/export JSON**: compartilhar templates entre usuarios/equipes
- **Rating e feedback**: apos cada run, "Este resultado foi util?" (thumbs up/down) alimenta metricas do template

**Diferencial competitivo**: Transforma "o que eu faco com isso?" em "vou tentar esse template agora". Time-to-value de minutos em vez de meia hora.

---

## 5. Wireframe Conceitual -- Tela Principal (End-Game)

### 5.1 Tela Principal (Time Ativo)

```
+----------------------------------------------------------------------+
|  [*] Agent Orchestrator     [Search...]    [$2.47/$5]  [Luna] [=]    |
+----------+-------------------------------------------+---------------+
|          |                                           |               |
| SIDEBAR  |         AGENT CANVAS (expansivel)         | CONTEXT PANEL |
| 260px    |                                           |    280px      |
| (colapse)|    +------+         +------+              |               |
|          |    | Pesq |---msg-->| Dev  |              | AGENTE: Pesq  |
| TIMES    |    |  *   |         |  o   |              | Status: work  |
| -------  |    +------+         +------+              | Model: Opus   |
| > Alpha  |         \             /                   | Cost: $1.20   |
|   o Pesq |          +---bcast---+                    | Task: "Pesq   |
|   o Dev  |         /             \                   |  OAuth2..."   |
|   o Rev  |    +------+         +------+              |               |
| > Beta   |    | Rev  |         |[mini]|              | TIMELINE      |
|          |    |  -   |         | map  |              | 14:42 Read..  |
| TEMPLATES|    +------+         +------+              | 14:41 Write.. |
| -------  |                                           | 14:39 Search. |
| Code Rev |   [zoom: macro <--slider--> detail]       | 14:35 Start   |
| Research |                                           |               |
| Feature  +-------------------------------------------+               |
|          |                                           |               |
| +Novo    |   TIMELINE UNIFICADA                      |               |
|          |   +---------------------------------------+               |
| -------- |   | [Pesq] [Dev] [Rev]  [Summary<->Detail]|               |
| MESSAGE  |   |                                       |               |
| [Falar   |   | 14:32 Pesq  Pesquisando OAuth2...     |               |
|  com o   |   | 14:33 Pesq  [Read] auth.md (expand)   |               |
|  time..] |   | 14:35 Dev   Implementando fluxo...    |               |
|          |   | 14:36 Dev   [Write] auth.ts [Preview]  |               |
| [Enviar] |   |                                       |               |
|          |   | >> CHECKPOINT: Dev quer criar 3 files  |               |
|          |   |    [Ver diff] [Aprovar] [Rejeitar]     |               |
+----------+-------------------------------------------+---------------+
| * Conectado | Alpha - running | 3/5 tasks | $2.47/$5 | 12min | v1.0 |
+----------------------------------------------------------------------+
```

### 5.2 Descricao dos Elementos

**Header (48px)**:
- Logo e nome do produto (esquerda)
- Barra de busca global -- busca em mensagens, artefatos, templates
- Cost ticker sempre visivel -- cor muda conforme proporcao gasta
- Avatar do usuario e menu de configuracoes

**Sidebar (260px, colapsavel para 48px de icones)**:
- Secao "Teams": lista de times com dot de status, expandivel para agentes individuais
- Secao "Templates": galeria de templates salvos com badge de uso
- Botao "+ Novo Time": abre MODAL (nao inline) de criacao com wizard step-by-step
- Secao "Message": input fixo no fundo, com seletor de destinatario (@ Todos, @ agente especifico)

**Agent Canvas (area central superior, 40-60% altura, resizavel)**:
- Nos representando agentes com: nome, status (cor + tamanho), task atual (tooltip)
- Edges animados com particulas na direcao da comunicacao
- Minimap no canto inferior esquerdo para times grandes
- Slider de zoom semantico: macro (dots) <-> detail (cards expandidos)
- Clicar em no: popula Context Panel com detalhes + filtra Timeline
- Clicar em edge: mostra historico P2P entre os dois agentes

**Timeline Panel (area central inferior, resizavel)**:
- Timeline cronologica unificada substituindo as 5 abas
- Filter chips no topo: toggle por agente, slider Summary/Detail
- Cada entrada: timestamp, agente (cor), conteudo (colapsavel)
- Tool actions colapsadas: "[Agente] usou [Tool] em [target]" (clicavel)
- Checkpoints aparecem como banners com acoes (aprovar/rejeitar/ver diff)
- Busca full-text com highlight

**Context Panel (coluna direita, 280px, colapsavel)**:
- Card do agente selecionado: avatar, nome, role, modelo, status, custo
- Mini-timeline do agente: ultimas acoes em lista compacta
- Artefatos gerados por este agente (links para Artefact Gallery)
- Aparece quando usuario clica em agente (no canvas ou sidebar)

**Status Bar (32px)**:
- Indicador de conexao SSE (dot verde/cinza)
- Nome e status do time ativo
- Progresso de tasks (N/M com mini progress bar)
- Cost ticker (custo / budget)
- Tempo decorrido desde inicio da run

### 5.3 Tela de Boas-Vindas (Empty State)

```
+----------------------------------------------------------------------+
|  [*] Agent Orchestrator                              [Luna] [=]      |
|                                                                      |
|                                                                      |
|              O que voce quer construir hoje?                          |
|                                                                      |
|         +--------------------------------------------+               |
|         | Pesquise concorrentes e crie uma estrategia |               |
|         | de produto para nosso SaaS B2B...           |               |
|         +--------------------------------------------+               |
|                    [Criar Time com IA]                                |
|                                                                      |
|                                                                      |
|         Ou escolha um template:                                      |
|                                                                      |
|   +----------------+  +----------------+  +----------------+         |
|   |  Research Team  |  |  Dev Team      |  |  Content Team  |         |
|   |  2 agentes      |  |  3 agentes     |  |  3 agentes     |         |
|   |  ~$2, ~10min    |  |  ~$4, ~15min   |  |  ~$1.50, ~8min |         |
|   |  [Usar]         |  |  [Usar]        |  |  [Usar]        |         |
|   +----------------+  +----------------+  +----------------+         |
|                                                                      |
|                                                                      |
|         Runs recentes:                                               |
|         14:20 "OAuth2 Feature" - $3.20, 4 artefatos  [Reabrir]      |
|         09:15 "Competitor Analysis" - $1.80, 2 docs   [Reabrir]     |
|                                                                      |
+----------------------------------------------------------------------+
```

---

## 6. Principios de Design

### P1: Observabilidade Sem Friccao
O usuario deve entender o que esta acontecendo sem precisar clicar em nada. Status visual (cores, animacoes, indicadores) comunica o estado do sistema instantaneamente. A interface e "glanceable" -- um olhar rapido e voce sabe o que cada agente esta fazendo, quanto custou ate agora, e se algo precisa de atencao.

### P2: Progressive Disclosure
Mostrar o nivel certo de detalhe para o momento certo. Visao macro por padrao (status, progresso, custo). Detalhes sob demanda (clicar para expandir, zoom para detalhes, filtrar para focar). A interface nunca sobrecarrega com informacao que o usuario nao pediu.

### P3: Human-in-the-Loop como Feature
Checkpoints, aprovacoes, e intervencoes sao cidadaos de primeira classe. Nao sao limitacao -- sao feature de seguranca e qualidade. A UI torna facil aprovar, rejeitar, redirecionar, e pausar. Banners proeminentes para decisoes pendentes, nao mensagens enterradas num feed.

### P4: Custo e Tempo sao Metricas de UX
Cost ticker sempre visivel. Alertas de budget. Comparacao entre runs. Recomendacao de modelo por custo/qualidade. Informacao financeira e tao importante quanto o feed de mensagens -- e o que diferencia "experimentar" de "usar em producao".

### P5: Templates Reduzem Time-to-Value
A experiencia de primeiro uso define retencao. Templates curados com estimativas de custo e exemplos de output transformam "o que eu faco com isso?" em "vou tentar esse template agora". Onboarding em linguagem natural elimina a barreira tecnica.

### P6: Outputs sao o Produto Final
O feed de mensagens e o meio; os artefatos gerados sao o fim. Arquivos, documentos, e codigo sao tratados como entidades de primeira classe -- renderizados, pesquisaveis, exportaveis, versionados, e revisaveis -- nao como linhas perdidas num log.

### P7: Design para o Pior Caso
A interface funciona bem com 1 agente ou 20. Com 10 mensagens ou 10.000. Com conexao estavel ou intermitente. Virtualizacao de listas longas, graceful degradation, e layouts responsivos nao sao otimizacoes -- sao requisitos.

---

## 7. Roadmap de UX

### Fase 1 -- Fundacao (v0.3)
- Persistencia com SQLite/Turso (resolver perda de dados)
- Criacao de time via modal (desafogar sidebar)
- Canvas interativo basico (React Flow, clicar em no filtra timeline)
- Renderizacao de Markdown nos outputs (react-markdown + Shiki)
- Empty state com onboarding e 3 templates built-in

### Fase 2 -- Observabilidade (v0.4)
- Cost tracking por agente (token counting no stream-parser)
- Timeline unificada substituindo 5 abas, com filtros combinaveis
- Collapse inteligente de tool_use/tool_result
- Progress bar global de tasks na status bar
- Context Panel (coluna direita) com detalhes do agente selecionado

### Fase 3 -- Controle (v0.5)
- Sistema de checkpoints/aprovacao com banner proeminente
- Budget limits com auto-pause e dialogo de continuacao
- Comunicacao bidirecional real (usuario -> stdin do processo claude)
- Historico de runs com replay
- Artefact Gallery com preview rico e versionamento

### Fase 4 -- Escala (v1.0)
- Template Marketplace com rating e metricas agregadas
- Autenticacao multi-usuario com roles (operador/observador)
- Canvas com zoom semantico e minimap
- Integracao git (status, diff, PR automatico)
- Export e compartilhamento de resultados (.zip, .pdf, link publico)
- Notificacoes push quando agente precisa de input humano
- Responsividade para telas menores e modo tablet

---

## 8. Componentes a Criar (Fase 1)

| Componente | Descricao |
|------------|-----------|
| `CreateTeamModal.tsx` | Modal wizard de criacao de time (substituir formulario inline na sidebar) |
| `ArtifactExplorer.tsx` | File tree + preview inline de artefatos gerados |
| `WelcomeScreen.tsx` | Empty state com prompt NL, templates, runs recentes |
| `TemplateCard.tsx` | Card de template com descricao, agentes, estimativa de custo |
| `AgentContextPanel.tsx` | Painel lateral com detalhes do agente selecionado |
| `HumanInputBanner.tsx` | Banner proeminente para checkpoints e decisoes pendentes |
| `CostTicker.tsx` | Componente de custo no header com cores dinamicas |

### Componentes a Refatorar

| Componente | Mudanca |
|------------|---------|
| `AgentFlowDiagram.tsx` | Migrar para React Flow, habilitar interacao, adicionar zoom semantico |
| `Sidebar.tsx` | Separar em `TeamNav.tsx` + `MessageInput.tsx`, adicionar modo colapsado |
| `LiveOutput.tsx` | Adicionar collapse de tool actions, slider de detalhe |
| `page.tsx` | Migrar de Tabs para layout de paineis resizaveis (3 colunas) |

### APIs Necessarias

| Endpoint | Descricao |
|----------|-----------|
| `GET /api/teams/:id/artifacts` | Lista arquivos criados pelos agentes |
| `GET /api/teams/:id/artifacts/:path` | Conteudo de arquivo especifico |
| `GET /api/runs` | Historico de execucoes anteriores |
| `GET /api/templates` | Lista de templates disponiveis |
| `POST /api/templates` | Salvar novo template |

---

## 9. Metricas de Sucesso

| Metrica | v0.2 (Atual) | Meta v0.5 | Meta v1.0 |
|---------|-------------|-----------|-----------|
| Tempo para criar primeiro time | ~3min (formulario manual) | <60s (template) | <20s (NL prompt) |
| Cliques para ver artefato | 4-6 (tab Outputs, scroll, ler texto) | 2 (Artifact Explorer, click) | 1 (auto-surfaced) |
| Clareza de status do time | Baixa (5 tabs, contexto fragmentado) | Alta (timeline unificada) | Alta + notificacoes |
| Retencao de runs | 0% (perda ao recarregar) | 100% (persistencia local) | 100% (cloud sync) |
| Onboarding sem docs | ~20% (interface confusa) | ~80% (welcome screen guia) | ~95% (onboarding interativo) |
| Custo visivel | Nunca | Sempre (ticker no header) | Sempre + recomendacoes |

---

*Documento gerado em 2026-04-12 como parte da analise de UX do Agent Orchestrator v0.2.*
