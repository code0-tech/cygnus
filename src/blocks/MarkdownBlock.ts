import type { Block } from "payload"

export const MarkdownBlock: Block = {
    slug: "markdown",
    labels: {
        singular: "Markdown",
        plural: "Markdown Blocks",
    },
    fields: [
        {
            name: "content",
            type: "richText",
            required: true,
            localized: true,
        },
    ],
}
