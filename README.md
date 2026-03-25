# Next.js Standalone Start

`npm run build` automatically prepares standalone assets via `postbuild` (`.next/static` and `public` are copied into `.next/standalone`).

## Database migrations

If you connect the project to a fresh or different Postgres database, run the Payload migrations before building or starting the standalone server.

Check migration status:

```powershell
npm run migrate:status
```

Apply all pending migrations:

```powershell
npm run migrate
```

Create a new migration after schema/config changes:

```powershell
npm run migrate:create your-migration-name
```

Notes:

- `npm run dev` can be more forgiving during development, but `npm run standalone` expects the Payload tables to exist.
- `/admin` requires the Payload auth tables such as `users` to exist.
- Run migrations against the same database that is configured in `DATABASE_URL`.

## 1) Build

After the database schema exists, build the app:

```powershell
npm run build
```

## 2) Start the standalone server

```powershell
npm run standalone
```

Recommended order for a fresh database:

```powershell
npm run migrate
npm run build
npm run standalone
```

## Data Export

Exports all import/export-enabled Payload collections as JSON files into [`export/`](./export).

```powershell
npm run export-data
```

Notes:

- The script requires a valid Payload user.
- The script loads environment variables from your Next.js `.env` files.
- Existing JSON files in `export/` are overwritten.

## Data Import

Imports all `*.json` files from [`export/`](./export) into the matching Payload collections.

```powershell
npm run import-data
```

Notes:

- The database schema / tables must already exist before running the import.
- Run `npm run migrate` first if the target database is still empty.
- The script always creates or reuses a temporary Payload user for the import process.
- The script uses `upsert` with `matchField: "id"`.
- If a document with the same `id` already exists, it is updated.
- If no document with that `id` exists, it is created.
- Existing documents with different IDs remain untouched.
- JSON files without a matching import-enabled collection are skipped.
