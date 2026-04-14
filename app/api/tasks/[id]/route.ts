import { NextRequest, NextResponse } from "next/server";
import { maestroDB } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(maestroDB.getTasks(id));
}
