import { NextResponse } from "next/server";
import { discoverAgents } from "@/lib/agent-registry";

export async function GET() {
  const agents = discoverAgents();
  // Don't expose spawnArgs function in JSON
  const safe = agents.map(({ spawnArgs, ...rest }) => rest);
  return NextResponse.json(safe);
}
