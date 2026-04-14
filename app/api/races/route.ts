import { NextRequest, NextResponse } from "next/server";
import { spawnTeam, listTeams } from "@/lib/cli-manager";
import { generateId } from "@/lib/utils";
import type { ModelId } from "@/lib/types";

// In-memory race store (races are ephemeral - results persist via team data in SQLite)
const races = new Map<string, {
  id: string;
  prompt: string;
  variants: { id: string; label: string; model: ModelId; teamId: string }[];
  status: "running" | "completed";
  createdAt: number;
}>();

export async function GET() {
  return NextResponse.json(Array.from(races.values()));
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, models } = await req.json();

    if (!prompt || !models || !Array.isArray(models) || models.length < 2) {
      return NextResponse.json(
        { error: "prompt and models (array of 2+) required" },
        { status: 400 }
      );
    }

    const raceId = generateId();
    const variants = models.map((model: string, i: number) => {
      const teamId = `race-${raceId}-${i}`;
      const label = model.includes("opus") ? "Opus" : model.includes("haiku") ? "Haiku" : "Sonnet";

      // Spawn each variant as a solo agent team
      spawnTeam({
        id: teamId,
        name: `Race: ${label}`,
        agents: [{ name: label, role: "Agente de race mode", model: model as ModelId }],
        task: prompt,
      });

      return { id: generateId(), label, model: model as ModelId, teamId };
    });

    const race = {
      id: raceId,
      prompt,
      variants,
      status: "running" as const,
      createdAt: Date.now(),
    };

    races.set(raceId, race);

    return NextResponse.json(race, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
