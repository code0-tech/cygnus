import { ActionHeroBlock } from "@/blocks/ActionHeroBlock"
import { ActionFunctionsBlock } from "@/blocks/ActionFunctionsBlock"
import { ActionEventsBlock } from "@/blocks/ActionEventsBlock"
import { ActionReferencesBlock } from "@/blocks/ActionReferencesBlock"
import { ActionListBlock } from "@/blocks/ActionListBlock"
import { SwipeCardBlock } from "@/blocks/SwipeCardBlock"
import { BlogBlock } from "../blocks/BlogBlock"
import { BlogPreviewBlock } from "../blocks/BlogPreviewBlock"
import { BorderBlock } from "../blocks/BorderBlock"
import { BrandBlock } from "../blocks/BrandBlock"
import { CardRowBlock } from "../blocks/CardRowBlock"
import { ContactBlock } from "../blocks/ContactBlock"
import { CtaBlock } from "../blocks/CtaBlock"
import { CTAImageBlock } from "../blocks/CTAImageBlock"
import { FaqBlock } from "../blocks/FaqBlock"
import { BentoBlock } from "../blocks/BentoBlock"
import { HeroBlock } from "../blocks/HeroBlock"
import { InstallBlock } from "../blocks/InstallBlock"
import { JobsBlock } from "../blocks/JobsBlock"
import { ListFeatureSection } from "../blocks/ListFeatureSection"
import { MarkdownBlock } from "../blocks/MarkdownBlock"
import { OffsetCardsBlock } from "../blocks/OffsetCardsBlock"
import { RoadmapBlock } from "../blocks/RoadmapBlock"
import { ScrollCardBlock } from "../blocks/ScrollCardBlock"
import type { CollectionConfig } from "payload"
import { StandaloneBlock } from "@/blocks/StandaloneBlock"
import { VideoBlock } from "@/blocks/VideoBlock"
import { WideHeroBlock } from "@/blocks/WideHeroBlock"
import { StatsBlock } from "@/blocks/StatsBlock"
import { FlowExampleBlock } from "@/blocks/FlowExampleBlock"

const RESERVED_PAGE_SLUGS = [
    "main",
    "jobs",
    "blog",
    "features",
    "about-us",
    "legal-notice",
    "privacy",
    "terms",
    "contact",
    "actions",
    "action-details",
    "community-edition",
    "enterprise-edition",
    "pricing",
    "subscription",
] as const

function formatSlug(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function isCustomPage(siblingData: unknown) {
    return Boolean(siblingData && typeof siblingData === "object" && "customPage" in siblingData && siblingData.customPage)
}

export const Pages: CollectionConfig = {
    slug: "pages",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "slug", "customSlug", "updatedAt"],
    },
    access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
    },
    hooks: {
        beforeValidate: [
            ({ data, originalDoc }) => {
                if (!data) return data

                const customPage = Boolean(data.customPage ?? originalDoc?.customPage)
                if (!customPage) {
                    data.customSlug = null
                    return data
                }

                const submittedSlug = typeof data.customSlug === "string" ? data.customSlug : typeof originalDoc?.customSlug === "string" ? originalDoc.customSlug : ""
                const title = typeof data.title === "string" ? data.title : typeof originalDoc?.title === "string" ? originalDoc.title : ""

                data.slug = null
                data.customSlug = formatSlug(submittedSlug.trim() || title)

                return data
            },
        ],
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "customPage",
            label: "Custom Page",
            type: "checkbox",
            defaultValue: false,
            admin: {
                description: "Enable this to use a custom URL slug instead of one of the predefined pages.",
            },
        },
        {
            name: "slug",
            label: "Slug",
            type: "select",
            required: false,
            unique: true,
            index: true,
            options: RESERVED_PAGE_SLUGS.map((slug) => ({ label: slug, value: slug })),
            admin: {
                condition: (_, siblingData) => !isCustomPage(siblingData),
            },
            validate: (value: string | null | undefined, { siblingData }: { siblingData: unknown }) => {
                if (isCustomPage(siblingData)) return true
                return value ? true : "Select a predefined slug or enable Custom Page."
            },
        },
        {
            name: "customSlug",
            label: "Slug",
            type: "text",
            required: false,
            unique: true,
            index: true,
            admin: {
                condition: (_, siblingData) => isCustomPage(siblingData),
                description: "Generated from the title when left empty. Predefined page slugs cannot be used.",
            },
            validate: (value: string | null | undefined, { siblingData }: { siblingData: unknown }) => {
                if (!isCustomPage(siblingData)) return true

                const slug = formatSlug(typeof value === "string" ? value : "")
                if (!slug) return true
                if ((RESERVED_PAGE_SLUGS as readonly string[]).includes(slug)) {
                    return `"${slug}" is reserved for a predefined page.`
                }

                return true
            },
        },
        {
            name: "layout",
            label: "Layout",
            type: "blocks",
            blocks: [
                HeroBlock,
                BentoBlock,
                OffsetCardsBlock,
                InstallBlock,
                SwipeCardBlock,
                BrandBlock,
                FaqBlock,
                CtaBlock,
                CTAImageBlock,
                JobsBlock,
                BlogBlock,
                BlogPreviewBlock,
                BorderBlock,
                ActionHeroBlock,
                ActionFunctionsBlock,
                ActionEventsBlock,
                ActionReferencesBlock,
                ActionListBlock,
                MarkdownBlock,
                ContactBlock,
                CardRowBlock,
                RoadmapBlock,
                ScrollCardBlock,
                StandaloneBlock,
                VideoBlock,
                WideHeroBlock,
                ListFeatureSection,
                StatsBlock,
                FlowExampleBlock,
            ],
            required: false,
            localized: true,
        },
    ],
}
