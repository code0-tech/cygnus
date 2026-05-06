import type { Payload } from "payload"

type ImportPage = {
  id?: number | string
  slug?: string
  title?: unknown
  layout?: unknown
  [key: string]: unknown
}

export type ImportLocale = "en" | "de"

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

const isLocalizedValue = (value: Record<string, unknown>) => {
  const keys = Object.keys(value)

  return keys.length > 0 && keys.every((key) => supportedLocales.has(key))
}

const normalizeRelationships = (value: unknown, locale: ImportLocale): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeRelationships(item, locale))
  }

  if (!isRecord(value)) {
    return value
  }

  if (isPayloadRelationshipObject(value)) {
    return value.id
  }

  if (isLocalizedValue(value)) {
    return normalizeRelationships(value[locale] ?? value.en ?? value.de, locale)
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, normalizeRelationships(nestedValue, locale)]),
  )
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

  for (const doc of docs) {
    if (!doc.slug || typeof doc.slug !== "string") {
      results.push({
        id: doc.id,
        status: "rejected",
        error: "Missing required string field: slug",
      })
      continue
    }

    const data = normalizeRelationships(removeSystemFields(doc), locale) as any

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

