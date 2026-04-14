import { NextResponse } from "next/server";
import { getHealthSummary, getHealthStatus } from "@/lib/heartbeat";
import { listTeams } from "@/lib/cli-manager";

export async function GET() {
  const health = getHealthSummary();
  const agents = getHealthStatus();
  const teams = listTeams();

  return NextResponse.json({
    status: "ok",
    version: "0.5",
    uptime: process.uptime(),
    agents: health,
    agentDetails: agents,
    teams: {
      total: teams.length,
      running: teams.filter((t) => t.status === "running").length,
      stopped: teams.filter((t) => t.status === "stopped").length,
    },
  });
}
