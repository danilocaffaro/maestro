"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MODELS } from "@/lib/types";
import type { AgentConfig, ModelId } from "@/lib/types";
import { Plus, Trash2, Bot } from "lucide-react";
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

export function StepAgentConfig({ agents, onChange }: StepAgentConfigProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

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

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <Card className="p-3">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mt-1", avatarColor)}>
                      {initial}
                    </div>

                    {/* Fields */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nome do agente"
                          value={agent.name}
                          onChange={(e) => updateAgent(idx, { name: e.target.value })}
                          className="h-8 text-sm font-medium"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeAgent(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Textarea
                        placeholder="Papel/responsabilidade do agente..."
                        value={agent.role}
                        onChange={(e) => updateAgent(idx, { role: e.target.value })}
                        className="min-h-[48px] text-xs resize-none"
                      />

                      {/* Model selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground shrink-0">Modelo:</span>
                        <div className="flex gap-1">
                          {MODELS.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => updateAgent(idx, { model: m.id })}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors",
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
                                  "rounded-full px-2 py-0.5 text-[10px] font-medium border transition-colors",
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
