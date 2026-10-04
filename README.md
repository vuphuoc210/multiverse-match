# Multiverse Match

An anonymous, link-based Marvel character connections game. Players can solve a picture grid, create a four-by-four puzzle, publish it without an account, and keep a private management link for later edits or deletion.

## Architecture

- Dependency-free Cloudflare Worker in `worker/`
- Cloudflare D1 schema and migration in `drizzle/`
- Version-pinned character metadata and portraits from the open-source Superhero API
- Puzzle management tokens are SHA-256 hashed before storage
- Public puzzles are unlisted and addressed by random slugs

## Build

```sh
npm run build
```

The build copies the deployable Worker modules to `dist/server/`.
