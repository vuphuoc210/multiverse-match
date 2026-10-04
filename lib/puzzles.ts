import { env } from "cloudflare:workers";
import type { PuzzleInput, PuzzleRecord } from "./puzzle-types";

const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";

function randomString(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function db() {
  if (!env.DB) throw new Error("Puzzle storage is temporarily unavailable.");
  return env.DB;
}

export async function createPuzzle(input: PuzzleInput) {
  const puzzleId = crypto.randomUUID();
  const slug = randomString(8);
  const manageToken = `${randomString(24)}${randomString(24)}`;
  const now = Date.now();
  const statements = [
    db()
      .prepare("INSERT INTO puzzles (id, slug, title, manage_token_hash, status, play_count, created_at, updated_at) VALUES (?, ?, ?, ?, 'published', 0, ?, ?)")
      .bind(puzzleId, slug, input.title, await tokenHash(manageToken), now, now),
  ];

  input.groups.forEach((group, groupIndex) => {
    const groupId = crypto.randomUUID();
    statements.push(
      db().prepare("INSERT INTO puzzle_groups (id, puzzle_id, label, position) VALUES (?, ?, ?, ?)").bind(groupId, puzzleId, group.label, groupIndex),
    );
    group.characterIds.forEach((characterId, memberIndex) => {
      statements.push(
        db().prepare("INSERT INTO group_members (id, group_id, character_id, position) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), groupId, characterId, memberIndex),
      );
    });
  });

  await db().batch(statements);
  return { slug, manageToken };
}

export async function getPuzzle(slug: string): Promise<PuzzleRecord | null> {
  const puzzle = await db()
    .prepare("SELECT id, slug, title, play_count AS playCount, created_at AS createdAt FROM puzzles WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first<{ id: string; slug: string; title: string; playCount: number; createdAt: number }>();
  if (!puzzle) return null;

  const rows = await db()
    .prepare("SELECT g.id AS groupId, g.label, g.position AS groupPosition, m.character_id AS characterId, m.position AS memberPosition FROM puzzle_groups g JOIN group_members m ON m.group_id = g.id WHERE g.puzzle_id = ? ORDER BY g.position, m.position")
    .bind(puzzle.id)
    .all<{ groupId: string; label: string; groupPosition: number; characterId: number; memberPosition: number }>();

  const groups = Array.from({ length: 4 }, (_, position) => {
    const groupRows = rows.results.filter((row) => row.groupPosition === position);
    return { label: groupRows[0]?.label ?? "Untitled group", characterIds: groupRows.map((row) => row.characterId) };
  });
  return { slug: puzzle.slug, title: puzzle.title, playCount: puzzle.playCount, createdAt: puzzle.createdAt, groups };
}

export async function verifyManager(slug: string, token: string) {
  const row = await db().prepare("SELECT manage_token_hash AS tokenHash FROM puzzles WHERE slug = ?").bind(slug).first<{ tokenHash: string }>();
  if (!row || row.tokenHash !== (await tokenHash(token))) throw new Error("That management link is invalid.");
}

export async function updatePuzzle(slug: string, token: string, input: PuzzleInput) {
  await verifyManager(slug, token);
  const puzzle = await db().prepare("SELECT id FROM puzzles WHERE slug = ?").bind(slug).first<{ id: string }>();
  if (!puzzle) throw new Error("Puzzle not found.");
  const groupRows = await db().prepare("SELECT id FROM puzzle_groups WHERE puzzle_id = ?").bind(puzzle.id).all<{ id: string }>();
  const statements = [
    ...groupRows.results.map((row) => db().prepare("DELETE FROM group_members WHERE group_id = ?").bind(row.id)),
    db().prepare("DELETE FROM puzzle_groups WHERE puzzle_id = ?").bind(puzzle.id),
    db().prepare("UPDATE puzzles SET title = ?, updated_at = ? WHERE id = ?").bind(input.title, Date.now(), puzzle.id),
  ];
  input.groups.forEach((group, groupIndex) => {
    const groupId = crypto.randomUUID();
    statements.push(db().prepare("INSERT INTO puzzle_groups (id, puzzle_id, label, position) VALUES (?, ?, ?, ?)").bind(groupId, puzzle.id, group.label, groupIndex));
    group.characterIds.forEach((characterId, memberIndex) => {
      statements.push(db().prepare("INSERT INTO group_members (id, group_id, character_id, position) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), groupId, characterId, memberIndex));
    });
  });
  await db().batch(statements);
}

export async function deletePuzzle(slug: string, token: string) {
  await verifyManager(slug, token);
  await db().prepare("DELETE FROM puzzles WHERE slug = ?").bind(slug).run();
}

export async function recordPlay(slug: string, mistakes: number, completed: boolean) {
  const puzzle = await db().prepare("SELECT id FROM puzzles WHERE slug = ?").bind(slug).first<{ id: string }>();
  if (!puzzle) return;
  await db().batch([
    db().prepare("INSERT INTO plays (id, puzzle_id, mistakes, completed, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), puzzle.id, mistakes, completed ? 1 : 0, Date.now()),
    db().prepare("UPDATE puzzles SET play_count = play_count + 1 WHERE id = ?").bind(puzzle.id),
  ]);
}
