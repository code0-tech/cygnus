import { ActionBlock } from "@/blocks/ActionBlock"
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

export const Pages: CollectionConfig = {
    slug: "pages",
    admin: {
        useAsTitle: "title",
        defaultColumns: ["title", "slug", "updatedAt"],
    },
    access: {
        read: () => true,
        create: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => Boolean(req.user),
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "slug",
            type: "select",
            required: true,
            unique: true,
            index: true,
            options: [
                { label: "main", value: "main" },
                { label: "jobs", value: "jobs" },
                { label: "blog", value: "blog" },
                { label: "features", value: "features" },
                { label: "about-us", value: "about-us" },
                { label: "legal-notice", value: "legal-notice" },
                { label: "privacy", value: "privacy" },
                { label: "terms", value: "terms" },
                { label: "open-source-no-code-automation", value: "open-source-no-code-automation" },
                { label: "contact", value: "contact" },
                { label: "actions", value: "actions" },
                { label: "action-details", value: "action-details" },
                { label: "community-edition", value: "community-edition" },
                { label: "enterprise-edition", value: "enterprise-edition" },
                { label: "subscription", value: "subscription" },
            ],
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
                ActionBlock,
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
