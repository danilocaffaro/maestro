import { NextRequest, NextResponse } from "next/server";
import { getArtifacts } from "@/lib/cli-manager";
import { readFileSync, existsSync } from "fs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params;
  const fileName = req.nextUrl.searchParams.get("file");

  const allArtifacts = getArtifacts(teamId);

  // Deduplicate by fileName (keep latest)
  const seen = new Map<string, typeof allArtifacts[0]>();
  for (const a of allArtifacts) {
    seen.set(a.fileName, a);
  }
  const artifacts = Array.from(seen.values());

  if (fileName) {
    const artifact = artifacts.find((a) => a.fileName === fileName);
    if (!artifact || !existsSync(artifact.filePath)) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }
    try {
      const content = readFileSync(artifact.filePath, "utf-8");
      return NextResponse.json({ ...artifact, content });
    } catch {
      return NextResponse.json({ error: "Cannot read file" }, { status: 500 });
    }
  }

  return NextResponse.json(artifacts);
}
