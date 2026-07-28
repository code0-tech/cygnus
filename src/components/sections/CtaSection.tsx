import { StaggerContainer, StaggerItem } from "@/components/animations/Stagger"
import { InteractiveGridPattern } from "@/components/ui/InteractiveGridPattern"
import { HapticButtonLink } from "@/components/ui/HapticButtonLink"
import { Section } from "@/components/ui/Section"
import type { CtaLayoutBlock } from "@/lib/cms"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Card } from "../ui/Card"
import { FloatingCtaDock } from "./client/FloatingCtaDock"

interface CtaSectionProps {
    content?: CtaLayoutBlock | null
    floatingCta?: boolean
}

export function CtaSection({ content, floatingCta = false }: CtaSectionProps) {
    if (!content) return null

    const baseCtaClassName = "h-10 px-8! whitespace-nowrap text-primary! transition-all duration-300"
    const inlineCtaClassName = "bg-white/80! hover:bg-white! ring-1! ring-white/20!"
    const floatingCtaClassName = "bg-white! hover:bg-white! hover:scale-105 ring-1! ring-white/20!"

    return (
        <Section showFunnel={false} animation={{ preset: floatingCta ? "none" : "fade-in" }}>
            <Card size={"lg"} className="p-0 w-full rounded-3xl">
                <StaggerContainer
                    className="relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl px-6 py-12 sm:px-10"
                    delayChildren={0.06}
                    staggerChildren={0.12}
                    disabled={floatingCta}
                >
                    <InteractiveGridPattern className="mask-[radial-gradient(600px_circle_at_center,white,transparent)] rounded-3xl" width={40} height={40} squares={[35, 15]} />

                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_36%),radial-gradient(circle_at_center,rgba(248,114,226,0.16),transparent_62%)]" />

                    <StaggerItem y={18} duration={0.42} className="relative z-20 flex size-32 items-center justify-center rounded-2xl bg-light">
                        <div className="relative isolate flex items-center justify-center rounded-2xl px-4 py-4 ring ring-white/5">
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-br from-primary via-primary to-slate-800" />
                            <Image src={"/code0_logo_white.png"} width={120} height={120} alt="Code0 Logo" className="z-20" />
                        </div>
                    </StaggerItem>

                    <StaggerItem as="p" y={18} duration={0.42} className="z-20 text-center text-2xl font-semibold text-white sm:text-4xl">
                        {content.heading}
                    </StaggerItem>

                    <StaggerItem as="p" y={18} duration={0.42} className="z-20 w-4/5 text-center text-secondary sm:w-2/3 sm:text-lg lg:w-1/2">
                        {content.subheading}
                    </StaggerItem>

                    <StaggerItem y={18} duration={0.42}>
                        <FloatingCtaDock floating={floatingCta}>
                            <HapticButtonLink
                                href={content.ctaLink.url}
                                variant="normal"
                                className={cn(
                                    baseCtaClassName,
                                    floatingCta ? floatingCtaClassName : inlineCtaClassName,
                                    floatingCta && "group-data-[docked=true]/floating-cta:shadow-none group-data-[docked=false]/floating-cta:shadow-[0_0_60px_20px_rgba(0,0,0,0.75)]"
                                )}
                            >
                                {content.ctaLink.label}
                            </HapticButtonLink>
                        </FloatingCtaDock>
                    </StaggerItem>
                </StaggerContainer>
            </Card>
        </Section>
    )
}
