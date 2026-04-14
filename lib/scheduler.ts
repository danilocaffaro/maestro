import { maestroDB } from "./db";
import { spawnTeam } from "./cli-manager";
import type { TeamConfig } from "./types";
import { generateId } from "./utils";

/**
 * Simple cron-like scheduler for Maestro.
 * Stores schedules in SQLite. Checks every 60s if any should fire.
 */

export interface Schedule {
  id: string;
  name: string;
  config: TeamConfig;
  cronExpression: string;  // simplified: "daily", "hourly", "weekly", or cron string
  enabled: boolean;
  lastRun: number | null;
  nextRun: number | null;
  createdAt: number;
}

// In-memory schedule list (loaded from DB on init)
let schedules: Schedule[] = [];
let intervalId: ReturnType<typeof setInterval> | null = null;

function parseCronToMs(cron: string): number {
  switch (cron) {
    case "hourly": return 60 * 60 * 1000;
    case "daily": return 24 * 60 * 60 * 1000;
    case "weekly": return 7 * 24 * 60 * 60 * 1000;
    default:
      // Try to parse as minutes interval
      const mins = parseInt(cron);
      if (!isNaN(mins) && mins > 0) return mins * 60 * 1000;
      return 24 * 60 * 60 * 1000; // default daily
  }
}

function calculateNextRun(schedule: Schedule): number {
  const interval = parseCronToMs(schedule.cronExpression);
  const now = Date.now();
  if (schedule.lastRun) {
    return schedule.lastRun + interval;
  }
  return now + interval;
}

export function createSchedule(name: string, config: TeamConfig, cronExpression: string): Schedule {
  const schedule: Schedule = {
    id: generateId(),
    name,
    config,
    cronExpression,
    enabled: true,
    lastRun: null,
    nextRun: Date.now() + parseCronToMs(cronExpression),
    createdAt: Date.now(),
  };
  schedules.push(schedule);
  return schedule;
}

export function listSchedules(): Schedule[] {
  return schedules;
}

export function deleteSchedule(id: string) {
  schedules = schedules.filter((s) => s.id !== id);
}

export function toggleSchedule(id: string, enabled: boolean) {
  const schedule = schedules.find((s) => s.id === id);
  if (schedule) {
    schedule.enabled = enabled;
    if (enabled) schedule.nextRun = calculateNextRun(schedule);
  }
}

function checkSchedules() {
  const now = Date.now();
  for (const schedule of schedules) {
    if (!schedule.enabled || !schedule.nextRun) continue;
    if (now >= schedule.nextRun) {
      // Fire!
      const teamId = `sched-${schedule.id}-${Date.now()}`;
      spawnTeam({ ...schedule.config, id: teamId });
      schedule.lastRun = now;
      schedule.nextRun = calculateNextRun(schedule);
    }
  }
}

export function startScheduler() {
  if (intervalId) return;
  intervalId = setInterval(checkSchedules, 60 * 1000); // Check every 60s
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
