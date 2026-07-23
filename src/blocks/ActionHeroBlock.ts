import type { Block } from "payload"

export const ActionHeroBlock: Block = {
    slug: "actionHero",
    labels: { singular: "Action Hero", plural: "Action Hero Blocks" },
    fields: [
        { name: "badge", type: "text", required: false, localized: true },
        { name: "badge_link", type: "text", required: false },
        {
            name: "heading",
            type: "text",
            required: false,
            localized: true,
            admin: {
                description: "Use {} as a placeholder for the action title.",
            },
        },
        {
            name: "grainientColors",
            label: "Grainient Colors",
            type: "group",
            fields: [
                {
                    name: "color1",
                    label: "Fallback Color 1",
                    type: "text",
                    required: false,
                    defaultValue: "#72f896",
                    admin: {
                        description: "Used when the action module does not define brandColor1.",
                    },
                },
                {
                    name: "color2",
                    label: "Fallback Color 2",
                    type: "text",
                    required: false,
                    defaultValue: "#7472f8",
                    admin: {
                        description: "Used when the action module does not define brandColor2.",
                    },
                },
                {
                    name: "color3",
                    type: "text",
                    required: false,
                    defaultValue: "#13102d",
                },
                {
                    name: "backgroundColor",
                    type: "text",
                    required: false,
                    defaultValue: "#13102d",
                },
            ],
        },
        {
            name: "texts",
            label: "Texts",
            type: "array",
            required: false,
            fields: [{ name: "text", type: "text", required: true, localized: true }],
        },
        {
            name: "buttons",
            label: "Buttons",
            type: "array",
            required: false,
            maxRows: 3,
            fields: [
                { name: "label", type: "text", required: true, localized: true },
                { name: "url", type: "text", required: true },
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
