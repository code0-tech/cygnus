import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"
import { getPayload } from "payload"
import type { Payload } from "payload"
import { importPages, normalizeImportLocale, normalizePageImportDocs } from "../src/lib/importPages"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith("--"))
const inputPath = path.resolve(process.cwd(), positional[0] ?? "pages.json")
const localeArg = args.find((arg) => arg.startsWith("--locale="))
const locale = normalizeImportLocale(localeArg?.split("=")[1] || process.env.PAYLOAD_IMPORT_LOCALE || "en")
const dryRun = args.includes("--dry-run")

const toErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(typeof error === "object" ? error : {}),
    }
  }

  return error
}

const main = async () => {
  nextEnv.loadEnvConfig(process.cwd())

  const { default: config } = await import("../src/payload.config")
  const raw = await fs.readFile(inputPath, "utf8")
  const docs = normalizePageImportDocs(JSON.parse(raw))
  let payload: Payload | undefined

  try {
    payload = await getPayload({ config })
    const result = await importPages({
      docs,
      dryRun,
      locale,
      payload,
    })

    console.log(
      JSON.stringify(
        {
          file: path.relative(path.resolve(dirname, ".."), inputPath),
          ...result,
        },
        null,
        2,
      ),
    )

    if (result.rejected > 0) {
      process.exitCode = 1
    }
  } finally {
    await payload?.db?.destroy?.()
  }
}

main().catch((error) => {
  console.error(toErrorDetails(error))
  process.exit(1)
})
