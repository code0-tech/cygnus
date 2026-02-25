import { ImageResponse } from "@takumi-rs/image-response"
import { DEFAULT_LOCALE, isSupportedLocale, type AppLocale } from "@/utils/i18n"
import { getLandingPage } from "@/utils/getLandingPage"
import type { HeroLayoutBlock } from "@/utils/getLandingPage"
import { getBlogPostBySlug } from "@/utils/getBlogPostBySlug"
import { generate, getImageResponseOptions } from "./generate"

export const revalidate = false

type RouteContext = {
    params: Promise<{ slug: string[] }>
}

const PAGE_SLUGS = new Set([
    "main",
    "jobs",
    "features",
    "about-us",
    "legal-notice",
    "privacy",
    "terms",
    "contact",
])

function extractTextPreview(value: unknown): string | undefined {
    const texts: string[] = []

    const walk = (node: unknown) => {
        if (!node || typeof node !== "object") return
        const record = node as Record<string, unknown>

        if (typeof record.text === "string" && record.text.trim().length > 0) {
            texts.push(record.text.trim())
        }

        if (Array.isArray(record.children)) {
            for (const child of record.children) {
                walk(child)
            }
        }
    }

    walk(value)

    const preview = texts.join(" ").trim()
    if (!preview) return undefined
    return preview.length > 180 ? `${preview.slice(0, 177)}...` : preview
}

export async function GET(req: Request, { params }: RouteContext) {
    const { slug } = await params
    const segments = slug.filter(Boolean)
    const maybeLocale = segments[0]
    const hasLocale = typeof maybeLocale === "string" && isSupportedLocale(maybeLocale)
    const locale: AppLocale = hasLocale ? maybeLocale : DEFAULT_LOCALE
    const nonLocaleSegments = hasLocale ? segments.slice(1) : segments
    const backgroundSrc = new URL("/code0_rainbow.png", req.url).toString()

    // Support dynamic blog URLs like /og/en/blog/my-post or /og/blog/my-post.
    if (nonLocaleSegments[0] === "blog" && typeof nonLocaleSegments[1] === "string") {
        const post = await getBlogPostBySlug(nonLocaleSegments[1], locale)
        if (post) {
            const options = await getImageResponseOptions()

            return new ImageResponse(
                generate({ title: post.title, backgroundSrc }),
                options,
            )
        }
    }

    const slugCandidates = Array.from(
        new Set([
            nonLocaleSegments.join("/"),
            nonLocaleSegments[nonLocaleSegments.length - 1],
            "main",
        ].filter((candidate): candidate is string => typeof candidate === "string" && candidate.length > 0)),
    )
        .filter((candidate) => PAGE_SLUGS.has(candidate))

    let page: Awaited<ReturnType<typeof getLandingPage>> = null
    for (const candidate of slugCandidates) {
        const doc = await getLandingPage(candidate, locale)
        if (doc) {
            page = doc
            break
        }
    }

    if (!page) {
        return new Response("Not Found", { status: 404 })
    }

    const heroBlock = (page.layout ?? []).find((block): block is HeroLayoutBlock => block.blockType === "hero") ?? null
    const title =
        page.meta?.title?.trim() ||
        heroBlock?.heading?.trim() ||
        page.title ||
        "CodeZero"
    const options = await getImageResponseOptions()

    return new ImageResponse(generate({ title, backgroundSrc }), options)
}
