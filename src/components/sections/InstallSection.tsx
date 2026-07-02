import type { InstallLayoutBlock } from "@/lib/cms"
import type { BundledLanguage } from "shiki"
import { codeToHtml } from "shiki"
import { InstallSectionClient } from "./client/InstallSectionClient"

type InstallSectionProps = {
    content?: InstallLayoutBlock | null
}

async function highlightCode(code: string, language: BundledLanguage) {
    return codeToHtml(code, {
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
}

export async function InstallSection({ content }: InstallSectionProps) {
    if (!content?.heading || !content.subheading || !content.code) return null

    const highlightedCode = await highlightCode(content.code, (content.language || "bash") as BundledLanguage)

    return <InstallSectionClient heading={content.heading} subheading={content.subheading} label={content.label || "Terminal"} code={content.code} highlightedCode={highlightedCode} />
}
