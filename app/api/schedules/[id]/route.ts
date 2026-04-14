import { NextRequest, NextResponse } from "next/server";
import { deleteSchedule, toggleSchedule, listSchedules } from "@/lib/scheduler";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteSchedule(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { enabled } = await req.json();
  if (typeof enabled === "boolean") {
    toggleSchedule(id, enabled);
  }
  const schedule = listSchedules().find((s) => s.id === id);
  return NextResponse.json(schedule || { error: "not found" });
}
