"use client"

import { Section } from "@/components/ui/Section"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { AnimatePresence, m as motion, type Variants } from "motion/react"
import { useEffect, useState } from "react"

type EditionInstallSectionContent = {
    heading: string
    subheading: string
    label?: string | null
    code: string
}

type EditionInstallSectionProps = {
    content?: EditionInstallSectionContent | null
}

export function EditionInstallSection({ content }: EditionInstallSectionProps) {
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

        const timeout = window.setTimeout(() => setCopied(false), 1600)
        return () => window.clearTimeout(timeout)
    }, [copied])

    async function handleCopy() {
        await navigator.clipboard.writeText(content?.code ?? "")
        setCopied(true)
    }

    return (
        <Section showBlur={false} showFunnel={false}>
            <motion.div
                className="flex flex-col gap-8"
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                <motion.div variants={staggerItem} className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
                    <h2 className="text-3xl font-semibold text-white lg:text-4xl">{content.heading}</h2>
                    <p className="text-base font-medium text-white/75 lg:text-xl">{content.subheading}</p>
                </motion.div>

                <motion.div variants={staggerItem} className="glass-card-shell relative overflow-hidden rounded-3xl">
                    <div aria-hidden="true" className="glass-card-topline" />
                    <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                        <span className="text-xs font-medium text-white/45">
                            {content.label || "Install"}
                        </span>
                        <button
                            type="button"
                            onClick={() => void handleCopy()}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
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
                                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </motion.span>
                            </AnimatePresence>
                        </button>
                    </div>
                    <pre className="overflow-x-auto p-3 text-sm text-white/88 lg:text-[15px]">
                        <code>{content.code}</code>
                    </pre>
                </motion.div>
            </motion.div>
        </Section>
    )
}
