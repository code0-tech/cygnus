import { pricingPackageFields } from "@/fields/pricingPackageFields"
import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const SmallPricingBlock: Block = {
    slug: "smallPricing",
    labels: {
        singular: "Small Pricing",
        plural: "Small Pricing Blocks",
    },
    fields: [
        sectionFields(),
        {
            name: "pricingPeriod",
            label: "Pricing Period",
            type: "select",
            required: true,
            defaultValue: "monthly",
            options: [
                { label: "Monthly", value: "monthly" },
                { label: "Quarterly", value: "quarterly" },
                { label: "Yearly", value: "yearly" },
            ],
        },
        {
            name: "gradient",
            label: "Gradient",
            type: "select",
            required: false,
            defaultValue: "blue",
            options: [
                { label: "Blue", value: "blue" },
                { label: "Yellow", value: "yellow" },
                { label: "Pink", value: "pink" },
                { label: "Aqua", value: "aqua" },
                { label: "Brand", value: "brand" },
                { label: "Lime", value: "lime" },
                { label: "Magenta", value: "magenta" },
                { label: "Neutral", value: "neutral" },
            ],
        },
        {
            name: "gradientDirection",
            label: "Gradient Direction",
            type: "select",
            required: false,
            defaultValue: "topLeft",
            options: [
                { label: "Top left", value: "topLeft" },
                { label: "Top right", value: "topRight" },
                { label: "Bottom left", value: "bottomLeft" },
                { label: "Bottom right", value: "bottomRight" },
            ],
        },
        pricingPackageFields("pro", "Pro"),
        pricingPackageFields("max", "Max"),
        pricingPackageFields("custom", "Custom"),
    ],
}
