import { NextRequest, NextResponse } from "next/server";
import { spawnTeam, listTeams } from "@/lib/cli-manager";

export async function GET() {
  return NextResponse.json(listTeams());
}

export async function POST(req: NextRequest) {
  try {
    const config = await req.json();
    if (!config.name || !config.agents || config.agents.length === 0) {
      return NextResponse.json({ error: "name and agents are required" }, { status: 400 });
    }
    const team = spawnTeam(config);
    return NextResponse.json(team, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
