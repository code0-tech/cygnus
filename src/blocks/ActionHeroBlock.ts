import { buttonField } from "@/fields/buttonField"
import { colorField } from "@mvriu5/payload-color-picker"
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
                colorField({
                    name: "color1",
                    label: "Fallback Color 1",
                    required: false,
                    defaultValue: "#72f896",
                    admin: {
                        description: "Used when the action module does not define brandColor1.",
                    },
                }),
                colorField({
                    name: "color2",
                    label: "Fallback Color 2",
                    required: false,
                    defaultValue: "#7472f8",
                    admin: {
                        description: "Used when the action module does not define brandColor2.",
                    },
                }),
                colorField({
                    name: "color3",
                    required: false,
                    defaultValue: "#13102d",
                }),
                colorField({
                    name: "backgroundColor",
                    required: false,
                    defaultValue: "#13102d",
                }),
            ],
        },
        {
            name: "texts",
            label: "Texts",
            type: "array",
            required: false,
            fields: [{ name: "text", type: "text", required: true, localized: true }],
        },
        buttonField(3),
    ],
}
