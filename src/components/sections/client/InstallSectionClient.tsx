"use client"

import { Section } from "@/components/ui/Section"
import { cn } from "@/lib/utils"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { AnimatePresence, m as motion, type Variants } from "motion/react"
import { useEffect, useState } from "react"

interface InstallSectionClientProps {
    heading: string
    subheading: string
    label: string
    code: string
    highlightedCode: string
}

const FADE_IN: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 } },
}

const CODE_CLASSES =
    "[&_.shiki]:bg-transparent! [&_.shiki]:py-4 [&_.shiki]:pr-4 [&_.shiki]:font-mono [&_.shiki]:text-sm [&_.shiki]:leading-6 [&_.shiki]:whitespace-pre-wrap [&_.shiki]:[overflow-wrap:anywhere] [&_.shiki_code]:flex [&_.shiki_code]:flex-col [&_.line]:block [&_.line]:pl-11 [&_.line]:-indent-11 [&_.line-number]:mr-3 [&_.line-number]:inline-block [&_.line-number]:w-8 [&_.line-number]:indent-0 [&_.line-number]:select-none [&_.line-number]:pr-2 [&_.line-number]:text-right [&_.line-number]:text-[0px]! [&_.line-number]:before:text-sm [&_.line-number]:before:text-brand/70 [&_.line-number]:before:content-['$']"

export function InstallSectionClient({ heading, subheading, label, code, highlightedCode }: InstallSectionClientProps) {
    return (
        <Section heading={heading} description={subheading} funnelType="center">
            <motion.div variants={FADE_IN} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="relative mx-auto w-full max-w-3xl">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-[10%] -top-10 h-40 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-brand)_14%,transparent),transparent_70%)] blur-2xl"
                />
                <div className="relative overflow-hidden rounded-3xl bg-light shadow-[inset_0_1px_1px_#bfbfbf1a]">
                    <div className="flex items-center gap-3 py-2.5 pr-2.5 pl-5">
                        <div className="flex gap-1.5" aria-hidden>
                            <span className="size-2.5 rounded-full bg-white/10" />
                            <span className="size-2.5 rounded-full bg-white/10" />
                            <span className="size-2.5 rounded-full bg-white/10" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-center text-xs font-medium text-tertiary">{label}</span>
                        <CopyButton text={code} />
                    </div>
                    <div className="mx-2 mb-2 rounded-2xl bg-primary/70">
                        <div className={CODE_CLASSES} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                    </div>
                </div>
            </motion.div>
        </Section>
    )
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!copied) return
        const timeout = window.setTimeout(() => setCopied(false), 3000)
        return () => window.clearTimeout(timeout)
    }, [copied])

    return (
        <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(text).then(() => setCopied(true))}
            aria-label={copied ? "Copied to clipboard" : "Copy code"}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-secondary shadow-[inset_0_1px_1px_#bfbfbf1a] transition-colors hover:text-white"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={copied ? "check" : "copy"}
                    initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.7, rotate: 8 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className={cn("inline-flex items-center justify-center", copied && "text-brand")}
                >
                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                </motion.span>
            </AnimatePresence>
        </button>
    )
}
