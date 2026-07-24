import type { Block } from "payload"

export const ActionReferencesBlock: Block = {
    slug: "actionReferences",
    labels: { singular: "Action References", plural: "Action Reference Blocks" },
    fields: [
        {
            type: "collapsible",
            label: "Section",
            fields: [
                { name: "sectionHeading", label: "Section Heading", type: "text", required: false, localized: true, defaultValue: "References" },
                {
                    name: "sectionLayout",
                    label: "Section Layout",
                    type: "select",
                    required: true,
                    defaultValue: "left",
                    options: [
                        { label: "Center", value: "center" },
                        { label: "Left", value: "left" },
                    ],
                },
                { name: "sectionDescription", label: "Section Description", type: "textarea", required: false, localized: true },
                {
                    name: "sectionLinkButton",
                    label: "Section Link Button",
                    type: "group",
                    fields: [
                        { name: "label", type: "text", required: false, localized: true },
                        { name: "url", type: "text", required: false },
                    ],
                },
            ],
        },
    ],
}
