import type { Block } from "payload"

export const FaqBlock: Block = {
    slug: "faq",
    labels: {
        singular: "FAQ",
        plural: "FAQ Blocks",
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
            label: "FAQ Items",
            type: "array",
            required: true,
            fields: [
                {
                    name: "question",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "answer",
                    type: "textarea",
                    required: true,
                    localized: true,
                },
            ],
        },
    ],
}
