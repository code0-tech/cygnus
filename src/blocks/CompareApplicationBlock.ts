import { buttonField } from "@/fields/buttonField"
import { gradientFields } from "@/fields/gradientFields"
import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const CompareApplicationBlock: Block = {
    slug: "compareApplication",
    labels: {
        singular: "Compare Application",
        plural: "Compare Applications",
    },
    fields: [
        sectionFields(),
        {
            name: "apps",
            label: "Applications",
            type: "array",
            required: true,
            minRows: 2,
            fields: [
                {
                    name: "logo",
                    type: "upload",
                    relationTo: "media",
                    required: true,
                },
                {
                    name: "name",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "features",
                    label: "Features",
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
                            name: "exists",
                            label: "Exists",
                            type: "checkbox",
                            defaultValue: true,
                        },
                    ],
                },
            ],
        },
        {
            name: "showIcon",
            label: "Show Icons",
            type: "checkbox",
            defaultValue: true,
        },
        ...gradientFields(),
        buttonField(1),
    ],
}
