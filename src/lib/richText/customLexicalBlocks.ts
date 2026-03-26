import type { Block } from "payload"

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
