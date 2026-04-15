"use client";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { AgentConfig } from "@/lib/types";
import { Users, FileText, DollarSign, Clock, ShieldCheck, GitBranch, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";

interface StepReviewProps {
  teamName: string;
  agents: AgentConfig[];
  task: string;
  maxBudget: number;
  timeout: number;
  approvalGates: boolean;
  executionMode: "parallel" | "sequential" | "graph";
  onTeamNameChange: (name: string) => void;
  onGoToStep: (step: number) => void;
}

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

const MODE_LABELS: Record<string, string> = {
  parallel: "Paralelo",
  sequential: "Sequencial",
  graph: "Grafo",
};

export function StepReview({
  teamName,
  agents,
  task,
  maxBudget,
  timeout,
  approvalGates,
  executionMode,
  onTeamNameChange,
  onGoToStep,
}: StepReviewProps) {
  return (
    <WizardStepLayout title="Revisar e lancar" subtitle="Confira tudo antes de iniciar">
      <div className="space-y-5 py-3">
        {/* Team name */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Nome do time
          </label>
          <Input
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            className="h-10 text-base font-semibold"
          />
        </motion.div>

        <Separator />

        {/* Agents summary */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              {agents.length} agente{agents.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => onGoToStep(2)}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              <Pencil className="h-2.5 w-2.5" /> Editar
            </button>
          </div>
          <div className="grid gap-2">
            {agents.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 bg-card"
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                    AVATAR_COLORS[i % AVATAR_COLORS.length]
                  )}
                >
                  {a.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.name || "Sem nome"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{a.role}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {a.model?.includes("opus") ? "Opus" : a.model?.includes("haiku") ? "Haiku" : "Sonnet"}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>

        <Separator />

        {/* Task summary */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Tarefa
            </p>
            <button
              onClick={() => onGoToStep(3)}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              <Pencil className="h-2.5 w-2.5" /> Editar
            </button>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground/80 max-h-[120px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {task || "Nenhuma tarefa definida"}
          </div>
        </motion.div>

        {/* Guardrails summary */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Separator className="mb-5" />
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">Guardrails</p>
            <button
              onClick={() => onGoToStep(4)}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              <Pencil className="h-2.5 w-2.5" /> Editar
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
              {maxBudget > 0 ? `$${maxBudget}` : "Sem limite"}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              {timeout}min
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
              <ShieldCheck className={cn("h-3.5 w-3.5", approvalGates ? "text-primary" : "text-muted-foreground/50")} />
              {approvalGates ? "HITL ativo" : "Sem HITL"}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-3 py-1.5">
              <GitBranch className="h-3.5 w-3.5 text-blue-500" />
              {MODE_LABELS[executionMode] || executionMode}
            </span>
          </div>
        </motion.div>
      </div>
    </WizardStepLayout>
  );
}
