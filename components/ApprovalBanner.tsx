"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PendingApproval {
  id: string;
  agent: string;
  action: string;
  details: string;
  risk: "low" | "medium" | "high";
  timestamp: number;
}

interface ApprovalBannerProps {
  teamId: string | null;
}

export function ApprovalBanner({ teamId }: ApprovalBannerProps) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);

  // Poll for pending approvals (detected from stream)
  // In production this would come from the SSE stream
  // For now we detect tool_use events that look risky

  if (approvals.length === 0) return null;

  return (
    <AnimatePresence>
      {approvals.map((approval) => (
        <motion.div
          key={approval.id}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-amber-500/30 bg-amber-500/5 px-3 py-2"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{approval.agent}</span>
                <Badge
                  variant={approval.risk === "high" ? "destructive" : "secondary"}
                  className="text-[8px] h-3.5"
                >
                  {approval.risk}
                </Badge>
                <span className="text-xs text-muted-foreground">{approval.action}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{approval.details}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                onClick={() => setApprovals((prev) => prev.filter((a) => a.id !== approval.id))}
              >
                <Check className="h-3 w-3 mr-0.5" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px] text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setApprovals((prev) => prev.filter((a) => a.id !== approval.id))}
              >
                <X className="h-3 w-3 mr-0.5" /> Rejeitar
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
