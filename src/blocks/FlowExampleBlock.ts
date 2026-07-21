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
                        {
                            name: "color",
                            type: "select",
                            required: true,
                            defaultValue: "brand",
                            options: [
                                { label: "Brand", value: "brand" },
                                { label: "Yellow", value: "yellow" },
                                { label: "Aqua", value: "aqua" },
                                { label: "Blue", value: "blue" },
                                { label: "Pink", value: "pink" },
                            ],
                        },
                        {
                            name: "outline",
                            type: "checkbox",
                            defaultValue: true,
                        },
                        {
                            name: "segments",
                            type: "array",
                            required: true,
                            minRows: 1,
                            fields: [
                                {
                                    name: "type",
                                    type: "select",
                                    required: true,
                                    defaultValue: "text",
                                    options: [
                                        { label: "Text", value: "text" },
                                        { label: "Literal", value: "literal" },
                                        { label: "Reference", value: "reference" },
                                        { label: "Node", value: "node" },
                                    ],
                                },
                                {
                                    name: "value",
                                    type: "text",
                                    required: true,
                                    localized: true,
                                },
                            ],
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
