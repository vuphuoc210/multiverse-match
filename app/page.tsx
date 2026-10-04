import Link from "next/link";
import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameBoard } from "@/components/game-board";
import type { PuzzleRecord } from "@/lib/puzzle-types";

const demo: PuzzleRecord = {
  slug: "demo",
  title: "The First Assembly",
  playCount: 0,
  createdAt: 0,
  groups: [
    { label: "Founding Avengers", characterIds: [346, 659, 332, 708] },
    { label: "X-Men leaders", characterIds: [196, 638, 356, 527] },
    { label: "Street-level heroes", characterIds: [201, 213, 416, 345] },
    { label: "World-class villains", characterIds: [222, 414, 655, 680] },
  ],
};

export default function Home() {
  return (
    <main className="page-frame home-page">
      <div className="home-intro">
        <div><span className="live-pill"><Zap /> Starter puzzle</span><p>Find four groups of four Marvel characters.</p></div>
        <Button asChild><Link href="/create"><Plus /> Create your own</Link></Button>
      </div>
      <GameBoard puzzle={demo} />
    </main>
  );
}
