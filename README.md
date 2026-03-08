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

## Dependency overrides

The project currently keeps the following `package.json` `overrides` on purpose:

- `dompurify: 3.3.2`
- `@esbuild-kit/core-utils.esbuild: 0.25.12`
- `payload.ajv: 8.18.0`

Why they exist:

- `monaco-editor@0.55.1` still pins `dompurify` to `3.2.7`.
- `payload@3.79.0` still pins `ajv` to `8.17.1`.
- `@esbuild-kit/core-utils@3.3.2` still pins `esbuild` to `~0.18.20`.

When they can be removed:

- Upstream packages stop pinning these older transitive versions.
- A lockfile resolve without `overrides` keeps the same or newer safe versions.
- Verify with:

```powershell
npm explain dompurify
npm explain ajv
npm explain esbuild
```
