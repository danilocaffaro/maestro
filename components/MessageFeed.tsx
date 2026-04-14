"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PeerMessage } from "@/lib/types";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MessageFeedProps {
  messages: PeerMessage[];
}

const AGENT_COLORS: Record<string, string> = {};
const COLORS = [
  "text-blue-500",
  "text-emerald-500",
  "text-amber-500",
  "text-purple-500",
  "text-pink-500",
  "text-cyan-500",
];
const BG_COLORS = [
  "bg-blue-500/5 border-blue-500/10",
  "bg-emerald-500/5 border-emerald-500/10",
  "bg-amber-500/5 border-amber-500/10",
  "bg-purple-500/5 border-purple-500/10",
  "bg-pink-500/5 border-pink-500/10",
  "bg-cyan-500/5 border-cyan-500/10",
];

function getAgentIdx(name: string): number {
  if (!(name in AGENT_COLORS)) {
    AGENT_COLORS[name] = String(Object.keys(AGENT_COLORS).length % COLORS.length);
  }
  return Number(AGENT_COLORS[name]);
}

export function MessageFeed({ messages }: MessageFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/30" />
          </motion.div>
          <p className="text-sm">Comunicacao entre agentes aparecera aqui</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1.5">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => {
            const idx = getAgentIdx(msg.from);
            const isVoce = msg.from === "Voce";
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2",
                  isVoce ? "bg-primary/5 border-primary/10" : BG_COLORS[idx]
                )}
              >
                <ArrowRight className={cn("h-3 w-3 mt-1 shrink-0", isVoce ? "text-primary" : COLORS[idx])} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className={cn("font-semibold", isVoce ? "text-primary" : COLORS[idx])}>
                      {msg.from}
                    </span>
                    <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                    <span className={cn(
                      "font-medium",
                      msg.to === "all" ? "text-muted-foreground" : COLORS[getAgentIdx(msg.to)]
                    )}>
                      {msg.to === "all" ? "todos" : msg.to}
                    </span>
                    <span className="text-[9px] text-muted-foreground/50 ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
