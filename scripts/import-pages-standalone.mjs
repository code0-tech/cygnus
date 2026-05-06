import fs from "node:fs/promises"
import path from "node:path"

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith("--"))
const inputPath = path.resolve(process.cwd(), positional[0] ?? "pages.json")
const locale = args.find((arg) => arg.startsWith("--locale="))?.split("=")[1] || "en"
const url = args.find((arg) => arg.startsWith("--url="))?.split("=")[1] || process.env.NEXT_PUBLIC_APP_URL
const dryRun = args.includes("--dry-run")

const endpoint = new URL("/api/import-pages", url)
endpoint.searchParams.set("locale", locale)
if (dryRun) endpoint.searchParams.set("dryRun", "true")

const response = await fetch(endpoint, {
  body: await fs.readFile(inputPath, "utf8"),
  headers: {
    "content-type": "application/json",
  },
  method: "POST",
})

const text = await response.text()
let result = text
let rejected = 0

try {
  const parsed = JSON.parse(text)
  rejected = Number(parsed?.rejected ?? 0)
  result = JSON.stringify(parsed, null, 2)
} catch {
}

console.log(result)

if ((!response.ok && response.status !== 207) || rejected > 0) {
  process.exitCode = 1
}
