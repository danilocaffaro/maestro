import { NextRequest, NextResponse } from "next/server";
import { createSchedule, listSchedules, startScheduler } from "@/lib/scheduler";

// Ensure scheduler is running
startScheduler();

export async function GET() {
  return NextResponse.json(listSchedules());
}

export async function POST(req: NextRequest) {
  try {
    const { name, config, cron } = await req.json();
    if (!name || !config || !cron) {
      return NextResponse.json({ error: "name, config, and cron required" }, { status: 400 });
    }
    const schedule = createSchedule(name, config, cron);
    return NextResponse.json(schedule, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
