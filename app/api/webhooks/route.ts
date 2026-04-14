import { NextRequest, NextResponse } from "next/server";
import { registerWebhook, listWebhooks, deleteWebhook } from "@/lib/webhooks";

export async function GET() {
  return NextResponse.json(listWebhooks());
}

export async function POST(req: NextRequest) {
  try {
    const { url, events, secret } = await req.json();
    if (!url || !events) {
      return NextResponse.json({ error: "url and events required" }, { status: 400 });
    }
    const webhook = registerWebhook({ url, events, secret, enabled: true });
    return NextResponse.json(webhook, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (id) deleteWebhook(id);
  return NextResponse.json({ ok: true });
}
