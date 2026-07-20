import { iconField } from "@mvriu5/payload-icon-picker"
import type { Block, Field } from "payload"

function flowIconField(): Field {
    return iconField({
        name: "icon",
        label: "Icon",
        required: true,
        placeholder: "Search icons",
        noResultsLabel: "No icons found",
        admin: { position: "sidebar" },
    })
}

export const FlowExampleBlock: Block = {
    slug: "flowExample",
    labels: {
        singular: "Flow Example",
        plural: "Flow Examples",
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
                    localized: true,
                },
                {
                    name: "sectionLayout",
                    label: "Flow Layout",
                    type: "select",
                    required: true,
                    defaultValue: "flowCenter",
                    options: [
                        { label: "Flow center", value: "flowCenter" },
                        { label: "Flow left", value: "flowLeft" },
                        { label: "Flow right", value: "flowRight" },
                    ],
                },
                {
                    name: "sectionDescription",
                    label: "Section Description",
                    type: "textarea",
                    localized: true,
                },
                {
                    name: "sectionLinkButton",
                    label: "Section Link Button",
                    type: "group",
                    fields: [
                        { name: "label", type: "text", localized: true },
                        { name: "url", type: "text" },
                    ],
                },
            ],
        },
        {
            name: "contentHeading",
            label: "Content Heading",
            type: "text",
            localized: true,
        },
        {
            name: "contentDescription",
            label: "Content Description",
            type: "textarea",
            localized: true,
        },
        {
            name: "flow",
            type: "group",
            fields: [
                {
                    name: "trigger",
                    type: "group",
                    fields: [
                        flowIconField(),
                        {
                            name: "name",
                            type: "text",
                            required: true,
                            localized: true,
                        },
                    ],
                },
                {
                    name: "items",
                    label: "Flow items",
                    type: "array",
                    fields: [
                        flowIconField(),
                        {
                            name: "text",
                            type: "text",
                            required: true,
                            localized: true,
                        },
                    ],
                },
            ],
        },
        {
            name: "showBorder",
            label: "Show Border",
            type: "checkbox",
            defaultValue: false,
        },
    ],
}
