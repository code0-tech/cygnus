import { BrandSection } from "@/components/sections/BrandSection"
import { BlogPreviewSection } from "@/components/sections/BlogPreviewSection"
import { CardRowSection } from "@/components/sections/CardRowSection"
import { CtaSection } from "@/components/sections/CtaSection"
import { FaqSection } from "@/components/sections/FaqSection"
import { BentoSection } from "@/components/sections/BentoSection"
import { HeroSection } from "@/components/sections/HeroSection"
import { InstallSection } from "@/components/sections/InstallSection"
import { OffsetCardsSection } from "@/components/sections/OffsetCardsSection"
import { RoadmapSection } from "@/components/sections/RoadmapSection"
import { ScrollCardSection } from "@/components/sections/ScrollCardSection"
import { SwipeCardSection } from "@/components/sections/SwipeCardSection"
import type { AppLocale } from "@/lib/i18n"
import type { Page } from "@/payload-types"
import React, { type ReactNode } from "react"
import { StandaloneCardSection } from "./sections/StandaloneCardSection"

type PageBlock = NonNullable<Page["layout"]>[number]

interface PageBlocksRendererProps {
    blocks?: PageBlock[] | null
    cardRowChildren?: ReactNode
    ctaFloating?: boolean
    locale?: AppLocale
}

type PageBlockRenderOptions = Pick<PageBlocksRendererProps, "cardRowChildren" | "ctaFloating" | "locale">
type BlockRenderer = (block: PageBlock, options: PageBlockRenderOptions) => ReactNode

const pageBlockRenderers: Partial<Record<PageBlock["blockType"], BlockRenderer>> = {
    hero: (block) => <HeroSection content={block as Extract<PageBlock, { blockType: "hero" }>} />,
    bento: (block, options) => <BentoSection content={block as Extract<PageBlock, { blockType: "bento" }>} locale={options.locale} />,
    blogPreview: (block, options) => <BlogPreviewSection content={block as Extract<PageBlock, { blockType: "blogPreview" }>} locale={options.locale} />,
    brand: (block) => <BrandSection content={block as Extract<PageBlock, { blockType: "brand" }>} />,
    offsetCards: (block) => <OffsetCardsSection content={block as Extract<PageBlock, { blockType: "offsetCards" }>} />,
    cardRow: (block, options) => <CardRowSection content={block as Extract<PageBlock, { blockType: "cardRow" }>}>{options.cardRowChildren}</CardRowSection>,
    faq: (block) => <FaqSection content={block as Extract<PageBlock, { blockType: "faq" }>} />,
    cta: (block, options) => <CtaSection content={block as Extract<PageBlock, { blockType: "cta" }>} floatingCta={options.ctaFloating} />,
    install: (block) => <InstallSection content={block as Extract<PageBlock, { blockType: "install" }>} />,
    roadmap: (block) => <RoadmapSection content={block as Extract<PageBlock, { blockType: "roadmap" }>} />,
    scrollCards: (block) => <ScrollCardSection content={block as Extract<PageBlock, { blockType: "scrollCards" }>} />,
    swipeCards: (block) => <SwipeCardSection content={block as Extract<PageBlock, { blockType: "swipeCards" }>} />,
    standaloneCard: (block) => <StandaloneCardSection content={block as Extract<PageBlock, { blockType: "standaloneCard" }>} />,
}

function renderPageBlock(block: PageBlock, options: PageBlockRenderOptions) {
    const renderer = pageBlockRenderers[block.blockType]
    return renderer ? renderer(block, options) : null
}

export function PageBlocks({ blocks, cardRowChildren, ctaFloating = false, locale }: PageBlocksRendererProps) {
    const renderableBlocks =
        blocks?.flatMap((block) => {
            const element = renderPageBlock(block, { cardRowChildren, ctaFloating, locale })
            return element ? [{ block, element }] : []
        }) ?? []

    return (
        <>
            {renderableBlocks.map(({ block, element }, index) => (
                <React.Fragment key={block.id ?? index}>
                    {index > 0 && <div className="h-32" aria-hidden="true" />}
                    {element}
                </React.Fragment>
            ))}
        </>
    )
}
