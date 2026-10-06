# GitHub and Cloudflare Deployment Plan

## Goal

Keep the application easy to develop and test locally, then deploy it to a Cloudflare Worker backed by production D1 when explicitly approved. GitHub Pages is not needed; the Worker serves both the frontend and API.

Production setup and deployment have now been explicitly requested. No production D1 database has been created, no remote migrations have been applied, and nothing has been published yet. Continue with the manual, account-authenticated steps below; do not enable automatic deployment as part of this first release.

```text
Local development                   Future production (approval required)
Wrangler dev + local D1              GitHub Actions (manual/protected)
       |                                      |
.wrangler/state                       Cloudflare Worker + remote D1
```

## Phase 1: Make local development reproducible

### 1. Establish one Wrangler configuration

**Implemented locally:** a root `wrangler.jsonc` now defines the Worker entry point, compatibility settings, D1 binding, and migration directory. It uses `worker/index.js`, binding `DB`, and `drizzle/`.

The Vite Cloudflare plugin and `scripts/build-standalone.mjs` now consume or derive from that configuration instead of maintaining separate D1 definitions. The Vite app keeps its adapter Worker entry point while inheriting the root D1 binding. The standalone build still generates a config for its copied Worker, derived from the root config.

Wrangler and the Vite preview are configured to use `.wrangler/state`. The supported Wrangler dev and migration scripts explicitly include `--persist-to .wrangler/state`; omitting it has already caused the app to connect to an empty local database and return `no such table: puzzles`. A read-only D1 verification from the user terminal remains the final local runtime check; this execution environment blocks Wrangler's local listener with `EPERM`.

Cloudflare recommends JSON/JSONC for new Wrangler configurations and treating Wrangler configuration as the source of truth. `migrations_dir` may point to `drizzle/`. [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)

### 2. Pin dependencies and provide clear scripts

Wrangler is now pinned as a development dependency (`4.148.0`), with `dev` and `db:migrate:local` scripts wired to the root config and shared local store. Add and commit a valid `package-lock.json` once npm registry access is available; lock generation could not complete in the network-restricted execution environment. The scripts are:

```json
{
  "scripts": {
    "dev": "wrangler dev --local --persist-to .wrangler/state",
    "build": "node scripts/build-standalone.mjs",
    "check:deploy": "wrangler deploy --dry-run",
    "db:migrate:local": "wrangler d1 migrations apply DB --local --persist-to .wrangler/state"
  }
}
```

If the root Wrangler config points directly to `worker/index.js`, the build is not required to run the local Worker; retain `build` for producing the standalone package. Avoid scripts that silently use `npx --yes` to fetch an unpinned Wrangler version.

The local workflow for a fresh checkout should be:

```sh
npm ci
npm run db:migrate:local
npm run dev
```

Local mode must remain the default. Never add `--remote` to the ordinary development or migration scripts.

### 3. Keep generated state and secrets untracked

Ensure Git ignores at least:

- `node_modules/`, `dist/`, and all `.wrangler/` directories
- `.env*` and `.dev.vars*`
- `.sites-runtime/`, `.agents/`, and `.codex/`
- Local SQLite database and log files

Commit the SQL migrations in `drizzle/`; do not commit local SQLite files, credentials, or generated state. The current ignore rules already cover several of these paths; add `.dev.vars*` explicitly.

### 4. Verify the local Worker and D1 end to end

Before adding deployment automation, verify locally that the app and migration command use the same `.wrangler/state` store. Then test:

1. Load the home page.
2. Create a puzzle and receive a share link.
3. Open and play the public puzzle; verify its play count changes.
4. Open the private management link, edit the puzzle, and confirm the public version changes.
5. Confirm an invalid management token is rejected.
6. Delete the puzzle and confirm the public link returns `404`.

**Implemented locally:** `npm test` runs direct API unit tests for validation/storage errors and the API lifecycle (`create -> public read -> record play -> authenticated update -> delete`) against a temporary local D1 database, then removes that database. CI should use this isolated test, never production D1. Consider Workers Vitest integration later if stronger isolation is useful.

## Phase 2: GitHub source control and non-deploying CI

### 5. Create and connect a GitHub repository

The local repository currently has no Git remote configured. When ready, create a repository—preferably private during development—then connect and push it. This is a separate external action and should happen only when requested.

### 6. Add CI checks without publishing

Add a GitHub Actions workflow that runs on pull requests and pushes but only performs verification:

1. Check out the repository and install Node.js 22.
2. Run `npm ci`.
3. Run tests and the local D1 smoke test.
4. Run `npm run check:deploy` as a dry run.

Do not include `wrangler d1 migrations apply DB --remote` or `wrangler deploy` in this verification workflow. A dry run must not publish the Worker or mutate production D1.

## Phase 3: Production setup and deployment (explicit approval required)

Proceed only after the owner explicitly says to set up production or publish.

### 7. Provision production D1

From an authenticated developer machine, create the production D1 database once:

```sh
npx wrangler login
npx wrangler d1 create multiverse-match
```

Put the returned database ID in the production Wrangler configuration. A database ID is configuration, not a credential; API tokens must never be committed. Do not point local commands at the remote database.

### 8. Deploy manually first

For the first release, use an explicit, manually run deployment workflow or a deliberate local deployment command. Before applying migrations, review the exact target database and pending migrations. Then apply remote migrations and deploy the Worker. Verify the deployed URL and puzzle lifecycle.

Keep this manual until production deployment and recovery procedures have been exercised. Do not add a push-to-`main` deployment trigger by default.

If automated production deployment is later desired, require a protected GitHub Environment with approval, use a concurrency group to prevent overlapping migrations/deployments, and scope the Cloudflare API token to the intended account and minimum required permissions. Store `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as GitHub secrets. Cloudflare documents these requirements for non-interactive GitHub Actions deployments. [Cloudflare GitHub Actions guidance](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)

### 9. Manage production migrations safely

- Create a new numbered migration for every schema change.
- Test each migration against local D1 first.
- Never edit a migration already applied remotely.
- Prefer backward-compatible expand/deploy/contract changes.
- Require deliberate review for destructive migrations.
- Apply production migrations only after confirming the remote database target and reviewing pending changes.
- Keep production data in D1, never in GitHub or build artifacts.

Wrangler applies unapplied D1 migration files and reports progress; remote application is a production data operation and must stay behind the approval gate. [D1 migration commands](https://developers.cloudflare.com/d1/wrangler-commands/)

## Existing Sites/Vite configuration

Keep `.openai/hosting.json` while `vite.config.ts` imports it. Direct Worker deployment should use the root Wrangler configuration. Once the root-config local workflow works, decide separately whether the Vite/Sites preview remains useful. Remove Sites-only configuration or dependencies only in a separately reviewed cleanup.

## Completion criteria

### Local and CI readiness

- A fresh checkout can install with `npm ci`, migrate local D1, and start the local Worker.
- The app and migrations use the same `.wrangler/state` path.
- Core puzzle operations pass locally and in CI against a temporary local database.
- `wrangler deploy --dry-run` succeeds in CI.
- No database files, API tokens, or environment secrets are tracked by Git.

### Production readiness (only after approval)

- Production D1 is provisioned and its ID is configured.
- A manual/protected workflow applies migrations and deploys successfully.
- The deployed Worker can create, read, update, and delete puzzles in remote D1.
- The deployed URL and recovery/deployment instructions are documented in `README.md`.
- No automatic deployment trigger is enabled unless separately approved.
