import type { Block } from "payload"

export const ActionListBlock: Block = {
    slug: "actionList",
    labels: { singular: "Action List", plural: "Action List Blocks" },
    fields: [
        {
            type: "collapsible",
            label: "Section",
            fields: [
                { name: "sectionHeading", label: "Section Heading", type: "text", required: false, localized: true, defaultValue: "Actions" },
                {
                    name: "sectionLayout",
                    label: "Section Layout",
                    type: "select",
                    required: true,
                    defaultValue: "left",
                    options: [
                        { label: "Center", value: "center" },
                        { label: "Left", value: "left" },
                    ],
                },
                { name: "sectionDescription", label: "Section Description", type: "textarea", required: false, localized: true, defaultValue: "Browse available actions and integrations." },
                {
                    name: "sectionLinkButton",
                    label: "Section Link Button",
                    type: "group",
                    fields: [
                        { name: "label", type: "text", required: false, localized: true },
                        { name: "url", type: "text", required: false },
                    ],
                },
            ],
        },
        { name: "searchPlaceholder", type: "text", required: true, localized: true, defaultValue: "Search actions" },
        { name: "sortNewestLabel", type: "text", required: true, localized: true, defaultValue: "Newest" },
        { name: "sortOldestLabel", type: "text", required: true, localized: true, defaultValue: "Oldest" },
        { name: "noActionsFoundLabel", type: "text", required: true, localized: true, defaultValue: "No actions found for your search." },
        {
            type: "collapsible",
            label: "Category Labels",
            fields: [
                { name: "allCategoriesLabel", type: "text", required: true, localized: true, defaultValue: "All Categories" },
                {
                    name: "categoryLabels",
                    type: "group",
                    fields: [
                        { name: "ai", label: "AI", type: "text", required: true, localized: true, defaultValue: "AI" },
                        { name: "analytics", label: "Analytics", type: "text", required: true, localized: true, defaultValue: "Analytics" },
                        { name: "communication", label: "Communication", type: "text", required: true, localized: true, defaultValue: "Communication" },
                        { name: "cybersecurity", label: "Cybersecurity", type: "text", required: true, localized: true, defaultValue: "Cybersecurity" },
                        { name: "dataStorage", label: "Data & Storage", type: "text", required: true, localized: true, defaultValue: "Data & Storage" },
                        { name: "developerTools", label: "Developer Tools", type: "text", required: true, localized: true, defaultValue: "Developer Tools" },
                        { name: "development", label: "Development", type: "text", required: true, localized: true, defaultValue: "Development" },
                        { name: "financeAccounting", label: "Finance & Accounting", type: "text", required: true, localized: true, defaultValue: "Finance & Accounting" },
                        { name: "hitl", label: "HITL", type: "text", required: true, localized: true, defaultValue: "HITL" },
                        { name: "marketing", label: "Marketing", type: "text", required: true, localized: true, defaultValue: "Marketing" },
                        { name: "miscellaneous", label: "Miscellaneous", type: "text", required: true, localized: true, defaultValue: "Miscellaneous" },
                        { name: "productivity", label: "Productivity", type: "text", required: true, localized: true, defaultValue: "Productivity" },
                        { name: "sales", label: "Sales", type: "text", required: true, localized: true, defaultValue: "Sales" },
                        { name: "utility", label: "Utility", type: "text", required: true, localized: true, defaultValue: "Utility" },
                    ],
                },
            ],
        },
    ],
}
