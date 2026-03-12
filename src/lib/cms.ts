"use server"

import type { Blog, Feature, Footer, Job, Media, NavbarItem, Page, RoadmapItem as PayloadRoadmapItem, Section, User } from "@/payload-types"
import { DEFAULT_LOCALE, type AppLocale } from "@/lib/i18n"
import { getPayloadClient } from "@/lib/payloadClient"
import { unstable_cache } from "next/cache"

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

type BlogPostItem = Pick<Blog, "id" | "title" | "slug" | "content" | "createdAt"> & {
    heroImage?: (number | null) | Media
    author: number | Pick<User, "email" | "name">
}
export type BlogListItem = Pick<Blog, "id" | "title" | "slug" | "createdAt"> & {
    author: number | Pick<User, "name">
}

const getLandingPageCached = unstable_cache(
    async (cachedSlug: string, cachedLocale: AppLocale): Promise<Page | null> => {
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
    },
    ["landing-page"],
    { revalidate: 300, tags: ["pages"] },
)

const getNavbarItemsCached = unstable_cache(
    async (locale: AppLocale): Promise<NavbarItem[]> => {
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
    },
    ["navbar-items"],
    { revalidate: 300, tags: ["navbarItems"] },
)

const getFooterCached = unstable_cache(
    async (locale: AppLocale): Promise<Footer | null> => {
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
    },
    ["footer"],
    { revalidate: 300, tags: ["footer"] },
)

const getFeaturesCached = unstable_cache(
    async (locale: AppLocale): Promise<FeatureItem[]> => {
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
    },
    ["features"],
    { revalidate: 300, tags: ["features"] },
)

const getJobsCached = unstable_cache(
    async (locale: AppLocale): Promise<JobItem[]> => {
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
    },
    ["jobs"],
    { revalidate: 300, tags: ["jobs"] },
)

const getJobBySlugCached = unstable_cache(
    async (slug: string, locale: AppLocale): Promise<JobDetailItem | null> => {
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
    },
    ["job-by-slug"],
    { revalidate: 300, tags: ["jobs"] },
)

const getTeamMembersCached = unstable_cache(
    async (): Promise<TeamMemberItem[]> => {
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
    },
    ["team-members"],
    { revalidate: 300, tags: ["users"] },
)

const getJobSlugsCached = unstable_cache(
    async (locale: AppLocale): Promise<string[]> => {
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
    },
    ["job-slugs"],
    { revalidate: 300, tags: ["jobs"] },
)

const getBlogPostBySlugCached = unstable_cache(
    async (slug: string, locale: AppLocale): Promise<BlogPostItem | null> => {
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
    },
    ["blog-post-by-slug"],
    { revalidate: 300, tags: ["blog"] },
)

const getBlogPostsCached = unstable_cache(
    async (locale: AppLocale): Promise<BlogListItem[]> => {
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
                createdAt: true,
                author: true,
            },
        })
        return (result.docs as BlogListItem[]) ?? []
    },
    ["blog-posts"],
    { revalidate: 300, tags: ["blog"] },
)

const getBlogSlugsCached = unstable_cache(
    async (locale: AppLocale): Promise<string[]> => {
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
    },
    ["blog-slugs"],
    { revalidate: 300, tags: ["blog"] },
)

const getRoadmapItemsCached = unstable_cache(
    async (locale: AppLocale): Promise<RoadmapItem[]> => {
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
    },
    ["roadmap-items"],
    { revalidate: 300, tags: ["roadmapItems"] },
)

const getSectionsCached = unstable_cache(
    async (locale: AppLocale): Promise<Section[]> => {
        const payload = await getPayloadClient()
        const result = await payload.find({
            collection: "sections",
            locale,
            fallbackLocale: DEFAULT_LOCALE,
            pagination: false,
            depth: 0,
        })
        return result.docs as Section[]
    },
    ["sections-all"],
    { revalidate: 300, tags: ["sections"] },
)

type SectionType = NonNullable<Section["sectionType"]>

const getSectionByTypeCached = unstable_cache(
    async (cachedSectionType: SectionType, cachedLocale: AppLocale) => {
        const sections = await getSectionsCached(cachedLocale)
        return sections.find((section) => section.sectionType === cachedSectionType) ?? null
    },
    ["section-by-type"],
    { revalidate: 300, tags: ["sections"] },
)

export async function getLandingPage(slug = "main", locale: AppLocale = DEFAULT_LOCALE): Promise<Page | null> {
    return getLandingPageCached(slug, locale)
}

export async function getNavbarItems(locale: AppLocale = DEFAULT_LOCALE) {
    return getNavbarItemsCached(locale)
}

export async function getFooter(locale: AppLocale = DEFAULT_LOCALE) {
    return getFooterCached(locale)
}

async function getFeatures(locale: AppLocale = DEFAULT_LOCALE) {
    return getFeaturesCached(locale)
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

export async function getBlogPosts(locale: AppLocale = DEFAULT_LOCALE): Promise<BlogListItem[]> {
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

async function getSectionByType(sectionType: SectionType, locale: AppLocale = DEFAULT_LOCALE) {
    return getSectionByTypeCached(sectionType, locale)
}
