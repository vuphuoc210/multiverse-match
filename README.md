# Multiverse Match

An anonymous, link-based Marvel character connections game. Players can solve a picture grid, create a four-by-four puzzle, publish it without an account, and keep a private management link for later edits or deletion.

## Architecture

- Dependency-free Cloudflare Worker in `worker/`
- Cloudflare D1 schema and migration in `drizzle/`
- A 300-character Marvel roster generated from the version-pinned open-source Superhero API dataset
- Puzzle management tokens are SHA-256 hashed before storage
- Public puzzles are unlisted and addressed by random slugs

## Build

```sh
npm run build
```

The build copies the deployable Worker modules to `dist/server/`.

## Refresh the character catalog

Download `api/all.json` from [akabab/superhero-api v0.3.0](https://github.com/akabab/superhero-api/tree/0.3.0), then run:

```sh
node scripts/update-catalog.mjs /path/to/all.json
```

This rebuilds `worker/catalog.js` with every Marvel-associated character in that dataset, including records whose publisher field contains a Marvel alter ego rather than `Marvel Comics`.
