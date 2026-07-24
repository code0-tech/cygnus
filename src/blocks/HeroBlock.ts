import { colorField } from "@mvriu5/payload-color-picker"
import type { Block } from "payload"

export const HeroBlock: Block = {
    slug: "hero",
    labels: {
        singular: "Hero",
        plural: "Hero Blocks",
    },
    fields: [
        {
            name: "badge",
            type: "text",
            required: false,
            localized: true,
        },
        {
            name: "badge_link",
            type: "text",
            required: false,
        },
        {
            name: "heading",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "centered",
            label: "Centered layout",
            type: "checkbox",
            defaultValue: false,
        },
        {
            name: "image",
            label: "Image",
            type: "upload",
            relationTo: "media",
            required: false,
        },
        colorField({
            name: "imageBackground",
            label: "Image Background",
            required: false,
            admin: {
                description: "CSS color shown behind the hero image, for example #13102d or rgb(19, 16, 45).",
            },
        }),
        {
            name: "grainientColors",
            label: "Grainient Colors",
            type: "group",
            fields: [
                colorField({
                    name: "color1",
                    required: false,
                }),
                colorField({
                    name: "color2",
                    required: false,
                }),
                colorField({
                    name: "color3",
                    required: false,
                }),
                colorField({
                    name: "backgroundColor",
                    required: false,
                }),
            ],
        },
        {
            name: "texts",
            label: "Texts",
            type: "array",
            required: false,
            fields: [
                {
                    name: "text",
                    type: "text",
                    required: true,
                    localized: true,
                },
            ],
        },
        {
            name: "buttons",
            label: "Buttons",
            type: "array",
            required: false,
            maxRows: 3,
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "url",
                    type: "text",
                    required: true,
                },
                {
                    name: "variant",
                    type: "select",
                    required: false,
                    defaultValue: "normal",
                    options: [
                        {
                            label: "None",
                            value: "none",
                        },
                        {
                            label: "Normal",
                            value: "normal",
                        },
                        {
                            label: "Outlined",
                            value: "outlined",
                        },
                        {
                            label: "Filled",
                            value: "filled",
                        },
                    ],
                },
            ],
        },
    ],
}
