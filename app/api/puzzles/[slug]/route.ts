import { NextResponse } from "next/server";
import { deletePuzzle, getPuzzle, updatePuzzle, verifyManager } from "@/lib/puzzles";
import { validatePuzzleInput } from "@/lib/puzzle-types";

type Context = { params: Promise<{ slug: string }> };

function tokenFrom(request: Request) {
  return request.headers.get("x-manage-token") ?? "";
}

export async function GET(request: Request, context: Context) {
  try {
    const { slug } = await context.params;
    await verifyManager(slug, tokenFrom(request));
    const puzzle = await getPuzzle(slug);
    return puzzle ? NextResponse.json(puzzle) : NextResponse.json({ error: "Puzzle not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Access denied." }, { status: 403 });
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const { slug } = await context.params;
    const input = validatePuzzleInput(await request.json());
    await updatePuzzle(slug, tokenFrom(request), input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The puzzle could not be updated." }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { slug } = await context.params;
    await deletePuzzle(slug, tokenFrom(request));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The puzzle could not be deleted." }, { status: 403 });
  }
}
