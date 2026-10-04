"use client";

import { useState } from "react";
import type { Character } from "@/lib/characters";

export function CharacterCard({ character, selected = false, disabled = false, compact = false, showName = true, onClick }: {
  character: Character;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  showName?: boolean;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const initials = character.name.split(/\s|-/).map((part) => part[0]).join("").slice(0, 2);
  const content = (
    <>
      <span className="portrait-wrap">
        {!failed ? (
          // The source dataset provides fixed, versioned portrait URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={character.image} alt="" onError={() => setFailed(true)} />
        ) : <span className="portrait-fallback" aria-hidden="true">{initials}</span>}
      </span>
      {showName && <span className="character-name">{character.name}</span>}
    </>
  );

  if (!onClick) return <div className={`character-card ${compact ? "compact" : ""} ${showName ? "" : "image-only"}`}>{content}</div>;
  return (
    <button type="button" className={`character-card ${selected ? "selected" : ""} ${compact ? "compact" : ""} ${showName ? "" : "image-only"}`} onClick={onClick} disabled={disabled} aria-pressed={selected} aria-label={character.name} title={showName ? undefined : character.name}>
      {content}
    </button>
  );
}
