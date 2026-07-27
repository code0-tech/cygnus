import { iconField } from "@mvriu5/payload-icon-picker"
import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const ListFeatureSection: Block = {
    slug: "listFeature",
    labels: {
        singular: "List Feature",
        plural: "List Features",
    },
    fields: [
        sectionFields(),
        {
            name: "features",
            label: "Features",
            type: "array",
            required: false,
            fields: [
                iconField({
                    name: "icon",
                    label: "Icon",
                    required: true,
                    placeholder: "Search icons",
                    noResultsLabel: "No icons found",
                    admin: {
                        position: "sidebar",
                    },
                }),
                {
                    name: "title",
                    label: "Title",
                    type: "text",
                    required: true,
                    localized: true,
                },
                {
                    name: "description",
                    label: "Description",
                    type: "textarea",
                    required: false,
                    localized: true,
                },
            ],
        },
    ],
}
