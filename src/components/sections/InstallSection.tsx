"use client"

import { DotBackground } from "@/components/ui/DotBackground"
import { Section } from "@/components/ui/Section"
import type { InstallLayoutBlock } from "@/lib/cms"
import { ScrollArea, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@code0-tech/pictor"
import { IconCheck, IconCopy, IconTerminal2 } from "@tabler/icons-react"
import { AnimatePresence, m as motion, type Variants } from "motion/react"
import { useEffect, useState } from "react"
import type { BundledLanguage } from "shiki"
import { Card } from "../ui/Card"

type InstallSectionProps = {
    content?: InstallLayoutBlock | null
}

const STAGGER_CONTAINER: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const STAGGER_ITEM: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export function InstallSection({ content }: InstallSectionProps) {
    const [copied, setCopied] = useState(false)
    const [highlightedCode, setHighlightedCode] = useState<string | null>(null)

    useEffect(() => {
        if (!copied) return
        const timeout = window.setTimeout(() => setCopied(false), 3000)
        return () => window.clearTimeout(timeout)
    }, [copied])

    useEffect(() => {
        if (!content?.code) {
            setHighlightedCode(null)
            return
        }

        let active = true
        const language = (content.language || "bash") as BundledLanguage
        setHighlightedCode(null)

        void import("shiki")
            .then(({ codeToHtml }) =>
                codeToHtml(content.code, {
                    lang: language,
                    theme: "github-dark-default",
                    transformers: [
                        {
                            line(node, line) {
                                node.children.unshift({
                                    type: "element",
                                    tagName: "span",
                                    properties: {
                                        className: ["line-number"],
                                        ariaHidden: "true",
                                    },
                                    children: [{ type: "text", value: String(line) }],
                                })
                            },
                        },
                    ],
                })
            )
            .then((html) => {
                if (active) setHighlightedCode(html)
            })
            .catch(() => {
                if (active) setHighlightedCode(null)
            })

        return () => {
            active = false
        }
    }, [content?.code, content?.language])

    if (!content?.heading || !content.subheading || !content.code) return null

    const codeLines = content.code.split(/\r?\n/)

    async function handleCopy() {
        await navigator.clipboard.writeText(content?.code ?? "")
        setCopied(true)
    }

    return (
        <Section showFunnel={false}>
            <Card size="lg" variant="light" className="w-full p-0 " variants={STAGGER_CONTAINER} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
                <div className="relative flex w-full flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl px-6 py-16 sm:px-10">
                    <DotBackground spacing={20} dotColor="rgba(255,255,255,0.05)" />

                    <motion.div variants={STAGGER_ITEM} className="relative z-10 flex max-w-3xl flex-col items-center gap-4 text-center">
                        <h2 className="text-3xl font-semibold text-white lg:text-4xl">{content.heading}</h2>
                        <p className="text-base font-medium text-secondary lg:text-xl">{content.subheading}</p>
                    </motion.div>

                    <motion.div variants={STAGGER_ITEM} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-primary">
                        <div className="flex items-center justify-between border-b border-white/5 px-4 py-2 pr-2">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-tertiary">
                                    <IconTerminal2 size={14} className="shrink-0" />
                                    <span className="truncate">{content.label || "Terminal"}</span>
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
                                {highlightedCode ? (
                                    <div
                                        className="[&_.shiki]:overflow-visible! [&_.shiki]:bg-transparent! [&_.shiki]:py-4 [&_.shiki]:pr-2 [&_.shiki]:font-mono [&_.shiki]:text-sm [&_.shiki]:leading-3 [&_.shiki_code]:block [&_.shiki_code]:min-w-max [&_.line]:block [&_.line-number]:mr-2 [&_.line-number]:inline-block [&_.line-number]:w-6 [&_.line-number]:select-none [&_.line-number]:border-r [&_.line-number]:border-white/5 [&_.line-number]:pr-2 [&_.line-number]:text-right [&_.line-number]:text-white/25 lg:[&_.shiki]:text-[15px]"
                                        dangerouslySetInnerHTML={{ __html: highlightedCode }}
                                    />
                                ) : (
                                    <pre className="min-w-max py-4 pr-2 font-mono text-sm leading-3 text-white lg:text-[15px]">
                                        <code>
                                            {codeLines.map((line, index) => (
                                                <span key={index} className="block pr-1">
                                                    <span aria-hidden="true" className="inline-block w-6 select-none border-r border-white/5 text-right text-tertiary">
                                                        {index + 1}
                                                    </span>
                                                    {line || " "}
                                                </span>
                                            ))}
                                        </code>
                                    </pre>
                                )}
                            </ScrollAreaViewport>
                            <ScrollAreaScrollbar orientation="horizontal" className="mx-2 mb-1 h-1.5! rounded-full">
                                <ScrollAreaThumb className="bg-white/5! transition-colors! hover:bg-white/10!" />
                            </ScrollAreaScrollbar>
                        </ScrollArea>
                    </motion.div>
                </div>
            </Card>
        </Section>
    )
}
