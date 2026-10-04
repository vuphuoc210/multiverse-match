import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameBoard } from "@/components/game-board";
import { getPuzzle } from "@/lib/puzzles";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const puzzle = await getPuzzle(slug);
    return puzzle ? { title: puzzle.title, description: "Can you find all four Marvel character connections?" } : { title: "Puzzle not found" };
  } catch { return { title: "Multiverse Match puzzle" }; }
}

export default async function PuzzlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const puzzle = await getPuzzle(slug);
  if (!puzzle) notFound();
  return <main className="page-frame puzzle-page"><GameBoard puzzle={puzzle} /></main>;
}
