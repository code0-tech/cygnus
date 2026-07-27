import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const StatsBlock: Block = {
    slug: "stats",
    labels: {
        singular: "Stats",
        plural: "Stats Blocks",
    },
    fields: [
        sectionFields(),
        {
            name: "items",
            type: "array",
            required: true,
            minRows: 1,
            maxRows: 3,
            labels: {
                singular: "Stat",
                plural: "Stats",
            },
            fields: [
                {
                    name: "number",
                    type: "number",
                    required: true,
                },
                {
                    name: "description",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "enableNumberFlow",
                    label: "Animate number",
                    type: "checkbox",
                    defaultValue: true,
                },
                {
                    name: "suffix",
                    label: "Suffix",
                    type: "text",
                    localized: true,
                },
            ],
        },
    ],
}
