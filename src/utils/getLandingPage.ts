"use server"

import config from "@/payload.config"
import type { Media } from "@/payload-types"
import { DEFAULT_LOCALE, type AppLocale } from "@/utils/i18n"
import { getPayload } from "payload"
import type { SerializedEditorState } from "lexical"

export interface HeroLayoutBlock {
    blockType: "hero"
    id?: string | null
    blockName?: string | null
    badge?: string | null
    heading: string
    texts?:
    | {
        text: string
        id?: string | null
    }[]
    | null
    buttons?:
    | {
        label: string
        url: string
        variant?: "none" | "normal" | "outlined" | "filled" | null
        id?: string | null
    }[]
    | null
}

export interface BrandLayoutBlock {
    blockType: "brand"
    id?: string | null
    blockName?: string | null
    description: string
    logos?:
    | {
        logo: string | Media
        id?: string | null
    }[]
    | null
}

export interface CtaLayoutBlock {
    blockType: "cta"
    id?: string | null
    blockName?: string | null
    heading: string
    subheading: string
    ctaLink: {
        label: string
        url: string
    }
}

    export interface FaqLayoutBlock {
    blockType: "faq"
    id?: string | null
    blockName?: string | null
    items:
    | {
        question: string
        answer: string
        id?: string | null
    }[]
    | null
}

export interface UseCaseLayoutBlock {
    blockType: "usecase"
    id?: string | null
    blockName?: string | null
    useCases:
    | {
        label: string
        title: string
        description: string
        id?: string | null
    }[]
    | null
}

export interface DeploymentLayoutBlock {
    blockType: "deployment"
    id?: string | null
    blockName?: string | null
    cloudTitle: string
    cloudDescription: string
    cloudLink: {
        label: string
        url: string
    }
    selfhostTitle: string
    selfhostDescription: string
    selfhostLink: {
        label: string
        url: string
    }
}

export interface JobsLayoutBlock {
    blockType: "jobs"
    id?: string | null
    blockName?: string | null
    heading: string
    searchPlaceholder: string
    allLocationsLabel: string
    allJobTypesLabel: string
    allCategoriesLabel: string
    noJobsFoundLabel: string
    applicationHeading: string
    applicationNameLabel: string
    applicationNamePlaceholder: string
    applicationEmailLabel: string
    applicationEmailPlaceholder: string
    applicationMessageLabel: string
    applicationMessagePlaceholder: string
    applicationSubmitLabel: string
}

export interface MarkdownLayoutBlock {
    blockType: "markdown"
    id?: string | null
    blockName?: string | null
    content: SerializedEditorState
}

export interface ContactLayoutBlock {
    blockType: "contact"
    id?: string | null
    blockName?: string | null
    heading: string
    nameLabel: string
    namePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    submitLabel: string
}

interface LandingPageDoc {
    id: number
    title: string
    slug: string
    meta?: {
        title?: string | null
        description?: string | null
    } | null
    layout?: (HeroLayoutBlock | BrandLayoutBlock | UseCaseLayoutBlock | DeploymentLayoutBlock | FaqLayoutBlock | CtaLayoutBlock | JobsLayoutBlock | MarkdownLayoutBlock | ContactLayoutBlock | ({ blockType?: string } & Record<string, unknown>))[] | null
    updatedAt: string
    createdAt: string
}

export async function getLandingPage(slug = "main", locale: AppLocale = DEFAULT_LOCALE): Promise<LandingPageDoc | null> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "pages",
        locale,
        fallbackLocale: DEFAULT_LOCALE,
        where: {
            slug: {
                equals: slug,
            },
        },
        limit: 1,
        depth: 1,
        pagination: false,
    })

    return (result.docs[0] as unknown as LandingPageDoc | undefined) ?? null
}
