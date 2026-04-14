"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MODELS } from "@/lib/types";
import type { ModelId, TeamState } from "@/lib/types";
import { Zap, Trophy, Clock, DollarSign, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RaceData {
  id: string;
  prompt: string;
  variants: { id: string; label: string; model: ModelId; teamId: string }[];
  status: "running" | "completed";
}

interface VariantResult {
  label: string;
  model: ModelId;
  teamId: string;
  status: string;
  messages: number;
  cost: number;
  output: string;
  artifacts: number;
  duration: number;
}

interface RaceViewProps {
  onClose: () => void;
}

export function RaceView({ onClose }: RaceViewProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<ModelId[]>(["claude-sonnet-4-6", "claude-haiku-4-5"]);
  const [race, setRace] = useState<RaceData | null>(null);
  const [results, setResults] = useState<VariantResult[]>([]);
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleModel = (model: ModelId) => {
    setSelectedModels((prev) =>
      prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]
    );
  };

  const startRace = async () => {
    if (!prompt.trim() || selectedModels.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch("/api/races", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, models: selectedModels }),
      });
      const data = await res.json();
      setRace(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Poll variant results
  useEffect(() => {
    if (!race) return;
    const poll = async () => {
      const variantResults: VariantResult[] = [];
      for (const v of race.variants) {
        try {
          const [teamRes, costRes] = await Promise.all([
            fetch(`/api/teams/${v.teamId}`).then((r) => r.json()),
            fetch(`/api/costs/${v.teamId}`).then((r) => r.json()),
          ]);
          const team = teamRes as TeamState;
          const textMsgs = team.messages.filter((m) => m.type === "text" && m.agent !== "System" && m.agent !== "Voce");
          const lastOutput = textMsgs[textMsgs.length - 1]?.content || "";
          variantResults.push({
            label: v.label,
            model: v.model,
            teamId: v.teamId,
            status: team.status,
            messages: team.messages.length,
            cost: costRes.total?.totalCost || 0,
            output: lastOutput,
            artifacts: 0,
            duration: team.status === "stopped" ? (Date.now() - team.createdAt) / 1000 : 0,
          });
        } catch { /* ignore */ }
      }
      setResults(variantResults);

      if (variantResults.every((r) => r.status === "stopped" || r.status === "error")) {
        setRace((prev) => prev ? { ...prev, status: "completed" } : null);
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [race]);

  // Setup form
  if (!race) {
    return (
      <div className="flex h-full flex-col p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" /> Race Mode
          </h3>
          <Button variant="ghost" size="sm" className="text-xs" onClick={onClose}>Fechar</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Compare modelos rodando o mesmo prompt em paralelo. Veja qual entrega melhor resultado, mais rapido, e mais barato.
        </p>
        <Separator />
        <Input
          placeholder="Digite o prompt para a corrida..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="text-sm"
        />
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Selecione 2+ modelos:</p>
          <div className="flex gap-1.5">
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  selectedModels.includes(m.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <Button
          onClick={startRace}
          disabled={!prompt.trim() || selectedModels.length < 2 || loading}
          className="w-full"
          size="sm"
        >
          <Zap className="h-3.5 w-3.5 mr-1.5" />
          {loading ? "Iniciando..." : `Iniciar Race (${selectedModels.length} variantes)`}
        </Button>
      </div>
    );
  }

  // Race results
  const allDone = race.status === "completed";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Race: {race.variants.length} variantes
          {!allDone && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
        </h3>
        <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setRace(null); setResults([]); }}>Nova</Button>
      </div>

      <div className="px-3 py-2 border-b border-border bg-muted/30">
        <p className="text-[10px] text-muted-foreground">Prompt:</p>
        <p className="text-xs">{race.prompt}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          <AnimatePresence>
            {results.map((r, i) => {
              const isExpanded = expandedVariant === r.teamId;
              const isBest = allDone && i === 0; // Simple: first finished = best
              return (
                <motion.div
                  key={r.teamId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border transition-colors ${
                    isBest ? "border-amber-500/30 bg-amber-500/5" : "border-border"
                  }`}
                >
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs"
                    onClick={() => setExpandedVariant(isExpanded ? null : r.teamId)}
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                    {isBest && <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <Badge variant={r.status === "stopped" ? "default" : "secondary"} className="text-[9px] h-4">
                      {r.label}
                    </Badge>
                    <span className="flex-1" />
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      {r.status === "running" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {r.duration > 0 && <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{Math.round(r.duration)}s</span>}
                      <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />${r.cost.toFixed(3)}</span>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && r.output && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-border">
                          <div className="mt-2 prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-xs prose-code:text-xs text-xs max-h-[200px] overflow-y-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.output}</ReactMarkdown>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
