"use server"

import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n"
import { getPayloadClient } from "@/lib/payloadClient"
import type { Action, Blog, CookieBanner, Feature, Footer, Job, Media, NavbarItem, Page, RoadmapItem as PayloadRoadmapItem, Section, TeamMember } from "@/payload-types"
import { cache } from "react"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build"
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim())

type PageLayoutBlock = NonNullable<Page["layout"]>[number]

export type HeroLayoutBlock = Extract<PageLayoutBlock, { blockType: "hero" }>
export type EditionHeroLayoutBlock = Extract<PageLayoutBlock, { blockType: "editionHero" }>
export type EditionFeaturesLayoutBlock = Extract<PageLayoutBlock, { blockType: "editionFeatures" }>
export type EditionInstallLayoutBlock = Extract<PageLayoutBlock, { blockType: "editionInstall" }>
export type EditionUseCaseLayoutBlock = Extract<PageLayoutBlock, { blockType: "editionUseCases" }>
export type BrandLayoutBlock = Extract<PageLayoutBlock, { blockType: "brand" }>
export type CtaLayoutBlock = Extract<PageLayoutBlock, { blockType: "cta" }>
export type FaqLayoutBlock = Extract<PageLayoutBlock, { blockType: "faq" }>
export type UseCaseLayoutBlock = Extract<PageLayoutBlock, { blockType: "usecase" }>
export type DeploymentLayoutBlock = Extract<PageLayoutBlock, { blockType: "deployment" }>
export type JobsLayoutBlock = Extract<PageLayoutBlock, { blockType: "jobs" }>
export type ActionsLayoutBlock = Extract<PageLayoutBlock, { blockType: "actions" }>
export type MarkdownLayoutBlock = Extract<PageLayoutBlock, { blockType: "markdown" }>
export type ContactLayoutBlock = Extract<PageLayoutBlock, { blockType: "contact" }>
export type BlogLayoutBlock = Extract<PageLayoutBlock, { blockType: "blog" }>


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

type ActionReferenceItem = Pick<Action, "id" | "slug" | "title" | "shortDescription" | "description" | "tags"> & {
    icon?: (number | null) | Media
}

export type ActionItem = Pick<Action, "id" | "slug" | "title" | "shortDescription" | "description" | "tags"> & {
    icon?: (number | null) | Media
    trigger?: (number | null) | Media
    functiondefinitions?: (number | null) | Media
    documentation?: Action["documentation"]
    references?: Array<number | ActionReferenceItem> | null
}
export type ActionDetailItem = Pick<Action, "id" | "slug" | "title" | "shortDescription" | "description" | "tags" | "documentation" | "references"> & {
    icon?: (number | null) | Media
    trigger?: (number | null) | Media
    functiondefinitions?: (number | null) | Media
}

export type JobItem = Pick<Job, "id" | "title" | "slug" | "category" | "type" | "location" | "description" | "order">
type JobDetailItem = Pick<Job, "id" | "title" | "slug" | "category" | "type" | "location" | "description" | "order" | "content">
export type TeamMemberItem = Pick<TeamMember, "id" | "name" | "image" | "shortDescription" | "about" | "role" | "joinedAt">
type RoadmapItem = Pick<PayloadRoadmapItem, "id" | "time" | "title" | "description">

export type BlogPostItem = Pick<Blog, "id" | "title" | "slug" | "content" | "createdAt" | "shortDescription" | "isPinned"> & {
    heroImage?: (number | null) | Media
    meta?: Blog["meta"]
    author: number | Pick<TeamMember, "name" | "image" | "role">
}

export interface PaginatedBlogPostsResult {
    posts: BlogPostItem[]
    hasNextPage: boolean
    nextPage: number | null
    totalDocs: number
}

function sortBlogPosts(posts: BlogPostItem[]): BlogPostItem[] {
    return [...posts].sort((left, right) => {
        const pinOrder = Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned))
        if (pinOrder !== 0) return pinOrder
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
}

export interface SubscriptionConfigData {
    id: number
    title: string
    pageIntro: {
        heading: string
        description: string
    }
    featureOverview: {
        title: string
        description: string
        icon: string
        id?: string | null
    }[]
    optionsPanelHeading: string
    deployment: {
        label: string
        selfHosted: {
            title: string
            description: string
            icon: string
            color: "brand" | "pink" | "yellow" | "aqua" | "blue"
        }
        cloud: {
            title: string
            description: string
            icon: string
            color: "brand" | "pink" | "yellow" | "aqua" | "blue"
        }
    }
    customerType: {
        label: string
        b2b: {
            title: string
            description: string
            icon: string
            color: "brand" | "pink" | "yellow" | "aqua" | "blue"
        }
        b2c: {
            title: string
            description: string
            icon: string
            color: "brand" | "pink" | "yellow" | "aqua" | "blue"
        }
    }
    workflowExecutions: {
        title: string
        description: string
        min: number
        max: number
        step: number
        minLabel: string
        maxLabel: string
        centerSuffix: string
    }
    contactSales: {
        prompt: string
        label: string
        href: string
    }
    subscribe: {
        label: string
        baseUrl: string
    }
    price: {
        heading: string
        caption: string
    }
    additionalFeaturesLabel?: string | null
    additionalFeatures?: {
        icon: string
        title: string
        description: string
        price: number
        id?: string | null
    }[] | null
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
        if (isBuildPhase && isMissingPayloadTablesError(error)) {
            console.warn(`[cms] ${operation} skipped during build because the Payload schema is unavailable.`)
            return fallback
        }

        throw error
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

const getCookieBannerCached = cache(async (locale: AppLocale): Promise<CookieBanner | null> => {
    return withCmsFallback(`getCookieBanner(${locale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "cookie-banner",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            limit: 1,
            depth: 0,
        })

        return (result.docs[0] as CookieBanner | undefined) ?? null
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

const getActionsCached = cache(async (locale: AppLocale): Promise<ActionItem[]> => {
    return withCmsFallback(`getActions(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "actions",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            sort: "title",
            pagination: false,
            depth: 1,
            select: {
                slug: true,
                title: true,
                shortDescription: true,
                description: true,
                icon: true,
                trigger: true,
                functiondefinitions: true,
                tags: true,
                documentation: true,
                references: true,
            },
        })

        return (result.docs as ActionItem[]) ?? []
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

const getActionBySlugCached = cache(async (slug: string, locale: AppLocale): Promise<ActionDetailItem | null> => {
    return withCmsFallback(`getActionBySlug(${slug}, ${locale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "actions",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            where: { slug: { equals: slug } },
            limit: 1,
            pagination: false,
            depth: 2,
            select: {
                slug: true,
                title: true,
                shortDescription: true,
                description: true,
                icon: true,
                trigger: true,
                functiondefinitions: true,
                tags: true,
                documentation: true,
                references: true,
            },
        })

        return (result.docs[0] as ActionDetailItem | undefined) ?? null
    })
})

const getTeamMembersCached = cache(async (locale: AppLocale): Promise<TeamMemberItem[]> => {
    return withCmsFallback(`getTeamMembers(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "team-members",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
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

const getActionSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    return withCmsFallback(`getActionSlugs(${locale})`, [], async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "actions",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            limit: 1000,
            depth: 0,
            select: { slug: true },
        })

        return result.docs
            .map((action) => action.slug)
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
            depth: 2,
            where: { slug: { equals: slug } },
            limit: 1,
            pagination: false,
        })

        return (result.docs[0] as BlogPostItem | undefined) ?? null
    })
})

const getBlogPostsCached = cache(async (locale: AppLocale, page: number, limit: number): Promise<PaginatedBlogPostsResult> => {
    return withCmsFallback(`getBlogPosts(${locale}, ${page}, ${limit})`, {
        posts: [],
        hasNextPage: false,
        nextPage: null,
        totalDocs: 0,
    }, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "blog",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            depth: 1,
            sort: "-isPinned,-createdAt",
            page,
            limit,
            pagination: true,
            select: {
                title: true,
                slug: true,
                isPinned: true,
                content: true,
                shortDescription: true,
                createdAt: true,
                heroImage: true,
                author: true,
            },
        })

        return {
            posts: sortBlogPosts((result.docs as BlogPostItem[]) ?? []),
            hasNextPage: result.hasNextPage,
            nextPage: result.nextPage ?? null,
            totalDocs: result.totalDocs,
        }
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

const getSubscriptionConfigCached = cache(async (locale: AppLocale): Promise<SubscriptionConfigData | null> => {
    return withCmsFallback(`getSubscriptionConfig(${locale})`, null, async () => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "subscriptionConfig" as never,
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            limit: 1,
            depth: 0,
        })

        return (result.docs[0] as SubscriptionConfigData | undefined) ?? null
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

export async function getCookieBanner(locale: AppLocale = DEFAULT_LOCALE) {
    return getCookieBannerCached(locale)
}

export async function getFeatureBySlug(slug: FeatureSlug, locale: AppLocale = DEFAULT_LOCALE) {
    const features = await getFeaturesCached(locale)
    return features.find((feature) => feature.slug === slug) ?? null
}

export async function getJobs(locale: AppLocale = DEFAULT_LOCALE): Promise<JobItem[]> {
    return getJobsCached(locale)
}

export async function getActions(locale: AppLocale = DEFAULT_LOCALE): Promise<ActionItem[]> {
    return getActionsCached(locale)
}

export async function getActionBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<ActionDetailItem | null> {
    return getActionBySlugCached(slug, locale)
}

export async function getJobBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<JobDetailItem | null> {
    return getJobBySlugCached(slug, locale)
}

export async function getTeamMembers(locale: AppLocale = DEFAULT_LOCALE): Promise<TeamMemberItem[]> {
    return getTeamMembersCached(locale)
}

export async function getJobSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    return getJobSlugsCached(locale)
}

export async function getActionSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    return getActionSlugsCached(locale)
}

export async function getBlogPostBySlug(slug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<BlogPostItem | null> {
    return getBlogPostBySlugCached(slug, locale)
}

export async function getBlogPosts(
    locale: AppLocale = DEFAULT_LOCALE,
    options?: { page?: number, limit?: number },
): Promise<PaginatedBlogPostsResult> {
    return getBlogPostsCached(locale, options?.page ?? 1, options?.limit ?? 12)
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

export async function getSubscriptionConfig(locale: AppLocale = DEFAULT_LOCALE): Promise<SubscriptionConfigData | null> {
    return getSubscriptionConfigCached(locale)
}
