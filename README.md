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

## Data source

Content is loaded directly from the configured Postgres database via Payload queries.
