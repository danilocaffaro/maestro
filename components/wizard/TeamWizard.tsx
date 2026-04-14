"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TeamConfig, AgentConfig } from "@/lib/types";
import { ChevronLeft, ChevronRight, Play, Check, LayoutGrid, Users, FileText, Shield, Rocket, DollarSign, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";
import { StepTemplateSelect } from "./StepTemplateSelect";
import { StepAgentConfig } from "./StepAgentConfig";
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
    });
    setStep(1); setTeamName(""); setAgents([]); setTask(""); setMaxBudget(0); setTimeout(30); setSelectedTemplate(-1);
  };

  const handleClose = () => { setStep(1); onClose(); };

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
                {i > 0 && <div className={cn("w-8 h-px mx-1.5", isDone ? "bg-primary" : "bg-border")} />}
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
              {step === 1 && <StepTemplateSelect selected={selectedTemplate} onSelect={selectTemplate} />}

              {step === 2 && <StepAgentConfig agents={agents} onChange={setAgents} />}

              {step === 3 && (
                <WizardStepLayout title="Defina a tarefa" subtitle="Descreva o que o time deve fazer">
                  <div className="space-y-4 py-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do time</label>
                      <Input
                        placeholder="Ex: Feature Auth, Sprint 12, Bug Fix..."
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tarefa</label>
                      <Textarea
                        placeholder={"Descreva em detalhes a tarefa do time.\n\nEx: Implementar autenticacao OAuth2 com Google no projeto ~/Projects/myapp.\nO Pesquisador deve encontrar padroes, o Dev implementar, e o Revisor validar qualidade."}
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        className="min-h-[200px] text-sm leading-relaxed resize-none"
                      />
                      <p className="text-[10px] text-muted-foreground mt-2">
                        Dica: inclua caminhos de arquivos, nomes de funcoes, e contexto do projeto.
                      </p>
                    </div>
                  </div>
                </WizardStepLayout>
              )}

              {step === 4 && (
                <WizardStepLayout title="Guardrails" subtitle="Configure limites de custo e tempo">
                  <div className="space-y-4 py-3 max-w-md">
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
                          onChange={(e) => setMaxBudget(Number(e.target.value))}
                          className="w-24 h-9 text-sm text-right"
                        />
                      </div>
                    </Card>
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
                          onChange={(e) => setTimeout(Number(e.target.value))}
                          className="w-24 h-9 text-sm text-right"
                        />
                      </div>
                    </Card>
                  </div>
                </WizardStepLayout>
              )}

              {step === 5 && (
                <WizardStepLayout title="Revisar e lancar" subtitle="Confira tudo antes de iniciar">
                  <div className="space-y-5 py-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome do time</label>
                      <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-10 text-base font-semibold" />
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">{agents.length} agente(s)</p>
                      <div className="grid gap-2">
                        {agents.map((a, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", ["bg-blue-500","bg-emerald-500","bg-amber-500","bg-purple-500","bg-pink-500"][i % 5])}>
                              {a.name?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{a.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{a.role}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {a.model?.includes("opus") ? "Opus" : a.model?.includes("haiku") ? "Haiku" : "Sonnet"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">Tarefa</p>
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground/80 max-h-[120px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                        {task || "Nenhuma tarefa definida"}
                      </div>
                    </div>

                    {(maxBudget > 0 || timeout !== 30) && (
                      <>
                        <Separator />
                        <div className="flex gap-6 text-sm text-muted-foreground">
                          {maxBudget > 0 && (
                            <span className="flex items-center gap-1.5">
                              <DollarSign className="h-4 w-4 text-emerald-500" /> Budget: ${maxBudget}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-amber-500" /> Timeout: {timeout}min
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </WizardStepLayout>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card shrink-0">
          <Button variant="ghost" size="sm" onClick={() => step === 1 ? handleClose() : setStep(step - 1)}>
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
            <Button size="sm" onClick={handleLaunch} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Play className="h-3.5 w-3.5 mr-1.5" /> Lancar Time
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
