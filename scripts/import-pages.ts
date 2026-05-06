import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nextEnv from '@next/env'
import { getPayload } from 'payload'
import type { Payload } from 'payload'

type ImportPage = {
  id?: number | string
  slug?: string
  title?: unknown
  layout?: unknown
  [key: string]: unknown
}

type ImportLocale = 'en' | 'de'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const args = process.argv.slice(2)
const positional = args.filter((arg) => !arg.startsWith('--'))
const inputPath = path.resolve(process.cwd(), positional[0] ?? 'pages.json')
const localeArg = args.find((arg) => arg.startsWith('--locale='))
const localeInput = localeArg?.split('=')[1] || process.env.PAYLOAD_IMPORT_LOCALE || 'en'
const dryRun = args.includes('--dry-run')

const systemFields = new Set(['id', 'createdAt', 'updatedAt'])
const supportedLocales = new Set(['en', 'de'])

if (!supportedLocales.has(localeInput)) {
  throw new Error(`Unsupported locale "${localeInput}". Expected "en" or "de".`)
}

const locale = localeInput as ImportLocale

const toErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(typeof error === 'object' ? error : {}),
    }
  }

  return error
}

const normalizeDocs = (raw: unknown): ImportPage[] => {
  if (Array.isArray(raw)) {
    return raw as ImportPage[]
  }

  if (
    raw &&
    typeof raw === 'object' &&
    'docs' in raw &&
    Array.isArray((raw as { docs?: unknown }).docs)
  ) {
    return (raw as { docs: ImportPage[] }).docs
  }

  throw new Error('Expected pages.json to contain an array or an object with a docs array.')
}

const removeSystemFields = (doc: ImportPage) => {
  return Object.fromEntries(Object.entries(doc).filter(([key]) => !systemFields.has(key)))
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const isPayloadRelationshipObject = (value: Record<string, unknown>) => {
  return (
    'id' in value &&
    !('blockType' in value) &&
    (
      'relationTo' in value ||
      'filename' in value ||
      'mimeType' in value ||
      'filesize' in value
    )
  )
}

const isLocalizedValue = (value: Record<string, unknown>) => {
  const keys = Object.keys(value)

  return keys.length > 0 && keys.every((key) => supportedLocales.has(key))
}

const normalizeRelationships = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeRelationships(item))
  }

  if (!isRecord(value)) {
    return value
  }

  if (isPayloadRelationshipObject(value)) {
    return value.id
  }

  if (isLocalizedValue(value)) {
    return normalizeRelationships(value[locale] ?? value.en ?? value.de)
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, normalizeRelationships(nestedValue)]),
  )
}

const main = async () => {
  nextEnv.loadEnvConfig(process.cwd())

  const { default: config } = await import('../src/payload.config')
  const raw = await fs.readFile(inputPath, 'utf8')
  const docs = normalizeDocs(JSON.parse(raw))
  let payload: Payload | undefined
  const results: Array<{ id?: number | string; slug?: string; status: string; error?: unknown }> = []

  try {
    payload = await getPayload({ config })

    for (const doc of docs) {
      if (!doc.slug || typeof doc.slug !== 'string') {
        results.push({
          id: doc.id,
          status: 'rejected',
          error: 'Missing required string field: slug',
        })
        continue
      }

      const data = normalizeRelationships(removeSystemFields(doc)) as any

      try {
        const existing = await payload.find({
          collection: 'pages',
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
            status: existing.totalDocs > 0 ? 'would-update' : 'would-create',
          })
          continue
        }

        if (existing.docs[0]) {
          const updated = await payload.update({
            id: existing.docs[0].id,
            collection: 'pages',
            data,
            locale,
            overrideAccess: true,
          })

          results.push({ id: updated.id, slug: doc.slug, status: 'updated' })
        } else {
          const created = await payload.create({
            collection: 'pages',
            data,
            locale,
            overrideAccess: true,
          })

          results.push({ id: created.id, slug: doc.slug, status: 'created' })
        }
      } catch (error) {
        results.push({
          id: doc.id,
          slug: doc.slug,
          status: 'rejected',
          error: toErrorDetails(error),
        })
      }
    }
  } finally {
    await payload?.db?.destroy?.()
  }

  const rejected = results.filter((result) => result.status === 'rejected')

  console.log(
    JSON.stringify(
      {
        file: path.relative(path.resolve(dirname, '..'), inputPath),
        locale,
        dryRun,
        total: results.length,
        rejected: rejected.length,
        results,
      },
      null,
      2,
    ),
  )

  if (rejected.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(toErrorDetails(error))
  process.exit(1)
})
