import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const ActionFunctionsBlock: Block = {
    slug: "actionFunctions",
    labels: { singular: "Action Functions", plural: "Action Functions Blocks" },
    fields: [
        sectionFields({ layoutDefaultValue: "left" }),
        { name: "functionDefinitionLabel", type: "text", required: true, localized: true, defaultValue: "FunctionDefinition" },
        { name: "parametersLabel", type: "text", required: true, localized: true, defaultValue: "Parameters" },
        { name: "showAllLabel", type: "text", required: true, localized: true, defaultValue: "Show all" },
        { name: "showLessLabel", type: "text", required: true, localized: true, defaultValue: "Show less" },
    ],
}
