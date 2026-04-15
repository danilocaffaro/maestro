"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DollarSign, Clock, ShieldCheck, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";

interface StepGuardrailsProps {
  maxBudget: number;
  timeout: number;
  approvalGates: boolean;
  executionMode: "parallel" | "sequential" | "graph";
  onMaxBudgetChange: (v: number) => void;
  onTimeoutChange: (v: number) => void;
  onApprovalGatesChange: (v: boolean) => void;
  onExecutionModeChange: (v: "parallel" | "sequential" | "graph") => void;
}

const EXECUTION_MODES = [
  {
    id: "parallel" as const,
    label: "Paralelo",
    desc: "Todos os agentes trabalham ao mesmo tempo",
    icon: "⚡",
  },
  {
    id: "sequential" as const,
    label: "Sequencial",
    desc: "Um agente por vez, na ordem configurada",
    icon: "📋",
  },
  {
    id: "graph" as const,
    label: "Grafo",
    desc: "Baseado em dependencias entre agentes",
    icon: "🔗",
  },
];

export function StepGuardrails({
  maxBudget,
  timeout,
  approvalGates,
  executionMode,
  onMaxBudgetChange,
  onTimeoutChange,
  onApprovalGatesChange,
  onExecutionModeChange,
}: StepGuardrailsProps) {
  return (
    <WizardStepLayout title="Guardrails" subtitle="Configure limites e controles de execucao">
      <div className="space-y-4 py-3 max-w-lg">
        {/* Budget */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Budget maximo</p>
                <p className="text-[11px] text-muted-foreground">Em USD. 0 = sem limite.</p>
              </div>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={maxBudget}
                onChange={(e) => onMaxBudgetChange(Number(e.target.value))}
                className="w-24 h-9 text-sm text-right"
              />
            </div>
          </Card>
        </motion.div>

        {/* Timeout */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Timeout</p>
                <p className="text-[11px] text-muted-foreground">Minutos. Maximo de execucao.</p>
              </div>
              <Input
                type="number"
                min={1}
                max={120}
                value={timeout}
                onChange={(e) => onTimeoutChange(Number(e.target.value))}
                className="w-24 h-9 text-sm text-right"
              />
            </div>
          </Card>
        </motion.div>

        {/* Approval gates */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-sm",
              approvalGates && "border-primary/40 ring-1 ring-primary/20"
            )}
            onClick={() => onApprovalGatesChange(!approvalGates)}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                approvalGates ? "bg-primary/10" : "bg-blue-500/10"
              )}>
                <ShieldCheck className={cn("h-5 w-5", approvalGates ? "text-primary" : "text-blue-500")} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Approval gates (HITL)</p>
                <p className="text-[11px] text-muted-foreground">
                  Pausar antes de acoes criticas para aprovacao humana.
                </p>
              </div>
              <div className={cn(
                "h-5 w-9 rounded-full transition-colors relative shrink-0",
                approvalGates ? "bg-primary" : "bg-muted"
              )}>
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                  approvalGates ? "left-[18px]" : "left-0.5"
                )} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Execution mode */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Modo de execucao</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {EXECUTION_MODES.map((mode) => (
                <Card
                  key={mode.id}
                  className={cn(
                    "p-3 cursor-pointer text-center transition-all hover:shadow-sm",
                    executionMode === mode.id && "border-primary/40 ring-1 ring-primary/20"
                  )}
                  onClick={() => onExecutionModeChange(mode.id)}
                >
                  <span className="text-lg">{mode.icon}</span>
                  <p className="text-xs font-medium mt-1">{mode.label}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{mode.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </WizardStepLayout>
  );
}
