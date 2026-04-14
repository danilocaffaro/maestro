import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function statusColor(status: string): string {
  switch (status) {
    case "working":
    case "running":
    case "in_progress":
      return "text-emerald-400";
    case "thinking":
    case "creating":
      return "text-amber-400";
    case "error":
      return "text-red-400";
    case "done":
    case "completed":
      return "text-blue-400";
    default:
      return "text-zinc-500";
  }
}

export function statusDot(status: string): string {
  switch (status) {
    case "working":
    case "running":
    case "in_progress":
      return "bg-emerald-400";
    case "thinking":
    case "creating":
      return "bg-amber-400";
    case "error":
      return "bg-red-400";
    case "done":
    case "completed":
      return "bg-blue-400";
    default:
      return "bg-zinc-500";
  }
}
