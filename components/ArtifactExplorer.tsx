"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ChevronRight, ChevronDown, RefreshCw, FileCode, FileType } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Artifact {
  id: string;
  agent: string;
  filePath: string;
  fileName: string;
  createdAt: number;
}

interface ArtifactExplorerProps {
  teamId: string | null;
}

function getFileIcon(name: string) {
  if (name.endsWith(".md")) return FileText;
  if (name.endsWith(".ts") || name.endsWith(".tsx") || name.endsWith(".js") || name.endsWith(".py")) return FileCode;
  return FileType;
}

function getFileLang(name: string): string | null {
  const ext = name.split(".").pop();
  const map: Record<string, string> = { ts: "typescript", tsx: "typescript", js: "javascript", py: "python", md: "markdown", json: "json", css: "css", html: "html" };
  return map[ext || ""] || null;
}

export function ArtifactExplorer({ teamId }: ArtifactExplorerProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [openTabs, setOpenTabs] = useState<Map<string, string>>(new Map()); // fileName -> content
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Legacy compat
  const selectedFile = activeTab;
  const fileContent = activeTab ? openTabs.get(activeTab) || null : null;

  const loadArtifacts = () => {
    if (!teamId) return;
    fetch(`/api/artifacts/${teamId}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setArtifacts(data); })
      .catch(() => {});
  };

  useEffect(() => {
    loadArtifacts();
    const interval = setInterval(loadArtifacts, 5000);
    return () => clearInterval(interval);
  }, [teamId]);

  const viewFile = async (fileName: string) => {
    // If already open, just switch to tab
    if (openTabs.has(fileName)) {
      setActiveTab(activeTab === fileName ? null : fileName);
      return;
    }
    setActiveTab(fileName);
    setLoading(true);
    try {
      const res = await fetch(`/api/artifacts/${teamId}?file=${encodeURIComponent(fileName)}`);
      const data = await res.json();
      setOpenTabs((prev) => new Map(prev).set(fileName, data.content || "Sem conteudo"));
    } catch {
      setOpenTabs((prev) => new Map(prev).set(fileName, "Erro ao carregar"));
    }
    setLoading(false);
  };

  const closeTab = (fileName: string) => {
    setOpenTabs((prev) => { const next = new Map(prev); next.delete(fileName); return next; });
    if (activeTab === fileName) {
      const remaining = Array.from(openTabs.keys()).filter((k) => k !== fileName);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  if (!teamId) return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <p className="text-sm">Selecione um time</p>
    </div>
  );

  if (artifacts.length === 0) return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      <div className="text-center space-y-3">
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}>
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/30" />
        </motion.div>
        <p className="text-sm">Arquivos criados pelos agentes aparecerao aqui</p>
        <Button variant="ghost" size="sm" className="text-xs" onClick={loadArtifacts}>
          <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar for open files */}
      {openTabs.size > 0 && (
        <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-border overflow-x-auto bg-muted/30">
          {Array.from(openTabs.keys()).map((name) => (
            <button
              key={name}
              className={cn(
                "flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono whitespace-nowrap transition-colors",
                activeTab === name ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(activeTab === name ? null : name)}
            >
              {getFileIcon(name) === FileCode ? <FileCode className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
              {name}
              <span
                className="ml-1 hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); closeTab(name); }}
              >
                x
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="border-b border-border px-3 py-1.5 flex items-center justify-between">
        <span className="text-xs font-medium">{artifacts.length} arquivo(s)</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={loadArtifacts}>
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence>
            {artifacts.map((artifact) => {
              const Icon = getFileIcon(artifact.fileName);
              const isMarkdown = artifact.fileName.endsWith(".md");
              const isSelected = selectedFile === artifact.fileName;

              return (
                <motion.div
                  key={artifact.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors hover:bg-accent border border-transparent hover:border-border"
                    onClick={() => viewFile(artifact.fileName)}
                  >
                    {isSelected ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 text-left">
                      <span className="font-mono font-medium">{artifact.fileName}</span>
                    </div>
                    <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-normal shrink-0">
                      {artifact.agent}
                    </Badge>
                  </button>

                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mx-2 mt-1 mb-2 rounded-lg border border-border overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/50">
                            <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">
                              {artifact.filePath}
                            </span>
                            <span className="text-[9px] text-muted-foreground ml-2">
                              {getFileLang(artifact.fileName) || "file"}
                            </span>
                          </div>
                          <ScrollArea className="max-h-[400px]">
                            {loading ? (
                              <div className="p-4 space-y-2">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="h-3 rounded bg-muted animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                                ))}
                              </div>
                            ) : isMarkdown && fileContent ? (
                              <div className="p-4 prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-xs prose-code:text-xs prose-table:text-xs">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown>
                              </div>
                            ) : (
                              <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words text-foreground/80 leading-relaxed">
                                {fileContent}
                              </pre>
                            )}
                          </ScrollArea>
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
