"use client"

import { DotBackground } from "@/components/ui/DotBackground"
import { Section } from "@/components/ui/Section"
import type { InstallLayoutBlock } from "@/lib/cms"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { AnimatePresence, m as motion, type Variants } from "motion/react"
import { useEffect, useState } from "react"
import { Card } from "../ui/Card"

type InstallSectionProps = {
    content?: InstallLayoutBlock | null
}

export function InstallSection({ content }: InstallSectionProps) {
    const [copied, setCopied] = useState(false)

    if (!content?.heading || !content.subheading || !content.code) return null

    const staggerContainer: Variants = {
        hidden: {},
        show: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.05,
            },
        },
    }

    const staggerItem: Variants = {
        hidden: { opacity: 0, y: 16 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        },
    }

    useEffect(() => {
        if (!copied) return
        const timeout = window.setTimeout(() => setCopied(false), 3000)
        return () => window.clearTimeout(timeout)
    }, [copied])

    async function handleCopy() {
        await navigator.clipboard.writeText(content?.code ?? "")
        setCopied(true)
    }

    return (
        <Section showFunnel={false}>
            <Card size="lg" variant="light" className="w-full p-0 " variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                <div className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl px-6 py-16 sm:px-10">
                    <DotBackground spacing={20} dotColor="rgba(255,255,255,0.05)" />

                    <motion.div variants={staggerItem} className="relative z-10 flex max-w-3xl flex-col items-center gap-4 text-center">
                        <h2 className="text-3xl font-semibold text-white lg:text-4xl">{content.heading}</h2>
                        <p className="text-base font-medium text-white/75 lg:text-xl">{content.subheading}</p>
                    </motion.div>

                    <motion.div variants={staggerItem} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-primary">
                        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 pr-2">
                            <span className="text-xs font-medium text-white/50">{content.label || "Install"}</span>
                            <button
                                type="button"
                                onClick={() => void handleCopy()}
                                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.span
                                        key={copied ? "check" : "copy"}
                                        initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
                                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                        className="inline-flex items-center justify-center"
                                    >
                                        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        </div>
                        <pre className="overflow-x-auto px-4 py-3 text-sm text-white/90 lg:text-[15px]">
                            <code>{content.code}</code>
                        </pre>
                    </motion.div>
                </div>
            </Card>
        </Section>
    )
}
