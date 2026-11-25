import { sectionFields } from "@/fields/sectionFields"
import { colorField } from "@mvriu5/payload-color-picker"
import { pricingPackageFields } from "@/fields/pricingPackageFields"
import type { Block } from "payload"

export const PricingBlock: Block = {
    slug: "pricing",
    labels: {
        singular: "Pricing",
        plural: "Pricing Blocks",
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
            name: "comparisonIntro",
            label: "Comparison Intro",
            type: "text",
            localized: true,
            defaultValue: "Quotas reset monthly from your order date.",
        },
        {
            name: "comparisonCategories",
            label: "Comparison Categories",
            type: "array",
            defaultValue: [
                { title: "Usage", rows: [
                    { label: "Workflow executions per month", pro: "2,000", max: "25,000", custom: "Configurable" },
                    { label: "AI tokens per month", pro: "500k", max: "4M", custom: "Configurable" },
                ] },
                { title: "Build", rows: [
                    { label: "Visual flow builder", pro: "\u2713", max: "\u2713", custom: "\u2713" },
                    { label: "AI agents with MCP & multi-agent", pro: "\u2713", max: "\u2713", custom: "\u2713" },
                    { label: "Files in flows", pro: "\u2713", max: "\u2713", custom: "\u2713" },
                ] },
                { title: "Run & debug", rows: [
                    { label: "Deterministic replay", pro: "\u2713", max: "\u2713", custom: "\u2713" },
                    { label: "Eject as binary / WASM", pro: "\u2713", max: "\u2713", custom: "\u2713" },
                ] },
                { title: "Support", rows: [
                    { label: "[SUPPORT LEVEL]", pro: "\u2014", max: "\u2014", custom: "\u2014" },
                ] },
            ],
            fields: [
                { name: "title", label: "Category", type: "text", required: true, localized: true },
                {
                    name: "rows",
                    label: "Rows",
                    type: "array",
                    fields: [
                        { name: "label", label: "Row label", type: "text", required: true, localized: true },
                        { name: "pro", label: "Pro value", type: "text", localized: true },
                        { name: "max", label: "Max value", type: "text", localized: true },
                        { name: "custom", label: "Custom value", type: "text", localized: true },
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
        colorField({
            name: "titleColor",
            label: "Card Title Color",
            required: false,
            admin: {
                description: "Optional color applied to all card titles. Leave empty to use white.",
            },
        }),
        {
            name: "highlightedCardColor",
            label: "Highlighted Card Color",
            type: "select",
            required: false,
            admin: {
                description: "Optional accent color for the highlighted card background. Leave empty to use the white gradient.",
            },
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
        pricingPackageFields("pro", "Pro"),
        pricingPackageFields("max", "Max"),
        pricingPackageFields("custom", "Custom"),
    ],
}
