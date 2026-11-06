"use client"

import { DotBackground } from "@/components/ui/DotBackground"
import { Section } from "@/components/ui/Section"
import { ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@code0-tech/pictor"
import { IconCheck, IconCopy, IconTerminal2 } from "@tabler/icons-react"
import { AnimatePresence, m as motion, type Variants } from "motion/react"
import { useEffect, useState } from "react"
import { Card } from "../../ui/Card"

interface InstallSectionClientProps {
    heading: string
    subheading: string
    label: string
    code: string
    highlightedCode: string
}

const STAGGER_CONTAINER: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

const STAGGER_ITEM: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function InstallSectionClient({ heading, subheading, label, code, highlightedCode }: InstallSectionClientProps) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const timeout = window.setTimeout(() => setCopied(false), 3000)
        return () => window.clearTimeout(timeout)
    }, [copied])

    async function handleCopy() {
        await navigator.clipboard.writeText(code)
        setCopied(true)
    }

    return (
        <Section showFunnel={false}>
            <Card
                size="lg"
                radialGradient="neutral"
                gradientDirection="bottomLeft"
                variant="default"
                className="w-full p-0 "
                variants={STAGGER_CONTAINER}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl px-6 py-16 sm:px-10">
                    <motion.div variants={STAGGER_ITEM} className="relative z-10 flex max-w-3xl flex-col items-center gap-4 text-center">
                        <h2 className="text-3xl font-semibold text-white lg:text-4xl">{heading}</h2>
                        <p className="text-base font-medium text-secondary lg:text-xl">{subheading}</p>
                    </motion.div>

                    <motion.div variants={STAGGER_ITEM} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-light">
                        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 pr-2">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-tertiary">
                                    <IconTerminal2 size={14} className="shrink-0" />
                                    <span className="truncate">{label}</span>
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => void handleCopy()}
                                aria-label={copied ? "Copied to clipboard" : "Copy code"}
                                className="inline-flex size-7 items-center justify-center rounded-lg border border-white/5 bg-wprimary text-xs font-medium text-secondary transition-colors hover:bg-white/10 hover:text-white"
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
                        <ScrollArea type="auto" className="w-full">
                            <ScrollAreaViewport className="w-full">
                                <div
                                    className="[&_.shiki]:overflow-visible! [&_.shiki]:bg-transparent! [&_.shiki]:py-4 [&_.shiki]:pr-2 [&_.shiki]:font-mono [&_.shiki]:text-sm [&_.shiki]:leading-3 [&_.shiki_code]:block [&_.shiki_code]:min-w-max [&_.line]:block [&_.line-number]:mr-2 [&_.line-number]:inline-block [&_.line-number]:w-6 [&_.line-number]:select-none [&_.line-number]:border-r [&_.line-number]:border-white/5 [&_.line-number]:pr-2 [&_.line-number]:text-right [&_.line-number]:text-white/25 lg:[&_.shiki]:text-[15px]"
                                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                                />
                            </ScrollAreaViewport>
                            <ScrollAreaScrollbar orientation="horizontal" className="mx-2 mb-1 h-1.5! rounded-full">
                                <ScrollAreaThumb className="bg-light! transition-colors! hover:bg-light!" />
                            </ScrollAreaScrollbar>
                        </ScrollArea>
                    </motion.div>
                </div>
            </Card>
        </Section>
    )
}
