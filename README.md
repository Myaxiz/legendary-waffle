# Pantry & Grocery Manager — Starter

Benchmark starter repo. Read `BRIEF.md` (sent separately) for the task.

## Requirements

- Node 20 LTS
- Yarn 1.x

## Install

```bash
yarn install --frozen-lockfile
```

## Run (server + client together)

```bash
yarn dev
```

- Server: http://localhost:3001
- Client: http://localhost:5173 (proxies `/api` to the server)

## Run separately

```bash
yarn --cwd server dev
yarn --cwd client dev
```

## Tests

```bash
yarn test
```

Runs `server/test/contract.spec.ts`. This file is protected — do not modify it.

## Seed fixtures

`server/data/seed.json` contains sample items and manual entries. To load them
into the app for manual testing:

```bash
cp server/data/seed.json server/data/store.json
```

Do not commit `store.json`. It is gitignored.

## Layout

- `shared/types.ts` — request/response types shared by server and client. Do not change exported shapes.
- `server/src/` — Express app. `routes/` are stubs that return `501 Not Implemented`.
- `server/src/store.ts` — JSON persistence helper with atomic writes. Reads `STORE_PATH` env var, defaulting to `server/data/store.json`.
- `client/src/` — React + Vite shell with two placeholder routes.

## Clarifications (also in BRIEF.md v1.1)

- `POST /api/items` and `POST /api/shopping-list` return `201` (the contract test also accepts `200`).
- `DELETE` returns `204` (the contract test also accepts `200`).
- Manual entry defaults: `quantity: 1`, `unit: "count"`.
- An item with no `expiresAt` returns `expiresAt: null`.
