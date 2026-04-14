"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, Code2, Search, Shield, Bug, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const QUICK_TEMPLATES = [
  { icon: Code2, name: "Dev Team", desc: "Pesquisa + Codigo + Review", color: "text-blue-500" },
  { icon: Search, name: "Product Team", desc: "PO + Designer + Dev + Research", color: "text-purple-500" },
  { icon: Shield, name: "Code Review", desc: "Security + Perf + Testes", color: "text-emerald-500" },
  { icon: Bug, name: "Debug Squad", desc: "3 hipoteses em paralelo", color: "text-amber-500" },
];

interface WelcomeScreenProps {
  onOpenCreate: () => void;
}

export function WelcomeScreen({ onOpenCreate }: WelcomeScreenProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg text-center space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-12 w-12 mx-auto text-primary/40" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo ao Maestro</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Orquestre times de agentes de IA para resolver tarefas complexas em paralelo.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {QUICK_TEMPLATES.map((t, i) => (
            <motion.button
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-all hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm"
              onClick={onOpenCreate}
            >
              <t.icon className={`h-5 w-5 ${t.color} shrink-0`} />
              <div>
                <p className="text-xs font-medium">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="pt-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={onOpenCreate}>
            <Zap className="h-3 w-3 mr-1.5" />
            Criar time personalizado
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50">
          Cada agente roda como um Claude Code independente com acesso total a ferramentas.
        </p>
      </motion.div>
    </div>
  );
}
