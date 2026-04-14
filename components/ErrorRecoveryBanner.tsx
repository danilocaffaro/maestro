"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorRecoveryBannerProps {
  agentName: string;
  errorSummary: string;
  severity: "low" | "medium" | "high";
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorRecoveryBanner({ agentName, errorSummary, severity, onRetry, onDismiss }: ErrorRecoveryBannerProps) {
  const colors = severity === "high"
    ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400"
    : severity === "medium"
    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
    : "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex items-start gap-2 rounded-lg border p-2.5 mx-2 my-1 ${colors}`}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{agentName} encontrou um erro</p>
        <p className="text-[10px] opacity-80 mt-0.5 truncate">{errorSummary}</p>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] border-current/30 hover:bg-current/10"
          onClick={onRetry}
        >
          <RefreshCw className="h-3 w-3 mr-0.5" /> Try to Fix
        </Button>
        <button onClick={onDismiss} className="opacity-50 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
