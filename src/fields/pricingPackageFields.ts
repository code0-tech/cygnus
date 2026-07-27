import type { Field } from "payload"

export function pricingPackageFields(name: "pro" | "max" | "custom", label: string): Field {
    return {
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
    }
}
