import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { LogoItem } from "@/components/ui/LogoItem"
import { LogoMarquee } from "@/components/ui/LogoMarquee"
import { Section } from "@/components/ui/Section"
import type { BrandLayoutBlock } from "@/lib/cms"
import type { Media } from "@/payload-types"

interface BrandSectionProps {
    content?: BrandLayoutBlock | null
}

export function BrandSection({ content }: BrandSectionProps) {
    if (!content || !content.logos) return

    const logoItems = content.logos.flatMap((item) => {
        const logo = item.logo as Media
        if (!logo?.url) return []

        return [
            {
                id: String(item.id ?? logo.id ?? logo.url),
                logo,
            },
        ]
    })
    const shouldLoopDesktop = logoItems.length > 4

    return (
        <Section showFunnel={false} animation={{ preset: "none" }} className="-mt-32">
            <StaggerContainer
                className="flex w-full flex-col items-center justify-center gap-8 pt-16 lg:flex-row"
                delayChildren={0.06}
                staggerChildren={0.08}
            >
                <StaggerItem as="p" y={14} duration={0.38} className={"w-full text-center text-secondary lg:w-1/3 lg:shrink-0 lg:text-left"}>
                    {content.description}
                </StaggerItem>
                <StaggerContainer delayChildren={0.06} staggerChildren={0.08} className={shouldLoopDesktop ? "hidden" : "hidden w-full min-w-0 grid-cols-4 gap-16 text-center text-secondary md:grid lg:flex-1"}>
                    {logoItems.map((item) => (
                        <StaggerItem y={14} duration={0.38} key={item.id}>
                            <LogoItem logo={item.logo} className="w-full" />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
                <StaggerItem y={14} duration={0.38} className={shouldLoopDesktop ? "w-full min-w-0 lg:flex-1" : "w-full md:hidden"}>
                    <LogoMarquee items={logoItems} />
                </StaggerItem>
            </StaggerContainer>
        </Section>
    )
}
