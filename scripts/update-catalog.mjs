import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const sourcePath = process.argv[2];
if (!sourcePath) {
  throw new Error("Usage: node scripts/update-catalog.mjs /path/to/superhero-api/all.json");
}

const source = JSON.parse(await readFile(resolve(sourcePath), "utf8"));

// The upstream dataset stores some Marvel characters under the name of an
// alter ego instead of the literal "Marvel Comics" publisher. These aliases
// preserve those records while keeping unrelated universes out of the roster.
const marvelPublisherAliases = new Set([
  "Angel",
  "Angel Salvadore",
  "Ant-Man",
  "Anti-Venom",
  "Anti-Vision",
  "Archangel",
  "Binary",
  "Boom-Boom",
  "Deadpool",
  "Evil Deadpool",
  "Giant-Man",
  "Goliath",
  "Iron Lad",
  "Jean Grey",
  "Meltdown",
  "Ms Marvel II",
  "Phoenix",
  "Power Man",
  "Power Woman",
  "Rune King Thor",
  "Scorpion",
  "She-Thing",
  "Spider-Carnage",
  "Speed Demon",
  "Tempest",
  "Thunderbird II",
  "Toxin",
  "Venom III",
  "Vindicator II",
]);

// Known source-data misclassifications outside the Marvel universe.
const excludedIds = new Set([160, 266]);

const roster = source
  .filter((character) => {
    const publisher = character?.biography?.publisher;
    return !excludedIds.has(character.id) &&
      (publisher === "Marvel Comics" || marvelPublisherAliases.has(publisher));
  })
  .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
  .map((character) => [
    character.id,
    character.name,
    character.biography.fullName || "",
    character.slug,
  ]);

const records = roster.map((record) => `  ${JSON.stringify(record)},`).join("\n");
const output = `// Generated from akabab/superhero-api v0.3.0 by scripts/update-catalog.mjs.\n` +
`const imageSources = (slug) => [\n` +
`  "https://cdn.jsdelivr.net/gh/akabab/superhero-api@0.3.0/api/images/md/" + slug + ".jpg",\n` +
`  "https://akabab.github.io/superhero-api/api/images/md/" + slug + ".jpg",\n` +
`  "https://raw.githubusercontent.com/akabab/superhero-api/0.3.0/api/images/md/" + slug + ".jpg",\n` +
`];\n\n` +
`export const characters = [\n${records}\n].map(([id, name, realName, slug]) => {\n` +
`  const images = imageSources(slug);\n` +
`  return { id, name, realName, image: images[0], imageFallbacks: images.slice(1) };\n` +
`});\n\n` +
`export const characterIds = new Set(characters.map((character) => character.id));\n`;

await writeFile(resolve("worker/catalog.js"), output);
console.log(`Generated ${roster.length} Marvel characters in worker/catalog.js`);
