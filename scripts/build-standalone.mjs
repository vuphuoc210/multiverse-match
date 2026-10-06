import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const output = resolve(root, "dist/server");
const wranglerConfig = JSON.parse(await readFile(resolve(root, "wrangler.jsonc"), "utf8"));
await rm(resolve(root, "dist"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve(root, "worker"), output, { recursive: true });
await cp(resolve(root, "drizzle"), resolve(output, "drizzle"), { recursive: true });
await writeFile(resolve(output, "wrangler.json"), JSON.stringify({
  ...wranglerConfig,
  main: "index.js",
}, null, 2));
console.log("Built dependency-free Cloudflare Worker in dist/server");
