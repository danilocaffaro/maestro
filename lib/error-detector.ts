/**
 * Error detector for agent output streams.
 * Scans messages for error patterns and returns structured error info.
 */

const ERROR_PATTERNS = [
  { pattern: /error:/i, type: "generic" },
  { pattern: /Error:\s/i, type: "generic" },
  { pattern: /FAILED/i, type: "failed" },
  { pattern: /exception/i, type: "exception" },
  { pattern: /traceback/i, type: "traceback" },
  { pattern: /stack trace/i, type: "stacktrace" },
  { pattern: /TypeError|ReferenceError|SyntaxError/i, type: "js-error" },
  { pattern: /ENOENT|EACCES|EPERM/i, type: "fs-error" },
  { pattern: /ModuleNotFoundError|ImportError/i, type: "import-error" },
  { pattern: /command not found/i, type: "cmd-error" },
  { pattern: /permission denied/i, type: "permission" },
  { pattern: /timeout|timed out/i, type: "timeout" },
  { pattern: /429|rate limit/i, type: "rate-limit" },
  { pattern: /500|502|503|504/i, type: "server-error" },
];

export interface ErrorDetection {
  isError: boolean;
  errorType: string;
  summary: string;
  severity: "low" | "medium" | "high";
}

export function detectError(content: string): ErrorDetection {
  for (const { pattern, type } of ERROR_PATTERNS) {
    if (pattern.test(content)) {
      // Extract first line with error
      const lines = content.split("\n");
      const errorLine = lines.find((l) => pattern.test(l)) || lines[0];
      const summary = errorLine.substring(0, 200);

      const severity = ["exception", "traceback", "stacktrace", "js-error"].includes(type)
        ? "high"
        : ["permission", "rate-limit", "server-error"].includes(type)
        ? "medium"
        : "low";

      return { isError: true, errorType: type, summary, severity };
    }
  }

  return { isError: false, errorType: "", summary: "", severity: "low" };
}

/**
 * Generate a recovery prompt for an errored agent
 */
export function generateRecoveryPrompt(agentName: string, error: ErrorDetection, originalTask: string): string {
  return `O agente "${agentName}" encontrou um erro:

Tipo: ${error.errorType}
Detalhes: ${error.summary}

Tarefa original: ${originalTask}

Analise o erro, identifique a causa raiz, e tente uma abordagem diferente para completar a tarefa. Se o erro for de permissao ou recurso, tente um caminho alternativo.`;
}
