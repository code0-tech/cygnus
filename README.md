# Next.js Standalone Start

`npm run build` automatically prepares standalone assets via `postbuild` (`.next/static` and `public` are copied into `.next/standalone`).

## 1) Build

```powershell
npm run build
```

## 2) Start the standalone server

```powershell
npm run standalone
```

## Data Export

Exports all import/export-enabled Payload collections as JSON files into [`Export/`](/C:/Users/Marius/OneDrive/Desktop/Projects/code0/cygnus/Export).

```powershell
npm run export-data
```

Notes:

- The script requires a valid Payload user.
- The script loads environment variables from your Next.js `.env` files.
- Existing JSON files in `export/` are overwritten.

## Data Import

Imports all `*.json` files from [`export/`](/C:/Users/Marius/OneDrive/Desktop/Projects/code0/cygnus/export) into the matching Payload collections.

```powershell
npm run import-data
```

Optional: import with a specific Payload user

```powershell
$env:PAYLOAD_IMPORT_USER_EMAIL="you@example.com"
npm run import-data
```

Notes:

- The database schema / tables must already exist before running the import.
- The script uses `upsert` with `matchField: "id"`.
- If a document with the same `id` already exists, it is updated.
- If no document with that `id` exists, it is created.
- Existing documents with different IDs remain untouched.
- JSON files without a matching import-enabled collection are skipped.
