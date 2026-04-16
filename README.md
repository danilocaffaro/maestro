# Maestro

> Orquestre times de agentes de IA do prototipo a producao, sem trocar de framework.

**Maestro** e uma plataforma web para criar, orquestrar e monitorar times de agentes de IA trabalhando em paralelo. Cada agente roda como um processo Claude Code independente com acesso total a ferramentas.

## Features

- **Team Creation Wizard** - 5 steps: Template > Agents > Task > Guardrails > Launch
- **5 Templates** - Dev Team, Product Team, Code Review, Debug Squad, Solo Agent
- **React Flow Canvas** - Nodes draggable com agent cards, edge animation, minimap
- **Unified Timeline** - Filter chips, markdown rendering, inline thinking, tool collapse
- **Artifact Explorer** - Multi-tab file preview com syntax highlight
- **Cost Dashboard** - Tracking per-agent com bar charts
- **Kanban Tasks** - 6 stages (inbox > assigned > in_progress > testing > review > done)
- **Execution Graph** - Parallel, sequential, or dependency-based agent execution
- **Race Mode** - Compare models side-by-side (Sonnet vs Opus vs Haiku)
- **Auto-Discovery** - Detecta Claude Code, OpenClaw, Ollama automaticamente
- **Scheduler** - Cron-like scheduling para times recorrentes
- **Webhooks** - Notifica Slack/Discord/custom URLs em eventos
- **Auth** - Senha com hash SHA-256, sessoes 7 dias, localhost bypass
- **PWA** - Installavel no mobile como app nativo

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | shadcn/ui, Tailwind CSS 4, Framer Motion |
| Canvas | @xyflow/react (React Flow) |
| Markdown | react-markdown + remark-gfm |
| Charts | Recharts |
| Database | SQLite (better-sqlite3) |
| Backend | Claude Code CLI (each agent = `claude -p` process) |
| Streaming | Server-Sent Events (SSE) |
| Deploy | Oracle Cloud Free Tier + Cloudflare Tunnel + Caddy + PM2 |

## Quick Start

```bash
git clone https://github.com/danilocaffaro/maestro.git
cd maestro
npm install
npm run dev
open http://localhost:3000
```

## Deploy

```bash
./deploy/setup.sh          # Setup Oracle VM
./deploy/deploy.sh         # Build + sync + restart
./deploy/tunnel-setup.sh   # Cloudflare Tunnel
```

## API

| Endpoint | Description |
|----------|-------------|
| `/api/teams` | CRUD teams + spawn agents |
| `/api/stream/[id]` | Real-time SSE event stream |
| `/api/artifacts/[id]` | Files created by agents |
| `/api/costs/[id]` | Cost tracking per agent |
| `/api/providers` | Auto-discovered agent CLIs |
| `/api/health` | System health + heartbeats |
| `/api/auth` | Login/setup password |
| `/api/schedules` | Cron scheduler |
| `/api/races` | Model comparison |
| `/api/webhooks` | External notifications |

## Docs

- [PRODUCT_VISION.md](PRODUCT_VISION.md) - Product vision and roadmap
- [RESEARCH.md](RESEARCH.md) - Competitive analysis
- [UX_VISION.md](UX_VISION.md) - UX analysis and wireframes
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical architecture
- [BACKLOG.md](BACKLOG.md) - Prioritized backlog + benchmarks
- [SPRINT_PLAN.md](SPRINT_PLAN.md) - Sprint planning

## Contributing

1. Fork the repo
2. Create feature branch from `develop`: `git checkout -b feat/my-feature develop`
3. Commit with conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
4. Push and open PR to `develop`
5. After review, merge to `develop`
6. Release: merge `develop` to `main`

## License

MIT
