import { NextRequest, NextResponse } from "next/server";
import { maestroDB } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const perAgent = maestroDB.getCostByTeam(teamId);
  const total = maestroDB.getTotalCost(teamId);
  return NextResponse.json({ perAgent, total });
}
