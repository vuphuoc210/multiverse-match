import { characters, characterIds } from "./catalog.js";
import { CSS } from "./styles.js";
import { CLIENT_JS } from "./client.js";

const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function randomString(length) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

async function hashToken(token) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validatePuzzle(value) {
  if (!value || typeof value !== "object") throw new Error("Puzzle details are missing.");
  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (title.length < 3 || title.length > 80) throw new Error("Use a title between 3 and 80 characters.");
  if (!Array.isArray(value.groups) || value.groups.length !== 4) throw new Error("A puzzle needs exactly four groups.");
  const groups = value.groups.map((entry) => {
    const label = entry && typeof entry.label === "string" ? entry.label.trim() : "";
    const ids = entry && Array.isArray(entry.characterIds) ? entry.characterIds.filter(Number.isInteger) : [];
    if (label.length < 2 || label.length > 60) throw new Error("Group labels must be 2–60 characters.");
    if (ids.length !== 4 || new Set(ids).size !== 4 || ids.some((id) => !characterIds.has(id))) throw new Error("Each group needs four different catalog characters.");
    return { label, characterIds: ids };
  });
  if (new Set(groups.flatMap((group) => group.characterIds)).size !== 16) throw new Error("Use each character only once.");
  return { title, groups };
}

async function getPuzzle(DB, slug) {
  const puzzle = await DB.prepare("SELECT id, slug, title, play_count AS playCount, created_at AS createdAt FROM puzzles WHERE slug = ? AND status = 'published'").bind(slug).first();
  if (!puzzle) return null;
  const rows = await DB.prepare("SELECT g.label, g.position AS groupPosition, m.character_id AS characterId, m.position AS memberPosition FROM puzzle_groups g JOIN group_members m ON m.group_id = g.id WHERE g.puzzle_id = ? ORDER BY g.position, m.position").bind(puzzle.id).all();
  const groups = Array.from({ length: 4 }, (_, position) => {
    const groupRows = rows.results.filter((row) => row.groupPosition === position);
    return { label: groupRows[0]?.label ?? "Untitled group", characterIds: groupRows.map((row) => row.characterId) };
  });
  return { slug: puzzle.slug, title: puzzle.title, playCount: puzzle.playCount, createdAt: puzzle.createdAt, groups };
}

async function verifyManager(DB, slug, token) {
  const row = await DB.prepare("SELECT id, manage_token_hash AS tokenHash FROM puzzles WHERE slug = ?").bind(slug).first();
  if (!row || !token || row.tokenHash !== await hashToken(token)) throw new Error("That management link is invalid.");
  return row.id;
}

async function insertGroups(DB, puzzleId, groups) {
  const statements = [];
  groups.forEach((group, groupIndex) => {
    const groupId = crypto.randomUUID();
    statements.push(DB.prepare("INSERT INTO puzzle_groups (id, puzzle_id, label, position) VALUES (?, ?, ?, ?)").bind(groupId, puzzleId, group.label, groupIndex));
    group.characterIds.forEach((characterId, memberIndex) => statements.push(DB.prepare("INSERT INTO group_members (id, group_id, character_id, position) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), groupId, characterId, memberIndex)));
  });
  return statements;
}

function shell(pathname) {
  const config = JSON.stringify({ characters }).replaceAll("<", "\\u003c");
  const title = pathname.startsWith("/create") ? "Create a puzzle · Multiverse Match" : pathname.startsWith("/manage") ? "Manage puzzle · Multiverse Match" : "Multiverse Match";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Create and share picture-based Marvel character connection puzzles. No account needed."><meta name="theme-color" content="#d72f35"><title>${title}</title><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23111827'/%3E%3Cpath d='M6 6h8v8H6zm0 12h8v8H6zm12 0h8v8h-8z' fill='%23f4c95d'/%3E%3Cpath d='M18 6h8v8h-8z' fill='%23d72f35'/%3E%3C/svg%3E"><style>${CSS}</style></head><body><header class="site-header"><a class="brand" href="/" aria-label="Multiverse Match home"><span class="brand-mark"><span class="brand-grid"><i></i><i></i><i></i><i></i></span></span><span>Multiverse Match</span></a><a class="create-link" href="/create"><b>＋</b><span>Make a puzzle</span></a></header><div id="app"></div><footer class="site-footer"><span>Fan-made puzzle project. Not affiliated with or endorsed by Marvel.</span><a href="https://github.com/akabab/superhero-api" target="_blank" rel="noreferrer">Character data &amp; portraits: Superhero API</a></footer><script>window.__MM__=${config};</script><script>${CLIENT_JS}</script></body></html>`;
}

async function api(request, env, pathname) {
  if (!env.DB) return json({ error: "Puzzle storage is unavailable." }, 503);
  const DB = env.DB;

  if (pathname === "/api/puzzles" && request.method === "POST") {
    try {
      const input = validatePuzzle(await request.json());
      const puzzleId = crypto.randomUUID();
      const slug = randomString(8);
      const manageToken = randomString(48);
      const now = Date.now();
      const statements = [DB.prepare("INSERT INTO puzzles (id, slug, title, manage_token_hash, status, play_count, created_at, updated_at) VALUES (?, ?, ?, ?, 'published', 0, ?, ?)").bind(puzzleId, slug, input.title, await hashToken(manageToken), now, now), ...(await insertGroups(DB, puzzleId, input.groups))];
      await DB.batch(statements);
      return json({ slug, manageToken }, 201);
    } catch (error) { return json({ error: error instanceof Error ? error.message : "The puzzle could not be published." }, 400); }
  }

  const publicMatch = pathname.match(/^\/api\/public\/([a-z0-9]+)$/);
  if (publicMatch && request.method === "GET") {
    const puzzle = await getPuzzle(DB, publicMatch[1]);
    return puzzle ? json(puzzle) : json({ error: "Puzzle not found." }, 404);
  }

  const playMatch = pathname.match(/^\/api\/puzzles\/([a-z0-9]+)\/play$/);
  if (playMatch && request.method === "POST") {
    try {
      const payload = await request.json();
      const puzzle = await DB.prepare("SELECT id FROM puzzles WHERE slug = ?").bind(playMatch[1]).first();
      if (puzzle) await DB.batch([
        DB.prepare("INSERT INTO plays (id, puzzle_id, mistakes, completed, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), puzzle.id, Math.max(0, Math.min(20, Number(payload.mistakes) || 0)), payload.completed ? 1 : 0, Date.now()),
        DB.prepare("UPDATE puzzles SET play_count = play_count + 1 WHERE id = ?").bind(puzzle.id),
      ]);
      return json({ ok: true });
    } catch { return json({ ok: false }, 400); }
  }

  const puzzleMatch = pathname.match(/^\/api\/puzzles\/([a-z0-9]+)$/);
  if (puzzleMatch) {
    const slug = puzzleMatch[1];
    const token = request.headers.get("x-manage-token") ?? "";
    try {
      const puzzleId = await verifyManager(DB, slug, token);
      if (request.method === "GET") {
        const puzzle = await getPuzzle(DB, slug);
        return puzzle ? json(puzzle) : json({ error: "Puzzle not found." }, 404);
      }
      if (request.method === "PUT") {
        const input = validatePuzzle(await request.json());
        const groupRows = await DB.prepare("SELECT id FROM puzzle_groups WHERE puzzle_id = ?").bind(puzzleId).all();
        const statements = [
          ...groupRows.results.map((row) => DB.prepare("DELETE FROM group_members WHERE group_id = ?").bind(row.id)),
          DB.prepare("DELETE FROM puzzle_groups WHERE puzzle_id = ?").bind(puzzleId),
          DB.prepare("UPDATE puzzles SET title = ?, updated_at = ? WHERE id = ?").bind(input.title, Date.now(), puzzleId),
          ...(await insertGroups(DB, puzzleId, input.groups)),
        ];
        await DB.batch(statements);
        return json({ ok: true });
      }
      if (request.method === "DELETE") {
        await DB.prepare("DELETE FROM puzzles WHERE id = ?").bind(puzzleId).run();
        return json({ ok: true });
      }
      return json({ error: "Method not allowed." }, 405);
    } catch (error) { return json({ error: error instanceof Error ? error.message : "Access denied." }, 403); }
  }
  return json({ error: "Not found." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await api(request, env, url.pathname);
      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
      const known = url.pathname === "/" || url.pathname === "/create" || /^\/p\/[a-z0-9]+$/.test(url.pathname) || /^\/manage\/[a-z0-9]+$/.test(url.pathname);
      if (!known) return new Response(shell("/404"), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
      return new Response(shell(url.pathname), { headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-content-type-options": "nosniff",
        "content-security-policy": "default-src 'self'; img-src 'self' https://cdn.jsdelivr.net data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'",
      } });
    } catch (error) {
      console.error(error);
      return url.pathname.startsWith("/api/") ? json({ error: "The request could not be completed." }, 500) : new Response(shell(url.pathname), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
  },
};
