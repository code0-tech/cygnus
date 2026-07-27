import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const ActionReferencesBlock: Block = {
    slug: "actionReferences",
    labels: { singular: "Action References", plural: "Action Reference Blocks" },
    fields: [
        sectionFields({ headingDefaultValue: "References", layoutDefaultValue: "left" }),
    ],
}
