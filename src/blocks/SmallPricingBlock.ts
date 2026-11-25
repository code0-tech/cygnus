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
        sectionFields({ headingDefaultValue: "**Simple pricing**\\nfor every stage of your business." }),
        {
            name: "copy",
            label: "Pricing Copy",
            type: "group",
            fields: [
                { name: "popularLabel", label: "Popular Label", type: "text", localized: true, defaultValue: "Popular" },
                { name: "customPricePrefix", label: "Custom Price Prefix", type: "text", localized: true, defaultValue: "from" },
                { name: "customPriceFrom", label: "Custom Starting Price", type: "number", min: 0, defaultValue: 49.9 },
                { name: "discountPrefix", label: "Discount Prefix", type: "text", localized: true, defaultValue: "-" },
                { name: "workflowUnitLabel", label: "Workflow Usage Unit", type: "text", localized: true, defaultValue: "executions" },
                { name: "aiTokensUnitLabel", label: "AI Tokens Usage Unit", type: "text", localized: true, defaultValue: "AI tokens" },
                { name: "usageSeparator", label: "Usage Separator", type: "text", localized: true, defaultValue: "•" },
                { name: "customUsageText", label: "Custom Usage Text", type: "text", localized: true, defaultValue: "Usage you configure yourself" },
                { name: "notSureTitle", label: "Details Card Title", type: "text", localized: true, defaultValue: "Not sure yet?" },
                { name: "notSureDescription", label: "Details Card Description", type: "textarea", localized: true, defaultValue: "Compare all plans and features side by side." },
                { name: "detailsButtonLabel", label: "Details Button Label", type: "text", localized: true, defaultValue: "See all plan details" },
                { name: "detailsUrl", label: "Details Button URL", type: "text", defaultValue: "/pricing" },
                { name: "periodSavingsText", label: "Period Savings Text", type: "text", localized: true, defaultValue: "Save {quarterly} quarterly or {yearly} yearly." },
            ],
        },
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
        pricingPackageFields("pro", "Pro", { includeFeatures: false }),
        pricingPackageFields("max", "Max", { includeFeatures: false }),
        pricingPackageFields("custom", "Custom", { includeFeatures: false }),
    ],
}
