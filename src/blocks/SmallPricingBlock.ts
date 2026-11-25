import { gradientFields } from "@/fields/gradientFields"
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
        {
            name: "pricingCustomerType",
            label: "Price Audience",
            type: "select",
            required: true,
            defaultValue: "b2c",
            options: [
                { label: "Personal (B2C)", value: "b2c" },
                { label: "Business (B2B)", value: "b2b" },
            ],
        },
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
        ...gradientFields(),
        pricingPackageFields("pro", "Pro"),
        pricingPackageFields("max", "Max"),
        pricingPackageFields("custom", "Custom"),
    ],
}
