"use client";

import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";

interface CostData {
  perAgent: { agent: string; model: string; inputTokens: number; outputTokens: number; totalCost: number }[];
  total: { totalCost: number; totalInput: number; totalOutput: number };
}

export function CostBadge({ teamId }: { teamId: string | null }) {
  const [cost, setCost] = useState<CostData | null>(null);

  useEffect(() => {
    if (!teamId) { setCost(null); return; }
    const load = () => {
      fetch(`/api/costs/${teamId}`)
        .then((r) => r.json())
        .then(setCost)
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [teamId]);

  if (!cost || cost.total.totalCost === 0) return null;

  const fmt = (n: number) => n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
  const fmtTokens = (n: number) => n > 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

  return (
    <div className="group relative">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <DollarSign className="h-3 w-3" />
        <span>{fmt(cost.total.totalCost)}</span>
        <span className="text-muted-foreground/50">
          ({fmtTokens(cost.total.totalInput + cost.total.totalOutput)} tokens)
        </span>
      </div>
      {/* Hover tooltip with per-agent breakdown */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
        <div className="rounded-md border border-border bg-popover p-2 shadow-md text-[10px] min-w-[180px]">
          <p className="font-medium text-popover-foreground mb-1">Custo por agente</p>
          {cost.perAgent.map((a) => (
            <div key={a.agent} className="flex justify-between text-muted-foreground py-0.5">
              <span>{a.agent}</span>
              <span>{fmt(a.totalCost)} ({fmtTokens(a.outputTokens)} out)</span>
            </div>
          ))}
          <div className="border-t border-border mt-1 pt-1 flex justify-between font-medium text-popover-foreground">
            <span>Total</span>
            <span>{fmt(cost.total.totalCost)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
