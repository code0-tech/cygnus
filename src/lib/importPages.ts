import type { Payload } from "payload"

type ImportPage = {
  id?: number | string
  slug?: string
  title?: unknown
  layout?: unknown
  [key: string]: unknown
}

export type ImportLocale = "en" | "de"
type MediaCache = Map<string, number | null>

const systemFields = new Set(["id", "createdAt", "updatedAt"])
const supportedLocales = new Set(["en", "de"])

export function normalizePageImportDocs(raw: unknown): ImportPage[] {
  if (Array.isArray(raw)) {
    return raw as ImportPage[]
  }

  if (
    raw &&
    typeof raw === "object" &&
    "docs" in raw &&
    Array.isArray((raw as { docs?: unknown }).docs)
  ) {
    return (raw as { docs: ImportPage[] }).docs
  }

  throw new Error("Expected pages JSON to contain an array or an object with a docs array.")
}

export function normalizeImportLocale(locale: string): ImportLocale {
  if (!supportedLocales.has(locale)) {
    throw new Error(`Unsupported locale "${locale}". Expected "en" or "de".`)
  }

  return locale as ImportLocale
}

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

const removeSystemFields = (doc: ImportPage) => {
  return Object.fromEntries(Object.entries(doc).filter(([key]) => !systemFields.has(key)))
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

const isPayloadRelationshipObject = (value: Record<string, unknown>) => {
  return (
    "id" in value &&
    !("blockType" in value) &&
    (
      "relationTo" in value ||
      "filename" in value ||
      "mimeType" in value ||
      "filesize" in value
    )
  )
}

const isPayloadMediaObject = (value: Record<string, unknown>) => {
  return (
    "id" in value &&
    (
      value.relationTo === "media" ||
      "filename" in value ||
      "mimeType" in value ||
      "filesize" in value
    )
  )
}

const isLocalizedValue = (value: Record<string, unknown>) => {
  const keys = Object.keys(value)

  return keys.length > 0 && keys.every((key) => supportedLocales.has(key))
}

const resolveMediaIDByFilename = async ({
  media,
  mediaCache,
  payload,
}: {
  media: Record<string, unknown>
  mediaCache: MediaCache
  payload: Payload
}) => {
  const filename = typeof media.filename === "string" ? media.filename : null

  if (!filename) {
    return media.id
  }

  if (mediaCache.has(filename)) {
    return mediaCache.get(filename)
  }

  const existing = await payload.find({
    collection: "media",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      filename: {
        equals: filename,
      },
    },
  })

  const id = existing.docs[0]?.id ?? null
  mediaCache.set(filename, id)
  return id
}

const normalizeRelationships = async ({
  locale,
  mediaCache,
  payload,
  value,
}: {
  locale: ImportLocale
  mediaCache: MediaCache
  payload: Payload
  value: unknown
}): Promise<unknown> => {
  if (Array.isArray(value)) {
    return Promise.all(
      value.map((item) => normalizeRelationships({ locale, mediaCache, payload, value: item })),
    )
  }

  if (!isRecord(value)) {
    return value
  }

  if (isPayloadMediaObject(value)) {
    return resolveMediaIDByFilename({ media: value, mediaCache, payload })
  }

  if (isPayloadRelationshipObject(value)) {
    return value.id
  }

  if (isLocalizedValue(value)) {
    return normalizeRelationships({
      locale,
      mediaCache,
      payload,
      value: value[locale] ?? value.en ?? value.de,
    })
  }

  const entries = await Promise.all(
    Object.entries(value).map(async ([key, nestedValue]) => [
      key,
      await normalizeRelationships({ locale, mediaCache, payload, value: nestedValue }),
    ]),
  )

  return Object.fromEntries(entries)
}

export async function importPages({
  docs,
  dryRun,
  locale,
  payload,
}: {
  docs: ImportPage[]
  dryRun: boolean
  locale: ImportLocale
  payload: Payload
}) {
  const results: Array<{ id?: number | string; slug?: string; status: string; error?: unknown }> = []
  const mediaCache: MediaCache = new Map()

  for (const doc of docs) {
    if (!doc.slug || typeof doc.slug !== "string") {
      results.push({
        id: doc.id,
        status: "rejected",
        error: "Missing required string field: slug",
      })
      continue
    }

    const data = await normalizeRelationships({
      locale,
      mediaCache,
      payload,
      value: removeSystemFields(doc),
    }) as any

    try {
      const existing = await payload.find({
        collection: "pages",
        depth: 0,
        limit: 1,
        locale,
        overrideAccess: true,
        where: {
          slug: {
            equals: doc.slug,
          },
        },
      })

      if (dryRun) {
        results.push({
          id: existing.docs[0]?.id ?? doc.id,
          slug: doc.slug,
          status: existing.totalDocs > 0 ? "would-update" : "would-create",
        })
        continue
      }

      if (existing.docs[0]) {
        const updated = await payload.update({
          id: existing.docs[0].id,
          collection: "pages",
          data,
          locale,
          overrideAccess: true,
        })

        results.push({ id: updated.id, slug: doc.slug, status: "updated" })
      } else {
        const created = await payload.create({
          collection: "pages",
          data,
          locale,
          overrideAccess: true,
        })

        results.push({ id: created.id, slug: doc.slug, status: "created" })
      }
    } catch (error) {
      results.push({
        id: doc.id,
        slug: doc.slug,
        status: "rejected",
        error: toErrorDetails(error),
      })
    }
  }

  const rejected = results.filter((result) => result.status === "rejected")

  return {
    locale,
    dryRun,
    total: results.length,
    rejected: rejected.length,
    results,
  }
}

