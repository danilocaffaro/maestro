"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TASK_STAGES } from "@/lib/types";
import type { Task, TaskStage } from "@/lib/types";
import { CheckCircle2, Circle, Loader2, ListTodo, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TaskListProps {
  tasks: Task[];
}

function mapLegacyStatus(task: Task): TaskStage {
  if (task.stage) return task.stage;
  switch (task.status) {
    case "completed": return "done";
    case "in_progress": return "in_progress";
    default: return "inbox";
  }
}

function StageIcon({ stage }: { stage: TaskStage }) {
  switch (stage) {
    case "done": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "in_progress": return <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />;
    case "testing": return <Loader2 className="h-3.5 w-3.5 text-purple-500 animate-spin" />;
    case "review": return <ArrowRight className="h-3.5 w-3.5 text-cyan-500" />;
    default: return <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />;
  }
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center space-y-3">
          <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
            <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/30" />
          </motion.div>
          <p className="text-sm">Tasks dos agentes aparecerao aqui</p>
        </div>
      </div>
    );
  }

  // Group tasks by stage
  const grouped = new Map<TaskStage, Task[]>();
  for (const stage of TASK_STAGES) grouped.set(stage.id, []);
  for (const task of tasks) {
    const stage = mapLegacyStatus(task);
    const list = grouped.get(stage) || [];
    list.push(task);
    grouped.set(stage, list);
  }

  const totalDone = grouped.get("done")?.length || 0;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        {/* Progress */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs text-muted-foreground">{totalDone}/{tasks.length} concluidas</span>
          <div className="h-1.5 w-28 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${tasks.length > 0 ? (totalDone / tasks.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Kanban columns (vertical for sidebar) */}
        {TASK_STAGES.map((stage) => {
          const stageTasks = grouped.get(stage.id) || [];
          if (stageTasks.length === 0) return null;
          return (
            <div key={stage.id} className="mb-2">
              <div className="flex items-center gap-1.5 px-1 mb-1">
                <div className={cn("h-2 w-2 rounded-full", stage.color)} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stage.label}</span>
                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 ml-auto">{stageTasks.length}</Badge>
              </div>
              <AnimatePresence mode="popLayout">
                {stageTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "flex items-start gap-2 rounded-lg px-2.5 py-1.5 border border-transparent transition-colors",
                      stage.id === "in_progress" && "bg-amber-500/5 border-amber-500/10",
                      stage.id === "done" && "opacity-60"
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      <StageIcon stage={stage.id} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs", stage.id === "done" && "line-through text-muted-foreground")}>
                        {task.content}
                      </p>
                      {task.assignee && (
                        <Badge variant="secondary" className="text-[8px] h-3 px-1 mt-0.5">{task.assignee}</Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
