import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { delimiter, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"

const projectRoot = resolve(import.meta.dirname, "..")
const baselinePath = process.env.PAYLOAD_SCHEMA_BASELINE_FILE ? resolve(projectRoot, process.env.PAYLOAD_SCHEMA_BASELINE_FILE) : resolve(projectRoot, "src/payload-schema.snapshot")
const temporaryDirectory = mkdtempSync(join(tmpdir(), "cygnus-payload-schema-"))
const generatedPath = join(temporaryDirectory, "payload-schema.snapshot")
const payloadBin = resolve(projectRoot, "node_modules/payload/bin.js")

function normalizedFile(path) {
    return readFileSync(path, "utf8").replaceAll("\r\n", "\n").trim()
}

try {
    const result = spawnSync(process.execPath, [payloadBin, "generate:db-schema", "--log=false", "--prettify=false"], {
        cwd: projectRoot,
        encoding: "utf8",
        env: {
            ...process.env,
            PATH: `${resolve(projectRoot, "node_modules/.bin")}${delimiter}${process.env.PATH ?? ""}`,
            PAYLOAD_SCHEMA_OUTPUT_FILE: generatedPath,
        },
        timeout: 120_000,
    })

    if (result.error) throw result.error

    if (result.status !== 0) {
        process.stderr.write(result.stdout ?? "")
        process.stderr.write(result.stderr ?? "")
        throw new Error(`Payload schema generation failed with exit code ${result.status ?? "unknown"}.`)
    }

    if (!existsSync(generatedPath)) {
        process.stderr.write(result.stdout ?? "")
        process.stderr.write(result.stderr ?? "")
        throw new Error(
            [
                `Payload did not create the temporary schema at ${generatedPath}.`,
                "Ensure postgresAdapter.generateSchemaOutputFile uses PAYLOAD_SCHEMA_OUTPUT_FILE when it is set.",
            ].join("\n")
        )
    }

    let baseline
    try {
        baseline = normalizedFile(baselinePath)
    } catch {
        throw new Error(`Missing schema baseline at ${baselinePath}. Create the required migration and refresh the schema baseline.`)
    }

    if (normalizedFile(generatedPath) !== baseline) {
        console.error(
            [
                "",
                "ERROR: Payload schema differs from the latest committed migration baseline.",
                "A Payload field may have been changed without creating a migration.",
                "",
                "Create and verify a migration:",
                "  npm run migrate:create -- <migration-name>",
                "",
                "Then refresh the baseline:",
                "  npm run migration:snapshot",
                "",
            ].join("\n")
        )
        process.exitCode = 1
    } else {
        console.log("Payload migration check passed: schema and migration baseline match.")
    }
} finally {
    rmSync(temporaryDirectory, { recursive: true, force: true })
}
