import { sectionFields } from "@/fields/sectionFields"
import type { Block } from "payload"

export const BlogPreviewBlock: Block = {
    slug: "blogPreview",
    labels: {
        singular: "Blog Preview",
        plural: "Blog Previews",
    },
    fields: [
        sectionFields({
            includeLinkButton: false,
            layoutDefaultValue: "imageCenter",
            layoutOptions: [
                { label: "Image center", value: "imageCenter" },
                { label: "Image left", value: "imageLeft" },
                { label: "Image right", value: "imageRight" },
            ],
        }),
        {
            name: "blog",
            label: "Blog",
            type: "relationship",
            relationTo: "blog",
            required: true,
        },
        {
            name: "showBorder",
            label: "Show Border",
            type: "checkbox",
            defaultValue: false,
        },
    ],
}
