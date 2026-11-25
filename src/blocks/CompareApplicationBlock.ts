import { buttonField } from "@/fields/buttonField"
import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

const defaultApps = [
    {
        name: "CodeZero", logoFallback: "C0", comparisonUrl: "/compare/codezero", comparisonLinkLabel: "Automate a process", highlighted: true,
        features: [
            { category: "Build", title: "Visual flow builder", status: "included" },
            { category: "Build", title: "AI agents with MCP & multi-agent", status: "included" },
            { category: "Build", title: "Plugin support", status: "included" },
            { category: "Runtime", title: "Rust runtime", status: "included" },
            { category: "Runtime", title: "Flow compiler with optimization passes", status: "included" },
            { category: "Debugging", title: "Deterministic replay / time-travel", status: "included" },
            { category: "Deployment", title: "Eject as standalone binary / WASM", status: "included" },
            { category: "Deployment", title: "Self-hosting", status: "included" },
            { category: "Deployment", title: "Open source code", status: "included" },
        ],
    },
    {
        name: "n8n", logoFallback: "Logo", comparisonUrl: "/compare/n8n", comparisonLinkLabel: "vs. n8n", highlighted: false,
        features: [
            { category: "Build", title: "Visual flow builder", status: "included" },
            { category: "Build", title: "AI agents with MCP & multi-agent", status: "partial" },
            { category: "Build", title: "Plugin support", status: "included" },
            { category: "Runtime", title: "Rust runtime", status: "unavailable" },
            { category: "Runtime", title: "Flow compiler with optimization passes", status: "unavailable" },
            { category: "Debugging", title: "Deterministic replay / time-travel", status: "partial" },
            { category: "Deployment", title: "Eject as standalone binary / WASM", status: "unavailable" },
            { category: "Deployment", title: "Self-hosting", status: "included" },
            { category: "Deployment", title: "Open source code", status: "partial" },
        ],
    },
    {
        name: "Kestra", logoFallback: "Logo", comparisonUrl: "/compare/kestra", comparisonLinkLabel: "vs. Kestra", highlighted: false,
        features: [
            { category: "Build", title: "Visual flow builder", status: "included" },
            { category: "Build", title: "AI agents with MCP & multi-agent", status: "partial" },
            { category: "Build", title: "Plugin support", status: "partial" },
            { category: "Runtime", title: "Rust runtime", status: "unavailable" },
            { category: "Runtime", title: "Flow compiler with optimization passes", status: "unavailable" },
            { category: "Debugging", title: "Deterministic replay / time-travel", status: "unavailable" },
            { category: "Deployment", title: "Eject as standalone binary / WASM", status: "unavailable" },
            { category: "Deployment", title: "Self-hosting", status: "unavailable" },
            { category: "Deployment", title: "Open source code", status: "unavailable" },
        ],
    },
    {
        name: "Zapier", logoFallback: "Logo", comparisonUrl: "/compare/zapier", comparisonLinkLabel: "vs. Zapier", highlighted: false,
        features: [
            { category: "Build", title: "Visual flow builder", status: "included" },
            { category: "Build", title: "AI agents with MCP & multi-agent", status: "partial" },
            { category: "Build", title: "Plugin support", status: "partial" },
            { category: "Runtime", title: "Rust runtime", status: "unavailable" },
            { category: "Runtime", title: "Flow compiler with optimization passes", status: "unavailable" },
            { category: "Debugging", title: "Deterministic replay / time-travel", status: "partial" },
            { category: "Deployment", title: "Eject as standalone binary / WASM", status: "unavailable" },
            { category: "Deployment", title: "Self-hosting", status: "unavailable" },
            { category: "Deployment", title: "Open source code", status: "unavailable" },
        ],
    },
]

export const CompareApplicationBlock: Block = {
    slug: "compareApplication",
    labels: {
        singular: "Compare Application",
        plural: "Compare Applications",
    },
    fields: [
        sectionFields({ headingDefaultValue: "**CodeZero in comparison with**\\nother automation tools" }),
        {
            name: "featureColumnLabel",
            label: "Feature Column Label",
            type: "text",
            localized: true,
            defaultValue: "Feature",
        },
        {
            name: "partialLabel",
            label: "Partial Status Label",
            type: "text",
            localized: true,
            defaultValue: "Partial",
        },
        {
            name: "detailedComparisonsLabel",
            label: "Detailed Comparisons Label",
            type: "text",
            localized: true,
            defaultValue: "Detailed comparisons",
        },
        {
            name: "footnote",
            label: "Footnote",
            type: "text",
            localized: true,
            defaultValue: "As of [DATE], based on publicly available information.",
        },
        {
            name: "apps",
            label: "Applications",
            type: "array",
            required: true,
            minRows: 2,
            defaultValue: defaultApps,
            fields: [
                { name: "logo", label: "Logo", type: "upload", relationTo: "media", required: false },
                { name: "logoFallback", label: "Logo Placeholder", type: "text", localized: true, defaultValue: "Logo" },
                { name: "name", label: "Application Name", type: "text", required: true, localized: true },
                { name: "comparisonUrl", label: "Comparison URL", type: "text", required: false },
                { name: "comparisonLinkLabel", label: "Comparison Link Label", type: "text", localized: true, required: false },
                { name: "highlighted", label: "Highlight Column", type: "checkbox", defaultValue: false },
                {
                    name: "features",
                    label: "Features",
                    type: "array",
                    required: false,
                    fields: [
                        { name: "category", label: "Category", type: "text", required: true, localized: true },
                        { name: "title", label: "Feature", type: "text", required: true, localized: true },
                        {
                            name: "status",
                            label: "Status",
                            type: "select",
                            required: true,
                            defaultValue: "included",
                            options: [
                                { label: "Included", value: "included" },
                                { label: "Partial", value: "partial" },
                                { label: "Not included", value: "unavailable" },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            name: "showIcon",
            label: "Show Icons",
            type: "checkbox",
            defaultValue: true,
        },
        { ...buttonField(1), defaultValue: [{ label: "Automate a process", url: "/actions", variant: "filled" }] },
    ],
}
