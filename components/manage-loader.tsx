"use client";

import { useEffect, useState } from "react";
import type { PuzzleRecord } from "@/lib/puzzle-types";
import { PuzzleBuilder } from "./puzzle-builder";

export function ManageLoader({ slug }: { slug: string }) {
  const [token, setToken] = useState("");
  const [puzzle, setPuzzle] = useState<PuzzleRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const found = new URLSearchParams(location.hash.slice(1)).get("token") ?? "";
    setToken(found);
    if (!found) { setError("This management link is missing its private key."); return; }
    fetch(`/api/puzzles/${slug}`, { headers: { "x-manage-token": found } })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data as PuzzleRecord; })
      .then(setPuzzle)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "The puzzle could not be loaded."));
  }, [slug]);

  if (error) return <div className="state-panel"><h1>Management link unavailable</h1><p>{error}</p></div>;
  if (!puzzle || !token) return <div className="state-panel"><div className="loader" /><h1>Opening your puzzle…</h1></div>;
  return <PuzzleBuilder initial={{ title: puzzle.title, groups: puzzle.groups }} slug={slug} manageToken={token} />;
}
