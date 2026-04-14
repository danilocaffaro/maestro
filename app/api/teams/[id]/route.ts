import { NextRequest, NextResponse } from "next/server";
import { getTeamState, stopTeam } from "@/lib/cli-manager";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = getTeamState(id);
  if (!state) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json(state);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  stopTeam(id);
  return NextResponse.json({ ok: true });
}
