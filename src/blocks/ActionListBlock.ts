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
        { name: "noActionsFoundLabel", type: "text", required: true, localized: true, defaultValue: "No actions found for your search." },
    ],
}
