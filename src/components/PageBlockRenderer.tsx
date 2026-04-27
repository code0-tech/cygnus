import { BrandSection } from "@/components/sections/BrandSection"
import { CtaSection } from "@/components/sections/CtaSection"
import { DeploymentSection } from "@/components/sections/DeploymentSection"
import { EditionFeatureSection } from "@/components/sections/EditionFeatureSection"
import { EditionInstallSection } from "@/components/sections/EditionInstallSection"
import { EditionUseCaseSection } from "@/components/sections/EditionUseCaseSection"
import { FaqSection } from "@/components/sections/FaqSection"
import { HeroSection } from "@/components/sections/HeroSection"
import { UseCaseSection } from "@/components/sections/UseCaseSection"
import type { AppLocale } from "@/lib/i18n"
import type { Page } from "@/payload-types"
import React from "react"

type PageBlock = NonNullable<Page["layout"]>[number]

interface PageBlocksRendererProps {
    blocks?: PageBlock[] | null
    ctaFloating?: boolean
    locale?: AppLocale
}

function renderPageBlock(block: PageBlock, options: Pick<PageBlocksRendererProps, "ctaFloating" | "locale">) {
    switch (block.blockType) {
        case "hero":
            return <HeroSection content={block} />
        case "brand":
            return <BrandSection content={block} />
        case "usecase":
            return <UseCaseSection content={block} />
        case "deployment":
            return <DeploymentSection content={block} />
        case "faq":
            return <FaqSection content={block} />
        case "cta":
            return <CtaSection content={block} floatingCta={options.ctaFloating} locale={options.locale} />
        case "editionFeatures":
            return <EditionFeatureSection content={block} />
        case "editionInstall":
            return <EditionInstallSection content={block} />
        case "editionUseCases":
            return <EditionUseCaseSection content={block} />
        default:
            return null
    }
}

export function PageBlocks({ blocks, ctaFloating = false, locale }: PageBlocksRendererProps) {
    const renderableBlocks = blocks?.filter((block) => renderPageBlock(block, { ctaFloating, locale }) !== null) ?? []

    return (
        <>
            {renderableBlocks.map((block, index) => (
                <React.Fragment key={block.id ?? index}>
                    {index > 0 && <div className="h-32" aria-hidden="true" />}
                    {renderPageBlock(block, { ctaFloating, locale })}
                </React.Fragment>
            ))}
        </>
    )
}
