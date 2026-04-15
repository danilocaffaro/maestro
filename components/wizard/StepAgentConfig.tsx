"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MODELS } from "@/lib/types";
import type { AgentConfig, ModelId } from "@/lib/types";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";

interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
  installed: boolean;
  version: string | null;
}

interface StepAgentConfigProps {
  agents: AgentConfig[];
  onChange: (agents: AgentConfig[]) => void;
}

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

const ROLE_SUGGESTIONS = [
  "Pesquisa melhores praticas, libs, padroes e abordagens",
  "Implementa codigo de alta qualidade seguindo recomendacoes",
  "Revisa codigo: bugs, edge cases, performance, legibilidade",
  "Product Owner - prioriza features, decide roadmap",
  "Designer UI/UX - propoe melhorias visuais e wireframes",
  "Arquiteto - avalia viabilidade tecnica e stack",
  "QA - testes, edge cases, error handling, cobertura",
  "Security - vulnerabilidades OWASP, injection, auth, secrets",
];

export function StepAgentConfig({ agents, onChange }: StepAgentConfigProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => setProviders(data.filter((p: ProviderInfo) => p.installed)))
      .catch(() => {});
  }, []);

  const updateAgent = (idx: number, updates: Partial<AgentConfig>) => {
    onChange(agents.map((a, i) => (i === idx ? { ...a, ...updates } : a)));
  };

  const addAgent = () => {
    onChange([...agents, { name: "", role: "", model: "claude-sonnet-4-6" as ModelId }]);
  };

  const removeAgent = (idx: number) => {
    onChange(agents.filter((_, i) => i !== idx));
    if (expandedPrompt === idx) setExpandedPrompt(null);
  };

  const moveAgent = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= agents.length) return;
    const newAgents = [...agents];
    [newAgents[idx], newAgents[newIdx]] = [newAgents[newIdx], newAgents[idx]];
    onChange(newAgents);
  };

  return (
    <WizardStepLayout
      title="Configure os agentes"
      subtitle={`${agents.length} agente${agents.length !== 1 ? "s" : ""} configurado${agents.length !== 1 ? "s" : ""}`}
    >
      <div className="space-y-3 py-2">
        <AnimatePresence mode="popLayout">
          {agents.map((agent, idx) => {
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const initial = agent.name ? agent.name.charAt(0).toUpperCase() : "?";
            const isPromptExpanded = expandedPrompt === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <Card className="p-4 transition-shadow hover:shadow-sm">
                  <div className="flex gap-3">
                    {/* Avatar + reorder */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white transition-transform hover:scale-105",
                        avatarColor
                      )}>
                        {initial}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveAgent(idx, -1)}
                          disabled={idx === 0}
                          className="text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-0 transition-all"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveAgent(idx, 1)}
                          disabled={idx === agents.length - 1}
                          className="text-muted-foreground/50 hover:text-muted-foreground disabled:opacity-0 transition-all"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="flex-1 space-y-2.5 min-w-0">
                      {/* Name + delete */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do agente"
                          value={agent.name}
                          onChange={(e) => updateAgent(idx, { name: e.target.value })}
                          className="h-8 text-sm font-medium"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeAgent(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Role */}
                      <Textarea
                        placeholder="Papel/responsabilidade do agente..."
                        value={agent.role}
                        onChange={(e) => updateAgent(idx, { role: e.target.value })}
                        className="min-h-[48px] text-xs resize-none"
                      />

                      {/* Role suggestions (when role is empty) */}
                      {!agent.role && (
                        <div className="flex flex-wrap gap-1">
                          {ROLE_SUGGESTIONS.slice(0, 4).map((s) => (
                            <button
                              key={s}
                              onClick={() => updateAgent(idx, { role: s })}
                              className="rounded-full px-2 py-0.5 text-[9px] text-muted-foreground border border-border/50 hover:bg-accent hover:text-foreground transition-colors truncate max-w-[160px]"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Model selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground shrink-0">Modelo:</span>
                        <div className="flex gap-1">
                          {MODELS.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => updateAgent(idx, { model: m.id })}
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-colors",
                                agent.model === m.id
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "text-muted-foreground border-border hover:bg-accent"
                              )}
                            >
                              {m.short}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Provider selector (if multiple installed) */}
                      {providers.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground shrink-0">Provider:</span>
                          <div className="flex gap-1">
                            {providers.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => updateAgent(idx, { provider: p.id })}
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-medium border transition-colors",
                                  (agent.provider || "claude-code") === p.id
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "text-muted-foreground border-border hover:bg-accent"
                                )}
                              >
                                {p.icon} {p.name.split(" ")[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* System prompt toggle */}
                      <button
                        onClick={() => setExpandedPrompt(isPromptExpanded ? null : idx)}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={cn("h-3 w-3 transition-transform", isPromptExpanded && "rotate-180")} />
                        System prompt {agent.systemPrompt ? "(customizado)" : "(opcional)"}
                      </button>

                      <AnimatePresence>
                        {isPromptExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                          >
                            <Textarea
                              placeholder="Instrucoes customizadas para este agente... (deixe vazio para usar o padrao)"
                              value={agent.systemPrompt || ""}
                              onChange={(e) => updateAgent(idx, { systemPrompt: e.target.value || undefined })}
                              className="min-h-[80px] text-xs resize-none font-mono"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <Button variant="outline" className="w-full h-9" onClick={addAgent}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Adicionar agente
        </Button>
      </div>
    </WizardStepLayout>
  );
}
