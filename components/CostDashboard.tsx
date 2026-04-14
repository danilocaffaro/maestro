"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DollarSign, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface CostData {
  perAgent: { agent: string; model: string; inputTokens: number; outputTokens: number; totalCost: number }[];
  total: { totalCost: number; totalInput: number; totalOutput: number };
}

interface CostDashboardProps {
  teamId: string | null;
}

function formatCost(n: number): string {
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n > 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n > 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export function CostDashboard({ teamId }: CostDashboardProps) {
  const [cost, setCost] = useState<CostData | null>(null);

  useEffect(() => {
    if (!teamId) { setCost(null); return; }
    const load = () => {
      fetch(`/api/costs/${teamId}`).then((r) => r.json()).then(setCost).catch(() => {});
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [teamId]);

  if (!teamId || !cost) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <BarChart3 className="h-8 w-8 mx-auto opacity-30" />
          <p className="text-sm">Selecione um time para ver custos</p>
        </div>
      </div>
    );
  }

  const totalTokens = cost.total.totalInput + cost.total.totalOutput;
  const maxAgentCost = Math.max(...cost.perAgent.map((a) => a.totalCost), 0.01);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-lg font-bold">{formatCost(cost.total.totalCost)}</p>
                <p className="text-[9px] text-muted-foreground">Custo total</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-lg font-bold">{formatTokens(totalTokens)}</p>
                <p className="text-[9px] text-muted-foreground">Tokens total</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Per-agent breakdown with bar chart */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Por agente</p>
          <div className="space-y-2">
            {cost.perAgent.map((agent) => {
              const pct = (agent.totalCost / maxAgentCost) * 100;
              return (
                <div key={agent.agent} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{agent.agent}</span>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{formatTokens(agent.outputTokens)} out</span>
                      <span className="font-medium text-foreground">{formatCost(agent.totalCost)}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Token breakdown */}
        <Card className="p-3">
          <p className="text-xs font-medium mb-2">Tokens</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <p className="text-foreground font-medium">{formatTokens(cost.total.totalInput)}</p>
              <p className="text-[9px]">Input tokens</p>
            </div>
            <div>
              <p className="text-foreground font-medium">{formatTokens(cost.total.totalOutput)}</p>
              <p className="text-[9px]">Output tokens</p>
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
