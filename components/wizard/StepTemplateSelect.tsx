"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TEMPLATES } from "@/lib/templates";
import { Users, Check, Sparkles, Clock, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { WizardStepLayout } from "./WizardStepLayout";

interface StepTemplateSelectProps {
  selected: number;
  onSelect: (idx: number) => void;
}

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

export function StepTemplateSelect({ selected, onSelect }: StepTemplateSelectProps) {
  return (
    <WizardStepLayout
      title="Escolha um template"
      subtitle="Selecione um modelo de time ou comece do zero"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
        {TEMPLATES.map((t, i) => {
          const Icon = t.icon;
          const isSelected = selected === i;
          return (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              <Card
                className={cn(
                  "relative cursor-pointer p-5 transition-all hover:shadow-md hover:border-primary/30 group",
                  isSelected && "border-primary shadow-lg ring-2 ring-primary/20"
                )}
                onClick={() => onSelect(i)}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </motion.div>
                )}

                {/* Header: icon + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                    t.color.replace("text-", "bg-").replace("500", "500/15"),
                    t.color
                  )}>
                    <Icon className="h-5.5 w-5.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold leading-tight">{t.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </div>

                {/* Why */}
                <p className="text-xs text-muted-foreground/80 leading-relaxed mb-3">
                  {t.why}
                </p>

                {/* Agent avatars preview */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex -space-x-1.5">
                    {t.agents.map((agent, ai) => (
                      <div
                        key={ai}
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-card",
                          AVATAR_COLORS[ai % AVATAR_COLORS.length]
                        )}
                        title={agent.name}
                      >
                        {agent.name.charAt(0)}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-1">
                    {t.agents.map((a) => a.name).join(", ")}
                  </span>
                </div>

                {/* Footer: estimate */}
                <div className="flex items-center gap-3 pt-2.5 border-t border-border/50">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {t.agents.length} agente{t.agents.length > 1 ? "s" : ""}
                  </div>
                  <Badge variant="secondary" className="text-[9px] h-4 gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {t.estimate}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          );
        })}

        {/* From Scratch */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: TEMPLATES.length * 0.06, duration: 0.25 }}
        >
          <Card
            className={cn(
              "cursor-pointer p-5 transition-all hover:shadow-md hover:border-primary/30 border-dashed h-full flex flex-col justify-center",
              selected === -1 && "border-primary shadow-lg ring-2 ring-primary/20"
            )}
            onClick={() => onSelect(-1)}
          >
            {selected === -1 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3"
              >
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </motion.div>
            )}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-muted text-muted-foreground shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Do zero</h3>
                <p className="text-xs text-muted-foreground">Monte seu time personalizado</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Escolha agentes, modelos, providers e configure cada papel manualmente.
            </p>
          </Card>
        </motion.div>
      </div>
    </WizardStepLayout>
  );
}
