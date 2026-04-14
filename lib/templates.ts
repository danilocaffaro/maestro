import type { AgentConfig } from "./types";
import { Code2, Search, Shield, Bug, Zap, type LucideIcon } from "lucide-react";

export interface TeamTemplate {
  name: string;
  description: string;
  why: string;
  estimate: string;
  icon: LucideIcon;
  color: string;
  agents: AgentConfig[];
  task: string;
}

export const TEMPLATES: TeamTemplate[] = [
  {
    name: "Dev Team",
    description: "Pesquisa + Codigo + Review",
    why: "Ideal para implementar features. O Pesquisador encontra padroes, o Dev implementa, e o Revisor garante qualidade.",
    estimate: "~10-20min, $1-3",
    icon: Code2,
    color: "text-blue-500",
    agents: [
      { name: "Pesquisador", role: "Pesquisa melhores praticas, libs, padroes e abordagens", model: "claude-sonnet-4-6" },
      { name: "Dev", role: "Implementa codigo de alta qualidade seguindo recomendacoes", model: "claude-sonnet-4-6" },
      { name: "Revisor", role: "Revisa codigo: bugs, edge cases, performance, legibilidade", model: "claude-sonnet-4-6" },
    ],
    task: "",
  },
  {
    name: "Product Team",
    description: "PO + Designer + Dev + Pesquisa",
    why: "4 perspectivas em paralelo: mercado, UX, viabilidade tecnica, e priorizacao. Gera documentos de visao completos.",
    estimate: "~15-30min, $3-6",
    icon: Search,
    color: "text-purple-500",
    agents: [
      { name: "Alice", role: "Product Owner - prioriza features, decide roadmap", model: "claude-sonnet-4-6" },
      { name: "Kai", role: "Designer UI/UX - propoe melhorias visuais e wireframes", model: "claude-sonnet-4-6" },
      { name: "Nova", role: "Pesquisadora - analisa concorrentes e tendencias", model: "claude-sonnet-4-6" },
      { name: "Dev", role: "Arquiteto - avalia viabilidade tecnica e stack", model: "claude-sonnet-4-6" },
    ],
    task: "",
  },
  {
    name: "Code Review",
    description: "Seguranca + Performance + Testes",
    why: "3 revisores especializados capturam mais issues que 1 generalista. Cada um foca em sua expertise.",
    estimate: "~5-15min, $1-2",
    icon: Shield,
    color: "text-emerald-500",
    agents: [
      { name: "Security", role: "Vulnerabilidades OWASP, injection, XSS, auth, secrets", model: "claude-sonnet-4-6" },
      { name: "Performance", role: "Gargalos: N+1, memory leaks, bundle size, caching", model: "claude-sonnet-4-6" },
      { name: "QA", role: "Cobertura de testes, edge cases, error handling, tipos", model: "claude-sonnet-4-6" },
    ],
    task: "",
  },
  {
    name: "Debug Squad",
    description: "3 hipoteses em paralelo",
    why: "3 investigadores testam hipoteses diferentes. A teoria que sobrevive e provavelmente a correta.",
    estimate: "~10-20min, $2-4",
    icon: Bug,
    color: "text-amber-500",
    agents: [
      { name: "Frontend", role: "Investiga: rendering, state management, UI bugs", model: "claude-sonnet-4-6" },
      { name: "Backend", role: "Investiga: API, database, queries, auth", model: "claude-sonnet-4-6" },
      { name: "Infra", role: "Investiga: config, env, deps, network, deploy", model: "claude-sonnet-4-6" },
    ],
    task: "",
  },
  {
    name: "Solo Agent",
    description: "1 agente autonomo",
    why: "Para tarefas simples. Um agente com acesso total, rapido e economico.",
    estimate: "~2-10min, $0.5-1",
    icon: Zap,
    color: "text-cyan-500",
    agents: [
      { name: "Agent", role: "Agente autonomo (Read, Write, Bash, Web)", model: "claude-sonnet-4-6" },
    ],
    task: "",
  },
];
