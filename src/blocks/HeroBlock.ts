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
        {
            name: "imageBackground",
            label: "Image Background",
            type: "text",
            required: false,
            admin: {
                description: "CSS color shown behind the hero image, for example #13102d or rgb(19, 16, 45).",
            },
        },
        {
            name: "grainientColors",
            label: "Grainient Colors",
            type: "group",
            fields: [
                {
                    name: "color1",
                    type: "text",
                    required: false,
                },
                {
                    name: "color2",
                    type: "text",
                    required: false,
                },
                {
                    name: "color3",
                    type: "text",
                    required: false,
                },
                {
                    name: "backgroundColor",
                    type: "text",
                    required: false,
                },
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
