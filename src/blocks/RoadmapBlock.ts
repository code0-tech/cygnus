import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const RoadmapBlock: Block = {
    slug: "roadmap",
    labels: {
        singular: "Roadmap",
        plural: "Roadmap Blocks",
    },
    fields: [
        sectionFields(),
        {
            name: "items",
            label: "Items",
            type: "array",
            required: true,
            fields: [
                {
                    name: "time",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "title",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "description",
                    type: "text",
                    required: true,
                    localized: true,
                },
            ],
        },
    ],
}
