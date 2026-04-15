# Maestro - Backlog Completo

> Atualizado: 2026-04-15 | Versao: v0.5 | 22 Sprints executados | 40+ features

## Implementado

### Infra & Backend
- [x] SQLite persistencia (teams, msgs, peers, tasks, artifacts, costs)
- [x] Rich stream parser (Write/Edit→artifacts, SendMessage→P2P, TodoWrite→tasks, Bash→cmds, Thinking→inline)
- [x] Cost tracking por agente (tokens + USD)
- [x] P2P relay (shared context auto-update on agent exit)
- [x] sendMessage re-spawn (envia msg para team parado)
- [x] Artifact dedup na API
- [x] `--dangerously-skip-permissions` (agentes escrevem codigo)
- [x] Race mode API (comparar modelos em paralelo)
- [x] Deploy scripts (Oracle + Cloudflare + PM2)

### Canvas & Visualizacao
- [x] React Flow (draggable nodes, agent cards com avatar/status/model)
- [x] Nodes centralizados no viewport (fitView)
- [x] Edge animation (animated quando P2P > 0)
- [x] MiniMap para times grandes (5+)
- [x] Controls (zoom, fit)

### UI/UX
- [x] Welcome Screen com template gallery
- [x] Template-as-Teaching (5 templates com why + estimate)
- [x] Agent identity cards (avatar colorido, role, model badge)
- [x] Auto-expand active team
- [x] Timeline unificada com filter chips (Tudo/Texto/Tools/P2P/Tasks/Artifacts)
- [x] Resizable panels (react-resizable-panels)
- [x] Right panel toggle (Artifacts/Tasks/Race)
- [x] Sidebar history split (Ativos/Historico)
- [x] Msg count per team na sidebar

### Visual & Feedback
- [x] Markdown rendering (remark-gfm - tabelas, code blocks, bold, listas)
- [x] Inline thinking display (Brain icon, purple theme, colapsavel)
- [x] Tool call collapse animado (chevron + framer-motion)
- [x] Typing indicators (pulsing dots)
- [x] Glassmorphism panels (backdrop-blur)
- [x] Motion variants library (centralized animations)
- [x] Status pulse CSS
- [x] Custom scrollbar
- [x] Theme toggle (light/dark/system) sem FOUC

### Artifact Management
- [x] ArtifactExplorer com preview inline
- [x] Multi-tab file preview (open multiple, switch, close)
- [x] Markdown preview renderizado
- [x] Syntax detection por extensao
- [x] Skeleton loading

### Components
- [x] CostBadge (hover breakdown per agent)
- [x] ApprovalBanner (HITL checkpoint component)
- [x] RaceView (compare models side-by-side)
- [x] WelcomeScreen (template gallery)
- [x] ThemeToggle (3 states)

---

## Backlog (Priorizado)

### P0.5 - Diferenciação Estratégica vs Claude Code Desktop
> **Contexto:** Em 14/abr/2026, Anthropic lançou redesign completo do Claude Code Desktop + Routines.
> O Claude Code Desktop entrou no mesmo espaço do Maestro: multi-sessão, session manager, terminal integrado, preview pane.
> O moat do Maestro agora depende do que o Claude Code Desktop *não faz*: agentes que se comunicam entre si.

- [ ] **"Multi-agente, não multi-sessão" — reforçar P2P na UI**
  - Tagline visual no header: *"Agentes que colaboram, não só correm em paralelo"*
  - Indicador explícito de mensagens P2P no canvas (badge de contagem + highlight)
  - Tooltip nos nodes explicando a diferença: sessões isoladas vs. time orquestrado
  - Referência: Claude Code Desktop roda N Claudes isolados — Maestro faz agentes *conversarem*

- [ ] **Routines equivalente (scheduled tasks com cron)**
  - Agendar execução de times sem laptop aberto
  - Scheduled / Webhook (GitHub PR events) / API endpoint
  - Limites configuráveis por tier (igual ao modelo Anthropic)
  - *Já estava no P1 — promover para P0.5 dado o lançamento do concorrente*

- [ ] **Session Management estilo Claude Code Desktop (evoluído)**
  - Filtros na sidebar: por status (running/waiting/done), por projeto, por provider
  - Auto-archive quando team conclui tarefa
  - Group por projeto (para quem tem muitos teams)
  - *Maestro já tem base — evoluir para paridade e depois superar*

- [ ] **Cost Dashboard comparativo**
  - Claude Code Desktop não expõe custo por sessão
  - Maestro deve destacar isso: custo por agente, por team, por tarefa, trend histórico
  - Recharts com breakdown model×tokens×USD (inspirado Mission Control)
  - ROI estimado por tarefa concluída

- [ ] **Provider-agnostic roadmap (moat de longo prazo)**
  - Maestro orquestra Claude Code, Codex, Gemini CLI, modelos locais (Ollama/MLX)
  - Claude Code Desktop só roda Claude
  - UI de provider discovery: auto-detect instalados, status, capabilities
  - *Já estava no P0 como "Provider discovery UI" — ligar explicitamente à estratégia*

**Posicionamento resultante:**
> Claude Code Desktop = IDE agentic para dev solo
> Maestro = Command center para times de agentes multi-provider com comunicação real

---

### P0 - Critico: Agent Canvas "WOW" — Visualizacao Cinematica
> O canvas atual (React Flow simples com cards planos) e funcional mas invisivel. Dois boxes conectados por uma linha nao comunica a magnitude do que esta acontecendo. Quando um agente esta pensando, gerando codigo, ou mandando mensagem para outro — o usuario precisa **sentir** isso.
> Referencia de ambicao: o que Cursor fez com o diff viewer, o que Vercel fez com o deploy log — algo que faz o usuario parar e falar "cara, que legal".

- [ ] **Nodes cinematicos com estado visual rico**
  - Avatar do agente com **glow pulsante colorido por estado**: azul=pensando, verde=executando, laranja=aguardando, vermelho=erro, cinza=concluido
  - **Anel de progresso** girando ao redor do avatar enquanto o agente processa (CSS conic-gradient ou SVG stroke-dasharray animado)
  - Preview ao vivo do que o agente esta fazendo: ultima linha de output dentro do card (truncada, animada como typewriter)
  - Badge de ferramenta ativa: quando o agente roda bash/write/read, aparece um chip animado no canto do card (`🔧 Bash`, `✏️ Write`)
  - Custo em tempo real: contador USD que incrementa visualmente enquanto o agente trabalha
  - Framer Motion: entrada/saida suave dos nodes (scale+fade, spring physics)

- [ ] **Edges cinematicas com fluxo de dados visiveis**
  - P2P messages: partícula/bolha viaja ao longo da edge de origem para destino (SVG animado ou CSS offset-path)
  - Espessura da edge proporcional ao volume de mensagens trocadas
  - Edge pulsa brevemente em verde ao entregar mensagem, fica laranja em idle
  - Label flutuante na edge mostra preview da ultima mensagem P2P (fade in/out)
  - Seta direcional clara: quem esta falando com quem, sentido do fluxo

- [ ] **Canvas com profundidade e contexto**
  - Background: grid sutil animado ou particulas flutuando (Three.js lite ou CSS puro) — como Vercel dashboard
  - **Zoom semantico**: zoom out mostra apenas status icons + nome; zoom in revela preview de output
  - Highlight de foco: quando usuario clica num agente, os outros escurecem (backdrop blur nos nodes nao-focados)
  - Sombra e elevacao: agente ativo tem z-index visual maior (shadow mais intensa, scale ligeiramente maior)
  - "Team pulse": quando todos os agentes estao ativos simultaneamente, o canvas inteiro tem um glow sutil de fundo

- [ ] **Timeline de eventos integrada ao canvas (micro-history)**
  - Linha do tempo no eixo X abaixo de cada node: bolhas de eventos passados (pensamento, tool call, P2P)
  - Hover sobre bolha: tooltip com preview do evento
  - Conecta visualmente o que aparece na timeline principal com o agente que gerou

- [ ] **Modo "Diretor" (fullscreen canvas)**
  - Tecla `F` ou botao dedicado: expande canvas para fullscreen, esconde sidebar
  - Ideal para apresentacoes, demos ao vivo, acompanhamento de runs longas
  - Fonte maior, animacoes mais dramaticas, modo "cinema"

**Stack sugerida:**
- Framer Motion (ja instalado) para todos os micro-animations dos nodes
- SVG animado nativo para particle flow nas edges
- CSS `@keyframes` + `conic-gradient` para progress rings
- React Flow custom nodes (substituir o node default completamente)
- `useSyncExternalStore` para streaming de estado em tempo real sem re-render excessivo

**Referencia visual:**
- Vercel deployment log (progresso em tempo real, muito clean)
- Linear issue board (micro-animations nos status changes)
- Retool agent canvas (node cards ricos)
- Atoms.dev live preview (agentes com feedback visual imediato)

---

### P0 - Critico: UX de Criacao de Agentes e Times
> O form atual na sidebar e apertado, pouco visual, e nao escala. Precisa ser repensado completamente.

- [x] **Team Creation Wizard (Modal/Page)** - Modal multi-step 5-step substituindo form inline:
  - Step 1: Escolher template ou "from scratch" (cards visuais grandes com preview de agentes)
  - Step 2: Configurar agentes (cards com avatar/role/model/provider, reorder, system prompt, role suggestions)
  - Step 3: Definir tarefa (prompt area grande com sugestoes contextuais)
  - Step 4: Guardrails (budget, timeout, approval gates HITL, execution mode parallel/sequential/graph)
  - Step 5: Review com edit-in-place e navegacao rapida para steps anteriores

- [ ] **Agent Builder visual** - Criar/editar agentes individuais com:
  - Avatar picker (emoji ou upload)
  - Role com sugestoes (autocomplete de roles comuns)
  - Provider selector visual (cards com status installed/not installed, auto-detected)
  - Model selector com badges de preco/velocidade/qualidade
  - System prompt editor com syntax highlight
  - Capabilities toggle (code, files, web, bash, mcp)
  - Preview do agent card final

- [ ] **Provider discovery UI** - Pagina/modal que mostra:
  - Agents instalados no sistema (auto-detected: Claude Code, OpenClaw, Ollama)
  - Status: installed/version ou install instructions
  - Capacidades de cada provider
  - One-click configuration
  - Inspiracao: AionUI skills marketplace + auto-detection

- [ ] **Team templates gallery (full page)** - Substituir chips por:
  - Cards grandes com screenshot/preview do workflow
  - Descricao longa (template-as-teaching: por que, quando, para quem)
  - Estimativa de custo e tempo
  - Rating de runs anteriores
  - "Use this template" button que abre o wizard pre-configurado
  - Categorias: Development, Product, Review, Debug, Research, Creative

- [ ] **Drag-and-drop team composer** - Canvas visual para montar times:
  - Arrastar agentes de um catalogo para o canvas
  - Conectar agentes com edges (definir fluxo de comunicacao)
  - Inline config de cada agente (clicar no node)
  - Preview do custo estimado em tempo real
  - Inspiracao: Google AI Studio ADK visual builder

### P1 - Alto Impacto, Viabilidade Alta
- [ ] **Deploy em producao** - Oracle VM + Cloudflare Tunnel em maestro.melhor.dev (scripts prontos)
- [ ] **Approval gates ativo** - integrar ApprovalBanner ao stream (detectar acoes criticas, pausar, pedir confirmacao)
- [ ] **Agent-to-agent messaging real** - backend relay via stdin (agente A termina, resultado injetado no agente B)
- [ ] **Scheduled tasks** - cron para rodar teams em horarios fixos (inspirado AionUI)
- [ ] **Error recovery (Try to Fix)** - detectar erros e oferecer botao de retry automatico (Lovable pattern)

### P2 - Alto Impacto, Complexidade Media
- [ ] **Unified MCP config** - configurar MCP servers uma vez, sincronizar para todos agentes (AionUI pattern)
- [ ] **Plan deduplication** - evitar steps redundantes no output multi-agente
- [ ] **Office output** - gerar .pptx, .docx, .xlsx direto dos agentes (AionUI/OfficeCLI)
- [ ] **Remote access WebUI** - acessar via QR code ou URL externa (AionUI pattern)
- [ ] **Notification system** - push/toast quando agente precisa de input ou terminou (Lovable pattern)

### P3 - Diferencial Competitivo
- [ ] **3 Modes (Agent/Plan/Visual)** - Lovable pattern, cada mode com UX otimizada
- [ ] **Race mode visual** - side-by-side diff de resultados, ranking automatico
- [ ] **DESIGN.md manifest** - design system legivel por maquina (Google Stitch pattern)
- [ ] **Infinite canvas** - zoom semantico, minimap, node grouping (Google Stitch)
- [ ] **Skills marketplace** - catalogo de skills/templates instaláveis (AionUI)
- [ ] **Annotation mode** - highlight UI e descrever mudanca (Google AI Studio)

### P4 - Plataforma / Ecossistema
- [ ] **Multi-user collaboration** - multiplos humanos no mesmo run (Atoms.dev)
- [ ] **Agent marketplace** - catalogo publico de agentes pre-configurados
- [ ] **Sandboxing per agent** - Docker/nsjail por agente
- [ ] **Branching de execucao** - fork de run para testar instrucao alternativa
- [ ] **Webhooks e integracoes** - Slack, GitHub, Notion
- [ ] **Governance / compliance** - audit trails, EU AI Act (PRODUCT_VISION)
- [ ] **i18n** - interface em PT/EN/ES

---

## Benchmarks vs Concorrentes

### vs AionUI
| Feature | AionUI | Maestro | Gap |
|---------|--------|---------|-----|
| Multi-agent support | 12+ agents | Claude Code only | AionUI +++ |
| Inline thinking | ✅ | ✅ | Par |
| File preview | Multi-tab, 30+ formats | Multi-tab, MD+code | AionUI + |
| Office output | .pptx/.docx/.xlsx | Nao | AionUI +++ |
| MCP unified | ✅ | Nao | AionUI + |
| Local-first | SQLite | SQLite | Par |
| Skills marketplace | ✅ | Templates only | AionUI + |
| Remote access | WebUI/QR/Telegram | Nao | AionUI + |
| Scheduled tasks | ✅ | Nao | AionUI + |
| React Flow canvas | Nao | ✅ | Maestro + |
| Race mode | Nao | ✅ | Maestro + |
| Cost tracking | Nao | ✅ | Maestro + |
| Template-as-Teaching | Nao | ✅ | Maestro + |

### vs Atoms.dev
| Feature | Atoms.dev | Maestro | Gap |
|---------|-----------|---------|-----|
| Live preview | Functional preview | Artifact preview | Atoms + |
| Race mode | ✅ (variants) | ✅ (models) | Par |
| Conductor metaphor | ✅ | ✅ (Maestro) | Par |
| Approval gates | ✅ | Component ready | Atoms + |
| Named agents | ✅ | ✅ (avatars+roles) | Par |
| GitHub integration | ✅ | Nao | Atoms + |
| Deploy pipeline | ✅ (dev/prod) | Scripts only | Atoms + |

### vs Lovable
| Feature | Lovable | Maestro | Gap |
|---------|---------|---------|-----|
| 3 modes (Agent/Plan/Visual) | ✅ | Nao | Lovable +++ |
| Try to Fix | ✅ | Component ready | Lovable + |
| Design system ownership | ✅ (.lovable/) | Nao | Lovable + |
| Sandbox preview | ✅ | Nao | Lovable + |
| Progressive disclosure | ✅ | Templates only | Lovable + |
| Cost tracking | Nao | ✅ | Maestro + |
| Multi-agent | Basic | Full team orchestration | Maestro +++ |
| Canvas visualization | Nao | React Flow | Maestro + |

### vs Mission Control (builderz-labs)
> Mission Control e a referencia enterprise para orquestracao de agentes. 32 paineis, Kanban workflow, observabilidade 4 camadas, seguranca hardened.

| Feature | Mission Control | Maestro | Gap | Prioridade |
|---------|----------------|---------|-----|------------|
| Kanban task workflow | ✅ (7 stages) | Tasks basico | MC +++ | P1 |
| Agent fleet management | ✅ (15+ agents) | Team-level | MC ++ | P2 |
| Cost dashboards (Recharts) | ✅ (per-model trends) | CostBadge simples | MC ++ | P1 |
| Security/trust scoring | ✅ (0-100, secret detection) | Nao | MC +++ | P3 |
| Heartbeat monitoring | ✅ (wake schedules) | Status por evento | MC + | P2 |
| Framework agnostic | ✅ (CrewAI, LangGraph, etc.) | Claude Code + auto-discover | MC ++ | P1 |
| Scheduled execution | ✅ (cron + quota-aware) | Nao | MC ++ | P1 |
| Evaluation framework | ✅ (4 camadas) | Nao | MC +++ | P3 |
| Audit trails | ✅ (completo) | Nao | MC ++ | P2 |
| RBAC / multi-user | ✅ (viewer/operator/admin) | Nao | MC ++ | P3 |
| Docker sandboxing | ✅ (read-only filesystem) | Nao | MC ++ | P4 |
| WebSocket real-time | ✅ (WS + SSE) | SSE only | MC + | P2 |
| Pipeline orchestration | ✅ | Race mode only | MC ++ | P2 |
| Team creation wizard | Nao | ✅ (5-step visual) | Maestro ++ | - |
| Template gallery | Nao | ✅ (5 templates) | Maestro ++ | - |
| React Flow canvas | Nao | ✅ (draggable nodes) | Maestro ++ | - |
| Inline thinking display | Nao | ✅ (Brain icon) | Maestro + | - |
| Markdown rendering | Nao | ✅ (remark-gfm) | Maestro ++ | - |
| Welcome onboarding | Nao | ✅ (template gallery) | Maestro + | - |
| Race mode | Nao | ✅ (compare models) | Maestro + | - |

**Gaps criticos do Maestro vs Mission Control:**
1. **Kanban workflow** - MC tem 7 stages (Planning→Inbox→Assigned→InProgress→Testing→Review→Done). Maestro tem tasks flat sem stages.
2. **Observabilidade enterprise** - MC tem 4 camadas de avaliacao (output, trace, component, drift). Maestro so tem output.
3. **Seguranca** - MC tem trust scoring, secret detection, RBAC. Maestro tem zero seguranca.
4. **Scheduled execution** - MC tem cron + quota-aware. Maestro nao tem scheduler.
5. **Framework agnostic** - MC suporta CrewAI/LangGraph/AutoGen. Maestro so Claude Code (+ auto-discover limitado).

**Vantagens do Maestro vs Mission Control:**
1. **UX de criacao** - Wizard visual 5-step >> MC nao tem wizard
2. **Canvas interativo** - React Flow >> MC usa cards/lists
3. **Visual feedback** - Markdown, thinking, animations >> MC e mais utilitario
4. **Onboarding** - Welcome + templates >> MC assume usuario expert
| Canvas visualization | Nao | React Flow | Maestro + |
