import { NextResponse } from "next/server";
import { createPuzzle } from "@/lib/puzzles";
import { validatePuzzleInput } from "@/lib/puzzle-types";

export async function POST(request: Request) {
  try {
    const input = validatePuzzleInput(await request.json());
    const result = await createPuzzle(input);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The puzzle could not be published.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
