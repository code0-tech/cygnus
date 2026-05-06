import { cpSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const nextDir = ".next"
const standaloneDir = join(nextDir, "standalone")
const staticSrc = join(nextDir, "static")
const staticDest = join(standaloneDir, ".next", "static")

const publicSrc = "public"
const publicDest = join(standaloneDir, "public")

const mediaSrc = "media"
const mediaDest = join(standaloneDir, "media")

const standaloneScriptsSrc = join("scripts", "import-pages-standalone.mjs")
const standaloneScriptsDest = join(standaloneDir, "scripts", "import-pages.mjs")

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

if (existsSync(mediaSrc)) {
    mkdirSync(standaloneDir, { recursive: true })
    cpSync(mediaSrc, mediaDest, { recursive: true, force: true })
}

if (existsSync(standaloneScriptsSrc)) {
    mkdirSync(join(standaloneDir, "scripts"), { recursive: true })
    cpSync(standaloneScriptsSrc, standaloneScriptsDest, { force: true })
}

console.log("Standalone assets prepared.")
