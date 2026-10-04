import { buttonField } from "@/fields/buttonField"
import { playgroundMediaFields } from "@/fields/playgroundMediaFields"
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
        buttonField(3),
        ...playgroundMediaFields(),
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
