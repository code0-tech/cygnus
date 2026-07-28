import { linkField } from "@/fields/linkField"
import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const CardRowBlock: Block = {
    slug: "cardRow",
    labels: {
        singular: "Card Row",
        plural: "Card Rows",
    },
    fields: [
        sectionFields(),
        {
            name: "cards",
            label: "Cards",
            type: "array",
            required: false,
            fields: [
                {
                    name: "title",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "description",
                    type: "textarea",
                    required: false,
                    localized: true,
                },
                linkField(),
                {
                    name: "image",
                    type: "upload",
                    relationTo: "media",
                    required: false,
                },
            ],
        },
    ],
}
