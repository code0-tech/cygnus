"use client"

import { LogoItem } from "@/components/ui/LogoItem"
import { LogoMarquee } from "@/components/ui/LogoMarquee"
import { Section } from "@/components/ui/Section"
import { BrandLayoutBlock } from "@/lib/cms"
import type { Media } from "@/payload-types"
import { m as motion, type Variants } from "motion/react"

interface BrandSectionProps {
    content?: BrandLayoutBlock | null
}

const STAGGER_CONTAINER: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
}
const STAGGER_ITEM: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
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
            <motion.div
                className="flex w-full flex-col items-center justify-center gap-8 pt-16 lg:flex-row"
                variants={STAGGER_CONTAINER}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
            >
                <motion.p variants={STAGGER_ITEM} className={"w-full text-center text-secondary lg:w-1/3 lg:shrink-0 lg:text-left"}>
                    {content.description}
                </motion.p>
                <motion.div variants={STAGGER_CONTAINER} className={shouldLoopDesktop ? "hidden" : "hidden w-full min-w-0 grid-cols-4 gap-16 text-center text-secondary md:grid lg:flex-1"}>
                    {logoItems.map((item) => (
                        <motion.div variants={STAGGER_ITEM} key={item.id}>
                            <LogoItem logo={item.logo} className="w-full" />
                        </motion.div>
                    ))}
                </motion.div>
                <motion.div variants={STAGGER_ITEM} className={shouldLoopDesktop ? "w-full min-w-0 lg:flex-1" : "w-full md:hidden"}>
                    <LogoMarquee items={logoItems} />
                </motion.div>
            </motion.div>
        </Section>
    )
}
