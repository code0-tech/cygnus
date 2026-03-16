import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import nextEnv from "@next/env"
import { createLocalReq, getPayload } from "payload"
import { createExport } from "../node_modules/@payloadcms/plugin-import-export/dist/export/createExport.js"

type ExportableCollectionConfig = {
    admin?: {
        custom?: {
            "plugin-import-export"?: {
                collectionSlugs?: string[]
            }
        }
    }
}

const EXPORT_FORMAT = "json"

const { loadEnvConfig } = nextEnv

loadEnvConfig(process.cwd())

const getExportCollectionSlugs = (collections: Array<{ slug: string } & ExportableCollectionConfig>) => {
    const exportCollection = collections.find((collection) => collection.slug === "exports") as
        | ExportableCollectionConfig
        | undefined

    const slugs = exportCollection?.admin?.custom?.["plugin-import-export"]?.collectionSlugs

    if (!Array.isArray(slugs) || slugs.length === 0) {
        throw new Error("Could not determine exportable collections from the import-export plugin configuration.")
    }

    return slugs
}

const resolveExportUser = async (payload: Awaited<ReturnType<typeof getPayload>>) => {
    const users = await payload.find({
        collection: "users",
        limit: 1,
        overrideAccess: true,
        pagination: false,
    })

    const user = users.docs[0]

    if (!user) {
        throw new Error("No users found. Create a Payload user first.")
    }

    return user
}

const main = async () => {
    let payload: Awaited<ReturnType<typeof getPayload>> | undefined

    try {
        const { default: config } = await import("../src/payload.config")
        const resolvedConfig = await config
        payload = await getPayload({ config: resolvedConfig })
        const user = await resolveExportUser(payload)
        const exportUser = { ...user, collection: "users" as const }
        const exportableCollections = getExportCollectionSlugs(resolvedConfig.collections)
        const outputDir = path.resolve(process.cwd(), "export")

        await mkdir(outputDir, { recursive: true })

        for (const collectionSlug of exportableCollections) {
            const req = await createLocalReq({ locale: "all", user: exportUser }, payload)
            const response = await createExport({
                collectionSlug,
                download: true,
                exportCollection: "exports",
                format: EXPORT_FORMAT,
                id: `download-${collectionSlug}`,
                name: `export-${collectionSlug}`,
                req,
                userCollection: exportUser.collection,
                userID: exportUser.id,
            })

            const buffer = Buffer.from(await response!.arrayBuffer())
            const outputFile = path.join(outputDir, `${collectionSlug}.${EXPORT_FORMAT}`)

            await writeFile(outputFile, buffer, { flag: "w" })
            console.log(`Exported ${collectionSlug} -> ${outputFile}`)
        }
    } finally {
        await payload?.destroy()
    }
}

main().catch((error) => {
    console.error("Export failed.")
    console.error(error)
    process.exitCode = 1
})
