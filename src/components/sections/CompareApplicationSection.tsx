import { Card } from "@/components/ui/Card"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import type { CompareApplicationLayoutBlock } from "@/lib/cms"
import { getMediaUrl } from "@/lib/media"
import { cn } from "@/lib/utils"
import type { Media } from "@/payload-types"
import { IconCheck, IconX } from "@tabler/icons-react"
import Image from "next/image"

interface CompareApplicationSectionProps {
    content?: CompareApplicationLayoutBlock | null
}

export function CompareApplicationSection({ content }: CompareApplicationSectionProps) {
    const apps = content?.apps?.filter((app) => Boolean(app.name)) ?? []
    const buttons = content?.buttons?.filter((button) => Boolean(button.label && button.url)) ?? []
    const button = buttons[0]
    const showIcon = content?.showIcon !== false

    if (!content || apps.length === 0) return null

    return (
        <Section
            heading={content.sectionHeading}
            description={content.sectionDescription}
            linkButton={content.sectionLinkButton}
            funnelType={content.sectionLayout ?? "center"}
            animation={{ preset: "none" }}
        >
            <Card size="lg" variant="light" radialGradient={content.gradient} gradientDirection={content.gradientDirection} className="w-full p-0!">
                <div className="relative z-10 overflow-x-auto rounded-[inherit]">
                    <table className="w-full table-fixed border-separate border-spacing-0" style={{ minWidth: `${Math.max(apps.length, 2) * 15}rem` }}>
                        <thead>
                            <tr>
                                {apps.map((app, index) => {
                                    const logo = typeof app.logo === "object" ? (app.logo as Media) : null
                                    const logoUrl = getMediaUrl(logo?.url)

                                    return (
                                        <th
                                            scope="col"
                                            className={cn("border-b border-white/10 p-5 text-left align-top", index > 0 && "border-l")}
                                            key={app.id ?? `${app.name}-${index}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2">
                                                    {logoUrl && (
                                                        <Image
                                                            src={logoUrl}
                                                            alt={logo?.alt || app.name}
                                                            fill
                                                            sizes="44px"
                                                            className="object-contain p-2"
                                                        />
                                                    )}
                                                </div>
                                                <span className="text-lg font-semibold text-white">{app.name}</span>
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                {apps.map((app, index) => {
                                    const features = app.features?.filter((feature) => Boolean(feature.title)) ?? []

                                    return (
                                        <td className={cn("p-5 align-top", index > 0 && "border-l border-white/10")} key={app.id ?? `${app.name}-${index}`}>
                                            <div className="flex h-full flex-col">
                                                <ul className="flex flex-col gap-2">
                                                    {features.map((feature, featureIndex) => (
                                                        <li
                                                            className={cn("flex items-start text-sm", showIcon && "gap-2", feature.exists === false ? "text-tertiary" : "text-white")}
                                                            key={feature.id ?? `feature-${featureIndex}`}
                                                        >
                                                            {showIcon &&
                                                                (feature.exists === false ? (
                                                                    <IconX size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                                                ) : (
                                                                    <IconCheck size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                                                                ))}
                                                            <span>{feature.title}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {index === 0 && button && (
                                                    <div className="mt-auto pt-6">
                                                        <HapticButtonLink
                                                            href={button.url}
                                                            variant={button.variant ?? "normal"}
                                                            className={cn("w-full!", button.variant === "filled" && "bg-white/80! text-primary! hover:bg-white!")}
                                                        >
                                                            {button.label}
                                                        </HapticButtonLink>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </Section>
    )
}
