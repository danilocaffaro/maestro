"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";

interface StepTaskDefinitionProps {
  teamName: string;
  task: string;
  onTeamNameChange: (name: string) => void;
  onTaskChange: (task: string) => void;
}

const TASK_SUGGESTIONS = [
  { label: "Implementar feature", text: "Implementar [feature] no projeto ~/Projects/[nome]. " },
  { label: "Corrigir bug", text: "Investigar e corrigir o bug [descricao] em ~/Projects/[nome]. " },
  { label: "Code review", text: "Revisar o codigo em ~/Projects/[nome] focando em seguranca, performance e qualidade. " },
  { label: "Refatorar", text: "Refatorar [modulo] em ~/Projects/[nome] para melhorar legibilidade e manutenibilidade. " },
  { label: "Documentar", text: "Criar documentacao tecnica para ~/Projects/[nome] incluindo arquitetura, APIs e setup. " },
  { label: "Testes", text: "Criar suite de testes abrangente para ~/Projects/[nome] cobrindo unit, integration e e2e. " },
];

export function StepTaskDefinition({ teamName, task, onTeamNameChange, onTaskChange }: StepTaskDefinitionProps) {
  return (
    <WizardStepLayout title="Defina a tarefa" subtitle="Descreva o que o time deve fazer">
      <div className="space-y-5 py-3">
        {/* Team name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Nome do time
          </label>
          <Input
            placeholder="Ex: Feature Auth, Sprint 12, Bug Fix..."
            value={teamName}
            onChange={(e) => onTeamNameChange(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* Task */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Tarefa
          </label>
          <Textarea
            placeholder={"Descreva em detalhes a tarefa do time.\n\nEx: Implementar autenticacao OAuth2 com Google no projeto ~/Projects/myapp.\nO Pesquisador deve encontrar padroes, o Dev implementar, e o Revisor validar qualidade."}
            value={task}
            onChange={(e) => onTaskChange(e.target.value)}
            className="min-h-[200px] text-sm leading-relaxed resize-none"
          />
        </div>

        {/* Contextual suggestions */}
        {!task && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium">Sugestoes rapidas</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TASK_SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => onTaskChange(s.text)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[11px] font-medium border border-border/60",
                    "text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border",
                    "transition-all"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-[10px] text-muted-foreground">
          Dica: inclua caminhos de arquivos, nomes de funcoes, e contexto do projeto para melhores resultados.
        </p>
      </div>
    </WizardStepLayout>
  );
}
