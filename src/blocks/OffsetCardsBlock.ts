import { linkField } from "@/fields/linkField"
import { playgroundMediaFields } from "@/fields/playgroundMediaFields"
import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const OffsetCardsBlock: Block = {
    slug: "offsetCards",
    labels: {
        singular: "Offset Cards",
        plural: "Offset Cards Blocks",
    },
    fields: [
        sectionFields({
            additionalFieldsAfterLayout: [
                {
                    name: "cardPlacement",
                    label: "Card Placement",
                    type: "select",
                    required: true,
                    defaultValue: "alternate",
                    options: [
                        { label: "Alternate", value: "alternate" },
                        { label: "Right", value: "right" },
                        { label: "Left", value: "left" },
                    ],
                },
            ],
        }),
        {
            name: "cards",
            label: "Cards",
            type: "array",
            required: true,
            fields: [
                {
                    name: "label",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "title",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "description",
                    type: "textarea",
                    required: true,
                    localized: true,
                },
                ...playgroundMediaFields(),
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
                    name: "bulletPoints",
                    label: "Bullet Points",
                    type: "text",
                    required: false,
                    hasMany: true,
                    localized: true,
                },
                linkField(),
            ],
        },
    ],
}
