import type { Block } from "payload"

export const OffsetCardsBlock: Block = {
    slug: "offsetCards",
    labels: {
        singular: "Offset Cards",
        plural: "Offset Cards Blocks",
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
                        {
                            label: "Center",
                            value: "center",
                        },
                        {
                            label: "Left",
                            value: "left",
                        },
                    ],
                },
                {
                    name: "cardPlacement",
                    label: "Card Placement",
                    type: "select",
                    required: true,
                    defaultValue: "alternate",
                    options: [
                        {
                            label: "Alternate",
                            value: "alternate",
                        },
                        {
                            label: "Right",
                            value: "right",
                        },
                        {
                            label: "Left",
                            value: "left",
                        },
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
                    name: "bulletPoints",
                    label: "Bullet Points",
                    type: "text",
                    required: false,
                    hasMany: true,
                    localized: true,
                },
                {
                    name: "link",
                    label: "Link",
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
    ],
}
