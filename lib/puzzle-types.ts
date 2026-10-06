export type PuzzleGroupInput = {
  label: string;
  characterIds: number[];
};

export type PuzzleInput = {
  title: string;
  groups: PuzzleGroupInput[];
};

export type PuzzleRecord = PuzzleInput & {
  slug: string;
  playCount: number;
  createdAt: number;
};

export const GROUP_COLORS = ["#f4c95d", "#71c48d", "#67a7da", "#b18ad8"];

export function validatePuzzleInput(value: unknown): PuzzleInput {
  if (!value || typeof value !== "object") throw new Error("Puzzle details are missing.");
  const raw = value as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (title.length < 3 || title.length > 80) throw new Error("Use a title between 3 and 80 characters.");
  if (!Array.isArray(raw.groups) || raw.groups.length !== 4) throw new Error("A puzzle needs exactly four groups.");

  const groups = raw.groups.map((entry) => {
    if (!entry || typeof entry !== "object") throw new Error("Each group needs a label and four characters.");
    const group = entry as Record<string, unknown>;
    const label = typeof group.label === "string" ? group.label.trim() : "";
    const characterIds = Array.isArray(group.characterIds)
      ? group.characterIds.filter((id): id is number => Number.isInteger(id))
      : [];
    if (label.length < 1 || label.length > 60) throw new Error("Group labels must be 1–60 characters.");
    if (characterIds.length !== 4 || new Set(characterIds).size !== 4) throw new Error("Each group needs four different characters.");
    return { label, characterIds };
  });

  const allIds = groups.flatMap((group) => group.characterIds);
  if (new Set(allIds).size !== 16) throw new Error("Use each character only once.");
  return { title, groups };
}
