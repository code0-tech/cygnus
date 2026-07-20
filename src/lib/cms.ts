import "server-only"

import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n"
import { getPayloadClient } from "@/lib/payloadClient"
import type { Action, Blog, CookieBanner, Feature, Footer, Job, Media, Navigation, Page, TeamMember } from "@/payload-types"
import type { NavigationData, NavbarButtonData, NavbarItemData } from "@/lib/navigation"
import { cache } from "react"

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build" || process.env.npm_lifecycle_event === "build"
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim())

type PageLayoutBlock = NonNullable<Page["layout"]>[number]

export type HeroLayoutBlock = Extract<PageLayoutBlock, { blockType: "hero" }>
export type BentoLayoutBlock = Extract<PageLayoutBlock, { blockType: "bento" }>
export type OffsetCardsLayoutBlock = Extract<PageLayoutBlock, { blockType: "offsetCards" }>
export type InstallLayoutBlock = Extract<PageLayoutBlock, { blockType: "install" }>
export type SwipeCardsLayoutBlock = Extract<PageLayoutBlock, { blockType: "swipeCards" }>
export type BrandLayoutBlock = Extract<PageLayoutBlock, { blockType: "brand" }>
export type CtaLayoutBlock = Extract<PageLayoutBlock, { blockType: "cta" }>
export type CTAImageLayoutBlock = Extract<PageLayoutBlock, { blockType: "ctaImage" }>
export type FaqLayoutBlock = Extract<PageLayoutBlock, { blockType: "faq" }>
export type CardRowLayoutBlock = Extract<PageLayoutBlock, { blockType: "cardRow" }>
export type JobsLayoutBlock = Extract<PageLayoutBlock, { blockType: "jobs" }>
export type ContactLayoutBlock = Extract<PageLayoutBlock, { blockType: "contact" }>
export type BlogLayoutBlock = Extract<PageLayoutBlock, { blockType: "blog" }>
export type BlogPreviewLayoutBlock = Extract<PageLayoutBlock, { blockType: "blogPreview" }>
export type BorderLayoutBlock = Extract<PageLayoutBlock, { blockType: "border" }>
export type RoadmapLayoutBlock = Extract<PageLayoutBlock, { blockType: "roadmap" }>
export type ScrollCardsLayoutBlock = Extract<PageLayoutBlock, { blockType: "scrollCards" }>
export type StandaloneCardLayoutBlock = Extract<PageLayoutBlock, { blockType: "standaloneCard" }>
export type VideoLayoutBlock = Extract<PageLayoutBlock, { blockType: "video" }>
export type WideHeroLayoutBlock = Extract<PageLayoutBlock, { blockType: "widehero" }>
export type ListFeatureLayoutBlock = Extract<PageLayoutBlock, { blockType: "listFeature" }>
export type StatsLayoutBlock = Extract<PageLayoutBlock, { blockType: "stats" }>

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
type ActionDetailItem = Pick<Action, "id" | "slug" | "title" | "shortDescription" | "description" | "tags" | "documentation" | "references"> & {
    icon?: (number | null) | Media
    trigger?: (number | null) | Media
    functiondefinitions?: (number | null) | Media
}

interface SubscriptionUsageRange {
    step: number
    min: number
    max: number
}

export type JobItem = Pick<Job, "id" | "title" | "slug" | "category" | "type" | "location" | "description" | "order">
type JobDetailItem = Pick<Job, "id" | "title" | "slug" | "category" | "type" | "location" | "description" | "order" | "content">
export type TeamMemberItem = Pick<TeamMember, "id" | "name" | "image" | "shortDescription" | "about" | "role" | "joinedAt">
export type BlogPostItem = Pick<Blog, "id" | "title" | "slug" | "content" | "createdAt" | "shortDescription" | "isPinned"> & {
    heroImage?: (number | null) | Media
    meta?: Blog["meta"]
    author: number | Pick<TeamMember, "name" | "image" | "role">
}

interface PaginatedBlogPostsResult {
    posts: BlogPostItem[]
    hasNextPage: boolean
    nextPage: number | null
    totalDocs: number
}

function sortBlogPosts(posts: BlogPostItem[]): BlogPostItem[] {
    return posts.toSorted((left, right) => {
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
    defaults: {
        deployment: "self-hosted" | "cloud"
        customerType: "b2b" | "b2c"
        paymentPeriod: "monthly" | "quarterly" | "yearly"
        workflowExecutions: {
            b2b: number
            b2c: number
        }
        aiTokens: {
            b2b: number
            b2c: number
        }
    }
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
    paymentPeriod: {
        label: string
        description: string
        monthlyText: string
        quarterlyText: string
        yearlyText: string
        monthlyPeriodSuffix: string
        quarterlyPeriodSuffix: string
        yearlyPeriodSuffix: string
        quarterlyDiscount: number
        yearlyDiscount: number
    }
    workflowExecutions: {
        title: string
        description: string
        b2b: SubscriptionUsageRange
        b2c: SubscriptionUsageRange
        suffix: string
    }
    workflowCalculator: {
        triggerLabel: string
        title: string
        description: string
        closeLabel: string
        businessTypeLabel: string
        businessTypeSearchPlaceholder: string
        noBusinessTypesFoundLabel: string
        activeWorkflowsLabel: string
        runsPerDayLabel: string
        daysPerMonthLabel: string
        estimateLabel: string
        cancelLabel: string
        applyLabel: string
        businessTypes: {
            name: string
            conversion_rate: number
            conversion_unit: string
            icon: string
            id?: string | null
        }[]
    }
    workflowExecutionPriceFactor: number
    aiTokens: {
        title: string
        description: string
        b2b: SubscriptionUsageRange
        b2c: SubscriptionUsageRange
        suffix: string
    }
    aiTokenPriceFactor: number
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
    additionalFeatures?:
        | {
              icon: string
              title: string
              description: string
              price: number
              id?: string | null
          }[]
        | null
}

function isMissingPayloadTablesError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
        return false
    }

    const pgCode = "code" in error ? error.code : undefined
    const message = "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : ""
    const cause = "cause" in error ? error.cause : undefined

    return (
        pgCode === "42P01" ||
        pgCode === "3F000" ||
        (message.includes("relation") && message.includes("does not exist")) ||
        (message.includes("schema") && message.includes("does not exist")) ||
        isMissingPayloadTablesError(cause)
    )
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

type CmsFindArgs = {
    collection: string
    locale: AppLocale
    fallbackLocale?: AppLocale
} & Record<string, unknown>

type CmsGlobalArgs = {
    slug: string
    locale: AppLocale
    fallbackLocale?: AppLocale
} & Record<string, unknown>

async function cmsFind<T>(args: CmsFindArgs): Promise<T[]> {
    const payload = await getPayloadClient()
    const result = await payload.find(args as never)
    return (result.docs as T[]) ?? []
}

async function cmsFindGlobal<T>(operation: string, fallback: T | null, args: CmsGlobalArgs): Promise<T | null> {
    return withCmsFallback(operation, fallback, async () => {
        const payload = await getPayloadClient()
        return (await payload.findGlobal(args as never)) as T
    })
}

async function cmsFindOne<T>(operation: string, fallback: T | null, args: CmsFindArgs): Promise<T | null> {
    return withCmsFallback(operation, fallback, async () => {
        const docs = await cmsFind<T>(args)
        return docs[0] ?? fallback
    })
}

async function cmsFindMany<T>(operation: string, fallback: T[], args: CmsFindArgs): Promise<T[]> {
    return withCmsFallback(operation, fallback, async () => {
        return cmsFind<T>(args)
    })
}

async function cmsFindSlugs(operation: string, locale: AppLocale, collection: string): Promise<string[]> {
    const docs = await cmsFindMany<{ slug: string }>(operation, [], {
        collection,
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        pagination: false,
        limit: 1000,
        depth: 0,
        select: { slug: true },
    })
    const slugs: string[] = []

    for (const doc of docs) {
        if (doc.slug.length > 0) slugs.push(doc.slug)
    }

    return slugs
}

const getLandingPageCached = cache(async (cachedSlug: string, cachedLocale: AppLocale): Promise<Page | null> => {
    return cmsFindOne(`getLandingPage(${cachedSlug}, ${cachedLocale})`, null, {
        collection: "pages",
        locale: cachedLocale,
        fallbackLocale: DEFAULT_LOCALE,
        where: { slug: { equals: cachedSlug } },
        limit: 1,
        depth: 1,
        pagination: false,
    })
})

const getNavigationCached = cache(async (locale: AppLocale): Promise<NavigationData | null> => {
    return cmsFindGlobal<Navigation>(`getNavigation(${locale})`, null, {
        slug: "navigation",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 1,
    })
})

const getFooterCached = cache(async (locale: AppLocale): Promise<Footer | null> => {
    return cmsFindGlobal(`getFooter(${locale})`, null, {
        slug: "footer",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 1,
    })
})

const getCookieBannerCached = cache(async (locale: AppLocale): Promise<CookieBanner | null> => {
    return cmsFindGlobal(`getCookieBanner(${locale})`, null, {
        slug: "cookie-banner",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 0,
    })
})

const getFeaturesCached = cache(async (locale: AppLocale): Promise<FeatureItem[]> => {
    return withCmsFallback(`getFeatures(${locale})`, [], async () => {
        const docs = await cmsFind<Feature>({
            collection: "features",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            depth: 0,
        })

        const features: FeatureItem[] = []

        for (const feature of docs) {
            const { title, description } = feature
            const label = feature.link?.label
            const url = feature.link?.url
            if (!title || !description || !label || !url) continue

            features.push({
                id: feature.id,
                slug: feature.slug,
                title,
                description,
                link: { label, url },
            })
        }

        return features
    })
})

const getJobsCached = cache(async (locale: AppLocale): Promise<JobItem[]> => {
    return cmsFindMany(`getJobs(${locale})`, [], {
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
})

const getActionsCached = cache(async (locale: AppLocale): Promise<ActionItem[]> => {
    return cmsFindMany(`getActions(${locale})`, [], {
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
})

const getJobBySlugCached = cache(async (slug: string, locale: AppLocale): Promise<JobDetailItem | null> => {
    return cmsFindOne(`getJobBySlug(${slug}, ${locale})`, null, {
        collection: "jobs",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        where: { slug: { equals: slug } },
        limit: 1,
        pagination: false,
        depth: 0,
    })
})

const getActionBySlugCached = cache(async (slug: string, locale: AppLocale): Promise<ActionDetailItem | null> => {
    return cmsFindOne(`getActionBySlug(${slug}, ${locale})`, null, {
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
})

const getTeamMembersCached = cache(async (locale: AppLocale): Promise<TeamMemberItem[]> => {
    return cmsFindMany(`getTeamMembers(${locale})`, [], {
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
})

const getJobSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    return cmsFindSlugs(`getJobSlugs(${locale})`, locale, "jobs")
})

const getActionSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    return cmsFindSlugs(`getActionSlugs(${locale})`, locale, "actions")
})

const getBlogPostBySlugCached = cache(async (slug: string, locale: AppLocale): Promise<BlogPostItem | null> => {
    return cmsFindOne(`getBlogPostBySlug(${slug}, ${locale})`, null, {
        collection: "blog",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 2,
        where: { slug: { equals: slug } },
        limit: 1,
        pagination: false,
    })
})

const getBlogPostsCached = cache(async (locale: AppLocale, page: number, limit: number): Promise<PaginatedBlogPostsResult> => {
    return withCmsFallback(
        `getBlogPosts(${locale}, ${page}, ${limit})`,
        {
            posts: [],
            hasNextPage: false,
            nextPage: null,
            totalDocs: 0,
        },
        async () => {
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
        }
    )
})

const getBlogSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    return cmsFindSlugs(`getBlogSlugs(${locale})`, locale, "blog")
})

const getSubscriptionConfigCached = cache(async (locale: AppLocale): Promise<SubscriptionConfigData | null> => {
    return cmsFindGlobal(`getSubscriptionConfig(${locale})`, null, {
        slug: "subscriptionConfig",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 0,
    })
})

export async function getLandingPage(slug = "main", locale: AppLocale = DEFAULT_LOCALE): Promise<Page | null> {
    return getLandingPageCached(slug, locale)
}

export async function getNavigation(locale: AppLocale = DEFAULT_LOCALE) {
    return getNavigationCached(locale)
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

export async function getBlogPosts(locale: AppLocale = DEFAULT_LOCALE, options?: { page?: number; limit?: number }): Promise<PaginatedBlogPostsResult> {
    return getBlogPostsCached(locale, options?.page ?? 1, options?.limit ?? 12)
}

export async function getBlogSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    return getBlogSlugsCached(locale)
}

export async function getSubscriptionConfig(locale: AppLocale = DEFAULT_LOCALE): Promise<SubscriptionConfigData | null> {
    return getSubscriptionConfigCached(locale)
}
