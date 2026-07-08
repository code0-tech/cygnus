import type { Block } from "payload"

export const BorderBlock: Block = {
    slug: "border",
    labels: {
        singular: "Border",
        plural: "Border Blocks",
    },
    fields: [
        {
            name: "paddingTop",
            label: "Padding Top",
            type: "number",
            required: false,
            defaultValue: 0,
            min: 0,
            admin: {
                description: "Spacing above the border in pixels.",
            },
        },
        {
            name: "paddingBottom",
            label: "Padding Bottom",
            type: "number",
            required: false,
            defaultValue: 0,
            min: 0,
            admin: {
                description: "Spacing below the border in pixels.",
            },
        },
    ],
}
