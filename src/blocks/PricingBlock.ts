import { sectionFields } from "@/fields/sectionFields"
import type { Block, Field } from "payload"

const packageFields = (name: "pro" | "max" | "custom", label: string): Field => ({
    name,
    label,
    type: "group",
    fields: [
        {
            name: "features",
            label: "Features",
            type: "array",
            required: false,
            fields: [
                {
                    name: "text",
                    type: "text",
                    required: true,
                    localized: true,
                },
            ],
        },
        {
            name: "missingFeatures",
            label: "Missing Features",
            type: "array",
            required: false,
            fields: [
                {
                    name: "text",
                    type: "text",
                    required: true,
                    localized: true,
                },
            ],
        },
        {
            name: "button",
            label: "Button",
            type: "group",
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: false,
                    localized: true,
                },
                {
                    name: "url",
                    type: "text",
                    required: false,
                },
                {
                    name: "variant",
                    type: "select",
                    required: false,
                    defaultValue: "normal",
                    options: [
                        { label: "None", value: "none" },
                        { label: "Normal", value: "normal" },
                        { label: "Outlined", value: "outlined" },
                        { label: "Filled", value: "filled" },
                    ],
                },
            ],
        },
    ],
})

export const PricingBlock: Block = {
    slug: "pricing",
    labels: {
        singular: "Pricing",
        plural: "Pricing Blocks",
    },
    fields: [
        sectionFields(),
        packageFields("pro", "Pro"),
        packageFields("max", "Max"),
        packageFields("custom", "Custom"),
    ],
}
