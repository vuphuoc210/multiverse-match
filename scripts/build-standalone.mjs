import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist/server");
await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "worker"), output, { recursive: true });
await writeFile(resolve(output, "wrangler.json"), JSON.stringify({
  name: "multiverse-match",
  main: "index.js",
  compatibility_date: "2026-10-04",
  d1_databases: [{ binding: "DB", database_name: "multiverse-match", database_id: "local" }]
}, null, 2));
console.log("Built dependency-free Cloudflare Worker in dist/server");
