# PRODUCT VISION — Maestro

> *Documento de visão de produto. Sintetizado por Alice (PO) a partir das contribuições de Nova (Research), Kai (UX) e Dev (Tech). Versão 1.0 — 2026-04-12.*

---

## Nome do Produto

**Maestro**

*Do italiano: aquele que rege e coordena. Curto, memorável, sem ambiguidade de categoria — evoca precisamente o que o produto faz: conduzir times de agentes de IA com controle e clareza.*

---

## Proposta de Valor

> **Maestro é o único ambiente onde você orquestra times de agentes de IA do protótipo à produção — sem trocar de framework.**

---

## O que existe hoje (v0.1)

O Maestro hoje é um MVP funcional construído sobre uma aposta arquitetural correta: usar o Claude CLI como executor nativo de agentes, expondo uma GUI web em Next.js sobre ele.

**O que funciona:**
- Spawn paralelo de múltiplos agentes via processos OS
- Streaming em tempo real via SSE (Server-Sent Events)
- Visualização do grafo de agentes com animação (Cytoscape)
- Color coding e status dots por agente no feed de mensagens
- Stop de times via SIGTERM
- Theme toggle dark/light

**O que não funciona (ainda):**
- `sendMessage()` é um stub visual — stdin dos processos está fechado
- Task tracking não opera no fluxo ativo (parser rico está dead code)
- Artefatos gerados pelos agentes não são exibidos na UI
- Todo estado morre quando a página recarrega (sem persistência)
- ~60% das features anunciadas são stubs ou parcialmente quebradas

**Diagnóstico:** conceito 9/10, completude de features 4/10. Os débitos são tratáveis em 2–3 sprints sem rewrite total. A fundação é sólida.

---

## Visão End-Game

O Maestro se torna o **Command Center padrão para times de IA em produção** — o ambiente onde engenheiros e tech leads delegam trabalho complexo a times de agentes com a mesma confiança que usam GitHub Actions para CI/CD.

**O mercado em 2026 está polarizado:**
- Lado fácil (CrewAI, Flowise, Dify): rápido para prototipar, frágil para produção
- Lado poderoso (LangGraph, MS Agent Framework): controle fino, curva de aprendizado alta

**Nenhum player ocupa o meio: fácil de começar E robusto para produção.**

Maestro ocupa esse espaço. A mesma configuração que roda no laptop do dev roda em produção com reliability enterprise. A interface que o orquestrador usa é a mesma que o stakeholder não-técnico entende.

**Três pilares do end-game:**

1. **Output-First UI** — artefatos gerados pelos agentes (arquivos, código, docs) são o centro da tela, não logs de execução
2. **Observabilidade Nativa** — tracing, timeline de eventos, cost tracking por agente, sem dependência de ferramentas externas
3. **Governança Declarativa** — políticas de human-in-the-loop por nível de risco, audit trails imutáveis, compliance EU AI Act out-of-the-box

---

## Roadmap em 3 Fases

### Fase 1 — MVP (v1.0): Fazer funcionar de verdade

**Objetivo:** Corrigir os débitos críticos e entregar a experiência core que o produto promete mas não cumpre.

**Prazo estimado:** 2–3 sprints

#### Correções de backend (Dev — prioridade máxima)

| # | Feature | Débito resolvido | Impacto |
|---|---------|-----------------|---------|
| B1 | Integrar `stream-parser.ts` ao fluxo ativo de `cli-manager.ts` | D1 Crítico | Task tracking e peer messages passam a funcionar |
| B2 | Abrir stdin dos processos — `sendMessage()` real | D2 Crítico | Humano pode genuinamente direcionar agentes |
| B3 | SQLite via `better-sqlite3` para persistência de teams e mensagens | D4 Alto | Estado sobrevive a reloads e restarts |
| B4 | Mover `lastActiveAgent` para closure por team | D3 Alto | Elimina race condition em times concorrentes |
| B5 | Passar flag `--model` ao spawn quando `agentConfig.model` definido | parcial | Seleção de modelo passa a funcionar |
| B6 | `crypto.randomUUID()` em vez de `Math.random()` | D8 | IDs seguros |
| B7 | Budget tracking básico via contagem de tokens do stream-json | D7 | Visibilidade de custo por agente |

#### Redesign de UI (Kai — prioridade máxima)

| # | Feature | Problema resolvido | Componente |
|---|---------|------------------|------------|
| U1 | **Artifact Explorer** — lista e preview inline de arquivos gerados | "Outputs" nunca mostra conteúdo real | `ArtifactExplorer.tsx` |
| U2 | **Layout de painéis resizáveis** — substituir 5 tabs por painéis simultâneos | Fragmentação que impede visão simultânea | `ResizablePanel.tsx` + refactor `page.tsx` |
| U3 | **Empty State com onboarding** — prompt central + 3–5 templates | Alta barreira de entrada, zero orientação | `WelcomeScreen.tsx` + `TemplateGallery.tsx` |
| U4 | **Human-in-the-Loop Banner** — banner proeminente quando agente pede decisão | HITL enterrado em tab de Chat | `HumanInputBanner.tsx` |
| U5 | **Network Graph interativo** — click em nó, hover tooltip, zoom/pan | Diagrama decorativo em 220px fixo | Refactor `AgentFlowDiagram.tsx` |

#### APIs necessárias (Dev)

- `GET /api/teams/:id/artifacts` — lista arquivos criados pelos agentes
- `GET /api/teams/:id/artifacts/:filename` — conteúdo do arquivo
- `GET /api/teams/:id/timeline` — eventos ordenados por tempo

**Meta de v1.0:** Features funcionando: de 40% → 85%. Criação do primeiro time: de ~3min → <60s.

---

### Fase 2 — Produto (v1.5): Command Center real

**Objetivo:** Transformar Maestro no ambiente de referência para orquestrar times de IA em trabalho real (não apenas demos).

**Prazo estimado:** 3–4 sprints após v1.0

#### Features de produto

| # | Feature | Valor | Origem |
|---|---------|-------|--------|
| P1 | **Layout 3 colunas** (Teams / Workspace / Context Panel) | Visão simultânea de times, agentes e timeline | Kai UX §4 |
| P2 | **Agent Personas** — avatar, role legível, last seen, card de detalhes | Agentes com identidade, não ícones genéricos | Kai UX §5.2 |
| P3 | **Execution Timeline** — linha do tempo filtrada por agente e tipo de evento | Observabilidade sem ruído: entender o que aconteceu sem ler cada log | Kai UX §5.3 |
| P4 | **Histórico de execuções** — lista de runs anteriores, replay de estado congelado | Zero retenção hoje → 100% com persistência | Kai UX §5.5 + Dev D4 |
| P5 | **Split terminal por agente** no Live Stream | Side-by-side de 2 agentes simultâneos | Kai UX §5.4 |
| P6 | **Pause/resume de times** | Controle cirúrgico sem matar o processo | Dev roadmap |
| P7 | **Dashboard de custo por agente** — tokens, spend estimado, alertas | Gap crítico de mercado: FinOps para agentes | Nova Gap/Tendência |
| P8 | **Seleção de modelo por agente** | Otimizar custo vs. capacidade por role | Dev parcial |
| P9 | **Task assignment por API** — PATCH /api/tasks/:id | Task tracking completo end-to-end | Dev stub |

**Meta de v1.5:** Features funcionando: 100%. Tempo para produção: 10x menor que LangGraph. Zero ferramentas externas para observabilidade.

---

### Fase 3 — Plataforma (v2.0): Ecossistema

**Objetivo:** Maestro deixa de ser uma ferramenta e se torna a plataforma padrão de orquestração de agentes para equipes.

**Prazo estimado:** 6+ meses após v1.5

#### Features de plataforma

| # | Feature | Valor estratégico | Origem |
|---|---------|-----------------|--------|
| E1 | **Template Gallery + Marketplace** — templates de times compartilháveis por domínio | Reduz barreira de entrada para zero; cria efeito de rede | Kai UX §5 Fase 3 |
| E2 | **Colaboração multi-usuário** — múltiplos humanos no mesmo run em tempo real | Orquestrador + observador (stakeholder não-técnico) | Kai UX §5.2 + Nova persona |
| E3 | **Camada de Governança** — políticas declarativas de HITL por nível de risco, audit trails | EU AI Act (agosto 2026); financial/healthtech/govtech | Nova Gap 3 |
| E4 | **Sandboxing de execução** — Docker/nsjail por agente | Elimina `--dangerously-skip-permissions`; viabiliza SaaS multi-tenant | Dev D6 |
| E5 | **Branching de execução** — fork de run em andamento para testar instrução alternativa | Experimentação sem parar produção | Kai UX §5.4 |
| E6 | **Webhooks e integrações** — Slack, GitHub, Notion; notificações push de HITL | Maestro integrado no workflow existente das equipes | Kai UX §5.5 |
| E7 | **Arquitetura distribuída** — Agent Runner Service separado + Redis Streams | Escala horizontal; viabiliza Vercel/cloud deploy | Dev §7 |
| E8 | **Compliance reporting** — relatórios EU AI Act, trilhas de auditoria imutáveis | Diferencial para regulated sectors | Nova Gap 3 + Tendência 3.4 |
| E9 | **Agent Marketplace** — composição visual drag-and-drop de times | Orquestração para não-desenvolvedores | Kai UX §5.3 |

---

## Métricas de Sucesso

### UX (Kai)

| Métrica | Hoje (v0.1) | Meta v1.0 | Meta v2.0 |
|---------|------------|-----------|-----------|
| Tempo para criar primeiro time | ~3min (formulário manual) | <60s (template ou prompt) | <20s (voz/texto) |
| Cliques para ver output de um agente | 4–6 | 2 (Artifact Explorer) | 1 (output surfaçado automaticamente) |
| Estado do time ao recarregar a página | Perde tudo (0%) | 100% preservado (SQLite) | 100% (cloud sync) |
| Onboarding sem documentação | ~20% conseguem | ~80% (empty state guia) | ~95% (onboarding interativo) |

### Produto (Nova / Alice)

| Métrica | Meta | Referência |
|---------|------|-----------|
| Tempo de prototipo | ≤ CrewAI (minutos) | CrewAI é benchmark de velocidade |
| Tempo para produção | 10x menor que LangGraph | LangGraph é benchmark de poder |
| Ferramentas externas para observabilidade | Zero | LangSmith é a alternativa atual |
| EU AI Act compliance | Out-of-the-box (v2.0) | Deadline: agosto 2026 |
| Features funcionando | 40% → 85% (v1.0) → 100% (v1.5) | Dev auditoria atual |

### Engenharia (Dev)

| Métrica | Meta v1.0 | Meta v1.5 |
|---------|-----------|-----------|
| Débitos críticos resolvidos | 3/3 (D1, D2, D3) | Todos os 10 |
| Cobertura de testes | baseline estabelecido | >70% core paths |
| Tempo de boot de agente | atual (sem regressão) | <500ms (process pool) |

### Mercado (longo prazo)

- Times de engenharia (5–50 devs) construindo produtos com agentes como mercado primário
- Empresas em setores regulados (fintech, healthtech, govtech) como mercado secundário
- GitHub stars como sinal de adoção na comunidade de devtools

---

## Créditos do Time

| Papel | Nome | Contribuição |
|-------|------|-------------|
| Product Owner | **Alice** | Síntese estratégica, roadmap, priorização, este documento |
| Research | **Nova** | Análise competitiva, dores de usuário, tendências de mercado, gaps de oportunidade |
| UX Design | **Kai** | Diagnóstico de experiência atual, princípios de design, arquitetura de UI, wireframes |
| Tech Lead | **Dev** | Análise de arquitetura, mapeamento de débitos técnicos, viabilidade de features, proposta de evolução |

---

*Maestro — da ideia ao time em produção, sem fricção.*
*PRODUCT_VISION.md v1.0 — 2026-04-12*
