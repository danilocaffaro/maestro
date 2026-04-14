"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/templates";
import { Users, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";

interface StepTemplateSelectProps {
  selected: number;
  onSelect: (idx: number) => void;
}

export function StepTemplateSelect({ selected, onSelect }: StepTemplateSelectProps) {
  return (
    <WizardStepLayout
      title="Escolha um template"
      subtitle="Selecione um modelo de time ou comece do zero"
    >
      <div className="grid grid-cols-2 gap-3 py-2">
        {TEMPLATES.map((t, i) => {
          const Icon = t.icon;
          const isSelected = selected === i;
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={cn(
                  "relative cursor-pointer p-4 transition-all hover:shadow-md hover:border-primary/30",
                  isSelected && "border-primary shadow-md ring-2 ring-primary/20"
                )}
                onClick={() => onSelect(i)}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center bg-muted", t.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/80 mt-3 leading-relaxed">{t.why}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {t.agents.length} agente{t.agents.length > 1 ? "s" : ""}
                  </div>
                  <Badge variant="secondary" className="text-[9px] h-4">{t.estimate}</Badge>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* Custom / From Scratch */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: TEMPLATES.length * 0.05 }}
        >
          <Card
            className={cn(
              "cursor-pointer p-4 transition-all hover:shadow-md hover:border-primary/30 border-dashed",
              selected === -1 && "border-primary shadow-md ring-2 ring-primary/20"
            )}
            onClick={() => onSelect(-1)}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Do zero</h3>
                <p className="text-xs text-muted-foreground">Monte seu time personalizado</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </WizardStepLayout>
  );
}
