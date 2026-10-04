import { NextResponse } from "next/server";
import { recordPlay } from "@/lib/puzzles";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as { mistakes?: unknown; completed?: unknown };
    const mistakes = Math.max(0, Math.min(20, Number(body.mistakes) || 0));
    await recordPlay(slug, mistakes, Boolean(body.completed));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
