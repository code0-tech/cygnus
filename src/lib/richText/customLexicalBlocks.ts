import type { Block } from "payload"
import { validatePlaygroundUrl } from "@/fields/playgroundMediaFields"

export const PlaygroundLexicalBlock: Block = {
    slug: "playground",
    labels: {
        singular: "Playground",
        plural: "Playgrounds",
    },
    fields: [
        {
            name: "source",
            label: "Playground URL",
            type: "text",
            required: true,
            validate: (value: string | null | undefined) => validatePlaygroundUrl(value),
            admin: {
                description: "HTTP(S) URL or a site-relative path to the playground to embed.",
            },
        },
    ],
}

export const TriggerLexicalBlock: Block = {
    slug: "trigger",
    labels: {
        singular: "Trigger",
        plural: "Trigger Blocks",
    },
    fields: [
        {
            name: "source",
            type: "textarea",
            required: true,
            admin: {
                description: "One trigger item per line.",
            },
        },
    ],
}

export const GraphLexicalBlock: Block = {
    slug: "graph",
    labels: {
        singular: "Graph",
        plural: "Graph Blocks",
    },
    fields: [
        {
            name: "source",
            type: "textarea",
            required: true,
            admin: {
                description: "One edge per line, e.g. `API -> Queue`.",
            },
        },
    ],
}
