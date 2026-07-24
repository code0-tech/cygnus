import { colorField } from "@mvriu5/payload-color-picker"
import type { Block } from "payload"

export const WideHeroBlock: Block = {
    slug: "widehero",
    labels: {
        singular: "Wide Hero",
        plural: "Wide Hero Blocks",
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
            name: "image",
            label: "Image",
            type: "upload",
            relationTo: "media",
            required: false,
        },
        {
            name: "showImageBorder",
            label: "Show Image Border",
            type: "checkbox",
            defaultValue: true,
        },
        {
            name: "mask",
            label: "Image Mask",
            type: "select",
            hasMany: true,
            required: false,
            options: [
                {
                    label: "Top",
                    value: "top",
                },
                {
                    label: "Right",
                    value: "right",
                },
                {
                    label: "Bottom",
                    value: "bottom",
                },
                {
                    label: "Left",
                    value: "left",
                },
            ],
        },
        {
            name: "shineColors",
            label: "Shine Colors",
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
