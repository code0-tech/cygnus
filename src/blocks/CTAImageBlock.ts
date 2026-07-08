import type { Block } from "payload"

export const CTAImageBlock: Block = {
    slug: "ctaImage",
    labels: {
        singular: "CTA Image",
        plural: "CTA Image Blocks",
    },
    fields: [
        {
            name: "title",
            type: "text",
            required: true,
            localized: true,
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
        {
            name: "image",
            label: "Image",
            type: "upload",
            relationTo: "media",
            required: false,
        },
        {
            name: "showCard",
            label: "Show Card",
            type: "checkbox",
            defaultValue: true,
        },
        {
            name: "showImageBorder",
            label: "Show Image Border",
            type: "checkbox",
            defaultValue: true,
        },
        {
            name: "imageMask",
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
    ],
}
