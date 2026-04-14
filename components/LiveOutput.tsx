"use client";

import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentMessage } from "@/lib/types";
import { Bot, Wrench, MessageSquare, User, ChevronRight, ChevronDown, Terminal, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

interface LiveOutputProps {
  messages: AgentMessage[];
  showTypingFor?: string[];
}

function TypingIndicator({ agent }: { agent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 px-2 py-1.5"
    >
      <Bot className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-medium text-primary">{agent}</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/60"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ToolCallBlock({ msg }: { msg: AgentMessage }) {
  const [expanded, setExpanded] = useState(false);

  // Parse tool name and content
  const colonIdx = msg.content.indexOf(":");
  const toolName = colonIdx > 0 ? msg.content.substring(0, colonIdx).trim() : "tool";
  const toolContent = colonIdx > 0 ? msg.content.substring(colonIdx + 1).trim() : msg.content;
  const isBash = toolName === "$" || msg.content.startsWith("$");
  const displayName = isBash ? msg.content.substring(0, 80) : toolName;

  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="group"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left rounded-md px-1.5 py-0.5 hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        {isBash ? (
          <Terminal className="h-3 w-3 text-amber-500 shrink-0" />
        ) : (
          <Wrench className="h-3 w-3 text-amber-500 shrink-0" />
        )}
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{msg.agent}</span>
        <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
          {displayName}
        </span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="ml-6 mt-1 rounded-md bg-muted/30 p-2 text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-[200px] overflow-y-auto">
              {toolContent}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ThinkingBlock({ msg }: { msg: AgentMessage }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className="group"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full text-left rounded-md px-1.5 py-0.5 hover:bg-purple-500/5 transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3 text-purple-400 shrink-0" /> : <ChevronRight className="h-3 w-3 text-purple-400 shrink-0" />}
        <Brain className="h-3 w-3 text-purple-400 shrink-0" />
        <span className="text-xs font-medium text-purple-500 dark:text-purple-400">{msg.agent}</span>
        <span className="text-[10px] text-purple-400/60 ml-1">pensando...</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <pre className="ml-6 mt-1 rounded-md bg-purple-500/5 border border-purple-500/10 p-2 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap max-h-[150px] overflow-y-auto">
              {msg.content}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MessageBlock({ msg }: { msg: AgentMessage }) {
  const isUser = msg.agent === "Voce";
  const isSystem = msg.agent === "System";

  if (msg.type === "thinking") {
    return <ThinkingBlock msg={msg} />;
  }

  if (msg.type === "tool_use") {
    return <ToolCallBlock msg={msg} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex gap-2 group rounded-md px-2 py-1.5",
        isUser && "bg-primary/5 border border-primary/10",
        isSystem && "bg-muted/30"
      )}
    >
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary" />
        ) : isSystem ? (
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-blue-500" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "font-semibold text-xs",
            isUser ? "text-primary" : isSystem ? "text-muted-foreground" : "text-blue-500"
          )}
        >
          {msg.agent}
        </span>
        {msg.type !== "text" && (
          <Badge variant="outline" className="ml-1.5 text-[8px] h-3.5 px-1 align-middle">
            {msg.type}
          </Badge>
        )}
        <div className="mt-0.5 text-sm text-foreground/85 prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-xs prose-pre:p-2 prose-pre:rounded-md prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-table:text-xs">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.content}
          </ReactMarkdown>
        </div>
      </div>
      <span className="shrink-0 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {new Date(msg.timestamp).toLocaleTimeString()}
      </span>
    </motion.div>
  );
}

export function LiveOutput({ messages, showTypingFor = [] }: LiveOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTypingFor]);

  if (messages.length === 0 && showTypingFor.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Bot className="h-10 w-10 mx-auto text-muted-foreground/30" />
          </motion.div>
          <p className="text-sm">Aguardando output dos agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <MessageBlock key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {showTypingFor.map((agent) => (
            <TypingIndicator key={`typing-${agent}`} agent={agent} />
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
