"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { characterById } from "@/lib/characters";
import { GROUP_COLORS, type PuzzleRecord } from "@/lib/puzzle-types";
import { CharacterCard } from "./character-card";

function shuffled<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function GameBoard({ puzzle }: { puzzle: PuzzleRecord }) {
  const allIds = useMemo(() => puzzle.groups.flatMap((group) => group.characterIds), [puzzle.groups]);
  const [order, setOrder] = useState(() => shuffled(allIds));
  const [selected, setSelected] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("Select four portraits that share a connection.");
  const [finished, setFinished] = useState(false);
  const recorded = useRef(false);

  const remaining = order.filter((id) => !solved.some((groupIndex) => puzzle.groups[groupIndex].characterIds.includes(id)));
  const lost = mistakes >= 4;

  async function record(completed: boolean, nextMistakes: number) {
    if (!puzzle.slug || puzzle.slug === "demo" || recorded.current) return;
    recorded.current = true;
    await fetch(`/api/puzzles/${puzzle.slug}/play`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mistakes: nextMistakes, completed }) }).catch(() => undefined);
  }

  function toggle(id: number) {
    if (finished || lost) return;
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }

  function submit() {
    if (selected.length !== 4) return;
    const match = puzzle.groups.findIndex((group, index) => !solved.includes(index) && group.characterIds.every((id) => selected.includes(id)));
    if (match >= 0) {
      const nextSolved = [...solved, match];
      setSolved(nextSolved);
      setSelected([]);
      if (nextSolved.length === 4) {
        setFinished(true);
        setMessage("You found every connection.");
        void record(true, mistakes);
      } else setMessage("Connection found.");
      return;
    }
    const oneAway = puzzle.groups.some((group, index) => !solved.includes(index) && group.characterIds.filter((id) => selected.includes(id)).length === 3);
    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setSelected([]);
    setMessage(oneAway ? "One away…" : "Not the connection.");
    if (nextMistakes >= 4) {
      setFinished(true);
      setMessage("Out of attempts. Here were the connections.");
      setSolved([0, 1, 2, 3]);
      void record(false, nextMistakes);
    }
  }

  function restart() {
    recorded.current = false;
    setOrder(shuffled(allIds));
    setSelected([]);
    setSolved([]);
    setMistakes(0);
    setFinished(false);
    setMessage("Select four portraits that share a connection.");
  }

  async function share() {
    const squares = GROUP_COLORS.map((_, index) => solved.includes(index) ? ["🟨", "🟩", "🟦", "🟪"][index] : "⬛").join("");
    const text = `Multiverse Match: ${puzzle.title}\n${squares}\n${mistakes}/4 mistakes\n${location.href}`;
    if (navigator.share) await navigator.share({ title: puzzle.title, text, url: location.href }).catch(() => undefined);
    else await navigator.clipboard.writeText(text);
    setMessage("Results copied.");
  }

  return (
    <section className="game-shell" aria-labelledby="puzzle-title">
      <div className="game-heading">
        <div><p className="eyebrow">Picture connections</p><h1 id="puzzle-title">{puzzle.title}</h1></div>
        {puzzle.playCount > 0 && <span className="play-count">Played {puzzle.playCount.toLocaleString()} times</span>}
      </div>

      <div className="solved-stack" aria-live="polite">
        {solved.map((groupIndex) => {
          const group = puzzle.groups[groupIndex];
          return (
            <div className="solved-group" key={groupIndex} style={{ background: GROUP_COLORS[groupIndex] }}>
              <strong>{group.label}</strong>
              <span>{group.characterIds.map((id) => characterById.get(id)?.name).filter(Boolean).join(", ")}</span>
            </div>
          );
        })}
      </div>

      {remaining.length > 0 && <div className="portrait-grid">
        {remaining.map((id) => {
          const character = characterById.get(id);
          return character ? <CharacterCard key={id} character={character} selected={selected.includes(id)} showName={false} onClick={() => toggle(id)} /> : null;
        })}
      </div>}

      <p className="game-message" role="status">{message}</p>
      {!finished && <div className="mistakes" aria-label={`${4 - mistakes} mistakes remaining`}><span>Mistakes remaining</span>{Array.from({ length: 4 }, (_, index) => <i key={index} className={index < 4 - mistakes ? "live" : ""} />)}</div>}
      <div className="game-actions">
        {finished ? <><Button onClick={share}><Copy /> Share result</Button><Button variant="outline" onClick={restart}><RotateCcw /> Play again</Button></> : <>
          <Button variant="outline" onClick={() => setOrder((current) => shuffled(current))}><Shuffle /> Shuffle</Button>
          <Button variant="outline" disabled={!selected.length} onClick={() => setSelected([])}>Deselect all</Button>
          <Button disabled={selected.length !== 4} onClick={submit}><Sparkles /> Submit</Button>
        </>}
      </div>
    </section>
  );
}
