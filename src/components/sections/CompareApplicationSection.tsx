import { Card } from "@/components/ui/Card"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import type { CompareApplicationLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { IconCheck, IconChevronRight, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { Fragment } from "react"

interface CompareApplicationSectionProps {
    content?: CompareApplicationLayoutBlock | null
}

export function CompareApplicationSection({ content }: CompareApplicationSectionProps) {
    const apps = content?.apps?.filter((app) => Boolean(app.name)) ?? []
    const button = content?.buttons?.[0]
    const showIcon = content?.showIcon !== false
    if (!content || apps.length === 0) return null
    const highlightedAppIndex = apps.findIndex((app) => app.highlighted)
    const highlightedColumnWidth = 68 / apps.length

    const categories = Array.from(new Set(apps.flatMap((app) => app.features?.map((feature) => feature.category).filter((category): category is string => Boolean(category)) ?? [])))
    const comparisonRows = categories.map((category) => {
        const titles = Array.from(new Set(apps.flatMap((app) => app.features?.filter((feature) => feature.category === category).map((feature) => feature.title).filter((title): title is string => Boolean(title)) ?? [])))
        return {
            category,
            rows: titles.map((title) => ({
                title,
                statuses: apps.map((app) => app.features?.find((feature) => feature.category === category && feature.title === title)?.status ?? "unavailable"),
            })),
        }
    })

    return (
        <Section
            heading={content.sectionHeading}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <Card size="lg" variant="default" topline={false} className="w-full rounded-3xl border-0! bg-light! p-0! shadow-[inset_0_1px_1px_#bfbfbf1a]">
                <div className="overflow-x-auto rounded-[inherit]">
                    <div className="relative min-w-[900px]">
                        {highlightedAppIndex >= 0 && <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 z-0 bg-white/[0.06]"
                            style={{
                                left: `calc(32% + ${highlightedAppIndex * highlightedColumnWidth}%)`,
                                width: `${highlightedColumnWidth}%`,
                            }}
                        />}
                    <table className="relative z-10 w-full min-w-[900px] table-fixed border-separate border-spacing-0 text-left">
                        <colgroup>
                            <col className="w-[32%]" />
                            {apps.map((app) => <col key={app.id ?? app.name} />)}
                        </colgroup>
                        <thead>
                            <tr>
                                <th scope="col" className="border-b border-white/10 px-6 py-6 align-bottom text-sm font-normal text-secondary">{content.featureColumnLabel}</th>
                                {apps.map((app) => {
                                    const logo = typeof app.logo === "object" ? (app.logo as Media) : null
                                    const logoUrl = getMediaUrl(logo?.url)
                                    const highlighted = Boolean(app.highlighted)
                                    return (
                                        <th key={app.id ?? app.name} scope="col" className="border-b border-white/10 px-4 py-6 text-center">
                                            <div className="mx-auto flex flex-col items-center gap-2">
                                                <div className={cn("relative flex size-10 items-center justify-center overflow-hidden rounded-xl", highlighted ? "bg-white text-primary" : "bg-white/[0.05] text-secondary")}>
                                                    {logoUrl ? <Image src={logoUrl} alt={logo?.alt || app.name} fill sizes="40px" className="object-contain p-2" /> : <span className="text-xs font-semibold">{app.logoFallback}</span>}
                                                </div>
                                                <span className="text-sm font-semibold text-white">{app.name}</span>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonRows.map((category, categoryIndex) => <Fragment key={`category-${category.category}`}>
                                <tr>
                                    <th scope="rowgroup" className="px-6 pt-5 pb-2 text-sm font-semibold text-white">{category.category}</th>
                                    {apps.map((app) => <td key={app.id ?? app.name} className="pt-5 pb-2" />)}
                                </tr>
                                {category.rows.map((row, rowIndex) => (
                                    <tr key={`${category.category}-${row.title}`} className={cn(rowIndex === category.rows.length - 1 && categoryIndex < comparisonRows.length - 1 && "border-b border-white/[0.07]")}>
                                        <th scope="row" className="px-6 py-3 text-sm font-normal text-secondary">{row.title}</th>
                                        {row.statuses.map((status, index) => {
                                            const app = apps[index]
                                            return (
                                                <td key={app.id ?? app.name} className="px-4 py-3 text-center text-sm">
                                                    {status === "included" && showIcon && <IconCheck aria-hidden="true" size={17} className="mx-auto text-brand" />}
                                                    {status === "partial" && <span className="text-secondary">{content.partialLabel}</span>}
                                                    {status === "unavailable" && showIcon && <IconX aria-hidden="true" size={16} className="mx-auto text-tertiary" />}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </Fragment>)}
                            <tr>
                                <th scope="row" className="border-t border-white/[0.07] px-6 py-4 text-xs font-normal text-tertiary">{content.detailedComparisonsLabel}</th>
                                {apps.map((app, index) => (
                                    <td key={app.id ?? app.name} className="border-t border-white/[0.07] px-4 py-3 text-center">
                                        {index === 0 && button ? (
                                            <HapticButtonLink href={button.url} variant={button.variant ?? "filled"} className="whitespace-nowrap bg-white! px-4! py-2! text-primary! hover:bg-white/90!">{button.label}</HapticButtonLink>
                                        ) : app.comparisonUrl && app.comparisonLinkLabel ? (
                                            <HapticButtonLink href={app.comparisonUrl} variant="normal" className="whitespace-nowrap text-sm!">
                                                <span className="inline-flex items-center gap-1">
                                                    {app.comparisonLinkLabel.replace(/\s*\u203a$/u, "")}
                                                    <IconChevronRight size={14} aria-hidden="true" />
                                                </span>
                                            </HapticButtonLink>
                                        ) : null}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                    {content.footnote && <p className="relative z-10 px-4 py-3 text-xs text-tertiary">{content.footnote}</p>}
                    </div>
                </div>
            </Card>
        </Section>
    )
}
