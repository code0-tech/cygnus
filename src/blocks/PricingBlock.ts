import { sectionFields } from "@/fields/sectionFields"
import { iconField } from "@mvriu5/payload-icon-picker"
import { pricingPackageFields } from "@/fields/pricingPackageFields"
import type { Block } from "payload"

export const PricingBlock: Block = {
    slug: "pricing",
    labels: {
        singular: "Pricing",
        plural: "Pricing Blocks",
    },
    fields: [
        sectionFields(),
        {
            name: "popularPill",
            label: "Popular Pill",
            type: "group",
            fields: [
                iconField({
                    name: "icon",
                    label: "Icon",
                    required: false,
                    defaultValue: "tabler:IconSparkles",
                    placeholder: "Search icons",
                    noResultsLabel: "No icons found",
                    admin: {
                        position: "sidebar",
                    },
                }),
                {
                    name: "text",
                    label: "Text",
                    type: "text",
                    required: false,
                    localized: true,
                    defaultValue: "Popular",
                },
                {
                    name: "color",
                    label: "Color",
                    type: "select",
                    required: false,
                    defaultValue: "brand",
                    options: [
                        { label: "Brand", value: "brand" },
                        { label: "Pink", value: "pink" },
                        { label: "Yellow", value: "yellow" },
                        { label: "Aqua", value: "aqua" },
                        { label: "Blue", value: "blue" },
                        { label: "Lime", value: "lime" },
                        { label: "Magenta", value: "magenta" },
                    ],
                },
            ],
        },
        {
            name: "whatsIncludedText",
            label: "What's Included Text",
            type: "text",
            required: false,
            localized: true,
            defaultValue: "What's included",
        },
        pricingPackageFields("pro", "Pro"),
        pricingPackageFields("max", "Max"),
        pricingPackageFields("custom", "Custom"),
    ],
}
