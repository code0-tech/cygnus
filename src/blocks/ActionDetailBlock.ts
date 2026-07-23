import type { Block } from "payload"

export const ActionDetailBlock: Block = {
    slug: "actionDetails",
    labels: { singular: "Action Details", plural: "Action Detail Blocks" },
    fields: [
        {
            type: "collapsible",
            label: "Section",
            fields: [
                { name: "sectionHeading", label: "Section Heading", type: "text", required: false, localized: true },
                { name: "sectionLayout", label: "Section Layout", type: "select", required: true, defaultValue: "left", options: [{ label: "Center", value: "center" }, { label: "Left", value: "left" }] },
                { name: "sectionDescription", label: "Section Description", type: "textarea", required: false, localized: true },
                { name: "sectionLinkButton", label: "Section Link Button", type: "group", fields: [{ name: "label", type: "text", required: false, localized: true }, { name: "url", type: "text", required: false }] },
            ],
        },
        { name: "flowTypesLabel", type: "text", required: true, localized: true, defaultValue: "FlowTypes" },
        { name: "functionDefinitionsLabel", type: "text", required: true, localized: true, defaultValue: "FunctionDefinitions" },
    ],
}
