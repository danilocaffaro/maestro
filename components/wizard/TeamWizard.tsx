"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TeamConfig, AgentConfig } from "@/lib/types";
import { ChevronLeft, ChevronRight, Play, Check, LayoutGrid, Users, FileText, Shield, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StepTemplateSelect } from "./StepTemplateSelect";
import { StepAgentConfig } from "./StepAgentConfig";
import { StepTaskDefinition } from "./StepTaskDefinition";
import { StepGuardrails } from "./StepGuardrails";
import { StepReview } from "./StepReview";
import { TEMPLATES } from "@/lib/templates";

const STEPS = [
  { id: 1, label: "Template", icon: LayoutGrid },
  { id: 2, label: "Agentes", icon: Users },
  { id: 3, label: "Tarefa", icon: FileText },
  { id: 4, label: "Guardrails", icon: Shield },
  { id: 5, label: "Lancar", icon: Rocket },
];

interface TeamWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (config: TeamConfig) => void;
  initialTemplateIdx?: number;
}

export function TeamWizard({ open, onClose, onComplete, initialTemplateIdx }: TeamWizardProps) {
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [task, setTask] = useState("");
  const [maxBudget, setMaxBudget] = useState(0);
  const [timeout, setTimeout] = useState(30);
  const [approvalGates, setApprovalGates] = useState(false);
  const [executionMode, setExecutionMode] = useState<"parallel" | "sequential" | "graph">("parallel");
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateIdx ?? -1);

  const selectTemplate = (idx: number) => {
    setSelectedTemplate(idx);
    if (idx >= 0 && idx < TEMPLATES.length) {
      const t = TEMPLATES[idx];
      setTeamName(t.name);
      setAgents([...t.agents]);
      setTask(t.task);
    } else {
      setTeamName("");
      setAgents([]);
      setTask("");
    }
  };

  const canNext = () => {
    switch (step) {
      case 1: return true;
      case 2: return agents.length > 0 && agents.every((a) => a.name.trim());
      case 3: return task.trim().length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const handleLaunch = () => {
    onComplete({
      name: teamName || "Novo Time",
      agents,
      task,
      maxBudget: maxBudget > 0 ? maxBudget : undefined,
      timeout: timeout !== 30 ? timeout : undefined,
      executionMode,
    });
    resetState();
  };

  const resetState = () => {
    setStep(1);
    setTeamName("");
    setAgents([]);
    setTask("");
    setMaxBudget(0);
    setTimeout(30);
    setApprovalGates(false);
    setExecutionMode("parallel");
    setSelectedTemplate(-1);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const goToStep = (s: number) => {
    if (s >= 1 && s <= 5) setStep(s);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="!max-w-3xl !w-[92vw] !h-[82vh] !p-0 flex flex-col !gap-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">Criar Time</DialogTitle>

        {/* Stepper header */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-border bg-muted/20 shrink-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                {i > 0 && (
                  <div className={cn("w-8 h-px mx-1.5 transition-colors", isDone ? "bg-primary" : "bg-border")} />
                )}
                <button
                  onClick={() => isDone && setStep(s.id)}
                  disabled={!isDone && !isActive}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                    isActive && "bg-primary text-primary-foreground shadow-sm",
                    isDone && "text-primary cursor-pointer hover:bg-primary/10",
                    !isActive && !isDone && "text-muted-foreground/50 cursor-default"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden md:inline">{s.label}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {step === 1 && (
                <StepTemplateSelect selected={selectedTemplate} onSelect={selectTemplate} />
              )}

              {step === 2 && (
                <StepAgentConfig agents={agents} onChange={setAgents} />
              )}

              {step === 3 && (
                <StepTaskDefinition
                  teamName={teamName}
                  task={task}
                  onTeamNameChange={setTeamName}
                  onTaskChange={setTask}
                />
              )}

              {step === 4 && (
                <StepGuardrails
                  maxBudget={maxBudget}
                  timeout={timeout}
                  approvalGates={approvalGates}
                  executionMode={executionMode}
                  onMaxBudgetChange={setMaxBudget}
                  onTimeoutChange={setTimeout}
                  onApprovalGatesChange={setApprovalGates}
                  onExecutionModeChange={setExecutionMode}
                />
              )}

              {step === 5 && (
                <StepReview
                  teamName={teamName}
                  agents={agents}
                  task={task}
                  maxBudget={maxBudget}
                  timeout={timeout}
                  approvalGates={approvalGates}
                  executionMode={executionMode}
                  onTeamNameChange={setTeamName}
                  onGoToStep={goToStep}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card shrink-0">
          <Button variant="ghost" size="sm" onClick={() => (step === 1 ? handleClose() : setStep(step - 1))}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> {step === 1 ? "Cancelar" : "Voltar"}
          </Button>
          <span className="text-[11px] text-muted-foreground">
            {step} de {STEPS.length}
          </span>
          {step < 5 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Proximo <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleLaunch}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="h-3.5 w-3.5 mr-1.5" /> Lancar Time
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
