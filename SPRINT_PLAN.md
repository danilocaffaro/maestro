# Maestro - Sprint Plan

## Diagnostico v0.3 vs Best-in-Class

| Area | Atual | Best-in-class | Gap |
|------|-------|---------------|-----|
| **Visual feedback** | Nenhum (texto estatico) | Typing indicators, pulse animations, skeleton loading | Critico |
| **Diagrama** | Cytoscape basico, estatico | React Flow interativo, draggable, zoom semantico | Alto |
| **Output rendering** | Texto puro, sem formatacao | Markdown renderizado, syntax highlight, collapse | Alto |
| **Info hierarchy** | 5 tabs fragmentadas | Timeline unificada com filtros, collapse inteligente | Alto |
| **Artifacts** | Lista simples com preview raw | Gallery com preview rico, syntax highlight, diff view | Medio |
| **Onboarding** | "Clique em +" | Welcome screen com templates visuais, prompt central | Medio |
| **Animations** | Nenhuma | Framer Motion transitions, status pulse, edge particles | Medio |
| **Design system** | shadcn/ui basico | shadcn/ui completo + motion + custom components | Medio |

## Sprint 1: Visual Feedback + Output Quality (CURRENT)

**Objetivo**: Fazer o app "sentir vivo" - animacoes, markdown rendering, feedback visual.

1. Install framer-motion + react-markdown + react-syntax-highlighter
2. Typing indicator component (pulsing dots when agent is working)
3. Markdown rendering no LiveOutput (com syntax highlight para code blocks)
4. Agent status pulse animation (CSS + framer-motion)
5. Collapse de tool_use/tool_result (clicavel para expandir)
6. Skeleton loading ao carregar team data
7. Welcome screen com templates visuais (empty state redesign)

## Sprint 2: Layout + Info Hierarchy

1. Resizable panels (substituir layout fixo)
2. Timeline unificada (substituir 5 tabs)
3. Filter chips combinaveis
4. Agent identity cards (avatar, modelo, status rico)

## Sprint 3: Artifact Gallery + Rich Preview

1. Markdown preview renderizado
2. Code syntax highlight inline
3. File diff view
4. Download/export artifacts

## Sprint 4: Interactive Canvas

1. Migrar Cytoscape -> React Flow
2. Draggable nodes com cards expandiveis
3. Edge animations com particulas
4. Zoom semantico

---

## Insights das Pesquisas (Atoms.dev, Lovable, Google AI Studio, UX Patterns)

### Atoms.dev
- Status inline no chat (nao em dashboard separado)
- Conductor metaphor (usuario como maestro)
- Race mode: rodar variantes em paralelo e comparar
- Approval gates antes de acoes criticas
- Named agent personas (Alex, Emma, etc.)

### Lovable
- 3 modos integrados: Agent (autonomo), Plan (pensar), Visual Edits (clicar e mudar)
- "Try to Fix" button pro-ativo quando erro detectado
- Progressive disclosure: "Start with idea -> Watch it come alive -> Refine and ship"
- Template-as-Teaching: templates explicam *por que*, nao so *o que*
- Design system ownership: `.lovable/` folder com regras modulares
- Sandbox preview com status messaging claro

### Google AI Studio / Stitch
- DESIGN.md como manifesto de design system legivel por maquina
- Infinite canvas para explorar variantes em paralelo
- Annotation mode: highlight UI e descrever mudanca desejada
- 3-panel layout: Config + Canvas + AI Assistant simultaneos
- Vibe Design: descrever feeling/objetivo, nao componentes especificos
- Multi-screen generation: ate 5 telas interconectadas de uma vez
- URL-based design extraction: colar URL e extrair design system

### UX Patterns Best-in-Class
- Glassmorphism 2.0: paineis frosted glass com backdrop-blur
- Motion variants library: animacoes consistentes centralizadas
- Cost-aware delegation: mostrar custo antes de executar
- Streaming text reduz perceived wait por 55-70%
- Split-panel timeline: left=agents, right=timeline
- A2UI (Google): specs declarativas em JSON, nao codigo
- prefers-reduced-motion para acessibilidade

### Backlog Priorizado (baseado nas pesquisas)
1. P2P 1-1 message relay entre agentes
2. Race mode (variantes paralelas)
3. 3 modos (Agent/Plan/Visual) como Lovable
4. Resizable panels
5. Timeline unificada com filtros combinaveis
6. Approval gates com "Try to Fix" pro-ativo
7. DESIGN.md como manifesto visual
8. Infinite canvas (React Flow)
9. Template-as-Teaching (descricoes ricas)
10. Agent marketplace community
