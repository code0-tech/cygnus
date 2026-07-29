import { BrandSection } from "@/components/sections/BrandSection"
import { BlogPreviewSection } from "@/components/sections/BlogPreviewSection"
import { BorderSection } from "@/components/sections/BorderSection"
import { CardRowSection } from "@/components/sections/CardRowSection"
import { CTAImageSection } from "@/components/sections/CTAImageSection"
import { CtaSection } from "@/components/sections/CtaSection"
import { FaqSection } from "@/components/sections/FaqSection"
import { BentoSection } from "@/components/sections/BentoSection"
import { HeroSection } from "@/components/sections/HeroSection"
import { InstallSection } from "@/components/sections/InstallSection"
import { ListFeatureSection } from "@/components/sections/ListFeatureSection"
import { OffsetCardsSection } from "@/components/sections/OffsetCardsSection"
import { RoadmapSection } from "@/components/sections/RoadmapSection"
import { ScrollCardSection } from "@/components/sections/ScrollCardSection"
import { SwipeCardSection } from "@/components/sections/SwipeCardSection"
import type { AppLocale } from "@/lib/i18n"
import type { Page } from "@/payload-types"
import React, { type ReactNode } from "react"
import { StandaloneCardSection } from "../sections/StandaloneCardSection"
import { VideoSection } from "../sections/VideoSection"
import { WideHeroSection } from "../sections/WideHeroSection"
import { StatsSection } from "../sections/StatsSection"
import { FlowExampleSection } from "../sections/FlowExampleSection"
import { ActionHeroSection } from "../sections/ActionHeroSection"
import { ActionFunctionsSection } from "../sections/ActionFunctionsSection"
import { ActionEventsSection } from "../sections/ActionEventsSection"
import { ActionReferencesSection } from "../sections/ActionReferencesSection"
import { ActionListSection } from "../sections/ActionListSection"
import { SubscriptionConfiguratorSection, type SubscriptionIcons } from "../sections/SubscriptionConfiguratorSection"
import { PricingSection } from "../sections/PricingSection"
import { SmallPricingSection } from "../sections/SmallPricingSection"
import { ContactSection } from "../sections/ContactSection"
import { CompareApplicationSection } from "../sections/CompareApplicationSection"
import { getIcon } from "@/components/ui/IconRenderer"
import type { ActionItem, SubscriptionConfigData, SubscriptionConfiguratorBlockData } from "@/lib/cms"

type PageBlock = NonNullable<Page["layout"]>[number]

interface PageBlocksRendererProps {
    blocks?: PageBlock[] | null
    actions?: ActionItem[]
    cardRowChildren?: ReactNode
    ctaFloating?: boolean
    locale?: AppLocale
    action?: ActionItem
    actionModuleJson?: unknown
    actionReferences?: ActionItem[]
    subscriptionConfig?: SubscriptionConfigData | null
}

type PageBlockRenderOptions = Pick<PageBlocksRendererProps, "actions" | "cardRowChildren" | "ctaFloating" | "locale" | "action" | "actionModuleJson" | "actionReferences" | "subscriptionConfig">
type BlockRenderer = (block: PageBlock, options: PageBlockRenderOptions) => ReactNode

const pageBlockRenderers: Partial<Record<PageBlock["blockType"], BlockRenderer>> = {
    hero: (block) => <HeroSection content={block as Extract<PageBlock, { blockType: "hero" }>} />,
    bento: (block) => <BentoSection content={block as Extract<PageBlock, { blockType: "bento" }>} />,
    blogPreview: (block, options) => <BlogPreviewSection content={block as Extract<PageBlock, { blockType: "blogPreview" }>} locale={options.locale} />,
    border: (block) => <BorderSection content={block as Extract<PageBlock, { blockType: "border" }>} />,
    brand: (block) => <BrandSection content={block as Extract<PageBlock, { blockType: "brand" }>} />,
    offsetCards: (block) => <OffsetCardsSection content={block as Extract<PageBlock, { blockType: "offsetCards" }>} />,
    cardRow: (block, options) => <CardRowSection content={block as Extract<PageBlock, { blockType: "cardRow" }>}>{options.cardRowChildren}</CardRowSection>,
    faq: (block) => <FaqSection content={block as Extract<PageBlock, { blockType: "faq" }>} />,
    cta: (block, options) => <CtaSection content={block as Extract<PageBlock, { blockType: "cta" }>} floatingCta={options.ctaFloating} />,
    ctaImage: (block) => <CTAImageSection content={block as Extract<PageBlock, { blockType: "ctaImage" }>} />,
    install: (block) => <InstallSection content={block as Extract<PageBlock, { blockType: "install" }>} />,
    roadmap: (block) => <RoadmapSection content={block as Extract<PageBlock, { blockType: "roadmap" }>} />,
    scrollCards: (block) => <ScrollCardSection content={block as Extract<PageBlock, { blockType: "scrollCards" }>} />,
    swipeCards: (block) => <SwipeCardSection content={block as Extract<PageBlock, { blockType: "swipeCards" }>} />,
    standaloneCard: (block) => <StandaloneCardSection content={block as Extract<PageBlock, { blockType: "standaloneCard" }>} />,
    video: (block) => <VideoSection content={block as Extract<PageBlock, { blockType: "video" }>} />,
    widehero: (block) => <WideHeroSection content={block as Extract<PageBlock, { blockType: "widehero" }>} />,
    listFeature: (block) => <ListFeatureSection content={block as Extract<PageBlock, { blockType: "listFeature" }>} />,
    stats: (block) => <StatsSection content={block as Extract<PageBlock, { blockType: "stats" }>} />,
    flowExample: (block) => <FlowExampleSection content={block as Extract<PageBlock, { blockType: "flowExample" }>} />,
    actionHero: (block, options) =>
        options.action ? <ActionHeroSection action={options.action} locale={options.locale ?? "en"} content={block as Extract<PageBlock, { blockType: "actionHero" }>} /> : null,
    actionFunctions: (block, options) => {
        if (!options.action) return null
        const content = block as Extract<PageBlock, { blockType: "actionFunctions" }>
        return (
            <ActionFunctionsSection
                moduleJson={options.actionModuleJson}
                sectionHeading={content.sectionHeading}
                sectionLayout={content.sectionLayout}
                sectionDescription={content.sectionDescription}
                sectionLinkButton={content.sectionLinkButton}
                functionDefinitionLabel={content.functionDefinitionLabel}
                parametersLabel={content.parametersLabel}
            />
        )
    },
    actionEvents: (block, options) => {
        if (!options.action) return null
        const content = block as Extract<PageBlock, { blockType: "actionEvents" }>
        return (
            <ActionEventsSection
                moduleJson={options.actionModuleJson}
                sectionHeading={content.sectionHeading}
                sectionLayout={content.sectionLayout}
                sectionDescription={content.sectionDescription}
                sectionLinkButton={content.sectionLinkButton}
                flowTypeLabel={content.flowTypeLabel}
                settingsLabel={content.settingsLabel}
            />
        )
    },
    actionReferences: (block, options) => {
        const references = options.actionReferences ?? []
        if (references.length === 0) return null

        const content = block as Extract<PageBlock, { blockType: "actionReferences" }>
        return (
            <ActionReferencesSection
                references={references}
                locale={options.locale ?? "en"}
                sectionHeading={content.sectionHeading}
                sectionLayout={content.sectionLayout}
                sectionDescription={content.sectionDescription}
                sectionLinkButton={content.sectionLinkButton}
            />
        )
    },
    actionList: (block, options) => <ActionListSection actions={options.actions ?? []} locale={options.locale ?? "en"} content={block as Extract<PageBlock, { blockType: "actionList" }>} />,
    subscriptionConfigurator: (block, options) => {
        const config = options.subscriptionConfig
        if (!config) return null

        const content = block as Extract<PageBlock, { blockType: "subscriptionConfigurator" }>
        const featureOverview: SubscriptionConfiguratorBlockData["featureOverview"] =
            content.featureOverview?.map((item) => ({
                id: item.id,
                title: item.title?.trim() || "",
                description: item.description?.trim() || "",
                icon: item.icon?.trim() || "tabler:IconCube",
            })) ?? []
        const blockContent: SubscriptionConfiguratorBlockData = {
            pageIntro: {
                heading: content.pageIntro?.heading?.trim() || "",
                description: content.pageIntro?.description?.trim() || "",
            },
            featureOverview,
            buttons:
                content.buttons?.flatMap((button) => {
                    const label = button.label?.trim()
                    const url = button.url?.trim()
                    return label && url
                        ? [
                              {
                                  id: button.id,
                                  label,
                                  url,
                                  variant: button.variant,
                              },
                          ]
                        : []
                }) ?? [],
        }
        const icons: SubscriptionIcons = {
            featureOverview: featureOverview.map((item, index) => getIcon(item.icon, 20, `feature-overview-${index}-${item.icon}`)),
            deployment: {
                selfHosted: getIcon(config.deployment.selfHosted.icon?.trim() || "tabler:IconServer", 20),
                cloud: getIcon(config.deployment.cloud.icon?.trim() || "tabler:IconCloud", 20),
            },
            customerType: {
                b2b: getIcon(config.customerType.b2b.icon?.trim() || "tabler:IconBriefcase2", 20),
                b2c: getIcon(config.customerType.b2c.icon?.trim() || "tabler:IconBuildingStore", 20),
            },
            workflowBusinessTypes: (config.workflowCalculator.businessTypes.length ? config.workflowCalculator.businessTypes : [{ icon: "tabler:IconBuilding" }]).map((businessType, index) =>
                getIcon(businessType.icon?.trim() || "tabler:IconBuilding", 18, `workflow-business-type-${index}-${businessType.icon}`)
            ),
            additionalFeatures: (config.additionalFeatures ?? []).map((feature, index) => getIcon(feature.icon?.trim() || "tabler:IconCube", 20, feature.id ?? `additional-feature-${index}`)),
        }

        return <SubscriptionConfiguratorSection locale={options.locale ?? "en"} content={{ ...config, ...blockContent }} icons={icons} />
    },
    pricing: (block, options) => {
        const config = options.subscriptionConfig
        if (!config?.packages) return null

        return <PricingSection content={block as Extract<PageBlock, { blockType: "pricing" }>} locale={options.locale ?? "en"} packages={config.packages} paymentPeriod={config.paymentPeriod} />
    },
    smallPricing: (block, options) => {
        const config = options.subscriptionConfig
        if (!config?.packages) return null

        return (
            <SmallPricingSection content={block as Extract<PageBlock, { blockType: "smallPricing" }>} locale={options.locale ?? "en"} packages={config.packages} paymentPeriod={config.paymentPeriod} />
        )
    },
    contact: (block, options) => <ContactSection content={block as Extract<PageBlock, { blockType: "contact" }>} locale={options.locale ?? "en"} />,
    compareApplication: (block) => <CompareApplicationSection content={block as Extract<PageBlock, { blockType: "compareApplication" }>} />,
}

function renderPageBlock(block: PageBlock, options: PageBlockRenderOptions) {
    const renderer = pageBlockRenderers[block.blockType]
    return renderer ? renderer(block, options) : null
}

export function PageBlocks({ blocks, actions, cardRowChildren, ctaFloating = false, locale, action, actionModuleJson, actionReferences, subscriptionConfig }: PageBlocksRendererProps) {
    const renderableBlocks =
        blocks?.flatMap((block) => {
            const element = renderPageBlock(block, { actions, cardRowChildren, ctaFloating, locale, action, actionModuleJson, actionReferences, subscriptionConfig })
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
