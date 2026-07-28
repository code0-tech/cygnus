import { linkField } from "@/fields/linkField"
import type { Block } from "payload"

export const CtaBlock: Block = {
    slug: "cta",
    labels: {
        singular: "CTA",
        plural: "CTA Blocks",
    },
    fields: [
        {
            name: "heading",
            type: "text",
            required: true,
            localized: true,
        },
        {
            name: "subheading",
            type: "text",
            required: true,
            localized: true,
        },
        linkField({ name: "ctaLink", label: "CTA Link", required: true }),
    ],
}
