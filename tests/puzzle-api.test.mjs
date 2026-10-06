import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrangler = path.join(root, "node_modules", "wrangler", "bin", "wrangler.js");
const env = {
  ...process.env,
  WRANGLER_SEND_METRICS: "false",
  WRANGLER_WRITE_LOGS: "false",
};

let stateDir;
let server;
let baseUrl;
let serverOutput = "";

function runWrangler(args) {
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: 30_000,
  });
  assert.equal(
    result.status,
    0,
    `Wrangler failed (${result.status ?? result.signal}):\n${result.stdout}\n${result.stderr}`,
  );
}

async function unusedPort() {
  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const address = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function startServer() {
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [
    wrangler,
    "dev",
    "--local",
    "--persist-to",
    stateDir,
    "--config",
    "wrangler.jsonc",
    "--ip",
    "127.0.0.1",
    "--port",
    String(port),
  ], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });

  for (const stream of [server.stdout, server.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => { serverOutput = (serverOutput + chunk).slice(-8_000); });
  }

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Wrangler exited early:\n${serverOutput}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Wrangler is still starting; retry briefly.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for Wrangler:\n${serverOutput}`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill("SIGTERM");
  let timer;
  const didExit = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => { timer = setTimeout(() => resolve(false), 5_000); }),
  ]);
  clearTimeout(timer);
  if (!didExit) {
    server.kill("SIGKILL");
    await exited;
  }
}

before(async () => {
  stateDir = await mkdtemp(path.join(os.tmpdir(), "multiverse-match-test-"));
  runWrangler([
    "d1", "migrations", "apply", "DB", "--local",
    "--persist-to", stateDir, "--config", "wrangler.jsonc",
  ]);
  await startServer();
});

after(async () => {
  await stopServer();
  if (stateDir) await rm(stateDir, { recursive: true, force: true });
});

test("puzzle API supports create, play, authenticated edit, and delete", async () => {
  const groups = [
    { label: "Group One", characterIds: [1, 4, 5, 6] },
    { label: "Group Two", characterIds: [10, 11, 12, 13] },
    { label: "Group Three", characterIds: [24, 25, 26, 29] },
    { label: "Group Four", characterIds: [30, 31, 34, 35] },
  ];

  const create = await fetch(`${baseUrl}/api/puzzles`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Automated Test Puzzle", groups }),
  });
  const created = await create.json();
  assert.equal(create.status, 201, JSON.stringify(created));
  const { slug, manageToken } = created;
  assert.ok(slug);
  assert.ok(manageToken);

  const publicUrl = `${baseUrl}/api/public/${slug}`;
  const publicPuzzle = await fetch(publicUrl);
  assert.equal(publicPuzzle.status, 200);
  assert.equal((await publicPuzzle.json()).title, "Automated Test Puzzle");

  const invalidManager = await fetch(`${baseUrl}/api/puzzles/${slug}`, {
    headers: { "x-manage-token": "not-the-token" },
  });
  assert.equal(invalidManager.status, 403);

  const play = await fetch(`${baseUrl}/api/puzzles/${slug}/play`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mistakes: 1, completed: true }),
  });
  assert.equal(play.status, 200);
  assert.equal((await (await fetch(publicUrl)).json()).playCount, 1);

  const updatedGroups = groups.map((group, index) => index === 0
    ? { ...group, label: "Edited Group" }
    : group);
  const update = await fetch(`${baseUrl}/api/puzzles/${slug}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-manage-token": manageToken },
    body: JSON.stringify({ title: "Edited Test Puzzle", groups: updatedGroups }),
  });
  assert.equal(update.status, 200);
  const edited = await fetch(publicUrl);
  assert.equal(edited.status, 200);
  const editedPuzzle = await edited.json();
  assert.equal(editedPuzzle.title, "Edited Test Puzzle");
  assert.equal(editedPuzzle.groups[0].label, "Edited Group");

  const remove = await fetch(`${baseUrl}/api/puzzles/${slug}`, {
    method: "DELETE",
    headers: { "x-manage-token": manageToken },
  });
  assert.equal(remove.status, 200);
  assert.equal((await fetch(publicUrl)).status, 404);
});
