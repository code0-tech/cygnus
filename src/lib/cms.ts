"use server"

import type { Blog, Feature, Footer, Job, Media, NavbarItem, Page, RoadmapItem as PayloadRoadmapItem, Section, User } from "@/payload-types"
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n"
import { getPayloadClient } from "@/lib/payloadClient"
import { cache } from "react"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build"
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim())

type PageLayoutBlock = NonNullable<Page["layout"]>[number]

export type HeroLayoutBlock = Extract<PageLayoutBlock, { blockType: "hero" }>
export type BrandLayoutBlock = Extract<PageLayoutBlock, { blockType: "brand" }>
export type CtaLayoutBlock = Extract<PageLayoutBlock, { blockType: "cta" }>
export type FaqLayoutBlock = Extract<PageLayoutBlock, { blockType: "faq" }>
export type UseCaseLayoutBlock = Extract<PageLayoutBlock, { blockType: "usecase" }>
export type DeploymentLayoutBlock = Extract<PageLayoutBlock, { blockType: "deployment" }>
export type JobsLayoutBlock = Extract<PageLayoutBlock, { blockType: "jobs" }>
export type MarkdownLayoutBlock = Extract<PageLayoutBlock, { blockType: "markdown" }>
export type ContactLayoutBlock = Extract<PageLayoutBlock, { blockType: "contact" }>

type FeatureSlug = Feature["slug"]
interface FeatureItem {
    id: Feature["id"]
    slug: FeatureSlug
    title: NonNullable<Feature["title"]>
    description: NonNullable<Feature["description"]>
    link: {
        label: NonNullable<NonNullable<Feature["link"]>["label"]>
        url: NonNullable<NonNullable<Feature["link"]>["url"]>
    }
}

export type JobItem = Pick<Job, "id" | "title" | "slug" | "category" | "type" | "location" | "description" | "order">
type JobDetailItem = Pick<Job, "id" | "title" | "slug" | "category" | "type" | "location" | "description" | "order" | "content">
export type TeamMemberItem = Pick<User, "id" | "name" | "image" | "shortDescription" | "about" | "role" | "joinedAt">
type RoadmapItem = Pick<PayloadRoadmapItem, "id" | "time" | "title" | "description">

export type BlogPostItem = Pick<Blog, "id" | "title" | "slug" | "content" | "createdAt" | "shortDescription"> & {
    heroImage?: (number | null) | Media
    author: number | Pick<User, "email" | "name">
}

function isMissingPayloadTablesError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
        return false
    }

    const pgCode = "code" in error ? error.code : undefined
    const message = "message" in error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : ""
    const cause = "cause" in error ? error.cause : undefined

    return pgCode === "42P01"
        || pgCode === "3F000"
        || (message.includes("relation") && message.includes("does not exist"))
        || (message.includes("schema") && message.includes("does not exist"))
        || isMissingPayloadTablesError(cause)
}

async function withCmsFallback<T>(operation: string, fallback: T, run: () => Promise<T>): Promise<T> {
    if (isBuildPhase && !hasDatabaseUrl) {
        return fallback
    }

    try {
        return await run()
    } catch (error) {
        if (!isBuildPhase && !isMissingPayloadTablesError(error)) {
            throw error
        }

        if (!isBuildPhase) {
            console.warn(`[cms] ${operation} skipped because the Payload data is unavailable.`)
        }
        return fallback
    }
}

const getLandingPageCached = cache(async (cachedSlug: string, cachedLocale: AppLocale): Promise<Page | null> => {
    return withCmsFallback(`getLandingPage(${cachedSlug}, ${cachedLocale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "pages",
            locale: cachedLocale,
            fallbackLocale: DEFAULT_LOCALE,
            where: { slug: { equals: cachedSlug } },
            limit: 1,
            depth: 1,
            pagination: false,
        })

        return (result.docs[0] as Page | undefined) ?? null
    })
})

const getNavbarItemsCached = cache(async (locale: AppLocale): Promise<NavbarItem[]> => {
    return withCmsFallback(`getNavbarItems(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "navbarItems",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            sort: "order",
            depth: 0,
        })

        return result.docs as NavbarItem[]
    })
})

const getFooterCached = cache(async (locale: AppLocale): Promise<Footer | null> => {
    return withCmsFallback(`getFooter(${locale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "footer",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            limit: 1,
            depth: 0,
        })

        return (result.docs[0] as Footer | undefined) ?? null
    })
})

const getFeaturesCached = cache(async (locale: AppLocale): Promise<FeatureItem[]> => {
    return withCmsFallback(`getFeatures(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "features",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            depth: 0,
        })

        return (result.docs as Feature[])
            .filter((feature): feature is Feature & { title: string; description: string; link: { label: string; url: string } } =>
                Boolean(feature.title && feature.description && feature.link?.label && feature.link?.url),
            )
            .map((feature) => ({
                id: feature.id,
                slug: feature.slug,
                title: feature.title,
                description: feature.description,
                link: { label: feature.link.label, url: feature.link.url },
            }))
    })
})

const getJobsCached = cache(async (locale: AppLocale): Promise<JobItem[]> => {
    return withCmsFallback(`getJobs(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "jobs",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            sort: "order",
            pagination: false,
            depth: 0,
            select: {
                title: true,
                slug: true,
                category: true,
                type: true,
                location: true,
                description: true,
                order: true,
            },
        })

        return (result.docs as JobItem[]) ?? []
    })
})

const getJobBySlugCached = cache(async (slug: string, locale: AppLocale): Promise<JobDetailItem | null> => {
    return withCmsFallback(`getJobBySlug(${slug}, ${locale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "jobs",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            where: { slug: { equals: slug } },
            limit: 1,
            pagination: false,
            depth: 0,
        })

        return (result.docs[0] as JobDetailItem | undefined) ?? null
    })
})

const getTeamMembersCached = cache(async (): Promise<TeamMemberItem[]> => {
    return withCmsFallback("getTeamMembers()", [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "users",
            pagination: false,
            sort: "name",
            depth: 1,
            select: {
                name: true,
                image: true,
                shortDescription: true,
                about: true,
                role: true,
                joinedAt: true,
            },
        })

        return (result.docs as TeamMemberItem[]) ?? []
    })
})

const getJobSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    return withCmsFallback(`getJobSlugs(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "jobs",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            limit: 1000,
            depth: 0,
            select: { slug: true },
        })

        return result.docs
            .map((job) => job.slug)
            .filter((slug) => slug.length > 0)
    })
})

const getBlogPostBySlugCached = cache(async (slug: string, locale: AppLocale): Promise<BlogPostItem | null> => {
    return withCmsFallback(`getBlogPostBySlug(${slug}, ${locale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "blog",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            depth: 1,
            where: { slug: { equals: slug } },
            limit: 1,
            pagination: false,
        })

        return (result.docs[0] as BlogPostItem | undefined) ?? null
    })
})

const getBlogPostsCached = cache(async (locale: AppLocale): Promise<BlogPostItem[]> => {
    return withCmsFallback(`getBlogPosts(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "blog",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            depth: 1,
            sort: "-createdAt",
            pagination: false,
            select: {
                title: true,
                slug: true,
                content: true,
                shortDescription: true,
                createdAt: true,
                heroImage: true,
                author: true,
            },
        })

        return (result.docs as BlogPostItem[]) ?? []
    })
})

const getBlogSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    return withCmsFallback(`getBlogSlugs(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "blog",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            limit: 1000,
            depth: 0,
            select: { slug: true },
        })

        return result.docs
            .map((post) => post.slug)
            .filter((slug) => slug.length > 0)
    })
})

const getRoadmapItemsCached = cache(async (locale: AppLocale): Promise<RoadmapItem[]> => {
    return withCmsFallback(`getRoadmapItems(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "roadmapItems",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            sort: "-createdAt",
            depth: 0,
        })

        return (result.docs as RoadmapItem[]) ?? []
    })
})

const getSectionsCached = cache(async (locale: AppLocale): Promise<Section[]> => {
    return withCmsFallback(`getSections(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "sections",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            depth: 0,
        })

        return result.docs as Section[]
    })
})

export async function getLandingPage(slug = "main", locale: AppLocale = DEFAULT_LOCALE): Promise<Page | null> {
    return getLandingPageCached(slug, locale)
}

export async function getNavbarItems(locale: AppLocale = DEFAULT_LOCALE) {
    return getNavbarItemsCached(locale)
}

export async function getFooter(locale: AppLocale = DEFAULT_LOCALE) {
    return getFooterCached(locale)
}

export async function getFeatureBySlug(slug: FeatureSlug, locale: AppLocale = DEFAULT_LOCALE) {
    const features = await getFeaturesCached(locale)
    return features.find((feature) => feature.slug === slug) ?? null
}

export async function getJobs(locale: AppLocale = DEFAULT_LOCALE): Promise<JobItem[]> {
    return getJobsCached(locale)
}

export async function getJobBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<JobDetailItem | null> {
    return getJobBySlugCached(slug, locale)
}

export async function getTeamMembers(): Promise<TeamMemberItem[]> {
    return getTeamMembersCached()
}

export async function getJobSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    return getJobSlugsCached(locale)
}

export async function getBlogPostBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<BlogPostItem | null> {
    return getBlogPostBySlugCached(slug, locale)
}

export async function getBlogPosts(locale: AppLocale = DEFAULT_LOCALE): Promise<BlogPostItem[]> {
    return getBlogPostsCached(locale)
}

export async function getBlogSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    return getBlogSlugsCached(locale)
}

export async function getRoadmapItems(locale: AppLocale = DEFAULT_LOCALE): Promise<RoadmapItem[]> {
    return getRoadmapItemsCached(locale)
}

export async function getSections(locale: AppLocale = DEFAULT_LOCALE): Promise<Section[]> {
    return getSectionsCached(locale)
}
