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

export function BrandSection({ content }: BrandSectionProps) {
    if (!content || !content.logos) return

    const logos = content.logos.map((item) => item.logo).filter((logo) => Boolean((logo as Media)?.url))
    const shouldLoopDesktop = logos.length > 4

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.06,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 14 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
        },
    }

    return (
        <Section showFunnel={false} animation={{ preset: "none" }} className="-mt-32">
            <motion.div
                className="flex w-full flex-col items-center justify-center gap-8 pt-16 lg:flex-row"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
            >
                <motion.p variants={staggerItem} className={"w-full text-center text-secondary lg:w-1/3 lg:shrink-0 lg:text-left"}>
                    {content.description}
                </motion.p>
                <motion.div variants={staggerContainer} className={shouldLoopDesktop ? "hidden" : "hidden w-full min-w-0 grid-cols-4 gap-16 text-center text-secondary md:grid lg:flex-1"}>
                    {logos.map((item, index) => (
                        <motion.div variants={staggerItem} key={`${(item as Media).id ?? (item as Media).url ?? index}-${index}`}>
                            <LogoItem logo={item} className="w-full" />
                        </motion.div>
                    ))}
                </motion.div>
                <motion.div variants={staggerItem} className={shouldLoopDesktop ? "w-full min-w-0 lg:flex-1" : "w-full md:hidden"}>
                    <LogoMarquee logos={logos} />
                </motion.div>
            </motion.div>
        </Section>
    )
}
