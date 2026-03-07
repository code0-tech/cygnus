import { cpSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const nextDir = ".next"
const standaloneDir = join(nextDir, "standalone")
const staticSrc = join(nextDir, "static")
const staticDest = join(standaloneDir, ".next", "static")
const publicSrc = "public"
const publicDest = join(standaloneDir, "public")

if (!existsSync(standaloneDir)) {
  throw new Error("Missing .next/standalone. Run `next build` with `output: 'standalone'` first.")
}

if (existsSync(staticSrc)) {
  mkdirSync(staticDest, { recursive: true })
  cpSync(staticSrc, staticDest, { recursive: true, force: true })
}

if (existsSync(publicSrc)) {
  mkdirSync(standaloneDir, { recursive: true })
  cpSync(publicSrc, publicDest, { recursive: true, force: true })
}

console.log("Standalone assets prepared.")
