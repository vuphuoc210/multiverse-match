# Multiverse Match

An anonymous, link-based Marvel character connections game. Players can solve a picture grid, create a four-by-four puzzle, publish it without an account, and keep a private management link for later edits or deletion.

## Architecture

- Dependency-free Cloudflare Worker in `worker/`
- Cloudflare D1 schema and migration in `drizzle/`
- A 300-character Marvel roster generated from the version-pinned open-source Superhero API dataset
- Puzzle management tokens are SHA-256 hashed before storage
- Public puzzles are unlisted and addressed by random slugs

## Local development

Install the pinned dependencies, initialize the local D1 database, and start the Worker:

```sh
npm install
npm run db:migrate:local
npm run dev
```

Wrangler prints the local URL (normally `http://localhost:8787`). Keep the dev server running in that terminal. The dev and migration scripts both use `.wrangler/state`; they do not access a hosted database or publish the site.

## Tests

Run the API unit and local integration tests with:

```sh
npm test
```

Unit tests exercise request validation and storage error handling directly. The integration test starts a temporary local Worker and D1 database, tests puzzle creation, play tracking, authenticated editing, invalid-token rejection, and deletion, then removes the temporary database.

## Build

```sh
npm run build
```

The build copies the deployable Worker modules to `dist/server/` and derives its Wrangler config from the root `wrangler.jsonc`.

## Refresh the character catalog

Download `api/all.json` from [akabab/superhero-api v0.3.0](https://github.com/akabab/superhero-api/tree/0.3.0), then run:

```sh
node scripts/update-catalog.mjs /path/to/all.json
```

This rebuilds `worker/catalog.js` with every Marvel-associated character in that dataset, including records whose publisher field contains a Marvel alter ego rather than `Marvel Comics`.
