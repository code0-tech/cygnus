import type { Block } from "payload"

export const ListFeatureSection: Block = {
    slug: "listFeature",
    labels: {
        singular: "List Feature",
        plural: "List Features",
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
            name: "features",
            label: "Features",
            type: "array",
            required: false,
            fields: [
                {
                    name: "icon",
                    label: "Icon",
                    type: "text",
                    required: false,
                },
                {
                    name: "title",
                    label: "Title",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                    required: false,
                    localized: true,
                },
            ],
        },
    ],
}
