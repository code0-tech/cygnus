import { sectionFields } from "@/fields/sectionFields"
import { pricingPackageFields } from "@/fields/pricingPackageFields"
import type { Block } from "payload"

export const PricingBlock: Block = {
    slug: "pricing",
    labels: {
        singular: "Pricing",
        plural: "Pricing Blocks",
    },
    fields: [
        sectionFields(),
        pricingPackageFields("pro", "Pro"),
        pricingPackageFields("max", "Max"),
        pricingPackageFields("custom", "Custom"),
    ],
}
