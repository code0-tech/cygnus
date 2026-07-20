import type { Block } from "payload"

export const StatsBlock: Block = {
    slug: "stats",
    labels: {
        singular: "Stats",
        plural: "Stats Blocks",
    },
    fields: [
        {
            type: "collapsible",
            label: "Section",
            fields: [
                {
                    name: "sectionHeading",
                    label: "Section Heading",
                    type: "text",
                    required: false,
                    localized: true,
                },
                {
                    name: "sectionLayout",
                    label: "Section Layout",
                    type: "select",
                    required: true,
                    defaultValue: "center",
                    options: [
                        { label: "Center", value: "center" },
                        { label: "Left", value: "left" },
                    ],
                },
                {
                    name: "sectionDescription",
                    label: "Section Description",
                    type: "textarea",
                    required: false,
                    localized: true,
                },
                {
                    name: "sectionLinkButton",
                    label: "Section Link Button",
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
                    ],
                },
            ],
        },
        {
            name: "items",
            type: "array",
            required: true,
            minRows: 1,
            maxRows: 3,
            labels: {
                singular: "Stat",
                plural: "Stats",
            },
            fields: [
                {
                    name: "number",
                    type: "number",
                    required: true,
                },
                {
                    name: "description",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "enableNumberFlow",
                    label: "Animate number",
                    type: "checkbox",
                    defaultValue: true,
                },
                {
                    name: "showPlus",
                    label: "Show plus",
                    type: "checkbox",
                    defaultValue: false,
                },
            ],
        },
    ],
}
