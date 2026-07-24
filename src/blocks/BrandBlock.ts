import type { Block } from "payload"

export const BrandBlock: Block = {
    slug: "brand",
    labels: {
        singular: "Brand",
        plural: "Brand Blocks",
    },
    fields: [
        {
            name: "description",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "logos",
            label: "Logos",
            type: "array",
            required: false,
            fields: [
                {
                    name: "logo",
                    type: "upload",
                    relationTo: "media",
                    required: true,
                },
            ],
        },
    ],
}
