import { mkdir, readdir, readFile } from "node:fs/promises"
import path from "node:path"
import nextEnv from "@next/env"
import { createLocalReq, getPayload } from "payload"
import { createImport } from "../node_modules/@payloadcms/plugin-import-export/dist/import/createImport.js"

type ImportableCollectionConfig = {
    admin?: {
        custom?: {
            "plugin-import-export"?: {
                collectionSlugs?: string[]
            }
        }
    }
}

const IMPORT_FORMAT = "json"
const IMPORT_MODE = "upsert"
const MATCH_FIELD = "id"

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

const getImportCollectionSlugs = (collections: Array<{ slug: string } & ImportableCollectionConfig>) => {
    const importCollection = collections.find((collection) => collection.slug === "imports") as
        | ImportableCollectionConfig
        | undefined

    const slugs = importCollection?.admin?.custom?.["plugin-import-export"]?.collectionSlugs

    if (!Array.isArray(slugs) || slugs.length === 0) {
        throw new Error("Could not determine importable collections from the import-export plugin configuration.")
    }

    return new Set(slugs)
}

const resolveImportUser = async (payload: Awaited<ReturnType<typeof getPayload>>) => {
    const requestedEmail = process.env.PAYLOAD_IMPORT_USER_EMAIL?.trim() || process.env.PAYLOAD_EXPORT_USER_EMAIL?.trim()

    const users = await payload.find({
        collection: "users",
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: requestedEmail
            ? {
                email: {
                    equals: requestedEmail,
                },
            }
            : undefined,
    })

    const user = users.docs[0]

    if (!user) {
        throw new Error(
            requestedEmail
                ? `Could not find a user with email "${requestedEmail}" for import authentication.`
                : "No users found. Create a Payload user first or set PAYLOAD_IMPORT_USER_EMAIL."
        )
    }

    return user
}

const main = async () => {
    let payload: Awaited<ReturnType<typeof getPayload>> | undefined

    try {
        const { default: config } = await import("../src/payload.config")
        const resolvedConfig = await config
        payload = await getPayload({ config: resolvedConfig })
        const user = await resolveImportUser(payload)
        const importUser = { ...user, collection: "users" as const }
        const importableCollections = getImportCollectionSlugs(resolvedConfig.collections)
        const inputDir = path.resolve(process.cwd(), "Export")

        await mkdir(inputDir, { recursive: true })

        const entries = await readdir(inputDir, { withFileTypes: true })
        const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(`.${IMPORT_FORMAT}`))

        for (const file of files) {
            const collectionSlug = file.name.slice(0, -(`.${IMPORT_FORMAT}`.length))

            if (!importableCollections.has(collectionSlug)) {
                console.log(`Skipping ${file.name}: no matching importable collection.`)
                continue
            }

            const filePath = path.join(inputDir, file.name)
            const buffer = await readFile(filePath)
            const req = await createLocalReq({ locale: "all", user: importUser }, payload)
            const result = await createImport({
                collectionSlug,
                file: {
                    data: buffer,
                    mimetype: "application/json",
                    name: file.name,
                },
                format: IMPORT_FORMAT,
                importMode: IMPORT_MODE,
                matchField: MATCH_FIELD,
                name: file.name,
                req,
                userCollection: importUser.collection,
                userID: importUser.id,
            })

            console.log(
                `Imported ${collectionSlug}: total=${result.total}, imported=${result.imported}, updated=${result.updated}, errors=${result.errors.length}`
            )

            if (result.errors.length > 0) {
                console.error(`Import errors in ${file.name}:`)
                console.error(result.errors)
                process.exitCode = 1
            }
        }
    } finally {
        await payload?.destroy()
    }
}

main().catch((error) => {
    console.error("Import failed.")
    console.error(error)
    process.exitCode = 1
})
