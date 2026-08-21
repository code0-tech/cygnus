import "server-only"

import { extractActionModuleInfo, fetchMediaJson } from "@/lib/actionExtraction"
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n"
import type { NavigationData } from "@/lib/navigation"
import { getPayloadClient } from "@/lib/payloadClient"
import type { Action, Blog, CookieBanner, Footer, Job, Media, Navigation, Page, TeamMember } from "@/payload-types"
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
export type FlowExampleLayoutBlock = Extract<PageLayoutBlock, { blockType: "flowExample" }>
export type PricingLayoutBlock = Extract<PageLayoutBlock, { blockType: "pricing" }>
export type SmallPricingLayoutBlock = Extract<PageLayoutBlock, { blockType: "smallPricing" }>
export type CompareApplicationLayoutBlock = Extract<PageLayoutBlock, { blockType: "compareApplication" }>

export type ActionItem = Pick<Action, "id" | "identifier" | "module" | "tags" | "createdAt"> & {
    slug: string
    title: string
    shortDescription?: string | null
    description?: string | null
    icon?: string
    brandColor1?: string
    brandColor2?: string
    documentation?: string | null
    references?: Array<number | ActionItem> | null
}
type ActionDetailItem = ActionItem

interface SubscriptionUsageRange {
    default: number
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
    optionsPanelHeading: string
    defaults: {
        deployment: "self_hosted" | "cloud"
        customerType: "b2b" | "b2c"
        paymentPeriod: {
            b2b: "monthly" | "quarterly" | "yearly"
            b2c: "weekly" | "monthly" | "yearly"
        }
    }
    deployment: {
        label: string
        description?: string | null
        selfHosted: {
            title: string
            description: string
            icon: string
            image?: number | Media | null
            color: IconColor
        }
        cloud: {
            title: string
            description: string
            icon: string
            image?: number | Media | null
            color: IconColor
        }
    }
    plan: {
        title: string
        description?: string | null
        pro: {
            title: string
            description: string
            features?: Array<{ id?: string | null; text?: string | null }> | null
            icon: string
            color: IconColor
            image?: number | Media | null
        }
        max: {
            title: string
            description: string
            features?: Array<{ id?: string | null; text?: string | null }> | null
            icon: string
            color: IconColor
            image?: number | Media | null
        }
        custom: {
            title: string
            description: string
            features?: Array<{ id?: string | null; text?: string | null }> | null
            icon: string
            color: IconColor
            image?: number | Media | null
        }
    }
    customerType: {
        label: string
        description?: string | null
        b2b: {
            title: string
            description: string
            icon: string
            image?: number | Media | null
            color: IconColor
        }
        b2c: {
            title: string
            description: string
            icon: string
            image?: number | Media | null
            color: IconColor
        }
    }
    packages: {
        pro: {
            title: string
            description: string
        }
        max: {
            title: string
            description: string
        }
        custom: {
            title: string
            description: string
        }
    }
    paymentPeriod: {
        title: string
        label: string
        description?: string | null
        weeklyText: string
        monthlyText: string
        quarterlyText: string
        yearlyText: string
        weeklyPeriodSuffix: string
        monthlyPeriodSuffix: string
        quarterlyPeriodSuffix: string
        yearlyPeriodSuffix: string
        weeklyPaidLabel: string
        quarterlyPaidLabel: string
        yearlyPaidLabel: string
        weeklyColor: IconColor
        monthlyColor: IconColor
        quarterlyColor: IconColor
        yearlyColor: IconColor
    }
    workflowExecutions: {
        title: string
        description?: string | null
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
    aiTokens: {
        title: string
        description?: string | null
        b2b: SubscriptionUsageRange
        b2c: SubscriptionUsageRange
        suffix: string
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
}

export interface SubscriptionConfiguratorBlockData {
    pageIntro: {
        heading: string
        description: string
    }
}

export type SubscriptionConfiguratorContent = SubscriptionConfigData & SubscriptionConfiguratorBlockData

export type IconColor = "neutral" | "brand" | "aqua" | "blue" | "pink" | "yellow" | "lime" | "magenta"

export interface CheckoutData {
    id: number
    title: string
    navigation: {
        backLabel: string
    }
    stepper: {
        configurationLabel: string
        billingAddressLabel: string
        paymentLabel: string
        successLabel: string
    }
    login: {
        heading: string
        description: string
        loginLabel: string
        guestHeading: string
        guestDescription: string
        guestLabel: string
        loginUrl: string
    }
    summary: {
        eyebrow: string
        heading: string
        description: string
        configurationLabel: string
        deploymentLabel: string
        deploymentIcons: {
            cloud: string
            selfHosted: string
        }
        deploymentIconColor: IconColor
        customerTypeLabel: string
        customerTypeIcons: {
            b2b: string
            b2c: string
        }
        customerTypeIconColor: IconColor
        aiTokensLabel: string
        aiTokensIcon: string
        aiTokensIconColor: IconColor
        workflowExecutionsLabel: string
        workflowExecutionsIcon: string
        workflowExecutionsIconColor: IconColor
        pricing: {
            label: string
            description: string
            planLabel: string
            baseLabel: string
            workflowExecutionsLabel: string
            quarterlyDiscountLabel: string
            yearlyDiscountLabel: string
            discountLabel: string
            discountInputPlaceholder: string
            discountButtonLabel: string
            discountPromptLabel: string
            discountRemoveLabel: string
            taxLabel: string
            totalLabel: string
            perMonthSuffix: string
        }
    }
    form: {
        billingHeading: string
        paymentHeading: string
        continueLabel: string
        backToBillingLabel: string
        payNowLabel: string
        sendOfferLabel: string
        sendOfferTitle: string
        sendOfferDescription: string
        processingLabel: string
        customerSelectLabel: string
        newCustomerLabel: string
        customerFallbackLabel: string
        mobileContactLabel: string
        mobileNextLabel: string
        mobileTaxLabel: string
        nameLabel: string
        namePlaceholder: string
        emailLabel: string
        emailPlaceholder: string
        phoneLabel: string
        phonePlaceholder: string
        line1Label: string
        line1Placeholder: string
        line2Label: string
        line2Placeholder: string
        cityLabel: string
        stateLabel: string
        statePlaceholder: string
        postalCodeLabel: string
        countryLabel: string
        countryPlaceholder: string
        countryEmptyLabel: string
        taxIdTypeLabel: string
        taxIdTypePlaceholder: string
        taxIdValueLabel: string
        taxIdValuePlaceholder: string
    }
    upgradeBanner: {
        text: string
        buttonLabel: string
    }
    nextSteps: {
        heading: string
        step1Title: string
        step1Description: string
        step2Title: string
        step2Description: string
        step3Title: string
        step3Description: string
    }
    success: {
        heading: string
        description: string
        licenseDashboardLabel: string
        sculptorLabel: string
        licenseDownloadLabel: string
        licenseDownloadError: string
        licensePendingLabel: string
        licenseReadyLabel: string
        licenseStatusRetryLabel: string
        receiptHint: string
        failedHeading: string
        failedDescription: string
        invalidHeading: string
        invalidDescription: string
        checkoutRetryLabel: string
        backToHomepageLabel: string
    }
}

export interface LicenseContent {
    license: string
    licenses: string
    emptyLicenses: string
    redirectUrl: string
    sidebar: {
        dashboard: string
        logout: string
        loggingOut: string
        refresh: string
        refreshing: string
    }
    dashboard: {
        customers: string
        emptyCustomers: string
        recentLicenses: string
        customerLabel: string
        nameLabel: string
        typeLabel: string
        emailLabel: string
        lastEditedLabel: string
        editLabel: string
        statusLabel: string
        deploymentLabel: string
        paymentPeriodLabel: string
        workflowExecutionsLabel: string
        aiTokensLabel: string
    }
    values: {
        customerTypes: { personal: string; business: string }
        deploymentTypes: { cloud: string; selfHosted: string }
        paymentPeriods: { weekly: string; monthly: string; quarterly: string; yearly: string }
        statuses: { active: string; paid: string; paymentFailed: string; canceled: string; expired: string }
        invoiceStatuses: { draft: string; open: string; paid: string; uncollectible: string; void: string }
        plans: { pro: string; max: string; custom: string }
        unknown: string
    }
    invoices: {
        title: string
        empty: string
        numberLabel: string
        periodLabel: string
        amountLabel: string
        statusLabel: string
        downloadLabel: string
        unavailableLabel: string
    }
    pagination: {
        loadMoreLabel: string
        loadingLabel: string
    }
    editor: {
        customerTitle: string
        customerDescription: string
        contactHeading: string
        paymentMethodHeading: string
        paymentMethodDescription: string
        changePaymentMethodLabel: string
        loadingPaymentMethodLabel: string
        savePaymentMethodLabel: string
        savingPaymentMethodLabel: string
        paymentMethodSuccess: string
        licenseTitle: string
        licenseDescription: string
        namespaceLabel: string
        saveLabel: string
        cancelLabel: string
        closeLabel: string
        selfHostedDescription: string
    }
    subscriptionPreview: {
        totalLabel: string
        prorationLabel: string
        immediateNote: string
        scheduledNote: string
        loadingLabel: string
    }
    withdrawal: {
        text: string
    }
    billing: {
        title: string
        description: string
        periodLabel: string
        currentPeriodEndLabel: string
        pendingChangeLabel: string
    }
    cancel: {
        title: string
        description: string
        confirmLabel: string
        pendingHeading: string
        pendingDescription: string
        cancelAtLabel: string
        resumeLabel: string
    }
    upgrade: {
        title: string
        description: string
        planLabel: string
        increaseOnlyNote: string
    }
}

export interface ErrorsContent {
    dashboardLoad: string
    retry: string
    customerUpdate: string
    paymentMethodUpdate: string
    licenseUpdate: string
    subscriptionPreview: string
    billingUpdate: string
    subscriptionCancel: string
    subscriptionResume: string
    planUpgrade: string
    paymentFallback: string
    sessionUnavailable: string
    customerCreation: string
    customerTypeMismatch: string
    checkoutCustomer: string
    checkoutSession: string
    checkoutSessionExpired: string
    billingAddressUpdate: string
    emailUpdate: string
    taxIdUpdate: string
    taxIdIncomplete: string
    paymentConfirmation: string
    discountSessionRequired: string
    discountValidation: string
    checkoutLicenseStatus: string
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
        depth: 1,
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
        depth: 2,
        pagination: false,
    })
})

const getCustomLandingPageCached = cache(async (customSlug: string, locale: AppLocale): Promise<Page | null> => {
    return cmsFindOne(`getCustomLandingPage(${customSlug}, ${locale})`, null, {
        collection: "pages",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        where: {
            and: [{ customPage: { equals: true } }, { customSlug: { equals: customSlug } }],
        },
        limit: 1,
        depth: 2,
        pagination: false,
    })
})

const getCustomLandingPageSlugsCached = cache(async (locale: AppLocale): Promise<string[]> => {
    const pages = await cmsFindMany<Pick<Page, "customSlug">>(`getCustomLandingPageSlugs(${locale})`, [], {
        collection: "pages",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        where: { customPage: { equals: true } },
        pagination: false,
        limit: 1000,
        depth: 0,
        select: { customSlug: true },
    })

    return pages.flatMap((page) => (page.customSlug ? [page.customSlug] : []))
})

const getNavigationCached = cache(async (locale: AppLocale): Promise<NavigationData | null> => {
    return cmsFindGlobal<Navigation>(`getNavigation(${locale})`, null, {
        slug: "navigation",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 2,
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

async function enrichAction(action: Action): Promise<ActionItem> {
    const module = typeof action.module === "number" ? undefined : action.module
    const moduleJson = await fetchMediaJson(module).catch(() => null)
    const moduleInfo = extractActionModuleInfo(moduleJson)
    const slug = moduleInfo?.identifier || action.identifier || `action-${action.id}`
    const title = moduleInfo?.title || slug

    return {
        id: action.id,
        identifier: action.identifier,
        module: action.module,
        createdAt: action.createdAt,
        slug,
        title,
        shortDescription: moduleInfo?.description || null,
        description: moduleInfo?.description || null,
        icon: moduleInfo?.icon,
        brandColor1: moduleInfo?.brandColor1,
        brandColor2: moduleInfo?.brandColor2,
        documentation: moduleInfo?.documentation || null,
        tags: action.tags,
        references: action.references?.map((reference) => (typeof reference === "number" ? reference : reference.id)) ?? null,
    }
}

async function enrichActions(actions: Action[]): Promise<ActionItem[]> {
    const enrichedActions = await Promise.all(actions.map((action) => enrichAction(action)))
    const enrichedActionsById = new Map(enrichedActions.map((action) => [action.id, action]))

    return enrichedActions
        .map((action) => ({
            ...action,
            references:
                action.references
                    ?.map((reference) => enrichedActionsById.get(typeof reference === "number" ? reference : reference.id))
                    .filter((reference): reference is ActionItem => Boolean(reference)) ?? null,
        }))
        .sort((a, b) => a.title.localeCompare(b.title))
}

const getActionsCached = cache(async (locale: AppLocale): Promise<ActionItem[]> => {
    const actions = await cmsFindMany(`getActions(${locale})`, [], {
        collection: "actions",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        sort: "createdAt",
        pagination: false,
        depth: 1,
        select: {
            module: true,
            identifier: true,
            tags: true,
            references: true,
            createdAt: true,
        },
    })

    return enrichActions(actions)
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
    const actions = await getActionsCached(locale)
    return actions.find((action) => action.slug === slug) ?? null
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
        depth: 1,
    })
})

const getCheckoutContentCached = cache(async (locale: AppLocale): Promise<CheckoutData | null> => {
    return cmsFindGlobal(`getCheckout(${locale})`, null, {
        slug: "checkout",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 0,
    })
})

const getLicenseContentCached = cache(async (locale: AppLocale): Promise<LicenseContent | null> => {
    return cmsFindGlobal(`getLicenses(${locale})`, null, {
        slug: "licenses",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 0,
    })
})

const getErrorsContentCached = cache(async (locale: AppLocale): Promise<ErrorsContent | null> => {
    return cmsFindGlobal(`getErrors(${locale})`, null, {
        slug: "errors",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        depth: 0,
    })
})

export async function getLandingPage(slug = "main", locale: AppLocale = DEFAULT_LOCALE): Promise<Page | null> {
    return getLandingPageCached(slug, locale)
}

export async function getCustomLandingPage(customSlug: string, locale: AppLocale = DEFAULT_LOCALE): Promise<Page | null> {
    return getCustomLandingPageCached(customSlug, locale)
}

export async function getCustomLandingPageSlugs(locale: AppLocale = DEFAULT_LOCALE): Promise<string[]> {
    return getCustomLandingPageSlugsCached(locale)
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

export async function getCheckoutContent(locale: AppLocale = DEFAULT_LOCALE): Promise<CheckoutData | null> {
    return getCheckoutContentCached(locale)
}

export async function getLicenseContent(locale: AppLocale = DEFAULT_LOCALE): Promise<LicenseContent | null> {
    return getLicenseContentCached(locale)
}

export async function getErrorsContent(locale: AppLocale = DEFAULT_LOCALE): Promise<ErrorsContent | null> {
    return getErrorsContentCached(locale)
}
