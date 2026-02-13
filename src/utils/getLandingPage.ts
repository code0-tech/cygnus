"use server"

import config from "@/payload.config"
import type { Media } from "@/payload-types"
import { getPayload } from "payload"

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
        variant?: "default" | "ghost" | "link" | null
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

interface LandingPageDoc {
    id: number
    title: string
    slug: string
    layout?: (HeroLayoutBlock | BrandLayoutBlock | UseCaseLayoutBlock | FaqLayoutBlock | CtaLayoutBlock | ({ blockType?: string } & Record<string, unknown>))[] | null
    updatedAt: string
    createdAt: string
}

export async function getLandingPage(slug = "main"): Promise<LandingPageDoc | null> {
    const payload = await getPayload({ config })

    const result = await payload.find({
        collection: "pages",
        where: {
            slug: {
                equals: slug,
            },
        },
        limit: 1,
        depth: 1,
        pagination: false,
    })

    console.log(result)

    return (result.docs[0] as unknown as LandingPageDoc | undefined) ?? null
}
