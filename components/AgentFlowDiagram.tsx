"use client";

import { useMemo, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Agent, PeerMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AgentFlowDiagramProps {
  agents: Agent[];
  peerMessages: PeerMessage[];
  selectedAgent?: string | null;
  onSelectAgent?: (name: string | null) => void;
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  idle: { bg: "bg-muted/50", border: "border-border", text: "text-muted-foreground", dot: "bg-zinc-400" },
  working: { bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-400", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  thinking: { bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-400", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  error: { bg: "bg-red-50 dark:bg-red-950/50", border: "border-red-400", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  done: { bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-400", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
};

const STATUS_LABELS: Record<string, string> = {
  idle: "Aguardando", working: "Trabalhando", thinking: "Pensando", error: "Erro", done: "Concluido",
};

const AVATAR_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-cyan-500"];

function AgentNode({ data }: { data: { name: string; role: string; status: string; model: string; index: number; selected: boolean } }) {
  const colors = STATUS_COLORS[data.status] || STATUS_COLORS.idle;
  const avatarColor = AVATAR_COLORS[data.index % AVATAR_COLORS.length];
  const isWorking = data.status === "working" || data.status === "thinking";

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div className={cn(
        "rounded-xl border-2 px-3 py-2 shadow-sm transition-all cursor-pointer select-none",
        colors.bg, colors.border,
        data.selected && "ring-2 ring-primary ring-offset-1 ring-offset-background shadow-md",
        isWorking && "shadow-md",
      )} style={{ minWidth: 140 }}>
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white", avatarColor)}>
              {data.name.charAt(0)}
            </div>
            {/* Status dot */}
            <span className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background", colors.dot, isWorking && "animate-pulse")} />
          </div>
          {/* Info */}
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{data.name}</p>
            <p className="text-[9px] text-muted-foreground truncate" style={{ maxWidth: 100 }}>{data.role?.substring(0, 30)}</p>
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/40">
          <span className={cn("text-[9px] font-medium", colors.text)}>
            {STATUS_LABELS[data.status] || data.status}
          </span>
          <span className="text-[8px] text-muted-foreground/60 font-mono">
            {data.model?.includes("opus") ? "Opus" : data.model?.includes("haiku") ? "Haiku" : "Sonnet"}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-transparent !border-0 !w-0 !h-0" />
    </>
  );
}

const nodeTypes: NodeTypes = { agent: AgentNode };

function FlowInner({ agents, peerMessages, selectedAgent, onSelectAgent }: AgentFlowDiagramProps) {
  // Layout: distribute nodes in a centered horizontal row
  const nodes: Node[] = useMemo(() => {
    const nodeWidth = 160;
    const nodeGap = 30;
    const totalWidth = agents.length * nodeWidth + (agents.length - 1) * nodeGap;
    const startX = -totalWidth / 2;

    // For 2+ rows
    const cols = agents.length <= 4 ? agents.length : Math.ceil(agents.length / 2);
    const rows = Math.ceil(agents.length / cols);
    const rowWidth = cols * nodeWidth + (cols - 1) * nodeGap;
    const rowStartX = -rowWidth / 2;

    return agents.map((agent, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      // Center each row
      const currentRowCols = Math.min(cols, agents.length - row * cols);
      const currentRowWidth = currentRowCols * nodeWidth + (currentRowCols - 1) * nodeGap;
      const x = -currentRowWidth / 2 + col * (nodeWidth + nodeGap);
      const y = row * 90;

      return {
        id: agent.name,
        type: "agent",
        position: { x, y },
        data: {
          name: agent.name,
          role: agent.role || "",
          status: agent.status,
          model: agent.model || "sonnet",
          index: i,
          selected: selectedAgent === agent.name,
        },
      };
    });
  }, [agents, selectedAgent]);

  const edges: Edge[] = useMemo(() => {
    const edgeMap = new Map<string, number>();
    for (const msg of peerMessages) {
      const targets = msg.to === "all"
        ? agents.filter((a) => a.name !== msg.from).map((a) => a.name)
        : [msg.to];
      for (const t of targets) {
        const key = [msg.from, t].sort().join("-");
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
      }
    }
    if (edgeMap.size === 0 && agents.length > 1) {
      for (let i = 0; i < agents.length; i++)
        for (let j = i + 1; j < agents.length; j++)
          edgeMap.set(`${agents[i].name}-${agents[j].name}`, 0);
    }

    return Array.from(edgeMap.entries()).map(([key, weight]) => {
      const [source, target] = key.split("-");
      return {
        id: `e-${key}`,
        source,
        target,
        animated: weight > 0,
        type: "default",
        style: {
          strokeWidth: Math.min(1 + weight * 0.3, 3),
          opacity: weight > 0 ? 0.5 : 0.15,
          stroke: weight > 0 ? "var(--color-primary)" : "var(--color-border)",
        },
      };
    });
  }, [agents, peerMessages]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onSelectAgent?.(selectedAgent === node.id ? null : node.id);
  }, [selectedAgent, onSelectAgent]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={() => onSelectAgent?.(null)}
      fitView
      fitViewOptions={{ padding: 0.4, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      className="bg-transparent !outline-none"
      nodesDraggable
      panOnDrag
      zoomOnScroll={false}
    >
      <Background gap={24} size={1} className="!bg-transparent" color="var(--color-border)" />
      {agents.length > 5 && <MiniMap className="!bg-card/80 !border-border !rounded-lg" nodeBorderRadius={8} />}
    </ReactFlow>
  );
}

export function AgentFlowDiagram(props: AgentFlowDiagramProps) {
  if (props.agents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p className="text-xs">Selecione um time para ver o diagrama</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <FlowInner {...props} />
    </ReactFlowProvider>
  );
}
