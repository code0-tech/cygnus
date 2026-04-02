import { access, copyFile, mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"
import { createLocalReq, getPayload } from "payload"
import { createImport } from "../node_modules/@payloadcms/plugin-import-export/dist/import/createImport.js"
import { sanitizeLexicalUploadValues } from "../src/lib/sanitizeLexicalUploadValues"

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
const MATCH_FIELD = "id"
const DELETE_BATCH_SIZE = 100
const DEFAULT_DATA_DIR = "export"
const AUTH_COLLECTION_SLUG = "users"
const CENTRAL_LOGIN_EMAIL = "admin@code0.tech"
const CENTRAL_LOGIN_NAME = "Code0 Admin"
const MEDIA_COLLECTION_SLUG = "media"
const NAVBAR_COLLECTION_SLUG = "navbarItems"
const FOOTER_COLLECTION_SLUG = "footer"
const FEATURES_COLLECTION_SLUG = "features"
const SECTIONS_COLLECTION_SLUG = "sections"
const TEAM_MEMBERS_COLLECTION_SLUG = "team-members"
const BLOG_COLLECTION_SLUG = "blog"
const IMPORT_ORDER = [
    "media",
    "navbarItems",
    "sections",
    "footer",
    "cookie-banner",
    "pages",
    "features",
    "jobs",
    "team-members",
    "blog",
    "roadmapItems",
] as const

const { loadEnvConfig } = nextEnv
const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, "..")

loadEnvConfig(process.cwd())
process.env.PAYLOAD_SKIP_EMAIL_VERIFY = "true"

type PayloadInstance = Awaited<ReturnType<typeof getPayload>>
type ImportUser = Awaited<ReturnType<typeof resolveImportUser>>["user"] & { collection: "users" }
type ImportLocale = "all" | "en" | "de"
type ImportErrorEntry<TDocument> = { error: string; index: number; doc: TDocument }

let mediaImportSourceDir: string | undefined

const getImportCollectionSlugs = (collections: Array<{ slug: string } & ImportableCollectionConfig>) => {
    const importCollection = collections.find((collection) => collection.slug === "imports") as
        | ImportableCollectionConfig
        | undefined

    const slugs = importCollection?.admin?.custom?.["plugin-import-export"]?.collectionSlugs

    if (!Array.isArray(slugs) || slugs.length === 0) {
        throw new Error("Could not determine importable collections from the import-export plugin configuration.")
    }

    return slugs.filter((slug) => slug !== AUTH_COLLECTION_SLUG)
}

const resolveImportUser = async (payload: PayloadInstance) => {
    const users = await payload.find({
        collection: "users",
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
            email: {
                equals: CENTRAL_LOGIN_EMAIL,
            },
        },
    })

    const user = users.docs[0]

    if (!user) {
        const createdUser = await payload.create({
            collection: AUTH_COLLECTION_SLUG,
            data: {
                email: CENTRAL_LOGIN_EMAIL,
                name: CENTRAL_LOGIN_NAME,
                password: process.env.PAYLOAD_USER_PASS ?? "TempImportPass123!",
            },
            overrideAccess: true,
        })

        console.log(`Created central login user ${createdUser.id} (${CENTRAL_LOGIN_EMAIL}).`)

        return {
            user: createdUser,
        }
    }

    await payload.update({
        collection: AUTH_COLLECTION_SLUG,
        id: user.id,
        data: {
            email: CENTRAL_LOGIN_EMAIL,
            name: CENTRAL_LOGIN_NAME,
            password: process.env.PAYLOAD_USER_PASS ?? "TempImportPass123!",
        },
        overrideAccess: true,
    })

    console.log(`Updated central login user ${user.id} (${CENTRAL_LOGIN_EMAIL}).`)

    return {
        user: {
            ...user,
            email: CENTRAL_LOGIN_EMAIL,
            name: CENTRAL_LOGIN_NAME,
        },
    }
}

const resolveInputDir = async () => {
    const preferredDir = path.resolve(process.cwd(), process.env.PAYLOAD_DATA_DIR?.trim() || DEFAULT_DATA_DIR)

    try {
        await readdir(preferredDir)
        return preferredDir
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error
        }
    }

    const legacyDir = path.resolve(process.cwd(), "export")

    try {
        await readdir(legacyDir)
        return legacyDir
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error
        }
    }

    await mkdir(preferredDir, { recursive: true })

    return preferredDir
}

const clearCollection = async (
    payload: PayloadInstance,
    collectionSlug: string,
    options?: {
        keepDocumentID?: number | string
    }
) => {
    let deletedCount = 0
    const keepDocumentID = options?.keepDocumentID

    while (true) {
        let deletedInPass = 0
        const existingDocs = await payload.find({
            collection: collectionSlug as "users",
            depth: 0,
            limit: DELETE_BATCH_SIZE,
            overrideAccess: true,
            page: 1,
        })

        if (existingDocs.docs.length === 0) {
            break
        }

        for (const doc of existingDocs.docs) {
            if (keepDocumentID && String(doc.id) === String(keepDocumentID)) {
                continue
            }

            await payload.delete({
                collection: collectionSlug as "users",
                id: doc.id,
                overrideAccess: true,
            })

            deletedCount += 1
            deletedInPass += 1
        }

        if (deletedInPass === 0) {
            break
        }
    }

    console.log(`Cleared ${collectionSlug}: deleted=${deletedCount}`)
}

const getImportedDocumentIDs = (buffer: Buffer) => {
    const parsed = JSON.parse(buffer.toString("utf8")) as unknown

    if (!Array.isArray(parsed)) {
        throw new Error("Import file must contain a JSON array of documents.")
    }

    return new Set(
        parsed
            .map((doc) => (typeof doc === "object" && doc !== null ? (doc as { id?: number | string }).id : undefined))
            .filter((id): id is number | string => id !== undefined && id !== null)
            .map((id) => String(id))
    )
}

const sortCollectionSlugs = (collectionSlugs: string[], direction: "import" | "clear") => {
    const orderedSlugs = IMPORT_ORDER.filter((slug) => collectionSlugs.includes(slug))
    const remainingSlugs = collectionSlugs.filter((slug) => !IMPORT_ORDER.includes(slug as (typeof IMPORT_ORDER)[number]))
    const sorted = [...orderedSlugs, ...remainingSlugs]

    return direction === "clear" ? sorted.reverse() : sorted
}

type ImportedMediaDocument = {
    id?: number | string
    alt?: string
    createdAt?: string
    filename?: string
    focalX?: number | null
    focalY?: number | null
    href?: string | null
    updatedAt?: string
}

type ImportedNavbarItemDocument = {
    createdAt?: string
    href?: string | null
    id?: number | string
    order?: number
    subMenu?:
        | Array<{
            color?: "brand" | "pink" | "yellow" | "aqua" | "blue"
            description?: Record<string, string> | null
            href?: string
            icon?: "cube" | "gitBranch" | "lock"
            id?: string | null
            key?: string
            title?: Record<string, string> | null
        }>
        | null
    title?: Record<string, string> | null
    updatedAt?: string
}

type ImportedTeamMemberDocument = {
    about?: Record<string, string> | null
    createdAt?: string
    id?: number | string
    image?: {
        id?: number | string
    } | number | string | null
    joinedAt?: string | null
    name?: string
    role?: Record<string, string> | null
    shortDescription?: Record<string, string> | null
    updatedAt?: string
}

type ImportedBlogDocument = {
    author?: {
        id?: number | string
    } | number | string | null
    content?: Record<string, unknown> | null
    createdAt?: string
    heroImage?: {
        id?: number | string
    } | number | string | null
    id?: number | string
    meta?: {
        title?: Record<string, string | null> | null
        description?: Record<string, string | null> | null
        image?: {
            id?: number | string
        } | number | string | null
        keywords?: Record<string, string | null> | null
    } | null
    ogImage?: {
        id?: number | string
    } | number | string | null
    shortDescription?: Record<string, string> | null
    slug?: string
    title?: Record<string, string> | null
    twitterImage?: {
        id?: number | string
    } | number | string | null
    updatedAt?: string
}

type ImportedFooterDocument = {
    company_name?: Record<string, string> | null
    createdAt?: string
    groups?:
        | Array<{
            heading?: Record<string, string> | null
            id?: string | null
            items?:
                | Array<{
                    id?: string | null
                    label?: Record<string, string> | null
                    url?: string
                }>
                | null
        }>
        | null
    id?: number | string
    updatedAt?: string
}

type ImportedFeatureDocument = {
    createdAt?: string
    description?: Record<string, string> | null
    id?: number | string
    link?: {
        label?: Record<string, string> | null
        url?: string | null
    } | null
    slug?: string
    title?: Record<string, string> | null
    updatedAt?: string
}

type ImportedSectionDocument = {
    createdAt?: string
    heading?: Record<string, string> | null
    id?: number | string
    link_button?: {
        label?: Record<string, string | null> | null
        url?: string | null
    } | null
    sectionType?:
        | "AppFeatureSection"
        | "FaqSection"
        | "RoadmapSection"
        | "RuntimeFeatureSection"
        | "UseCaseSection"
        | "DeploymentSection"
    subheading?: Record<string, string> | null
    updatedAt?: string
}

const parseImportDocuments = <T>(buffer: Buffer) => {
    const parsed = JSON.parse(buffer.toString("utf8")) as unknown

    if (!Array.isArray(parsed)) {
        throw new Error("Import file must contain a JSON array of documents.")
    }

    return parsed as T[]
}

const normalizeNumericID = (value: number | string | undefined) => {
    if (typeof value === "number") {
        return value
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value)

        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return undefined
}

const resolveMediaFilePath = async (filename?: string) => {
    const filterParts = (...parts: Array<string | undefined>) =>
        parts.filter((part): part is string => Boolean(part))

    const candidatePaths = [
        mediaImportSourceDir ? path.resolve(...filterParts(mediaImportSourceDir, filename)) : undefined,
        path.resolve(...filterParts(projectRoot, "media", filename)),
        path.resolve(...filterParts(projectRoot, ".next", "standalone", "media", filename)),
        path.resolve(...filterParts(projectRoot, "public", filename)),
        path.resolve(...filterParts(process.cwd(), "media", filename)),
        path.resolve(...filterParts(process.cwd(), ".next", "standalone", "media", filename)),
        path.resolve(...filterParts(process.cwd(), "public", filename)),
    ]

    for (const candidatePath of [...new Set(candidatePaths.filter((value): value is string => Boolean(value)))]) {
        try {
            await access(candidatePath)
            return candidatePath
        } catch {
            // Continue until a readable file is found.
        }
    }

    return undefined
}

const prepareMediaImportSource = async () => {
    const sourceDir = await resolveMediaFilePath(undefined);
    if (sourceDir === undefined) {
        throw new Error('Media Source dir not found');
    }

    const tempDir = await mkdtemp(path.join(os.tmpdir(), "cygnus-media-import-"))

    try {
        const entries = await readdir(sourceDir, { withFileTypes: true })

        await Promise.all(
            entries
                .filter((entry) => entry.isFile())
                .map((entry) => copyFile(path.join(sourceDir, entry.name), path.join(tempDir, entry.name)))
        )

        mediaImportSourceDir = tempDir
        console.log(`Prepared media import source: ${tempDir}`)
    } catch (error) {
        await rm(tempDir, { force: true, recursive: true }).catch(() => undefined)
        throw error
    }
}

const importMediaCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer
) => {
    const mediaDocuments = parseImportDocuments<ImportedMediaDocument>(buffer)
    let imported = 0
    const errors: ImportErrorEntry<ImportedMediaDocument>[] = []
    const mediaIDMap = new Map<string, number | string>()

    for (const [index, doc] of mediaDocuments.entries()) {
        if (!doc.filename) {
            errors.push({
                doc,
                error: "Missing filename in media import document.",
                index,
            })
            continue
        }

        const filePath = await resolveMediaFilePath(doc.filename)

        if (!filePath) {
            errors.push({
                doc,
                error: `Media file "${doc.filename}" was not found in media/ or .next/standalone/media/.`,
                index,
            })
            continue
        }

        const req = await createLocalReq({ locale: "all", user: importUser }, payload)

        try {
            const createdMedia = await payload.create({
                collection: MEDIA_COLLECTION_SLUG,
                data: {
                    alt: doc.alt ?? doc.filename,
                    createdAt: doc.createdAt,
                    focalX: doc.focalX ?? undefined,
                    focalY: doc.focalY ?? undefined,
                    href: doc.href ?? undefined,
                    id: normalizeNumericID(doc.id),
                    updatedAt: doc.updatedAt,
                },
                filePath,
                overrideAccess: true,
                overwriteExistingFiles: true,
                req,
            })

            if (doc.id !== undefined) {
                mediaIDMap.set(String(doc.id), createdMedia.id)
            }

            imported += 1
        } catch (error) {
            errors.push({
                doc,
                error: formatImportError(error),
                index,
            })
        }
    }

    console.log(`Imported media: total=${mediaDocuments.length}, imported=${imported}, updated=0, errors=${errors.length}`)

    if (errors.length > 0) {
        console.warn(`Skipped ${errors.length} media entries in ${file.name}.`)
        console.warn(JSON.stringify(errors))
    }

    return mediaIDMap
}

const normalizeRelationshipID = (
    value: {
        id?: number | string
    } | number | string | null | undefined
) => {
    if (typeof value === "number" || typeof value === "string") {
        return normalizeNumericID(value)
    }

    if (typeof value === "object" && value !== null && "id" in value) {
        return normalizeNumericID(value.id)
    }

    return undefined
}

const remapKnownRelationshipID = (
    originalID: number | string | undefined,
    idMap: Map<string, number | string>
) => {
    if (originalID === undefined) {
        return undefined
    }

    return idMap.get(String(originalID))
}

const remapLexicalUploadNode = (node: Record<string, unknown>, mediaIDMap: Map<string, number | string>): Record<string, unknown> | undefined => {
    const originalUploadID =
        normalizeRelationshipID(node.value as number | string | { id?: number | string } | null | undefined) ??
        normalizeRelationshipID(node.id as number | string | { id?: number | string } | null | undefined)

    const mappedUploadID = remapKnownRelationshipID(originalUploadID, mediaIDMap)
    if (mappedUploadID === undefined) return undefined

    return { ...node, value: mappedUploadID }
}

const remapLexicalContentMediaUploads = (value: unknown, mediaIDMap: Map<string, number | string>): unknown => {
    if (Array.isArray(value)) {
        return value
            .map((item) => remapLexicalContentMediaUploads(item, mediaIDMap))
            .filter((item) => item !== undefined)
    }

    if (!value || typeof value !== "object") return value

    const objectValue = value as Record<string, unknown>

    if (objectValue.type === "upload" && objectValue.relationTo === MEDIA_COLLECTION_SLUG) {
        return remapLexicalUploadNode(objectValue, mediaIDMap)
    }

    return Object.fromEntries(
        Object.entries(objectValue).flatMap(([key, nestedValue]) => {
            const remappedValue = remapLexicalContentMediaUploads(nestedValue, mediaIDMap)
            if (remappedValue === undefined) return []

            return [[key, remappedValue]]
        })
    )
}

const mapBlogContentForImport = (content: unknown, mediaIDMap: Map<string, number | string>) =>
    sanitizeLexicalUploadValues(remapLexicalContentMediaUploads(content, mediaIDMap))

const createImportReq = async (payload: PayloadInstance, importUser: ImportUser, locale: ImportLocale) => {
    return createLocalReq({ locale, user: importUser }, payload)
}

const mapImportedBlogMetaForLocale = (
    doc: ImportedBlogDocument,
    locale: "en" | "de",
    mediaIDMap: Map<string, number | string>
) => {
    const title = doc.meta?.title?.[locale] ?? doc.title?.[locale] ?? undefined
    const description = doc.meta?.description?.[locale] ?? undefined
    const imageSource = doc.meta?.image ?? doc.ogImage ?? doc.twitterImage ?? doc.heroImage
    const image = remapKnownRelationshipID(normalizeRelationshipID(imageSource), mediaIDMap)

    if (!title && !description && image === undefined) {
        return undefined
    }

    return {
        description,
        image,
        title,
    }
}

const syncLocalizedDocument = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    collection: string,
    id: number | string,
    englishData: Record<string, unknown>,
    germanData: Record<string, unknown>
) => {
    const englishReq = await createImportReq(payload, importUser, "en")
    await payload.update({
        collection: collection as "users",
        id,
        data: englishData as never,
        locale: "en",
        overrideAccess: true,
        req: englishReq,
    })

    const germanReq = await createImportReq(payload, importUser, "de")
    await payload.update({
        collection: collection as "users",
        id,
        data: germanData as never,
        locale: "de",
        overrideAccess: true,
        req: germanReq,
    })
}

const importLocalizedCollection = async <TDocument extends { id?: number | string }>(args: {
    buildEnglishData: (doc: TDocument) => Record<string, unknown>
    buildGermanData: (doc: TDocument) => Record<string, unknown>
    buffer: Buffer
    collection: string
    file: { name: string }
    importUser: ImportUser
    label: string
    payload: PayloadInstance
}) => {
    const { buildEnglishData, buildGermanData, buffer, collection, file, importUser, label, payload } = args
    const documents = parseImportDocuments<TDocument>(buffer)
    let imported = 0
    let updated = 0
    const errors: ImportErrorEntry<TDocument>[] = []

    for (const [index, doc] of documents.entries()) {
        const normalizedID = normalizeNumericID(doc.id)

        try {
            const createReq = await createImportReq(payload, importUser, "en")
            const createdDocument = await payload.create({
                collection: collection as "users",
                data: buildEnglishData(doc) as never,
                locale: "en",
                overrideAccess: true,
                req: createReq,
            })

            imported += 1

            await syncLocalizedDocument(
                payload,
                importUser,
                collection,
                createdDocument.id,
                buildEnglishData(doc),
                buildGermanData(doc),
            )

            updated += 1
        } catch (error) {
            errors.push({
                doc,
                error: formatImportError(error),
                index,
            })
        }
    }

    console.log(`Imported ${label}: total=${documents.length}, imported=${imported}, updated=${updated}, errors=${errors.length}`)

    if (errors.length > 0) {
        throw new Error(`Import errors in ${file.name}: ${JSON.stringify(errors)}`)
    }
}

const mapNavbarSubMenuForLocale = (
    subMenu: ImportedNavbarItemDocument["subMenu"],
    locale: "en" | "de"
) => {
    if (!subMenu) {
        return []
    }

    return subMenu.map((item) => ({
        color: item.color ?? "brand",
        description: item.description?.[locale] ?? "",
        href: item.href ?? "",
        icon: item.icon ?? "cube",
        id: item.id ?? undefined,
        key: item.key ?? "",
        title: item.title?.[locale] ?? "",
    }))
}

const importNavbarItemsCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer
) => {
    await importLocalizedCollection<ImportedNavbarItemDocument>({
        payload,
        importUser,
        file,
        buffer,
        collection: NAVBAR_COLLECTION_SLUG,
        label: NAVBAR_COLLECTION_SLUG,
        buildEnglishData: (doc) => ({
            createdAt: doc.createdAt,
            href: doc.href ?? "",
            id: normalizeNumericID(doc.id),
            order: doc.order ?? 0,
            subMenu: mapNavbarSubMenuForLocale(doc.subMenu, "en"),
            title: doc.title?.en ?? "",
            updatedAt: doc.updatedAt,
        }),
        buildGermanData: (doc) => ({
            subMenu: mapNavbarSubMenuForLocale(doc.subMenu, "de"),
            title: doc.title?.de ?? "",
        }),
    })
}

const mapFooterGroupsForLocale = (
    groups: ImportedFooterDocument["groups"],
    locale: "en" | "de"
) => {
    if (!groups) {
        return []
    }

    return groups.map((group) => ({
        heading: group.heading?.[locale] ?? "",
        id: group.id ?? undefined,
        items: (group.items ?? []).map((item) => ({
            id: item.id ?? undefined,
            label: item.label?.[locale] ?? "",
            url: item.url ?? "",
        })),
    }))
}

const importFooterCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer
) => {
    await importLocalizedCollection<ImportedFooterDocument>({
        payload,
        importUser,
        file,
        buffer,
        collection: FOOTER_COLLECTION_SLUG,
        label: FOOTER_COLLECTION_SLUG,
        buildEnglishData: (doc) => ({
            company_name: doc.company_name?.en ?? "",
            createdAt: doc.createdAt,
            groups: mapFooterGroupsForLocale(doc.groups, "en"),
            id: normalizeNumericID(doc.id),
            updatedAt: doc.updatedAt,
        }),
        buildGermanData: (doc) => ({
            company_name: doc.company_name?.de ?? "",
            groups: mapFooterGroupsForLocale(doc.groups, "de"),
        }),
    })
}

const importFeaturesCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer
) => {
    await importLocalizedCollection<ImportedFeatureDocument>({
        payload,
        importUser,
        file,
        buffer,
        collection: FEATURES_COLLECTION_SLUG,
        label: FEATURES_COLLECTION_SLUG,
        buildEnglishData: (doc) => ({
            createdAt: doc.createdAt,
            description: doc.description?.en ?? undefined,
            id: normalizeNumericID(doc.id),
            link: doc.link
                ? {
                    label: doc.link.label?.en ?? undefined,
                    url: doc.link.url ?? undefined,
                }
                : undefined,
            slug: doc.slug,
            title: doc.title?.en ?? "",
            updatedAt: doc.updatedAt,
        }),
        buildGermanData: (doc) => ({
            description: doc.description?.de ?? undefined,
            link: doc.link
                ? {
                    label: doc.link.label?.de ?? undefined,
                    url: doc.link.url ?? undefined,
                }
                : undefined,
            title: doc.title?.de ?? "",
        }),
    })
}

const importTeamMembersCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer,
    mediaIDMap: Map<string, number | string>
) => {
    const teamMemberDocuments = parseImportDocuments<ImportedTeamMemberDocument>(buffer)
    let imported = 0
    let updated = 0
    const errors: ImportErrorEntry<ImportedTeamMemberDocument>[] = []
    const teamMemberIDMap = new Map<string, number | string>()

    for (const [index, doc] of teamMemberDocuments.entries()) {
        const normalizedID = normalizeNumericID(doc.id)

        try {
            const createReq = await createImportReq(payload, importUser, "en")
            const createdDocument = await payload.create({
                collection: TEAM_MEMBERS_COLLECTION_SLUG as "users",
                data: {
                    createdAt: doc.createdAt,
                    id: normalizedID,
                    image: remapKnownRelationshipID(normalizeRelationshipID(doc.image), mediaIDMap),
                    joinedAt: doc.joinedAt ?? undefined,
                    name: doc.name ?? "",
                    updatedAt: doc.updatedAt,
                    about: doc.about?.en ?? undefined,
                    role: doc.role?.en ?? undefined,
                    shortDescription: doc.shortDescription?.en ?? undefined,
                } as never,
                locale: "en",
                overrideAccess: true,
                req: createReq,
            })

            await syncLocalizedDocument(
                payload,
                importUser,
                TEAM_MEMBERS_COLLECTION_SLUG,
                createdDocument.id,
                {
                    createdAt: doc.createdAt,
                    image: remapKnownRelationshipID(normalizeRelationshipID(doc.image), mediaIDMap),
                    joinedAt: doc.joinedAt ?? undefined,
                    name: doc.name ?? "",
                    updatedAt: doc.updatedAt,
                    about: doc.about?.en ?? undefined,
                    role: doc.role?.en ?? undefined,
                    shortDescription: doc.shortDescription?.en ?? undefined,
                },
                {
                    about: doc.about?.de ?? undefined,
                    role: doc.role?.de ?? undefined,
                    shortDescription: doc.shortDescription?.de ?? undefined,
                },
            )

            if (normalizedID !== undefined) {
                teamMemberIDMap.set(String(normalizedID), createdDocument.id)
            }

            imported += 1
            updated += 1
        } catch (error) {
            errors.push({
                doc,
                error: formatImportError(error),
                index,
            })
        }
    }

    console.log(`Imported ${TEAM_MEMBERS_COLLECTION_SLUG}: total=${teamMemberDocuments.length}, imported=${imported}, updated=${updated}, errors=${errors.length}`)

    if (errors.length > 0) {
        throw new Error(`Import errors in ${file.name}: ${JSON.stringify(errors)}`)
    }

    return teamMemberIDMap
}

const importBlogCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer,
    mediaIDMap: Map<string, number | string>,
    teamMemberIDMap: Map<string, number | string>
) => {
    await importLocalizedCollection<ImportedBlogDocument>({
        payload,
        importUser,
        file,
        buffer,
        collection: BLOG_COLLECTION_SLUG,
        label: BLOG_COLLECTION_SLUG,
        buildEnglishData: (doc) => ({
            author: remapKnownRelationshipID(normalizeRelationshipID(doc.author), teamMemberIDMap),
            content: doc.content?.en ? mapBlogContentForImport(doc.content.en, mediaIDMap) : undefined,
            createdAt: doc.createdAt,
            heroImage: remapKnownRelationshipID(normalizeRelationshipID(doc.heroImage), mediaIDMap),
            id: normalizeNumericID(doc.id),
            meta: mapImportedBlogMetaForLocale(doc, "en", mediaIDMap),
            shortDescription: doc.shortDescription?.en ?? undefined,
            slug: doc.slug ?? "",
            title: doc.title?.en ?? "",
            updatedAt: doc.updatedAt,
        }),
        buildGermanData: (doc) => ({
            content: doc.content?.de ? mapBlogContentForImport(doc.content.de, mediaIDMap) : undefined,
            meta: mapImportedBlogMetaForLocale(doc, "de", mediaIDMap),
            shortDescription: doc.shortDescription?.de ?? undefined,
            title: doc.title?.de ?? "",
        }),
    })
}

const importSectionsCollection = async (
    payload: PayloadInstance,
    importUser: ImportUser,
    file: { name: string },
    buffer: Buffer
) => {
    await importLocalizedCollection<ImportedSectionDocument>({
        payload,
        importUser,
        file,
        buffer,
        collection: SECTIONS_COLLECTION_SLUG,
        label: SECTIONS_COLLECTION_SLUG,
        buildEnglishData: (doc) => ({
            createdAt: doc.createdAt,
            heading: doc.heading?.en ?? "",
            id: normalizeNumericID(doc.id),
            link_button: doc.link_button
                ? {
                    label: doc.link_button.label?.en ?? undefined,
                    url: doc.link_button.url ?? undefined,
                }
                : undefined,
            sectionType: doc.sectionType,
            subheading: doc.subheading?.en ?? undefined,
            updatedAt: doc.updatedAt,
        }),
        buildGermanData: (doc) => ({
            heading: doc.heading?.de ?? "",
            link_button: doc.link_button
                ? {
                    label: doc.link_button.label?.de ?? undefined,
                    url: doc.link_button.url ?? undefined,
                }
                : undefined,
            subheading: doc.subheading?.de ?? undefined,
        }),
    })
}

const remapRelationshipsDeep = (
    value: unknown,
    relationshipMaps: {
        mediaIDMap: Map<string, number | string>
        userIDMap: Map<string, number | string>
    }
): unknown => {
    if (Array.isArray(value)) {
        return value.map((item) => remapRelationshipsDeep(item, relationshipMaps))
    }

    if (!value || typeof value !== "object") {
        return value
    }

    const objectValue = value as Record<string, unknown>
    const objectID = objectValue.id

    const looksLikeMediaDocument =
        objectID !== undefined &&
        typeof objectValue.filename === "string" &&
        typeof objectValue.mimeType === "string"

    if (looksLikeMediaDocument) {
        return remapKnownRelationshipID(objectID as number | string, relationshipMaps.mediaIDMap)
    }

    const looksLikeUserDocument =
        objectID !== undefined &&
        typeof objectValue.email === "string" &&
        (objectValue.collection === AUTH_COLLECTION_SLUG || "sessions" in objectValue)

    if (looksLikeUserDocument) {
        return remapKnownRelationshipID(objectID as number | string, relationshipMaps.userIDMap)
    }

    return Object.fromEntries(
        Object.entries(objectValue).map(([key, nestedValue]) => [key, remapRelationshipsDeep(nestedValue, relationshipMaps)])
    )
}

const remapImportBuffer = (
    buffer: Buffer,
    relationshipMaps: {
        mediaIDMap: Map<string, number | string>
        userIDMap: Map<string, number | string>
    }
) => {
    const documents = parseImportDocuments<Record<string, unknown>>(buffer)
    const remappedDocuments = documents.map((doc) => remapRelationshipsDeep(doc, relationshipMaps))

    return Buffer.from(JSON.stringify(remappedDocuments))
}

const formatImportError = (error: unknown) => {
    if (!(error instanceof Error)) {
        return String(error)
    }

    const cause = (error as Error & { cause?: unknown }).cause as
        | {
            code?: string
            column?: string
            constraint?: string
            detail?: string
            routine?: string
            schema?: string
            table?: string
        }
        | undefined

    if (!cause) {
        return error.message
    }

    return JSON.stringify({
        cause: {
            code: cause.code,
            column: cause.column,
            constraint: cause.constraint,
            detail: cause.detail,
            routine: cause.routine,
            schema: cause.schema,
            table: cause.table,
        },
        message: error.message,
    })
}

const mapContainsValue = (
    map: Map<string, number | string>,
    expectedValue: number | string
) => {
    for (const value of map.values()) {
        if (String(value) === String(expectedValue)) {
            return true
        }
    }

    return false
}

const main = async () => {
    let payload: Awaited<ReturnType<typeof getPayload>> | undefined
    let mediaIDMap = new Map<string, number | string>()
    const userIDMap = new Map<string, number | string>()
    let teamMemberIDMap = new Map<string, number | string>()

    try {
        const { default: config } = await import("../src/payload.config")
        const resolvedConfig = await config
        payload = await getPayload({ config: resolvedConfig })
        console.log("Payload initialized.")
        const { user } = await resolveImportUser(payload)
        console.log(`Import user resolved: id=${user.id}, email=${user.email}`)
        const importUser = { ...user, collection: "users" as const }
        await prepareMediaImportSource()

        const importableCollections = getImportCollectionSlugs(resolvedConfig.collections)
        const inputDir = await resolveInputDir()
        console.log(`Input directory resolved: ${inputDir}`)
        const importableCollectionSet = new Set(importableCollections)
        const clearOrder = sortCollectionSlugs(importableCollections, "clear")
        const importOrder = sortCollectionSlugs(importableCollections, "import")

        const entries = await readdir(inputDir, { withFileTypes: true })
        const filesByCollection = new Map(
            entries
                .filter((entry) => entry.isFile() && entry.name.endsWith(`.${IMPORT_FORMAT}`))
                .map((entry) => [entry.name.slice(0, -(`.${IMPORT_FORMAT}`.length)), entry])
        )

        for (const [collectionSlug, file] of filesByCollection) {
            if (!importableCollectionSet.has(collectionSlug)) {
                console.log(`Skipping ${file.name}: no matching importable collection.`)
                continue
            }
        }

        console.log(`Starting clear phase: ${clearOrder.join(", ")}`)
        for (const collectionSlug of clearOrder) {
            const isAuthCollection = collectionSlug === AUTH_COLLECTION_SLUG

            await clearCollection(
                payload,
                collectionSlug,
                isAuthCollection
                    ? {
                        keepDocumentID: importUser.id,
                    }
                    : undefined
            )
        }

        console.log(`Starting import phase: ${importOrder.join(", ")}`)
        for (const collectionSlug of importOrder) {
            const file = filesByCollection.get(collectionSlug)

            if (!file) {
                console.log(`Skipping ${collectionSlug}: no ${collectionSlug}.${IMPORT_FORMAT} file found.`)
                continue
            }

            console.log(`Importing collection: ${collectionSlug}`)
            const filePath = path.join(inputDir, file.name)
            const buffer = await readFile(filePath)

            if (collectionSlug === MEDIA_COLLECTION_SLUG) {
                mediaIDMap = await importMediaCollection(payload, importUser, file, buffer)
                continue
            }

            if (collectionSlug === NAVBAR_COLLECTION_SLUG) {
                await importNavbarItemsCollection(payload, importUser, file, buffer)
                continue
            }

            if (collectionSlug === FOOTER_COLLECTION_SLUG) {
                await importFooterCollection(payload, importUser, file, buffer)
                continue
            }

            if (collectionSlug === FEATURES_COLLECTION_SLUG) {
                await importFeaturesCollection(payload, importUser, file, buffer)
                continue
            }

            if (collectionSlug === SECTIONS_COLLECTION_SLUG) {
                await importSectionsCollection(payload, importUser, file, buffer)
                continue
            }

            if (collectionSlug === TEAM_MEMBERS_COLLECTION_SLUG) {
                teamMemberIDMap = await importTeamMembersCollection(payload, importUser, file, buffer, mediaIDMap)
                continue
            }

            if (collectionSlug === BLOG_COLLECTION_SLUG) {
                await importBlogCollection(payload, importUser, file, buffer, mediaIDMap, teamMemberIDMap)
                continue
            }

            const importBuffer = remapImportBuffer(buffer, { mediaIDMap, userIDMap })

            const req = await createLocalReq({ locale: "all", user: importUser }, payload)
            const result = await createImport({
                collectionSlug,
                file: {
                    data: importBuffer,
                    mimetype: "application/json",
                    name: file.name,
                },
                format: IMPORT_FORMAT,
                importMode: "create",
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
                throw new Error(`Import errors in ${file.name}: ${JSON.stringify(result.errors)}`)
            }
        }
    } finally {
        if (mediaImportSourceDir) {
            await rm(mediaImportSourceDir, { force: true, recursive: true }).catch(() => undefined)
            mediaImportSourceDir = undefined
        }

        if (payload) {
            try {
                await payload.destroy()
            } catch (cleanupError) {
                console.error("Payload cleanup failed.")
                console.error(cleanupError)
            }
        }
    }
}

main()
    .then(() => {
        process.exit(process.exitCode ?? 0)
    })
    .catch((error) => {
        console.error("Import failed.")
        if ((error as NodeJS.ErrnoException)?.code === "ENOTFOUND") {
            console.error("Database host could not be resolved. Check DATABASE_URL, DNS, or your internet/VPN connection.")
        }
        console.error(error)
        process.exit(1)
    })
