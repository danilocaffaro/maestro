# ARCHITECTURE.md — agent-orchestrator v0.2

> Analise tecnica por **Dev (Arquiteto)**. Cobre lib/, app/api/, types, fluxo de dados, debitos tecnicos, viabilidade de features e recomendacoes para escala.

---

## 1. Visao Geral

O agent-orchestrator e uma aplicacao **Next.js 16 (App Router)** que fornece uma GUI web para orquestrar sessoes multi-agente do Claude Code. A arquitetura atual combina frontend React 19 + API Routes no mesmo processo Node.js, usando o binario `claude` CLI como executor de agentes via `child_process.spawn`.

```
+-------------------------------------------------------------+
|                    Browser (React 19)                        |
|  useTeamStream (SSE) <---- EventSource /api/stream/:id      |
|  fetch /api/teams/:id  (bootstrap historico)                 |
+-----------------------------+--------------------------------+
                              | HTTP / SSE
+-----------------------------v--------------------------------+
|               Next.js API Routes (Node.js)                   |
|                                                              |
|  POST /api/teams      -> spawnTeam()                         |
|  GET  /api/teams      -> teamStore.list()                    |
|  GET  /api/teams/:id  -> teamStore.getState()                |
|  DEL  /api/teams/:id  -> stopTeam()                          |
|  POST /api/teams/:id/message -> sendMessage()                |
|  GET  /api/stream/:id -> SSE via eventBus                    |
|  GET  /api/tasks/:id  -> teamStore tasks[]                   |
|                                                              |
|  +---------------+   +----------------+   +---------------+  |
|  |  cli-manager  |   |  team-store    |   |  event-bus    |  |
|  |  (spawn/kill  |   |  (in-memory    |   |  (EventEmit-  |  |
|  |   processes)  |   |   Map<id,Team>)|   |   ter SSE)    |  |
|  +-------+-------+   +----------------+   +---------------+  |
+-----------+--------------------------------------------------+
            | spawn()
+-----------v--------------------------------------------------+
|  OS Processes: claude -p <prompt> --output-format stream-json |
|  Agent A (proc)   Agent B (proc)   Agent C (proc)  ...       |
+--------------------------------------------------------------+
```

---

## 2. Modulos Principais

### `lib/types.ts` (83 LOC)
Contrato central de dados. Pontos de atencao:
- `Agent.model` aceita `ModelId` mas `TeamConfig.model` e `string` livre — inconsistencia de tipos.
- `Task` nao tem `createdAt`, `priority`, `dependencies` — necessario para roadmap.
- `AgentMessage.type` tem apenas 3 valores (`text`, `tool_use`, `tool_result`); faltam `"system"`, `"peer"` para UI rica.
- `ModelId` hardcoded para 3 modelos Anthropic — bloqueio para multi-provider.

### `lib/team-store.ts` (46 LOC)
Singleton `Map<string, StoredTeam>` em memoria. Simples e funcional para single-process.
- `updateState()` faz shallow merge — objetos aninhados (arrays de messages) sao sobrescritos, nao appendados.
- `StoredTeam.process` armazenado como `null` no `set()` inicial — os processos reais ficam em `activeProcesses` em `cli-manager.ts`. **Dado duplicado e inconsistente.**

### `lib/cli-manager.ts` (175 LOC)
Nucleo de execucao. Responsavel por:
1. Construir o prompt de cada agente (injetando contexto do time)
2. `spawn("claude", ["-p", prompt, "--output-format", "stream-json", "--verbose", "--dangerously-skip-permissions"])`
3. Parsear stdout linha-a-linha via `processJsonLine()` interno
4. Emitir eventos no `eventBus` + atualizar `teamStore`

**Decisao arquitetural:** cada agente = 1 processo OS. Correto — herda todas as ferramentas do Claude Code sem reimplementacao. O custo e overhead de processo e impossibilidade de controle fino de budget/context.

### `lib/event-bus.ts` (18 LOC)
`EventEmitter` tipado. Cada team tem seu canal `team:<id>`. `maxListeners(50)` hardcoded. Retorna cleanup function para unsubscribe.

### `lib/stream-parser.ts` (245 LOC)
Parser rico de eventos Claude CLI. Detecta:
- Mensagens de texto/tool_use
- `SendMessage` -> peer messages entre agentes
- `TodoWrite` -> task tracking
- `Agent` tool -> agent status/spawn

**DEAD CODE**: Nao e importado por nenhum modulo ativo. `cli-manager.ts` usa seu proprio `processJsonLine()` local (mais simples). Os dois coexistem sem integracao. O parser rico resolvia problemas (peer messages, task tracking) que o basico nao resolve.

### `lib/stream-client.ts` (131 LOC)
React hook `useTeamStream`. Padrao correto: carrega estado historico via REST, depois conecta SSE para real-time. Deduplicacao por `id` evita duplicatas. Gerencia lifecycle do EventSource com cleanup no unmount.

### `lib/utils.ts` (49 LOC)
Utilitarios: `cn()` (Tailwind merge), `generateId()` (Math.random base36), `statusColor()`/`statusDot()` (mapeamento de status para classes CSS).

---

## 3. Rotas de API

| Rota | Metodo | Funcao | Auth |
|------|--------|--------|------|
| `/api/teams` | GET | Lista todos os times | Nenhum |
| `/api/teams` | POST | Cria time + spawna agentes | Nenhum |
| `/api/teams/[id]` | GET | Estado de um time | Nenhum |
| `/api/teams/[id]` | DELETE | Para time (SIGTERM) | Nenhum |
| `/api/teams/[id]/message` | POST | Envia mensagem (stub) | Nenhum |
| `/api/stream/[id]` | GET | SSE stream real-time | Nenhum |
| `/api/tasks/[id]` | GET | Tasks de um time | Nenhum |

### Fluxo de Dados Completo

```
1. POST /api/teams  { name, agents[], task, id }
2. spawnTeam():
   a. Cria TeamState em teamStore (Map<>)
   b. Para cada AgentConfig -> spawn("claude", [...args])
   c. Registra processos em activeProcesses Map (separado do store)
3. CLI stdout -> buffer -> split("\n") -> processJsonLine()
4. processJsonLine() -> emit() -> eventBus.emitTeamEvent()
   + teamStore state.messages.push(msg) [mutacao direta]
5. eventBus -> SSE handler -> TextEncoder -> ReadableStream
6. Browser EventSource recebe events -> useTeamStream setState()
7. React re-render com novos dados
```

---

## 4. Frontend

| Componente | Responsabilidade |
|------------|-----------------|
| `app/page.tsx` | Pagina principal - estado global, callbacks, layout |
| `Sidebar` | Lista de times, criacao, filtro por agente, envio de mensagem |
| `AgentFlowDiagram` | Grafo visual (Cytoscape.js) com agentes e mensagens P2P |
| `LiveOutput` | Feed de mensagens/output dos agentes com auto-scroll |
| `MessageFeed` | Feed de mensagens peer-to-peer |
| `TaskList` | Lista de tasks com status |
| `ThemeToggle` | Toggle dark/light mode |
| `components/ui/*` | 11 componentes Shadcn/Radix (button, card, tabs, etc.) |

---

## 5. Stack Tecnologica Atual

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.3 |
| Frontend | React | 19.2.4 |
| UI Components | Radix UI + Shadcn | v1.x |
| Grafo Visual | Cytoscape.js | 3.33.2 |
| Notificacoes | Sonner | 2.0.7 |
| Styling | Tailwind CSS | 4.x |
| LLM SDK | @anthropic-ai/sdk | 0.88.0 (instalado, nao utilizado) |
| LLM Runtime | Claude Code CLI | via child_process.spawn |
| Language | TypeScript | 5.x |

---

## 6. Debitos Tecnicos (priorizados por impacto)

### CRITICO

| # | Debito | Impacto | Detalhe |
|---|--------|---------|---------|
| D1 | **Dois parsers, nenhum completo** | Task tracking e peer messages nao funcionam | `cli-manager.ts` tem `processJsonLine()` (basico, nao detecta TodoWrite/SendMessage). `stream-parser.ts` tem `parseStreamLine()` (rico, detecta tudo) mas e dead code — nao importado. |
| D2 | **`sendMessage()` e stub** | Feature de chat com time nao funciona | Processos spawnados com `stdio: ["ignore", "pipe", "pipe"]` — stdin fechado. `sendMessage()` so exibe na UI, nao chega aos agentes. |
| D3 | **Estado 100% in-memory** | Perda total de dados em restart | `team-store.ts` usa `Map<>`. Qualquer restart do servidor perde todos os times, mensagens e estado. Inviavel para producao. |
| D4 | **Sem autenticacao** | Qualquer pessoa acessa/cria times | Zero middleware de auth. Combinado com `--dangerously-skip-permissions`, qualquer requisicao pode spawnar agentes com acesso total ao sistema. |
| D5 | **`--dangerously-skip-permissions`** | Agentes executam qualquer comando | Todos os processos Claude spawnados sem sandboxing. Risco de seguranca critico. |

### ALTO

| # | Debito | Impacto | Detalhe |
|---|--------|---------|---------|
| D6 | **`lastActiveAgent` global** | Race condition entre teams | Variavel module-level em `stream-parser.ts`. Com teams concorrentes, estado corrompido entre teams. |
| D7 | **Estado mutavel compartilhado** | Race conditions | `cli-manager.ts:13` faz `state.messages.push(msg)` diretamente no objeto do store, sem copia imutavel. |
| D8 | **`activeProcesses` vs `teamStore.process`** | Processos orfaos | `StoredTeam.process` sempre `null`. Processos reais em Map separado. Se cleanup falhar, processos continuam sem referencia. |
| D9 | **Sem testes** | Regressoes silenciosas | Zero arquivos de teste. Nenhum framework de test configurado. |
| D10 | **Modelo nao passado ao CLI** | Selecao de modelo nao funciona | `runAgent()` recebe `model` mas nao passa `--model` flag ao processo `claude`. |

### MEDIO

| # | Debito | Impacto | Detalhe |
|---|--------|---------|---------|
| D11 | **Budget nao implementado** | Gasto descontrolado | `TeamConfig.maxBudget` existe no tipo mas zero codigo o consome. |
| D12 | **EventEmitter max 50 listeners** | Memory leak em escala | 10 times x 3 clientes SSE = 30 listeners. Limite atingivel. |
| D13 | **Sem rate limiting** | Abuso de API | POST /api/teams ilimitado. |
| D14 | **Polling de teams a cada 5s** | Overhead desnecessario | `page.tsx:34` usa `setInterval(loadTeams, 5000)` quando ja tem SSE. |
| D15 | **Sem validacao robusta de input** | Injecao de prompt/comando | `config.agents` e `config.task` passados ao CLI sem sanitizacao. |
| D16 | **@anthropic-ai/sdk nao utilizado** | Dependencia morta | SDK instalado mas app usa CLI. Peso desnecessario. |
| D17 | **`generateId()` usa Math.random()** | Colisoes possiveis | 8 chars base36. Deveria usar `crypto.randomUUID()`. |

### BAIXO

| # | Debito | Impacto | Detalhe |
|---|--------|---------|---------|
| D18 | **README.md e template padrao** | Falta documentacao | Default do create-next-app. |
| D19 | **Strings hardcoded em portugues** | I18n futura | UI e prompts em PT-BR hardcoded. |
| D20 | **Sem logging estruturado** | Debug dificil em prod | Nenhum sistema de logging. |
| D21 | **stderr ignorado** | Erros silenciados | `cli-manager.ts:79` descarta stderr. |
| D22 | **Sem backpressure no SSE** | Memory se cliente lento | Controller.enqueue sem verificar se cliente le. |

---

## 7. Pontos Fortes

1. **Arquitetura event-driven elegante**: EventBus + SSE e limpo e extensivel. Separacao pub/sub permite adicionar consumers sem alterar producers.

2. **UI componentizada e moderna**: React 19 + Radix/Shadcn + Tailwind 4. Componentes bem separados por responsabilidade.

3. **Cytoscape.js para grafo de agentes**: Suporta layouts dinamicos, animacoes e interacao. Visualizacao imediata da topologia do time.

4. **Tipagem TypeScript completa**: `types.ts` cobre todo o dominio (Agent, Team, Task, Message, StreamEvent) com tipos bem definidos.

5. **Spawn paralelo**: Cada agente e processo independente — verdadeiro paralelismo e isolamento natural.

6. **Dedup de mensagens no client**: `stream-client.ts` deduplica por ID ao receber SSE, evitando duplicatas na UI apos reconexao.

7. **stream-parser.ts rico (embora morto)**: O parser que detecta TodoWrite, SendMessage e Agent tool ja existe e esta correto — so precisa ser integrado.

8. **SSE bem implementado**: Keep-alive, cleanup via AbortSignal, TextEncoder streaming. Padrao correto.

---

## 8. Status de Features

### Funciona
| Feature | Onde |
|---------|------|
| Spawn paralelo de agentes | `cli-manager.spawnTeam()` |
| SSE real-time stream | `app/api/stream/[id]` |
| Status lifecycle (thinking->working->done) | `cli-manager.emitStatus()` |
| Historico de mensagens (in-memory) | `teamStore.messages[]` |
| Stop team (SIGTERM) | `stopTeam()` |
| Grafo visual de agentes | `AgentFlowDiagram` |

### Parcialmente funciona
| Feature | Problema |
|---------|---------|
| Task tracking | `stream-parser.ts` morto; `cli-manager` nao detecta `TodoWrite` |
| Peer messages | Detectado em `stream-parser.ts` (morto), nao no fluxo ativo |
| Agent status granular | Heuristica por regex `**Name**:` — fragil |
| Selecao de modelo | Campo existe, `runAgent()` nao passa `--model` ao CLI |

### Nao funciona (stubs)
| Feature | Problema |
|---------|---------|
| Enviar mensagem ao time | stdin fechado, `sendMessage()` e display-only |
| Budget/cost tracking | Campo no tipo, zero implementacao |
| Pause/resume team | Tipo tem `"paused"` mas sem endpoint/logica |
| Task assignment/update | `/api/tasks/:id` so tem GET |

---

## 9. Viabilidade de Features Futuras

| Feature | Dificuldade | Esforco | Pre-requisitos | Notas |
|---------|-------------|---------|----------------|-------|
| **Multi-agent com diferentes providers LLM** | Media | 2-3 semanas | Provider abstraction layer | Atualmente hardcoded para Claude CLI. Precisa de adapter pattern: `interface LLMProvider { spawn(prompt, tools, config): AgentProcess }`. Providers: Anthropic SDK (ja instalado), OpenAI, Ollama. Migracao de CLI para SDK e o passo critico — desbloqueia controle fino de tokens, streaming granular e budget. |
| **Persistencia de estado** | Facil | 1 semana | Schema de DB | Substituir `Map<>` por DB. SQLite (Drizzle/better-sqlite3) para MVP, PostgreSQL para prod. Schema: teams, agents, messages, peer_messages, tasks. Store tem interface simples (get/set/list/delete) — migracao direta. |
| **Sistema de tools extensivel** | Dificil | 4-6 semanas | Provider abstraction, tool registry | Precisa: 1) Registry de tools com JSON Schema, 2) Injecao de tools no config do agente, 3) Middleware de execucao sandboxed, 4) UI de tool management. Claude CLI ja tem tools built-in, mas providers diferentes tem APIs distintas para function calling. |
| **Real-time streaming de respostas** | Facil | 3-5 dias | Nenhum | Base ja existe via SSE. Melhorias: streaming token-level (atual e por mensagem completa), typing indicators, progress bars. Migrar de CLI stdout parsing para SDK streaming daria granularidade token-a-token. |
| **Dashboard de monitoramento** | Media | 2-3 semanas | Persistencia, metricas | Coletar: tokens in/out, latencia, erros, custo. EventBus e o ponto ideal de instrumentacao. Stack: OpenTelemetry + Grafana ou Recharts inline. Requer persistencia para dados historicos. |
| **Multi-tenancy e autenticacao** | Media | 2-3 semanas | DB, auth provider | NextAuth.js v5 ou Clerk. Middleware de tenant isolation em todas as rotas. Schema: users, organizations, team ownership. Row-level security. O mais critico e isolar processos entre tenants (containers). |
| **Marketplace de agentes/tools** | Dificil | 6-8 semanas | Auth, DB, tools system, registry | Feature mais complexa. Precisa: 1) Templates como JSON schema versionado, 2) Pipeline de upload/review, 3) Sandboxing de tools de terceiros, 4) Billing/metering per-tool. Requer maturidade da plataforma primeiro. |

---

## 10. Analise de Escalabilidade

### Gargalos atuais

1. **Processos OS**: Cada agente = 1 processo `claude`. 10 times x 5 agentes = 50 processos simultaneos. Viavel em dev, problematico em producao (memoria, file handles, ulimits).

2. **EventEmitter in-process**: SSE so funciona se a requisicao HTTP cai na mesma instancia Node.js que gerou os eventos. Quebra com load balancer.

3. **Buffer de mensagens ilimitado**: `state.messages.push(msg)` sem limite. Um agente verboso pode acumular MBs de texto em RAM.

4. **Sem backpressure no SSE**: Controller.enqueue sem verificar se o cliente esta lendo.

5. **Single-server**: State nao e compartilhavel. Impossivel escalar horizontalmente.

### Capacidade estimada (single instance, 16GB RAM)
- ~20-30 teams concorrentes
- ~100-150 agentes simultaneos (limitado por file handles OS)
- SSE connections: limitado pelo maxListeners(50)

---

## 11. Recomendacoes Arquiteturais

### Fase 1 — Curto Prazo: Corrigir o que existe (1-2 semanas)

```
1. Integrar stream-parser.ts no cli-manager.ts
   -> Ativa task tracking e peer messages que ja estao implementados
2. Abrir stdin dos agentes (trocar "ignore" por "pipe")
   -> sendMessage() passa a funcionar de verdade
3. Passar --model flag ao spawn quando agentConfig.model definido
   -> Selecao de modelo funciona
4. Mover lastActiveAgent para closure por team
   -> Elimina race condition global
5. crypto.randomUUID() em vez de Math.random()
6. Implementar budget tracking via contagem de tokens do stream-json
```

### Fase 2 — MVP Robusto (1-2 meses)

```
1. Persistencia com SQLite (better-sqlite3 ou Drizzle)
2. Autenticacao (NextAuth.js v5)
3. Remover --dangerously-skip-permissions
4. Adicionar testes (Vitest)
5. Rate limiting basico
6. Logging estruturado (Pino)
```

### Fase 3 — Plataforma (3-4 meses)

```
1. Provider abstraction layer (multi-LLM)
   -> Migrar de CLI para SDK como provider default
2. Tool registry system
3. Dashboard de metricas
4. Queue para spawn de agentes (BullMQ)
5. Multi-tenancy basico
6. Redis para EventBus distribuido
```

### Fase 4 — Produto (6+ meses)

```
1. Marketplace de agentes/tools
2. Workflow editor visual (react-flow)
3. API publica
4. Billing e metering
5. Self-hosting / on-prem
```

---

## 12. Arquitetura Alvo (End-Game)

```
+--------------------------------------------------------------+
|                      FRONTEND                                 |
|  Next.js App Router + React 19                               |
|  +----------------+  +----------------+  +-----------------+ |
|  | Team Dashboard |  | Workflow Editor|  |   Marketplace   | |
|  | Agent Monitor  |  | (react-flow)  |  |   (browse/add)  | |
|  +-------+--------+  +-------+-------+  +--------+--------+ |
+-----------|-----------------------|--------------------|----- +
            |                       |                    |
            v                       v                    v
+--------------------------------------------------------------+
|                   API GATEWAY                                 |
|  Next.js Route Handlers + Middleware                         |
|  [Auth] [Rate Limit] [Tenant Isolation] [Validation]        |
+--------------------------------------------------------------+
            |                       |                    |
            v                       v                    v
+-----------------+  +-----------------+  +-----------------+
| ORCHESTRATION   |  | TOOL REGISTRY   |  | MARKETPLACE     |
| ENGINE          |  |                 |  | SERVICE          |
| - Team Manager  |  | - Tool Schema   |  | - Templates     |
| - Agent Lifecycl|  | - Sandboxed Exec|  | - Versioning    |
| - Budget Control|  | - Permissions   |  | - Reviews       |
+--------+--------+  +--------+--------+  +-----------------+
         |                     |
         v                     v
+--------------------------------------------------------------+
|                 PROVIDER ABSTRACTION                          |
|  interface LLMProvider {                                     |
|    stream(prompt, tools[], config): AsyncIterable<Event>     |
|  }                                                           |
|  +-----------+  +---------+  +--------+  +---------------+  |
|  | Anthropic |  | OpenAI  |  | Ollama |  | Custom/Local  |  |
|  | (SDK)     |  | (SDK)   |  | (HTTP) |  | (HTTP)        |  |
|  +-----------+  +---------+  +--------+  +---------------+  |
+--------------------------------------------------------------+
            |                       |                    |
            v                       v                    v
+-----------------+  +-----------------+  +-----------------+
| PostgreSQL      |  | Redis           |  | Object Storage  |
| - Teams/Agents  |  | - EventBus pub/s|  | - Outputs       |
| - Messages      |  | - Queue (BullMQ)|  | - Tool Artifacts|
| - Users/Tenants |  | - Cache         |  | - Logs          |
| - Metricas      |  | - Rate Limiting |  |                 |
+-----------------+  +-----------------+  +-----------------+
```

---

## 13. Stack Tecnologica Recomendada (End-Game)

| Camada | Atual | Recomendado | Justificativa |
|--------|-------|-------------|---------------|
| Framework | Next.js 16 | Next.js 16 (manter) | Ja na versao mais recente, RSC + App Router ideal |
| Auth | Nenhum | NextAuth.js v5 ou Clerk | NextAuth para self-host, Clerk para SaaS rapido |
| DB | In-memory Map | PostgreSQL + Drizzle ORM | Relacional, JSONB para flexibilidade, RLS |
| Cache/PubSub | EventEmitter | Redis | Escala horizontal, pub/sub distribuido, filas |
| Queue | Nenhum | BullMQ (Redis) | Job queue para spawn, retry, scheduling |
| LLM | Claude CLI (child_process) | Anthropic SDK + OpenAI SDK + Ollama | API direta = controle fino, streaming, metricas |
| Monitoring | Nenhum | OpenTelemetry + Grafana | Tracing distribuido, metricas LLM |
| Logging | Nenhum | Pino | Structured JSON, low overhead |
| Testing | Nenhum | Vitest + Playwright | Unit/integration + E2E |
| Storage | Nenhum | S3 / MinIO | Outputs, artifacts, logs |
| Rate Limit | Nenhum | Upstash Redis | Protecao contra abuso |
| Deploy | Local dev | Docker + Railway/Fly.io | Containers para isolamento de agentes |

---

## 14. Riscos Arquiteturais

1. **Dependencia do Claude CLI**: O projeto depende do binario `claude` como runtime. Mudancas de API, rate limiting ou descontinuacao quebram tudo. Migracao para SDK e urgente.

2. **Processos sem isolamento**: Cada agente roda no mesmo host sem sandbox. Em producao, precisa de containers (Docker) para isolamento de seguranca e recursos.

3. **Single-server bottleneck**: EventEmitter e Map<> sao in-process. Impossivel escalar horizontalmente sem Redis/PostgreSQL.

4. **Custo de LLM descontrolado**: Sem metering, cada team spawn gera custos significativos sem visibilidade.

5. **Deploy serverless inviavel**: Processos OS + EventEmitter in-process exigem servidor persistente. Vercel/Cloudflare Workers nao funcionam.

---

## 15. Resumo Executivo

| Dimensao | Nota | Observacao |
|---------|------|-----------|
| Conceito de produto | 9/10 | Orquestracao multi-agente via CLI e engenhosa |
| Qualidade do codigo | 6/10 | Limpo mas com dead code e stubs |
| Debito tecnico | Alto | 22 itens identificados, 5 criticos |
| Escalabilidade | 3/10 | Single-process, sem persistencia |
| Completude de features | 4/10 | ~40% das features anunciadas funcionam |
| Viabilidade do roadmap | Alta | Fundacao solida, debitos trataveis |

**Conclusao:** O agent-orchestrator v0.1 e um MVP funcional com uma aposta arquitetural correta (CLI como executor + event-driven SSE). A base e solida para evolucao. Os debitos criticos (integrar stream-parser, abrir stdin, persistencia, auth) devem ser enderecados antes de features novas. A principal prioridade imediata e integrar o `stream-parser.ts` ao fluxo ativo (ja existe e esta correto) e adicionar persistencia minima via SQLite. A migracao de CLI para SDK e o passo mais estrategico a medio prazo — desbloqueia multi-provider, streaming granular, metricas e controle de custo.

---

*Gerado em: 2026-04-12 | Dev (Arquiteto) — agent-orchestrator v0.2*
