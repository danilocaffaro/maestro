import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/cli-manager";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { message, agent } = await req.json();
  if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
  sendMessage(id, message, agent);
  return NextResponse.json({ ok: true });
}
